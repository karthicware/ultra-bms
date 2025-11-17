-- Add version columns to newly created tables for optimistic locking
-- These columns were missing from V23 migration

ALTER TABLE property_images
ADD COLUMN version BIGINT NOT NULL DEFAULT 0;

ALTER TABLE tenants
ADD COLUMN version BIGINT NOT NULL DEFAULT 0;

ALTER TABLE tenant_documents
ADD COLUMN version BIGINT NOT NULL DEFAULT 0;

ALTER TABLE unit_history
ADD COLUMN version BIGINT NOT NULL DEFAULT 0;

COMMENT ON COLUMN property_images.version IS 'Optimistic locking version for concurrent update prevention';
COMMENT ON COLUMN tenants.version IS 'Optimistic locking version for concurrent update prevention';
COMMENT ON COLUMN tenant_documents.version IS 'Optimistic locking version for concurrent update prevention';
COMMENT ON COLUMN unit_history.version IS 'Optimistic locking version for concurrent update prevention';
