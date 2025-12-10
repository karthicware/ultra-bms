-- SCP-2025-12-10: Fix naming convention for cheque/payment fields
-- numberOfCheques should represent actual cheques needed (which depends on firstMonthPaymentMethod)
-- numberOfPayments represents total payment installments (always what user selects, e.g., 12)

-- Step 1: Rename existing column to number_of_payments (semantic: total installments)
ALTER TABLE quotations RENAME COLUMN number_of_cheques TO number_of_payments;

-- Step 2: Add new number_of_cheques column (semantic: actual cheques needed)
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS number_of_cheques INTEGER;

-- Step 3: Calculate number_of_cheques based on payment method
-- If first_month_payment_method = 'CASH', cheques = payments - 1
-- If first_month_payment_method = 'CHEQUE', cheques = payments
UPDATE quotations
SET number_of_cheques = CASE
    WHEN first_month_payment_method = 'CASH' THEN GREATEST(0, number_of_payments - 1)
    ELSE number_of_payments
END
WHERE number_of_cheques IS NULL;

-- Step 4: Set default for number_of_cheques
ALTER TABLE quotations ALTER COLUMN number_of_cheques SET DEFAULT 12;

-- Step 5: Add comments for documentation
COMMENT ON COLUMN quotations.number_of_payments IS 'Total payment installments selected (1-12), e.g., 12 for monthly';
COMMENT ON COLUMN quotations.number_of_cheques IS 'Actual cheques required = numberOfPayments - 1 if first month is CASH, else same as numberOfPayments';
