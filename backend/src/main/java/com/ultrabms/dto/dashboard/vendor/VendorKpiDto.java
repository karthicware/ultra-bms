package com.ultrabms.dto.dashboard.vendor;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * DTO for Vendor Dashboard KPI Cards (AC-1 through AC-4)
 *
 * Story 8.5: Vendor Dashboard
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VendorKpiDto {

    /**
     * Total Active Vendors KPI (AC-1)
     * Count of vendors with status = ACTIVE
     */
    private Long totalActiveVendors;

    /**
     * Average SLA Compliance KPI (AC-2)
     * Percentage across all active vendors
     * Calculated from: (on-time completions / total completions) * 100
     */
    private BigDecimal avgSlaCompliance;

    /**
     * Top Performing Vendor KPI (AC-3)
     */
    private TopVendorKpi topPerformingVendor;

    /**
     * Expiring Documents KPI (AC-4)
     */
    private ExpiringDocsKpi expiringDocuments;

    /**
     * Top performing vendor details
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TopVendorKpi {
        private UUID vendorId;
        private String vendorName;
        private BigDecimal rating;
        private Integer totalJobsCompleted;
    }

    /**
     * Expiring documents KPI with critical flag
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExpiringDocsKpi {
        private Long count;
        private Boolean hasCriticalExpiring;
    }
}
