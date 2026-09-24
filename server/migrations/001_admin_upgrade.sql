-- MediSift migration 001: admin panel, resource lifecycle, doctor fatigue tracking.
-- Safe to run once against an existing er_triage_db (uses add-column / backfill / drop-column
-- steps rather than CHANGE COLUMN enum casts, since MySQL enum conversion during a rename is
-- not guaranteed to remap existing values correctly across a differently-ordered value set).
USE er_triage_db;

-- === doctors: booking status + fatigue tracking, rename specialization/shift_start ===
ALTER TABLE doctors
  ADD COLUMN status ENUM('Available', 'Booked', 'Off-Duty') NOT NULL DEFAULT 'Available',
  ADD COLUMN hours_on_duty INT NOT NULL DEFAULT 0;

UPDATE doctors d
SET d.status = CASE
  WHEN EXISTS (SELECT 1 FROM assignments a WHERE a.doctor_id = d.doctor_id AND a.status = 'active') THEN 'Booked'
  WHEN d.is_available THEN 'Available'
  ELSE 'Off-Duty'
END;

ALTER TABLE doctors
  DROP COLUMN is_available,
  CHANGE COLUMN specialization specialty VARCHAR(100) NOT NULL DEFAULT 'General Medicine',
  CHANGE COLUMN shift_start shift_start_time TIME NULL;

CREATE INDEX idx_doctors_status ON doctors(status);

-- === beds: recast status/bed_type to the new value sets ===
ALTER TABLE beds
  ADD COLUMN status_new ENUM('Available', 'Occupied', 'Maintenance') NOT NULL DEFAULT 'Available',
  ADD COLUMN bed_type_new ENUM('ICU', 'Emergency', 'General') NOT NULL DEFAULT 'General';

UPDATE beds SET
  status_new = CASE status
    WHEN 'available' THEN 'Available'
    WHEN 'occupied' THEN 'Occupied'
    ELSE 'Maintenance'
  END,
  bed_type_new = CASE bed_type
    WHEN 'icu' THEN 'ICU'
    WHEN 'trauma' THEN 'Emergency'
    WHEN 'general' THEN 'General'
    ELSE 'General'
  END;

ALTER TABLE beds
  DROP COLUMN status,
  DROP COLUMN bed_type,
  CHANGE COLUMN status_new status ENUM('Available', 'Occupied', 'Maintenance') NOT NULL DEFAULT 'Available',
  CHANGE COLUMN bed_type_new bed_type ENUM('ICU', 'Emergency', 'General') NOT NULL DEFAULT 'General';

CREATE INDEX idx_beds_status ON beds(status);

-- === patients: fold arrival/clinical status into a single treatment_status field ===
ALTER TABLE patients
  ADD COLUMN treatment_status ENUM('Waiting', 'In-Treatment', 'Stable', 'Discharged') NOT NULL DEFAULT 'Waiting';

UPDATE patients SET treatment_status = CASE status
  WHEN 'waiting' THEN 'Waiting'
  WHEN 'in_treatment' THEN 'In-Treatment'
  WHEN 'admitted' THEN 'In-Treatment'
  WHEN 'discharged' THEN 'Discharged'
  WHEN 'transferred' THEN 'Discharged'
  ELSE 'Waiting'
END;

DROP INDEX idx_patients_status ON patients;
ALTER TABLE patients DROP COLUMN status;
CREATE INDEX idx_patients_treatment_status ON patients(treatment_status);
