package com.ultrabms.dto.dashboard.assets;

import com.ultrabms.entity.enums.AssetCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * DTO for Top 5 Assets by Maintenance Spend horizontal bar chart (AC-6)
 *
 * Story 8.7: Assets Dashboard
 *
 * - Horizontal bars showing maintenance cost (AED)
 * - Asset name on Y-axis
 * - Amount on X-axis
 * - Click bar navigates to asset details
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TopMaintenanceSpendDto {

    /**
     * Asset ID for navigation
     */
    private UUID assetId;

    /**
     * Asset name displayed on Y-axis
     */
    private String assetName;

    /**
     * Asset number for reference
     */
    private String assetNumber;

    /**
     * Asset category
     */
    private AssetCategory category;

    /**
     * Category display name
     */
    private String categoryDisplayName;

    /**
     * Total maintenance cost in AED (from completed work orders)
     */
    private BigDecimal maintenanceCost;
}
