package com.ultrabms.service;

import com.ultrabms.dto.dashboard.occupancy.*;

import java.util.List;
import java.util.UUID;

/**
 * Service interface for Occupancy Dashboard data retrieval.
 *
 * Story 8.3: Occupancy Dashboard
 */
public interface OccupancyDashboardService {

    /**
     * Get complete occupancy dashboard data (AC-9)
     *
     * @param propertyId Optional property filter
     * @return OccupancyDashboardDto with all dashboard components
     */
    OccupancyDashboardDto getOccupancyDashboard(UUID propertyId);

    /**
     * Get upcoming lease expirations with pagination (AC-10)
     *
     * @param days      Number of days to look ahead (default: 100)
     * @param page      Page number (0-based)
     * @param size      Page size
     * @param propertyId Optional property filter
     * @return List of lease expirations
     */
    List<LeaseExpirationListDto> getLeaseExpirations(int days, int page, int size, UUID propertyId);

    /**
     * Get recent lease activity (AC-11)
     *
     * @param limit     Maximum number of activities to return
     * @param propertyId Optional property filter
     * @return List of recent lease activities
     */
    List<LeaseActivityDto> getRecentActivity(int limit, UUID propertyId);

    /**
     * Get configurable expiry period from company settings (AC-12)
     *
     * @return Number of days for lease expiry threshold (default: 100)
     */
    int getDefaultExpiryPeriodDays();
}
