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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Database setup for NTLP Conference Management System
-- Run this script to create all necessary tables

-- Create registrations table
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
    registration_type VARCHAR(50) CHECK (registration_type IN ('student', 'academic', 'industry', 'professional', 'early_bird', 'regular')),
    dietary_requirements TEXT,
    special_needs TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'waitlist')),
    payment_status VARCHAR(20) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
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
    published BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create abstracts table for paper submissions
CREATE TABLE IF NOT EXISTS abstracts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    abstract TEXT NOT NULL,
    keywords JSON, -- Array of keywords
    authors JSON NOT NULL, -- Array of author objects with name, email, affiliation
    corresponding_author_email VARCHAR(255) NOT NULL,
    submission_type VARCHAR(50) DEFAULT 'abstract' CHECK (submission_type IN ('abstract', 'full_paper', 'poster', 'demo')),
    track VARCHAR(100), -- Research track (e.g., 'machine_learning', 'linguistics', 'applications')
    file_url VARCHAR(500), -- URL to uploaded PDF
    submitted_by INTEGER REFERENCES registrations(id),
    status VARCHAR(50) DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'accepted', 'rejected', 'revision_required')),
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(abstract_id, reviewer_email) -- One review per reviewer per abstract
);

-- Create session_registrations table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS session_registrations (
    id SERIAL PRIMARY KEY,
    session_id BIGINT UNSIGNED,
    registration_id BIGINT UNSIGNED,
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(abstract_id, session_id),
    FOREIGN KEY (abstract_id) REFERENCES abstracts(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_registrations_email ON registrations(email);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON registrations(status);
-- CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date);
-- CREATE INDEX IF NOT EXISTS idx_sessions_track ON sessions(track);
-- CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(date);
-- CREATE INDEX IF NOT EXISTS idx_activities_category ON activities(category);
-- CREATE INDEX IF NOT EXISTS idx_announcements_published ON announcements(published);
-- CREATE INDEX IF NOT EXISTS idx_announcements_priority ON announcements(priority);
-- CREATE INDEX IF NOT EXISTS idx_abstracts_status ON abstracts(status);
-- CREATE INDEX IF NOT EXISTS idx_abstracts_track ON abstracts(track);
-- CREATE INDEX IF NOT EXISTS idx_abstracts_submission_type ON abstracts(submission_type);
-- CREATE INDEX IF NOT EXISTS idx_abstracts_corresponding_author ON abstracts(corresponding_author_email);
-- CREATE INDEX IF NOT EXISTS idx_reviews_abstract_id ON reviews(abstract_id);
-- CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_email ON reviews(reviewer_email);
-- CREATE INDEX IF NOT EXISTS idx_reviews_recommendation ON reviews(recommendation);
-- CREATE INDEX IF NOT EXISTS idx_sessions_track ON sessions(track);
-- CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(date);
-- CREATE INDEX IF NOT EXISTS idx_activities_category ON activities(category);
-- CREATE INDEX IF NOT EXISTS idx_announcements_published ON announcements(published);
-- CREATE INDEX IF NOT EXISTS idx_announcements_priority ON announcements(priority);
-- CREATE INDEX IF NOT EXISTS idx_abstracts_status ON abstracts(status);
-- CREATE INDEX IF NOT EXISTS idx_abstracts_track ON abstracts(track);
-- CREATE INDEX IF NOT EXISTS idx_abstracts_submission_type ON abstracts(submission_type);
-- CREATE INDEX IF NOT EXISTS idx_abstracts_corresponding_author ON abstracts(corresponding_author_email);
-- CREATE INDEX IF NOT EXISTS idx_reviews_abstract_id ON reviews(abstract_id);
-- CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_email ON reviews(reviewer_email);
-- CREATE INDEX IF NOT EXISTS idx_reviews_recommendation ON reviews(recommendation);

-- Create full-text search indexes
-- CREATE INDEX IF NOT EXISTS idx_abstracts_title_search ON abstracts USING gin(to_tsvector('english', title));
-- CREATE INDEX IF NOT EXISTS idx_abstracts_content_search ON abstracts USING gin(to_tsvector('english', abstract));

-- Create triggers to update the updated_at timestamp (PostgreSQL only, commented out for MariaDB/MySQL)
-- CREATE OR REPLACE FUNCTION update_updated_at_column()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     NEW.updated_at = CURRENT_TIMESTAMP;
--     RETURN NEW;
-- END;
-- $$ language 'plpgsql';

-- CREATE TRIGGER update_registrations_updated_at BEFORE UPDATE ON registrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- CREATE TRIGGER update_speakers_updated_at BEFORE UPDATE ON speakers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- CREATE TRIGGER update_abstracts_updated_at BEFORE UPDATE ON abstracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Contact messages table
CREATE TABLE contacts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    organization VARCHAR(200),
    subject VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'responded', 'closed')),
    response_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for contacts
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_status ON contacts(status);
CREATE INDEX idx_contacts_created_at ON contacts(created_at DESC);

-- Trigger for contacts
-- CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
