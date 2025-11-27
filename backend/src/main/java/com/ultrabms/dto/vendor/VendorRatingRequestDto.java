package com.ultrabms.dto.vendor;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for submitting or updating a vendor rating.
 * Story 5.3: Vendor Performance Tracking and Rating
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VendorRatingRequestDto {

    /**
     * Quality of work score (1-5 stars)
     */
    @NotNull(message = "Quality score is required")
    @Min(value = 1, message = "Quality score must be at least 1")
    @Max(value = 5, message = "Quality score cannot exceed 5")
    private Integer qualityScore;

    /**
     * Timeliness score (1-5 stars)
     */
    @NotNull(message = "Timeliness score is required")
    @Min(value = 1, message = "Timeliness score must be at least 1")
    @Max(value = 5, message = "Timeliness score cannot exceed 5")
    private Integer timelinessScore;

    /**
     * Communication score (1-5 stars)
     */
    @NotNull(message = "Communication score is required")
    @Min(value = 1, message = "Communication score must be at least 1")
    @Max(value = 5, message = "Communication score cannot exceed 5")
    private Integer communicationScore;

    /**
     * Professionalism score (1-5 stars)
     */
    @NotNull(message = "Professionalism score is required")
    @Min(value = 1, message = "Professionalism score must be at least 1")
    @Max(value = 5, message = "Professionalism score cannot exceed 5")
    private Integer professionalismScore;

    /**
     * Optional comments (max 500 characters)
     */
    @Size(max = 500, message = "Comments must be less than 500 characters")
    private String comments;
}
