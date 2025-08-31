-- Database setup for NTLP Conference Management System
-- Run this script to create all necessary tables

-- Create registrations table with enhanced workflow
CREATE TABLE IF NOT EXISTS registrations (
    id SERIAL PRIMARY KEY,
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
    reviewed_by INTEGER,
    reviewed_at TIMESTAMP,
    review_comments TEXT,
    payment_proof_url VARCHAR(500),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'verified', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create activities table (enhanced)
CREATE TABLE IF NOT EXISTS activities (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    date DATE,
    time TIME,
    location VARCHAR(255),
    capacity INTEGER,
    registration_required BOOLEAN DEFAULT false,
    category VARCHAR(100) CHECK (category IN ('workshop', 'networking', 'social', 'cultural', 'other')),
    current_registrations INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'cancelled', 'completed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create speakers table
CREATE TABLE IF NOT EXISTS speakers (
    id SERIAL PRIMARY KEY,
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    date DATE NOT NULL,
    location VARCHAR(255),
    session_type VARCHAR(100) CHECK (session_type IN ('keynote', 'presentation', 'panel', 'workshop', 'poster', 'break')),
    track VARCHAR(100),
    speaker_ids JSON, -- Array of speaker IDs
    capacity INTEGER,
    registration_required BOOLEAN DEFAULT false,
    current_registrations INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    type VARCHAR(50) DEFAULT 'general' CHECK (type IN ('general', 'registration', 'program', 'travel', 'accommodation')),
    start_date DATE,
    end_date DATE,
    published BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create abstracts table for paper submissions with enhanced workflow
CREATE TABLE IF NOT EXISTS abstracts (
    id SERIAL PRIMARY KEY,
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
    submitted_by INTEGER REFERENCES registrations(id),
    status VARCHAR(50) DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'accepted', 'rejected', 'revision_required', 'approved')),
    format VARCHAR(20) DEFAULT 'oral' CHECK (format IN ('oral', 'poster')),
    admin_notes TEXT,
    reviewer_comments TEXT,
    final_decision_date DATE,
    presentation_type VARCHAR(50) CHECK (presentation_type IN ('oral', 'poster', 'demo', 'not_assigned')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create reviews table for peer review process
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    abstract_id BIGINT UNSIGNED REFERENCES abstracts(id) ON DELETE CASCADE,
    reviewer_name VARCHAR(255) NOT NULL,
    reviewer_email VARCHAR(255) NOT NULL,
    score INTEGER CHECK (score >= 1 AND score <= 10),
    comments TEXT,
    recommendation VARCHAR(50) CHECK (recommendation IN ('accept', 'reject', 'minor_revision', 'major_revision')),
    detailed_feedback JSON, -- Structured feedback (originality, clarity, significance, etc.)
    status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('submitted', 'approved', 'rejected')),
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(abstract_id, reviewer_email) -- One review per reviewer per abstract
);

-- Create session_registrations table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS session_registrations (
    id SERIAL PRIMARY KEY,
    session_id BIGINT UNSIGNED,
    registration_id BIGINT UNSIGNED,
    status VARCHAR(20) DEFAULT 'registered' CHECK (status IN ('registered', 'waitlist', 'cancelled')),
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, registration_id),
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE
);

-- Create activity_registrations table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS activity_registrations (
    id SERIAL PRIMARY KEY,
    activity_id BIGINT UNSIGNED,
    registration_id BIGINT UNSIGNED,
    status VARCHAR(20) DEFAULT 'registered' CHECK (status IN ('registered', 'waitlist', 'cancelled')),
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(activity_id, registration_id),
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
    FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE
);

-- Create abstract_sessions table to link accepted abstracts to presentation sessions
CREATE TABLE IF NOT EXISTS abstract_sessions (
    id SERIAL PRIMARY KEY,
    abstract_id BIGINT UNSIGNED,
    session_id BIGINT UNSIGNED,
    presentation_order INTEGER,
    presentation_duration INTEGER DEFAULT 15, -- minutes
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(abstract_id, session_id),
    FOREIGN KEY (abstract_id) REFERENCES abstracts(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- Create admin_actions table to track all admin actions
CREATE TABLE IF NOT EXISTS admin_actions (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL, -- 'registration', 'abstract', 'contact', etc.
    entity_id INTEGER NOT NULL,
    action_details JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create form_submissions table to track all form submissions
CREATE TABLE IF NOT EXISTS form_submissions (
    id SERIAL PRIMARY KEY,
    form_type VARCHAR(50) NOT NULL, -- 'registration', 'abstract', 'contact', 'sponsorship'
    entity_id INTEGER NOT NULL,
    submitted_by VARCHAR(255), -- email or identifier
    submission_data JSON,
    status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'approved', 'rejected', 'requires_revision')),
    admin_notes TEXT,
    reviewed_by INTEGER,
    reviewed_at TIMESTAMP,
    review_comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create sponsorships table for sponsor applications
CREATE TABLE IF NOT EXISTS sponsorships (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    website VARCHAR(255),
    industry VARCHAR(255),
    special_requirements TEXT,
    selected_package VARCHAR(50) NOT NULL CHECK (selected_package IN ('Platinum Sponsor', 'Gold Sponsor', 'Silver Sponsor', 'Bronze Sponsor')),
    message TEXT,
    status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'approved', 'rejected', 'negotiating')),
    admin_notes TEXT,
    reviewed_by INTEGER,
    reviewed_at TIMESTAMP,
    review_comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contact messages table with enhanced workflow
CREATE TABLE IF NOT EXISTS contacts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    organization VARCHAR(200),
    subject VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'responded', 'closed', 'requires_followup')),
    response_message TEXT,
    admin_notes TEXT,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    assigned_to INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_registrations_email ON registrations(email);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON registrations(status);
CREATE INDEX IF NOT EXISTS idx_registrations_created_at ON registrations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_abstracts_status ON abstracts(status);
CREATE INDEX IF NOT EXISTS idx_abstracts_track ON abstracts(track);
CREATE INDEX IF NOT EXISTS idx_abstracts_submission_type ON abstracts(submission_type);
CREATE INDEX IF NOT EXISTS idx_abstracts_corresponding_author ON abstracts(corresponding_author_email);
CREATE INDEX IF NOT EXISTS idx_reviews_abstract_id ON reviews(abstract_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_email ON reviews(reviewer_email);
CREATE INDEX IF NOT EXISTS idx_reviews_recommendation ON reviews(recommendation);
CREATE INDEX IF NOT EXISTS idx_sessions_track ON sessions(track);
CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(date);
CREATE INDEX IF NOT EXISTS idx_activities_category ON activities(category);
CREATE INDEX IF NOT EXISTS idx_announcements_published ON announcements(published);
CREATE INDEX IF NOT EXISTS idx_announcements_priority ON announcements(priority);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_form_submissions_form_type ON form_submissions(form_type);
CREATE INDEX IF NOT EXISTS idx_form_submissions_status ON form_submissions(status);
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_entity_type ON admin_actions(entity_type);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON admin_actions(created_at DESC);
