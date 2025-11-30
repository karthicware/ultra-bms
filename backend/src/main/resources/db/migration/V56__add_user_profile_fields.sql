-- V56__add_user_profile_fields.sql
-- Story 2.9: User Profile Customization
-- Adds display name, avatar, and contact phone fields for user profile

-- Add display name field (user-customizable display name)
ALTER TABLE users ADD COLUMN display_name VARCHAR(100);

-- Add avatar file path (S3 key for user's profile photo)
ALTER TABLE users ADD COLUMN avatar_file_path VARCHAR(500);

-- Add contact phone (optional personal phone for internal directory)
ALTER TABLE users ADD COLUMN contact_phone VARCHAR(30);

-- Note: All fields are nullable as they are optional profile customizations
-- - display_name: falls back to firstName + lastName if null
-- - avatar_file_path: shows initials if null
-- - contact_phone: distinct from existing 'phone' field which is registration phone
