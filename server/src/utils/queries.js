// Shared by /api/queue/live and /api/dispatch/execute: waiting patients
// (no active assignment) joined with their most recent triage score.
async function getWaitingQueue(executor) {
  const [rows] = await executor.query(`
    SELECT p.patient_id, p.full_name, p.gender, p.date_of_birth, p.arrival_time, p.treatment_status,
           t.triage_id, t.severity_score, t.priority_level, t.chief_complaint, t.assessed_at
    FROM patients p
    JOIN (
      SELECT ts1.*
      FROM triage_scores ts1
      INNER JOIN (
        SELECT patient_id, MAX(assessed_at) AS max_assessed
        FROM triage_scores
        GROUP BY patient_id
      ) latest ON ts1.patient_id = latest.patient_id AND ts1.assessed_at = latest.max_assessed
    ) t ON t.patient_id = p.patient_id
    LEFT JOIN assignments a ON a.patient_id = p.patient_id AND a.status = 'active'
    WHERE a.assignment_id IS NULL AND p.treatment_status = 'Waiting'
    ORDER BY t.severity_score DESC
  `);
  return rows;
}

export { getWaitingQueue };
