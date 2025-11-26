-- V33: Create vendors table
-- Story 5.1: Vendor Registration and Profile Management
-- Creates vendors table for external service provider management

-- Create sequence for vendor number generation
CREATE SEQUENCE IF NOT EXISTS vendor_number_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- Create vendors table
CREATE TABLE IF NOT EXISTS vendors (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Vendor Identification
    vendor_number VARCHAR(20) NOT NULL UNIQUE,

    -- Company Information
    company_name VARCHAR(200) NOT NULL,
    contact_person_name VARCHAR(100) NOT NULL,
    emirates_id_or_trade_license VARCHAR(50) NOT NULL,
    trn VARCHAR(15),

    -- Contact Information
    email VARCHAR(254) NOT NULL UNIQUE,
    phone_number VARCHAR(20) NOT NULL,
    secondary_phone_number VARCHAR(20),
    address VARCHAR(500),

    -- Service Information (JSONB for array storage)
    service_categories JSONB NOT NULL DEFAULT '[]'::jsonb,
    service_areas JSONB DEFAULT '[]'::jsonb,

    -- Payment Information
    hourly_rate DECIMAL(10, 2) NOT NULL,
    emergency_callout_fee DECIMAL(10, 2),
    payment_terms VARCHAR(10) NOT NULL DEFAULT 'NET_30',

    -- Status and Performance
    status VARCHAR(15) NOT NULL DEFAULT 'ACTIVE',
    rating DECIMAL(3, 2) DEFAULT 0.00,
    total_jobs_completed INTEGER DEFAULT 0,

    -- Soft Delete Fields
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP,
    deleted_by UUID,

    -- Audit Fields
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,

    -- Constraints
    CONSTRAINT fk_vendors_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id),
    CONSTRAINT ck_vendors_hourly_rate CHECK (hourly_rate >= 0),
    CONSTRAINT ck_vendors_emergency_fee CHECK (emergency_callout_fee IS NULL OR emergency_callout_fee >= 0),
    CONSTRAINT ck_vendors_rating CHECK (rating >= 0 AND rating <= 5),
    CONSTRAINT ck_vendors_total_jobs CHECK (total_jobs_completed >= 0),
    CONSTRAINT ck_vendors_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
    CONSTRAINT ck_vendors_payment_terms CHECK (payment_terms IN ('NET_15', 'NET_30', 'NET_45', 'NET_60')),
    CONSTRAINT ck_vendors_phone_e164 CHECK (phone_number ~ '^\+[1-9]\d{1,14}$'),
    CONSTRAINT ck_vendors_trn_format CHECK (trn IS NULL OR trn ~ '^\d{15}$')
);

-- Standard indexes for common query patterns
CREATE INDEX idx_vendors_company_name ON vendors(company_name);
CREATE INDEX idx_vendors_email ON vendors(email);
CREATE INDEX idx_vendors_status ON vendors(status);
CREATE INDEX idx_vendors_vendor_number ON vendors(vendor_number);
CREATE INDEX idx_vendors_rating ON vendors(rating DESC);
CREATE INDEX idx_vendors_is_deleted ON vendors(is_deleted);
CREATE INDEX idx_vendors_created_at ON vendors(created_at DESC);

-- GIN index for JSONB service_categories array searching
-- Enables efficient queries like: WHERE service_categories @> '["PLUMBING"]'
CREATE INDEX idx_vendors_service_categories ON vendors USING GIN (service_categories);

-- Partial unique index for email (only for non-deleted vendors)
-- Allows email reuse after soft delete
DROP INDEX IF EXISTS uk_vendor_email;
CREATE UNIQUE INDEX uk_vendor_email_active ON vendors(email) WHERE is_deleted = FALSE;

-- Comments for documentation
COMMENT ON TABLE vendors IS 'External service providers for maintenance work orders';
COMMENT ON COLUMN vendors.vendor_number IS 'Unique vendor number (format: VND-YYYY-NNNN)';
COMMENT ON COLUMN vendors.status IS 'Vendor status: ACTIVE (can receive work), INACTIVE (paused), SUSPENDED (compliance issue)';
COMMENT ON COLUMN vendors.payment_terms IS 'Payment terms: NET_15, NET_30, NET_45, NET_60';
COMMENT ON COLUMN vendors.service_categories IS 'JSON array of service categories: PLUMBING, ELECTRICAL, HVAC, APPLIANCE, CARPENTRY, PEST_CONTROL, CLEANING, PAINTING, LANDSCAPING, OTHER';
COMMENT ON COLUMN vendors.service_areas IS 'JSON array of property UUIDs the vendor services';
COMMENT ON COLUMN vendors.hourly_rate IS 'Hourly rate in AED';
COMMENT ON COLUMN vendors.emergency_callout_fee IS 'Emergency callout fee in AED';
COMMENT ON COLUMN vendors.rating IS 'Overall rating (0.00-5.00) calculated from work order feedback';
COMMENT ON COLUMN vendors.total_jobs_completed IS 'Count of completed work orders';
COMMENT ON COLUMN vendors.is_deleted IS 'Soft delete flag - excluded from queries when true';
COMMENT ON SEQUENCE vendor_number_seq IS 'Sequence for generating unique vendor numbers per year';
