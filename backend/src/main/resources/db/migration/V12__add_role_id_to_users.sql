-- Migrate users table from role enum (VARCHAR) to role_id foreign key
-- This enables normalized RBAC with roles and permissions tables

-- Step 1: Add role_id column (nullable initially for data migration)
ALTER TABLE users ADD COLUMN role_id BIGINT;

-- Step 2: Migrate existing user roles to role_id foreign key
-- Map each role string value to the corresponding role ID
UPDATE users
SET role_id = (
    SELECT id FROM roles WHERE name = users.role
)
WHERE role IS NOT NULL;

-- Step 3: Add foreign key constraint
ALTER TABLE users
ADD CONSTRAINT fk_users_role
FOREIGN KEY (role_id) REFERENCES roles(id);

-- Step 4: Make role_id NOT NULL (all users must have a role)
ALTER TABLE users ALTER COLUMN role_id SET NOT NULL;

-- Step 5: Create index on role_id for performance
CREATE INDEX idx_users_role_id ON users(role_id);

-- Step 6: Drop the old role VARCHAR column
-- Note: This removes the enum-based role field
ALTER TABLE users DROP COLUMN role;

-- Add comment for documentation
COMMENT ON COLUMN users.role_id IS 'Foreign key to roles table for RBAC';
