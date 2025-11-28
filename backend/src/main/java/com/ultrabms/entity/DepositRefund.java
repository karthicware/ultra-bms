package com.ultrabms.entity;

import com.ultrabms.entity.enums.RefundMethod;
import com.ultrabms.entity.enums.RefundStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * DepositRefund entity representing the security deposit refund calculation and processing.
 * Tracks deductions, refund method, bank details, and processing status.
 *
 * Story 3.7: Tenant Checkout and Deposit Refund Processing
 */
@Entity
@Table(
    name = "deposit_refunds",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_refund_reference", columnNames = {"refund_reference"})
    },
    indexes = {
        @Index(name = "idx_refunds_checkout_id", columnList = "checkout_id"),
        @Index(name = "idx_refunds_status", columnList = "refund_status")
    }
)
@Data
@Builder
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class DepositRefund extends BaseEntity {

    // =================================================================
    // RELATIONSHIPS
    // =================================================================

    /**
     * Associated checkout record
     */
    @NotNull(message = "Checkout cannot be null")
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "checkout_id", nullable = false)
    private TenantCheckout checkout;

    // =================================================================
    // AMOUNTS
    // =================================================================

    /**
     * Original security deposit amount from tenant record
     */
    @NotNull(message = "Original deposit is required")
    @DecimalMin(value = "0.0", message = "Original deposit cannot be negative")
    @Column(name = "original_deposit", nullable = false, precision = 12, scale = 2)
    private BigDecimal originalDeposit;

    /**
     * Deductions as JSON array
     * Structure: [{type, description, amount, notes, autoCalculated, invoiceId}]
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "deductions", columnDefinition = "jsonb")
    private List<Object> deductions;

    /**
     * Total of all deductions
     */
    @NotNull(message = "Total deductions is required")
    @DecimalMin(value = "0.0", message = "Total deductions cannot be negative")
    @Column(name = "total_deductions", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal totalDeductions = BigDecimal.ZERO;

    /**
     * Net refund amount (original deposit - total deductions)
     * Will be 0 if deductions exceed deposit
     */
    @NotNull(message = "Net refund is required")
    @DecimalMin(value = "0.0", message = "Net refund cannot be negative")
    @Column(name = "net_refund", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal netRefund = BigDecimal.ZERO;

    /**
     * Amount owed by tenant (when deductions exceed deposit)
     */
    @DecimalMin(value = "0.0", message = "Amount owed cannot be negative")
    @Column(name = "amount_owed_by_tenant", precision = 12, scale = 2)
    private BigDecimal amountOwedByTenant;

    // =================================================================
    // REFUND METHOD
    // =================================================================

    /**
     * Method of refund payment
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "refund_method", length = 20)
    private RefundMethod refundMethod;

    /**
     * Date refund is scheduled/processed
     */
    @Column(name = "refund_date")
    private LocalDate refundDate;

    /**
     * Auto-generated reference number (e.g., REF-2025-0001)
     */
    @Size(max = 30, message = "Refund reference must be less than 30 characters")
    @Column(name = "refund_reference", unique = true, length = 30)
    private String refundReference;

    // =================================================================
    // BANK TRANSFER DETAILS
    // =================================================================

    /**
     * Bank name for transfer
     */
    @Size(max = 100, message = "Bank name must be less than 100 characters")
    @Column(name = "bank_name", length = 100)
    private String bankName;

    /**
     * Account holder name
     */
    @Size(max = 200, message = "Account holder name must be less than 200 characters")
    @Column(name = "account_holder_name", length = 200)
    private String accountHolderName;

    /**
     * IBAN (stored encrypted in production)
     * UAE format: AE + 2 digits + 19 alphanumeric = 23 chars
     */
    @Size(max = 50, message = "IBAN must be less than 50 characters")
    @Column(name = "iban", length = 50)
    private String iban;

    /**
     * SWIFT/BIC code for international transfers
     */
    @Size(max = 11, message = "SWIFT code must be less than 11 characters")
    @Column(name = "swift_code", length = 11)
    private String swiftCode;

    // =================================================================
    // CHEQUE DETAILS
    // =================================================================

    /**
     * Cheque number for record keeping
     */
    @Size(max = 50, message = "Cheque number must be less than 50 characters")
    @Column(name = "cheque_number", length = 50)
    private String chequeNumber;

    /**
     * Date on the cheque
     */
    @Column(name = "cheque_date")
    private LocalDate chequeDate;

    // =================================================================
    // STATUS AND WORKFLOW
    // =================================================================

    /**
     * Current refund status
     */
    @NotNull(message = "Refund status is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "refund_status", nullable = false, length = 20)
    @Builder.Default
    private RefundStatus refundStatus = RefundStatus.CALCULATED;

    /**
     * User who approved the refund (required for amounts > threshold)
     */
    @Column(name = "approved_by")
    private UUID approvedBy;

    /**
     * Timestamp when refund was approved
     */
    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    /**
     * Timestamp when refund was processed
     */
    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    /**
     * Transaction ID from bank/payment processor
     */
    @Size(max = 100, message = "Transaction ID must be less than 100 characters")
    @Column(name = "transaction_id", length = 100)
    private String transactionId;

    /**
     * Reason for hold or adjustment
     */
    @Size(max = 500, message = "Notes must be less than 500 characters")
    @Column(name = "notes", length = 500)
    private String notes;

    // =================================================================
    // DOCUMENT
    // =================================================================

    /**
     * S3 path to refund receipt PDF
     */
    @Size(max = 500, message = "Receipt path must be less than 500 characters")
    @Column(name = "receipt_path", length = 500)
    private String receiptPath;

    // =================================================================
    // HELPER METHODS
    // =================================================================

    /**
     * Check if refund requires approval (amount > 5000 AED)
     */
    public boolean requiresApproval() {
        return netRefund != null && netRefund.compareTo(new BigDecimal("5000")) > 0;
    }

    /**
     * Check if tenant owes money
     */
    public boolean tenantOwesMoney() {
        return amountOwedByTenant != null && amountOwedByTenant.compareTo(BigDecimal.ZERO) > 0;
    }

    /**
     * Check if bank details are complete for bank transfer
     */
    public boolean hasBankDetails() {
        return bankName != null && !bankName.isEmpty() &&
               accountHolderName != null && !accountHolderName.isEmpty() &&
               iban != null && !iban.isEmpty();
    }

    /**
     * Check if refund can be processed
     */
    public boolean canBeProcessed() {
        if (refundMethod == null) return false;
        if (refundMethod == RefundMethod.BANK_TRANSFER && !hasBankDetails()) return false;
        return refundStatus == RefundStatus.APPROVED ||
               (refundStatus == RefundStatus.CALCULATED && !requiresApproval());
    }

    /**
     * Mask IBAN for display (show only last 4 chars)
     */
    public String getMaskedIban() {
        if (iban == null || iban.length() <= 4) return iban;
        return "*".repeat(iban.length() - 4) + iban.substring(iban.length() - 4);
    }
}
