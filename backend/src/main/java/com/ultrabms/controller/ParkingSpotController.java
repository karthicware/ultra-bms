package com.ultrabms.controller;

import com.ultrabms.dto.ApiResponse;
import com.ultrabms.dto.parking.BulkDeleteRequest;
import com.ultrabms.dto.parking.BulkOperationResponse;
import com.ultrabms.dto.parking.BulkStatusChangeRequest;
import com.ultrabms.dto.parking.ChangeStatusRequest;
import com.ultrabms.dto.parking.CreateParkingSpotRequest;
import com.ultrabms.dto.parking.ParkingSpotCountsResponse;
import com.ultrabms.dto.parking.ParkingSpotResponse;
import com.ultrabms.dto.parking.UpdateParkingSpotRequest;
import com.ultrabms.entity.enums.ParkingSpotStatus;
import com.ultrabms.service.ParkingSpotService;
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

import java.util.List;
import java.util.UUID;

/**
 * REST Controller for Parking Spot management
 * Story 3.8: Parking Spot Inventory Management
 *
 * RBAC:
 * - SUPER_ADMIN, ADMIN, PROPERTY_MANAGER: Full CRUD access
 * - FINANCE_MANAGER, MAINTENANCE_SUPERVISOR: Read-only access
 * - TENANT, VENDOR: No access (403)
 */
@Tag(name = "Parking Spots", description = "Parking spot inventory management APIs")
@RestController
@RequestMapping("/api/v1/parking-spots")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
public class ParkingSpotController {

    private final ParkingSpotService parkingSpotService;

    // =========================================================================
    // CRUD Endpoints
    // =========================================================================

    @PostMapping
    @Operation(summary = "Create a new parking spot")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    public ResponseEntity<ApiResponse<ParkingSpotResponse>> createParkingSpot(
            @Valid @RequestBody CreateParkingSpotRequest request
    ) {
        ParkingSpotResponse response = parkingSpotService.createParkingSpot(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Parking spot created successfully"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get parking spot by ID")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'FINANCE_MANAGER', 'MAINTENANCE_SUPERVISOR')")
    public ResponseEntity<ApiResponse<ParkingSpotResponse>> getParkingSpotById(
            @PathVariable UUID id
    ) {
        ParkingSpotResponse response = parkingSpotService.getParkingSpotById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update parking spot")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    public ResponseEntity<ApiResponse<ParkingSpotResponse>> updateParkingSpot(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateParkingSpotRequest request
    ) {
        ParkingSpotResponse response = parkingSpotService.updateParkingSpot(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Parking spot updated successfully"));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete parking spot (soft delete)")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    public ResponseEntity<ApiResponse<Void>> deleteParkingSpot(
            @PathVariable UUID id
    ) {
        parkingSpotService.deleteParkingSpot(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Parking spot deleted successfully"));
    }

    @GetMapping
    @Operation(summary = "Search parking spots with filters")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'FINANCE_MANAGER', 'MAINTENANCE_SUPERVISOR')")
    public ResponseEntity<ApiResponse<Page<ParkingSpotResponse>>> searchParkingSpots(
            @RequestParam(required = false) UUID propertyId,
            @RequestParam(required = false) ParkingSpotStatus status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "spotNumber,asc") String sort
    ) {
        Pageable pageable = createPageable(page, size, sort);
        Page<ParkingSpotResponse> response = parkingSpotService.searchParkingSpots(
                propertyId, status, search, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // =========================================================================
    // Status Management Endpoints
    // =========================================================================

    @PatchMapping("/{id}/status")
    @Operation(summary = "Change parking spot status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    public ResponseEntity<ApiResponse<ParkingSpotResponse>> changeStatus(
            @PathVariable UUID id,
            @Valid @RequestBody ChangeStatusRequest request
    ) {
        ParkingSpotResponse response = parkingSpotService.changeStatus(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Status changed successfully"));
    }

    // =========================================================================
    // Bulk Operation Endpoints
    // =========================================================================

    @PostMapping("/bulk-delete")
    @Operation(summary = "Bulk delete parking spots")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    public ResponseEntity<ApiResponse<BulkOperationResponse>> bulkDelete(
            @Valid @RequestBody BulkDeleteRequest request
    ) {
        BulkOperationResponse response = parkingSpotService.bulkDelete(request);
        return ResponseEntity.ok(ApiResponse.success(response, response.getMessage()));
    }

    @PostMapping("/bulk-status")
    @Operation(summary = "Bulk change parking spot status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    public ResponseEntity<ApiResponse<BulkOperationResponse>> bulkChangeStatus(
            @Valid @RequestBody BulkStatusChangeRequest request
    ) {
        BulkOperationResponse response = parkingSpotService.bulkChangeStatus(request);
        return ResponseEntity.ok(ApiResponse.success(response, response.getMessage()));
    }

    // =========================================================================
    // Available Spots Endpoint (for tenant allocation dropdowns)
    // =========================================================================

    @GetMapping("/available")
    @Operation(summary = "Get available parking spots for a property")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    public ResponseEntity<ApiResponse<List<ParkingSpotResponse>>> getAvailableParkingSpots(
            @RequestParam UUID propertyId
    ) {
        List<ParkingSpotResponse> response = parkingSpotService.getAvailableParkingSpots(propertyId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // =========================================================================
    // Statistics Endpoint
    // =========================================================================

    @GetMapping("/counts")
    @Operation(summary = "Get parking spot counts by status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'FINANCE_MANAGER', 'MAINTENANCE_SUPERVISOR')")
    public ResponseEntity<ApiResponse<ParkingSpotCountsResponse>> getParkingSpotCounts(
            @RequestParam(required = false) UUID propertyId
    ) {
        ParkingSpotCountsResponse response = parkingSpotService.getParkingSpotCounts(propertyId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // =========================================================================
    // Property-specific Endpoints (alternative route)
    // =========================================================================

    @GetMapping("/properties/{propertyId}/parking-spots")
    @Operation(summary = "Get parking spots for a specific property")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'FINANCE_MANAGER', 'MAINTENANCE_SUPERVISOR')")
    public ResponseEntity<ApiResponse<Page<ParkingSpotResponse>>> getParkingSpotsByProperty(
            @PathVariable UUID propertyId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("spotNumber").ascending());
        Page<ParkingSpotResponse> response = parkingSpotService.getParkingSpotsByProperty(propertyId, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // =========================================================================
    // Internal Allocation Endpoints (for tenant onboarding/checkout integration)
    // =========================================================================

    @PostMapping("/{id}/assign")
    @Operation(summary = "Assign parking spot to tenant (internal use)")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    public ResponseEntity<ApiResponse<ParkingSpotResponse>> assignToTenant(
            @PathVariable UUID id,
            @RequestParam UUID tenantId
    ) {
        ParkingSpotResponse response = parkingSpotService.assignToTenant(id, tenantId);
        return ResponseEntity.ok(ApiResponse.success(response, "Parking spot assigned successfully"));
    }

    @PostMapping("/{id}/release")
    @Operation(summary = "Release parking spot (internal use)")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    public ResponseEntity<ApiResponse<ParkingSpotResponse>> releaseParkingSpot(
            @PathVariable UUID id
    ) {
        ParkingSpotResponse response = parkingSpotService.releaseParkingSpot(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Parking spot released successfully"));
    }

    // =========================================================================
    // Helper Methods
    // =========================================================================

    private Pageable createPageable(int page, int size, String sort) {
        String[] sortParams = sort.split(",");
        String sortField = sortParams[0];
        Sort.Direction direction = sortParams.length > 1 && sortParams[1].equalsIgnoreCase("desc") ?
                Sort.Direction.DESC : Sort.Direction.ASC;
        return PageRequest.of(page, size, Sort.by(direction, sortField));
    }
}
