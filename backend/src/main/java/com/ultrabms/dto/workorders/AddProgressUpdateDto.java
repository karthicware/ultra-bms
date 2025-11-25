package com.ultrabms.dto.workorders;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * DTO for adding a progress update to a work order
 * Used in POST /api/v1/work-orders/{id}/progress
 *
 * Story 4.4: Job Progress Tracking and Completion
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddProgressUpdateDto {

    /**
     * Progress notes describing work done, issues encountered, or next steps
     * Required, 1-500 characters
     */
    @NotBlank(message = "Progress notes are required")
    @Size(min = 1, max = 500, message = "Progress notes must be between 1 and 500 characters")
    private String progressNotes;

    /**
     * Updated estimated completion date (optional)
     * If provided, must be >= today
     */
    private LocalDate estimatedCompletionDate;
}
