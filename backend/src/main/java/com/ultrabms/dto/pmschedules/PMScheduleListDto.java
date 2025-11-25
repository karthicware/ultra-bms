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
 * DTO for PM schedule list view (lighter version).
 * Used in PM schedules list page and GET /api/v1/pm-schedules
 *
 * Story 4.2: Preventive Maintenance Scheduling
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PMScheduleListDto {

    /**
     * PM Schedule ID
     */
    private UUID id;

    /**
     * Schedule name
     */
    private String scheduleName;

    /**
     * Property ID (null for All Properties)
     */
    private UUID propertyId;

    /**
     * Property name
     */
    private String propertyName;

    /**
     * Category of maintenance work
     */
    private WorkOrderCategory category;

    /**
     * Recurrence type
     */
    private RecurrenceType recurrenceType;

    /**
     * Current status
     */
    private PMScheduleStatus status;

    /**
     * Next generation date
     */
    private LocalDate nextGenerationDate;

    /**
     * Last generated date
     */
    private LocalDate lastGeneratedDate;

    /**
     * Default priority
     */
    private WorkOrderPriority defaultPriority;

    /**
     * When the schedule was created
     */
    private LocalDateTime createdAt;
}
