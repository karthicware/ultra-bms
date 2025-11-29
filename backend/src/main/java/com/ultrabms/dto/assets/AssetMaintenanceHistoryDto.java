package com.ultrabms.dto.assets;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for asset maintenance history (work orders linked to asset).
 *
 * Story 7.1: Asset Registry and Tracking
 * AC #11: GET /api/v1/assets/{id}/maintenance-history
 */
public record AssetMaintenanceHistoryDto(
        UUID id,
        String workOrderNumber,
        LocalDateTime createdAt,
        String description,
        String status,
        String statusDisplayName,
        BigDecimal actualCost,
        UUID vendorId,
        String vendorName,
        LocalDateTime completedAt
) {}
