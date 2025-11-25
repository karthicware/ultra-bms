package com.ultrabms.dto.pmschedules;

import com.ultrabms.entity.enums.PMScheduleStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for PM schedule creation response.
 * Returns minimal info after successful creation.
 *
 * Story 4.2: Preventive Maintenance Scheduling
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePMScheduleResponseDto {

    /**
     * Created PM schedule ID
     */
    private UUID id;

    /**
     * Schedule name
     */
    private String scheduleName;

    /**
     * Initial status (ACTIVE)
     */
    private PMScheduleStatus status;

    /**
     * Calculated next generation date
     */
    private LocalDate nextGenerationDate;

    /**
     * When the schedule was created
     */
    private LocalDateTime createdAt;
}
