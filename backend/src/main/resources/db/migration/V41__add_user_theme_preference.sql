-- Story 2.7: Admin Theme Settings & System Theme Support
-- Add theme_preference column to users table

ALTER TABLE users ADD COLUMN IF NOT EXISTS theme_preference VARCHAR(20) DEFAULT 'SYSTEM';

-- Add constraint for valid values
ALTER TABLE users ADD CONSTRAINT chk_theme_preference
    CHECK (theme_preference IN ('SYSTEM', 'LIGHT', 'DARK'));

-- Update existing users to have SYSTEM as default
UPDATE users SET theme_preference = 'SYSTEM' WHERE theme_preference IS NULL;
