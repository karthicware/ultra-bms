package com.ultrabms.dto.dashboard.assets;

import com.ultrabms.entity.enums.AssetCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO for Assets by Category donut chart (AC-5)
 *
 * Story 8.7: Assets Dashboard
 *
 * Segments: HVAC, Electrical, Plumbing, Mechanical, Other
 * - Count and percentage per category
 * - Click segment navigates to category asset list
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssetsByCategoryDto {

    /**
     * Asset category enum value
     */
    private AssetCategory category;

    /**
     * Display name for the category
     */
    private String categoryDisplayName;

    /**
     * Count of assets in this category
     */
    private Long count;

    /**
     * Percentage of total assets
     */
    private BigDecimal percentage;
}
