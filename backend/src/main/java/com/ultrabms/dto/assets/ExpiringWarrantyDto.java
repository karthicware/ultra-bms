package com.ultrabms.dto.assets;

import com.ultrabms.entity.enums.AssetCategory;

import java.time.LocalDate;
import java.util.UUID;

/**
 * DTO for assets with expiring warranties.
 *
 * Story 7.1: Asset Registry and Tracking
 * AC #14: GET /api/v1/assets/expiring-warranties
 */
public record ExpiringWarrantyDto(
        UUID id,
        String assetNumber,
        String assetName,
        AssetCategory category,
        String categoryDisplayName,
        UUID propertyId,
        String propertyName,
        LocalDate warrantyExpiryDate,
        int daysUntilExpiry
) {}
