-- Create missing tables: property_images, tenants, tenant_documents, unit_history
-- These tables were referenced by JPA entities but migrations were not created

-- =====================================================
-- TABLE: property_images
-- Description: Property images stored in S3
-- =====================================================
CREATE TABLE property_images (
    id UUID NOT NULL,
    property_id UUID NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    display_order INTEGER DEFAULT 0,
    uploaded_by UUID,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT pk_property_images PRIMARY KEY (id),
    CONSTRAINT fk_property_images_property FOREIGN KEY (property_id) REFERENCES properties(id),
    CONSTRAINT fk_property_images_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

CREATE INDEX idx_property_images_property_id ON property_images(property_id);
CREATE INDEX idx_property_images_display_order ON property_images(display_order);

COMMENT ON TABLE property_images IS 'Property images stored externally (S3) with file paths in database';
COMMENT ON COLUMN property_images.file_name IS 'Original file name';
COMMENT ON COLUMN property_images.file_path IS 'File storage path (S3 URL or file system path)';
COMMENT ON COLUMN property_images.file_size IS 'File size in bytes';
COMMENT ON COLUMN property_images.display_order IS 'Display order for sorting images (lower numbers displayed first)';

-- =====================================================
-- TABLE: tenants
-- Description: Tenants renting units in properties
-- =====================================================
CREATE TABLE tenants (
    id UUID NOT NULL,
    -- Personal Information
    user_id UUID NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    date_of_birth DATE NOT NULL,
    national_id VARCHAR(50) NOT NULL,
    nationality VARCHAR(100) NOT NULL,
    emergency_contact_name VARCHAR(100) NOT NULL,
    emergency_contact_phone VARCHAR(20) NOT NULL,
    -- Lease Information
    property_id UUID NOT NULL,
    unit_id UUID NOT NULL,
    lease_start_date DATE NOT NULL,
    lease_end_date DATE NOT NULL,
    lease_duration INTEGER NOT NULL,
    lease_type VARCHAR(20) NOT NULL,
    renewal_option BOOLEAN NOT NULL DEFAULT false,
    -- Rent Breakdown
    base_rent NUMERIC(12, 2) NOT NULL,
    admin_fee NUMERIC(12, 2) DEFAULT 0,
    service_charge NUMERIC(12, 2) DEFAULT 0,
    security_deposit NUMERIC(12, 2) NOT NULL,
    total_monthly_rent NUMERIC(12, 2) NOT NULL,
    -- Parking Allocation
    parking_spots INTEGER DEFAULT 0,
    parking_fee_per_spot NUMERIC(12, 2) DEFAULT 0,
    spot_numbers VARCHAR(200),
    mulkiya_document_path VARCHAR(500),
    -- Payment Schedule
    payment_frequency VARCHAR(20) NOT NULL,
    payment_due_date INTEGER NOT NULL,
    payment_method VARCHAR(20) NOT NULL,
    pdc_cheque_count INTEGER,
    -- Metadata
    tenant_number VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_by UUID,
    lead_id UUID,
    quotation_id UUID,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT pk_tenants PRIMARY KEY (id),
    CONSTRAINT uk_tenant_email UNIQUE (email),
    CONSTRAINT uk_tenant_number UNIQUE (tenant_number),
    CONSTRAINT uk_tenant_user_id UNIQUE (user_id),
    CONSTRAINT fk_tenants_property FOREIGN KEY (property_id) REFERENCES properties(id),
    CONSTRAINT fk_tenants_unit FOREIGN KEY (unit_id) REFERENCES units(id)
);

CREATE INDEX idx_tenants_unit_id ON tenants(unit_id);
CREATE INDEX idx_tenants_property_id ON tenants(property_id);
CREATE INDEX idx_tenants_status ON tenants(status);
CREATE INDEX idx_tenants_email ON tenants(email);
CREATE INDEX idx_tenants_lease_end_date ON tenants(lease_end_date);

COMMENT ON TABLE tenants IS 'Tenants renting units in properties with comprehensive lease and payment information';
COMMENT ON COLUMN tenants.user_id IS 'Associated user account (TENANT role)';
COMMENT ON COLUMN tenants.tenant_number IS 'Unique tenant number (e.g., TNT-2025-0001)';
COMMENT ON COLUMN tenants.lease_type IS 'FIXED_TERM, MONTH_TO_MONTH, YEARLY';
COMMENT ON COLUMN tenants.payment_frequency IS 'MONTHLY, QUARTERLY, YEARLY';
COMMENT ON COLUMN tenants.payment_method IS 'BANK_TRANSFER, CHEQUE, PDC, CASH, ONLINE';
COMMENT ON COLUMN tenants.status IS 'PENDING, ACTIVE, EXPIRED, TERMINATED';

-- =====================================================
-- TABLE: tenant_documents
-- Description: Documents uploaded for tenants (stored in S3)
-- =====================================================
CREATE TABLE tenant_documents (
    id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    document_type VARCHAR(20) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    uploaded_by UUID,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT pk_tenant_documents PRIMARY KEY (id),
    CONSTRAINT fk_tenant_documents_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX idx_tenant_documents_tenant_id ON tenant_documents(tenant_id);
CREATE INDEX idx_tenant_documents_document_type ON tenant_documents(document_type);

COMMENT ON TABLE tenant_documents IS 'Documents uploaded for tenants (EMIRATES_ID, PASSPORT, VISA, SIGNED_LEASE, MULKIYA, OTHER)';
COMMENT ON COLUMN tenant_documents.document_type IS 'Type of document: EMIRATES_ID, PASSPORT, VISA, SIGNED_LEASE, MULKIYA, OTHER';
COMMENT ON COLUMN tenant_documents.file_path IS 'S3 file path (full path in S3 bucket)';

-- =====================================================
-- TABLE: unit_history
-- Description: Audit trail for unit status changes
-- =====================================================
CREATE TABLE unit_history (
    id UUID NOT NULL,
    unit_id UUID NOT NULL,
    old_status VARCHAR(30) NOT NULL,
    new_status VARCHAR(30) NOT NULL,
    reason VARCHAR(500),
    changed_by UUID NOT NULL,
    changed_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT pk_unit_history PRIMARY KEY (id),
    CONSTRAINT fk_unit_history_unit FOREIGN KEY (unit_id) REFERENCES units(id),
    CONSTRAINT fk_unit_history_changed_by FOREIGN KEY (changed_by) REFERENCES users(id)
);

CREATE INDEX idx_unit_history_unit_id ON unit_history(unit_id);
CREATE INDEX idx_unit_history_changed_at ON unit_history(changed_at);
CREATE INDEX idx_unit_history_changed_by ON unit_history(changed_by);

COMMENT ON TABLE unit_history IS 'Audit trail tracking all unit status transitions';
COMMENT ON COLUMN unit_history.old_status IS 'Previous status before the change';
COMMENT ON COLUMN unit_history.new_status IS 'New status after the change';
COMMENT ON COLUMN unit_history.changed_at IS 'Timestamp when the change was made';
