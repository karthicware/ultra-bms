-- V61: Add first_month_total column to quotations table
-- SCP-2025-12-06: Custom first month total payment (includes one-time fees + first rent)
-- When user overrides the default calculation, this stores the custom amount

ALTER TABLE quotations
ADD COLUMN first_month_total DECIMAL(12, 2) NULL;

-- Add comment for documentation
COMMENT ON COLUMN quotations.first_month_total IS 'Custom first month total payment including one-time fees (security deposit, admin fee, service charges, parking) plus first rent payment. NULL means default calculation is used.';
