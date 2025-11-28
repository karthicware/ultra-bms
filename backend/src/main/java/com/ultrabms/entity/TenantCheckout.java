package com.ultrabms.entity;

import com.ultrabms.entity.enums.CheckoutReason;
import com.ultrabms.entity.enums.CheckoutStatus;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * TenantCheckout entity representing a tenant checkout process.
 * Tracks the complete checkout workflow from notice to completion.
 *
 * Story 3.7: Tenant Checkout and Deposit Refund Processing
 */
@Entity
@Table(
    name = "tenant_checkouts",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_checkout_number", columnNames = {"checkout_number"})
    },
    indexes = {
        @Index(name = "idx_checkouts_tenant_id", columnList = "tenant_id"),
        @Index(name = "idx_checkouts_property_id", columnList = "property_id"),
        @Index(name = "idx_checkouts_status", columnList = "status"),
        @Index(name = "idx_checkouts_move_out_date", columnList = "expected_move_out_date")
    }
)
@Data
@Builder
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class TenantCheckout extends BaseEntity {

    // =================================================================
    // IDENTIFICATION
    // =================================================================

    /**
     * Unique checkout number (e.g., CHK-2025-0001)
     */
    @NotBlank(message = "Checkout number is required")
    @Size(max = 20, message = "Checkout number must be less than 20 characters")
    @Column(name = "checkout_number", nullable = false, unique = true, length = 20)
    private String checkoutNumber;

    /**
     * Tenant being checked out
     */
    @NotNull(message = "Tenant cannot be null")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    /**
     * Property the tenant is leaving
     */
    @NotNull(message = "Property cannot be null")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id", nullable = false)
    private Property property;

    /**
     * Unit the tenant is vacating
     */
    @NotNull(message = "Unit cannot be null")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unit_id", nullable = false)
    private Unit unit;

    // =================================================================
    // NOTICE DETAILS
    // =================================================================

    /**
     * Date tenant gave notice to vacate
     */
    @NotNull(message = "Notice date is required")
    @Column(name = "notice_date", nullable = false)
    private LocalDate noticeDate;

    /**
     * Expected move-out date
     */
    @NotNull(message = "Expected move-out date is required")
    @Column(name = "expected_move_out_date", nullable = false)
    private LocalDate expectedMoveOutDate;

    /**
     * Actual move-out date (when confirmed)
     */
    @Column(name = "actual_move_out_date")
    private LocalDate actualMoveOutDate;

    /**
     * Reason for checkout
     */
    @NotNull(message = "Checkout reason is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "checkout_reason", nullable = false, length = 30)
    private CheckoutReason checkoutReason;

    /**
     * Additional notes about checkout reason (required for OTHER)
     */
    @Size(max = 500, message = "Reason notes must be less than 500 characters")
    @Column(name = "reason_notes", length = 500)
    private String reasonNotes;

    // =================================================================
    // INSPECTION DETAILS
    // =================================================================

    /**
     * Scheduled inspection date
     */
    @Column(name = "inspection_date")
    private LocalDate inspectionDate;

    /**
     * Inspection time slot or specific time
     */
    @Size(max = 20, message = "Inspection time must be less than 20 characters")
    @Column(name = "inspection_time", length = 20)
    private String inspectionTime;

    /**
     * User assigned to perform inspection
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inspector_id")
    private User inspector;

    /**
     * Inspection checklist data stored as JSON
     * Structure: [{name, displayName, items: [{name, displayName, condition, damageDescription, repairCost}]}]
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "inspection_checklist", columnDefinition = "jsonb")
    private List<Object> inspectionChecklist;

    /**
     * Inspection photos metadata stored as JSON
     * Structure: [{id, fileName, filePath, fileSize, section, photoType, caption, uploadedAt}]
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "inspection_photos", columnDefinition = "jsonb")
    private List<Object> inspectionPhotos;

    /**
     * Overall condition rating (1-5)
     */
    @Column(name = "overall_condition")
    private Integer overallCondition;

    /**
     * General notes from inspection
     */
    @Size(max = 2000, message = "Inspection notes must be less than 2000 characters")
    @Column(name = "inspection_notes", columnDefinition = "TEXT")
    private String inspectionNotes;

    // =================================================================
    // DEPOSIT REFUND
    // =================================================================

    /**
     * Associated deposit refund record
     */
    @OneToOne(mappedBy = "checkout", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private DepositRefund depositRefund;

    // =================================================================
    // SETTLEMENT
    // =================================================================

    /**
     * Settlement type (FULL or PARTIAL)
     */
    @Size(max = 20, message = "Settlement type must be less than 20 characters")
    @Column(name = "settlement_type", length = 20)
    private String settlementType;

    /**
     * Notes about settlement decisions
     */
    @Size(max = 1000, message = "Settlement notes must be less than 1000 characters")
    @Column(name = "settlement_notes", columnDefinition = "TEXT")
    private String settlementNotes;

    // =================================================================
    // WORKFLOW STATUS
    // =================================================================

    /**
     * Current checkout status
     */
    @NotNull(message = "Status is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private CheckoutStatus status = CheckoutStatus.PENDING;

    /**
     * Timestamp when checkout was completed
     */
    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    /**
     * User who completed the checkout
     */
    @Column(name = "completed_by")
    private UUID completedBy;

    // =================================================================
    // DOCUMENTS
    // =================================================================

    /**
     * S3 path to inspection report PDF
     */
    @Size(max = 500, message = "Inspection report path must be less than 500 characters")
    @Column(name = "inspection_report_path", length = 500)
    private String inspectionReportPath;

    /**
     * S3 path to deposit statement PDF
     */
    @Size(max = 500, message = "Deposit statement path must be less than 500 characters")
    @Column(name = "deposit_statement_path", length = 500)
    private String depositStatementPath;

    /**
     * S3 path to final settlement PDF
     */
    @Size(max = 500, message = "Final settlement path must be less than 500 characters")
    @Column(name = "final_settlement_path", length = 500)
    private String finalSettlementPath;

    // =================================================================
    // AUDIT
    // =================================================================

    /**
     * User who initiated the checkout
     */
    @NotNull(message = "Created by is required")
    @Column(name = "created_by", nullable = false)
    private UUID createdBy;

    // =================================================================
    // HELPER METHODS
    // =================================================================

    /**
     * Check if inspection is complete
     */
    public boolean isInspectionComplete() {
        return inspectionChecklist != null && !inspectionChecklist.isEmpty();
    }

    /**
     * Check if checkout can be completed
     */
    public boolean canBeCompleted() {
        return status == CheckoutStatus.REFUND_PROCESSED ||
               (depositRefund != null && depositRefund.getNetRefund() != null);
    }

    /**
     * Check if checkout is in an editable state
     */
    public boolean isEditable() {
        return status != CheckoutStatus.COMPLETED && status != CheckoutStatus.ON_HOLD;
    }
}
