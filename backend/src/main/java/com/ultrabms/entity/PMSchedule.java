package com.ultrabms.entity;

import com.ultrabms.entity.enums.PMScheduleStatus;
import com.ultrabms.entity.enums.RecurrenceType;
import com.ultrabms.entity.enums.WorkOrderCategory;
import com.ultrabms.entity.enums.WorkOrderPriority;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
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
 * PMSchedule entity representing preventive maintenance schedules.
 * PM schedules automatically generate work orders at specified intervals
 * (monthly, quarterly, semi-annually, or annually).
 *
 * Story 4.2: Preventive Maintenance Scheduling
 */
@Entity
@Table(
    name = "pm_schedules",
    indexes = {
        @Index(name = "idx_pm_schedules_property_id", columnList = "property_id"),
        @Index(name = "idx_pm_schedules_status", columnList = "status"),
        @Index(name = "idx_pm_schedules_next_generation_date", columnList = "next_generation_date"),
        @Index(name = "idx_pm_schedules_category", columnList = "category"),
        @Index(name = "idx_pm_schedules_recurrence_type", columnList = "recurrence_type"),
        @Index(name = "idx_pm_schedules_created_by", columnList = "created_by")
    }
)
@Data
@Builder
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class PMSchedule extends BaseEntity {

    // =================================================================
    // SCHEDULE IDENTIFICATION
    // =================================================================

    /**
     * Name of the PM schedule (e.g., "HVAC Quarterly Inspection")
     */
    @NotBlank(message = "Schedule name is required")
    @Size(max = 100, message = "Schedule name must be less than 100 characters")
    @Column(name = "schedule_name", nullable = false, length = 100)
    private String scheduleName;

    // =================================================================
    // RELATIONSHIPS
    // =================================================================

    /**
     * Property where preventive maintenance is scheduled.
     * Nullable for "All Properties" schedules.
     */
    @Column(name = "property_id")
    private UUID propertyId;

    /**
     * User who created this PM schedule
     */
    @NotNull(message = "Created by user ID is required")
    @Column(name = "created_by", nullable = false)
    private UUID createdBy;

    /**
     * Default assignee (vendor or staff) for generated work orders.
     * Nullable if work orders should be created as unassigned.
     */
    @Column(name = "default_assignee_id")
    private UUID defaultAssigneeId;

    // =================================================================
    // SCHEDULE DETAILS
    // =================================================================

    /**
     * Category of maintenance work
     */
    @NotNull(message = "Category is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 20)
    private WorkOrderCategory category;

    /**
     * Detailed description of the preventive maintenance work
     */
    @NotBlank(message = "Description is required")
    @Size(min = 20, max = 1000, message = "Description must be between 20 and 1000 characters")
    @Column(name = "description", nullable = false, length = 1000)
    private String description;

    /**
     * Default priority level for generated work orders
     */
    @NotNull(message = "Default priority is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "default_priority", nullable = false, length = 10)
    @Builder.Default
    private WorkOrderPriority defaultPriority = WorkOrderPriority.MEDIUM;

    // =================================================================
    // RECURRENCE SETTINGS
    // =================================================================

    /**
     * Type of recurrence (MONTHLY, QUARTERLY, SEMI_ANNUALLY, ANNUALLY)
     */
    @NotNull(message = "Recurrence type is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "recurrence_type", nullable = false, length = 20)
    private RecurrenceType recurrenceType;

    /**
     * Start date for the PM schedule
     */
    @NotNull(message = "Start date is required")
    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    /**
     * End date for the PM schedule (nullable for indefinite schedules)
     */
    @Column(name = "end_date")
    private LocalDate endDate;

    // =================================================================
    // STATUS AND TRACKING
    // =================================================================

    /**
     * Current status of the PM schedule
     * Default: ACTIVE when created
     */
    @NotNull(message = "Status is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 15)
    @Builder.Default
    private PMScheduleStatus status = PMScheduleStatus.ACTIVE;

    /**
     * Next date when a work order will be automatically generated.
     * Initially set to start date, then updated after each generation.
     */
    @Column(name = "next_generation_date")
    private LocalDate nextGenerationDate;

    /**
     * Date when the last work order was generated.
     * Null if no work orders have been generated yet.
     */
    @Column(name = "last_generated_date")
    private LocalDate lastGeneratedDate;

    // =================================================================
    // LIFECYCLE CALLBACKS
    // =================================================================

    /**
     * Pre-persist callback to set default values
     */
    @PrePersist
    protected void onCreate() {
        if (this.status == null) {
            this.status = PMScheduleStatus.ACTIVE;
        }
        if (this.defaultPriority == null) {
            this.defaultPriority = WorkOrderPriority.MEDIUM;
        }
        // Set initial nextGenerationDate to startDate if not already set
        if (this.nextGenerationDate == null && this.startDate != null) {
            this.nextGenerationDate = this.startDate;
        }
    }
}
