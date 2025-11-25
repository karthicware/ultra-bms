package com.ultrabms.dto.pmschedules;

import com.ultrabms.entity.enums.PMScheduleStatus;
import com.ultrabms.entity.enums.RecurrenceType;
import com.ultrabms.entity.enums.WorkOrderCategory;
import com.ultrabms.entity.enums.WorkOrderPriority;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for returning complete PM schedule details.
 * Used in PM schedule detail page and GET /api/v1/pm-schedules/{id}
 *
 * Story 4.2: Preventive Maintenance Scheduling
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PMScheduleResponseDto {

    /**
     * PM Schedule ID
     */
    private UUID id;

    /**
     * Schedule name
     */
    private String scheduleName;

    // ----- Relationships -----

    /**
     * Property ID (null for All Properties)
     */
    private UUID propertyId;

    /**
     * Property name (joined from Property entity)
     */
    private String propertyName;

    /**
     * Default assignee ID (null for unassigned)
     */
    private UUID defaultAssigneeId;

    /**
     * Default assignee name (joined from User entity)
     */
    private String defaultAssigneeName;

    // ----- Schedule Details -----

    /**
     * Category of maintenance work
     */
    private WorkOrderCategory category;

    /**
     * Detailed description
     */
    private String description;

    /**
     * Default priority for generated work orders
     */
    private WorkOrderPriority defaultPriority;

    // ----- Recurrence Settings -----

    /**
     * Recurrence type (MONTHLY, QUARTERLY, etc.)
     */
    private RecurrenceType recurrenceType;

    /**
     * Start date for the schedule
     */
    private LocalDate startDate;

    /**
     * End date for the schedule (null for indefinite)
     */
    private LocalDate endDate;

    // ----- Status and Tracking -----

    /**
     * Current status (ACTIVE, PAUSED, COMPLETED, DELETED)
     */
    private PMScheduleStatus status;

    /**
     * Next date when a work order will be generated
     */
    private LocalDate nextGenerationDate;

    /**
     * Date when last work order was generated
     */
    private LocalDate lastGeneratedDate;

    // ----- Statistics (included in detail view) -----

    /**
     * PM schedule statistics
     */
    private PMScheduleStatisticsDto statistics;

    // ----- Audit Fields -----

    /**
     * When the schedule was created
     */
    private LocalDateTime createdAt;

    /**
     * When the schedule was last updated
     */
    private LocalDateTime updatedAt;

    /**
     * User who created the schedule
     */
    private UUID createdBy;

    /**
     * Name of user who created the schedule
     */
    private String createdByName;

    /**
     * Version for optimistic locking
     */
    private Long version;
}
