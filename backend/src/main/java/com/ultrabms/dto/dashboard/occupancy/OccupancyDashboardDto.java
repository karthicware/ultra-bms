package com.ultrabms.dto.dashboard.occupancy;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response DTO for GET /api/v1/dashboard/occupancy (AC-9)
 * Aggregates all occupancy dashboard data in a single response
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OccupancyDashboardDto {

    /**
     * KPI card data (AC-1 through AC-4)
     */
    private OccupancyKpiDto kpis;

    /**
     * Portfolio occupancy donut chart data (AC-5)
     */
    private PortfolioOccupancyChartDto occupancyChart;

    /**
     * Lease expirations bar chart data (AC-6)
     */
    private LeaseExpirationChartDto leaseExpirationChart;

    /**
     * Upcoming lease expirations table data (AC-7)
     * Limited to first page (configurable, default 10 items)
     */
    private List<LeaseExpirationListDto> upcomingExpirations;

    /**
     * Recent activity feed (AC-8)
     * Limited to last 10 items
     */
    private List<LeaseActivityDto> recentActivity;

    /**
     * Configurable expiry period in days (AC-12)
     * Read from company settings, default 100
     */
    private Integer expiryPeriodDays;
}
