package com.ultrabms.dto.assets;

import com.ultrabms.entity.enums.AssetCategory;
import com.ultrabms.entity.enums.AssetStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Asset list item DTO for table view.
 *
 * Story 7.1: Asset Registry and Tracking
 * AC #32: DTOs and MapStruct mapper for entity-DTO conversion
 */
public record AssetListDto(
        UUID id,
        String assetNumber,
        String assetName,
        AssetCategory category,
        String categoryDisplayName,
        AssetStatus status,
        String statusDisplayName,
        String statusColor,
        UUID propertyId,
        String propertyName,
        String location,
        LocalDate warrantyExpiryDate,
        String warrantyStatus,
        Integer warrantyDaysRemaining,
        LocalDateTime createdAt
) {}
