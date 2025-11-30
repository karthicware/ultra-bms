package com.ultrabms.controller;

import com.ultrabms.dto.ApiResponse;
import com.ultrabms.dto.documents.DocumentListDto;
import com.ultrabms.dto.properties.CreatePropertyRequest;
import com.ultrabms.dto.properties.OccupancyResponse;
import com.ultrabms.dto.properties.PropertyImageResponse;
import com.ultrabms.dto.properties.PropertyResponse;
import com.ultrabms.dto.properties.UpdatePropertyRequest;
import com.ultrabms.dto.units.CreateUnitRequest;
import com.ultrabms.dto.units.UnitResponse;
import com.ultrabms.entity.enums.DocumentEntityType;
import com.ultrabms.entity.enums.PropertyStatus;
import com.ultrabms.entity.enums.PropertyType;
import com.ultrabms.service.DocumentService;
import com.ultrabms.service.PropertyService;
import com.ultrabms.service.UnitService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import com.ultrabms.security.UserPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

/**
 * REST Controller for Property management
 */
@Tag(name = "Properties", description = "Property management APIs")
@RestController
@RequestMapping("/api/v1/properties")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
public class PropertyController {

    private final PropertyService propertyService;
    private final UnitService unitService;
    private final DocumentService documentService;

    @PostMapping
    @Operation(summary = "Create a new property")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    public ResponseEntity<ApiResponse<PropertyResponse>> createProperty(
            @Valid @RequestBody CreatePropertyRequest request,
            @AuthenticationPrincipal Object principal
    ) {
        UUID createdBy = getUserId(principal);
        PropertyResponse response = propertyService.createProperty(request, createdBy);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Property created successfully"));
    }

    @PostMapping("/{propertyId}/units")
    @Operation(summary = "Create a new unit for a property")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    public ResponseEntity<ApiResponse<UnitResponse>> createUnitForProperty(
            @PathVariable UUID propertyId,
            @Valid @RequestBody CreateUnitRequest request,
            @AuthenticationPrincipal Object principal
    ) {
        UUID createdBy = getUserId(principal);
        // Set propertyId from path variable to ensure consistency
        request.setPropertyId(propertyId);
        UnitResponse response = unitService.createUnit(request, createdBy);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Unit created successfully"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get property by ID")
    public ResponseEntity<ApiResponse<PropertyResponse>> getPropertyById(@PathVariable UUID id) {
        PropertyResponse response = propertyService.getPropertyById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}/with-occupancy")
    @Operation(summary = "Get property by ID with occupancy data")
    public ResponseEntity<ApiResponse<PropertyResponse>> getPropertyByIdWithOccupancy(@PathVariable UUID id) {
        PropertyResponse response = propertyService.getPropertyByIdWithOccupancy(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update property")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    public ResponseEntity<ApiResponse<PropertyResponse>> updateProperty(
            @PathVariable UUID id,
            @Valid @RequestBody UpdatePropertyRequest request
    ) {
        PropertyResponse response = propertyService.updateProperty(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Property updated successfully"));
    }

    @GetMapping
    @Operation(summary = "Search properties with filters")
    public ResponseEntity<ApiResponse<Page<PropertyResponse>>> searchProperties(
            @RequestParam(required = false) List<PropertyType> types,
            @RequestParam(required = false) PropertyStatus status,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UUID managerId,
            @RequestParam(required = false) Double occupancyMin,
            @RequestParam(required = false) Double occupancyMax,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "name") String sort,
            @RequestParam(defaultValue = "ASC") String direction
    ) {
        Sort.Direction sortDirection = direction.equalsIgnoreCase("ASC") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sort));

        Page<PropertyResponse> response = propertyService.searchProperties(
                types, status, search, managerId, occupancyMin, occupancyMax, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/all")
    @Operation(summary = "Get all active properties")
    public ResponseEntity<ApiResponse<Page<PropertyResponse>>> getAllProperties(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDir
    ) {
        Sort.Direction direction = sortDir.equalsIgnoreCase("ASC") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        Page<PropertyResponse> response = propertyService.getAllProperties(pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/all/with-occupancy")
    @Operation(summary = "Get all active properties with occupancy data")
    public ResponseEntity<ApiResponse<Page<PropertyResponse>>> getAllPropertiesWithOccupancy(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDir
    ) {
        Sort.Direction direction = sortDir.equalsIgnoreCase("ASC") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        Page<PropertyResponse> response = propertyService.getAllPropertiesWithOccupancy(pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/{id}/assign-manager")
    @Operation(summary = "Assign property manager")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<ApiResponse<PropertyResponse>> assignManager(
            @PathVariable UUID id,
            @RequestParam UUID managerId
    ) {
        PropertyResponse response = propertyService.assignManager(id, managerId);
        return ResponseEntity.ok(ApiResponse.success(response, "Manager assigned successfully"));
    }

    @PostMapping("/{id}/images")
    @Operation(summary = "Upload image for property")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    public ResponseEntity<ApiResponse<PropertyImageResponse>> uploadImage(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) Integer displayOrder,
            @AuthenticationPrincipal Object principal
    ) {
        UUID uploadedBy = getUserId(principal);
        PropertyImageResponse response = propertyService.uploadImage(id, file, displayOrder, uploadedBy);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Image uploaded successfully"));
    }

    @GetMapping("/{id}/images")
    @Operation(summary = "Get all images for a property")
    public ResponseEntity<ApiResponse<List<PropertyImageResponse>>> getPropertyImages(@PathVariable UUID id) {
        List<PropertyImageResponse> response = propertyService.getPropertyImages(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/images/{imageId}")
    @Operation(summary = "Delete property image")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    public ResponseEntity<ApiResponse<Void>> deleteImage(@PathVariable UUID imageId) {
        propertyService.deleteImage(imageId);
        return ResponseEntity.ok(ApiResponse.success(null, "Image deleted successfully"));
    }

    @PutMapping("/{id}/images/reorder")
    @Operation(summary = "Reorder property images")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    public ResponseEntity<ApiResponse<Void>> reorderImages(
            @PathVariable UUID id,
            @RequestBody List<UUID> imageIds
    ) {
        propertyService.reorderImages(id, imageIds);
        return ResponseEntity.ok(ApiResponse.success(null, "Images reordered successfully"));
    }

    @GetMapping("/{id}/occupancy")
    @Operation(summary = "Get property occupancy metrics")
    public ResponseEntity<ApiResponse<OccupancyResponse>> getPropertyOccupancy(@PathVariable UUID id) {
        OccupancyResponse response = propertyService.getPropertyOccupancy(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Soft delete property")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteProperty(@PathVariable UUID id) {
        propertyService.deleteProperty(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Property deleted successfully"));
    }

    @PatchMapping("/{id}/restore")
    @Operation(summary = "Restore soft deleted property")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<ApiResponse<PropertyResponse>> restoreProperty(@PathVariable UUID id) {
        PropertyResponse response = propertyService.restoreProperty(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Property restored successfully"));
    }

    // =================================================================
    // DOCUMENT ENDPOINTS (Story 7.2)
    // =================================================================

    /**
     * Get documents for a property
     * GET /api/v1/properties/{propertyId}/documents
     */
    @GetMapping("/{propertyId}/documents")
    @Operation(summary = "Get property documents", description = "Get all documents associated with a property")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'MAINTENANCE_SUPERVISOR')")
    public ResponseEntity<ApiResponse<Page<DocumentListDto>>> getPropertyDocuments(
            @PathVariable UUID propertyId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "uploadedAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection
    ) {
        Sort.Direction direction = sortDirection.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
        Page<DocumentListDto> documents = documentService.getDocumentsByEntity(
                DocumentEntityType.PROPERTY, propertyId, pageable);
        return ResponseEntity.ok(ApiResponse.success(documents, "Property documents retrieved successfully"));
    }

    /**
     * Helper method to extract user ID from authentication principal.
     * Supports both UUID (from JWT filter) and UserDetails (from other auth methods).
     */
    private UUID getUserId(Object principal) {
        if (principal instanceof UUID) {
            return (UUID) principal;
        } else if (principal instanceof UserPrincipal) {
            return ((UserPrincipal) principal).getId();
        } else if (principal instanceof UserDetails) {
            return UUID.fromString(((UserDetails) principal).getUsername());
        } else if (principal instanceof String) {
            return UUID.fromString((String) principal);
        }
        throw new IllegalArgumentException("Unsupported principal type: " + principal.getClass().getName());
    }
}
