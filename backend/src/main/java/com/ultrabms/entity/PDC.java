package com.ultrabms.entity;

import com.ultrabms.entity.enums.NewPaymentMethod;
import com.ultrabms.entity.enums.PDCStatus;
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
 * PDC (Post-Dated Cheque) entity representing cheques received from tenants.
 * Tracks PDC lifecycle from receipt through deposit to clearance or bounce.
 *
 * Story 6.3: Post-Dated Cheque (PDC) Management
 */
@Entity
@Table(
    name = "pdcs",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_pdc_cheque_tenant",
            columnNames = {"cheque_number", "tenant_id"}
        )
    },
    indexes = {
        @Index(name = "idx_pdcs_tenant_id", columnList = "tenant_id"),
        @Index(name = "idx_pdcs_status", columnList = "status"),
        @Index(name = "idx_pdcs_cheque_date", columnList = "cheque_date"),
        @Index(name = "idx_pdcs_cheque_number", columnList = "cheque_number"),
        @Index(name = "idx_pdcs_deposit_date", columnList = "deposit_date"),
        @Index(name = "idx_pdcs_invoice_id", columnList = "invoice_id"),
        @Index(name = "idx_pdcs_lease_id", columnList = "lease_id"),
        @Index(name = "idx_pdcs_bank_name", columnList = "bank_name"),
        @Index(name = "idx_pdcs_status_cheque_date", columnList = "status, cheque_date")
    }
)
@Data
@Builder
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class PDC extends BaseEntity {

    // =================================================================
    // CHEQUE IDENTIFICATION
    // =================================================================

    /**
     * Cheque number from the physical cheque
     * Must be unique per tenant
     */
    @NotBlank(message = "Cheque number cannot be blank")
    @Size(min = 3, max = 50, message = "Cheque number must be between 3 and 50 characters")
    @Column(name = "cheque_number", nullable = false, length = 50)
    private String chequeNumber;

    /**
     * Bank name that issued the cheque
     */
    @NotBlank(message = "Bank name cannot be blank")
    @Size(max = 100, message = "Bank name must be less than 100 characters")
    @Column(name = "bank_name", nullable = false, length = 100)
    private String bankName;

    // =================================================================
    // TENANT AND RELATIONSHIPS
    // =================================================================

    /**
     * Tenant who issued this PDC
     */
    @NotNull(message = "Tenant cannot be null")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    /**
     * Invoice this PDC is linked to (optional)
     * Used for automatic payment recording on clear
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id")
    private Invoice invoice;

    /**
     * Lease ID associated with this PDC (optional)
     */
    @Column(name = "lease_id")
    private UUID leaseId;

    // =================================================================
    // AMOUNT AND DATES
    // =================================================================

    /**
     * Cheque amount (AED)
     */
    @NotNull(message = "Amount cannot be null")
    @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
    @Column(name = "amount", precision = 12, scale = 2, nullable = false)
    private BigDecimal amount;

    /**
     * Date printed on the cheque (post-dated)
     */
    @NotNull(message = "Cheque date is required")
    @Column(name = "cheque_date", nullable = false)
    private LocalDate chequeDate;

    /**
     * Date when PDC was deposited to bank
     */
    @Column(name = "deposit_date")
    private LocalDate depositDate;

    /**
     * Date when payment was confirmed/cleared
     */
    @Column(name = "cleared_date")
    private LocalDate clearedDate;

    /**
     * Date when cheque bounced
     */
    @Column(name = "bounced_date")
    private LocalDate bouncedDate;

    /**
     * Date when PDC was withdrawn/returned to tenant
     */
    @Column(name = "withdrawal_date")
    private LocalDate withdrawalDate;

    // =================================================================
    // STATUS AND TRACKING
    // =================================================================

    /**
     * Current PDC status
     */
    @NotNull(message = "Status cannot be null")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private PDCStatus status = PDCStatus.RECEIVED;

    /**
     * Reason for bounce (when status = BOUNCED)
     */
    @Size(max = 255, message = "Bounce reason must be less than 255 characters")
    @Column(name = "bounce_reason", length = 255)
    private String bounceReason;

    /**
     * Reason for withdrawal (when status = WITHDRAWN)
     */
    @Size(max = 255, message = "Withdrawal reason must be less than 255 characters")
    @Column(name = "withdrawal_reason", length = 255)
    private String withdrawalReason;

    /**
     * New payment method when PDC is withdrawn
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "new_payment_method", length = 20)
    private NewPaymentMethod newPaymentMethod;

    /**
     * Transaction ID for alternative payment (when withdrawn with bank transfer)
     */
    @Size(max = 100, message = "Transaction ID must be less than 100 characters")
    @Column(name = "transaction_id", length = 100)
    private String transactionId;

    // =================================================================
    // REPLACEMENT CHAIN
    // =================================================================

    /**
     * Reference to the replacement PDC (when this PDC is REPLACED)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "replacement_pdc_id")
    private PDC replacementPdc;

    /**
     * Reference to the original bounced PDC (when this is a replacement)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "original_pdc_id")
    private PDC originalPdc;

    // =================================================================
    // BANK ACCOUNT FOR DEPOSIT
    // =================================================================

    /**
     * Bank account ID where PDC was deposited (from Story 6.5)
     * Optional until Story 6.5 is implemented
     */
    @Column(name = "bank_account_id")
    private UUID bankAccountId;

    // =================================================================
    // NOTES AND METADATA
    // =================================================================

    /**
     * General notes about the PDC
     */
    @Size(max = 500, message = "Notes must be less than 500 characters")
    @Column(name = "notes", length = 500)
    private String notes;

    /**
     * User who registered this PDC
     */
    @NotNull(message = "Created by cannot be null")
    @Column(name = "created_by", nullable = false)
    private UUID createdBy;

    // =================================================================
    // LIFECYCLE CALLBACKS
    // =================================================================

    /**
     * Pre-persist callback to set default values
     */
    @PrePersist
    protected void onCreate() {
        if (this.status == null) {
            this.status = PDCStatus.RECEIVED;
        }
    }

    // =================================================================
    // STATUS TRANSITION METHODS
    // =================================================================

    /**
     * Check if PDC can be deposited
     * Only DUE status PDCs can be deposited
     */
    public boolean canBeDeposited() {
        return this.status == PDCStatus.DUE;
    }

    /**
     * Check if PDC can be cleared
     * Only DEPOSITED status PDCs can be cleared
     */
    public boolean canBeCleared() {
        return this.status == PDCStatus.DEPOSITED;
    }

    /**
     * Check if PDC can be bounced
     * Only DEPOSITED status PDCs can be marked as bounced
     */
    public boolean canBeBounced() {
        return this.status == PDCStatus.DEPOSITED;
    }

    /**
     * Check if PDC can be replaced
     * Only BOUNCED status PDCs can be replaced
     */
    public boolean canBeReplaced() {
        return this.status == PDCStatus.BOUNCED;
    }

    /**
     * Check if PDC can be withdrawn
     * Only RECEIVED or DUE status PDCs can be withdrawn
     */
    public boolean canBeWithdrawn() {
        return this.status == PDCStatus.RECEIVED || this.status == PDCStatus.DUE;
    }

    /**
     * Check if PDC can be cancelled
     * Only RECEIVED status PDCs can be cancelled
     */
    public boolean canBeCancelled() {
        return this.status == PDCStatus.RECEIVED;
    }

    /**
     * Check if PDC is in a final state
     */
    public boolean isInFinalState() {
        return this.status == PDCStatus.CLEARED
            || this.status == PDCStatus.CANCELLED
            || this.status == PDCStatus.REPLACED
            || this.status == PDCStatus.WITHDRAWN;
    }

    /**
     * Check if cheque date is within due window (7 days from today)
     */
    public boolean isWithinDueWindow() {
        if (this.chequeDate == null) {
            return false;
        }
        LocalDate today = LocalDate.now();
        LocalDate dueWindow = today.plusDays(7);
        return !this.chequeDate.isBefore(today) && !this.chequeDate.isAfter(dueWindow);
    }

    /**
     * Check if cheque date is past
     */
    public boolean isChequeOverdue() {
        if (this.chequeDate == null) {
            return false;
        }
        return this.chequeDate.isBefore(LocalDate.now());
    }

    /**
     * Transition to DUE status (automated by scheduler)
     */
    public void transitionToDue() {
        if (this.status != PDCStatus.RECEIVED) {
            throw new IllegalStateException("Cannot transition to DUE from status: " + this.status);
        }
        if (!isWithinDueWindow()) {
            throw new IllegalStateException("Cheque date is not within due window");
        }
        this.status = PDCStatus.DUE;
    }

    /**
     * Mark PDC as deposited
     */
    public void deposit(LocalDate depositDate, UUID bankAccountId) {
        if (!canBeDeposited()) {
            throw new IllegalStateException("PDC cannot be deposited in current status: " + this.status);
        }
        if (depositDate == null) {
            throw new IllegalArgumentException("Deposit date cannot be null");
        }
        this.depositDate = depositDate;
        this.bankAccountId = bankAccountId;
        this.status = PDCStatus.DEPOSITED;
    }

    /**
     * Mark PDC as cleared
     */
    public void clear(LocalDate clearedDate) {
        if (!canBeCleared()) {
            throw new IllegalStateException("PDC cannot be cleared in current status: " + this.status);
        }
        if (clearedDate == null) {
            throw new IllegalArgumentException("Cleared date cannot be null");
        }
        this.clearedDate = clearedDate;
        this.status = PDCStatus.CLEARED;
    }

    /**
     * Mark PDC as bounced
     */
    public void bounce(LocalDate bouncedDate, String bounceReason) {
        if (!canBeBounced()) {
            throw new IllegalStateException("PDC cannot be bounced in current status: " + this.status);
        }
        if (bouncedDate == null) {
            throw new IllegalArgumentException("Bounced date cannot be null");
        }
        if (bounceReason == null || bounceReason.isBlank()) {
            throw new IllegalArgumentException("Bounce reason cannot be blank");
        }
        this.bouncedDate = bouncedDate;
        this.bounceReason = bounceReason;
        this.status = PDCStatus.BOUNCED;
    }

    /**
     * Mark PDC as replaced (links to replacement PDC)
     */
    public void markAsReplaced(PDC replacementPdc) {
        if (!canBeReplaced()) {
            throw new IllegalStateException("PDC cannot be replaced in current status: " + this.status);
        }
        if (replacementPdc == null) {
            throw new IllegalArgumentException("Replacement PDC cannot be null");
        }
        this.replacementPdc = replacementPdc;
        this.status = PDCStatus.REPLACED;
    }

    /**
     * Withdraw PDC (return to tenant)
     */
    public void withdraw(LocalDate withdrawalDate, String withdrawalReason,
                         NewPaymentMethod newPaymentMethod, String transactionId) {
        if (!canBeWithdrawn()) {
            throw new IllegalStateException("PDC cannot be withdrawn in current status: " + this.status);
        }
        if (withdrawalDate == null) {
            throw new IllegalArgumentException("Withdrawal date cannot be null");
        }
        if (withdrawalReason == null || withdrawalReason.isBlank()) {
            throw new IllegalArgumentException("Withdrawal reason cannot be blank");
        }
        this.withdrawalDate = withdrawalDate;
        this.withdrawalReason = withdrawalReason;
        this.newPaymentMethod = newPaymentMethod;
        this.transactionId = transactionId;
        this.status = PDCStatus.WITHDRAWN;
    }

    /**
     * Cancel PDC
     */
    public void cancel() {
        if (!canBeCancelled()) {
            throw new IllegalStateException("PDC cannot be cancelled in current status: " + this.status);
        }
        this.status = PDCStatus.CANCELLED;
    }
}
