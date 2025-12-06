-- SCP-2025-12-06: Add cheque breakdown fields to quotations table
-- Also adds unique constraint for lead_id to enforce 1:1 relationship

-- Add cheque breakdown fields
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS yearly_rent_amount DECIMAL(12,2);
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS number_of_cheques INTEGER DEFAULT 12;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS first_month_payment_method VARCHAR(20) DEFAULT 'CHEQUE';
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS cheque_breakdown TEXT;

-- Add unique constraint on lead_id to enforce 1:1 relationship
-- Note: This will fail if there are duplicate lead_ids - handle data cleanup before running
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uk_quotation_lead_id'
    ) THEN
        ALTER TABLE quotations ADD CONSTRAINT uk_quotation_lead_id UNIQUE (lead_id);
    END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN quotations.yearly_rent_amount IS 'Total yearly rent amount for cheque breakdown calculation';
COMMENT ON COLUMN quotations.number_of_cheques IS 'Number of post-dated cheques (1-12)';
COMMENT ON COLUMN quotations.first_month_payment_method IS 'First month payment method: CASH or CHEQUE';
COMMENT ON COLUMN quotations.cheque_breakdown IS 'JSON array of cheque breakdown items: [{chequeNumber, amount, dueDate}]';
COMMENT ON CONSTRAINT uk_quotation_lead_id ON quotations IS 'Enforces 1:1 relationship between Lead and Quotation';
