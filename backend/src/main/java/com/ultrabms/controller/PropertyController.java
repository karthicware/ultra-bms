package com.ultrabms.controller;

import com.ultrabms.dto.ApiResponse;
import com.ultrabms.dto.properties.*;
import com.ultrabms.entity.enums.PropertyStatus;
import com.ultrabms.entity.enums.PropertyType;
import com.ultrabms.service.PropertyService;
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
import org.springframework.web.bind.annotation.*;
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

    @PostMapping
    @Operation(summary = "Create a new property")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROPERTY_MANAGER')")
    public ResponseEntity<ApiResponse<PropertyResponse>> createProperty(
            @Valid @RequestBody CreatePropertyRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID createdBy = getUserId(userDetails);
        PropertyResponse response = propertyService.createProperty(request, createdBy);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Property created successfully"));
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
    @PreAuthorize("hasAnyRole('ADMIN', 'PROPERTY_MANAGER')")
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
            @RequestParam(required = false) PropertyType type,
            @RequestParam(required = false) PropertyStatus status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir
    ) {
        Sort.Direction direction = sortDir.equalsIgnoreCase("ASC") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        Page<PropertyResponse> response = propertyService.searchProperties(type, status, search, pageable);
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
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PropertyResponse>> assignManager(
            @PathVariable UUID id,
            @RequestParam UUID managerId
    ) {
        PropertyResponse response = propertyService.assignManager(id, managerId);
        return ResponseEntity.ok(ApiResponse.success(response, "Manager assigned successfully"));
    }

    @PostMapping("/{id}/images")
    @Operation(summary = "Upload image for property")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROPERTY_MANAGER')")
    public ResponseEntity<ApiResponse<PropertyImageResponse>> uploadImage(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) Integer displayOrder,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID uploadedBy = getUserId(userDetails);
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
    @PreAuthorize("hasAnyRole('ADMIN', 'PROPERTY_MANAGER')")
    public ResponseEntity<ApiResponse<Void>> deleteImage(@PathVariable UUID imageId) {
        propertyService.deleteImage(imageId);
        return ResponseEntity.ok(ApiResponse.success(null, "Image deleted successfully"));
    }

    @PutMapping("/{id}/images/reorder")
    @Operation(summary = "Reorder property images")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROPERTY_MANAGER')")
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
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteProperty(@PathVariable UUID id) {
        propertyService.deleteProperty(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Property deleted successfully"));
    }

    @PatchMapping("/{id}/restore")
    @Operation(summary = "Restore soft deleted property")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PropertyResponse>> restoreProperty(@PathVariable UUID id) {
        PropertyResponse response = propertyService.restoreProperty(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Property restored successfully"));
    }

    /**
     * Helper method to extract user ID from UserDetails
     */
    private UUID getUserId(UserDetails userDetails) {
        return UUID.fromString(userDetails.getUsername());
    }
}
