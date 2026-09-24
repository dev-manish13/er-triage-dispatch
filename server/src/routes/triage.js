import { Router } from 'express';
import pool from '../db.js';
import { computeTriagePriority } from '../utils/ahp.js';

const router = Router();

const DOB_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// JS Date silently rolls over out-of-range days/months (e.g. "2023-02-30" becomes
// March 2nd) instead of producing NaN, so format + NaN checks alone let impossible
// calendar dates through. Round-tripping the parsed parts catches those.
function isValidCalendarDate(dateStr) {
  if (!DOB_PATTERN.test(dateStr)) return false;
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day;
}

// An ISO datetime captured client-side at submit time, or null for "right now".
function resolveArrivalTime(arrivalTime) {
  if (!arrivalTime) return new Date();
  const parsed = new Date(arrivalTime);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

router.post('/assess', async (req, res) => {
  const { patientId, patient, vitals, chiefComplaint, notes, registeredBy, assessedBy } = req.body;

  if (!vitals) {
    return res.status(400).json({ error: 'vitals are required' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    let resolvedPatientId = patientId;

    if (!resolvedPatientId) {
      if (!patient?.fullName || !patient?.dateOfBirth || !patient?.gender) {
        await connection.rollback();
        return res.status(400).json({
          error: 'patient.fullName, patient.dateOfBirth, and patient.gender are required for new patients',
        });
      }

      if (!isValidCalendarDate(patient.dateOfBirth)) {
        await connection.rollback();
        return res.status(400).json({ error: 'patient.dateOfBirth must be a valid YYYY-MM-DD date' });
      }

      const [patientResult] = await connection.query(
        `INSERT INTO patients
           (full_name, date_of_birth, gender, phone, address, emergency_contact_name, emergency_contact_phone, registered_by, arrival_time)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          patient.fullName,
          patient.dateOfBirth,
          patient.gender,
          patient.phone ?? null,
          patient.address ?? null,
          patient.emergencyContactName ?? null,
          patient.emergencyContactPhone ?? null,
          registeredBy ?? null,
          resolveArrivalTime(patient.arrivalTime),
        ],
      );
      resolvedPatientId = patientResult.insertId;
    }

    const [vitalResult] = await connection.query(
      `INSERT INTO vitals
         (patient_id, recorded_by, heart_rate, systolic_bp, diastolic_bp, respiratory_rate, temperature, spo2, consciousness_level, pain_score)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        resolvedPatientId,
        assessedBy ?? null,
        vitals.heartRate ?? null,
        vitals.systolicBP ?? null,
        vitals.diastolicBP ?? null,
        vitals.respiratoryRate ?? null,
        vitals.temperature ?? null,
        vitals.spo2 ?? null,
        vitals.consciousnessLevel ?? 'alert',
        vitals.painScore ?? null,
      ],
    );
    const vitalId = vitalResult.insertId;

    const priority = computeTriagePriority(vitals);

    const [triageResult] = await connection.query(
      `INSERT INTO triage_scores
         (patient_id, vital_id, assessed_by, severity_score, priority_level, chief_complaint, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [resolvedPatientId, vitalId, assessedBy ?? null, priority.score, priority.priorityLevel, chiefComplaint ?? null, notes ?? null],
    );

    await connection.commit();

    res.status(201).json({
      patientId: resolvedPatientId,
      vitalId,
      triageId: triageResult.insertId,
      priorityScore: priority.score,
      priorityLevel: priority.priorityLevel,
      weights: priority.weights,
      risks: priority.risks,
      consistencyRatio: priority.consistencyRatio,
      isConsistent: priority.isConsistent,
    });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

export default router;
