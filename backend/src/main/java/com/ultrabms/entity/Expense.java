package com.ultrabms.entity;

import com.ultrabms.entity.enums.ExpenseCategory;
import com.ultrabms.entity.enums.ExpensePaymentStatus;
import com.ultrabms.entity.enums.PaymentMethod;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Expense entity representing costs and vendor payments.
 * Stores expense details including category, amounts, payment status, and optional receipts.
 *
 * Story 6.2: Expense Management and Vendor Payments
 * AC #1: Expense Entity with UUID, expenseNumber (EXP-YYYY-NNNN), category enum,
 *        propertyId, vendorId, workOrderId, amount, expenseDate, paymentStatus,
 *        paymentMethod, paymentDate, description, receiptFilePath, recordedBy, timestamps, indexes
 */
@Entity
@Table(
    name = "expenses",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_expense_number", columnNames = {"expense_number"})
    },
    indexes = {
        @Index(name = "idx_expenses_property_id", columnList = "property_id"),
        @Index(name = "idx_expenses_vendor_id", columnList = "vendor_id"),
        @Index(name = "idx_expenses_work_order_id", columnList = "work_order_id"),
        @Index(name = "idx_expenses_category", columnList = "category"),
        @Index(name = "idx_expenses_payment_status", columnList = "payment_status"),
        @Index(name = "idx_expenses_expense_date", columnList = "expense_date"),
        @Index(name = "idx_expenses_expense_number", columnList = "expense_number"),
        @Index(name = "idx_expenses_is_deleted", columnList = "is_deleted")
    }
)
@Data
@Builder
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class Expense extends BaseEntity {

    // =================================================================
    // EXPENSE IDENTIFICATION
    // =================================================================

    /**
     * Unique expense number in format EXP-{YEAR}-{SEQUENCE}
     * Example: EXP-2025-0001
     * Auto-generated on entity creation
     */
    @NotBlank(message = "Expense number cannot be blank")
    @Size(max = 20, message = "Expense number must be less than 20 characters")
    @Column(name = "expense_number", nullable = false, unique = true, length = 20)
    private String expenseNumber;

    // =================================================================
    // CATEGORY
    // =================================================================

    /**
     * Expense category for classification
     */
    @NotNull(message = "Category is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 20)
    private ExpenseCategory category;

    // =================================================================
    // RELATED ENTITIES (OPTIONAL)
    // =================================================================

    /**
     * Property this expense is associated with (optional - for property-specific expenses)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id")
    private Property property;

    /**
     * Vendor this expense is for (optional - for vendor payments)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id")
    private Vendor vendor;

    /**
     * Work order this expense is linked to (optional - for work order related expenses)
     * Auto-populated when expense is created from completed work order
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "work_order_id")
    private WorkOrder workOrder;

    // =================================================================
    // AMOUNT AND DATES
    // =================================================================

    /**
     * Expense amount (AED)
     */
    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", inclusive = true, message = "Amount must be greater than 0")
    @Column(name = "amount", precision = 12, scale = 2, nullable = false)
    private BigDecimal amount;

    /**
     * Date the expense was incurred
     */
    @NotNull(message = "Expense date is required")
    @Column(name = "expense_date", nullable = false)
    private LocalDate expenseDate;

    // =================================================================
    // PAYMENT INFORMATION
    // =================================================================

    /**
     * Current payment status
     */
    @NotNull(message = "Payment status is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false, length = 20)
    @Builder.Default
    private ExpensePaymentStatus paymentStatus = ExpensePaymentStatus.PENDING;

    /**
     * Method used for payment (populated when expense is paid)
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", length = 20)
    private PaymentMethod paymentMethod;

    /**
     * Date when payment was made (populated when expense is paid)
     */
    @Column(name = "payment_date")
    private LocalDate paymentDate;

    /**
     * Transaction reference for payment tracking
     */
    @Size(max = 100, message = "Transaction reference must be less than 100 characters")
    @Column(name = "transaction_reference", length = 100)
    private String transactionReference;

    // =================================================================
    // DESCRIPTION AND NOTES
    // =================================================================

    /**
     * Description of the expense
     */
    @NotBlank(message = "Description is required")
    @Size(max = 500, message = "Description must be less than 500 characters")
    @Column(name = "description", nullable = false, length = 500)
    private String description;

    // =================================================================
    // RECEIPT INFORMATION
    // =================================================================

    /**
     * S3 path to receipt file
     * Format: /uploads/expenses/{expenseNumber}/{filename}
     */
    @Size(max = 255, message = "Receipt file path must be less than 255 characters")
    @Column(name = "receipt_file_path", length = 255)
    private String receiptFilePath;

    // =================================================================
    // AUDIT FIELDS
    // =================================================================

    /**
     * User who recorded this expense
     */
    @NotNull(message = "Recorded by cannot be null")
    @Column(name = "recorded_by", nullable = false)
    private UUID recordedBy;

    /**
     * Soft delete flag
     */
    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private Boolean isDeleted = false;

    /**
     * Timestamp when expense was deleted
     */
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    /**
     * User who deleted the expense
     */
    @Column(name = "deleted_by")
    private UUID deletedBy;

    // =================================================================
    // LIFECYCLE CALLBACKS
    // =================================================================

    /**
     * Pre-persist callback to set default values
     */
    @PrePersist
    protected void onCreate() {
        if (this.paymentStatus == null) {
            this.paymentStatus = ExpensePaymentStatus.PENDING;
        }
        if (this.isDeleted == null) {
            this.isDeleted = false;
        }
    }

    // =================================================================
    // HELPER METHODS
    // =================================================================

    /**
     * Check if expense can be edited (PENDING status and not deleted)
     */
    public boolean isEditable() {
        return this.paymentStatus == ExpensePaymentStatus.PENDING && !this.isDeleted;
    }

    /**
     * Check if expense can be paid
     */
    public boolean canBePaid() {
        return this.paymentStatus == ExpensePaymentStatus.PENDING && !this.isDeleted;
    }

    /**
     * Check if expense can be deleted
     */
    public boolean canBeDeleted() {
        return this.paymentStatus == ExpensePaymentStatus.PENDING && !this.isDeleted;
    }

    /**
     * Mark expense as paid
     *
     * @param paymentMethod Method used for payment
     * @param paymentDate Date of payment
     * @param transactionReference Optional transaction reference
     */
    public void markAsPaid(PaymentMethod paymentMethod, LocalDate paymentDate, String transactionReference) {
        if (!canBePaid()) {
            throw new IllegalStateException("Expense cannot be paid in current status: " + this.paymentStatus);
        }

        this.paymentStatus = ExpensePaymentStatus.PAID;
        this.paymentMethod = paymentMethod;
        this.paymentDate = paymentDate;
        this.transactionReference = transactionReference;
    }

    /**
     * Soft delete the expense
     *
     * @param deletedByUserId User performing the deletion
     */
    public void softDelete(UUID deletedByUserId) {
        if (!canBeDeleted()) {
            throw new IllegalStateException("Expense cannot be deleted in current status: " + this.paymentStatus);
        }

        this.isDeleted = true;
        this.deletedAt = LocalDateTime.now();
        this.deletedBy = deletedByUserId;
    }

    /**
     * Get vendor name safely
     */
    public String getVendorCompanyName() {
        return this.vendor != null ? this.vendor.getCompanyName() : null;
    }

    /**
     * Get property name safely
     */
    public String getPropertyName() {
        return this.property != null ? this.property.getName() : null;
    }

    /**
     * Get work order number safely
     */
    public String getWorkOrderNumber() {
        return this.workOrder != null ? this.workOrder.getWorkOrderNumber() : null;
    }
}
