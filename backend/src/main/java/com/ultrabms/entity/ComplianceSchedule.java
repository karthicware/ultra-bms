package com.ultrabms.entity;

import com.ultrabms.entity.enums.ComplianceScheduleStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

/**
 * ComplianceSchedule entity representing scheduled compliance items for a property.
 * Links a ComplianceRequirement to a Property with due date and completion tracking.
 *
 * Story 7.3: Compliance and Inspection Tracking
 * AC #4: ComplianceSchedule entity
 */
@Entity
@Table(
    name = "compliance_schedules",
    indexes = {
        @Index(name = "idx_compliance_schedules_requirement", columnList = "compliance_requirement_id"),
        @Index(name = "idx_compliance_schedules_property", columnList = "property_id"),
        @Index(name = "idx_compliance_schedules_due_date", columnList = "due_date"),
        @Index(name = "idx_compliance_schedules_status", columnList = "status"),
        @Index(name = "idx_compliance_schedules_completed_by", columnList = "completed_by")
    }
)
@Data
@Builder
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class ComplianceSchedule extends BaseEntity {

    // =================================================================
    // RELATIONSHIPS
    // =================================================================

    /**
     * Reference to the compliance requirement
     */
    @NotNull(message = "Compliance requirement is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "compliance_requirement_id", nullable = false)
    private ComplianceRequirement complianceRequirement;

    /**
     * Reference to the property this schedule applies to
     */
    @NotNull(message = "Property is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id", nullable = false)
    private Property property;

    // =================================================================
    // SCHEDULE DETAILS
    // =================================================================

    /**
     * Unique schedule number (e.g., CMP-2025-0001)
     */
    @Size(max = 50, message = "Schedule number must be less than 50 characters")
    @Column(name = "schedule_number", length = 50, unique = true)
    private String scheduleNumber;

    /**
     * Due date for this compliance schedule
     */
    @NotNull(message = "Due date is required")
    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    /**
     * Current status of the schedule
     */
    @NotNull(message = "Status is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private ComplianceScheduleStatus status = ComplianceScheduleStatus.UPCOMING;

    // =================================================================
    // COMPLETION TRACKING
    // =================================================================

    /**
     * Date when the compliance was completed
     */
    @Column(name = "completed_date")
    private LocalDate completedDate;

    /**
     * UUID of the user who completed the compliance
     */
    @Column(name = "completed_by")
    private UUID completedBy;

    /**
     * Notes about the completion
     */
    @Size(max = 1000, message = "Notes must be less than 1000 characters")
    @Column(name = "notes", length = 1000)
    private String notes;

    /**
     * Certificate number issued upon completion
     */
    @Size(max = 100, message = "Certificate number must be less than 100 characters")
    @Column(name = "certificate_number", length = 100)
    private String certificateNumber;

    /**
     * S3 path to the compliance certificate file
     * Format: /uploads/compliance/schedules/{scheduleId}/certificate.pdf
     */
    @Size(max = 500, message = "Certificate file path must be less than 500 characters")
    @Column(name = "certificate_file_path", length = 500)
    private String certificateFilePath;

    /**
     * URL to certificate (for external certificates)
     */
    @Size(max = 500, message = "Certificate URL must be less than 500 characters")
    @Column(name = "certificate_url", length = 500)
    private String certificateUrl;

    /**
     * Date when the compliance was completed (alias for completedDate)
     */
    public LocalDate getCompletionDate() {
        return completedDate;
    }

    /**
     * Set completion date
     */
    public void setCompletionDate(LocalDate completionDate) {
        this.completedDate = completionDate;
    }

    /**
     * Get the requirement (alias for complianceRequirement)
     */
    public ComplianceRequirement getRequirement() {
        return complianceRequirement;
    }

    // =================================================================
    // HELPER METHODS
    // =================================================================

    /**
     * Check if this schedule is completed
     * @return true if status is COMPLETED
     */
    public boolean isCompleted() {
        return status == ComplianceScheduleStatus.COMPLETED;
    }

    /**
     * Check if this schedule is overdue
     * @return true if status is OVERDUE
     */
    public boolean isOverdue() {
        return status == ComplianceScheduleStatus.OVERDUE;
    }

    /**
     * Check if this schedule is exempt
     * @return true if status is EXEMPT
     */
    public boolean isExempt() {
        return status == ComplianceScheduleStatus.EXEMPT;
    }

    /**
     * Get the compliance requirement ID without lazy loading the entire entity
     * @return UUID of the compliance requirement
     */
    public UUID getComplianceRequirementId() {
        return complianceRequirement != null ? complianceRequirement.getId() : null;
    }

    /**
     * Get the property ID without lazy loading the entire entity
     * @return UUID of the property
     */
    public UUID getPropertyId() {
        return property != null ? property.getId() : null;
    }

    // =================================================================
    // SOFT DELETE FIELDS
    // =================================================================

    /**
     * Flag indicating if this schedule is soft deleted
     */
    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private Boolean isDeleted = false;

    /**
     * User who deleted this schedule
     */
    @Column(name = "deleted_by")
    private UUID deletedBy;

    /**
     * Soft delete this schedule
     * @param userId User performing the delete
     */
    public void softDelete(UUID userId) {
        this.isDeleted = true;
        this.deletedBy = userId;
    }
}
