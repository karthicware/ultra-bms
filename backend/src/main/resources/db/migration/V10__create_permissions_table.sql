-- Create permissions table for RBAC
-- Permissions follow the pattern: resource:action (e.g., tenants:create, work-orders:view)

CREATE TABLE permissions (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for permission lookups
CREATE INDEX idx_permissions_name ON permissions(name);
CREATE INDEX idx_permissions_resource ON permissions(resource);

-- Insert permissions for each module
-- Tenant Management
INSERT INTO permissions (name, resource, action, description) VALUES
    ('tenants:create', 'tenants', 'create', 'Create new tenants'),
    ('tenants:read', 'tenants', 'read', 'View tenant information'),
    ('tenants:update', 'tenants', 'update', 'Update tenant details'),
    ('tenants:delete', 'tenants', 'delete', 'Delete tenants'),
    ('leases:create', 'leases', 'create', 'Create lease agreements'),
    ('leases:read', 'leases', 'read', 'View lease details'),
    ('leases:update', 'leases', 'update', 'Update lease information'),
    ('leases:delete', 'leases', 'delete', 'Terminate leases'),

-- Property Management
    ('properties:create', 'properties', 'create', 'Create new properties'),
    ('properties:read', 'properties', 'read', 'View property information'),
    ('properties:update', 'properties', 'update', 'Update property details'),
    ('properties:delete', 'properties', 'delete', 'Delete properties'),
    ('units:create', 'units', 'create', 'Create units'),
    ('units:read', 'units', 'read', 'View unit information'),
    ('units:update', 'units', 'update', 'Update unit details'),
    ('units:delete', 'units', 'delete', 'Delete units'),

-- Work Order Management
    ('work-orders:create', 'work-orders', 'create', 'Create work orders'),
    ('work-orders:read', 'work-orders', 'read', 'View work orders'),
    ('work-orders:update', 'work-orders', 'update', 'Update work order details'),
    ('work-orders:delete', 'work-orders', 'delete', 'Delete work orders'),
    ('work-orders:assign', 'work-orders', 'assign', 'Assign work orders to vendors'),
    ('work-orders:approve', 'work-orders', 'approve', 'Approve work order completion'),

-- Vendor Management
    ('vendors:create', 'vendors', 'create', 'Create vendor profiles'),
    ('vendors:read', 'vendors', 'read', 'View vendor information'),
    ('vendors:update', 'vendors', 'update', 'Update vendor details'),
    ('vendors:delete', 'vendors', 'delete', 'Delete vendors'),
    ('vendors:rate', 'vendors', 'rate', 'Rate vendor performance'),

-- Financial Management
    ('invoices:create', 'invoices', 'create', 'Generate invoices'),
    ('invoices:read', 'invoices', 'read', 'View invoices'),
    ('invoices:update', 'invoices', 'update', 'Update invoice details'),
    ('invoices:delete', 'invoices', 'delete', 'Delete invoices'),
    ('invoices:approve', 'invoices', 'approve', 'Approve invoices for payment'),
    ('payments:create', 'payments', 'create', 'Record payments'),
    ('payments:read', 'payments', 'read', 'View payment history'),
    ('payments:update', 'payments', 'update', 'Update payment details'),
    ('payments:delete', 'payments', 'delete', 'Delete payment records'),
    ('pdcs:create', 'pdcs', 'create', 'Register post-dated cheques'),
    ('pdcs:read', 'pdcs', 'read', 'View PDC information'),
    ('pdcs:update', 'pdcs', 'update', 'Update PDC status'),
    ('pdcs:delete', 'pdcs', 'delete', 'Delete PDC records'),
    ('pdcs:manage', 'pdcs', 'manage', 'Full PDC management including deposit and bounce handling'),
    ('expenses:create', 'expenses', 'create', 'Record expenses'),
    ('expenses:read', 'expenses', 'read', 'View expense records'),
    ('expenses:update', 'expenses', 'update', 'Update expense details'),
    ('expenses:delete', 'expenses', 'delete', 'Delete expense records'),
    ('expenses:approve', 'expenses', 'approve', 'Approve expenses for payment'),

-- Asset Management
    ('assets:create', 'assets', 'create', 'Register new assets'),
    ('assets:read', 'assets', 'read', 'View asset information'),
    ('assets:update', 'assets', 'update', 'Update asset details'),
    ('assets:delete', 'assets', 'delete', 'Delete asset records'),

-- Document Management
    ('documents:create', 'documents', 'create', 'Upload documents'),
    ('documents:read', 'documents', 'read', 'View and download documents'),
    ('documents:update', 'documents', 'update', 'Update document metadata'),
    ('documents:delete', 'documents', 'delete', 'Delete documents'),

-- Parking Management
    ('parking:create', 'parking', 'create', 'Create parking allocations'),
    ('parking:read', 'parking', 'read', 'View parking information'),
    ('parking:update', 'parking', 'update', 'Update parking assignments'),
    ('parking:delete', 'parking', 'delete', 'Delete parking allocations'),

-- User Management
    ('users:create', 'users', 'create', 'Create user accounts'),
    ('users:read', 'users', 'read', 'View user information'),
    ('users:update', 'users', 'update', 'Update user details'),
    ('users:delete', 'users', 'delete', 'Delete user accounts'),
    ('users:manage-roles', 'users', 'manage-roles', 'Assign roles to users'),

-- System Configuration
    ('system:configure', 'system', 'configure', 'Modify system settings'),
    ('system:view-config', 'system', 'view-config', 'View system configuration'),
    ('system:audit-logs', 'system', 'audit-logs', 'Access audit logs'),

-- Reporting
    ('reports:financial', 'reports', 'financial', 'Generate financial reports'),
    ('reports:operational', 'reports', 'operational', 'Generate operational reports'),
    ('reports:custom', 'reports', 'custom', 'Create custom reports');

-- Add comments for documentation
COMMENT ON TABLE permissions IS 'Granular permissions for role-based access control';
COMMENT ON COLUMN permissions.name IS 'Permission identifier in format resource:action';
COMMENT ON COLUMN permissions.resource IS 'Resource being protected (e.g., tenants, work-orders)';
COMMENT ON COLUMN permissions.action IS 'Action being performed (e.g., create, read, update, delete)';
