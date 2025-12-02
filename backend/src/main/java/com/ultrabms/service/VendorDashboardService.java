package com.ultrabms.service;

import com.ultrabms.dto.dashboard.vendor.ExpiringDocumentDto;
import com.ultrabms.dto.dashboard.vendor.JobsBySpecializationDto;
import com.ultrabms.dto.dashboard.vendor.TopVendorDto;
import com.ultrabms.dto.dashboard.vendor.VendorDashboardDto;
import com.ultrabms.dto.dashboard.vendor.VendorKpiDto;
import com.ultrabms.dto.dashboard.vendor.VendorPerformanceSnapshotDto;

import java.util.List;

/**
 * Service interface for Vendor Dashboard operations.
 *
 * Story 8.5: Vendor Dashboard
 */
public interface VendorDashboardService {

    /**
     * Get complete vendor dashboard data (AC-9)
     * Aggregates all dashboard sections: KPIs, charts, and tables
     *
     * @return VendorDashboardDto with all sections
     */
    VendorDashboardDto getVendorDashboard();

    /**
     * Get KPI cards data (AC-1 through AC-4)
     *
     * @return VendorKpiDto with all KPIs
     */
    VendorKpiDto getKpis();

    /**
     * Get jobs by specialization for bar chart (AC-5, AC-10)
     *
     * @return List of jobs grouped by specialization
     */
    List<JobsBySpecializationDto> getJobsBySpecialization();

    /**
     * Get vendor performance snapshot for scatter plot (AC-6, AC-11)
     *
     * @return List of vendor performance data points
     */
    List<VendorPerformanceSnapshotDto> getPerformanceSnapshot();

    /**
     * Get expiring documents list (AC-7, AC-12)
     *
     * @param withinDays Number of days to look ahead (default 30)
     * @param limit Maximum results to return
     * @return List of expiring documents sorted by date
     */
    List<ExpiringDocumentDto> getExpiringDocuments(int withinDays, int limit);

    /**
     * Get top vendors by jobs completed this month (AC-8, AC-13)
     *
     * @param limit Maximum results to return (default 5)
     * @return List of top vendors with rankings
     */
    List<TopVendorDto> getTopVendors(int limit);
}
