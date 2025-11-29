-- ============================================================================
-- V54: Create Compliance Tracking Tables
-- Story 7.3: Compliance and Inspection Tracking
-- ============================================================================
-- Creates tables for:
-- - compliance_requirements: Regulatory compliance requirements
-- - compliance_schedules: Scheduled compliance items per property
-- - inspections: Inspection records
-- - violations: Compliance violations
-- - Sequences for auto-generated numbers
-- ============================================================================

-- ============================================================================
-- SEQUENCES FOR NUMBER GENERATION
-- AC #11: CMP-{YYYY}-{NNNN} format
-- AC #12: VIO-{YYYY}-{NNNN} format
-- ============================================================================

-- Sequence for compliance requirement numbers (CMP-YYYY-NNNN)
CREATE SEQUENCE IF NOT EXISTS compliance_requirement_number_seq
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9999
    CYCLE;

-- Sequence for violation numbers (VIO-YYYY-NNNN)
CREATE SEQUENCE IF NOT EXISTS violation_number_seq
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9999
    CYCLE;

-- Sequence for compliance schedule numbers (CMP-YYYY-NNNN)
CREATE SEQUENCE IF NOT EXISTS compliance_schedule_number_seq
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9999
    CYCLE;

-- ============================================================================
-- COMPLIANCE REQUIREMENTS TABLE
-- AC #1: ComplianceRequirement JPA entity
-- ============================================================================

CREATE TABLE compliance_requirements (
    id UUID PRIMARY KEY,
    requirement_number VARCHAR(20) NOT NULL UNIQUE,
    requirement_name VARCHAR(200) NOT NULL,
    category VARCHAR(30) NOT NULL,
    description VARCHAR(1000),
    applicable_properties JSONB,
    frequency VARCHAR(20) NOT NULL,
    authority_agency VARCHAR(200),
    penalty_description VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_by UUID REFERENCES users(id),
    deleted_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,

    -- Constraints
    CONSTRAINT chk_compliance_requirement_category CHECK (
        category IN ('SAFETY', 'FIRE', 'ELECTRICAL', 'PLUMBING', 'STRUCTURAL', 'ENVIRONMENTAL', 'LICENSING', 'OTHER')
    ),
    CONSTRAINT chk_compliance_requirement_frequency CHECK (
        frequency IN ('ONE_TIME', 'MONTHLY', 'QUARTERLY', 'SEMI_ANNUALLY', 'ANNUALLY', 'BIANNUALLY')
    ),
    CONSTRAINT chk_compliance_requirement_status CHECK (
        status IN ('ACTIVE', 'INACTIVE')
    )
);

-- Indexes for compliance_requirements
CREATE INDEX idx_compliance_requirements_category ON compliance_requirements(category);
CREATE INDEX idx_compliance_requirements_status ON compliance_requirements(status);
CREATE INDEX idx_compliance_requirements_frequency ON compliance_requirements(frequency);
CREATE INDEX idx_compliance_requirements_number ON compliance_requirements(requirement_number);

COMMENT ON TABLE compliance_requirements IS 'Regulatory compliance requirements that properties must meet';
COMMENT ON COLUMN compliance_requirements.requirement_number IS 'Unique requirement number: CMP-YYYY-NNNN';
COMMENT ON COLUMN compliance_requirements.applicable_properties IS 'JSON array of property UUIDs. NULL means all properties';

-- ============================================================================
-- COMPLIANCE SCHEDULES TABLE
-- AC #4: ComplianceSchedule entity
-- ============================================================================

CREATE TABLE compliance_schedules (
    id UUID PRIMARY KEY,
    schedule_number VARCHAR(50) UNIQUE,
    compliance_requirement_id UUID NOT NULL REFERENCES compliance_requirements(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    due_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'UPCOMING',
    completed_date DATE,
    completed_by UUID REFERENCES users(id),
    notes VARCHAR(1000),
    certificate_number VARCHAR(100),
    certificate_file_path VARCHAR(500),
    certificate_url VARCHAR(500),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_by UUID REFERENCES users(id),
    deleted_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,

    -- Constraints
    CONSTRAINT chk_compliance_schedule_status CHECK (
        status IN ('UPCOMING', 'DUE', 'COMPLETED', 'OVERDUE', 'EXEMPT')
    ),
    CONSTRAINT chk_compliance_schedule_completed CHECK (
        (status = 'COMPLETED' AND completed_date IS NOT NULL) OR
        (status != 'COMPLETED')
    )
);

-- Indexes for compliance_schedules
CREATE INDEX idx_compliance_schedules_requirement ON compliance_schedules(compliance_requirement_id);
CREATE INDEX idx_compliance_schedules_property ON compliance_schedules(property_id);
CREATE INDEX idx_compliance_schedules_due_date ON compliance_schedules(due_date);
CREATE INDEX idx_compliance_schedules_status ON compliance_schedules(status);
CREATE INDEX idx_compliance_schedules_completed_by ON compliance_schedules(completed_by);

-- Composite index for common queries
CREATE INDEX idx_compliance_schedules_property_status ON compliance_schedules(property_id, status);
CREATE INDEX idx_compliance_schedules_requirement_status ON compliance_schedules(compliance_requirement_id, status);

COMMENT ON TABLE compliance_schedules IS 'Scheduled compliance items for each property';
COMMENT ON COLUMN compliance_schedules.certificate_file_path IS 'S3 path to uploaded compliance certificate';

-- ============================================================================
-- INSPECTIONS TABLE
-- AC #6: Inspection entity
-- ============================================================================

CREATE TABLE inspections (
    id UUID PRIMARY KEY,
    compliance_schedule_id UUID NOT NULL REFERENCES compliance_schedules(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    inspector_name VARCHAR(200) NOT NULL,
    inspector_company VARCHAR(200),
    inspector_contact VARCHAR(200),
    notes VARCHAR(1000),
    scheduled_date DATE NOT NULL,
    inspection_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
    result VARCHAR(20),
    issues_found VARCHAR(1000),
    recommendations VARCHAR(1000),
    certificate_path VARCHAR(500),
    next_inspection_date DATE,
    remediation_work_order_id UUID,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_by UUID REFERENCES users(id),
    deleted_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,

    -- Constraints
    CONSTRAINT chk_inspection_status CHECK (
        status IN ('SCHEDULED', 'IN_PROGRESS', 'PASSED', 'FAILED', 'CANCELLED')
    ),
    CONSTRAINT chk_inspection_result CHECK (
        result IS NULL OR result IN ('PASSED', 'FAILED', 'PARTIAL_PASS')
    ),
    CONSTRAINT chk_inspection_completed CHECK (
        (status IN ('PASSED', 'FAILED') AND inspection_date IS NOT NULL AND result IS NOT NULL) OR
        (status NOT IN ('PASSED', 'FAILED'))
    )
);

-- Indexes for inspections
CREATE INDEX idx_inspections_schedule ON inspections(compliance_schedule_id);
CREATE INDEX idx_inspections_property ON inspections(property_id);
CREATE INDEX idx_inspections_scheduled_date ON inspections(scheduled_date);
CREATE INDEX idx_inspections_status ON inspections(status);
CREATE INDEX idx_inspections_result ON inspections(result);
CREATE INDEX idx_inspections_work_order ON inspections(remediation_work_order_id);

-- Composite index for common queries
CREATE INDEX idx_inspections_property_status ON inspections(property_id, status);

COMMENT ON TABLE inspections IS 'Scheduled and completed inspections for compliance';
COMMENT ON COLUMN inspections.remediation_work_order_id IS 'Work order created when inspection fails';

-- ============================================================================
-- VIOLATIONS TABLE
-- AC #9: Violation entity
-- ============================================================================

CREATE TABLE violations (
    id UUID PRIMARY KEY,
    violation_number VARCHAR(20) NOT NULL UNIQUE,
    compliance_schedule_id UUID NOT NULL REFERENCES compliance_schedules(id) ON DELETE CASCADE,
    violation_date DATE NOT NULL,
    description VARCHAR(1000) NOT NULL,
    fine_amount DECIMAL(12, 2),
    fine_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    remediation_work_order_id UUID,
    resolution_date DATE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_by UUID REFERENCES users(id),
    deleted_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,

    -- Constraints
    CONSTRAINT chk_violation_fine_status CHECK (
        fine_status IN ('PENDING', 'PAID', 'APPEALED', 'WAIVED')
    ),
    CONSTRAINT chk_violation_fine_amount CHECK (
        fine_amount IS NULL OR fine_amount >= 0
    )
);

-- Indexes for violations
CREATE INDEX idx_violations_schedule ON violations(compliance_schedule_id);
CREATE INDEX idx_violations_violation_date ON violations(violation_date);
CREATE INDEX idx_violations_fine_status ON violations(fine_status);
CREATE INDEX idx_violations_work_order ON violations(remediation_work_order_id);
CREATE INDEX idx_violations_number ON violations(violation_number);

COMMENT ON TABLE violations IS 'Compliance violations and associated fines';
COMMENT ON COLUMN violations.violation_number IS 'Unique violation number: VIO-YYYY-NNNN';
COMMENT ON COLUMN violations.fine_amount IS 'Fine amount in AED';

-- ============================================================================
-- GRANTS (if needed for specific database roles)
-- ============================================================================
-- GRANT SELECT, INSERT, UPDATE, DELETE ON compliance_requirements TO ultrabms_app;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON compliance_schedules TO ultrabms_app;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON inspections TO ultrabms_app;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON violations TO ultrabms_app;
-- GRANT USAGE, SELECT ON SEQUENCE compliance_requirement_number_seq TO ultrabms_app;
-- GRANT USAGE, SELECT ON SEQUENCE violation_number_seq TO ultrabms_app;
