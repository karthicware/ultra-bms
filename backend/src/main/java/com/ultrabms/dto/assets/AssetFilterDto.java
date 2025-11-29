package com.ultrabms.dto.assets;

import com.ultrabms.entity.enums.AssetCategory;
import com.ultrabms.entity.enums.AssetStatus;

import java.util.UUID;

/**
 * Filter parameters for asset list queries.
 *
 * Story 7.1: Asset Registry and Tracking
 * AC #7: GET /api/v1/assets - List with filters
 */
public record AssetFilterDto(
        String search,
        UUID propertyId,
        AssetCategory category,
        AssetStatus status,
        Integer page,
        Integer size,
        String sortBy,
        String sortDirection
) {
    /**
     * Create filter with defaults
     */
    public AssetFilterDto {
        if (page == null) page = 0;
        if (size == null) size = 20;
        if (sortBy == null) sortBy = "createdAt";
        if (sortDirection == null) sortDirection = "DESC";
    }
}
