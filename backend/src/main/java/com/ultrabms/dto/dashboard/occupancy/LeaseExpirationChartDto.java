package com.ultrabms.dto.dashboard.occupancy;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO for Lease Expirations Bar Chart (AC-6)
 * Displays monthly lease expiration counts for next 12 months
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaseExpirationChartDto {

    /**
     * Monthly data for the bar chart
     */
    private List<MonthlyExpiration> monthlyData;

    /**
     * Total expiring leases in the 12-month period
     */
    private Long totalExpiring;

    /**
     * Monthly expiration breakdown
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyExpiration {
        /**
         * Month label (e.g., "Dec 2025", "Jan 2026")
         */
        private String month;

        /**
         * Year-month value for sorting/filtering (e.g., "2025-12")
         */
        private String yearMonth;

        /**
         * Count of leases expiring that have been renewed
         */
        private Long renewedCount;

        /**
         * Count of leases expiring that are still pending
         */
        private Long pendingCount;

        /**
         * Total expiring in this month
         */
        private Long totalCount;
    }
}
