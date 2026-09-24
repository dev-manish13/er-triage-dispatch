import { Router } from 'express';
import pool from '../db.js';
import { hungarianAlgorithm } from '../utils/hungarian.js';
import { getWaitingQueue } from '../utils/queries.js';

const router = Router();

// Cost points added per hour a doctor has been on duty — a tiebreaker that
// favors fresher doctors when rank/shift fit is otherwise equal.
const FATIGUE_WEIGHT = 2;

// A doctor whose shift doesn't cover the patient's arrival time is excluded in
// all but the most resource-starved cases (a huge but finite cost, since the
// O(n^3) solver's arithmetic needs a real number, not Infinity).
const SHIFT_MISMATCH_PENALTY = 500;

// Preference, not a hard rule: patients are steered toward the matching doctor
// rank / bed type for their triage priority when a choice exists.
const TIER_MISMATCH_PENALTY = 40;

const DAY_SHIFT = 'Day: 8AM-8PM';
const NIGHT_SHIFT = 'Night: 8PM-8AM';

// The four AHP priority levels map 1:1 onto the four doctor ranks.
const TIER_BY_PRIORITY = {
  critical: { rank: 'Rank I (Senior Attending)', bedType: 'ICU' },
  urgent: { rank: 'Rank II (Attending)', bedType: 'Emergency' },
  moderate: { rank: 'Rank III (Resident)', bedType: 'General' },
  low: { rank: 'Rank IV (Intern)', bedType: 'General' },
};

function shiftWindowFor(arrivalTime) {
  const hour = new Date(arrivalTime).getHours();
  return hour >= 8 && hour < 20 ? DAY_SHIFT : NIGHT_SHIFT;
}

function tierFor(priorityLevel) {
  return TIER_BY_PRIORITY[priorityLevel] ?? TIER_BY_PRIORITY.low;
}

function buildDoctorCostMatrix(patients, doctors) {
  return patients.map((patient, i) => {
    const patientShift = shiftWindowFor(patient.arrival_time);
    const tier = tierFor(patient.priority_level);
    return doctors.map((doctor) => {
      let cost = i * 10;
      if (doctor.shift !== patientShift) cost += SHIFT_MISMATCH_PENALTY;
      if (doctor.rank !== tier.rank) cost += TIER_MISMATCH_PENALTY;
      cost += doctor.hours_on_duty * FATIGUE_WEIGHT;
      return cost;
    });
  });
}

function buildBedCostMatrix(patients, beds) {
  return patients.map((patient, i) => {
    const tier = tierFor(patient.priority_level);
    return beds.map((bed) => {
      let cost = i * 10;
      if (bed.bed_type !== tier.bedType) cost += TIER_MISMATCH_PENALTY;
      return cost;
    });
  });
}

router.post('/execute', async (req, res) => {
  const { assignedBy } = req.body;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const patients = await getWaitingQueue(connection);
    // Strict availability guard: booked/off-duty doctors and non-available beds are excluded outright.
    const [doctors] = await connection.query(
      `SELECT doctor_id, full_name, \`rank\`, shift, hours_on_duty FROM doctors WHERE status = 'Available'`,
    );
    const [beds] = await connection.query(
      `SELECT bed_id, bed_number, bed_type FROM beds WHERE status = 'Available'`,
    );

    if (patients.length === 0) {
      await connection.commit();
      return res.json({ message: 'No waiting patients to dispatch', assignedCount: 0, assignments: [] });
    }

    const doctorCost = buildDoctorCostMatrix(patients, doctors);
    const bedCost = buildBedCostMatrix(patients, beds);

    const doctorMatches = doctors.length ? hungarianAlgorithm(doctorCost) : [];
    const bedMatches = beds.length ? hungarianAlgorithm(bedCost) : [];

    const doctorByPatientIndex = new Map(doctorMatches.map((m) => [m.row, m.col]));
    const bedByPatientIndex = new Map(bedMatches.map((m) => [m.row, m.col]));

    const results = [];
    for (let i = 0; i < patients.length; i++) {
      const doctorIdx = doctorByPatientIndex.get(i);
      const bedIdx = bedByPatientIndex.get(i);
      if (doctorIdx === undefined && bedIdx === undefined) continue;

      const patient = patients[i];
      const doctor = doctorIdx !== undefined ? doctors[doctorIdx] : null;
      const bed = bedIdx !== undefined ? beds[bedIdx] : null;

      const [assignmentResult] = await connection.query(
        `INSERT INTO assignments (patient_id, doctor_id, bed_id, assigned_by, status)
         VALUES (?, ?, ?, ?, 'active')`,
        [patient.patient_id, doctor?.doctor_id ?? null, bed?.bed_id ?? null, assignedBy ?? null],
      );

      await connection.query(`UPDATE patients SET treatment_status = 'In-Treatment' WHERE patient_id = ?`, [
        patient.patient_id,
      ]);
      if (doctor) {
        await connection.query(`UPDATE doctors SET status = 'Booked' WHERE doctor_id = ?`, [doctor.doctor_id]);
      }
      if (bed) {
        await connection.query(`UPDATE beds SET status = 'Occupied' WHERE bed_id = ?`, [bed.bed_id]);
      }

      results.push({
        assignmentId: assignmentResult.insertId,
        patientId: patient.patient_id,
        patientName: patient.full_name,
        priorityScore: patient.severity_score,
        priorityLevel: patient.priority_level,
        doctor: doctor ? { doctorId: doctor.doctor_id, name: doctor.full_name } : null,
        bed: bed ? { bedId: bed.bed_id, bedNumber: bed.bed_number } : null,
      });
    }

    await connection.commit();

    res.json({
      assignedCount: results.length,
      waitingCount: patients.length,
      assignments: results,
      matchMatrix: { doctorCost, bedCost, doctorMatches, bedMatches },
    });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

export default router;
