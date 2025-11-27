package com.ultrabms.dto.vendor;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * DTO for vendor performance metrics.
 * Story 5.3: Vendor Performance Tracking and Rating
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VendorPerformanceDto {

    /**
     * Vendor ID
     */
    private UUID vendorId;

    /**
     * Vendor company name
     */
    private String vendorName;

    /**
     * Vendor number (e.g., VND-2025-0001)
     */
    private String vendorNumber;

    /**
     * Overall rating (0-5, 2 decimal places)
     * 0 indicates no ratings yet
     */
    private BigDecimal overallRating;

    /**
     * Total number of completed jobs
     */
    private long totalJobsCompleted;

    /**
     * Average completion time in days
     * Null if no completed jobs
     */
    private Double averageCompletionTime;

    /**
     * On-time completion rate (0-100%)
     * Null if no completed jobs
     */
    private Double onTimeCompletionRate;

    /**
     * Total amount paid to vendor (sum of actual_cost)
     */
    private BigDecimal totalAmountPaid;

    /**
     * Rating distribution breakdown
     */
    private VendorRatingDistributionDto ratingDistribution;

    /**
     * Average quality score (1-5)
     */
    private Double averageQualityScore;

    /**
     * Average timeliness score (1-5)
     */
    private Double averageTimelinessScore;

    /**
     * Average communication score (1-5)
     */
    private Double averageCommunicationScore;

    /**
     * Average professionalism score (1-5)
     */
    private Double averageProfessionalismScore;
}
