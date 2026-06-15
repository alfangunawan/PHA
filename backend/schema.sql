-- ============================================
-- Mindfulness App - Database Schema (Iterasi 1)
-- ============================================

CREATE DATABASE IF NOT EXISTS mindfulness_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE mindfulness_db;

-- ==================
-- Table: users
-- ==================
CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  avatar_url VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==================
-- Table: breathing_techniques
-- ==================
CREATE TABLE IF NOT EXISTS breathing_techniques (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  inhale_duration INT NOT NULL COMMENT 'Durasi tarik napas (detik)',
  hold_duration INT NOT NULL DEFAULT 0 COMMENT 'Durasi tahan napas (detik)',
  exhale_duration INT NOT NULL COMMENT 'Durasi hembus napas (detik)',
  hold_after_exhale INT NOT NULL DEFAULT 0 COMMENT 'Tahan setelah hembus (detik, untuk box breathing)',
  cycles INT NOT NULL DEFAULT 4 COMMENT 'Jumlah siklus per sesi',
  color_theme VARCHAR(20) DEFAULT '#A8C5DA' COMMENT 'Warna tema animasi lingkaran',
  icon VARCHAR(50) DEFAULT 'wind',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==================
-- Table: breathing_logs
-- ==================
CREATE TABLE IF NOT EXISTS breathing_logs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  technique_id INT UNSIGNED NOT NULL,
  duration INT NOT NULL COMMENT 'Durasi sesi aktual (detik)',
  cycles_completed INT NOT NULL DEFAULT 0,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (technique_id) REFERENCES breathing_techniques(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==================
-- Table: meditation_sessions
-- ==================
CREATE TABLE IF NOT EXISTS meditation_sessions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  description TEXT,
  category ENUM('sleep', 'focus', 'anxiety', 'morning', 'general') NOT NULL DEFAULT 'general',
  audio_url VARCHAR(500) NULL COMMENT 'URL audio streaming eksternal',
  thumbnail_url VARCHAR(500) NULL,
  duration_options JSON NOT NULL COMMENT 'Opsi durasi dalam menit',
  color_theme VARCHAR(20) DEFAULT '#C9B8E8',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==================
-- Table: meditation_logs
-- ==================
CREATE TABLE IF NOT EXISTS meditation_logs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  session_id INT UNSIGNED NOT NULL,
  duration INT NOT NULL COMMENT 'Durasi aktual sesi (detik)',
  completed BOOLEAN DEFAULT FALSE COMMENT 'TRUE jika sesi selesai penuh',
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES meditation_sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==================
-- Table: education_contents
-- ==================
CREATE TABLE IF NOT EXISTS education_contents (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  source ENUM('youtube', 'tiktok', 'other') NOT NULL DEFAULT 'youtube',
  url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500),
  category VARCHAR(100) DEFAULT 'general',
  tags JSON,
  created_by_admin_id INT UNSIGNED,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by_admin_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==================
-- Table: audio_contents (Persiapan Iterasi 2)
-- ==================
CREATE TABLE IF NOT EXISTS audio_contents (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  category VARCHAR(100) DEFAULT 'general',
  duration INT COMMENT 'Durasi audio (detik)',
  description TEXT,
  created_by_admin_id INT UNSIGNED,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by_admin_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- SEED DATA
-- ============================================

-- Admin user (password: password)
INSERT IGNORE INTO users (name, email, password, role) VALUES
('Admin Mindfulness', 'admin@mindfulness.app', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
('Demo User', 'user@mindfulness.app', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user');

-- Breathing Techniques
INSERT IGNORE INTO breathing_techniques (name, description, inhale_duration, hold_duration, exhale_duration, hold_after_exhale, cycles, color_theme, icon) VALUES
('4-7-8 Breathing', 'Teknik pernapasan yang menenangkan sistem saraf. Tarik napas 4 detik, tahan 7 detik, hembus 8 detik. Sangat efektif untuk mengurangi kecemasan dan membantu tidur.', 4, 7, 8, 0, 4, '#A8C5DA', 'water'),
('Box Breathing', 'Digunakan oleh Navy SEAL untuk mengelola stres. Setiap fase sama panjangnya — membentuk pola kotak yang teratur dan menenangkan pikiran.', 4, 4, 4, 4, 6, '#B2C9AD', 'square'),
('Deep Breathing', 'Pernapasan diafragma yang sederhana dan efektif. Ideal untuk pemula yang baru memulai latihan pernapasan.', 5, 0, 6, 0, 8, '#C9B8E8', 'wind'),
('Resonance Breathing', 'Pernapasan resonansi 5-5 yang menyeimbangkan sistem saraf otonom dan meningkatkan variabilitas detak jantung (HRV).', 5, 0, 5, 0, 10, '#F5CBA7', 'heart');

-- Meditation Sessions
INSERT IGNORE INTO meditation_sessions (title, description, category, thumbnail_url, duration_options, color_theme) VALUES
('Tidur Nyenyak', 'Panduan meditasi untuk mempersiapkan tubuh dan pikiran menuju tidur yang berkualitas. Cocok dilakukan 30 menit sebelum tidur.', 'sleep', NULL, '["10","15","20"]', '#C9B8E8'),
('Fokus & Konsentrasi', 'Tingkatkan fokus dan produktivitas dengan meditasi sederhana ini. Dirancang untuk membantu kamu masuk ke mode deep work.', 'focus', NULL, '["5","10","15"]', '#A8C5DA'),
('Redakan Kecemasan', 'Sesi meditasi khusus untuk menenangkan pikiran yang penuh kekhawatiran. Dengan panduan suara lembut dan teknik grounding.', 'anxiety', NULL, '["10","15","20"]', '#B2C9AD'),
('Mulai Pagi Cerah', 'Awali harimu dengan energi positif. Meditasi pagi singkat untuk menetapkan niat hari ini dan membangun rasa syukur.', 'morning', NULL, '["5","10"]', '#F5CBA7'),
('Meditasi Umum', 'Meditasi kesadaran (mindfulness) dasar untuk siapa saja. Cocok untuk pemula maupun yang sudah berpengalaman.', 'general', NULL, '["5","10","15","20"]', '#A8C5DA');

-- Education Contents
INSERT IGNORE INTO education_contents (title, description, source, url, thumbnail_url, category, created_by_admin_id) VALUES
('Apa Itu Anxiety? Gejala & Cara Mengatasinya', 'Penjelasan komprehensif tentang anxiety disorder, gejala yang perlu diwaspadai, dan langkah pertama untuk mengatasinya.', 'youtube', 'https://www.youtube.com/watch?v=example1', 'https://img.youtube.com/vi/example1/hqdefault.jpg', 'pengetahuan-dasar', 1),
('5 Teknik Pernapasan untuk Mengatasi Panik', 'Pelajari 5 teknik pernapasan yang terbukti efektif untuk menenangkan serangan panik dan kecemasan akut.', 'youtube', 'https://www.youtube.com/watch?v=example2', 'https://img.youtube.com/vi/example2/hqdefault.jpg', 'teknik', 1),
('Mindfulness dalam 60 Detik', 'Cara praktis memulai mindfulness di tengah kesibukan. Bisa dilakukan kapan saja dan di mana saja.', 'tiktok', 'https://www.tiktok.com/@example/video/example3', 'https://picsum.photos/seed/mindful1/400/600', 'mindfulness', 1),
('Kenapa Otak Kita Cemas? Penjelasan Ilmiah', 'Memahami mekanisme kecemasan dari perspektif neurosains — mengapa otak kita bereaksi berlebihan dan bagaimana melatihnya.', 'youtube', 'https://www.youtube.com/watch?v=example4', 'https://img.youtube.com/vi/example4/hqdefault.jpg', 'ilmu-pengetahuan', 1),
('Grounding Technique 5-4-3-2-1', 'Teknik grounding sederhana untuk mengembalikan perhatian ke momen saat ini saat pikiran mulai racing.', 'youtube', 'https://www.youtube.com/watch?v=example5', 'https://img.youtube.com/vi/example5/hqdefault.jpg', 'teknik', 1);
