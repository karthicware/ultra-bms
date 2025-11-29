-- Fix Flyway Schema History for V38 Migration
-- This script removes the failed V38 migration entry from flyway_schema_history
-- so that the corrected migration can be run again.

-- Remove the failed V38 migration entry
DELETE FROM flyway_schema_history 
WHERE version = '38' 
  AND script = 'V38__add_user_management_fields.sql';

-- Verify the deletion
SELECT * FROM flyway_schema_history 
WHERE version = '38';

-- The query above should return no rows if successful.
-- Now you can restart the Spring Boot application and V38 will run with the corrected SQL.
