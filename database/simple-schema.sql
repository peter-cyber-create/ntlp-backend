-- Simple, clean database schema for NTLP Conference Management
-- Compatible with MySQL 8.0+ and MariaDB 10.6+

USE conf;

-- Contacts table
CREATE TABLE contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    organization VARCHAR(200),
    subject VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    inquiry_type VARCHAR(50),
    status ENUM('submitted', 'under_review', 'responded', 'closed') DEFAULT 'submitted',
    response TEXT,
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_email (email)
);

-- Abstracts table
CREATE TABLE abstracts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    abstract TEXT NOT NULL,
    authors JSON NOT NULL,
    corresponding_author_email VARCHAR(255) NOT NULL,
    track VARCHAR(100),
    keywords JSON,
    submission_type ENUM('abstract', 'full_paper', 'poster', 'demo') DEFAULT 'abstract',
    status ENUM('submitted', 'under_review', 'accepted', 'rejected', 'pending') DEFAULT 'submitted',
    reviewer_comments TEXT,
    file_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_corresponding_author (corresponding_author_email),
    INDEX idx_track (track),
    INDEX idx_created_at (created_at)
);

-- Registrations table
CREATE TABLE registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    organization VARCHAR(255),
    position VARCHAR(255),
    country VARCHAR(100),
    registration_type ENUM('student', 'academic', 'industry', 'professional', 'early_bird', 'regular') NOT NULL,
    dietary_requirements TEXT,
    accommodation_needed BOOLEAN DEFAULT FALSE,
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    status ENUM('submitted', 'confirmed', 'cancelled', 'waitlist') DEFAULT 'submitted',
    payment_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    payment_proof_url VARCHAR(500),
    payment_amount DECIMAL(10,2),
    payment_date TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_registration_type (registration_type),
    INDEX idx_payment_status (payment_status),
    INDEX idx_created_at (created_at)
);

-- Sponsorships table
CREATE TABLE sponsorships (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    website VARCHAR(255),
    selected_package ENUM('platinum', 'gold', 'silver', 'bronze', 'custom') NOT NULL,
    budget_range VARCHAR(50),
    additional_benefits TEXT,
    marketing_materials TEXT,
    logo_url VARCHAR(500),
    company_description TEXT,
    status ENUM('submitted', 'under_review', 'approved', 'rejected', 'negotiating') DEFAULT 'submitted',
    contract_signed BOOLEAN DEFAULT FALSE,
    payment_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    payment_amount DECIMAL(10,2),
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_package (selected_package),
    INDEX idx_payment_status (payment_status),
    INDEX idx_email (email),
    INDEX idx_created_at (created_at)
);

-- Insert some test data
INSERT INTO contacts (name, email, subject, message, status) VALUES 
('Test User', 'test@example.com', 'Test Subject', 'Test message content', 'submitted');

INSERT INTO abstracts (title, abstract, authors, corresponding_author_email, status) VALUES 
('Sample Abstract', 'This is a sample abstract content for testing purposes.', 
 JSON_ARRAY(JSON_OBJECT('name', 'John Doe', 'email', 'john@example.com', 'affiliation', 'University')), 
 'john@example.com', 'submitted');

INSERT INTO registrations (first_name, last_name, email, registration_type, status) VALUES 
('Jane', 'Smith', 'jane@example.com', 'academic', 'submitted');

INSERT INTO sponsorships (company_name, contact_person, email, selected_package, status) VALUES 
('Tech Corp', 'Alice Johnson', 'alice@techcorp.com', 'gold', 'submitted');
