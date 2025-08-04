-- NTLP Conference Management System - Registration Schema Migration
-- Version: 2.0 - Complete field alignment with frontend and API endpoints
-- 
-- This migration addresses discrepancies between:
-- 1. Current database schema (registrations table)
-- 2. API endpoint expectations (/api/registrations mapped to users.js)
-- 3. Frontend form fields and validation requirements
-- 4. Enhanced notification system integration
--
-- Run this on production server: 
-- psql -h localhost -U postgres -d ntlp_conference -f database/migrate_registrations_schema.sql

\echo '================================================'
\echo 'NTLP Registration Schema Migration - Starting'
\echo '================================================'

-- Show current table structure before migration
\echo 'BEFORE MIGRATION - Current registrations table structure:'
\d registrations;

-- ===== ANALYSIS OF FIELD REQUIREMENTS =====
-- From curl test: first_name, last_name, email, phone, organization, position, district, registration_type
-- From schema.sql: institution (NOT organization), country (NOT district), session_track, status, payment_status
-- From users.js route: expects institution, country, session_track BUT API accepts organization/district
-- From validation.js: validates first_name, last_name, email, phone, registration_type, status

-- ===== STEP 1: ADD MISSING REQUIRED FIELDS =====

-- Add organization field (separate from institution for different organizational contexts)
-- institution = academic institution, organization = current workplace/company
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS organization VARCHAR(255);

-- Add district field for Uganda regional/district tracking (more specific than country)
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS district VARCHAR(100);

-- ===== STEP 2: HANDLE DATA MIGRATION FOR EXISTING RECORDS =====

-- Copy institution data to organization for backward compatibility
UPDATE registrations 
SET organization = institution 
WHERE organization IS NULL AND institution IS NOT NULL;

-- Set default district for existing records if country is Uganda
UPDATE registrations 
SET district = CASE 
    WHEN country = 'Uganda' AND district IS NULL THEN 'Kampala'
    WHEN country IS NOT NULL AND district IS NULL THEN country
    ELSE district
END
WHERE district IS NULL;

-- ===== STEP 3: ENHANCE PERFORMANCE WITH STRATEGIC INDEXES =====

-- Core search indexes for API queries
CREATE INDEX IF NOT EXISTS idx_registrations_organization ON registrations(organization);
CREATE INDEX IF NOT EXISTS idx_registrations_district ON registrations(district);
CREATE INDEX IF NOT EXISTS idx_registrations_registration_type ON registrations(registration_type);

-- Geographic indexing for analytics
CREATE INDEX IF NOT EXISTS idx_registrations_country ON registrations(country);
CREATE INDEX IF NOT EXISTS idx_registrations_country_district ON registrations(country, district);

-- Performance indexes for admin dashboard
CREATE INDEX IF NOT EXISTS idx_registrations_created_at_desc ON registrations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_registrations_status_type ON registrations(status, registration_type);
CREATE INDEX IF NOT EXISTS idx_registrations_payment_status ON registrations(payment_status);

-- Full-text search for names and organizations
CREATE INDEX IF NOT EXISTS idx_registrations_name_search ON registrations 
USING gin(to_tsvector('english', first_name || ' ' || last_name || ' ' || COALESCE(organization, '')));

-- ===== STEP 4: VALIDATE FIELD ALIGNMENT =====

-- Verify all expected fields exist
SELECT 
    column_name, 
    data_type, 
    character_maximum_length, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'registrations' 
    AND column_name IN (
        'first_name', 'last_name', 'email', 'phone', 
        'organization', 'institution', 'position', 
        'district', 'country', 'registration_type',
        'status', 'payment_status'
    )
ORDER BY column_name;

-- ===== STEP 5: SHOW UPDATED SCHEMA =====

\echo ''
\echo 'AFTER MIGRATION - Updated registrations table structure:'
\d registrations;

-- ===== STEP 6: VERIFY DATA INTEGRITY =====

-- Show statistics of populated fields
SELECT 
    COUNT(*) as total_registrations,
    COUNT(organization) as with_organization,
    COUNT(institution) as with_institution,
    COUNT(district) as with_district,
    COUNT(country) as with_country,
    COUNT(CASE WHEN organization IS NOT NULL OR institution IS NOT NULL THEN 1 END) as with_org_or_inst
FROM registrations;

-- Show sample of migrated data
\echo ''
\echo 'SAMPLE DATA - Verifying migration results:'
SELECT 
    id, 
    first_name, 
    last_name, 
    email, 
    organization,
    institution,
    district,
    country,
    registration_type,
    status,
    created_at 
FROM registrations 
ORDER BY created_at DESC 
LIMIT 3;

-- ===== STEP 7: COMPATIBILITY NOTES =====

\echo ''
\echo '================================================'
\echo 'MIGRATION COMPLETED SUCCESSFULLY!'
\echo '================================================'
\echo ''
\echo 'FIELD MAPPING FOR API COMPATIBILITY:'
\echo '• Frontend sends: organization → Database stores: organization'
\echo '• Frontend sends: district → Database stores: district'
\echo '• Backward compatibility: institution field preserved'
\echo '• Enhanced indexing for performance optimization'
\echo ''
\echo 'API ENDPOINT READY: /api/registrations'
\echo 'Expected JSON format:'
\echo '{'
\echo '  "first_name": "John",'
\echo '  "last_name": "Doe",'
\echo '  "email": "john.doe@example.com",'
\echo '  "phone": "+256701234567",'
\echo '  "organization": "Makerere University",'
\echo '  "position": "Researcher",'
\echo '  "district": "Kampala",'
\echo '  "registration_type": "professional"'
\echo '}'
\echo ''
\echo 'ENHANCED NOTIFICATION SYSTEM INTEGRATION:'
\echo '• Success responses include notification metadata'
\echo '• Error responses provide structured feedback'
\echo '• Validation errors highlight specific field issues'
\echo ''
\echo 'NEXT STEPS:'
\echo '1. Test registration endpoint with curl command'
\echo '2. Verify responseFormatter.js uses CommonJS exports'
\echo '3. Restart PM2 backend process'
\echo '4. Update frontend forms to use new field structure'
\echo ''
\echo 'Migration completed at:' 
SELECT CURRENT_TIMESTAMP;
