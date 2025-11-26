-- V34: Create vendor_documents table
-- Story 5.2: Vendor Document and License Management
-- Creates vendor_documents table for compliance document tracking with expiry notifications

-- Create vendor_documents table
CREATE TABLE IF NOT EXISTS vendor_documents (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Vendor Relationship
    vendor_id UUID NOT NULL,

    -- Document Type and Metadata
    document_type VARCHAR(20) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(100) NOT NULL,

    -- Expiry Information
    expiry_date DATE,
    notes VARCHAR(200),

    -- Audit Fields
    uploaded_by UUID NOT NULL,
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Soft Delete Fields
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP,
    deleted_by UUID,

    -- Expiry Notification Tracking
    expiry_notification_30_sent BOOLEAN NOT NULL DEFAULT FALSE,
    expiry_notification_15_sent BOOLEAN NOT NULL DEFAULT FALSE,

    -- Standard Audit Fields
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,

    -- Foreign Key Constraints
    CONSTRAINT fk_vendor_documents_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
    CONSTRAINT fk_vendor_documents_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(id),
    CONSTRAINT fk_vendor_documents_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id),

    -- Check Constraints
    CONSTRAINT ck_vendor_documents_type CHECK (document_type IN ('TRADE_LICENSE', 'INSURANCE', 'CERTIFICATION', 'ID_COPY')),
    CONSTRAINT ck_vendor_documents_file_size CHECK (file_size > 0 AND file_size <= 10485760), -- Max 10MB
    CONSTRAINT ck_vendor_documents_file_type CHECK (file_type IN ('application/pdf', 'image/jpeg', 'image/jpg', 'image/png'))
);

-- Standard indexes for common query patterns
CREATE INDEX idx_vendor_documents_vendor_id ON vendor_documents(vendor_id);
CREATE INDEX idx_vendor_documents_document_type ON vendor_documents(document_type);
CREATE INDEX idx_vendor_documents_expiry_date ON vendor_documents(expiry_date);
CREATE INDEX idx_vendor_documents_is_deleted ON vendor_documents(is_deleted);
CREATE INDEX idx_vendor_documents_uploaded_at ON vendor_documents(uploaded_at DESC);

-- Composite index for expiring documents query
-- Supports: SELECT * FROM vendor_documents WHERE expiry_date <= ? AND is_deleted = false
CREATE INDEX idx_vendor_documents_expiry_active ON vendor_documents(expiry_date, is_deleted)
    WHERE is_deleted = FALSE AND expiry_date IS NOT NULL;

-- Index for finding documents pending notifications
CREATE INDEX idx_vendor_documents_pending_30_notification ON vendor_documents(expiry_date)
    WHERE is_deleted = FALSE
    AND expiry_notification_30_sent = FALSE
    AND expiry_date IS NOT NULL;

CREATE INDEX idx_vendor_documents_pending_15_notification ON vendor_documents(expiry_date)
    WHERE is_deleted = FALSE
    AND expiry_notification_15_sent = FALSE
    AND expiry_date IS NOT NULL;

-- Comments for documentation
COMMENT ON TABLE vendor_documents IS 'Vendor compliance documents with expiry tracking and notification management';
COMMENT ON COLUMN vendor_documents.vendor_id IS 'Reference to parent vendor';
COMMENT ON COLUMN vendor_documents.document_type IS 'Document type: TRADE_LICENSE, INSURANCE, CERTIFICATION, ID_COPY';
COMMENT ON COLUMN vendor_documents.file_name IS 'Original file name as uploaded by user';
COMMENT ON COLUMN vendor_documents.file_path IS 'S3 path: /vendors/{vendorId}/documents/{uuid}-{fileName}';
COMMENT ON COLUMN vendor_documents.file_size IS 'File size in bytes (max 10MB)';
COMMENT ON COLUMN vendor_documents.file_type IS 'MIME type: application/pdf, image/jpeg, image/png';
COMMENT ON COLUMN vendor_documents.expiry_date IS 'Document expiry date (required for TRADE_LICENSE and INSURANCE)';
COMMENT ON COLUMN vendor_documents.notes IS 'Optional notes about the document (max 200 chars)';
COMMENT ON COLUMN vendor_documents.uploaded_by IS 'User ID who uploaded the document';
COMMENT ON COLUMN vendor_documents.uploaded_at IS 'Timestamp when document was uploaded';
COMMENT ON COLUMN vendor_documents.is_deleted IS 'Soft delete flag - file retained in S3 for audit';
COMMENT ON COLUMN vendor_documents.expiry_notification_30_sent IS 'Flag: 30-day expiry notification sent to PM';
COMMENT ON COLUMN vendor_documents.expiry_notification_15_sent IS 'Flag: 15-day expiry notification sent to vendor';
