package com.ultrabms.entity;

import com.ultrabms.entity.enums.LeaseExtensionStatus;
import com.ultrabms.entity.enums.RentAdjustmentType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
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
 * LeaseExtension entity representing a lease extension record.
 * Tracks lease extensions including rent adjustments, approval workflow, and amendment documents.
 *
 * Story 3.6: Tenant Lease Extension and Renewal
 */
@Entity
@Table(
    name = "lease_extensions",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_extension_number", columnNames = {"extension_number"})
    },
    indexes = {
        @Index(name = "idx_lease_extensions_tenant_id", columnList = "tenant_id"),
        @Index(name = "idx_lease_extensions_status", columnList = "status"),
        @Index(name = "idx_lease_extensions_effective_date", columnList = "effective_date")
    }
)
@Data
@Builder
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class LeaseExtension extends BaseEntity {

    // =================================================================
    // IDENTIFICATION
    // =================================================================

    /**
     * Unique extension number (e.g., EXT-2025-0001)
     */
    @NotBlank(message = "Extension number is required")
    @Size(max = 20, message = "Extension number must be less than 20 characters")
    @Column(name = "extension_number", nullable = false, unique = true, length = 20)
    private String extensionNumber;

    /**
     * Tenant whose lease is being extended
     */
    @NotNull(message = "Tenant cannot be null")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    // =================================================================
    // DATE FIELDS
    // =================================================================

    /**
     * Previous lease end date (before extension)
     */
    @NotNull(message = "Previous end date is required")
    @Column(name = "previous_end_date", nullable = false)
    private LocalDate previousEndDate;

    /**
     * New lease end date (after extension)
     */
    @NotNull(message = "New end date is required")
    @Column(name = "new_end_date", nullable = false)
    private LocalDate newEndDate;

    /**
     * Effective date when new terms apply
     */
    @NotNull(message = "Effective date is required")
    @Column(name = "effective_date", nullable = false)
    private LocalDate effectiveDate;

    // =================================================================
    // RENT FIELDS
    // =================================================================

    /**
     * Previous monthly rent (before extension)
     */
    @NotNull(message = "Previous rent is required")
    @DecimalMin(value = "0.0", message = "Previous rent cannot be negative")
    @Column(name = "previous_rent", nullable = false, precision = 12, scale = 2)
    private BigDecimal previousRent;

    /**
     * New monthly rent (after extension)
     */
    @NotNull(message = "New rent is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "New rent must be positive")
    @Column(name = "new_rent", nullable = false, precision = 12, scale = 2)
    private BigDecimal newRent;

    /**
     * Type of rent adjustment applied
     */
    @NotNull(message = "Adjustment type is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "adjustment_type", nullable = false, length = 20)
    private RentAdjustmentType adjustmentType;

    /**
     * Adjustment value (percentage or flat amount)
     */
    @DecimalMin(value = "0.0", message = "Adjustment value cannot be negative")
    @Column(name = "adjustment_value", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal adjustmentValue = BigDecimal.ZERO;

    // =================================================================
    // TERMS
    // =================================================================

    /**
     * Renewal type (FIXED_TERM, MONTH_TO_MONTH, YEARLY)
     */
    @Size(max = 20, message = "Renewal type must be less than 20 characters")
    @Column(name = "renewal_type", length = 20)
    private String renewalType;

    /**
     * Enable automatic renewal at end of term
     */
    @Column(name = "auto_renewal", nullable = false)
    @Builder.Default
    private Boolean autoRenewal = false;

    /**
     * Special terms or conditions for this extension
     */
    @Size(max = 2000, message = "Special terms must be less than 2000 characters")
    @Column(name = "special_terms", columnDefinition = "TEXT")
    private String specialTerms;

    /**
     * Updated payment due date (day of month 1-28)
     */
    @Min(value = 1, message = "Payment due date must be between 1 and 28")
    @Max(value = 28, message = "Payment due date must be between 1 and 28")
    @Column(name = "payment_due_date")
    private Integer paymentDueDate;

    // =================================================================
    // WORKFLOW
    // =================================================================

    /**
     * Extension status (DRAFT, PENDING_APPROVAL, APPROVED, REJECTED, APPLIED)
     */
    @NotNull(message = "Status is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private LeaseExtensionStatus status = LeaseExtensionStatus.DRAFT;

    /**
     * User who approved the extension
     */
    @Column(name = "approved_by")
    private UUID approvedBy;

    /**
     * Timestamp when extension was approved
     */
    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    /**
     * Reason for rejection (if rejected)
     */
    @Size(max = 500, message = "Rejection reason must be less than 500 characters")
    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    /**
     * Timestamp when extension was applied to tenant record
     */
    @Column(name = "applied_at")
    private LocalDateTime appliedAt;

    // =================================================================
    // DOCUMENT
    // =================================================================

    /**
     * S3 path to amendment PDF document
     */
    @Size(max = 500, message = "Amendment document path must be less than 500 characters")
    @Column(name = "amendment_document_path", length = 500)
    private String amendmentDocumentPath;

    // =================================================================
    // AUDIT
    // =================================================================

    /**
     * User who created the extension
     */
    @Column(name = "extended_by")
    private UUID extendedBy;
}
