-- SCP-2025-12-10: Add payment_due_date column to quotations table
-- This stores the day of month (1-31) for subsequent payment due dates

ALTER TABLE quotations
ADD COLUMN IF NOT EXISTS payment_due_date INTEGER DEFAULT 5;

-- Update existing rows that might have NULL
UPDATE quotations SET payment_due_date = 5 WHERE payment_due_date IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN quotations.payment_due_date IS 'Day of month (1-31) for subsequent payment due dates. Default is 5th of each month.';
