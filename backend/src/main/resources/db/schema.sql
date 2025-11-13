-- Optional Schema DDL
-- NOTE: Hibernate auto-generates schema via ddl-auto=update in development
-- This file is for explicit DDL if needed, or for reference

-- Example: Manual table creation (not needed with Hibernate auto-generation)
-- CREATE TABLE IF NOT EXISTS users (
--     id UUID PRIMARY KEY,
--     email VARCHAR(255) UNIQUE NOT NULL,
--     password_hash VARCHAR(255) NOT NULL,
--     first_name VARCHAR(100),
--     last_name VARCHAR(100),
--     role VARCHAR(50) NOT NULL,
--     active BOOLEAN DEFAULT TRUE,
--     mfa_enabled BOOLEAN DEFAULT FALSE,
--     created_at TIMESTAMP NOT NULL,
--     updated_at TIMESTAMP NOT NULL
-- );

-- Future: Use Flyway or Liquibase for versioned schema migrations in production
-- Flyway migration example: V1__initial_schema.sql, V2__add_property_table.sql, etc.
