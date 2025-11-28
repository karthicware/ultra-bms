package com.ultrabms.controller;

import com.ultrabms.dto.lease.CurrentLeaseSummaryDto;
import com.ultrabms.dto.lease.ExpiringLeaseDto;
import com.ultrabms.dto.lease.LeaseExtensionRequest;
import com.ultrabms.dto.lease.LeaseExtensionResponse;
import com.ultrabms.entity.User;
import com.ultrabms.repository.UserRepository;
import com.ultrabms.service.LeaseExtensionService;
import com.ultrabms.service.LeaseExtensionService.ExpiringLeasesSummary;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST Controller for Lease Extension Management
 * Story 3.6: Tenant Lease Extension and Renewal
 *
 * Provides endpoints for extending leases, viewing extension history,
 * and monitoring expiring leases.
 */
@RestController
@RequestMapping("/api/v1/tenants")
@Tag(name = "Lease Extensions", description = "Lease extension and renewal management")
public class LeaseExtensionController {

    private static final Logger LOGGER = LoggerFactory.getLogger(LeaseExtensionController.class);

    private final LeaseExtensionService leaseExtensionService;
    private final UserRepository userRepository;

    public LeaseExtensionController(LeaseExtensionService leaseExtensionService, UserRepository userRepository) {
        this.leaseExtensionService = leaseExtensionService;
        this.userRepository = userRepository;
    }

    // ========================================================================
    // Lease Extension Endpoints
    // ========================================================================

    /**
     * Extend a tenant's lease
     * POST /api/v1/tenants/{tenantId}/lease/extend
     *
     * Creates a new lease extension, updates tenant record with new end date
     * and rent (if changed), and sends confirmation email.
     *
     * @param tenantId Tenant UUID
     * @param request  Lease extension request with new terms
     * @return LeaseExtensionResponse with extension details
     */
    @PostMapping("/{tenantId}/lease/extend")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'PROPERTY_MANAGER', 'ADMIN')")
    @Operation(summary = "Extend tenant lease", description = "Create a lease extension with optional rent adjustment")
    public ResponseEntity<Map<String, Object>> extendLease(
            @PathVariable UUID tenantId,
            @Valid @RequestBody LeaseExtensionRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        LOGGER.info("Extending lease for tenant: {}", tenantId);

        // Get user ID from security context
        UUID userId = getUserIdFromPrincipal(userDetails);

        LeaseExtensionResponse response = leaseExtensionService.extendLease(tenantId, request, userId);

        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("success", true);
        responseBody.put("data", response);
        responseBody.put("message", String.format("Lease extended successfully until %s", response.getNewEndDate()));
        responseBody.put("timestamp", LocalDateTime.now());

        return ResponseEntity.status(HttpStatus.CREATED).body(responseBody);
    }

    /**
     * Get lease extension history for a tenant
     * GET /api/v1/tenants/{tenantId}/lease/extensions
     *
     * @param tenantId Tenant UUID
     * @return List of lease extensions ordered by date DESC
     */
    @GetMapping("/{tenantId}/lease/extensions")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'PROPERTY_MANAGER', 'ADMIN', 'TENANT')")
    @Operation(summary = "Get extension history", description = "List all lease extensions for a tenant")
    public ResponseEntity<Map<String, Object>> getExtensionHistory(
            @PathVariable UUID tenantId
    ) {
        LOGGER.debug("Getting extension history for tenant: {}", tenantId);

        List<LeaseExtensionResponse> extensions = leaseExtensionService.getExtensionHistory(tenantId);

        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("success", true);
        responseBody.put("data", extensions);
        responseBody.put("timestamp", LocalDateTime.now());

        return ResponseEntity.ok(responseBody);
    }

    /**
     * Get current lease summary for extension form
     * GET /api/v1/tenants/{tenantId}/lease/renewal-offer
     *
     * Returns current lease details to pre-populate the extension form.
     *
     * @param tenantId Tenant UUID
     * @return Current lease summary
     */
    @GetMapping("/{tenantId}/lease/renewal-offer")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'PROPERTY_MANAGER', 'ADMIN')")
    @Operation(summary = "Get renewal offer", description = "Get current lease details for extension form")
    public ResponseEntity<Map<String, Object>> getRenewalOffer(
            @PathVariable UUID tenantId
    ) {
        LOGGER.debug("Getting renewal offer for tenant: {}", tenantId);

        CurrentLeaseSummaryDto summary = leaseExtensionService.getCurrentLeaseSummary(tenantId);

        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("success", true);
        responseBody.put("data", summary);
        responseBody.put("timestamp", LocalDateTime.now());

        return ResponseEntity.ok(responseBody);
    }

    /**
     * Get presigned URL for amendment PDF download
     * GET /api/v1/tenants/{tenantId}/lease/amendment/{extensionId}/pdf
     *
     * @param tenantId    Tenant UUID
     * @param extensionId Extension UUID
     * @return Presigned S3 URL for PDF download
     */
    @GetMapping("/{tenantId}/lease/amendment/{extensionId}/pdf")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'PROPERTY_MANAGER', 'ADMIN', 'TENANT')")
    @Operation(summary = "Get amendment PDF", description = "Get presigned URL for amendment document download")
    public ResponseEntity<Map<String, Object>> getAmendmentPdf(
            @PathVariable UUID tenantId,
            @PathVariable UUID extensionId
    ) {
        LOGGER.debug("Getting amendment PDF for extension: {}", extensionId);

        String pdfUrl = leaseExtensionService.getAmendmentPdfUrl(tenantId, extensionId);

        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("success", true);
        responseBody.put("data", Map.of("url", pdfUrl));
        responseBody.put("timestamp", LocalDateTime.now());

        return ResponseEntity.ok(responseBody);
    }

    // ========================================================================
    // Expiring Leases Endpoints
    // ========================================================================

    /**
     * Get tenants with expiring leases
     * GET /api/v1/tenants/expiring
     *
     * Returns grouped lists of tenants with leases expiring in 14, 30, and 60 days.
     *
     * @param propertyId Optional property filter
     * @return Expiring leases summary with counts
     */
    @GetMapping("/expiring")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'PROPERTY_MANAGER', 'ADMIN')")
    @Operation(summary = "Get expiring leases", description = "List tenants with leases expiring soon")
    public ResponseEntity<Map<String, Object>> getExpiringLeases(
            @RequestParam(required = false) @Parameter(description = "Filter by property ID") UUID propertyId
    ) {
        LOGGER.debug("Getting expiring leases, propertyId: {}", propertyId);

        ExpiringLeasesSummary summary = leaseExtensionService.getExpiringLeasesSummary();

        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("success", true);
        responseBody.put("data", Map.of(
                "expiring14Days", summary.expiring14Days(),
                "expiring30Days", summary.expiring30Days(),
                "expiring60Days", summary.expiring60Days()
        ));
        responseBody.put("counts", Map.of(
                "expiring14Days", summary.count14Days(),
                "expiring30Days", summary.count30Days(),
                "expiring60Days", summary.count60Days()
        ));
        responseBody.put("timestamp", LocalDateTime.now());

        return ResponseEntity.ok(responseBody);
    }

    /**
     * Get expiring leases by days threshold
     * GET /api/v1/tenants/expiring/{days}
     *
     * @param days Days until expiry (e.g., 14, 30, 60)
     * @return List of expiring leases
     */
    @GetMapping("/expiring/{days}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'PROPERTY_MANAGER', 'ADMIN')")
    @Operation(summary = "Get expiring leases by days", description = "List tenants with leases expiring within specified days")
    public ResponseEntity<Map<String, Object>> getExpiringLeasesByDays(
            @PathVariable int days
    ) {
        LOGGER.debug("Getting leases expiring in {} days", days);

        List<ExpiringLeaseDto> expiringLeases = leaseExtensionService.getExpiringLeases(days);

        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("success", true);
        responseBody.put("data", expiringLeases);
        responseBody.put("count", expiringLeases.size());
        responseBody.put("timestamp", LocalDateTime.now());

        return ResponseEntity.ok(responseBody);
    }

    // ========================================================================
    // Helper Methods
    // ========================================================================

    /**
     * Extract user ID from security principal
     * In production, this would come from a custom UserDetails implementation
     */
    private UUID getUserIdFromPrincipal(UserDetails userDetails) {
        String email = userDetails.getUsername();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
        return user.getId();
    }
}
