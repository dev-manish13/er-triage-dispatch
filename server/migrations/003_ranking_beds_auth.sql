-- Jeevan Milan migration 003: bed prefix rename (GEN- -> G-) for the dynamic bed
-- numbering feature, and the doctor rank system replacing specialty/experience_level.
-- Safe to run once against an existing er_triage_db.
USE er_triage_db;

-- === beds: General beds move to the 'G-' prefix used by the auto-numbering logic ===
UPDATE beds SET bed_number = REPLACE(bed_number, 'GEN-', 'G-') WHERE bed_number LIKE 'GEN-%';

-- === doctors: specialty is dropped; experience_level becomes a 4-tier rank ===
ALTER TABLE doctors
  ADD COLUMN `rank` ENUM(
    'Rank I (Senior Attending)',
    'Rank II (Attending)',
    'Rank III (Resident)',
    'Rank IV (Intern)'
  ) NOT NULL DEFAULT 'Rank III (Resident)';

UPDATE doctors SET `rank` = CASE experience_level
  WHEN 'Senior' THEN 'Rank I (Senior Attending)'
  WHEN 'Attending' THEN 'Rank II (Attending)'
  WHEN 'Resident' THEN 'Rank III (Resident)'
  ELSE 'Rank III (Resident)'
END;

ALTER TABLE doctors
  DROP COLUMN specialty,
  DROP COLUMN experience_level;
