-- V49: Create document_versions table for version history
-- Story 7.2: Document Management System

-- Create the document_versions table for tracking document version history
CREATE TABLE document_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL,
    version_number INTEGER NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    uploaded_by UUID NOT NULL,
    uploaded_at TIMESTAMP NOT NULL,
    notes VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,

    -- Foreign keys
    CONSTRAINT fk_document_versions_document FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    CONSTRAINT fk_document_versions_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- Create indexes for efficient querying
CREATE INDEX idx_document_versions_document_id ON document_versions(document_id);
CREATE INDEX idx_document_versions_version_number ON document_versions(version_number);
CREATE INDEX idx_document_versions_uploaded_at ON document_versions(uploaded_at DESC);

-- Composite index for getting versions of a document
CREATE INDEX idx_document_versions_doc_version ON document_versions(document_id, version_number DESC);

-- Add comments for documentation
COMMENT ON TABLE document_versions IS 'Stores archived versions when documents are replaced';
COMMENT ON COLUMN document_versions.version_number IS 'The version number at the time this archive was created';
COMMENT ON COLUMN document_versions.file_path IS 'S3 path to the archived version file';
COMMENT ON COLUMN document_versions.notes IS 'Optional notes explaining the version change';
