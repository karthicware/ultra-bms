package com.ultrabms.dto.assets;

import com.ultrabms.entity.enums.AssetCategory;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * DTO for updating an existing asset.
 *
 * Story 7.1: Asset Registry and Tracking
 * AC #32: DTOs and MapStruct mapper for entity-DTO conversion
 */
public record AssetUpdateDto(
        @Size(min = 1, max = 200, message = "Asset name must be between 1 and 200 characters")
        String assetName,

        AssetCategory category,

        UUID propertyId,

        @Size(min = 1, max = 200, message = "Location must be between 1 and 200 characters")
        String location,

        @Size(max = 100, message = "Manufacturer must be less than 100 characters")
        String manufacturer,

        @Size(max = 100, message = "Model number must be less than 100 characters")
        String modelNumber,

        @Size(max = 100, message = "Serial number must be less than 100 characters")
        String serialNumber,

        LocalDate installationDate,

        LocalDate warrantyExpiryDate,

        @DecimalMin(value = "0.00", message = "Purchase cost cannot be negative")
        BigDecimal purchaseCost,

        @Min(value = 1, message = "Estimated useful life must be at least 1 year")
        @Max(value = 100, message = "Estimated useful life cannot exceed 100 years")
        Integer estimatedUsefulLife,

        LocalDate nextMaintenanceDate
) {}
