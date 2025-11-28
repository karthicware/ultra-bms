package com.ultrabms.entity;

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
import java.util.UUID;

/**
 * Payment entity representing payments made against invoices.
 * Stores payment details including amount, method, date, and reference.
 *
 * Story 6.1: Rent Invoicing and Payment Management
 */
@Entity
@Table(
    name = "payments",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_payment_number", columnNames = {"payment_number"})
    },
    indexes = {
        @Index(name = "idx_payments_invoice_id", columnList = "invoice_id"),
        @Index(name = "idx_payments_tenant_id", columnList = "tenant_id"),
        @Index(name = "idx_payments_payment_date", columnList = "payment_date"),
        @Index(name = "idx_payments_payment_method", columnList = "payment_method"),
        @Index(name = "idx_payments_payment_number", columnList = "payment_number")
    }
)
@Data
@Builder
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class Payment extends BaseEntity {

    // =================================================================
    // PAYMENT IDENTIFICATION
    // =================================================================

    /**
     * Unique payment number in format PMT-{YEAR}-{SEQUENCE}
     * Example: PMT-2025-0001
     * Auto-generated on entity creation
     */
    @NotBlank(message = "Payment number cannot be blank")
    @Size(max = 20, message = "Payment number must be less than 20 characters")
    @Column(name = "payment_number", nullable = false, unique = true, length = 20)
    private String paymentNumber;

    // =================================================================
    // INVOICE AND TENANT REFERENCES
    // =================================================================

    /**
     * Invoice this payment is for
     */
    @NotNull(message = "Invoice cannot be null")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id", nullable = false)
    private Invoice invoice;

    /**
     * Tenant who made the payment (denormalized for query performance)
     */
    @NotNull(message = "Tenant cannot be null")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    // =================================================================
    // PAYMENT DETAILS
    // =================================================================

    /**
     * Payment amount (AED)
     */
    @NotNull(message = "Payment amount is required")
    @DecimalMin(value = "0.01", message = "Payment amount must be greater than 0")
    @Column(name = "amount", precision = 12, scale = 2, nullable = false)
    private BigDecimal amount;

    /**
     * Payment method used
     */
    @NotNull(message = "Payment method is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false, length = 20)
    private PaymentMethod paymentMethod;

    /**
     * Date the payment was made/received
     */
    @NotNull(message = "Payment date is required")
    @Column(name = "payment_date", nullable = false)
    private LocalDate paymentDate;

    /**
     * Transaction reference (bank transfer ref, cheque number, card auth code, etc.)
     */
    @Size(max = 100, message = "Transaction reference must be less than 100 characters")
    @Column(name = "transaction_reference", length = 100)
    private String transactionReference;

    /**
     * Notes or remarks about the payment
     */
    @Size(max = 500, message = "Notes must be less than 500 characters")
    @Column(name = "notes", length = 500)
    private String notes;

    // =================================================================
    // RECEIPT INFORMATION
    // =================================================================

    /**
     * S3 path to the payment receipt PDF
     */
    @Size(max = 500, message = "Receipt file path must be less than 500 characters")
    @Column(name = "receipt_file_path", length = 500)
    private String receiptFilePath;

    // =================================================================
    // AUDIT FIELDS
    // =================================================================

    /**
     * User who recorded this payment
     */
    @NotNull(message = "Recorded by user is required")
    @Column(name = "recorded_by", nullable = false)
    private UUID recordedBy;

    // =================================================================
    // LIFECYCLE CALLBACKS
    // =================================================================

    /**
     * Pre-persist callback to validate payment
     */
    @PrePersist
    protected void onCreate() {
        // Validation is handled by entity constraints and service layer
    }

    // =================================================================
    // HELPER METHODS
    // =================================================================

    /**
     * Get the invoice number this payment is for
     */
    public String getInvoiceNumber() {
        return this.invoice != null ? this.invoice.getInvoiceNumber() : null;
    }

    /**
     * Get the tenant name
     */
    public String getTenantFullName() {
        if (this.tenant == null) {
            return null;
        }
        return this.tenant.getFirstName() + " " + this.tenant.getLastName();
    }

    /**
     * Check if payment has a receipt
     */
    public boolean hasReceipt() {
        return this.receiptFilePath != null && !this.receiptFilePath.isEmpty();
    }
}
