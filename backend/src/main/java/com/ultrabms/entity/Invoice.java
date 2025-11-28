package com.ultrabms.entity;

import com.ultrabms.entity.enums.InvoiceStatus;
import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
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
import org.hibernate.annotations.Type;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Invoice entity representing rent invoices for tenants.
 * Stores invoice details including amounts, dates, status, and payment tracking.
 *
 * Story 6.1: Rent Invoicing and Payment Management
 */
@Entity
@Table(
    name = "invoices",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_invoice_number", columnNames = {"invoice_number"})
    },
    indexes = {
        @Index(name = "idx_invoices_tenant_id", columnList = "tenant_id"),
        @Index(name = "idx_invoices_property_id", columnList = "property_id"),
        @Index(name = "idx_invoices_unit_id", columnList = "unit_id"),
        @Index(name = "idx_invoices_status", columnList = "status"),
        @Index(name = "idx_invoices_due_date", columnList = "due_date"),
        @Index(name = "idx_invoices_invoice_date", columnList = "invoice_date"),
        @Index(name = "idx_invoices_invoice_number", columnList = "invoice_number")
    }
)
@Data
@Builder
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class Invoice extends BaseEntity {

    // =================================================================
    // INVOICE IDENTIFICATION
    // =================================================================

    /**
     * Unique invoice number in format INV-{YEAR}-{SEQUENCE}
     * Example: INV-2025-0001
     * Auto-generated on entity creation
     */
    @NotBlank(message = "Invoice number cannot be blank")
    @Size(max = 20, message = "Invoice number must be less than 20 characters")
    @Column(name = "invoice_number", nullable = false, unique = true, length = 20)
    private String invoiceNumber;

    // =================================================================
    // TENANT AND PROPERTY REFERENCES
    // =================================================================

    /**
     * Tenant this invoice is for
     */
    @NotNull(message = "Tenant cannot be null")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    /**
     * Unit the invoice is for (denormalized for performance)
     */
    @NotNull(message = "Unit cannot be null")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unit_id", nullable = false)
    private Unit unit;

    /**
     * Property the invoice is for (denormalized for performance)
     */
    @NotNull(message = "Property cannot be null")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id", nullable = false)
    private Property property;

    /**
     * Lease ID associated with this invoice (optional, for tracking)
     */
    @Column(name = "lease_id")
    private UUID leaseId;

    // =================================================================
    // INVOICE DATES
    // =================================================================

    /**
     * Date the invoice was created/issued
     */
    @NotNull(message = "Invoice date is required")
    @Column(name = "invoice_date", nullable = false)
    private LocalDate invoiceDate;

    /**
     * Date the payment is due
     */
    @NotNull(message = "Due date is required")
    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    /**
     * Timestamp when invoice was sent to tenant
     */
    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    /**
     * Timestamp when invoice was fully paid
     */
    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    // =================================================================
    // AMOUNT BREAKDOWN
    // =================================================================

    /**
     * Base rent amount (AED)
     */
    @NotNull(message = "Base rent is required")
    @DecimalMin(value = "0.00", inclusive = true, message = "Base rent cannot be negative")
    @Column(name = "base_rent", precision = 12, scale = 2, nullable = false)
    private BigDecimal baseRent;

    /**
     * Service charges amount (AED)
     */
    @DecimalMin(value = "0.00", inclusive = true, message = "Service charges cannot be negative")
    @Column(name = "service_charges", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal serviceCharges = BigDecimal.ZERO;

    /**
     * Parking fees amount (AED)
     */
    @DecimalMin(value = "0.00", inclusive = true, message = "Parking fees cannot be negative")
    @Column(name = "parking_fees", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal parkingFees = BigDecimal.ZERO;

    /**
     * Additional charges as JSON array
     * Format: [{"description": "...", "amount": ...}, ...]
     */
    @Type(JsonType.class)
    @Column(name = "additional_charges", columnDefinition = "jsonb")
    @Builder.Default
    private List<AdditionalCharge> additionalCharges = new ArrayList<>();

    /**
     * Late fee amount applied (AED)
     */
    @DecimalMin(value = "0.00", inclusive = true, message = "Late fee cannot be negative")
    @Column(name = "late_fee", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal lateFee = BigDecimal.ZERO;

    /**
     * Total invoice amount (calculated: baseRent + serviceCharges + parkingFees + additionalCharges + lateFee)
     */
    @NotNull(message = "Total amount is required")
    @DecimalMin(value = "0.00", inclusive = true, message = "Total amount cannot be negative")
    @Column(name = "total_amount", precision = 12, scale = 2, nullable = false)
    private BigDecimal totalAmount;

    /**
     * Amount already paid
     */
    @DecimalMin(value = "0.00", inclusive = true, message = "Paid amount cannot be negative")
    @Column(name = "paid_amount", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal paidAmount = BigDecimal.ZERO;

    /**
     * Outstanding balance (calculated: totalAmount - paidAmount)
     */
    @DecimalMin(value = "0.00", inclusive = true, message = "Balance amount cannot be negative")
    @Column(name = "balance_amount", precision = 12, scale = 2)
    private BigDecimal balanceAmount;

    // =================================================================
    // STATUS AND TRACKING
    // =================================================================

    /**
     * Current invoice status
     */
    @NotNull(message = "Status cannot be null")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private InvoiceStatus status = InvoiceStatus.DRAFT;

    /**
     * Flag indicating if late fee has been applied
     */
    @Column(name = "late_fee_applied", nullable = false)
    @Builder.Default
    private Boolean lateFeeApplied = false;

    /**
     * Notes or remarks on the invoice
     */
    @Size(max = 500, message = "Notes must be less than 500 characters")
    @Column(name = "notes", length = 500)
    private String notes;

    /**
     * User who created this invoice
     */
    @Column(name = "created_by")
    private UUID createdBy;

    // =================================================================
    // PAYMENTS RELATIONSHIP
    // =================================================================

    /**
     * Payments made against this invoice
     */
    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Payment> payments = new ArrayList<>();

    // =================================================================
    // LIFECYCLE CALLBACKS
    // =================================================================

    /**
     * Pre-persist callback to set default values and calculate totals
     */
    @PrePersist
    protected void onCreate() {
        if (this.status == null) {
            this.status = InvoiceStatus.DRAFT;
        }
        if (this.serviceCharges == null) {
            this.serviceCharges = BigDecimal.ZERO;
        }
        if (this.parkingFees == null) {
            this.parkingFees = BigDecimal.ZERO;
        }
        if (this.lateFee == null) {
            this.lateFee = BigDecimal.ZERO;
        }
        if (this.paidAmount == null) {
            this.paidAmount = BigDecimal.ZERO;
        }
        if (this.lateFeeApplied == null) {
            this.lateFeeApplied = false;
        }
        if (this.additionalCharges == null) {
            this.additionalCharges = new ArrayList<>();
        }
        if (this.payments == null) {
            this.payments = new ArrayList<>();
        }

        // Calculate total and balance
        calculateTotals();
    }

    // =================================================================
    // HELPER METHODS
    // =================================================================

    /**
     * Calculate total amount and balance
     */
    public void calculateTotals() {
        BigDecimal additionalTotal = BigDecimal.ZERO;
        if (this.additionalCharges != null) {
            for (AdditionalCharge charge : this.additionalCharges) {
                if (charge.getAmount() != null) {
                    additionalTotal = additionalTotal.add(charge.getAmount());
                }
            }
        }

        this.totalAmount = (this.baseRent != null ? this.baseRent : BigDecimal.ZERO)
            .add(this.serviceCharges != null ? this.serviceCharges : BigDecimal.ZERO)
            .add(this.parkingFees != null ? this.parkingFees : BigDecimal.ZERO)
            .add(additionalTotal)
            .add(this.lateFee != null ? this.lateFee : BigDecimal.ZERO);

        this.balanceAmount = this.totalAmount.subtract(
            this.paidAmount != null ? this.paidAmount : BigDecimal.ZERO
        );
    }

    /**
     * Check if invoice is editable (DRAFT status only)
     */
    public boolean isEditable() {
        return this.status == InvoiceStatus.DRAFT;
    }

    /**
     * Check if invoice can receive payments
     */
    public boolean canReceivePayment() {
        return this.status == InvoiceStatus.SENT
            || this.status == InvoiceStatus.PARTIALLY_PAID
            || this.status == InvoiceStatus.OVERDUE;
    }

    /**
     * Check if invoice can be cancelled
     */
    public boolean canBeCancelled() {
        return this.status == InvoiceStatus.DRAFT
            || (this.status == InvoiceStatus.SENT && this.paidAmount.compareTo(BigDecimal.ZERO) == 0);
    }

    /**
     * Check if invoice can be sent
     */
    public boolean canBeSent() {
        return this.status == InvoiceStatus.DRAFT;
    }

    /**
     * Check if invoice is overdue
     */
    public boolean isOverdue() {
        if (this.status == InvoiceStatus.PAID || this.status == InvoiceStatus.CANCELLED) {
            return false;
        }
        return this.dueDate != null && LocalDate.now().isAfter(this.dueDate);
    }

    /**
     * Record a payment and update status
     */
    public void recordPayment(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Payment amount must be positive");
        }
        if (!canReceivePayment()) {
            throw new IllegalStateException("Invoice cannot receive payments in current status: " + this.status);
        }

        this.paidAmount = this.paidAmount.add(amount);
        this.balanceAmount = this.totalAmount.subtract(this.paidAmount);

        // Update status based on payment
        if (this.balanceAmount.compareTo(BigDecimal.ZERO) <= 0) {
            this.status = InvoiceStatus.PAID;
            this.paidAt = LocalDateTime.now();
        } else {
            this.status = InvoiceStatus.PARTIALLY_PAID;
        }
    }

    /**
     * Mark invoice as sent
     */
    public void markAsSent() {
        if (!canBeSent()) {
            throw new IllegalStateException("Invoice cannot be sent in current status: " + this.status);
        }
        this.status = InvoiceStatus.SENT;
        this.sentAt = LocalDateTime.now();
    }

    /**
     * Cancel the invoice
     */
    public void cancel() {
        if (!canBeCancelled()) {
            throw new IllegalStateException("Invoice cannot be cancelled in current status: " + this.status);
        }
        this.status = InvoiceStatus.CANCELLED;
    }

    /**
     * Apply late fee
     */
    public void applyLateFee(BigDecimal feeAmount) {
        if (feeAmount == null || feeAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Late fee amount must be positive");
        }
        if (this.lateFeeApplied) {
            throw new IllegalStateException("Late fee has already been applied");
        }
        if (!isOverdue()) {
            throw new IllegalStateException("Cannot apply late fee to non-overdue invoice");
        }

        this.lateFee = feeAmount;
        this.lateFeeApplied = true;
        calculateTotals();
    }

    /**
     * Mark as overdue
     */
    public void markAsOverdue() {
        if (this.status == InvoiceStatus.SENT || this.status == InvoiceStatus.PARTIALLY_PAID) {
            this.status = InvoiceStatus.OVERDUE;
        }
    }

    // =================================================================
    // INNER CLASS FOR ADDITIONAL CHARGES
    // =================================================================

    /**
     * Inner class representing an additional charge line item
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AdditionalCharge {
        private String description;
        private BigDecimal amount;
    }
}
