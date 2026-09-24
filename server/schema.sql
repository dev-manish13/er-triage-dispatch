-- Jeevan Milan: Smart ER Triage & Dynamic Resource Allocation System
-- Database schema

DROP DATABASE IF EXISTS er_triage_db;
CREATE DATABASE er_triage_db;
USE er_triage_db;

-- Staff accounts (triage nurses, admins, doctors who log in)
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'triage_nurse', 'doctor', 'receptionist') NOT NULL DEFAULT 'triage_nurse',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Patients registered at the ER
CREATE TABLE patients (
    patient_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender ENUM('male', 'female', 'other') NOT NULL,
    phone VARCHAR(20),
    address VARCHAR(255),
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    registered_by INT,
    arrival_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    treatment_status ENUM('Waiting', 'In-Treatment', 'Stable', 'Discharged') NOT NULL DEFAULT 'Waiting',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (registered_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Vitals recorded for a patient (can be multiple readings over time)
CREATE TABLE vitals (
    vital_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    recorded_by INT,
    heart_rate INT COMMENT 'beats per minute',
    systolic_bp INT COMMENT 'mmHg',
    diastolic_bp INT COMMENT 'mmHg',
    respiratory_rate INT COMMENT 'breaths per minute',
    temperature DECIMAL(4,1) COMMENT 'Celsius',
    spo2 INT COMMENT 'blood oxygen saturation percentage',
    consciousness_level ENUM('alert', 'verbal', 'pain', 'unresponsive') NOT NULL DEFAULT 'alert',
    pain_score TINYINT COMMENT '0-10 scale',
    recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
    FOREIGN KEY (recorded_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Computed triage scores/priority levels for a patient
CREATE TABLE triage_scores (
    triage_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    vital_id INT,
    assessed_by INT,
    severity_score DECIMAL(5,2) NOT NULL COMMENT 'computed acuity score',
    priority_level ENUM('critical', 'urgent', 'moderate', 'low') NOT NULL,
    chief_complaint VARCHAR(255),
    notes TEXT,
    assessed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
    FOREIGN KEY (vital_id) REFERENCES vitals(vital_id) ON DELETE SET NULL,
    FOREIGN KEY (assessed_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Doctors available for assignment
CREATE TABLE doctors (
    doctor_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    status ENUM('Available', 'Booked', 'Off-Duty') NOT NULL DEFAULT 'Available',
    `rank` ENUM(
        'Rank I (Senior Attending)',
        'Rank II (Attending)',
        'Rank III (Resident)',
        'Rank IV (Intern)'
    ) NOT NULL DEFAULT 'Rank III (Resident)',
    shift ENUM('Day: 8AM-8PM', 'Night: 8PM-8AM') NOT NULL DEFAULT 'Day: 8AM-8PM',
    shift_start_time TIME,
    shift_end TIME,
    hours_on_duty INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ER beds/resources available
CREATE TABLE beds (
    bed_id INT AUTO_INCREMENT PRIMARY KEY,
    bed_number VARCHAR(20) NOT NULL UNIQUE,
    bed_type ENUM('ICU', 'Emergency', 'General') NOT NULL DEFAULT 'General',
    status ENUM('Available', 'Occupied', 'Maintenance') NOT NULL DEFAULT 'Available',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Assignment of a patient to a doctor and/or bed
CREATE TABLE assignments (
    assignment_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    doctor_id INT,
    bed_id INT,
    assigned_by INT,
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    released_at TIMESTAMP NULL,
    status ENUM('active', 'completed', 'cancelled') NOT NULL DEFAULT 'active',
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE SET NULL,
    FOREIGN KEY (bed_id) REFERENCES beds(bed_id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Helpful indexes for common triage/queue lookups
CREATE INDEX idx_patients_treatment_status ON patients(treatment_status);
CREATE INDEX idx_vitals_patient ON vitals(patient_id);
CREATE INDEX idx_triage_scores_patient ON triage_scores(patient_id);
CREATE INDEX idx_triage_scores_priority ON triage_scores(priority_level);
CREATE INDEX idx_assignments_patient ON assignments(patient_id);
CREATE INDEX idx_assignments_status ON assignments(status);
CREATE INDEX idx_doctors_status ON doctors(status);
CREATE INDEX idx_beds_status ON beds(status);
