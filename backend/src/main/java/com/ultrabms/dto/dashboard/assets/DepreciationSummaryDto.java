package com.ultrabms.dto.dashboard.assets;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO for Asset Depreciation Summary card (AC-9)
 *
 * Story 8.7: Assets Dashboard
 *
 * - Original Value Total (AED)
 * - Current Value Total (AED)
 * - Total Depreciation (AED and percentage)
 * - Click navigates to detailed depreciation report
 *
 * Depreciation calculation uses straight-line method:
 * annual_depreciation = original_value / estimated_useful_life
 * current_value = original_value - (years_in_service * annual_depreciation)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DepreciationSummaryDto {

    /**
     * Sum of all assets' original purchase costs (AED)
     */
    private BigDecimal originalValueTotal;

    /**
     * Sum of all assets' current depreciated values (AED)
     * Calculated using straight-line depreciation
     */
    private BigDecimal currentValueTotal;

    /**
     * Total depreciation amount in AED
     * Calculated as: originalValueTotal - currentValueTotal
     */
    private BigDecimal totalDepreciation;

    /**
     * Depreciation as a percentage of original value
     * Calculated as: (totalDepreciation / originalValueTotal) * 100
     */
    private BigDecimal depreciationPercentage;

    /**
     * Total number of depreciable assets (those with purchase cost and useful life)
     */
    private Long totalDepreciableAssets;

    /**
     * Number of fully depreciated assets (current value <= 0)
     */
    private Long fullyDepreciatedAssets;
}
