-- V38: Add User Management Fields
-- Story 2.6: Admin User Management
-- Adds status and must_change_password fields to users table
-- Also adds users:* permissions for admin user management

-- Add status field to users table (ACTIVE, INACTIVE, PENDING)
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ACTIVE';

-- Add must_change_password flag for forcing password change on first login
ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT false;

-- Update existing users to ACTIVE status (if null)
UPDATE users SET status = 'ACTIVE' WHERE status IS NULL;

-- Make status column NOT NULL after setting defaults
ALTER TABLE users ALTER COLUMN status SET NOT NULL;

-- Add index for status queries (commonly filtered)
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Add composite index for status + role filtering
CREATE INDEX IF NOT EXISTS idx_users_status_role ON users(status, role_id);

-- =====================================================
-- Add users permissions for admin user management
-- =====================================================

-- Note: These permissions already exist from V10, but we keep these statements
-- for idempotency. The WHERE NOT EXISTS clause will prevent duplicates.

-- users:read - View user accounts
-- Already exists in V10, but kept for reference
-- (No action needed - permission exists)

-- users:create - Create user accounts  
-- Already exists in V10, but kept for reference
-- (No action needed - permission exists)

-- users:update - Update user accounts
-- Already exists in V10, but kept for reference
-- (No action needed - permission exists)

-- users:delete - Delete/deactivate user accounts
-- Already exists in V10, but kept for reference
-- (No action needed - permission exists)

-- =====================================================
-- Grant users permissions to SUPER_ADMIN role
-- SUPER_ADMIN automatically has all permissions via is_super_admin flag,
-- but we explicitly grant for consistency
-- =====================================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'SUPER_ADMIN'
AND p.name IN ('users:read', 'users:create', 'users:update', 'users:delete')
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
);
