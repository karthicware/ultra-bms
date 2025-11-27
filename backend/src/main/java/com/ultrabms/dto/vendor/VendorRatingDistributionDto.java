package com.ultrabms.dto.vendor;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for vendor rating distribution breakdown.
 * Story 5.3: Vendor Performance Tracking and Rating
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VendorRatingDistributionDto {

    /**
     * Count of 5-star ratings (4.5-5.0)
     */
    private long fiveStarCount;

    /**
     * Percentage of 5-star ratings
     */
    private double fiveStarPercent;

    /**
     * Count of 4-star ratings (3.5-4.49)
     */
    private long fourStarCount;

    /**
     * Percentage of 4-star ratings
     */
    private double fourStarPercent;

    /**
     * Count of 3-star ratings (2.5-3.49)
     */
    private long threeStarCount;

    /**
     * Percentage of 3-star ratings
     */
    private double threeStarPercent;

    /**
     * Count of 2-star ratings (1.5-2.49)
     */
    private long twoStarCount;

    /**
     * Percentage of 2-star ratings
     */
    private double twoStarPercent;

    /**
     * Count of 1-star ratings (1.0-1.49)
     */
    private long oneStarCount;

    /**
     * Percentage of 1-star ratings
     */
    private double oneStarPercent;

    /**
     * Total number of ratings
     */
    private long totalCount;
}
