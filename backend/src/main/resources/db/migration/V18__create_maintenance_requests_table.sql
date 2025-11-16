-- V18: Create Maintenance Requests Table
-- Description: Creates maintenance_requests table for tenant-submitted maintenance requests
-- Author: Ultra BMS Development Team
-- Date: 2025-11-16
-- Story: 3.5 - Tenant Portal - Maintenance Request Submission

-- =====================================================
-- TABLE: maintenance_requests
-- Description: Tenant maintenance requests with lifecycle tracking
-- =====================================================
CREATE TABLE maintenance_requests (
    id UUID NOT NULL,
    request_number VARCHAR(20) NOT NULL,
    tenant_id UUID NOT NULL,
    unit_id UUID NOT NULL,
    property_id UUID NOT NULL,
    assigned_to UUID,

    -- Request details
    category VARCHAR(20) NOT NULL,
    priority VARCHAR(10) NOT NULL,
    title VARCHAR(100) NOT NULL,
    description VARCHAR(1000) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'SUBMITTED',

    -- Access preferences
    preferred_access_time VARCHAR(20) NOT NULL,
    preferred_access_date DATE NOT NULL,

    -- Timestamps
    submitted_at TIMESTAMP NOT NULL,
    assigned_at TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    closed_at TIMESTAMP,
    estimated_completion_date DATE,

    -- Attachments and work details (JSON arrays)
    attachments JSONB,
    work_notes VARCHAR(2000),
    completion_photos JSONB,

    -- Tenant feedback
    rating INTEGER,
    feedback VARCHAR(500),
    feedback_submitted_at TIMESTAMP,

    -- Audit fields from BaseEntity
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT pk_maintenance_requests PRIMARY KEY (id),
    CONSTRAINT uk_maintenance_request_number UNIQUE (request_number),
    CONSTRAINT ck_maintenance_rating CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5))
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Index for tenant's request lookups (most common query)
CREATE INDEX idx_maintenance_requests_tenant_id ON maintenance_requests(tenant_id);

-- Index for unit and property filtering
CREATE INDEX idx_maintenance_requests_unit_id ON maintenance_requests(unit_id);
CREATE INDEX idx_maintenance_requests_property_id ON maintenance_requests(property_id);

-- Index for status filtering (active requests)
CREATE INDEX idx_maintenance_requests_status ON maintenance_requests(status);

-- Index for category filtering and analytics
CREATE INDEX idx_maintenance_requests_category ON maintenance_requests(category);

-- Index for priority filtering
CREATE INDEX idx_maintenance_requests_priority ON maintenance_requests(priority);

-- Index for chronological sorting (newest first)
CREATE INDEX idx_maintenance_requests_submitted_at ON maintenance_requests(submitted_at DESC);

-- Index for request number lookups
CREATE INDEX idx_maintenance_requests_request_number ON maintenance_requests(request_number);

-- =====================================================
-- TABLE AND COLUMN COMMENTS
-- =====================================================

COMMENT ON TABLE maintenance_requests IS 'Tenant-submitted maintenance requests tracking the complete lifecycle from submission to completion with feedback';

-- Identification
COMMENT ON COLUMN maintenance_requests.id IS 'Primary key UUID';
COMMENT ON COLUMN maintenance_requests.request_number IS 'Unique request number in format MR-{YEAR}-{SEQUENCE} (e.g., MR-2025-0001)';

-- Relationships
COMMENT ON COLUMN maintenance_requests.tenant_id IS 'Tenant who submitted the request (FK to tenants.id)';
COMMENT ON COLUMN maintenance_requests.unit_id IS 'Unit where the issue is located (FK to units.id)';
COMMENT ON COLUMN maintenance_requests.property_id IS 'Property containing the unit (FK to properties.id)';
COMMENT ON COLUMN maintenance_requests.assigned_to IS 'Vendor assigned to handle the request (FK to users.id with VENDOR role), null until assigned';

-- Request details
COMMENT ON COLUMN maintenance_requests.category IS 'Issue category: PLUMBING, ELECTRICAL, HVAC, APPLIANCE, CARPENTRY, PEST_CONTROL, CLEANING, OTHER';
COMMENT ON COLUMN maintenance_requests.priority IS 'Urgency level: HIGH (safety/emergency), MEDIUM (important), LOW (non-critical)';
COMMENT ON COLUMN maintenance_requests.title IS 'Brief title of the issue (max 100 chars)';
COMMENT ON COLUMN maintenance_requests.description IS 'Detailed description of the issue (20-1000 chars)';
COMMENT ON COLUMN maintenance_requests.status IS 'Current status: SUBMITTED, ASSIGNED, IN_PROGRESS, COMPLETED, CLOSED, CANCELLED';

-- Access preferences
COMMENT ON COLUMN maintenance_requests.preferred_access_time IS 'Tenant preferred access time: IMMEDIATE, MORNING, AFTERNOON, EVENING, ANY_TIME';
COMMENT ON COLUMN maintenance_requests.preferred_access_date IS 'Tenant preferred access date (cannot be in the past)';

-- Timestamps
COMMENT ON COLUMN maintenance_requests.submitted_at IS 'When the request was submitted (auto-set on creation)';
COMMENT ON COLUMN maintenance_requests.assigned_at IS 'When the request was assigned to a vendor';
COMMENT ON COLUMN maintenance_requests.started_at IS 'When the vendor started work';
COMMENT ON COLUMN maintenance_requests.completed_at IS 'When the work was completed';
COMMENT ON COLUMN maintenance_requests.closed_at IS 'When the request was closed (after feedback or auto-closure)';
COMMENT ON COLUMN maintenance_requests.estimated_completion_date IS 'Vendor estimated completion date (provided when assigned)';

-- Attachments and work
COMMENT ON COLUMN maintenance_requests.attachments IS 'JSON array of attachment file URLs uploaded by tenant (max 5 photos)';
COMMENT ON COLUMN maintenance_requests.work_notes IS 'Work notes added by vendor after completion';
COMMENT ON COLUMN maintenance_requests.completion_photos IS 'JSON array of completion photo URLs uploaded by vendor (before/after)';

-- Feedback
COMMENT ON COLUMN maintenance_requests.rating IS 'Tenant rating of service (1-5 stars), submitted after completion';
COMMENT ON COLUMN maintenance_requests.feedback IS 'Tenant feedback comment (max 500 chars, optional)';
COMMENT ON COLUMN maintenance_requests.feedback_submitted_at IS 'When the tenant submitted feedback';

-- Audit
COMMENT ON COLUMN maintenance_requests.created_at IS 'Record creation timestamp (auto-managed by JPA auditing)';
COMMENT ON COLUMN maintenance_requests.updated_at IS 'Record last update timestamp (auto-managed by JPA auditing)';
COMMENT ON COLUMN maintenance_requests.version IS 'Optimistic locking version for concurrent update prevention';
