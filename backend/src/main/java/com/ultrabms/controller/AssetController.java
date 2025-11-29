package com.ultrabms.controller;

import com.ultrabms.dto.assets.*;
import com.ultrabms.dto.common.DropdownOptionDto;
import com.ultrabms.entity.User;
import com.ultrabms.entity.enums.AssetCategory;
import com.ultrabms.entity.enums.AssetDocumentType;
import com.ultrabms.entity.enums.AssetStatus;
import com.ultrabms.repository.UserRepository;
import com.ultrabms.service.AssetService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST Controller for Asset Management.
 * Handles asset CRUD, documents, maintenance history, and warranty tracking.
 *
 * Story 7.1: Asset Registry and Tracking
 * AC #31: AssetController with REST endpoints
 */
@RestController
@RequestMapping("/api/v1/assets")
@Tag(name = "Assets", description = "Asset registry and tracking APIs")
@SecurityRequirement(name = "Bearer Authentication")
public class AssetController {

    private static final Logger LOGGER = LoggerFactory.getLogger(AssetController.class);

    private final AssetService assetService;
    private final UserRepository userRepository;

    public AssetController(AssetService assetService, UserRepository userRepository) {
        this.assetService = assetService;
        this.userRepository = userRepository;
    }

    // =================================================================
    // ASSET CRUD OPERATIONS
    // =================================================================

    /**
     * Create a new asset
     * POST /api/v1/assets
     * AC #6: Create asset endpoint
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Create asset",
            description = "Create a new asset with auto-generated asset number"
    )
    public ResponseEntity<Map<String, Object>> createAsset(
            @RequestBody @Valid AssetCreateDto dto,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        LOGGER.info("Creating asset: {} by user: {}", dto.assetName(), userDetails.getUsername());

        UUID userId = getUserIdFromUserDetails(userDetails);
        AssetResponseDto response = assetService.createAsset(dto, userId);

        Map<String, Object> responseBody = buildSuccessResponse(response, "Asset created successfully");
        return ResponseEntity.status(HttpStatus.CREATED).body(responseBody);
    }

    /**
     * Get asset by ID
     * GET /api/v1/assets/{id}
     * AC #8: Get single asset with details
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'MAINTENANCE_SUPERVISOR')")
    @Operation(
            summary = "Get asset",
            description = "Get asset details by ID including maintenance summary"
    )
    public ResponseEntity<Map<String, Object>> getAsset(@PathVariable UUID id) {
        LOGGER.debug("Getting asset: {}", id);

        AssetResponseDto response = assetService.getAssetById(id);

        Map<String, Object> responseBody = buildSuccessResponse(response, "Asset retrieved successfully");
        return ResponseEntity.ok(responseBody);
    }

    /**
     * Get paginated list of assets with filters
     * GET /api/v1/assets?search=...&category=...&status=...
     * AC #7: List with filters
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'MAINTENANCE_SUPERVISOR')")
    @Operation(
            summary = "List assets",
            description = "Get paginated list of assets with optional filters"
    )
    public ResponseEntity<Map<String, Object>> getAssets(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UUID propertyId,
            @RequestParam(required = false) AssetCategory category,
            @RequestParam(required = false) AssetStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection
    ) {
        LOGGER.debug("Getting assets with filters - search: {}, category: {}, status: {}", search, category, status);

        AssetFilterDto filterDto = new AssetFilterDto(
                search, propertyId, category, status, page, size, sortBy, sortDirection
        );

        Page<AssetListDto> assetsPage = assetService.getAssets(filterDto);

        Map<String, Object> responseBody = buildPageResponse(assetsPage, "Assets retrieved successfully");
        return ResponseEntity.ok(responseBody);
    }

    /**
     * Update asset details
     * PUT /api/v1/assets/{id}
     * AC #9: Update asset
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Update asset",
            description = "Update asset details (not allowed for DISPOSED assets)"
    )
    public ResponseEntity<Map<String, Object>> updateAsset(
            @PathVariable UUID id,
            @RequestBody @Valid AssetUpdateDto dto,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        LOGGER.info("Updating asset: {} by user: {}", id, userDetails.getUsername());

        UUID userId = getUserIdFromUserDetails(userDetails);
        AssetResponseDto response = assetService.updateAsset(id, dto, userId);

        Map<String, Object> responseBody = buildSuccessResponse(response, "Asset updated successfully");
        return ResponseEntity.ok(responseBody);
    }

    /**
     * Update asset status
     * PUT /api/v1/assets/{id}/status
     * AC #10: Status update with notes
     */
    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Update asset status",
            description = "Change asset status (ACTIVE, UNDER_MAINTENANCE, OUT_OF_SERVICE, DISPOSED)"
    )
    public ResponseEntity<Map<String, Object>> updateAssetStatus(
            @PathVariable UUID id,
            @RequestBody @Valid AssetStatusUpdateDto dto,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        LOGGER.info("Updating asset {} status to {} by user: {}", id, dto.status(), userDetails.getUsername());

        UUID userId = getUserIdFromUserDetails(userDetails);
        AssetResponseDto response = assetService.updateAssetStatus(id, dto, userId);

        Map<String, Object> responseBody = buildSuccessResponse(response, "Asset status updated successfully");
        return ResponseEntity.ok(responseBody);
    }

    /**
     * Delete (soft) asset
     * DELETE /api/v1/assets/{id}
     * AC #6: Soft delete with isDeleted flag
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(
            summary = "Delete asset",
            description = "Soft delete an asset (sets isDeleted flag)"
    )
    public ResponseEntity<Map<String, Object>> deleteAsset(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        LOGGER.info("Deleting asset: {} by user: {}", id, userDetails.getUsername());

        UUID userId = getUserIdFromUserDetails(userDetails);
        assetService.deleteAsset(id, userId);

        Map<String, Object> responseBody = buildSuccessResponse(null, "Asset deleted successfully");
        return ResponseEntity.ok(responseBody);
    }

    // =================================================================
    // DOCUMENT OPERATIONS
    // =================================================================

    /**
     * Upload document for asset
     * POST /api/v1/assets/{assetId}/documents
     * AC #12: Document upload to S3
     */
    @PostMapping(value = "/{assetId}/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Upload asset document",
            description = "Upload a document (manual, warranty, invoice, etc.) for an asset"
    )
    public ResponseEntity<Map<String, Object>> uploadDocument(
            @PathVariable UUID assetId,
            @RequestParam("documentType") AssetDocumentType documentType,
            @RequestPart("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        LOGGER.info("Uploading document for asset: {} type: {} by user: {}", assetId, documentType, userDetails.getUsername());

        UUID userId = getUserIdFromUserDetails(userDetails);
        AssetDocumentDto response = assetService.uploadDocument(assetId, documentType, file, userId);

        Map<String, Object> responseBody = buildSuccessResponse(response, "Document uploaded successfully");
        return ResponseEntity.status(HttpStatus.CREATED).body(responseBody);
    }

    /**
     * Get all documents for asset
     * GET /api/v1/assets/{assetId}/documents
     */
    @GetMapping("/{assetId}/documents")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'MAINTENANCE_SUPERVISOR')")
    @Operation(
            summary = "Get asset documents",
            description = "Get all documents for an asset"
    )
    public ResponseEntity<Map<String, Object>> getDocuments(@PathVariable UUID assetId) {
        LOGGER.debug("Getting documents for asset: {}", assetId);

        List<AssetDocumentDto> documents = assetService.getAssetDocuments(assetId);

        Map<String, Object> responseBody = buildSuccessResponse(documents, "Documents retrieved successfully");
        return ResponseEntity.ok(responseBody);
    }

    /**
     * Delete document
     * DELETE /api/v1/assets/{assetId}/documents/{documentId}
     * AC #13: Document deletion
     */
    @DeleteMapping("/{assetId}/documents/{documentId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Delete asset document",
            description = "Delete a document from an asset"
    )
    public ResponseEntity<Map<String, Object>> deleteDocument(
            @PathVariable UUID assetId,
            @PathVariable UUID documentId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        LOGGER.info("Deleting document: {} from asset: {} by user: {}", documentId, assetId, userDetails.getUsername());

        UUID userId = getUserIdFromUserDetails(userDetails);
        assetService.deleteDocument(assetId, documentId, userId);

        Map<String, Object> responseBody = buildSuccessResponse(null, "Document deleted successfully");
        return ResponseEntity.ok(responseBody);
    }

    /**
     * Get document download URL
     * GET /api/v1/assets/{assetId}/documents/{documentId}/download
     */
    @GetMapping("/{assetId}/documents/{documentId}/download")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'MAINTENANCE_SUPERVISOR')")
    @Operation(
            summary = "Get document download URL",
            description = "Get presigned URL for document download (expires in 5 minutes)"
    )
    public ResponseEntity<Map<String, Object>> getDocumentDownloadUrl(
            @PathVariable UUID assetId,
            @PathVariable UUID documentId
    ) {
        LOGGER.debug("Getting download URL for document: {} of asset: {}", documentId, assetId);

        String downloadUrl = assetService.getDocumentDownloadUrl(assetId, documentId);

        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("success", true);
        responseBody.put("downloadUrl", downloadUrl);
        responseBody.put("message", "Download URL generated successfully");

        return ResponseEntity.ok(responseBody);
    }

    // =================================================================
    // MAINTENANCE HISTORY
    // =================================================================

    /**
     * Get maintenance history for asset
     * GET /api/v1/assets/{id}/maintenance-history
     * AC #11: Work orders linked to asset
     */
    @GetMapping("/{id}/maintenance-history")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'MAINTENANCE_SUPERVISOR')")
    @Operation(
            summary = "Get maintenance history",
            description = "Get all work orders linked to this asset"
    )
    public ResponseEntity<Map<String, Object>> getMaintenanceHistory(@PathVariable UUID id) {
        LOGGER.debug("Getting maintenance history for asset: {}", id);

        List<AssetMaintenanceHistoryDto> history = assetService.getMaintenanceHistory(id);

        Map<String, Object> responseBody = buildSuccessResponse(history, "Maintenance history retrieved successfully");
        return ResponseEntity.ok(responseBody);
    }

    // =================================================================
    // WARRANTY TRACKING
    // =================================================================

    /**
     * Get assets with expiring warranties
     * GET /api/v1/assets/expiring-warranties
     * AC #14: Warranty expiry tracking
     */
    @GetMapping("/expiring-warranties")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Get expiring warranties",
            description = "Get assets with warranties expiring within specified days (default 30)"
    )
    public ResponseEntity<Map<String, Object>> getExpiringWarranties(
            @RequestParam(defaultValue = "30") int daysAhead
    ) {
        LOGGER.debug("Getting assets with warranties expiring in {} days", daysAhead);

        List<ExpiringWarrantyDto> assets = assetService.getExpiringWarranties(daysAhead);

        Map<String, Object> responseBody = buildSuccessResponse(assets, "Expiring warranties retrieved successfully");
        return ResponseEntity.ok(responseBody);
    }

    // =================================================================
    // DROPDOWN SUPPORT
    // =================================================================

    /**
     * Get assets for dropdown (work order linking)
     * GET /api/v1/assets/dropdown
     * AC #15: Asset dropdown for work order creation
     */
    @GetMapping("/dropdown")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'MAINTENANCE_SUPERVISOR')")
    @Operation(
            summary = "Get assets for dropdown",
            description = "Get asset list for dropdowns (e.g., work order linking)"
    )
    public ResponseEntity<Map<String, Object>> getAssetsForDropdown(
            @RequestParam(required = false) UUID propertyId
    ) {
        LOGGER.debug("Getting assets for dropdown, propertyId: {}", propertyId);

        List<DropdownOptionDto> options = assetService.getAssetsForDropdown(propertyId);

        Map<String, Object> responseBody = buildSuccessResponse(options, "Dropdown options retrieved successfully");
        return ResponseEntity.ok(responseBody);
    }

    // =================================================================
    // ENUM ENDPOINTS
    // =================================================================

    /**
     * Get asset categories
     * GET /api/v1/assets/categories
     */
    @GetMapping("/categories")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'MAINTENANCE_SUPERVISOR')")
    @Operation(
            summary = "Get asset categories",
            description = "Get all available asset categories"
    )
    public ResponseEntity<Map<String, Object>> getCategories() {
        List<Map<String, String>> categories = java.util.Arrays.stream(AssetCategory.values())
                .map(cat -> Map.of(
                        "value", cat.name(),
                        "label", cat.getDisplayName()
                ))
                .toList();

        Map<String, Object> responseBody = buildSuccessResponse(categories, "Categories retrieved successfully");
        return ResponseEntity.ok(responseBody);
    }

    /**
     * Get asset statuses
     * GET /api/v1/assets/statuses
     */
    @GetMapping("/statuses")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'MAINTENANCE_SUPERVISOR')")
    @Operation(
            summary = "Get asset statuses",
            description = "Get all available asset statuses"
    )
    public ResponseEntity<Map<String, Object>> getStatuses() {
        List<Map<String, String>> statuses = java.util.Arrays.stream(AssetStatus.values())
                .map(status -> Map.of(
                        "value", status.name(),
                        "label", status.getDisplayName(),
                        "color", status.getColor()
                ))
                .toList();

        Map<String, Object> responseBody = buildSuccessResponse(statuses, "Statuses retrieved successfully");
        return ResponseEntity.ok(responseBody);
    }

    /**
     * Get document types
     * GET /api/v1/assets/document-types
     */
    @GetMapping("/document-types")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'MAINTENANCE_SUPERVISOR')")
    @Operation(
            summary = "Get document types",
            description = "Get all available document types"
    )
    public ResponseEntity<Map<String, Object>> getDocumentTypes() {
        List<Map<String, String>> types = java.util.Arrays.stream(AssetDocumentType.values())
                .map(type -> Map.of(
                        "value", type.name(),
                        "label", type.getDisplayName()
                ))
                .toList();

        Map<String, Object> responseBody = buildSuccessResponse(types, "Document types retrieved successfully");
        return ResponseEntity.ok(responseBody);
    }

    // =================================================================
    // HELPER METHODS
    // =================================================================

    private UUID getUserIdFromUserDetails(UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return user.getId();
    }

    private Map<String, Object> buildSuccessResponse(Object data, String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", message);
        if (data != null) {
            response.put("data", data);
        }
        return response;
    }

    private Map<String, Object> buildPageResponse(Page<?> page, String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", message);
        response.put("data", page.getContent());
        response.put("currentPage", page.getNumber());
        response.put("totalItems", page.getTotalElements());
        response.put("totalPages", page.getTotalPages());
        response.put("hasNext", page.hasNext());
        response.put("hasPrevious", page.hasPrevious());
        return response;
    }
}
