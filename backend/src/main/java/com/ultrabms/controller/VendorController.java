package com.ultrabms.controller;

import com.ultrabms.dto.vendors.UpdateVendorStatusDto;
import com.ultrabms.dto.vendors.VendorFilterDto;
import com.ultrabms.dto.vendors.VendorListDto;
import com.ultrabms.dto.vendors.VendorRequestDto;
import com.ultrabms.dto.vendors.VendorResponseDto;
import com.ultrabms.dto.vendors.VendorStatusResponseDto;
import com.ultrabms.dto.workorders.WorkOrderListDto;
import com.ultrabms.entity.User;
import com.ultrabms.entity.enums.VendorStatus;
import com.ultrabms.entity.enums.WorkOrderCategory;
import com.ultrabms.repository.UserRepository;
import com.ultrabms.service.VendorRatingService;
import com.ultrabms.service.VendorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST Controller for Vendor Management
 * Handles vendor CRUD, status management, and work order history
 *
 * Story 5.1: Vendor Registration and Profile Management
 */
@RestController
@RequestMapping("/api/v1/vendors")
@Tag(name = "Vendors", description = "Vendor management APIs")
@SecurityRequirement(name = "Bearer Authentication")
public class VendorController {

    private static final Logger LOGGER = LoggerFactory.getLogger(VendorController.class);

    private final VendorService vendorService;
    private final VendorRatingService vendorRatingService;
    private final UserRepository userRepository;

    public VendorController(
            VendorService vendorService,
            VendorRatingService vendorRatingService,
            UserRepository userRepository) {
        this.vendorService = vendorService;
        this.vendorRatingService = vendorRatingService;
        this.userRepository = userRepository;
    }

    // =================================================================
    // CREATE VENDOR
    // =================================================================

    /**
     * Create a new vendor
     * POST /api/v1/vendors
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Create vendor",
            description = "Register a new vendor with company, contact, service, and payment information"
    )
    public ResponseEntity<Map<String, Object>> createVendor(
            @Valid @RequestBody VendorRequestDto dto,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        LOGGER.info("Creating vendor: {} by user: {}", dto.getCompanyName(), userDetails.getUsername());

        VendorResponseDto response = vendorService.createVendor(dto);

        Map<String, Object> responseBody = buildSuccessResponse(response, "Vendor registered successfully");
        return ResponseEntity.status(HttpStatus.CREATED).body(responseBody);
    }

    // =================================================================
    // GET ALL VENDORS (LIST)
    // =================================================================

    /**
     * Get paginated list of vendors with filters
     * GET /api/v1/vendors?search=...&status=ACTIVE&serviceCategories=PLUMBING,ELECTRICAL&minRating=3&page=0&size=20
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'MAINTENANCE_SUPERVISOR')")
    @Operation(
            summary = "List vendors",
            description = "Get paginated list of vendors with optional filters"
    )
    public ResponseEntity<Map<String, Object>> getAllVendors(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) VendorStatus status,
            @RequestParam(required = false) List<WorkOrderCategory> serviceCategories,
            @RequestParam(required = false) BigDecimal minRating,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "companyName") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDirection
    ) {
        LOGGER.debug("Getting vendors - search: {}, status: {}, page: {}, size: {}", search, status, page, size);

        // Build filter DTO
        VendorFilterDto filterDto = VendorFilterDto.builder()
                .search(search)
                .status(status)
                .serviceCategories(serviceCategories)
                .minRating(minRating)
                .build();

        // Build pageable
        Sort sort = sortDirection.equalsIgnoreCase("DESC")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<VendorListDto> vendorPage = vendorService.getAllVendors(filterDto, pageable);

        Map<String, Object> responseBody = buildPaginatedResponse(vendorPage, "Vendors retrieved successfully");
        return ResponseEntity.ok(responseBody);
    }

    // =================================================================
    // GET VENDOR BY ID
    // =================================================================

    /**
     * Get vendor details by ID
     * GET /api/v1/vendors/{id}
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'MAINTENANCE_SUPERVISOR')")
    @Operation(
            summary = "Get vendor details",
            description = "Get complete vendor information including performance metrics"
    )
    public ResponseEntity<Map<String, Object>> getVendorById(@PathVariable UUID id) {
        LOGGER.debug("Getting vendor by ID: {}", id);

        VendorResponseDto response = vendorService.getVendorById(id);

        Map<String, Object> responseBody = buildSuccessResponse(response, "Vendor retrieved successfully");
        return ResponseEntity.ok(responseBody);
    }

    // =================================================================
    // UPDATE VENDOR
    // =================================================================

    /**
     * Update vendor details
     * PUT /api/v1/vendors/{id}
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Update vendor",
            description = "Update vendor company, contact, service, and payment information"
    )
    public ResponseEntity<Map<String, Object>> updateVendor(
            @PathVariable UUID id,
            @Valid @RequestBody VendorRequestDto dto,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        LOGGER.info("Updating vendor: {} by user: {}", id, userDetails.getUsername());

        VendorResponseDto response = vendorService.updateVendor(id, dto);

        Map<String, Object> responseBody = buildSuccessResponse(response, "Vendor updated successfully");
        return ResponseEntity.ok(responseBody);
    }

    // =================================================================
    // UPDATE VENDOR STATUS
    // =================================================================

    /**
     * Update vendor status (activate, deactivate, suspend)
     * PATCH /api/v1/vendors/{id}/status
     */
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Update vendor status",
            description = "Change vendor status: ACTIVE, INACTIVE, or SUSPENDED"
    )
    public ResponseEntity<Map<String, Object>> updateVendorStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateVendorStatusDto dto,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = getUserId(userDetails);
        LOGGER.info("Updating vendor status: {} to {} by user: {}", id, dto.getStatus(), userId);

        VendorStatusResponseDto response = vendorService.updateVendorStatus(id, dto, userId);

        Map<String, Object> responseBody = buildSuccessResponse(response, "Vendor status updated successfully");
        return ResponseEntity.ok(responseBody);
    }

    // =================================================================
    // DELETE VENDOR (SOFT DELETE)
    // =================================================================

    /**
     * Soft delete vendor
     * DELETE /api/v1/vendors/{id}
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Delete vendor",
            description = "Soft delete a vendor (sets isDeleted flag)"
    )
    public ResponseEntity<Map<String, Object>> deleteVendor(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = getUserId(userDetails);
        LOGGER.info("Deleting vendor: {} by user: {}", id, userId);

        vendorService.deleteVendor(id, userId);

        Map<String, Object> responseBody = buildSuccessResponse(null, "Vendor deleted successfully");
        return ResponseEntity.ok(responseBody);
    }

    // =================================================================
    // GET VENDOR WORK ORDERS
    // =================================================================

    /**
     * Get work order history for a vendor
     * GET /api/v1/vendors/{id}/work-orders
     */
    @GetMapping("/{id}/work-orders")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'MAINTENANCE_SUPERVISOR')")
    @Operation(
            summary = "Get vendor work orders",
            description = "Get paginated work order history for a vendor"
    )
    public ResponseEntity<Map<String, Object>> getVendorWorkOrders(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        LOGGER.debug("Getting work orders for vendor: {}", id);

        Pageable pageable = PageRequest.of(page, size, Sort.by("completedAt").descending());
        Page<WorkOrderListDto> workOrderPage = vendorService.getVendorWorkOrders(id, pageable);

        Map<String, Object> responseBody = buildPaginatedResponse(workOrderPage, "Work orders retrieved successfully");
        return ResponseEntity.ok(responseBody);
    }

    // =================================================================
    // CHECK EMAIL AVAILABILITY
    // =================================================================

    /**
     * Check if email is available for vendor registration
     * GET /api/v1/vendors/check-email?email=...&excludeId=...
     */
    @GetMapping("/check-email")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Check email availability",
            description = "Check if an email address is available for vendor registration"
    )
    public ResponseEntity<Map<String, Object>> checkEmailAvailability(
            @RequestParam String email,
            @RequestParam(required = false) UUID excludeId
    ) {
        boolean available = vendorService.isEmailAvailable(email, excludeId);

        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("success", true);
        responseBody.put("available", available);
        responseBody.put("timestamp", LocalDateTime.now().toString());

        return ResponseEntity.ok(responseBody);
    }

    // =================================================================
    // VENDOR PERFORMANCE AND RATINGS (Story 5.3)
    // =================================================================

    /**
     * Get vendor performance metrics
     *
     * GET /api/v1/vendors/{id}/performance
     */
    @Operation(summary = "Get vendor performance metrics")
    @GetMapping("/{id}/performance")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'MAINTENANCE_SUPERVISOR')")
    public ResponseEntity<Map<String, Object>> getVendorPerformance(@PathVariable UUID id) {
        LOGGER.info("Getting performance metrics for vendor: {}", id);
        var performance = vendorRatingService.getVendorPerformance(id);
        return ResponseEntity.ok(buildSuccessResponse(performance, "Vendor performance retrieved successfully"));
    }

    /**
     * Get paginated ratings for a vendor
     *
     * GET /api/v1/vendors/{id}/ratings
     */
    @Operation(summary = "Get vendor ratings")
    @GetMapping("/{id}/ratings")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'MAINTENANCE_SUPERVISOR')")
    public ResponseEntity<Map<String, Object>> getVendorRatings(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        LOGGER.info("Getting ratings for vendor: {}, page: {}, size: {}", id, page, size);
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "ratedAt"));
        var ratings = vendorRatingService.getVendorRatings(id, pageable);
        return ResponseEntity.ok(buildPaginatedResponse(ratings, "Vendor ratings retrieved successfully"));
    }

    /**
     * Get top-rated vendors
     *
     * GET /api/v1/vendors/top-rated
     */
    @Operation(summary = "Get top-rated vendors")
    @GetMapping("/top-rated")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'MAINTENANCE_SUPERVISOR')")
    public ResponseEntity<Map<String, Object>> getTopRatedVendors(
            @RequestParam(required = false) WorkOrderCategory category,
            @RequestParam(defaultValue = "10") int limit) {

        LOGGER.info("Getting top {} rated vendors for category: {}", limit, category);
        var topVendors = vendorRatingService.getTopRatedVendors(category, limit);
        return ResponseEntity.ok(buildSuccessResponse(topVendors, "Top-rated vendors retrieved successfully"));
    }

    /**
     * Compare multiple vendors
     *
     * GET /api/v1/vendors/compare?ids=uuid1,uuid2,uuid3
     */
    @Operation(summary = "Compare vendors")
    @GetMapping("/compare")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'MAINTENANCE_SUPERVISOR')")
    public ResponseEntity<Map<String, Object>> compareVendors(@RequestParam List<UUID> ids) {
        LOGGER.info("Comparing vendors: {}", ids);
        var comparison = vendorRatingService.getVendorsComparison(ids);
        return ResponseEntity.ok(buildSuccessResponse(comparison, "Vendor comparison retrieved successfully"));
    }

    // =================================================================
    // HELPER METHODS
    // =================================================================

    /**
     * Get user ID from authentication principal
     */
    private UUID getUserId(UserDetails userDetails) {
        String email = userDetails.getUsername();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
        return user.getId();
    }

    /**
     * Build success response map
     */
    private Map<String, Object> buildSuccessResponse(Object data, String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", message);
        if (data != null) {
            response.put("data", data);
        }
        response.put("timestamp", LocalDateTime.now().toString());
        return response;
    }

    /**
     * Build paginated response map
     */
    private <T> Map<String, Object> buildPaginatedResponse(Page<T> page, String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", message);

        Map<String, Object> data = new HashMap<>();
        data.put("content", page.getContent());
        data.put("totalElements", page.getTotalElements());
        data.put("totalPages", page.getTotalPages());
        data.put("page", page.getNumber());
        data.put("size", page.getSize());

        response.put("data", data);
        response.put("timestamp", LocalDateTime.now().toString());
        return response;
    }
}
