package com.ultrabms.dto.compliance;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * DTO for marking a compliance schedule as complete
 * Used in PATCH /api/v1/compliance-schedules/{id}/complete
 *
 * Story 7.3: Compliance and Inspection Tracking
 * AC #18: PATCH /api/v1/compliance-schedules/{id}/complete
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompleteScheduleDto {

    /**
     * Date when compliance was completed (required)
     */
    @NotNull(message = "Completed date is required")
    private LocalDate completedDate;

    /**
     * Notes about the completion (optional)
     */
    @Size(max = 1000, message = "Notes must be less than 1000 characters")
    private String notes;
}
