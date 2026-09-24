import { Router } from 'express';
import pool from '../db.js';

const router = Router();

const RANKS = ['Rank I (Senior Attending)', 'Rank II (Attending)', 'Rank III (Resident)', 'Rank IV (Intern)'];
const BED_PREFIXES = { General: 'G-', Emergency: 'ER-', ICU: 'ICU-' };

router.post('/doctors', async (req, res) => {
  const { fullName, rank, shift, status } = req.body;
  if (!fullName) return res.status(400).json({ error: 'fullName is required' });

  try {
    const [result] = await pool.query(
      `INSERT INTO doctors (full_name, status, \`rank\`, shift, hours_on_duty)
       VALUES (?, ?, ?, ?, 0)`,
      [fullName, status || 'Available', RANKS.includes(rank) ? rank : RANKS[2], shift || 'Day: 8AM-8PM'],
    );
    res.status(201).json({ doctorId: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/doctors', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT d.doctor_id, d.full_name, d.status, d.\`rank\`, d.shift, d.hours_on_duty,
             a.assignment_id, a.patient_id, p.full_name AS patient_name
      FROM doctors d
      LEFT JOIN assignments a ON a.doctor_id = d.doctor_id AND a.status = 'active'
      LEFT JOIN patients p ON p.patient_id = a.patient_id
      ORDER BY d.full_name
    `);
    res.json({ doctors: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Manual availability toggle for the admin UI. Booked doctors are locked out —
// they can only return to Available via /admin/release-treatment.
router.patch('/doctors/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!['Available', 'Off-Duty'].includes(status)) {
    return res.status(400).json({ error: "status must be 'Available' or 'Off-Duty'" });
  }

  try {
    const [[doctor]] = await pool.query(`SELECT status FROM doctors WHERE doctor_id = ?`, [id]);
    if (!doctor) return res.status(404).json({ error: 'doctor not found' });
    if (doctor.status === 'Booked') {
      return res.status(409).json({ error: 'doctor is currently booked and cannot be toggled' });
    }
    await pool.query(`UPDATE doctors SET status = ? WHERE doctor_id = ?`, [status, id]);
    res.json({ doctorId: Number(id), status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/doctors/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [[doctor]] = await pool.query(`SELECT status FROM doctors WHERE doctor_id = ?`, [id]);
    if (!doctor) return res.status(404).json({ error: 'doctor not found' });
    if (doctor.status === 'Booked') {
      return res.status(409).json({ error: 'doctor is currently booked and cannot be removed' });
    }
    await pool.query(`DELETE FROM doctors WHERE doctor_id = ?`, [id]);
    res.json({ doctorId: Number(id), deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Auto-numbers new beds off the highest existing number for that type's prefix,
// e.g. if G-20 is the highest General bed, adding 2 creates G-21 and G-22.
router.post('/beds', async (req, res) => {
  const { quantity, bedType } = req.body;
  const qty = Number(quantity);
  const prefix = BED_PREFIXES[bedType];
  if (!prefix) return res.status(400).json({ error: 'bedType must be General, Emergency, or ICU' });
  if (!Number.isInteger(qty) || qty < 1) return res.status(400).json({ error: 'quantity must be a positive integer' });

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [existing] = await connection.query(`SELECT bed_number FROM beds WHERE bed_type = ? FOR UPDATE`, [bedType]);

    const prefixPattern = new RegExp(`^${prefix.replace('-', '\\-')}(\\d+)$`);
    let maxNumber = 0;
    for (const row of existing) {
      const match = row.bed_number.match(prefixPattern);
      if (match) maxNumber = Math.max(maxNumber, parseInt(match[1], 10));
    }

    const created = [];
    for (let i = 1; i <= qty; i++) {
      const bedNumber = `${prefix}${maxNumber + i}`;
      const [result] = await connection.query(
        `INSERT INTO beds (bed_number, bed_type, status) VALUES (?, ?, 'Available')`,
        [bedNumber, bedType],
      );
      created.push({ bedId: result.insertId, bedNumber });
    }

    await connection.commit();
    res.status(201).json({ insertedCount: created.length, beds: created });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

router.get('/beds', async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT bed_id, bed_number, bed_type, status FROM beds ORDER BY bed_number`);
    res.json({ beds: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/active-treatments', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT a.assignment_id, a.assigned_at,
             p.patient_id, p.full_name AS patient_name, p.treatment_status,
             d.doctor_id, d.full_name AS doctor_name, d.\`rank\` AS doctor_rank,
             b.bed_id, b.bed_number
      FROM assignments a
      JOIN patients p ON p.patient_id = a.patient_id
      LEFT JOIN doctors d ON d.doctor_id = a.doctor_id
      LEFT JOIN beds b ON b.bed_id = a.bed_id
      WHERE a.status = 'active'
      ORDER BY a.assigned_at
    `);
    res.json({ treatments: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Patients no longer waiting/in-treatment, joined with the doctor/bed from their
// most recently completed assignment (if any).
router.get('/history', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.patient_id, p.full_name, p.arrival_time, p.treatment_status,
             a.assignment_id, a.released_at,
             d.doctor_id, d.full_name AS doctor_name,
             b.bed_id, b.bed_number, b.bed_type
      FROM patients p
      LEFT JOIN (
        SELECT a1.*
        FROM assignments a1
        INNER JOIN (
          SELECT patient_id, MAX(released_at) AS max_released
          FROM assignments
          WHERE status = 'completed'
          GROUP BY patient_id
        ) latest ON a1.patient_id = latest.patient_id AND a1.released_at = latest.max_released
        WHERE a1.status = 'completed'
      ) a ON a.patient_id = p.patient_id
      LEFT JOIN doctors d ON d.doctor_id = a.doctor_id
      LEFT JOIN beds b ON b.bed_id = a.bed_id
      WHERE p.treatment_status IN ('Stable', 'Discharged')
      ORDER BY a.released_at DESC
    `);
    res.json({ history: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Full clinical record for one historical patient: initial vitals, computed AHP
// score, and the doctor/bed from their most recently completed assignment.
// Nothing here is ever deleted on release — only treatment_status/status flags
// change — so this is reconstructed from the same permanent rows every time.
router.get('/history/:patientId', async (req, res) => {
  const { patientId } = req.params;
  try {
    const [[patient]] = await pool.query(
      `SELECT patient_id, full_name, date_of_birth, gender, arrival_time, treatment_status
       FROM patients WHERE patient_id = ?`,
      [patientId],
    );
    if (!patient) return res.status(404).json({ error: 'patient not found' });

    const [[vitals]] = await pool.query(
      `SELECT heart_rate, systolic_bp, diastolic_bp, respiratory_rate, temperature, spo2,
              consciousness_level, pain_score, recorded_at
       FROM vitals WHERE patient_id = ? ORDER BY recorded_at DESC LIMIT 1`,
      [patientId],
    );

    const [[triage]] = await pool.query(
      `SELECT severity_score, priority_level, chief_complaint, notes, assessed_at
       FROM triage_scores WHERE patient_id = ? ORDER BY assessed_at DESC LIMIT 1`,
      [patientId],
    );

    const [[assignment]] = await pool.query(
      `SELECT a.assigned_at, a.released_at,
              d.full_name AS doctor_name, d.\`rank\` AS doctor_rank,
              b.bed_number, b.bed_type
       FROM assignments a
       LEFT JOIN doctors d ON d.doctor_id = a.doctor_id
       LEFT JOIN beds b ON b.bed_id = a.bed_id
       WHERE a.patient_id = ? AND a.status = 'completed'
       ORDER BY a.released_at DESC LIMIT 1`,
      [patientId],
    );

    res.json({ patient, vitals: vitals ?? null, triage: triage ?? null, assignment: assignment ?? null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/release-treatment', async (req, res) => {
  const { assignmentId, outcome } = req.body;
  if (!assignmentId) return res.status(400).json({ error: 'assignmentId is required' });
  const finalStatus = outcome === 'Discharged' ? 'Discharged' : 'Stable';

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [[assignment]] = await connection.query(
      `SELECT * FROM assignments WHERE assignment_id = ? AND status = 'active' FOR UPDATE`,
      [assignmentId],
    );
    if (!assignment) {
      await connection.rollback();
      return res.status(404).json({ error: 'active assignment not found' });
    }

    await connection.query(
      `UPDATE assignments SET status = 'completed', released_at = NOW() WHERE assignment_id = ?`,
      [assignmentId],
    );
    await connection.query(`UPDATE patients SET treatment_status = ? WHERE patient_id = ?`, [
      finalStatus,
      assignment.patient_id,
    ]);
    if (assignment.doctor_id) {
      await connection.query(`UPDATE doctors SET status = 'Available' WHERE doctor_id = ?`, [assignment.doctor_id]);
    }
    if (assignment.bed_id) {
      await connection.query(`UPDATE beds SET status = 'Available' WHERE bed_id = ?`, [assignment.bed_id]);
    }

    await connection.commit();
    res.json({ assignmentId: Number(assignmentId), patientTreatmentStatus: finalStatus });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

export default router;
