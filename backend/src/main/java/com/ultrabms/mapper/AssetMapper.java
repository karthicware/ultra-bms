package com.ultrabms.mapper;

import com.ultrabms.dto.assets.*;
import com.ultrabms.entity.Asset;
import com.ultrabms.entity.AssetDocument;
import com.ultrabms.entity.WorkOrder;
import com.ultrabms.entity.enums.AssetStatus;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

/**
 * Mapper utility for converting between Asset entities and DTOs.
 * Manual mapping implementation.
 *
 * Story 7.1: Asset Registry and Tracking
 * AC #32: DTOs and MapStruct mapper for entity-DTO conversion
 */
@Component
public class AssetMapper {

    // =================================================================
    // ASSET ENTITY MAPPINGS
    // =================================================================

    /**
     * Convert AssetCreateDto to Asset entity (for create)
     * Note: property must be resolved by service
     *
     * @param dto AssetCreateDto
     * @return Asset entity (without relations set)
     */
    public Asset toEntity(AssetCreateDto dto) {
        if (dto == null) {
            return null;
        }

        return Asset.builder()
                .assetName(dto.assetName())
                .category(dto.category())
                .location(dto.location())
                .manufacturer(dto.manufacturer())
                .modelNumber(dto.modelNumber())
                .serialNumber(dto.serialNumber())
                .installationDate(dto.installationDate())
                .warrantyExpiryDate(dto.warrantyExpiryDate())
                .purchaseCost(dto.purchaseCost())
                .estimatedUsefulLife(dto.estimatedUsefulLife())
                .status(AssetStatus.ACTIVE)
                .isDeleted(false)
                .build();
    }

    /**
     * Update existing Asset entity with AssetUpdateDto values
     * Only allowed for editable assets
     *
     * @param dto    AssetUpdateDto with new values
     * @param entity Existing Asset entity to update
     */
    public void updateEntity(AssetUpdateDto dto, Asset entity) {
        if (dto == null || entity == null) {
            return;
        }

        if (dto.assetName() != null) {
            entity.setAssetName(dto.assetName());
        }
        if (dto.category() != null) {
            entity.setCategory(dto.category());
        }
        if (dto.location() != null) {
            entity.setLocation(dto.location());
        }
        if (dto.manufacturer() != null) {
            entity.setManufacturer(dto.manufacturer());
        }
        if (dto.modelNumber() != null) {
            entity.setModelNumber(dto.modelNumber());
        }
        if (dto.serialNumber() != null) {
            entity.setSerialNumber(dto.serialNumber());
        }
        if (dto.installationDate() != null) {
            entity.setInstallationDate(dto.installationDate());
        }
        if (dto.warrantyExpiryDate() != null) {
            entity.setWarrantyExpiryDate(dto.warrantyExpiryDate());
        }
        if (dto.purchaseCost() != null) {
            entity.setPurchaseCost(dto.purchaseCost());
        }
        if (dto.estimatedUsefulLife() != null) {
            entity.setEstimatedUsefulLife(dto.estimatedUsefulLife());
        }
        // Note: property and status updates are handled separately
    }

    /**
     * Update Asset status with notes
     *
     * @param dto    AssetStatusUpdateDto
     * @param entity Asset entity to update
     */
    public void updateStatus(AssetStatusUpdateDto dto, Asset entity) {
        if (dto == null || entity == null) {
            return;
        }

        entity.setStatus(dto.status());
        entity.setStatusNotes(dto.notes());
    }

    /**
     * Convert Asset entity to AssetResponseDto (full detail)
     * Note: propertyName and propertyAddress are resolved by service layer
     *
     * @param entity Asset entity
     * @return AssetResponseDto
     */
    public AssetResponseDto toResponseDto(Asset entity) {
        if (entity == null) {
            return null;
        }

        // Calculate warranty status
        String warrantyStatus = calculateWarrantyStatus(entity.getWarrantyExpiryDate());
        Integer warrantyDaysRemaining = calculateWarrantyDaysRemaining(entity.getWarrantyExpiryDate());

        return new AssetResponseDto(
                entity.getId(),
                entity.getAssetNumber(),
                entity.getAssetName(),
                entity.getCategory(),
                entity.getCategory() != null ? entity.getCategory().getDisplayName() : null,
                entity.getStatus(),
                entity.getStatus() != null ? entity.getStatus().getDisplayName() : null,
                entity.getStatus() != null ? entity.getStatus().getColor() : null,
                entity.getPropertyId(),
                null, // propertyName - resolved by service
                null, // propertyAddress - resolved by service
                entity.getLocation(),
                entity.getManufacturer(),
                entity.getModelNumber(),
                entity.getSerialNumber(),
                entity.getInstallationDate(),
                entity.getWarrantyExpiryDate(),
                entity.getLastMaintenanceDate(),
                entity.getNextMaintenanceDate(),
                entity.getPurchaseCost(),
                entity.getEstimatedUsefulLife(),
                warrantyStatus,
                warrantyDaysRemaining,
                null, // documents - populated by service if needed
                null, // maintenanceSummary - populated by service
                entity.getStatusNotes(),
                entity.getCreatedBy(),
                null, // createdByName - resolved by service if needed
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.isEditable(),
                entity.canLinkToWorkOrder()
        );
    }

    /**
     * Convert Asset entity to AssetListDto (summary for list view)
     * Note: propertyName is resolved by service layer
     *
     * @param entity Asset entity
     * @return AssetListDto
     */
    public AssetListDto toListDto(Asset entity) {
        if (entity == null) {
            return null;
        }

        String warrantyStatus = calculateWarrantyStatus(entity.getWarrantyExpiryDate());
        Integer warrantyDaysRemaining = calculateWarrantyDaysRemaining(entity.getWarrantyExpiryDate());

        return new AssetListDto(
                entity.getId(),
                entity.getAssetNumber(),
                entity.getAssetName(),
                entity.getCategory(),
                entity.getCategory() != null ? entity.getCategory().getDisplayName() : null,
                entity.getStatus(),
                entity.getStatus() != null ? entity.getStatus().getDisplayName() : null,
                entity.getStatus() != null ? entity.getStatus().getColor() : null,
                entity.getPropertyId(),
                null, // propertyName - resolved by service
                entity.getLocation(),
                entity.getWarrantyExpiryDate(),
                warrantyStatus,
                warrantyDaysRemaining,
                entity.getCreatedAt()
        );
    }

    /**
     * Convert list of Asset entities to list of AssetListDto
     *
     * @param entities List of Asset entities
     * @return List of AssetListDto
     */
    public List<AssetListDto> toListDtoList(List<Asset> entities) {
        if (entities == null) {
            return new ArrayList<>();
        }

        return entities.stream()
                .map(this::toListDto)
                .toList();
    }

    // =================================================================
    // ASSET DOCUMENT MAPPINGS
    // =================================================================

    /**
     * Convert AssetDocument entity to AssetDocumentDto
     *
     * @param entity AssetDocument entity
     * @return AssetDocumentDto
     */
    public AssetDocumentDto toDocumentDto(AssetDocument entity) {
        if (entity == null) {
            return null;
        }

        return new AssetDocumentDto(
                entity.getId(),
                entity.getAssetId(),
                entity.getDocumentType(),
                entity.getDocumentType() != null ? entity.getDocumentType().getDisplayName() : null,
                entity.getFileName(),
                entity.getFilePath(),
                entity.getFileSize(),
                formatFileSize(entity.getFileSize()),
                entity.getContentType(),
                entity.getUploadedBy(),
                null, // uploadedByName - resolved separately if needed
                entity.getUploadedAt(),
                null  // downloadUrl - generated by service
        );
    }

    /**
     * Convert list of AssetDocument entities to list of AssetDocumentDto
     *
     * @param entities List of AssetDocument entities
     * @return List of AssetDocumentDto
     */
    public List<AssetDocumentDto> toDocumentDtoList(List<AssetDocument> entities) {
        if (entities == null) {
            return new ArrayList<>();
        }

        return entities.stream()
                .map(this::toDocumentDto)
                .toList();
    }

    // =================================================================
    // MAINTENANCE HISTORY MAPPINGS
    // =================================================================

    /**
     * Convert WorkOrder to AssetMaintenanceHistoryDto
     * Note: vendorName must be resolved separately by service (WorkOrder only has vendorId)
     *
     * @param workOrder WorkOrder entity
     * @return AssetMaintenanceHistoryDto
     */
    public AssetMaintenanceHistoryDto toMaintenanceHistoryDto(WorkOrder workOrder) {
        if (workOrder == null) {
            return null;
        }

        return new AssetMaintenanceHistoryDto(
                workOrder.getId(),
                workOrder.getWorkOrderNumber(),
                workOrder.getCreatedAt(),
                workOrder.getDescription(),
                workOrder.getStatus() != null ? workOrder.getStatus().name() : null,
                workOrder.getStatus() != null ? formatEnumDisplayName(workOrder.getStatus().name()) : null,
                workOrder.getActualCost(),
                workOrder.getAssignedTo(),  // Vendor UUID (if assigneeType is EXTERNAL_VENDOR)
                null, // vendorName - resolved by service
                workOrder.getCompletedAt()
        );
    }

    /**
     * Convert WorkOrder to AssetMaintenanceHistoryDto with vendor name
     *
     * @param workOrder  WorkOrder entity
     * @param vendorName Resolved vendor name (optional)
     * @return AssetMaintenanceHistoryDto
     */
    public AssetMaintenanceHistoryDto toMaintenanceHistoryDto(WorkOrder workOrder, String vendorName) {
        if (workOrder == null) {
            return null;
        }

        return new AssetMaintenanceHistoryDto(
                workOrder.getId(),
                workOrder.getWorkOrderNumber(),
                workOrder.getCreatedAt(),
                workOrder.getDescription(),
                workOrder.getStatus() != null ? workOrder.getStatus().name() : null,
                workOrder.getStatus() != null ? formatEnumDisplayName(workOrder.getStatus().name()) : null,
                workOrder.getActualCost(),
                workOrder.getAssignedTo(),
                vendorName,
                workOrder.getCompletedAt()
        );
    }

    /**
     * Convert list of WorkOrders to list of AssetMaintenanceHistoryDto
     *
     * @param workOrders List of WorkOrder entities
     * @return List of AssetMaintenanceHistoryDto
     */
    public List<AssetMaintenanceHistoryDto> toMaintenanceHistoryDtoList(List<WorkOrder> workOrders) {
        if (workOrders == null) {
            return new ArrayList<>();
        }

        return workOrders.stream()
                .map(this::toMaintenanceHistoryDto)
                .toList();
    }

    // =================================================================
    // EXPIRING WARRANTY MAPPINGS
    // =================================================================

    /**
     * Convert Asset entity to ExpiringWarrantyDto
     *
     * @param entity Asset entity
     * @return ExpiringWarrantyDto
     */
    public ExpiringWarrantyDto toExpiringWarrantyDto(Asset entity) {
        if (entity == null) {
            return null;
        }

        int daysUntilExpiry = calculateWarrantyDaysRemaining(entity.getWarrantyExpiryDate()) != null
                ? calculateWarrantyDaysRemaining(entity.getWarrantyExpiryDate())
                : 0;

        return new ExpiringWarrantyDto(
                entity.getId(),
                entity.getAssetNumber(),
                entity.getAssetName(),
                entity.getCategory(),
                entity.getCategory() != null ? entity.getCategory().getDisplayName() : null,
                entity.getPropertyId(),
                null, // propertyName - resolved by service
                entity.getWarrantyExpiryDate(),
                daysUntilExpiry
        );
    }

    /**
     * Convert list of Asset entities to list of ExpiringWarrantyDto
     *
     * @param entities List of Asset entities
     * @return List of ExpiringWarrantyDto
     */
    public List<ExpiringWarrantyDto> toExpiringWarrantyDtoList(List<Asset> entities) {
        if (entities == null) {
            return new ArrayList<>();
        }

        return entities.stream()
                .map(this::toExpiringWarrantyDto)
                .toList();
    }

    // =================================================================
    // HELPER METHODS
    // =================================================================

    /**
     * Calculate warranty status based on expiry date
     *
     * @param warrantyExpiryDate Warranty expiry date
     * @return Warranty status: ACTIVE, EXPIRING_SOON, EXPIRED, or NO_WARRANTY
     */
    private String calculateWarrantyStatus(LocalDate warrantyExpiryDate) {
        if (warrantyExpiryDate == null) {
            return "NO_WARRANTY";
        }

        LocalDate today = LocalDate.now();
        long daysUntilExpiry = ChronoUnit.DAYS.between(today, warrantyExpiryDate);

        if (daysUntilExpiry < 0) {
            return "EXPIRED";
        } else if (daysUntilExpiry <= 30) {
            return "EXPIRING_SOON";
        } else {
            return "ACTIVE";
        }
    }

    /**
     * Calculate days remaining until warranty expiry
     *
     * @param warrantyExpiryDate Warranty expiry date
     * @return Days remaining (negative if expired), or null if no warranty
     */
    private Integer calculateWarrantyDaysRemaining(LocalDate warrantyExpiryDate) {
        if (warrantyExpiryDate == null) {
            return null;
        }

        LocalDate today = LocalDate.now();
        return (int) ChronoUnit.DAYS.between(today, warrantyExpiryDate);
    }

    /**
     * Format file size to human-readable format
     *
     * @param bytes File size in bytes
     * @return Formatted file size (e.g., "1.5 MB")
     */
    private String formatFileSize(Long bytes) {
        if (bytes == null || bytes < 0) {
            return "Unknown";
        }

        if (bytes < 1024) {
            return bytes + " B";
        } else if (bytes < 1024 * 1024) {
            return String.format("%.1f KB", bytes / 1024.0);
        } else if (bytes < 1024 * 1024 * 1024) {
            return String.format("%.1f MB", bytes / (1024.0 * 1024));
        } else {
            return String.format("%.1f GB", bytes / (1024.0 * 1024 * 1024));
        }
    }

    /**
     * Format enum name to display name (e.g., IN_PROGRESS -> In Progress)
     *
     * @param enumName Enum name in UPPER_SNAKE_CASE
     * @return Display name in Title Case with spaces
     */
    private String formatEnumDisplayName(String enumName) {
        if (enumName == null || enumName.isEmpty()) {
            return null;
        }
        String[] words = enumName.toLowerCase().split("_");
        StringBuilder result = new StringBuilder();
        for (String word : words) {
            if (!result.isEmpty()) {
                result.append(" ");
            }
            result.append(Character.toUpperCase(word.charAt(0)));
            if (word.length() > 1) {
                result.append(word.substring(1));
            }
        }
        return result.toString();
    }
}
