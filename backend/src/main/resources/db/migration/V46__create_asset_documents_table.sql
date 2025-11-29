-- V46: Create asset_documents table
-- Story 7.1: Asset Registry and Tracking
-- Creates table for asset document attachments (manuals, warranties, invoices)

-- ============================================================================
-- ASSET_DOCUMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS asset_documents (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Asset Association
    asset_id UUID NOT NULL,

    -- Document Information
    document_type VARCHAR(30) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    content_type VARCHAR(100),

    -- Upload Information
    uploaded_by UUID NOT NULL,
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Audit Fields
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,

    -- Foreign Key Constraints
    CONSTRAINT fk_asset_documents_asset FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
    CONSTRAINT fk_asset_documents_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(id),

    -- Check Constraints
    CONSTRAINT ck_asset_documents_type CHECK (document_type IN (
        'MANUAL', 'WARRANTY', 'PURCHASE_INVOICE', 'SPECIFICATION', 'OTHER'
    )),
    CONSTRAINT ck_asset_documents_file_size CHECK (file_size > 0 AND file_size <= 10485760) -- Max 10MB
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Standard indexes
CREATE INDEX idx_asset_documents_asset_id ON asset_documents(asset_id);
CREATE INDEX idx_asset_documents_document_type ON asset_documents(document_type);
CREATE INDEX idx_asset_documents_uploaded_at ON asset_documents(uploaded_at DESC);

-- Composite index for asset document listing
CREATE INDEX idx_asset_documents_asset_type ON asset_documents(asset_id, document_type);

-- ============================================================================
-- TABLE COMMENTS
-- ============================================================================

COMMENT ON TABLE asset_documents IS 'Documents attached to assets (manuals, warranties, invoices, etc.)';
COMMENT ON COLUMN asset_documents.asset_id IS 'Asset this document belongs to';
COMMENT ON COLUMN asset_documents.document_type IS 'Type: MANUAL, WARRANTY, PURCHASE_INVOICE, SPECIFICATION, OTHER';
COMMENT ON COLUMN asset_documents.file_name IS 'Original file name';
COMMENT ON COLUMN asset_documents.file_path IS 'S3 storage path: /uploads/assets/{assetId}/documents/{filename}';
COMMENT ON COLUMN asset_documents.file_size IS 'File size in bytes (max 10MB)';
COMMENT ON COLUMN asset_documents.content_type IS 'MIME type (application/pdf, image/jpeg, image/png)';
COMMENT ON COLUMN asset_documents.uploaded_by IS 'User who uploaded this document';
COMMENT ON COLUMN asset_documents.uploaded_at IS 'Timestamp of upload';
