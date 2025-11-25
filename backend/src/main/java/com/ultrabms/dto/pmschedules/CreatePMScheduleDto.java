package com.ultrabms.dto.pmschedules;

import com.ultrabms.entity.enums.RecurrenceType;
import com.ultrabms.entity.enums.WorkOrderCategory;
import com.ultrabms.entity.enums.WorkOrderPriority;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

/**
 * DTO for creating a new PM schedule.
 * Used by property managers/maintenance supervisors.
 *
 * Story 4.2: Preventive Maintenance Scheduling
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePMScheduleDto {

    /**
     * Name of the PM schedule (e.g., "HVAC Quarterly Inspection")
     */
    @NotBlank(message = "Schedule name is required")
    @Size(max = 100, message = "Schedule name must be less than 100 characters")
    private String scheduleName;

    /**
     * Property where preventive maintenance is scheduled.
     * Nullable for "All Properties" schedules.
     */
    private UUID propertyId;

    /**
     * Category of maintenance work
     */
    @NotNull(message = "Category is required")
    private WorkOrderCategory category;

    /**
     * Detailed description of the preventive maintenance work
     */
    @NotBlank(message = "Description is required")
    @Size(min = 20, max = 1000, message = "Description must be between 20 and 1000 characters")
    private String description;

    /**
     * Type of recurrence (MONTHLY, QUARTERLY, SEMI_ANNUALLY, ANNUALLY)
     */
    @NotNull(message = "Recurrence type is required")
    private RecurrenceType recurrenceType;

    /**
     * Start date for the PM schedule (must be today or in the future)
     */
    @NotNull(message = "Start date is required")
    @FutureOrPresent(message = "Start date must be today or in the future")
    private LocalDate startDate;

    /**
     * End date for the PM schedule (optional, must be after start date if provided)
     */
    private LocalDate endDate;

    /**
     * Default priority level for generated work orders
     */
    @NotNull(message = "Default priority is required")
    private WorkOrderPriority defaultPriority;

    /**
     * Default assignee (vendor or staff) for generated work orders.
     * Nullable if work orders should be created as unassigned.
     */
    private UUID defaultAssigneeId;

    // Note: createdBy is auto-filled from authenticated user context
}
