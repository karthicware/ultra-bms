package com.ultrabms.controller;

import com.ultrabms.dto.checkout.*;
import com.ultrabms.entity.enums.CheckoutStatus;
import com.ultrabms.security.CurrentUser;
import com.ultrabms.security.UserPrincipal;
import com.ultrabms.service.TenantCheckoutService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST Controller for tenant checkout and deposit refund operations
 *
 * Story 3.7: Tenant Checkout and Deposit Refund Processing
 */
@RestController
@RequestMapping("/api/v1")
@Tag(name = "Tenant Checkout", description = "Checkout and deposit refund management APIs")
@SecurityRequirement(name = "bearer-jwt")
public class TenantCheckoutController {

    private static final Logger LOGGER = LoggerFactory.getLogger(TenantCheckoutController.class);

    private final TenantCheckoutService checkoutService;

    public TenantCheckoutController(TenantCheckoutService checkoutService) {
        this.checkoutService = checkoutService;
    }

    // ========================================================================
    // CHECKOUT INITIATION ENDPOINTS
    // ========================================================================

    /**
     * Get tenant checkout summary for initiation form
     */
    @GetMapping("/tenants/{tenantId}/checkout/summary")
    @PreAuthorize("hasAnyRole('PROPERTY_MANAGER', 'ADMIN')")
    @Operation(summary = "Get tenant checkout summary", description = "Get tenant details for checkout initiation")
    public ResponseEntity<Map<String, Object>> getTenantCheckoutSummary(
            @PathVariable UUID tenantId) {

        LOGGER.info("Getting checkout summary for tenant: {}", tenantId);
        TenantCheckoutSummaryDto summary = checkoutService.getTenantCheckoutSummary(tenantId);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", summary
        ));
    }

    /**
     * Get tenant outstanding amounts
     */
    @GetMapping("/tenants/{tenantId}/outstanding")
    @PreAuthorize("hasAnyRole('PROPERTY_MANAGER', 'ADMIN')")
    @Operation(summary = "Get tenant outstanding amounts", description = "Get breakdown of tenant outstanding invoices and fees")
    public ResponseEntity<Map<String, Object>> getTenantOutstanding(
            @PathVariable UUID tenantId) {

        LOGGER.info("Getting outstanding amounts for tenant: {}", tenantId);
        OutstandingAmountsDto outstanding = checkoutService.getTenantOutstanding(tenantId);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", outstanding
        ));
    }

    /**
     * Initiate checkout for tenant
     */
    @PostMapping("/tenants/{tenantId}/checkout/initiate")
    @PreAuthorize("hasAnyRole('PROPERTY_MANAGER', 'ADMIN')")
    @Operation(summary = "Initiate checkout", description = "Start checkout process for tenant")
    public ResponseEntity<Map<String, Object>> initiateCheckout(
            @PathVariable UUID tenantId,
            @Valid @RequestBody InitiateCheckoutRequest request,
            @CurrentUser UserPrincipal currentUser) {

        LOGGER.info("Initiating checkout for tenant: {} by user: {}", tenantId, currentUser.getId());
        request.setTenantId(tenantId);
        CheckoutResponse checkout = checkoutService.initiateCheckout(request, currentUser.getId());

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "success", true,
                "data", Map.of(
                        "checkoutId", checkout.getId(),
                        "checkoutNumber", checkout.getCheckoutNumber(),
                        "status", checkout.getStatus()
                ),
                "message", "Checkout initiated successfully"
        ));
    }

    // ========================================================================
    // CHECKOUT RETRIEVAL ENDPOINTS
    // ========================================================================

    /**
     * Get paginated list of checkouts
     */
    @GetMapping("/checkouts")
    @PreAuthorize("hasAnyRole('PROPERTY_MANAGER', 'ADMIN')")
    @Operation(summary = "List checkouts", description = "Get paginated list of checkouts with filters")
    public ResponseEntity<Map<String, Object>> getCheckouts(
            @RequestParam(required = false) CheckoutStatus status,
            @RequestParam(required = false) UUID propertyId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20) Pageable pageable) {

        LOGGER.info("Getting checkouts with filters - status: {}, propertyId: {}", status, propertyId);
        Page<CheckoutListDto> checkouts = checkoutService.getCheckouts(
                status, propertyId, fromDate, toDate, search, pageable);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", checkouts
        ));
    }

    /**
     * Get single checkout by ID
     */
    @GetMapping("/checkouts/{checkoutId}")
    @PreAuthorize("hasAnyRole('PROPERTY_MANAGER', 'ADMIN')")
    @Operation(summary = "Get checkout", description = "Get checkout details by ID")
    public ResponseEntity<Map<String, Object>> getCheckout(
            @PathVariable UUID checkoutId) {

        LOGGER.info("Getting checkout: {}", checkoutId);
        CheckoutResponse checkout = checkoutService.getCheckout(checkoutId);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", checkout
        ));
    }

    /**
     * Get checkout by tenant ID
     */
    @GetMapping("/tenants/{tenantId}/checkout")
    @PreAuthorize("hasAnyRole('PROPERTY_MANAGER', 'ADMIN')")
    @Operation(summary = "Get checkout by tenant", description = "Get active checkout for tenant")
    public ResponseEntity<Map<String, Object>> getCheckoutByTenant(
            @PathVariable UUID tenantId) {

        LOGGER.info("Getting checkout for tenant: {}", tenantId);
        CheckoutResponse checkout = checkoutService.getCheckoutByTenant(tenantId);

        if (checkout == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                    "success", false,
                    "message", "No active checkout found for tenant"
            ));
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", checkout
        ));
    }

    // ========================================================================
    // INSPECTION ENDPOINTS
    // ========================================================================

    /**
     * Save inspection data
     */
    @PutMapping("/tenants/{tenantId}/checkout/{checkoutId}/inspection")
    @PreAuthorize("hasAnyRole('PROPERTY_MANAGER', 'ADMIN')")
    @Operation(summary = "Save inspection", description = "Save inspection data for checkout")
    public ResponseEntity<Map<String, Object>> saveInspection(
            @PathVariable UUID tenantId,
            @PathVariable UUID checkoutId,
            @Valid @RequestBody SaveInspectionRequest request,
            @CurrentUser UserPrincipal currentUser) {

        LOGGER.info("Saving inspection for checkout: {} by user: {}", checkoutId, currentUser.getId());
        CheckoutResponse checkout = checkoutService.saveInspection(tenantId, checkoutId, request, currentUser.getId());

        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", checkout,
                "message", "Inspection saved successfully"
        ));
    }

    /**
     * Get inspection details
     */
    @GetMapping("/checkouts/{checkoutId}/inspection")
    @PreAuthorize("hasAnyRole('PROPERTY_MANAGER', 'ADMIN')")
    @Operation(summary = "Get inspection", description = "Get inspection details for checkout")
    public ResponseEntity<Map<String, Object>> getInspection(
            @PathVariable UUID checkoutId) {

        LOGGER.info("Getting inspection for checkout: {}", checkoutId);
        CheckoutResponse checkout = checkoutService.getCheckout(checkoutId);

        if (!checkout.getHasInspectionChecklist()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                    "success", false,
                    "message", "No inspection data found"
            ));
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", Map.of(
                        "inspectionDate", checkout.getInspectionDate(),
                        "inspectionTime", checkout.getInspectionTime(),
                        "inspectorName", checkout.getInspectorName(),
                        "overallCondition", checkout.getOverallCondition(),
                        "inspectionNotes", checkout.getInspectionNotes(),
                        "photoCount", checkout.getPhotoCount()
                )
        ));
    }

    /**
     * Upload inspection photos
     */
    @PostMapping(value = "/tenants/{tenantId}/checkout/{checkoutId}/inspection/photos",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('PROPERTY_MANAGER', 'ADMIN')")
    @Operation(summary = "Upload inspection photos", description = "Upload photos for inspection")
    public ResponseEntity<Map<String, Object>> uploadInspectionPhotos(
            @PathVariable UUID tenantId,
            @PathVariable UUID checkoutId,
            @RequestParam("files") MultipartFile[] files,
            @RequestParam("section") String section,
            @RequestParam("photoType") String photoType,
            @CurrentUser UserPrincipal currentUser) {

        LOGGER.info("Uploading {} photos for checkout: {}", files.length, checkoutId);
        List<Map<String, Object>> uploadedPhotos = checkoutService.uploadInspectionPhotos(
                tenantId, checkoutId, files, section, photoType, currentUser.getId());

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "success", true,
                "data", uploadedPhotos,
                "message", String.format("%d photos uploaded successfully", uploadedPhotos.size())
        ));
    }

    /**
     * Delete inspection photo
     */
    @DeleteMapping("/checkouts/{checkoutId}/inspection/photos/{photoId}")
    @PreAuthorize("hasAnyRole('PROPERTY_MANAGER', 'ADMIN')")
    @Operation(summary = "Delete inspection photo", description = "Delete a photo from inspection")
    public ResponseEntity<Map<String, Object>> deleteInspectionPhoto(
            @PathVariable UUID checkoutId,
            @PathVariable String photoId,
            @CurrentUser UserPrincipal currentUser) {

        LOGGER.info("Deleting photo {} from checkout: {}", photoId, checkoutId);
        checkoutService.deleteInspectionPhoto(checkoutId, photoId, currentUser.getId());

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Photo deleted successfully"
        ));
    }

    // ========================================================================
    // DEPOSIT CALCULATION ENDPOINTS
    // ========================================================================

    /**
     * Save deposit calculation
     */
    @PutMapping("/tenants/{tenantId}/checkout/{checkoutId}/deposit")
    @PreAuthorize("hasAnyRole('PROPERTY_MANAGER', 'ADMIN')")
    @Operation(summary = "Save deposit calculation", description = "Save deposit deductions and calculate refund")
    public ResponseEntity<Map<String, Object>> saveDepositCalculation(
            @PathVariable UUID tenantId,
            @PathVariable UUID checkoutId,
            @Valid @RequestBody SaveDepositCalculationRequest request,
            @CurrentUser UserPrincipal currentUser) {

        LOGGER.info("Saving deposit calculation for checkout: {} by user: {}", checkoutId, currentUser.getId());
        CheckoutResponse checkout = checkoutService.saveDepositCalculation(
                tenantId, checkoutId, request, currentUser.getId());

        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", checkout,
                "message", "Deposit calculation saved successfully"
        ));
    }

    /**
     * Get deposit refund details
     */
    @GetMapping("/checkouts/{checkoutId}/deposit")
    @PreAuthorize("hasAnyRole('PROPERTY_MANAGER', 'ADMIN')")
    @Operation(summary = "Get deposit refund", description = "Get deposit refund details for checkout")
    public ResponseEntity<Map<String, Object>> getDepositRefund(
            @PathVariable UUID checkoutId) {

        LOGGER.info("Getting deposit refund for checkout: {}", checkoutId);
        DepositRefundDto depositRefund = checkoutService.getDepositRefund(checkoutId);

        if (depositRefund == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                    "success", false,
                    "message", "Deposit refund not found"
            ));
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", depositRefund
        ));
    }

    // ========================================================================
    // REFUND PROCESSING ENDPOINTS
    // ========================================================================

    /**
     * Process deposit refund
     */
    @PostMapping("/checkouts/{checkoutId}/refund")
    @PreAuthorize("hasAnyRole('PROPERTY_MANAGER', 'ADMIN')")
    @Operation(summary = "Process refund", description = "Process deposit refund payment")
    public ResponseEntity<Map<String, Object>> processRefund(
            @PathVariable UUID checkoutId,
            @Valid @RequestBody ProcessRefundRequest request,
            @CurrentUser UserPrincipal currentUser) {

        LOGGER.info("Processing refund for checkout: {} by user: {}", checkoutId, currentUser.getId());
        CheckoutResponse checkout = checkoutService.processRefund(checkoutId, request, currentUser.getId());

        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", checkout,
                "message", "Refund processed successfully"
        ));
    }

    /**
     * Approve refund (ADMIN only for amounts > threshold)
     */
    @PostMapping("/checkouts/{checkoutId}/refund/approve")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Approve refund", description = "Approve high-value refund (ADMIN only)")
    public ResponseEntity<Map<String, Object>> approveRefund(
            @PathVariable UUID checkoutId,
            @RequestBody(required = false) Map<String, String> body,
            @CurrentUser UserPrincipal currentUser) {

        LOGGER.info("Approving refund for checkout: {} by admin: {}", checkoutId, currentUser.getId());
        String notes = body != null ? body.get("notes") : null;
        CheckoutResponse checkout = checkoutService.approveRefund(checkoutId, notes, currentUser.getId());

        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", checkout,
                "message", "Refund approved successfully"
        ));
    }

    // ========================================================================
    // CHECKOUT COMPLETION ENDPOINTS
    // ========================================================================

    /**
     * Complete checkout
     */
    @PostMapping("/tenants/{tenantId}/checkout/{checkoutId}/complete")
    @PreAuthorize("hasAnyRole('PROPERTY_MANAGER', 'ADMIN')")
    @Operation(summary = "Complete checkout", description = "Complete checkout process and finalize tenant departure")
    public ResponseEntity<Map<String, Object>> completeCheckout(
            @PathVariable UUID tenantId,
            @PathVariable UUID checkoutId,
            @Valid @RequestBody CompleteCheckoutRequest request,
            @CurrentUser UserPrincipal currentUser) {

        LOGGER.info("Completing checkout: {} for tenant: {} by user: {}", checkoutId, tenantId, currentUser.getId());
        Map<String, Object> result = checkoutService.completeCheckout(tenantId, checkoutId, request, currentUser.getId());

        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", result,
                "message", "Checkout completed successfully"
        ));
    }

    // ========================================================================
    // DOCUMENT ENDPOINTS
    // ========================================================================

    /**
     * Get checkout document (inspection report, deposit statement, final settlement)
     */
    @GetMapping("/checkouts/{checkoutId}/documents/{documentType}")
    @PreAuthorize("hasAnyRole('PROPERTY_MANAGER', 'ADMIN')")
    @Operation(summary = "Get checkout document", description = "Get presigned URL for checkout document")
    public ResponseEntity<Map<String, Object>> getCheckoutDocument(
            @PathVariable UUID checkoutId,
            @PathVariable String documentType) {

        LOGGER.info("Getting {} document for checkout: {}", documentType, checkoutId);
        String url = checkoutService.getCheckoutDocument(checkoutId, documentType);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", Map.of("url", url)
        ));
    }

    /**
     * Get refund receipt
     */
    @GetMapping("/checkouts/{checkoutId}/receipt")
    @PreAuthorize("hasAnyRole('PROPERTY_MANAGER', 'ADMIN')")
    @Operation(summary = "Get refund receipt", description = "Get presigned URL for refund receipt PDF")
    public ResponseEntity<Map<String, Object>> getRefundReceipt(
            @PathVariable UUID checkoutId) {

        LOGGER.info("Getting refund receipt for checkout: {}", checkoutId);
        String url = checkoutService.getRefundReceipt(checkoutId);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", Map.of("url", url)
        ));
    }

    // ========================================================================
    // STATISTICS ENDPOINTS
    // ========================================================================

    /**
     * Get checkout counts by status
     */
    @GetMapping("/checkouts/counts")
    @PreAuthorize("hasAnyRole('PROPERTY_MANAGER', 'ADMIN')")
    @Operation(summary = "Get checkout counts", description = "Get count of checkouts by status")
    public ResponseEntity<Map<String, Object>> getCheckoutCounts() {

        LOGGER.info("Getting checkout counts");
        Map<CheckoutStatus, Long> counts = checkoutService.getCheckoutCounts();

        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", counts
        ));
    }

    /**
     * Get pending refunds count
     */
    @GetMapping("/checkouts/refunds/pending/count")
    @PreAuthorize("hasAnyRole('PROPERTY_MANAGER', 'ADMIN')")
    @Operation(summary = "Get pending refunds count", description = "Get count of refunds pending processing")
    public ResponseEntity<Map<String, Object>> getPendingRefundsCount() {

        LOGGER.info("Getting pending refunds count");
        long count = checkoutService.getPendingRefundsCount();

        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", Map.of("count", count)
        ));
    }

    /**
     * Get refunds requiring approval (ADMIN)
     */
    @GetMapping("/checkouts/refunds/pending-approval")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get refunds pending approval", description = "Get list of refunds requiring admin approval")
    public ResponseEntity<Map<String, Object>> getRefundsRequiringApproval() {

        LOGGER.info("Getting refunds requiring approval");
        List<CheckoutListDto> refunds = checkoutService.getRefundsRequiringApproval();

        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", refunds
        ));
    }
}
