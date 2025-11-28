package com.ultrabms.controller;

import com.ultrabms.dto.lease.RejectRenewalRequestDto;
import com.ultrabms.dto.lease.RenewalRequestDto;
import com.ultrabms.dto.lease.RenewalRequestResponse;
import com.ultrabms.entity.Tenant;
import com.ultrabms.entity.User;
import com.ultrabms.entity.enums.RenewalRequestStatus;
import com.ultrabms.repository.TenantRepository;
import com.ultrabms.repository.UserRepository;
import com.ultrabms.service.RenewalRequestService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * REST Controller for Renewal Request Management
 * Story 3.6: Tenant Lease Extension and Renewal
 *
 * Provides endpoints for tenants to submit renewal requests and
 * property managers to view/process them.
 */
@RestController
@Tag(name = "Renewal Requests", description = "Tenant lease renewal request management")
public class RenewalRequestController {

    private static final Logger LOGGER = LoggerFactory.getLogger(RenewalRequestController.class);

    private final RenewalRequestService renewalRequestService;
    private final UserRepository userRepository;
    private final TenantRepository tenantRepository;

    public RenewalRequestController(RenewalRequestService renewalRequestService, UserRepository userRepository, TenantRepository tenantRepository) {
        this.renewalRequestService = renewalRequestService;
        this.userRepository = userRepository;
        this.tenantRepository = tenantRepository;
    }

    // ========================================================================
    // Tenant-facing Endpoints (Tenant Portal)
    // ========================================================================

    /**
     * Submit a renewal request (tenant-facing)
     * POST /api/v1/tenant/lease/renewal-request
     *
     * @param request Renewal request data
     * @return Created renewal request
     */
    @PostMapping("/api/v1/tenant/lease/renewal-request")
    @PreAuthorize("hasRole('TENANT')")
    @Operation(summary = "Submit renewal request", description = "Tenant submits a request to renew their lease")
    public ResponseEntity<Map<String, Object>> submitRenewalRequest(
            @Valid @RequestBody RenewalRequestDto request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        LOGGER.info("Tenant submitting renewal request");

        UUID tenantId = getTenantIdFromPrincipal(userDetails);
        RenewalRequestResponse response = renewalRequestService.submitRenewalRequest(tenantId, request);

        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("success", true);
        responseBody.put("data", response);
        responseBody.put("message", "Renewal request submitted successfully");
        responseBody.put("timestamp", LocalDateTime.now());

        return ResponseEntity.status(HttpStatus.CREATED).body(responseBody);
    }

    /**
     * Get tenant's pending renewal request (tenant-facing)
     * GET /api/v1/tenant/lease/renewal-request
     *
     * @return Pending renewal request or 404 if none
     */
    @GetMapping("/api/v1/tenant/lease/renewal-request")
    @PreAuthorize("hasRole('TENANT')")
    @Operation(summary = "Get tenant renewal request", description = "Get tenant's pending renewal request if any")
    public ResponseEntity<Map<String, Object>> getTenantRenewalRequest(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID tenantId = getTenantIdFromPrincipal(userDetails);
        RenewalRequestResponse response = renewalRequestService.getTenantPendingRequest(tenantId);

        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("success", true);
        responseBody.put("data", response);
        responseBody.put("timestamp", LocalDateTime.now());

        return ResponseEntity.ok(responseBody);
    }

    // ========================================================================
    // Property Manager Endpoints
    // ========================================================================

    /**
     * Get all renewal requests with filters
     * GET /api/v1/tenants/renewal-requests
     *
     * @param status     Optional status filter
     * @param propertyId Optional property filter
     * @param dateFrom   Optional date range start
     * @param dateTo     Optional date range end
     * @return Paginated renewal requests
     */
    @GetMapping("/api/v1/tenants/renewal-requests")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'PROPERTY_MANAGER', 'ADMIN')")
    @Operation(summary = "List renewal requests", description = "Get paginated list of renewal requests with filters")
    public ResponseEntity<Map<String, Object>> getRenewalRequests(
            @RequestParam(required = false) @Parameter(description = "Filter by status") RenewalRequestStatus status,
            @RequestParam(required = false) @Parameter(description = "Filter by property ID") UUID propertyId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dateTo,
            Pageable pageable
    ) {
        LOGGER.debug("Getting renewal requests, status: {}, propertyId: {}", status, propertyId);

        Page<RenewalRequestResponse> requests = renewalRequestService.getRenewalRequests(
                status, propertyId, dateFrom, dateTo, pageable);

        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("success", true);
        responseBody.put("data", requests);
        responseBody.put("timestamp", LocalDateTime.now());

        return ResponseEntity.ok(responseBody);
    }

    /**
     * Get count of pending renewal requests
     * GET /api/v1/tenants/renewal-requests/count
     *
     * @return Count of pending requests
     */
    @GetMapping("/api/v1/tenants/renewal-requests/count")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'PROPERTY_MANAGER', 'ADMIN')")
    @Operation(summary = "Get pending count", description = "Get count of pending renewal requests")
    public ResponseEntity<Map<String, Object>> getPendingRequestsCount() {
        long count = renewalRequestService.getPendingRequestsCount();

        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("success", true);
        responseBody.put("data", Map.of("count", count));
        responseBody.put("timestamp", LocalDateTime.now());

        return ResponseEntity.ok(responseBody);
    }

    /**
     * Get renewal request by ID
     * GET /api/v1/tenants/renewal-requests/{requestId}
     *
     * @param requestId Request UUID
     * @return Renewal request details
     */
    @GetMapping("/api/v1/tenants/renewal-requests/{requestId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'PROPERTY_MANAGER', 'ADMIN')")
    @Operation(summary = "Get renewal request", description = "Get renewal request details by ID")
    public ResponseEntity<Map<String, Object>> getRequestById(
            @PathVariable UUID requestId
    ) {
        RenewalRequestResponse response = renewalRequestService.getRequestById(requestId);

        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("success", true);
        responseBody.put("data", response);
        responseBody.put("timestamp", LocalDateTime.now());

        return ResponseEntity.ok(responseBody);
    }

    /**
     * Approve a renewal request
     * PATCH /api/v1/tenants/renewal-requests/{requestId}/approve
     *
     * @param requestId Request UUID
     * @return Updated renewal request
     */
    @PatchMapping("/api/v1/tenants/renewal-requests/{requestId}/approve")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'PROPERTY_MANAGER', 'ADMIN')")
    @Operation(summary = "Approve renewal request", description = "Approve a pending renewal request")
    public ResponseEntity<Map<String, Object>> approveRequest(
            @PathVariable UUID requestId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        LOGGER.info("Approving renewal request: {}", requestId);

        UUID userId = getUserIdFromPrincipal(userDetails);
        RenewalRequestResponse response = renewalRequestService.approveRequest(requestId, userId);

        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("success", true);
        responseBody.put("data", response);
        responseBody.put("message", "Renewal request approved. Proceed to create lease extension.");
        responseBody.put("timestamp", LocalDateTime.now());

        return ResponseEntity.ok(responseBody);
    }

    /**
     * Reject a renewal request
     * PATCH /api/v1/tenants/renewal-requests/{requestId}/reject
     *
     * @param requestId Request UUID
     * @param request   Rejection reason
     * @return Updated renewal request
     */
    @PatchMapping("/api/v1/tenants/renewal-requests/{requestId}/reject")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'PROPERTY_MANAGER', 'ADMIN')")
    @Operation(summary = "Reject renewal request", description = "Reject a pending renewal request with reason")
    public ResponseEntity<Map<String, Object>> rejectRequest(
            @PathVariable UUID requestId,
            @Valid @RequestBody RejectRenewalRequestDto request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        LOGGER.info("Rejecting renewal request: {}", requestId);

        UUID userId = getUserIdFromPrincipal(userDetails);
        RenewalRequestResponse response = renewalRequestService.rejectRequest(requestId, request.getReason(), userId);

        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("success", true);
        responseBody.put("data", response);
        responseBody.put("message", "Renewal request rejected");
        responseBody.put("timestamp", LocalDateTime.now());

        return ResponseEntity.ok(responseBody);
    }

    // ========================================================================
    // Helper Methods
    // ========================================================================

    /**
     * Extract tenant ID from security principal
     */
    private UUID getTenantIdFromPrincipal(UserDetails userDetails) {
        String email = userDetails.getUsername();
        Tenant tenant = tenantRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Tenant not found for email: " + email));
        return tenant.getId();
    }

    /**
     * Extract user ID from security principal
     */
    private UUID getUserIdFromPrincipal(UserDetails userDetails) {
        String email = userDetails.getUsername();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
        return user.getId();
    }
}
