package com.ultrabms.controller;

import com.ultrabms.dto.ApiResponse;
import com.ultrabms.dto.units.BulkCreateUnitsRequest;
import com.ultrabms.dto.units.BulkUpdateStatusRequest;
import com.ultrabms.dto.units.CreateUnitRequest;
import com.ultrabms.dto.units.UnitHistoryResponse;
import com.ultrabms.dto.units.UnitResponse;
import com.ultrabms.dto.units.UpdateUnitRequest;
import com.ultrabms.dto.units.UpdateUnitStatusRequest;
import com.ultrabms.entity.enums.UnitStatus;
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

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST Controller for Unit management
 */
@Tag(name = "Units", description = "Unit management APIs")
@RestController
@RequestMapping("/api/v1/units")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
public class UnitController {

    private final UnitService unitService;

    @PostMapping
    @Operation(summary = "Create a new unit")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROPERTY_MANAGER')")
    public ResponseEntity<ApiResponse<UnitResponse>> createUnit(
            @Valid @RequestBody CreateUnitRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID createdBy = getUserId(userDetails);
        UnitResponse response = unitService.createUnit(request, createdBy);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Unit created successfully"));
    }

    @PostMapping("/bulk-create")
    @Operation(summary = "Bulk create units")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROPERTY_MANAGER')")
    public ResponseEntity<ApiResponse<BulkCreateResult>> bulkCreateUnits(
            @Valid @RequestBody BulkCreateUnitsRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID createdBy = getUserId(userDetails);
        BulkCreateResult response = unitService.bulkCreateUnits(request, createdBy);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Bulk unit creation completed"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get unit by ID")
    public ResponseEntity<ApiResponse<UnitResponse>> getUnitById(@PathVariable UUID id) {
        UnitResponse response = unitService.getUnitById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update unit")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROPERTY_MANAGER')")
    public ResponseEntity<ApiResponse<UnitResponse>> updateUnit(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateUnitRequest request
    ) {
        UnitResponse response = unitService.updateUnit(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Unit updated successfully"));
    }

    @GetMapping
    @Operation(summary = "Search units with filters")
    public ResponseEntity<ApiResponse<Page<UnitResponse>>> searchUnits(
            @RequestParam(required = false) UUID propertyId,
            @RequestParam(required = false) UnitStatus status,
            @RequestParam(required = false) Integer bedroomCount,
            @RequestParam(required = false) BigDecimal minRent,
            @RequestParam(required = false) BigDecimal maxRent,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "unitNumber") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDir
    ) {
        Sort.Direction direction = sortDir.equalsIgnoreCase("ASC") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        Page<UnitResponse> response = unitService.searchUnits(
                propertyId,
                status,
                bedroomCount,
                minRent,
                maxRent,
                search,
                pageable
        );
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/property/{propertyId}")
    @Operation(summary = "Get all units for a property")
    public ResponseEntity<ApiResponse<Page<UnitResponse>>> getUnitsByProperty(
            @PathVariable UUID propertyId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "unitNumber") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDir
    ) {
        Sort.Direction direction = sortDir.equalsIgnoreCase("ASC") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        Page<UnitResponse> response = unitService.getUnitsByProperty(propertyId, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/property/{propertyId}/available")
    @Operation(summary = "Get available units for a property")
    public ResponseEntity<ApiResponse<List<UnitResponse>>> getAvailableUnits(@PathVariable UUID propertyId) {
        List<UnitResponse> response = unitService.getAvailableUnits(propertyId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Update unit status")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROPERTY_MANAGER')")
    public ResponseEntity<ApiResponse<UnitResponse>> updateUnitStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateUnitStatusRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID updatedBy = getUserId(userDetails);
        UnitResponse response = unitService.updateUnitStatus(id, request, updatedBy);
        return ResponseEntity.ok(ApiResponse.success(response, "Unit status updated successfully"));
    }

    @PatchMapping("/bulk-status")
    @Operation(summary = "Bulk update unit status")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROPERTY_MANAGER')")
    public ResponseEntity<ApiResponse<BulkUpdateResult>> bulkUpdateUnitStatus(
            @Valid @RequestBody BulkUpdateStatusRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID updatedBy = getUserId(userDetails);
        BulkUpdateResult response = unitService.bulkUpdateUnitStatus(request, updatedBy);
        return ResponseEntity.ok(ApiResponse.success(response, "Bulk status update completed"));
    }

    @GetMapping("/{id}/history")
    @Operation(summary = "Get unit history")
    public ResponseEntity<ApiResponse<List<UnitHistoryResponse>>> getUnitHistory(@PathVariable UUID id) {
        List<UnitHistoryResponse> response = unitService.getUnitHistory(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/property/{propertyId}/status-distribution")
    @Operation(summary = "Get unit status distribution for a property")
    public ResponseEntity<ApiResponse<Map<UnitStatus, Long>>> getUnitStatusDistribution(@PathVariable UUID propertyId) {
        Map<UnitStatus, Long> response = unitService.getUnitStatusDistribution(propertyId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Soft delete unit")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROPERTY_MANAGER')")
    public ResponseEntity<ApiResponse<Void>> deleteUnit(@PathVariable UUID id) {
        unitService.deleteUnit(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Unit deleted successfully"));
    }

    @PatchMapping("/{id}/restore")
    @Operation(summary = "Restore soft deleted unit")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROPERTY_MANAGER')")
    public ResponseEntity<ApiResponse<UnitResponse>> restoreUnit(@PathVariable UUID id) {
        UnitResponse response = unitService.restoreUnit(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Unit restored successfully"));
    }

    /**
     * Helper method to extract user ID from UserDetails
     */
    private UUID getUserId(UserDetails userDetails) {
        return UUID.fromString(userDetails.getUsername());
    }
}
