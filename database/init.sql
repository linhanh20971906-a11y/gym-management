
-- ============================================
-- GYM MANAGEMENT DATABASE
-- He thong quan ly phong Gym / Fitness
-- Database: MySQL 8.0
-- ============================================

CREATE DATABASE IF NOT EXISTS gym_management
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE gym_management;

-- ============================================
-- 1. BANG GOI TAP
-- ============================================

CREATE TABLE IF NOT EXISTS membership_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    duration_months INT NOT NULL,
    price DECIMAL(12,2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. BANG HOI VIEN
-- ============================================

CREATE TABLE IF NOT EXISTS members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(150) UNIQUE,
    gender ENUM('male', 'female', 'other'),
    date_of_birth DATE,
    address VARCHAR(255),
    plan_id INT,
    join_date DATE,
    status ENUM('active', 'inactive')
        DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (plan_id)
        REFERENCES membership_plans(id)
        ON DELETE SET NULL
);

-- ============================================
-- 3. BANG HUAN LUYEN VIEN
-- ============================================

CREATE TABLE IF NOT EXISTS trainers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(150) UNIQUE,
    specialty VARCHAR(150),
    experience_years INT DEFAULT 0,
    status ENUM('active', 'inactive')
        DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 4. BANG LICH TAP
-- ============================================

CREATE TABLE IF NOT EXISTS workout_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    member_id INT NOT NULL,
    trainer_id INT NOT NULL,
    workout_date DATETIME NOT NULL,
    duration_minutes INT DEFAULT 60,
    status ENUM(
        'scheduled',
        'completed',
        'cancelled'
    ) DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (member_id)
        REFERENCES members(id)
        ON DELETE CASCADE,

    FOREIGN KEY (trainer_id)
        REFERENCES trainers(id)
        ON DELETE CASCADE
);

-- ============================================
-- 5. DU LIEU MAU GOI TAP
-- ============================================

INSERT INTO membership_plans
(name, duration_months, price, description)
VALUES
('Gói 1 tháng', 1, 300000,
 'Tập gym không giới hạn trong 1 tháng'),

('Gói 3 tháng', 3, 800000,
 'Tập gym không giới hạn trong 3 tháng'),

('Gói 6 tháng', 6, 1500000,
 'Tập gym không giới hạn trong 6 tháng'),

('Gói 12 tháng', 12, 2800000,
 'Tập gym không giới hạn trong 12 tháng');

-- ============================================
-- 6. DU LIEU MAU HUAN LUYEN VIEN
-- ============================================

INSERT INTO trainers
(full_name, phone, email, specialty, experience_years)
VALUES
('Nguyen Van An', '0901111111',
 'an@gym.com', 'Fitness', 5),

('Tran Thi Binh', '0902222222',
 'binh@gym.com', 'Yoga', 4),

('Le Van Cuong', '0903333333',
 'cuong@gym.com', 'Bodybuilding', 6);

-- ============================================
-- 7. DU LIEU MAU HOI VIEN
-- ============================================

INSERT INTO members
(full_name, phone, email, gender, plan_id, join_date)
VALUES
('Nguyen Van Nam', '0911111111',
 'nam@gmail.com', 'male', 1, CURDATE()),

('Tran Thi Hoa', '0922222222',
 'hoa@gmail.com', 'female', 2, CURDATE()),

('Le Van Minh', '0933333333',
 'minh@gmail.com', 'male', 3, CURDATE());

-- ============================================
-- 8. DU LIEU MAU LICH TAP
-- ============================================

INSERT INTO workout_schedules
(member_id, trainer_id, workout_date, status)
VALUES
(1, 1, '2026-10-20 08:00:00', 'scheduled'),
(2, 2, '2026-10-21 09:00:00', 'scheduled'),
(3, 3, '2026-10-22 17:00:00', 'scheduled');

-- ============================================
-- 9. KIEM TRA DU LIEU
-- ============================================

SHOW TABLES;

SELECT * FROM membership_plans;
SELECT * FROM members;
SELECT * FROM trainers;
SELECT * FROM workout_schedules;
