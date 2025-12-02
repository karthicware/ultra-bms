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
     * Certificate number issued upon completion (optional)
     */
    @Size(max = 100, message = "Certificate number must be less than 100 characters")
    private String certificateNumber;

    /**
     * URL to certificate (for external certificates) (optional)
     */
    @Size(max = 500, message = "Certificate URL must be less than 500 characters")
    private String certificateUrl;

    /**
     * Notes about the completion (optional)
     */
    @Size(max = 1000, message = "Notes must be less than 1000 characters")
    private String notes;

    /**
     * Alias for completedDate to match entity naming
     */
    public LocalDate getCompletionDate() {
        return completedDate;
    }

    /**
     * Alias setter for completedDate
     */
    public void setCompletionDate(LocalDate completionDate) {
        this.completedDate = completionDate;
    }
}
