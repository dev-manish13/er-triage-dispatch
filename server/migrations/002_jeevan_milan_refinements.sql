-- Jeevan Milan migration 002: doctor experience/shift, patient arrival time,
-- and the fixed 40-bed inventory. Safe to run once against an existing er_triage_db.
USE er_triage_db;

-- === doctors: experience tier + shift window, used by the dispatch cost matrix ===
ALTER TABLE doctors
  ADD COLUMN experience_level ENUM('Senior', 'Attending', 'Resident') NOT NULL DEFAULT 'Resident',
  ADD COLUMN shift ENUM('Day: 8AM-8PM', 'Night: 8PM-8AM') NOT NULL DEFAULT 'Day: 8AM-8PM';

-- === patients: arrival_time becomes nurse-settable (was an auto-only TIMESTAMP) ===
ALTER TABLE patients
  MODIFY COLUMN arrival_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- === beds: replace whatever inventory exists with the fixed 40-bed layout.
-- Existing assignments keep their history; FK ON DELETE SET NULL just clears
-- their bed reference, since those old bed rows no longer exist. ===
DELETE FROM beds;
ALTER TABLE beds AUTO_INCREMENT = 1;

INSERT INTO beds (bed_number, bed_type, status) VALUES
('GEN-1', 'General', 'Available'),
('GEN-2', 'General', 'Available'),
('GEN-3', 'General', 'Available'),
('GEN-4', 'General', 'Available'),
('GEN-5', 'General', 'Available'),
('GEN-6', 'General', 'Available'),
('GEN-7', 'General', 'Available'),
('GEN-8', 'General', 'Available'),
('GEN-9', 'General', 'Available'),
('GEN-10', 'General', 'Available'),
('GEN-11', 'General', 'Available'),
('GEN-12', 'General', 'Available'),
('GEN-13', 'General', 'Available'),
('GEN-14', 'General', 'Available'),
('GEN-15', 'General', 'Available'),
('GEN-16', 'General', 'Available'),
('GEN-17', 'General', 'Available'),
('GEN-18', 'General', 'Available'),
('GEN-19', 'General', 'Available'),
('GEN-20', 'General', 'Available'),
('ER-1', 'Emergency', 'Available'),
('ER-2', 'Emergency', 'Available'),
('ER-3', 'Emergency', 'Available'),
('ER-4', 'Emergency', 'Available'),
('ER-5', 'Emergency', 'Available'),
('ER-6', 'Emergency', 'Available'),
('ER-7', 'Emergency', 'Available'),
('ER-8', 'Emergency', 'Available'),
('ER-9', 'Emergency', 'Available'),
('ER-10', 'Emergency', 'Available'),
('ICU-1', 'ICU', 'Available'),
('ICU-2', 'ICU', 'Available'),
('ICU-3', 'ICU', 'Available'),
('ICU-4', 'ICU', 'Available'),
('ICU-5', 'ICU', 'Available'),
('ICU-6', 'ICU', 'Available'),
('ICU-7', 'ICU', 'Available'),
('ICU-8', 'ICU', 'Available'),
('ICU-9', 'ICU', 'Available'),
('ICU-10', 'ICU', 'Available');
