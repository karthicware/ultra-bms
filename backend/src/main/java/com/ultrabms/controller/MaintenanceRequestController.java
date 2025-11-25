package com.ultrabms.controller;

import com.ultrabms.dto.maintenance.CreateMaintenanceRequestDto;
import com.ultrabms.dto.maintenance.MaintenanceRequestListItemResponse;
import com.ultrabms.dto.maintenance.MaintenanceRequestResponse;
import com.ultrabms.dto.maintenance.SubmitFeedbackDto;
import com.ultrabms.entity.Tenant;
import com.ultrabms.entity.enums.MaintenanceCategory;
import com.ultrabms.entity.enums.MaintenanceStatus;
import com.ultrabms.exception.EntityNotFoundException;
import com.ultrabms.repository.TenantRepository;
import com.ultrabms.repository.UserRepository;
import com.ultrabms.service.MaintenanceRequestService;
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
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * REST Controller for Maintenance Request Management
 * Handles tenant maintenance request submission, retrieval, feedback, and cancellation
 *
 * Story 3.5: Tenant Portal - Maintenance Request Submission
 */
@RestController
@RequestMapping("/api/v1/maintenance-requests")
@Tag(name = "Maintenance Requests", description = "Tenant maintenance request APIs")
@SecurityRequirement(name = "Bearer Authentication")
public class MaintenanceRequestController {

    private static final Logger LOGGER = LoggerFactory.getLogger(MaintenanceRequestController.class);

    private final MaintenanceRequestService maintenanceRequestService;
    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;

    public MaintenanceRequestController(
            MaintenanceRequestService maintenanceRequestService,
            TenantRepository tenantRepository,
            UserRepository userRepository
    ) {
        this.maintenanceRequestService = maintenanceRequestService;
        this.tenantRepository = tenantRepository;
        this.userRepository = userRepository;
    }

    /**
     * Create a new maintenance request with optional photo attachments
     * POST /api/v1/maintenance-requests
     *
     * Multipart FormData:
     * - request: JSON (CreateMaintenanceRequestDto) - category, priority, title, description, preferredAccessTime, preferredAccessDate
     * - files: MultipartFile[] (optional, max 5, JPG/PNG, max 5MB each)
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('TENANT')")
    @Operation(
            summary = "Create maintenance request",
            description = "Submit a new maintenance request with optional photo attachments (max 5, JPG/PNG, max 5MB each)"
    )
    public ResponseEntity<Map<String, Object>> createRequest(
            @Valid @RequestPart("request") CreateMaintenanceRequestDto dto,
            @RequestPart(value = "files", required = false) List<MultipartFile> files,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = getUserId(userDetails);
        UUID tenantId = getTenantIdByUserId(userId);

        LOGGER.info("Creating maintenance request for tenant: {}", tenantId);

        MaintenanceRequestResponse response = maintenanceRequestService.createRequest(dto, tenantId, files);

        Map<String, Object> responseBody = buildSuccessResponse(response, "Request submitted successfully");
        return ResponseEntity.status(HttpStatus.CREATED).body(responseBody);
    }

    /**
     * Get paginated list of tenant's maintenance requests with filters
     * GET /api/v1/maintenance-requests?status=SUBMITTED,ASSIGNED&category=PLUMBING&search=faucet&page=0&size=10&sort=submittedAt&direction=DESC
     */
    @GetMapping
    @PreAuthorize("hasRole('TENANT')")
    @Operation(
            summary = "List maintenance requests",
            description = "Get paginated list of tenant's requests with optional filters (status, category, search)"
    )
    public ResponseEntity<Map<String, Object>> listRequests(
            @RequestParam(required = false) List<String> status,
            @RequestParam(required = false) List<String> category,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "submittedAt") String sort,
            @RequestParam(defaultValue = "DESC") String direction,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = getUserId(userDetails);
        UUID tenantId = getTenantIdByUserId(userId);

        LOGGER.info("Fetching maintenance requests for tenant: {}", tenantId);

        // Parse status filter
        List<MaintenanceStatus> statuses = null;
        if (status != null && !status.isEmpty()) {
            statuses = status.stream()
                    .map(MaintenanceStatus::valueOf)
                    .collect(Collectors.toList());
        }

        // Parse category filter
        List<MaintenanceCategory> categories = null;
        if (category != null && !category.isEmpty()) {
            categories = category.stream()
                    .map(MaintenanceCategory::valueOf)
                    .collect(Collectors.toList());
        }

        // Create pageable
        Sort.Direction sortDirection = "ASC".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sort));

        // Fetch requests
        Page<MaintenanceRequestListItemResponse> requests = maintenanceRequestService.getRequestsByTenant(
                tenantId,
                statuses,
                categories,
                search,
                pageable
        );

        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("success", true);
        responseBody.put("data", Map.of(
                "content", requests.getContent(),
                "totalElements", requests.getTotalElements(),
                "totalPages", requests.getTotalPages(),
                "page", requests.getNumber(),
                "size", requests.getSize()
        ));
        responseBody.put("timestamp", java.time.LocalDateTime.now());

        return ResponseEntity.ok(responseBody);
    }

    /**
     * Get detailed maintenance request by ID
     * GET /api/v1/maintenance-requests/{id}
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('TENANT')")
    @Operation(
            summary = "Get request details",
            description = "Retrieve full maintenance request details including photos, timeline, and vendor information"
    )
    public ResponseEntity<Map<String, Object>> getRequestById(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = getUserId(userDetails);
        UUID tenantId = getTenantIdByUserId(userId);

        LOGGER.info("Fetching request: {} for tenant: {}", id, tenantId);

        MaintenanceRequestResponse response = maintenanceRequestService.getRequestById(id, tenantId);

        Map<String, Object> responseBody = buildSuccessResponse(response, null);
        return ResponseEntity.ok(responseBody);
    }

    /**
     * Submit tenant feedback (rating and comment) on completed request
     * POST /api/v1/maintenance-requests/{id}/feedback
     */
    @PostMapping("/{id}/feedback")
    @PreAuthorize("hasRole('TENANT')")
    @Operation(
            summary = "Submit feedback",
            description = "Submit rating (1-5 stars) and optional comment after request completion"
    )
    public ResponseEntity<Map<String, Object>> submitFeedback(
            @PathVariable UUID id,
            @Valid @RequestBody SubmitFeedbackDto dto,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = getUserId(userDetails);
        UUID tenantId = getTenantIdByUserId(userId);

        LOGGER.info("Submitting feedback for request: {} by tenant: {}", id, tenantId);

        MaintenanceRequestResponse response = maintenanceRequestService.submitFeedback(id, tenantId, dto);

        Map<String, Object> responseBody = buildSuccessResponse(response, "Feedback submitted successfully");
        return ResponseEntity.ok(responseBody);
    }

    /**
     * Cancel maintenance request (only if status = SUBMITTED)
     * DELETE /api/v1/maintenance-requests/{id}
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('TENANT')")
    @Operation(
            summary = "Cancel request",
            description = "Cancel maintenance request (only allowed when status = SUBMITTED, before vendor assignment)"
    )
    public ResponseEntity<Map<String, Object>> cancelRequest(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = getUserId(userDetails);
        UUID tenantId = getTenantIdByUserId(userId);

        LOGGER.info("Cancelling request: {} by tenant: {}", id, tenantId);

        maintenanceRequestService.cancelRequest(id, tenantId);

        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("success", true);
        responseBody.put("message", "Request cancelled successfully");
        responseBody.put("timestamp", java.time.LocalDateTime.now());

        return ResponseEntity.ok(responseBody);
    }

    // =========================================================================
    // HELPER METHODS
    // =========================================================================

    /**
     * Extract user ID from UserDetails (JWT token)
     */
    private UUID getUserId(UserDetails userDetails) {
        return UUID.fromString(userDetails.getUsername());
    }

    /**
     * Get tenant ID from user ID
     */
    private UUID getTenantIdByUserId(UUID userId) {
        // Verify user exists
        userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + userId));

        Tenant tenant = tenantRepository.findByUserId(userId)
                .orElseThrow(() -> new EntityNotFoundException("Tenant not found for user: " + userId));

        return tenant.getId();
    }

    /**
     * Build success response with data and optional message
     */
    private Map<String, Object> buildSuccessResponse(Object data, String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", data);
        if (message != null) {
            response.put("message", message);
        }
        response.put("timestamp", java.time.LocalDateTime.now());
        return response;
    }
}
