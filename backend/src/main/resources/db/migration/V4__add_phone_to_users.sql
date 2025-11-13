-- V4: Add phone field to users table
-- Description: Adds optional phone number field for user registration (Story 2.1 - AC1)
-- Author: Ultra BMS Development Team
-- Date: 2025-11-13

-- =====================================================
-- ALTER TABLE: users
-- Description: Add phone column for E.164 format phone numbers
-- =====================================================
ALTER TABLE users
ADD COLUMN phone VARCHAR(20);

-- Column comment
COMMENT ON COLUMN users.phone IS 'User phone number in E.164 format (optional) - example: +971501234567';

-- =====================================================
-- MIGRATION COMPLETION
-- =====================================================
-- Migration V4 completed successfully
-- Added: phone column to users table for registration support
