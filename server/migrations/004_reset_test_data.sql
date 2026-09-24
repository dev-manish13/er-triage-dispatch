-- Jeevan Milan migration 004: clear all doctor/patient/clinical test data for a
-- clean slate. Beds are reset to the canonical fixed 40 (20 General, 10 Emergency,
-- 10 ICU), all set back to Available, rather than truncated.
USE er_triage_db;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE assignments;
TRUNCATE TABLE triage_scores;
TRUNCATE TABLE vitals;
TRUNCATE TABLE patients;
TRUNCATE TABLE doctors;
SET FOREIGN_KEY_CHECKS = 1;

-- Normalize beds back to exactly the fixed 40, all Available.
DELETE FROM beds;
ALTER TABLE beds AUTO_INCREMENT = 1;

INSERT INTO beds (bed_number, bed_type, status) VALUES
('G-1', 'General', 'Available'), ('G-2', 'General', 'Available'), ('G-3', 'General', 'Available'),
('G-4', 'General', 'Available'), ('G-5', 'General', 'Available'), ('G-6', 'General', 'Available'),
('G-7', 'General', 'Available'), ('G-8', 'General', 'Available'), ('G-9', 'General', 'Available'),
('G-10', 'General', 'Available'), ('G-11', 'General', 'Available'), ('G-12', 'General', 'Available'),
('G-13', 'General', 'Available'), ('G-14', 'General', 'Available'), ('G-15', 'General', 'Available'),
('G-16', 'General', 'Available'), ('G-17', 'General', 'Available'), ('G-18', 'General', 'Available'),
('G-19', 'General', 'Available'), ('G-20', 'General', 'Available'),
('ER-1', 'Emergency', 'Available'), ('ER-2', 'Emergency', 'Available'), ('ER-3', 'Emergency', 'Available'),
('ER-4', 'Emergency', 'Available'), ('ER-5', 'Emergency', 'Available'), ('ER-6', 'Emergency', 'Available'),
('ER-7', 'Emergency', 'Available'), ('ER-8', 'Emergency', 'Available'), ('ER-9', 'Emergency', 'Available'),
('ER-10', 'Emergency', 'Available'),
('ICU-1', 'ICU', 'Available'), ('ICU-2', 'ICU', 'Available'), ('ICU-3', 'ICU', 'Available'),
('ICU-4', 'ICU', 'Available'), ('ICU-5', 'ICU', 'Available'), ('ICU-6', 'ICU', 'Available'),
('ICU-7', 'ICU', 'Available'), ('ICU-8', 'ICU', 'Available'), ('ICU-9', 'ICU', 'Available'),
('ICU-10', 'ICU', 'Available');
