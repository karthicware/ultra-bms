package com.ultrabms.dto.dashboard.vendor;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * DTO for Vendor Performance scatter plot data (AC-6, AC-14, AC-15, AC-17)
 *
 * Story 8.5: Vendor Dashboard
 *
 * Scatter plot coordinates:
 * - X-axis: SLA Compliance percentage (0-100%)
 * - Y-axis: Customer Rating (1-5 scale)
 * - Bubble size: Number of completed jobs
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VendorPerformanceSnapshotDto {

    /**
     * Vendor ID for navigation
     */
    private UUID vendorId;

    /**
     * Vendor company name for tooltip
     */
    private String vendorName;

    /**
     * SLA Compliance percentage (X-axis, 0-100%)
     * Calculated from: (on-time completions / total completions) * 100
     */
    private BigDecimal slaCompliance;

    /**
     * Customer rating (Y-axis, 1-5 scale)
     * Average of all ratings received
     */
    private BigDecimal rating;

    /**
     * Number of completed jobs (Bubble size)
     */
    private Integer jobCount;

    /**
     * Performance tier for color coding
     * GREEN: rating >= 4 AND SLA >= 80%
     * YELLOW: rating >= 3 OR SLA >= 60%
     * RED: below thresholds
     */
    private PerformanceTier performanceTier;

    /**
     * Performance tier enum for color coding
     */
    public enum PerformanceTier {
        GREEN,
        YELLOW,
        RED
    }
}
