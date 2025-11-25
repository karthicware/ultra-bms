package com.ultrabms.dto.pmschedules;

import com.ultrabms.entity.enums.PMScheduleStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for updating PM schedule status (pause, resume, complete).
 *
 * Story 4.2: Preventive Maintenance Scheduling
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePMScheduleStatusDto {

    /**
     * New status for the PM schedule.
     * Valid transitions:
     * - ACTIVE -> PAUSED, COMPLETED
     * - PAUSED -> ACTIVE, COMPLETED
     * - COMPLETED -> (none, final state)
     * - DELETED -> (none, final state)
     */
    @NotNull(message = "Status is required")
    private PMScheduleStatus status;
}
