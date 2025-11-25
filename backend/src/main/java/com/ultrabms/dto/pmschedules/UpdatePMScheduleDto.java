package com.ultrabms.dto.pmschedules;

import com.ultrabms.entity.enums.WorkOrderCategory;
import com.ultrabms.entity.enums.WorkOrderPriority;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

/**
 * DTO for updating an existing PM schedule.
 * Note: propertyId, recurrenceType, and startDate cannot be edited.
 *
 * Story 4.2: Preventive Maintenance Scheduling
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePMScheduleDto {

    /**
     * Updated schedule name (optional)
     */
    @Size(max = 100, message = "Schedule name must be less than 100 characters")
    private String scheduleName;

    /**
     * Updated description (optional)
     */
    @Size(min = 20, max = 1000, message = "Description must be between 20 and 1000 characters")
    private String description;

    /**
     * Updated category (optional)
     */
    private WorkOrderCategory category;

    /**
     * Updated default priority (optional)
     */
    private WorkOrderPriority defaultPriority;

    /**
     * Updated default assignee (optional, null to unassign)
     */
    private UUID defaultAssigneeId;

    /**
     * Updated end date (optional, null to remove end date)
     */
    private LocalDate endDate;
}
