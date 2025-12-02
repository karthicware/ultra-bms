package com.ultrabms.dto.dashboard.assets;

import com.ultrabms.entity.enums.AssetCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for Recently Added Assets table (AC-8)
 *
 * Story 8.7: Assets Dashboard
 *
 * Columns: Asset Name, Category, Property, Added Date, Value (AED)
 * - Last 5 added assets
 * - Quick action: View Asset
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecentAssetDto {

    /**
     * Asset ID for navigation
     */
    private UUID assetId;

    /**
     * Asset name
     */
    private String assetName;

    /**
     * Asset number
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
     * Property ID
     */
    private UUID propertyId;

    /**
     * Property name
     */
    private String propertyName;

    /**
     * Date when the asset was added (createdAt from BaseEntity)
     */
    private LocalDateTime addedDate;

    /**
     * Purchase cost/value in AED
     */
    private BigDecimal value;
}
