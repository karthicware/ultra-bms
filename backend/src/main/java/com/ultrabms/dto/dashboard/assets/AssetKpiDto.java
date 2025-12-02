package com.ultrabms.dto.dashboard.assets;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * DTO for Assets Dashboard KPI Cards (AC-1 through AC-4)
 *
 * Story 8.7: Assets Dashboard
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssetKpiDto {

    /**
     * Total Registered Assets KPI (AC-1)
     * Count of all assets in the registry (not deleted)
     */
    private Long totalRegisteredAssets;

    /**
     * Total Asset Value KPI (AC-2)
     * Sum of all asset purchase costs (AED)
     */
    private BigDecimal totalAssetValue;

    /**
     * Assets with Overdue PM KPI (AC-3)
     * Count of assets needing preventive maintenance (overdue)
     */
    private Long assetsWithOverduePm;

    /**
     * Most Expensive Asset by TCO KPI (AC-4)
     */
    private MostExpensiveAssetKpi mostExpensiveAsset;

    /**
     * Most expensive asset details by Total Cost of Ownership
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MostExpensiveAssetKpi {
        private UUID assetId;
        private String assetName;
        private String assetNumber;
        /**
         * TCO = purchase_cost + SUM(all maintenance costs from work orders)
         */
        private BigDecimal tco;
    }
}
