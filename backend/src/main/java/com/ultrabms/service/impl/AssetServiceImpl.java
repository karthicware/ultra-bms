package com.ultrabms.service.impl;

import com.ultrabms.dto.assets.*;
import com.ultrabms.dto.common.DropdownOptionDto;
import com.ultrabms.entity.Asset;
import com.ultrabms.entity.AssetDocument;
import com.ultrabms.entity.Property;
import com.ultrabms.entity.Vendor;
import com.ultrabms.entity.WorkOrder;
import com.ultrabms.entity.enums.AssetDocumentType;
import com.ultrabms.entity.enums.AssetStatus;
import com.ultrabms.entity.enums.AssigneeType;
import com.ultrabms.entity.enums.WorkOrderStatus;
import com.ultrabms.exception.ValidationException;
import com.ultrabms.exception.ResourceNotFoundException;
import com.ultrabms.mapper.AssetMapper;
import com.ultrabms.repository.AssetDocumentRepository;
import com.ultrabms.repository.AssetRepository;
import com.ultrabms.repository.PropertyRepository;
import com.ultrabms.repository.VendorRepository;
import com.ultrabms.repository.WorkOrderRepository;
import com.ultrabms.service.AssetService;
import com.ultrabms.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Year;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Implementation of AssetService.
 * Handles asset CRUD, document management, and warranty tracking.
 *
 * Story 7.1: Asset Registry and Tracking
 */
@Service
@RequiredArgsConstructor
@Transactional
public class AssetServiceImpl implements AssetService {

    private static final Logger LOGGER = LoggerFactory.getLogger(AssetServiceImpl.class);
    private static final String ASSET_DOCUMENTS_DIR = "assets";
    private static final int DEFAULT_WARRANTY_ALERT_DAYS = 30;

    private final AssetRepository assetRepository;
    private final AssetDocumentRepository assetDocumentRepository;
    private final PropertyRepository propertyRepository;
    private final WorkOrderRepository workOrderRepository;
    private final VendorRepository vendorRepository;
    private final FileStorageService fileStorageService;
    private final AssetMapper assetMapper;

    // =================================================================
    // ASSET CRUD OPERATIONS
    // =================================================================

    @Override
    public AssetResponseDto createAsset(AssetCreateDto dto, UUID createdBy) {
        LOGGER.info("Creating asset: {} for property: {}", dto.assetName(), dto.propertyId());

        // Validate property exists
        Property property = propertyRepository.findById(dto.propertyId())
                .orElseThrow(() -> new ResourceNotFoundException("Property not found: " + dto.propertyId()));

        // Create asset entity
        Asset asset = assetMapper.toEntity(dto);
        asset.setPropertyId(dto.propertyId());
        asset.setAssetNumber(generateAssetNumber());

        Asset savedAsset = assetRepository.save(asset);
        LOGGER.info("Asset created: {} with number: {}", savedAsset.getId(), savedAsset.getAssetNumber());

        return enrichResponseDto(assetMapper.toResponseDto(savedAsset), property.getPropertyName());
    }

    @Override
    @Transactional(readOnly = true)
    public AssetResponseDto getAssetById(UUID id) {
        LOGGER.debug("Getting asset by ID: {}", id);

        Asset asset = findAssetById(id);
        Property property = propertyRepository.findById(asset.getPropertyId())
                .orElse(null);

        AssetResponseDto responseDto = assetMapper.toResponseDto(asset);

        // Enrich with property name
        if (property != null) {
            responseDto = enrichResponseDto(responseDto, property.getPropertyName());
        }

        // Add maintenance summary
        responseDto = enrichWithMaintenanceSummary(responseDto, id);

        return responseDto;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AssetListDto> getAssets(AssetFilterDto filterDto) {
        LOGGER.debug("Getting assets with filter: {}", filterDto);

        Pageable pageable = createPageable(filterDto);
        Page<Asset> assetsPage = assetRepository.searchWithFilters(
                filterDto.search(),
                filterDto.propertyId(),
                filterDto.category(),
                filterDto.status(),
                pageable
        );

        // Get all property IDs for batch lookup
        List<UUID> propertyIds = assetsPage.getContent().stream()
                .map(Asset::getPropertyId)
                .distinct()
                .toList();

        Map<UUID, String> propertyNames = propertyRepository.findAllById(propertyIds).stream()
                .collect(Collectors.toMap(Property::getId, Property::getPropertyName));

        return assetsPage.map(asset -> {
            AssetListDto dto = assetMapper.toListDto(asset);
            // Enrich with property name using reflection-free approach
            return enrichListDto(dto, propertyNames.get(asset.getPropertyId()));
        });
    }

    @Override
    public AssetResponseDto updateAsset(UUID id, AssetUpdateDto dto, UUID updatedBy) {
        LOGGER.info("Updating asset: {}", id);

        Asset asset = findAssetById(id);

        if (!asset.isEditable()) {
            throw new ValidationException("Asset cannot be edited in current status: " + asset.getStatus());
        }

        // Update property if changed
        if (dto.propertyId() != null && !dto.propertyId().equals(asset.getPropertyId())) {
            propertyRepository.findById(dto.propertyId())
                    .orElseThrow(() -> new ResourceNotFoundException("Property not found: " + dto.propertyId()));
            asset.setPropertyId(dto.propertyId());
        }

        assetMapper.updateEntity(dto, asset);
        Asset updatedAsset = assetRepository.save(asset);

        LOGGER.info("Asset updated: {}", id);

        Property property = propertyRepository.findById(updatedAsset.getPropertyId())
                .orElse(null);

        AssetResponseDto responseDto = assetMapper.toResponseDto(updatedAsset);
        if (property != null) {
            responseDto = enrichResponseDto(responseDto, property.getPropertyName());
        }
        return enrichWithMaintenanceSummary(responseDto, id);
    }

    @Override
    public AssetResponseDto updateAssetStatus(UUID id, AssetStatusUpdateDto dto, UUID updatedBy) {
        LOGGER.info("Updating asset status: {} to {}", id, dto.status());

        Asset asset = findAssetById(id);
        AssetStatus oldStatus = asset.getStatus();

        assetMapper.updateStatus(dto, asset);
        Asset updatedAsset = assetRepository.save(asset);

        LOGGER.info("Asset {} status changed from {} to {}", id, oldStatus, dto.status());

        Property property = propertyRepository.findById(updatedAsset.getPropertyId())
                .orElse(null);

        AssetResponseDto responseDto = assetMapper.toResponseDto(updatedAsset);
        if (property != null) {
            responseDto = enrichResponseDto(responseDto, property.getPropertyName());
        }
        return enrichWithMaintenanceSummary(responseDto, id);
    }

    @Override
    public void deleteAsset(UUID id, UUID deletedBy) {
        LOGGER.info("Deleting asset: {}", id);

        Asset asset = findAssetById(id);

        // Soft delete
        asset.setIsDeleted(true);
        assetRepository.save(asset);

        LOGGER.info("Asset soft deleted: {}", id);
    }

    // =================================================================
    // DOCUMENT OPERATIONS
    // =================================================================

    @Override
    public AssetDocumentDto uploadDocument(UUID assetId, AssetDocumentType documentType,
                                           MultipartFile file, UUID uploadedBy) {
        LOGGER.info("Uploading document for asset: {}, type: {}", assetId, documentType);

        Asset asset = findAssetById(assetId);

        // Store file in S3
        String directory = ASSET_DOCUMENTS_DIR + "/" + assetId;
        String filePath = fileStorageService.storeFile(file, directory);

        // Create document record
        AssetDocument document = AssetDocument.builder()
                .assetId(assetId)
                .documentType(documentType)
                .fileName(file.getOriginalFilename())
                .filePath(filePath)
                .fileSize(file.getSize())
                .contentType(file.getContentType())
                .uploadedBy(uploadedBy)
                .uploadedAt(LocalDateTime.now())
                .build();

        AssetDocument savedDocument = assetDocumentRepository.save(document);
        LOGGER.info("Document uploaded: {} for asset: {}", savedDocument.getId(), assetId);

        AssetDocumentDto dto = assetMapper.toDocumentDto(savedDocument);
        return enrichDocumentDto(dto, fileStorageService.getDownloadUrl(filePath));
    }

    @Override
    @Transactional(readOnly = true)
    public List<AssetDocumentDto> getAssetDocuments(UUID assetId) {
        LOGGER.debug("Getting documents for asset: {}", assetId);

        // Verify asset exists
        findAssetById(assetId);

        List<AssetDocument> documents = assetDocumentRepository.findByAssetIdOrderByUploadedAtDesc(assetId);

        return documents.stream()
                .map(doc -> {
                    AssetDocumentDto dto = assetMapper.toDocumentDto(doc);
                    return enrichDocumentDto(dto, fileStorageService.getDownloadUrl(doc.getFilePath()));
                })
                .toList();
    }

    @Override
    public void deleteDocument(UUID assetId, UUID documentId, UUID deletedBy) {
        LOGGER.info("Deleting document: {} from asset: {}", documentId, assetId);

        AssetDocument document = assetDocumentRepository.findByIdAndAssetId(documentId, assetId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Document not found: " + documentId + " for asset: " + assetId));

        // Delete from S3
        fileStorageService.deleteFile(document.getFilePath());

        // Delete record
        assetDocumentRepository.delete(document);

        LOGGER.info("Document deleted: {}", documentId);
    }

    @Override
    @Transactional(readOnly = true)
    public String getDocumentDownloadUrl(UUID assetId, UUID documentId) {
        LOGGER.debug("Getting download URL for document: {} of asset: {}", documentId, assetId);

        AssetDocument document = assetDocumentRepository.findByIdAndAssetId(documentId, assetId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Document not found: " + documentId + " for asset: " + assetId));

        return fileStorageService.getDownloadUrl(document.getFilePath());
    }

    // =================================================================
    // MAINTENANCE HISTORY
    // =================================================================

    @Override
    @Transactional(readOnly = true)
    public List<AssetMaintenanceHistoryDto> getMaintenanceHistory(UUID assetId) {
        LOGGER.debug("Getting maintenance history for asset: {}", assetId);

        // Verify asset exists
        findAssetById(assetId);

        List<WorkOrder> workOrders = workOrderRepository.findByAssetIdOrderByCreatedAtDesc(assetId);

        if (workOrders.isEmpty()) {
            return new ArrayList<>();
        }

        // Get vendor IDs for batch lookup (only for external vendor assignments)
        List<UUID> vendorIds = workOrders.stream()
                .filter(wo -> wo.getAssigneeType() == AssigneeType.EXTERNAL_VENDOR && wo.getAssignedTo() != null)
                .map(WorkOrder::getAssignedTo)
                .distinct()
                .toList();

        Map<UUID, String> vendorNames = vendorRepository.findAllById(vendorIds).stream()
                .collect(Collectors.toMap(Vendor::getId, Vendor::getCompanyName));

        return workOrders.stream()
                .map(wo -> {
                    String vendorName = null;
                    if (wo.getAssigneeType() == AssigneeType.EXTERNAL_VENDOR && wo.getAssignedTo() != null) {
                        vendorName = vendorNames.get(wo.getAssignedTo());
                    }
                    return assetMapper.toMaintenanceHistoryDto(wo, vendorName);
                })
                .toList();
    }

    // =================================================================
    // WARRANTY TRACKING
    // =================================================================

    @Override
    @Transactional(readOnly = true)
    public List<ExpiringWarrantyDto> getExpiringWarranties(int daysAhead) {
        LOGGER.debug("Getting assets with warranties expiring in {} days", daysAhead);

        LocalDate today = LocalDate.now();
        LocalDate expiryThreshold = today.plusDays(daysAhead);

        List<Asset> assets = assetRepository.findAssetsWithExpiringWarranty(today, expiryThreshold);

        // Get property names for batch lookup
        List<UUID> propertyIds = assets.stream()
                .map(Asset::getPropertyId)
                .distinct()
                .toList();

        Map<UUID, String> propertyNames = propertyRepository.findAllById(propertyIds).stream()
                .collect(Collectors.toMap(Property::getId, Property::getPropertyName));

        return assets.stream()
                .map(asset -> enrichExpiringWarrantyDto(
                        assetMapper.toExpiringWarrantyDto(asset),
                        propertyNames.get(asset.getPropertyId())))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExpiringWarrantyDto> getAssetsForWarrantyNotification() {
        // Assets expiring in exactly 30 days (for daily notification job)
        return getExpiringWarranties(DEFAULT_WARRANTY_ALERT_DAYS);
    }

    // =================================================================
    // DROPDOWN SUPPORT
    // =================================================================

    @Override
    @Transactional(readOnly = true)
    public List<DropdownOptionDto> getAssetsForDropdown(UUID propertyId) {
        LOGGER.debug("Getting assets for dropdown, propertyId: {}", propertyId);

        List<Asset> assets = assetRepository.findForDropdown(propertyId);

        return assets.stream()
                .map(asset -> new DropdownOptionDto(
                        asset.getId(),
                        asset.getAssetName(),
                        asset.getAssetNumber()
                ))
                .toList();
    }

    // =================================================================
    // HELPER METHODS
    // =================================================================

    /**
     * Find asset by ID or throw ResourceNotFoundException
     */
    private Asset findAssetById(UUID id) {
        return assetRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Asset not found: " + id));
    }

    /**
     * Generate unique asset number in format AST-{YEAR}-{SEQUENCE}
     * AC #4: Auto-generate asset number
     */
    private String generateAssetNumber() {
        int year = Year.now().getValue();
        String prefix = "AST-" + year + "-";

        Long sequence = assetRepository.getNextAssetNumberSequence();
        String formattedSequence = String.format("%04d", sequence);

        return prefix + formattedSequence;
    }

    /**
     * Create pageable from filter DTO
     */
    private Pageable createPageable(AssetFilterDto filterDto) {
        String sortBy = mapSortField(filterDto.sortBy());
        Sort.Direction direction = "ASC".equalsIgnoreCase(filterDto.sortDirection())
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;

        return PageRequest.of(filterDto.page(), filterDto.size(), Sort.by(direction, sortBy));
    }

    /**
     * Map sort field from DTO to entity field name
     */
    private String mapSortField(String sortBy) {
        return switch (sortBy) {
            case "assetNumber" -> "assetNumber";
            case "assetName" -> "assetName";
            case "category" -> "category";
            case "status" -> "status";
            case "warrantyExpiryDate" -> "warrantyExpiryDate";
            default -> "createdAt";
        };
    }

    /**
     * Enrich AssetResponseDto with property name (since record is immutable)
     */
    private AssetResponseDto enrichResponseDto(AssetResponseDto dto, String propertyName) {
        return new AssetResponseDto(
                dto.id(),
                dto.assetNumber(),
                dto.assetName(),
                dto.category(),
                dto.categoryDisplayName(),
                dto.propertyId(),
                propertyName,
                dto.location(),
                dto.manufacturer(),
                dto.modelNumber(),
                dto.serialNumber(),
                dto.installationDate(),
                dto.warrantyExpiryDate(),
                dto.warrantyStatus(),
                dto.warrantyDaysRemaining(),
                dto.purchaseCost(),
                dto.estimatedUsefulLife(),
                dto.status(),
                dto.statusDisplayName(),
                dto.statusColor(),
                dto.lastMaintenanceDate(),
                dto.nextMaintenanceDate(),
                dto.statusNotes(),
                dto.maintenanceSummary(),
                dto.createdAt(),
                dto.updatedAt(),
                dto.editable(),
                dto.canLinkToWorkOrder()
        );
    }

    /**
     * Enrich AssetResponseDto with maintenance summary
     */
    private AssetResponseDto enrichWithMaintenanceSummary(AssetResponseDto dto, UUID assetId) {
        long totalWorkOrders = workOrderRepository.countByAssetId(assetId);
        long completedWorkOrders = workOrderRepository.countByAssetIdAndStatus(assetId, WorkOrderStatus.COMPLETED);

        // Calculate total maintenance cost from completed work orders
        List<WorkOrder> completedWOs = workOrderRepository.findByAssetIdOrderByCreatedAtDesc(assetId).stream()
                .filter(wo -> wo.getStatus() == WorkOrderStatus.COMPLETED && wo.getActualCost() != null)
                .toList();

        BigDecimal totalCost = completedWOs.stream()
                .map(WorkOrder::getActualCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        AssetResponseDto.MaintenanceSummaryDto summary = new AssetResponseDto.MaintenanceSummaryDto(
                totalWorkOrders,
                completedWorkOrders,
                totalCost
        );

        return new AssetResponseDto(
                dto.id(),
                dto.assetNumber(),
                dto.assetName(),
                dto.category(),
                dto.categoryDisplayName(),
                dto.propertyId(),
                dto.propertyName(),
                dto.location(),
                dto.manufacturer(),
                dto.modelNumber(),
                dto.serialNumber(),
                dto.installationDate(),
                dto.warrantyExpiryDate(),
                dto.warrantyStatus(),
                dto.warrantyDaysRemaining(),
                dto.purchaseCost(),
                dto.estimatedUsefulLife(),
                dto.status(),
                dto.statusDisplayName(),
                dto.statusColor(),
                dto.lastMaintenanceDate(),
                dto.nextMaintenanceDate(),
                dto.statusNotes(),
                summary,
                dto.createdAt(),
                dto.updatedAt(),
                dto.editable(),
                dto.canLinkToWorkOrder()
        );
    }

    /**
     * Enrich AssetListDto with property name
     */
    private AssetListDto enrichListDto(AssetListDto dto, String propertyName) {
        return new AssetListDto(
                dto.id(),
                dto.assetNumber(),
                dto.assetName(),
                dto.category(),
                dto.categoryDisplayName(),
                dto.status(),
                dto.statusDisplayName(),
                dto.statusColor(),
                dto.propertyId(),
                propertyName,
                dto.location(),
                dto.warrantyExpiryDate(),
                dto.warrantyStatus(),
                dto.warrantyDaysRemaining(),
                dto.createdAt()
        );
    }

    /**
     * Enrich AssetDocumentDto with download URL
     */
    private AssetDocumentDto enrichDocumentDto(AssetDocumentDto dto, String downloadUrl) {
        return new AssetDocumentDto(
                dto.id(),
                dto.assetId(),
                dto.documentType(),
                dto.documentTypeDisplayName(),
                dto.fileName(),
                dto.filePath(),
                dto.fileSize(),
                dto.formattedFileSize(),
                dto.contentType(),
                dto.uploadedBy(),
                dto.uploadedByName(),
                dto.uploadedAt(),
                downloadUrl
        );
    }

    /**
     * Enrich ExpiringWarrantyDto with property name
     */
    private ExpiringWarrantyDto enrichExpiringWarrantyDto(ExpiringWarrantyDto dto, String propertyName) {
        return new ExpiringWarrantyDto(
                dto.id(),
                dto.assetNumber(),
                dto.assetName(),
                dto.category(),
                dto.categoryDisplayName(),
                dto.propertyId(),
                propertyName,
                dto.warrantyExpiryDate(),
                dto.daysUntilExpiry()
        );
    }
}
