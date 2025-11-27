package com.ultrabms.dto.vendor;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * DTO for vendor comparison response.
 * Story 5.3: Vendor Performance Tracking and Rating
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VendorComparisonDto {

    /**
     * List of vendors to compare (2-4 vendors)
     */
    private List<VendorComparisonEntry> vendors;

    /**
     * Timestamp when comparison was generated
     */
    private LocalDateTime comparedAt;

    /**
     * Individual vendor entry in comparison
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VendorComparisonEntry {

        /**
         * Vendor ID
         */
        private UUID id;

        /**
         * Vendor number (e.g., VND-2025-0001)
         */
        private String vendorNumber;

        /**
         * Company name
         */
        private String companyName;

        /**
         * Overall rating (0-5)
         */
        private BigDecimal overallRating;

        /**
         * Total jobs completed
         */
        private long totalJobsCompleted;

        /**
         * On-time completion rate (0-100%)
         */
        private Double onTimeCompletionRate;

        /**
         * Average completion time in days
         */
        private Double averageCompletionTime;

        /**
         * Hourly rate
         */
        private BigDecimal hourlyRate;

        /**
         * Service categories
         */
        private List<String> serviceCategories;

        /**
         * Total amount paid
         */
        private BigDecimal totalAmountPaid;

        /**
         * Flag indicating this vendor has the best value for rating
         */
        private boolean bestRating;

        /**
         * Flag indicating this vendor has the best value for on-time rate
         */
        private boolean bestOnTimeRate;

        /**
         * Flag indicating this vendor has the lowest hourly rate
         */
        private boolean lowestHourlyRate;

        /**
         * Flag indicating this vendor has the most jobs completed
         */
        private boolean mostJobsCompleted;
    }
}
