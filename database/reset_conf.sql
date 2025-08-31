-- DANGER: Drop and recreate 'conf' DB to match current app
DROP DATABASE IF EXISTS conf;
CREATE DATABASE conf;
USE conf;

-- Registrations
CREATE TABLE registrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  firstName VARCHAR(100) NOT NULL,
  lastName VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20),
  organization VARCHAR(255),
  position VARCHAR(255),
  district VARCHAR(100),
  country VARCHAR(100) DEFAULT 'Uganda',
  registrationType ENUM('undergrad','grad','local','intl','online') NOT NULL,
  specialRequirements TEXT,
  dietary_requirements TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  payment_status ENUM('pending','completed','failed','cancelled') DEFAULT 'pending',
  payment_amount DECIMAL(10,2) DEFAULT 0,
  payment_currency VARCHAR(3) DEFAULT 'UGX',
  payment_reference VARCHAR(255),
  status ENUM('pending','confirmed','rejected','cancelled') DEFAULT 'pending',
  registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_status (status),
  INDEX idx_payment_status (payment_status),
  INDEX idx_registration_type (registrationType)
);

-- Contacts
CREATE TABLE contacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  organization VARCHAR(255),
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status ENUM('new','in-progress','resolved','pending') DEFAULT 'new',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_status (status)
);

-- Abstracts (aligned)
CREATE TABLE abstracts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  abstract TEXT NOT NULL,
  keywords TEXT,
  category ENUM('research','case-study','review','policy') NOT NULL,
  subcategory VARCHAR(500),
  authors VARCHAR(500) NOT NULL,
  email VARCHAR(255) NOT NULL,
  institution VARCHAR(255),
  phone VARCHAR(20),
  fileName VARCHAR(255),
  filePath VARCHAR(1024),
  fileSize INT,
  status ENUM('pending','under-review','accepted','rejected') DEFAULT 'pending',
  reviewComments TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_status (status),
  INDEX idx_category (category)
);

-- Restore two previous abstracts
INSERT INTO abstracts (
  title, abstract, keywords, category, subcategory, authors, email, institution, phone,
  fileName, filePath, fileSize, status, reviewComments
) VALUES
('DB Abstract','Short abstract','k1,k2','research',
 'AI-powered diagnostics: Innovations and governance for TB, HIV, and cervical cancer',
 'DB Author','db.author+ntlp@test.local','Inst','+256700000012','pending-upload',NULL,0,'pending',NULL),
('DB Abstract2','Short abstract','k1,k2','research',
 'AI-powered diagnostics: Innovations and governance for TB, HIV, and cervical cancer',
 'DB Author2','db.author2+ntlp@test.local','Inst','+256700000015','pending-upload',NULL,0,'pending',NULL);
