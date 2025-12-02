package com.ultrabms.dto.dashboard.assets;

import com.ultrabms.entity.enums.AssetCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

/**
 * DTO for Overdue Preventive Maintenance table (AC-7)
 *
 * Story 8.7: Assets Dashboard
 *
 * Columns: Asset Name, Category, Property, Last PM Date, Days Overdue
 * - Sorted by days overdue descending
 * - Red highlight for items > 30 days overdue
 * - Quick action: Create Work Order
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OverduePmAssetDto {

    /**
     * Asset ID for navigation and work order creation
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
     * Date of last preventive maintenance
     */
    private LocalDate lastPmDate;

    /**
     * Scheduled next PM date (this is the date that is overdue)
     */
    private LocalDate nextPmDate;

    /**
     * Number of days overdue (calculated: today - nextPmDate)
     */
    private Integer daysOverdue;

    /**
     * Flag for critical overdue (> 30 days)
     * Used for red highlight in UI
     */
    private Boolean isCritical;
}
