package com.ultrabms.service;

import com.ultrabms.dto.assets.*;
import com.ultrabms.dto.common.DropdownOptionDto;
import com.ultrabms.entity.enums.AssetDocumentType;
import org.springframework.data.domain.Page;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

/**
 * Service interface for Asset operations.
 * Handles asset CRUD, document management, and warranty tracking.
 *
 * Story 7.1: Asset Registry and Tracking
 */
public interface AssetService {

    // =================================================================
    // ASSET CRUD OPERATIONS
    // =================================================================

    /**
     * Create a new asset
     * AC #6: POST /api/v1/assets - Create asset
     * AC #4: Auto-generate asset number (AST-YYYY-NNNN)
     *
     * @param dto        AssetCreateDto with asset data
     * @param createdBy  User UUID who is creating the asset
     * @return Created asset response DTO
     */
    AssetResponseDto createAsset(AssetCreateDto dto, UUID createdBy);

    /**
     * Get asset by ID with full details
     * AC #8: GET /api/v1/assets/{id} - Get single asset
     *
     * @param id Asset UUID
     * @return Asset response DTO with details
     */
    AssetResponseDto getAssetById(UUID id);

    /**
     * Get paginated list of assets with filters
     * AC #7: GET /api/v1/assets - List with filters
     *
     * @param filterDto Filter parameters (search, propertyId, category, status)
     * @return Page of asset list DTOs
     */
    Page<AssetListDto> getAssets(AssetFilterDto filterDto);

    /**
     * Update asset details
     * AC #9: PUT /api/v1/assets/{id} - Update asset
     *
     * @param id         Asset UUID
     * @param dto        AssetUpdateDto with updated data
     * @param updatedBy  User UUID who is updating
     * @return Updated asset response DTO
     */
    AssetResponseDto updateAsset(UUID id, AssetUpdateDto dto, UUID updatedBy);

    /**
     * Update asset status with notes
     * AC #10: PUT /api/v1/assets/{id}/status
     *
     * @param id         Asset UUID
     * @param dto        AssetStatusUpdateDto with status and notes
     * @param updatedBy  User UUID who is updating
     * @return Updated asset response DTO
     */
    AssetResponseDto updateAssetStatus(UUID id, AssetStatusUpdateDto dto, UUID updatedBy);

    /**
     * Soft delete an asset
     * AC #6: Soft delete with isDeleted flag
     *
     * @param id        Asset UUID
     * @param deletedBy User UUID who is deleting
     */
    void deleteAsset(UUID id, UUID deletedBy);

    // =================================================================
    // DOCUMENT OPERATIONS
    // =================================================================

    /**
     * Upload document for an asset
     * AC #12: POST /api/v1/assets/{id}/documents - Upload to S3
     *
     * @param assetId      Asset UUID
     * @param documentType Document type enum
     * @param file         Document file
     * @param uploadedBy   User UUID who is uploading
     * @return Created document DTO
     */
    AssetDocumentDto uploadDocument(UUID assetId, AssetDocumentType documentType, MultipartFile file, UUID uploadedBy);

    /**
     * Get all documents for an asset
     *
     * @param assetId Asset UUID
     * @return List of document DTOs
     */
    List<AssetDocumentDto> getAssetDocuments(UUID assetId);

    /**
     * Delete a document
     * AC #13: DELETE /api/v1/assets/{assetId}/documents/{documentId}
     *
     * @param assetId    Asset UUID
     * @param documentId Document UUID
     * @param deletedBy  User UUID who is deleting
     */
    void deleteDocument(UUID assetId, UUID documentId, UUID deletedBy);

    /**
     * Get presigned download URL for a document
     *
     * @param assetId    Asset UUID
     * @param documentId Document UUID
     * @return Presigned URL string
     */
    String getDocumentDownloadUrl(UUID assetId, UUID documentId);

    // =================================================================
    // MAINTENANCE HISTORY
    // =================================================================

    /**
     * Get maintenance history (work orders) for an asset
     * AC #11: GET /api/v1/assets/{id}/maintenance-history
     *
     * @param assetId Asset UUID
     * @return List of maintenance history DTOs
     */
    List<AssetMaintenanceHistoryDto> getMaintenanceHistory(UUID assetId);

    // =================================================================
    // WARRANTY TRACKING
    // =================================================================

    /**
     * Get assets with warranties expiring within specified days
     * AC #14: GET /api/v1/assets/expiring-warranties
     *
     * @param daysAhead Number of days to look ahead (default 30)
     * @return List of expiring warranty DTOs
     */
    List<ExpiringWarrantyDto> getExpiringWarranties(int daysAhead);

    /**
     * Get assets with expiring warranties for notification processing
     * Used by scheduler job
     *
     * @return List of assets with warranties expiring in 30 days
     */
    List<ExpiringWarrantyDto> getAssetsForWarrantyNotification();

    // =================================================================
    // DROPDOWN SUPPORT
    // =================================================================

    /**
     * Get assets for dropdown (work order linking)
     * AC #15: GET /api/v1/assets/dropdown
     *
     * @param propertyId Optional property filter
     * @return List of dropdown options
     */
    List<DropdownOptionDto> getAssetsForDropdown(UUID propertyId);
}
