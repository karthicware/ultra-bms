-- V48: Create documents table for Document Management System
-- Story 7.2: Document Management System

-- Create enum types for document entity type and access level
-- Note: PostgreSQL enums are checked at insert/update time

-- Create the documents table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_number VARCHAR(20) NOT NULL UNIQUE,
    document_type VARCHAR(100) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description VARCHAR(500),
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(20) NOT NULL,
    entity_id UUID,
    expiry_date DATE,
    tags JSONB DEFAULT '[]'::jsonb,
    access_level VARCHAR(20) NOT NULL DEFAULT 'PUBLIC',
    version_number INTEGER NOT NULL DEFAULT 1,
    uploaded_by UUID NOT NULL,
    uploaded_at TIMESTAMP NOT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP,
    deleted_by UUID,
    expiry_notification_sent BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,

    -- Foreign key to users table for uploaded_by
    CONSTRAINT fk_documents_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(id),

    -- Check constraints for enums
    CONSTRAINT chk_documents_entity_type CHECK (entity_type IN ('PROPERTY', 'TENANT', 'VENDOR', 'ASSET', 'GENERAL')),
    CONSTRAINT chk_documents_access_level CHECK (access_level IN ('PUBLIC', 'INTERNAL', 'RESTRICTED'))
);

-- Create indexes for efficient querying
CREATE UNIQUE INDEX idx_documents_document_number ON documents(document_number);
CREATE INDEX idx_documents_entity_type ON documents(entity_type);
CREATE INDEX idx_documents_entity_id ON documents(entity_id);
CREATE INDEX idx_documents_expiry_date ON documents(expiry_date);
CREATE INDEX idx_documents_access_level ON documents(access_level);
CREATE INDEX idx_documents_is_deleted ON documents(is_deleted);
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX idx_documents_uploaded_at ON documents(uploaded_at DESC);
CREATE INDEX idx_documents_document_type ON documents(document_type);

-- Composite index for entity-based queries
CREATE INDEX idx_documents_entity_type_id ON documents(entity_type, entity_id) WHERE entity_id IS NOT NULL;

-- Index for searching (title, description)
CREATE INDEX idx_documents_title_search ON documents USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Index for expiring documents query (used by scheduler)
CREATE INDEX idx_documents_expiry_not_deleted ON documents(expiry_date)
    WHERE is_deleted = FALSE AND expiry_date IS NOT NULL;

-- Create sequence for document numbers
CREATE SEQUENCE IF NOT EXISTS document_number_seq START WITH 1 INCREMENT BY 1;

-- Add comments for documentation
COMMENT ON TABLE documents IS 'Centralized document repository for all entity types';
COMMENT ON COLUMN documents.document_number IS 'Unique document number in format DOC-YYYY-NNNN';
COMMENT ON COLUMN documents.entity_type IS 'Entity type: PROPERTY, TENANT, VENDOR, ASSET, or GENERAL';
COMMENT ON COLUMN documents.entity_id IS 'UUID of associated entity (NULL for GENERAL documents)';
COMMENT ON COLUMN documents.access_level IS 'Access control: PUBLIC (all auth), INTERNAL (staff), RESTRICTED (specific roles)';
COMMENT ON COLUMN documents.version_number IS 'Current version number (increments on replace)';
COMMENT ON COLUMN documents.tags IS 'JSON array of tags for categorization';
