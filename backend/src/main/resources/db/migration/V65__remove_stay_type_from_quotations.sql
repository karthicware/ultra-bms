-- SCP-2025-12-06: Remove stay_type column from quotations table
-- The stayType field is redundant because the quotation already has property/unit mapping
-- and the unit entity has bedroomCount which provides the stay type information

-- Drop the stay_type column from quotations table
ALTER TABLE quotations DROP COLUMN IF EXISTS stay_type;
