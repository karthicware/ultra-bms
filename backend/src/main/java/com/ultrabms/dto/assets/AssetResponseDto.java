package com.ultrabms.dto.assets;

import com.ultrabms.entity.enums.AssetCategory;
import com.ultrabms.entity.enums.AssetStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Full asset response DTO for detail view.
 *
 * Story 7.1: Asset Registry and Tracking
 * AC #32: DTOs and MapStruct mapper for entity-DTO conversion
 */
public record AssetResponseDto(
        UUID id,
        String assetNumber,
        String assetName,
        AssetCategory category,
        String categoryDisplayName,
        AssetStatus status,
        String statusDisplayName,
        String statusColor,

        // Property information
        UUID propertyId,
        String propertyName,
        String propertyAddress,

        // Location and equipment details
        String location,
        String manufacturer,
        String modelNumber,
        String serialNumber,

        // Dates
        LocalDate installationDate,
        LocalDate warrantyExpiryDate,
        LocalDate lastMaintenanceDate,
        LocalDate nextMaintenanceDate,

        // Financial
        BigDecimal purchaseCost,
        Integer estimatedUsefulLife,

        // Warranty status
        String warrantyStatus,
        Integer warrantyDaysRemaining,

        // Documents
        List<AssetDocumentDto> documents,

        // Maintenance summary
        MaintenanceSummaryDto maintenanceSummary,

        // Status notes (audit)
        String statusNotes,

        // Audit fields
        UUID createdBy,
        String createdByName,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,

        // Helper flags
        boolean editable,
        boolean canLinkToWorkOrder
) {
    /**
     * Maintenance summary sub-DTO
     */
    public record MaintenanceSummaryDto(
            int totalMaintenanceCount,
            BigDecimal totalMaintenanceCost,
            String lastMaintenanceDescription
    ) {}
}
