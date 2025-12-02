package com.ultrabms.dto.dashboard.vendor;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Complete DTO for Vendor Dashboard (AC-9)
 *
 * Story 8.5: Vendor Dashboard
 *
 * Contains all dashboard sections:
 * - KPI cards (AC-1 through AC-4)
 * - Jobs by Specialization chart (AC-5)
 * - Vendor Performance snapshot (AC-6)
 * - Expiring Documents list (AC-7)
 * - Top Vendors list (AC-8)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VendorDashboardDto {

    /**
     * KPI cards section (AC-1 through AC-4)
     */
    private VendorKpiDto kpis;

    /**
     * Jobs by Specialization bar chart data (AC-5)
     */
    private List<JobsBySpecializationDto> jobsBySpecialization;

    /**
     * Vendor Performance scatter plot data (AC-6)
     */
    private List<VendorPerformanceSnapshotDto> performanceSnapshot;

    /**
     * Vendors with Expiring Documents table (AC-7)
     */
    private List<ExpiringDocumentDto> expiringDocuments;

    /**
     * Top Vendors by Jobs table (AC-8)
     */
    private List<TopVendorDto> topVendors;
}
