package com.ultrabms.repository;

import java.time.LocalDate;
import java.util.List;

/**
 * Repository interface for Vendor Dashboard queries.
 * Provides optimized aggregation queries for dashboard KPIs, charts, and tables.
 *
 * Story 8.5: Vendor Dashboard
 */
public interface VendorDashboardRepository {

    // =================================================================
    // KPI QUERIES (AC-1 to AC-4)
    // =================================================================

    /**
     * Count active vendors (AC-1)
     * @return Count of vendors with status = ACTIVE
     */
    Long countActiveVendors();

    /**
     * Calculate average SLA compliance across all active vendors (AC-2)
     * SLA = (on-time completions / total completions) * 100
     * @return Average SLA compliance percentage
     */
    Double calculateAverageSlaCompliance();

    /**
     * Get the top performing vendor by rating (AC-3)
     * @return Object array: [vendorId, vendorName, rating, totalJobsCompleted]
     */
    Object[] getTopPerformingVendor();

    /**
     * Count documents expiring within days (AC-4)
     * @param withinDays Number of days to look ahead
     * @return Count of expiring documents
     */
    Long countExpiringDocuments(int withinDays);

    /**
     * Check if any critical documents are expiring (AC-4)
     * @param withinDays Number of days to look ahead
     * @return True if critical documents (TRADE_LICENSE, INSURANCE) expiring
     */
    Boolean hasCriticalDocumentsExpiring(int withinDays);

    // =================================================================
    // CHART DATA QUERIES (AC-5 to AC-6)
    // =================================================================

    /**
     * Get jobs grouped by specialization/category (AC-5)
     * @return List of Object arrays: [category, displayName, jobCount, vendorCount]
     */
    List<Object[]> getJobsBySpecialization();

    /**
     * Get vendor performance snapshot data for scatter plot (AC-6)
     * @return List of Object arrays: [vendorId, vendorName, slaCompliance, rating, jobCount]
     */
    List<Object[]> getVendorPerformanceSnapshot();

    // =================================================================
    // TABLE QUERIES (AC-7 to AC-8)
    // =================================================================

    /**
     * Get vendors with expiring documents (AC-7)
     * @param withinDays Number of days to look ahead
     * @param limit Maximum number of results
     * @return List of Object arrays: [documentId, vendorId, vendorName, documentType, expiryDate]
     */
    List<Object[]> getVendorsWithExpiringDocuments(int withinDays, int limit);

    /**
     * Get top vendors by jobs completed this month (AC-8)
     * @param limit Maximum number of results (default 5)
     * @return List of Object arrays: [vendorId, vendorName, jobsThisMonth, avgRating, totalJobs]
     */
    List<Object[]> getTopVendorsByJobsThisMonth(int limit);
}
