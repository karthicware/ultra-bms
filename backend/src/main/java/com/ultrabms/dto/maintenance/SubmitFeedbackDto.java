package com.ultrabms.dto.maintenance;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for submitting tenant feedback on completed maintenance request
 * Includes rating (1-5 stars) and optional comment
 *
 * Story 3.5: Tenant Portal - Maintenance Request Submission
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmitFeedbackDto {

    /**
     * Tenant rating of service quality (1-5 stars, required)
     */
    @NotNull(message = "Rating is required")
    @Min(value = 1, message = "Rating must be at least 1")
    @Max(value = 5, message = "Rating must be at most 5")
    private Integer rating;

    /**
     * Optional feedback comment (max 500 characters)
     */
    @Size(max = 500, message = "Feedback comment must be less than 500 characters")
    private String comment;
}
