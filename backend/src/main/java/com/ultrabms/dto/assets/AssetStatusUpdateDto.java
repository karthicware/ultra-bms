package com.ultrabms.dto.assets;

import com.ultrabms.entity.enums.AssetStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * DTO for updating asset status.
 *
 * Story 7.1: Asset Registry and Tracking
 * AC #10: PATCH /api/v1/assets/{id}/status - Update status with notes
 */
public record AssetStatusUpdateDto(
        @NotNull(message = "Status is required")
        AssetStatus status,

        @Size(max = 500, message = "Notes must be less than 500 characters")
        String notes
) {}
