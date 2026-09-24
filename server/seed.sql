-- Jeevan Milan: sample seed data for local development
USE er_triage_db;

-- Users (password_hash values are placeholders, not real bcrypt hashes)
INSERT INTO users (full_name, email, password_hash, role) VALUES
('Anita Sharma', 'anita.admin@jeevanmilan.local', '$2b$10$placeholderhashadmin000000000000000000000000000', 'admin'),
('Bikash Thapa', 'bikash.nurse@jeevanmilan.local', '$2b$10$placeholderhashnurse0000000000000000000000000000', 'triage_nurse'),
('Sujata Koirala', 'sujata.nurse@jeevanmilan.local', '$2b$10$placeholderhashnurse0000000000000000000000000001', 'triage_nurse'),
('Dr. Ramesh Gurung', 'ramesh.doctor@jeevanmilan.local', '$2b$10$placeholderhashdoctor000000000000000000000000000', 'doctor'),
('Dr. Prakriti Rai', 'prakriti.doctor@jeevanmilan.local', '$2b$10$placeholderhashdoctor000000000000000000000000001', 'doctor'),
('Manish KC', 'manish.reception@jeevanmilan.local', '$2b$10$placeholderhashreception0000000000000000000000000', 'receptionist');

-- Patients (arrival_time spread across Day/Night shift windows to exercise shift matching)
INSERT INTO patients (full_name, date_of_birth, gender, phone, address, emergency_contact_name, emergency_contact_phone, registered_by, treatment_status, arrival_time) VALUES
('Hari Bahadur Thapa', '1985-04-12', 'male', '9801234567', 'Baneshwor, Kathmandu', 'Sita Thapa', '9807654321', 6, 'In-Treatment', TIMESTAMP(CURDATE(), '09:00:00')),
('Sarita Lama', '1998-11-02', 'female', '9812345678', 'Patan, Lalitpur', 'Karma Lama', '9818765432', 6, 'Waiting', TIMESTAMP(CURDATE(), '10:30:00')),
('Bishnu Prasad Adhikari', '1972-07-19', 'male', '9823456789', 'Kalanki, Kathmandu', 'Gita Adhikari', '9829876543', 6, 'Waiting', TIMESTAMP(CURDATE(), '14:00:00')),
('Kamala Rana Magar', '1960-01-30', 'female', '9834567890', 'Bhaktapur', 'Suresh Rana', '9830987654', 6, 'In-Treatment', TIMESTAMP(CURDATE(), '22:00:00')),
('Nabin Shrestha', '2005-09-08', 'male', '9845678901', 'Chabahil, Kathmandu', 'Rita Shrestha', '9841098765', 6, 'Waiting', TIMESTAMP(CURDATE(), '11:00:00'));

-- Doctors (doctor 1 is Booked to match the active assignment seeded below)
INSERT INTO doctors (user_id, full_name, status, `rank`, shift, shift_start_time, shift_end, hours_on_duty) VALUES
(4, 'Dr. Ramesh Gurung', 'Booked', 'Rank II (Attending)', 'Day: 8AM-8PM', '08:00:00', '20:00:00', 3),
(5, 'Dr. Prakriti Rai', 'Booked', 'Rank I (Senior Attending)', 'Night: 8PM-8AM', '20:00:00', '08:00:00', 1);

-- Fixed bed inventory: 20 General, 10 Dedicated/Emergency, 10 ICU
INSERT INTO beds (bed_number, bed_type, status) VALUES
('G-1', 'General', 'Available'), ('G-2', 'General', 'Available'), ('G-3', 'General', 'Available'),
('G-4', 'General', 'Available'), ('G-5', 'General', 'Available'), ('G-6', 'General', 'Available'),
('G-7', 'General', 'Available'), ('G-8', 'General', 'Available'), ('G-9', 'General', 'Available'),
('G-10', 'General', 'Available'), ('G-11', 'General', 'Available'), ('G-12', 'General', 'Available'),
('G-13', 'General', 'Available'), ('G-14', 'General', 'Available'), ('G-15', 'General', 'Available'),
('G-16', 'General', 'Available'), ('G-17', 'General', 'Available'), ('G-18', 'General', 'Available'),
('G-19', 'General', 'Available'), ('G-20', 'General', 'Available'),
('ER-1', 'Emergency', 'Occupied'), ('ER-2', 'Emergency', 'Available'), ('ER-3', 'Emergency', 'Available'),
('ER-4', 'Emergency', 'Available'), ('ER-5', 'Emergency', 'Available'), ('ER-6', 'Emergency', 'Available'),
('ER-7', 'Emergency', 'Available'), ('ER-8', 'Emergency', 'Available'), ('ER-9', 'Emergency', 'Available'),
('ER-10', 'Emergency', 'Available'),
('ICU-1', 'ICU', 'Occupied'), ('ICU-2', 'ICU', 'Available'), ('ICU-3', 'ICU', 'Available'),
('ICU-4', 'ICU', 'Available'), ('ICU-5', 'ICU', 'Available'), ('ICU-6', 'ICU', 'Available'),
('ICU-7', 'ICU', 'Available'), ('ICU-8', 'ICU', 'Available'), ('ICU-9', 'ICU', 'Available'),
('ICU-10', 'ICU', 'Available');

-- Vitals
INSERT INTO vitals (patient_id, recorded_by, heart_rate, systolic_bp, diastolic_bp, respiratory_rate, temperature, spo2, consciousness_level, pain_score) VALUES
(1, 2, 118, 90, 60, 24, 38.5, 93, 'verbal', 8),
(2, 2, 88, 118, 76, 16, 37.0, 98, 'alert', 3),
(3, 3, 102, 140, 92, 20, 37.8, 95, 'alert', 6),
(4, 3, 130, 85, 55, 28, 39.2, 89, 'pain', 9),
(5, 2, 92, 122, 80, 18, 37.1, 99, 'alert', 2);

-- Triage scores
INSERT INTO triage_scores (patient_id, vital_id, assessed_by, severity_score, priority_level, chief_complaint, notes) VALUES
(1, 1, 2, 78.50, 'urgent', 'Chest pain and shortness of breath', 'Monitor closely, ECG ordered'),
(2, 2, 2, 25.00, 'low', 'Minor laceration on forearm', 'Stable, awaiting suturing'),
(3, 3, 3, 55.00, 'moderate', 'Abdominal pain', 'Possible appendicitis, needs imaging'),
(4, 4, 3, 92.75, 'critical', 'Fall with head trauma, low SpO2', 'Immediate resuscitation required'),
(5, 5, 2, 20.00, 'low', 'Sprained ankle', 'X-ray requested, stable');

-- Assignments (bed_id 21 = ER-1, bed_id 31 = ICU-1, matching the Occupied beds above)
INSERT INTO assignments (patient_id, doctor_id, bed_id, assigned_by, status) VALUES
(1, 1, 21, 1, 'active'),
(4, 2, 31, 1, 'active');
