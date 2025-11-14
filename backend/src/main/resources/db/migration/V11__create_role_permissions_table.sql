-- Create role_permissions join table for many-to-many relationship
-- Maps roles to their granted permissions

CREATE TABLE role_permissions (
    role_id BIGINT REFERENCES roles(id) ON DELETE CASCADE,
    permission_id BIGINT REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- Create indexes for permission lookups
CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);

-- Map permissions to roles based on permission matrix
-- SUPER_ADMIN gets ALL permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'SUPER_ADMIN';

-- PROPERTY_MANAGER permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name IN (
    -- Tenant Management
    'tenants:create', 'tenants:read', 'tenants:update',
    'leases:create', 'leases:read', 'leases:update',
    -- Property Management
    'properties:read', 'properties:update',
    'units:create', 'units:read', 'units:update',
    -- Work Orders
    'work-orders:create', 'work-orders:read', 'work-orders:update', 'work-orders:assign',
    -- Vendors (read-only for assignment)
    'vendors:read',
    -- Financial (read-only for their properties)
    'invoices:read', 'payments:read', 'pdcs:read',
    -- Documents
    'documents:create', 'documents:read', 'documents:update',
    -- Parking
    'parking:create', 'parking:read', 'parking:update', 'parking:delete',
    -- Reporting (for their properties)
    'reports:operational'
)
WHERE r.name = 'PROPERTY_MANAGER';

-- MAINTENANCE_SUPERVISOR permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name IN (
    -- Work Orders (full access)
    'work-orders:create', 'work-orders:read', 'work-orders:update', 'work-orders:delete',
    'work-orders:assign', 'work-orders:approve',
    -- Vendors (full management)
    'vendors:create', 'vendors:read', 'vendors:update', 'vendors:rate',
    -- Assets
    'assets:read', 'assets:update',
    -- Properties (read-only for work order context)
    'properties:read', 'units:read',
    -- Tenants (read-only for work order context)
    'tenants:read',
    -- Documents (for work orders)
    'documents:create', 'documents:read',
    -- Reporting
    'reports:operational'
)
WHERE r.name = 'MAINTENANCE_SUPERVISOR';

-- FINANCE_MANAGER permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name IN (
    -- Full financial access
    'invoices:create', 'invoices:read', 'invoices:update', 'invoices:delete', 'invoices:approve',
    'payments:create', 'payments:read', 'payments:update', 'payments:delete',
    'pdcs:create', 'pdcs:read', 'pdcs:update', 'pdcs:delete', 'pdcs:manage',
    'expenses:create', 'expenses:read', 'expenses:update', 'expenses:delete', 'expenses:approve',
    -- Tenants and leases (read-only for financial context)
    'tenants:read', 'leases:read',
    -- Properties (read-only for financial reporting)
    'properties:read', 'units:read',
    -- Vendors (for payment context)
    'vendors:read',
    -- Documents
    'documents:create', 'documents:read', 'documents:update',
    -- Financial reporting
    'reports:financial', 'reports:custom'
)
WHERE r.name = 'FINANCE_MANAGER';

-- TENANT permissions (self-service portal)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name IN (
    -- Own lease information
    'leases:read',
    -- Own payment history
    'invoices:read', 'payments:read',
    -- Submit maintenance requests
    'work-orders:create', 'work-orders:read',
    -- View own documents
    'documents:read',
    -- Parking
    'parking:read',
    -- Make payments
    'payments:create'
)
WHERE r.name = 'TENANT';

-- VENDOR permissions (minimal - job view and updates)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name IN (
    -- View and update assigned work orders
    'work-orders:read', 'work-orders:update',
    -- View own vendor profile
    'vendors:read',
    -- Upload job completion documents
    'documents:create', 'documents:read'
)
WHERE r.name = 'VENDOR';

-- Add comments for documentation
COMMENT ON TABLE role_permissions IS 'Many-to-many mapping between roles and permissions';
COMMENT ON COLUMN role_permissions.role_id IS 'Foreign key to roles table';
COMMENT ON COLUMN role_permissions.permission_id IS 'Foreign key to permissions table';
