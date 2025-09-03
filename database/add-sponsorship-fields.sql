-- Migration script to add missing fields to sponsorships table
-- Run this script to update the existing sponsorships table

USE conf;

-- Add missing fields to sponsorships table
ALTER TABLE sponsorships 
ADD COLUMN address TEXT AFTER website,
ADD COLUMN district VARCHAR(100) AFTER address,
ADD COLUMN sponsorship_history TEXT AFTER district,
ADD COLUMN target_audience TEXT AFTER sponsorship_history,
ADD COLUMN specific_requests TEXT AFTER target_audience;

-- Update existing records to have default values for new required fields
UPDATE sponsorships 
SET address = 'Address not provided',
    district = 'District not specified'
WHERE address IS NULL OR district IS NULL;

-- Make address and district NOT NULL after setting default values
ALTER TABLE sponsorships 
MODIFY COLUMN address TEXT NOT NULL,
MODIFY COLUMN district VARCHAR(100) NOT NULL;

-- Add indexes for better performance
ALTER TABLE sponsorships 
ADD INDEX idx_district (district),
ADD INDEX idx_company_name (company_name);

-- Verify the updated table structure
DESCRIBE sponsorships;
