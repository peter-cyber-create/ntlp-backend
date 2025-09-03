-- Migration script to fix sponsorships table
-- Add missing fields and update enum

USE conf;

-- Add missing fields that don't exist
ALTER TABLE sponsorships 
ADD COLUMN budget_range VARCHAR(50) AFTER selected_package,
ADD COLUMN additional_benefits TEXT AFTER budget_range,
ADD COLUMN marketing_materials TEXT AFTER additional_benefits,
ADD COLUMN company_description TEXT AFTER marketing_materials;

-- Update the selected_package enum to include 'custom'
ALTER TABLE sponsorships 
MODIFY COLUMN selected_package ENUM('platinum', 'gold', 'silver', 'bronze', 'custom') NOT NULL;

-- Update existing records to have default values for new required fields
UPDATE sponsorships 
SET company_description = 'No description provided'
WHERE company_description IS NULL;

-- Make company_description NOT NULL after setting default values
ALTER TABLE sponsorships 
MODIFY COLUMN company_description TEXT NOT NULL;

-- Add indexes for better performance
ALTER TABLE sponsorships 
ADD INDEX idx_budget_range (budget_range);

-- Verify the updated table structure
DESCRIBE sponsorships;
