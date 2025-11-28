-- V37: Create expenses table
-- Story 6.2: Expense Management and Vendor Payments
-- Creates table for expense tracking, vendor payments, and cost management

-- ============================================================================
-- SEQUENCES
-- ============================================================================

-- Sequence for expense number generation
CREATE SEQUENCE IF NOT EXISTS expense_number_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- ============================================================================
-- EXPENSES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS expenses (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Expense Identification
    expense_number VARCHAR(20) NOT NULL UNIQUE,

    -- Category
    category VARCHAR(20) NOT NULL,

    -- Related Entities (all optional)
    property_id UUID,
    vendor_id UUID,
    work_order_id UUID,

    -- Amount and Date
    amount DECIMAL(12, 2) NOT NULL,
    expense_date DATE NOT NULL,

    -- Payment Information
    payment_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    payment_method VARCHAR(20),
    payment_date DATE,
    transaction_reference VARCHAR(100),

    -- Description
    description VARCHAR(500) NOT NULL,

    -- Receipt Information
    receipt_file_path VARCHAR(255),

    -- Audit Fields
    recorded_by UUID NOT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP,
    deleted_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,

    -- Foreign Key Constraints
    CONSTRAINT fk_expenses_property FOREIGN KEY (property_id) REFERENCES properties(id),
    CONSTRAINT fk_expenses_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(id),
    CONSTRAINT fk_expenses_work_order FOREIGN KEY (work_order_id) REFERENCES work_orders(id),
    CONSTRAINT fk_expenses_recorded_by FOREIGN KEY (recorded_by) REFERENCES users(id),
    CONSTRAINT fk_expenses_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id),

    -- Check Constraints
    CONSTRAINT ck_expenses_amount CHECK (amount > 0),
    CONSTRAINT ck_expenses_category CHECK (category IN ('MAINTENANCE', 'UTILITIES', 'SALARIES', 'SUPPLIES', 'INSURANCE', 'TAXES', 'OTHER')),
    CONSTRAINT ck_expenses_payment_status CHECK (payment_status IN ('PENDING', 'PAID')),
    CONSTRAINT ck_expenses_payment_method CHECK (payment_method IS NULL OR payment_method IN ('CASH', 'BANK_TRANSFER', 'CARD', 'CHEQUE', 'PDC', 'ONLINE')),
    CONSTRAINT ck_expenses_paid_fields CHECK (
        (payment_status = 'PENDING' AND payment_method IS NULL AND payment_date IS NULL)
        OR (payment_status = 'PAID' AND payment_method IS NOT NULL AND payment_date IS NOT NULL)
    )
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Standard indexes for common query patterns
CREATE INDEX idx_expenses_property_id ON expenses(property_id);
CREATE INDEX idx_expenses_vendor_id ON expenses(vendor_id);
CREATE INDEX idx_expenses_work_order_id ON expenses(work_order_id);
CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_expenses_payment_status ON expenses(payment_status);
CREATE INDEX idx_expenses_expense_date ON expenses(expense_date);
CREATE INDEX idx_expenses_expense_number ON expenses(expense_number);
CREATE INDEX idx_expenses_is_deleted ON expenses(is_deleted);
CREATE INDEX idx_expenses_created_at ON expenses(created_at DESC);

-- Composite index for pending payments by vendor (for batch payment page)
CREATE INDEX idx_expenses_pending_vendor ON expenses(vendor_id, payment_status, expense_date)
    WHERE payment_status = 'PENDING' AND is_deleted = FALSE;

-- Composite index for expense filtering
CREATE INDEX idx_expenses_filter ON expenses(category, payment_status, expense_date DESC)
    WHERE is_deleted = FALSE;

-- Partial index for active (non-deleted) expenses
CREATE INDEX idx_expenses_active ON expenses(expense_date DESC)
    WHERE is_deleted = FALSE;

-- Index for work order expense lookup (prevents duplicates)
CREATE UNIQUE INDEX idx_expenses_work_order_unique ON expenses(work_order_id)
    WHERE work_order_id IS NOT NULL AND is_deleted = FALSE;

-- ============================================================================
-- TABLE COMMENTS
-- ============================================================================

COMMENT ON TABLE expenses IS 'Expense records for cost tracking and vendor payments';
COMMENT ON COLUMN expenses.expense_number IS 'Unique expense number (format: EXP-YYYY-NNNN)';
COMMENT ON COLUMN expenses.category IS 'Expense category: MAINTENANCE, UTILITIES, SALARIES, SUPPLIES, INSURANCE, TAXES, OTHER';
COMMENT ON COLUMN expenses.property_id IS 'Optional property association for property-specific expenses';
COMMENT ON COLUMN expenses.vendor_id IS 'Optional vendor association for vendor payments';
COMMENT ON COLUMN expenses.work_order_id IS 'Optional work order link (auto-populated for work order expenses)';
COMMENT ON COLUMN expenses.amount IS 'Expense amount in AED (must be > 0)';
COMMENT ON COLUMN expenses.expense_date IS 'Date the expense was incurred';
COMMENT ON COLUMN expenses.payment_status IS 'Payment status: PENDING, PAID';
COMMENT ON COLUMN expenses.payment_method IS 'Payment method: CASH, BANK_TRANSFER, CARD, CHEQUE, PDC, ONLINE (set when paid)';
COMMENT ON COLUMN expenses.payment_date IS 'Date payment was made (set when paid)';
COMMENT ON COLUMN expenses.transaction_reference IS 'External reference (bank transfer ref, cheque number, etc.)';
COMMENT ON COLUMN expenses.description IS 'Description of the expense (required, max 500 chars)';
COMMENT ON COLUMN expenses.receipt_file_path IS 'S3 path to receipt file (format: /uploads/expenses/{expenseNumber}/{filename})';
COMMENT ON COLUMN expenses.recorded_by IS 'User who recorded this expense';
COMMENT ON COLUMN expenses.is_deleted IS 'Soft delete flag (only PENDING expenses can be deleted)';
COMMENT ON COLUMN expenses.deleted_at IS 'Timestamp of soft deletion';
COMMENT ON COLUMN expenses.deleted_by IS 'User who performed the soft deletion';
COMMENT ON SEQUENCE expense_number_seq IS 'Sequence for generating unique expense numbers per year';
