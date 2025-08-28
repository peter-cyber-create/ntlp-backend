-- Database setup for NTLP Conference Management System (MySQL/MariaDB compatible)
-- Run this script to create all necessary tables

-- Create registrations table with enhanced workflow (FIRST - no dependencies)
CREATE TABLE IF NOT EXISTS registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    institution VARCHAR(255),
    phone VARCHAR(20),
    position VARCHAR(100),
    country VARCHAR(100),
    session_track VARCHAR(100),
    registration_type VARCHAR(50) CHECK (registration_type IN ('undergrad', 'grad', 'local', 'intl', 'online')),
    dietary_requirements TEXT,
    special_needs TEXT,
    status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'approved', 'rejected', 'waitlist', 'cancelled')),
    admin_notes TEXT,
    reviewed_by INT,
    reviewed_at TIMESTAMP NULL,
    review_comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create activities table (enhanced) - no dependencies
CREATE TABLE IF NOT EXISTS activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    date DATE,
    time TIME,
    location VARCHAR(255),
    capacity INT,
    registration_required BOOLEAN DEFAULT false,
    category VARCHAR(100) CHECK (category IN ('workshop', 'networking', 'social', 'cultural', 'other')),
    current_registrations INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'cancelled', 'completed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create speakers table - no dependencies
CREATE TABLE IF NOT EXISTS speakers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    biography TEXT NOT NULL,
    institution VARCHAR(255),
    email VARCHAR(255),
    photo_url VARCHAR(500),
    linkedin_url VARCHAR(500),
    twitter_url VARCHAR(500),
    website_url VARCHAR(500),
    research_interests TEXT,
    keynote_speaker BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create sessions table - no dependencies
CREATE TABLE IF NOT EXISTS sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    date DATE NOT NULL,
    location VARCHAR(255),
    session_type VARCHAR(100) CHECK (session_type IN ('keynote', 'presentation', 'panel', 'workshop', 'poster', 'break')),
    track VARCHAR(100),
    speaker_ids JSON, -- Array of speaker IDs
    capacity INT,
    registration_required BOOLEAN DEFAULT false,
    current_registrations INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create announcements table - no dependencies
CREATE TABLE IF NOT EXISTS announcements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    type VARCHAR(50) DEFAULT 'general' CHECK (type IN ('general', 'registration', 'program', 'travel', 'accommodation')),
    start_date DATE,
    end_date DATE,
    published BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create contacts table for contact form submissions - no dependencies
CREATE TABLE IF NOT EXISTS contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'responded', 'closed', 'requires_followup')),
    admin_notes TEXT,
    response TEXT,
    responded_by INT,
    responded_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create sponsorships table - no dependencies
CREATE TABLE IF NOT EXISTS sponsorships (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    package_type VARCHAR(100) CHECK (package_type IN ('platinum', 'gold', 'silver', 'bronze', 'custom')),
    amount DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'approved', 'rejected', 'negotiating', 'confirmed')),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'completed', 'overdue')),
    admin_notes TEXT,
    contract_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create admin_actions table to track all admin actions - no dependencies
CREATE TABLE IF NOT EXISTS admin_actions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL, -- 'registration', 'abstract', 'contact', etc.
    entity_id INT NOT NULL,
    action_details JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create form_submissions table to centralize form tracking - no dependencies
CREATE TABLE IF NOT EXISTS form_submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    form_type VARCHAR(50) NOT NULL, -- 'registration', 'abstract', 'contact', 'sponsorship'
    entity_id INT NOT NULL, -- ID of the submitted form
    submitted_by VARCHAR(255) NOT NULL, -- Name/email of submitter
    submission_data JSON, -- All form data
    status VARCHAR(50) DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'approved', 'rejected', 'requires_followup', 'revision_required')),
    admin_notes TEXT,
    reviewed_by INT,
    reviewed_at TIMESTAMP NULL,
    review_comments TEXT,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- NOW create tables with dependencies (after all base tables exist)

-- Create abstracts table for paper submissions with enhanced workflow (depends on registrations)
CREATE TABLE IF NOT EXISTS abstracts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    abstract TEXT NOT NULL,
    keywords JSON, -- Array of keywords
    authors JSON NOT NULL, -- Array of author objects with name, email, affiliation
    corresponding_author_email VARCHAR(255) NOT NULL,
    submission_type VARCHAR(50) DEFAULT 'abstract' CHECK (submission_type IN ('abstract', 'full_paper', 'poster', 'demo')),
    track VARCHAR(100), -- Research track
    subcategory VARCHAR(255), -- Specific topic/subcategory
    cross_cutting_themes JSON, -- Array of cross-cutting themes
    file_url VARCHAR(500), -- URL to uploaded PDF
    submitted_by INT,
    status VARCHAR(50) DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'accepted', 'rejected', 'revision_required', 'approved')),
    format VARCHAR(20) DEFAULT 'oral' CHECK (format IN ('oral', 'poster')),
    admin_notes TEXT,
    reviewer_comments TEXT,
    final_decision_date DATE,
    presentation_type VARCHAR(50) CHECK (presentation_type IN ('oral', 'poster', 'demo', 'not_assigned')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (submitted_by) REFERENCES registrations(id) ON DELETE SET NULL
);

-- Create reviews table for peer review process (depends on abstracts)
CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    abstract_id INT,
    reviewer_name VARCHAR(255) NOT NULL,
    reviewer_email VARCHAR(255) NOT NULL,
    score INT CHECK (score >= 1 AND score <= 10),
    comments TEXT,
    recommendation VARCHAR(50) CHECK (recommendation IN ('accept', 'reject', 'minor_revision', 'major_revision')),
    detailed_feedback JSON, -- Structured feedback (originality, clarity, significance, etc.)
    status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('submitted', 'approved', 'rejected')),
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE(abstract_id, reviewer_email), -- One review per reviewer per abstract
    FOREIGN KEY (abstract_id) REFERENCES abstracts(id) ON DELETE CASCADE
);

-- Create session_registrations table (many-to-many relationship) - depends on sessions and registrations
CREATE TABLE IF NOT EXISTS session_registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT,
    registration_id INT,
    status VARCHAR(20) DEFAULT 'registered' CHECK (status IN ('registered', 'waitlist', 'cancelled')),
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, registration_id),
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE
);

-- Create activity_registrations table (many-to-many relationship) - depends on activities and registrations
CREATE TABLE IF NOT EXISTS activity_registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    activity_id INT,
    registration_id INT,
    status VARCHAR(20) DEFAULT 'registered' CHECK (status IN ('registered', 'waitlist', 'cancelled')),
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(activity_id, registration_id),
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
    FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE
);

-- Create abstract_sessions table to link accepted abstracts to presentation sessions - depends on abstracts and sessions
CREATE TABLE IF NOT EXISTS abstract_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    abstract_id INT,
    session_id INT,
    presentation_order INT,
    presentation_duration INT DEFAULT 15, -- minutes
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(abstract_id, session_id),
    FOREIGN KEY (abstract_id) REFERENCES abstracts(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_registrations_status ON registrations(status);
CREATE INDEX idx_registrations_email ON registrations(email);
CREATE INDEX idx_abstracts_status ON abstracts(status);
CREATE INDEX idx_abstracts_submitted_by ON abstracts(submitted_by);
CREATE INDEX idx_form_submissions_status ON form_submissions(status);
CREATE INDEX idx_form_submissions_type ON form_submissions(form_type);
CREATE INDEX idx_admin_actions_entity ON admin_actions(entity_type, entity_id);
CREATE INDEX idx_contacts_status ON contacts(status);
CREATE INDEX idx_sponsorships_status ON sponsorships(status);
