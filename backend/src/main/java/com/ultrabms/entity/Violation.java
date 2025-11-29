package com.ultrabms.entity;

import com.ultrabms.entity.enums.FineStatus;
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
 * Violation entity representing compliance violations.
 * Links to a ComplianceSchedule and tracks fine status and remediation.
 *
 * Story 7.3: Compliance and Inspection Tracking
 * AC #9: Violation entity
 */
@Entity
@Table(
    name = "violations",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_violation_number", columnNames = {"violation_number"})
    },
    indexes = {
        @Index(name = "idx_violations_schedule", columnList = "compliance_schedule_id"),
        @Index(name = "idx_violations_violation_date", columnList = "violation_date"),
        @Index(name = "idx_violations_fine_status", columnList = "fine_status"),
        @Index(name = "idx_violations_work_order", columnList = "remediation_work_order_id"),
        @Index(name = "idx_violations_number", columnList = "violation_number")
    }
)
@Data
@Builder
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class Violation extends BaseEntity {

    // =================================================================
    // VIOLATION IDENTIFICATION
    // =================================================================

    /**
     * Unique violation number in format VIO-{YEAR}-{SEQUENCE}
     * Example: VIO-2025-0001
     * Auto-generated on entity creation
     * AC #12: violationNumber format
     */
    @NotBlank(message = "Violation number cannot be blank")
    @Size(max = 20, message = "Violation number must be less than 20 characters")
    @Column(name = "violation_number", nullable = false, unique = true, length = 20)
    private String violationNumber;

    // =================================================================
    // RELATIONSHIPS
    // =================================================================

    /**
     * Reference to the compliance schedule this violation is for
     */
    @NotNull(message = "Compliance schedule is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "compliance_schedule_id", nullable = false)
    private ComplianceSchedule complianceSchedule;

    // =================================================================
    // VIOLATION DETAILS
    // =================================================================

    /**
     * Date when the violation occurred/was recorded
     */
    @NotNull(message = "Violation date is required")
    @Column(name = "violation_date", nullable = false)
    private LocalDate violationDate;

    /**
     * Description of the violation
     */
    @NotBlank(message = "Description is required")
    @Size(max = 1000, message = "Description must be less than 1000 characters")
    @Column(name = "description", nullable = false, length = 1000)
    private String description;

    // =================================================================
    // FINE TRACKING
    // =================================================================

    /**
     * Fine amount in AED
     */
    @Column(name = "fine_amount", precision = 12, scale = 2)
    private BigDecimal fineAmount;

    /**
     * Current status of the fine payment
     */
    @NotNull(message = "Fine status is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "fine_status", nullable = false, length = 20)
    @Builder.Default
    private FineStatus fineStatus = FineStatus.PENDING;

    // =================================================================
    // REMEDIATION
    // =================================================================

    /**
     * Reference to remediation work order if created
     */
    @Column(name = "remediation_work_order_id")
    private UUID remediationWorkOrderId;

    /**
     * Date when the violation was resolved
     */
    @Column(name = "resolution_date")
    private LocalDate resolutionDate;

    // =================================================================
    // HELPER METHODS
    // =================================================================

    /**
     * Check if violation has been resolved
     * @return true if resolution date is set
     */
    public boolean isResolved() {
        return resolutionDate != null;
    }

    /**
     * Check if fine has been paid
     * @return true if fine status is PAID
     */
    public boolean isFinePaid() {
        return fineStatus == FineStatus.PAID;
    }

    /**
     * Check if fine is pending
     * @return true if fine status is PENDING
     */
    public boolean isFinePending() {
        return fineStatus == FineStatus.PENDING;
    }

    /**
     * Check if fine has been waived
     * @return true if fine status is WAIVED
     */
    public boolean isFineWaived() {
        return fineStatus == FineStatus.WAIVED;
    }

    /**
     * Check if fine is under appeal
     * @return true if fine status is APPEALED
     */
    public boolean isFineAppealed() {
        return fineStatus == FineStatus.APPEALED;
    }

    /**
     * Check if there's a fine amount
     * @return true if fine amount is greater than zero
     */
    public boolean hasFine() {
        return fineAmount != null && fineAmount.compareTo(BigDecimal.ZERO) > 0;
    }

    /**
     * Get the compliance schedule ID without lazy loading
     * @return UUID of the compliance schedule
     */
    public UUID getComplianceScheduleId() {
        return complianceSchedule != null ? complianceSchedule.getId() : null;
    }
}
