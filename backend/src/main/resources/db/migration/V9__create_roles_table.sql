-- Create roles table for RBAC
-- Roles define user access levels in the system

CREATE TABLE roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for role name lookups
CREATE INDEX idx_roles_name ON roles(name);

-- Insert default roles
INSERT INTO roles (name, description) VALUES
    ('SUPER_ADMIN', 'Full system access - all operations on all modules'),
    ('PROPERTY_MANAGER', 'Property-specific management - tenants, work orders, financial reports for assigned properties'),
    ('MAINTENANCE_SUPERVISOR', 'Work order and vendor management - cannot access financial data or tenant contracts'),
    ('FINANCE_MANAGER', 'Financial operations only - invoices, payments, PDCs, reports'),
    ('TENANT', 'Self-service portal - view own lease, payment history, submit maintenance requests'),
    ('VENDOR', 'Job view and updates - basic authenticated user permissions');

-- Add comments for documentation
COMMENT ON TABLE roles IS 'User roles for role-based access control (RBAC)';
COMMENT ON COLUMN roles.name IS 'Unique role name (e.g., SUPER_ADMIN, PROPERTY_MANAGER)';
COMMENT ON COLUMN roles.description IS 'Human-readable description of role permissions';
