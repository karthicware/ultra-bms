package com.ultrabms.dto.dashboard.vendor;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * DTO for Top Vendors by Jobs table (AC-8)
 *
 * Story 8.5: Vendor Dashboard
 *
 * Table columns: Rank, Vendor Name, Jobs Completed (This Month), Avg Rating
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TopVendorDto {

    /**
     * Rank in the leaderboard (1-5)
     */
    private Integer rank;

    /**
     * Vendor ID for navigation
     */
    private UUID vendorId;

    /**
     * Vendor company name
     */
    private String vendorName;

    /**
     * Jobs completed this month
     */
    private Integer jobsCompletedThisMonth;

    /**
     * Average rating (1-5 scale)
     */
    private BigDecimal avgRating;

    /**
     * Total jobs completed all time
     */
    private Integer totalJobsCompleted;
}
