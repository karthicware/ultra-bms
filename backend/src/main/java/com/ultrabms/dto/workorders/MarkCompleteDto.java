package com.ultrabms.dto.workorders;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO for marking a work order as complete
 * Used in PATCH /api/v1/work-orders/{id}/complete
 *
 * Story 4.4: Job Progress Tracking and Completion
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MarkCompleteDto {

    /**
     * Completion notes describing work done
     * Required, 20-1000 characters
     */
    @NotBlank(message = "Completion notes are required")
    @Size(min = 20, max = 1000, message = "Completion notes must be between 20 and 1000 characters")
    private String completionNotes;

    /**
     * Hours spent on the work
     * Required, minimum 0.1
     */
    @NotNull(message = "Hours spent is required")
    @DecimalMin(value = "0.1", message = "Hours spent must be at least 0.1")
    private BigDecimal hoursSpent;

    /**
     * Total cost of the work (AED)
     * Required, minimum 0
     */
    @NotNull(message = "Total cost is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Total cost cannot be negative")
    private BigDecimal totalCost;

    /**
     * Recommendations from vendor after completing work (optional)
     * Max 500 characters
     */
    @Size(max = 500, message = "Recommendations must be less than 500 characters")
    private String recommendations;

    /**
     * Flag indicating if follow-up work is required
     * Required
     */
    @NotNull(message = "Follow-up required flag must be specified")
    private Boolean followUpRequired;

    /**
     * Description of required follow-up work (required if followUpRequired is true)
     * Max 200 characters
     */
    @Size(max = 200, message = "Follow-up description must be less than 200 characters")
    private String followUpDescription;
}
