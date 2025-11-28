package com.ultrabms.controller;

import com.ultrabms.dto.invoices.*;
import com.ultrabms.entity.User;
import com.ultrabms.entity.enums.InvoiceStatus;
import com.ultrabms.entity.enums.PaymentMethod;
import com.ultrabms.repository.UserRepository;
import com.ultrabms.service.InvoiceService;
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
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST Controller for Invoice and Payment Management
 * Handles invoice CRUD, payment recording, and invoice lifecycle operations
 *
 * Story 6.1: Rent Invoicing and Payment Management
 */
@RestController
@RequestMapping("/api/v1/invoices")
@Tag(name = "Invoices", description = "Invoice and payment management APIs")
@SecurityRequirement(name = "Bearer Authentication")
public class InvoiceController {

    private static final Logger LOGGER = LoggerFactory.getLogger(InvoiceController.class);

    private final InvoiceService invoiceService;
    private final UserRepository userRepository;

    public InvoiceController(InvoiceService invoiceService, UserRepository userRepository) {
        this.invoiceService = invoiceService;
        this.userRepository = userRepository;
    }

    // =================================================================
    // INVOICE CRUD OPERATIONS
    // =================================================================

    /**
     * Create a new invoice
     * POST /api/v1/invoices
     * AC #4: Manual invoice creation
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Create invoice",
            description = "Create a new invoice for a tenant"
    )
    public ResponseEntity<Map<String, Object>> createInvoice(
            @Valid @RequestBody InvoiceCreateDto dto,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        LOGGER.info("Creating invoice for tenant: {} by user: {}", dto.tenantId(), userDetails.getUsername());

        UUID userId = getUserIdFromUserDetails(userDetails);
        InvoiceResponseDto response = invoiceService.createInvoice(dto, userId);

        Map<String, Object> responseBody = buildSuccessResponse(response, "Invoice created successfully");
        return ResponseEntity.status(HttpStatus.CREATED).body(responseBody);
    }

    /**
     * Get invoice by ID
     * GET /api/v1/invoices/{id}
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Get invoice",
            description = "Get invoice details with payment history"
    )
    public ResponseEntity<Map<String, Object>> getInvoice(@PathVariable UUID id) {
        LOGGER.debug("Getting invoice: {}", id);

        InvoiceResponseDto response = invoiceService.getInvoiceById(id);

        Map<String, Object> responseBody = buildSuccessResponse(response, "Invoice retrieved successfully");
        return ResponseEntity.ok(responseBody);
    }

    /**
     * Get paginated list of invoices
     * GET /api/v1/invoices?search=...&status=SENT&propertyId=...&page=0&size=20
     * AC #15: Display all invoices with status, outstanding balance
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "List invoices",
            description = "Get paginated list of invoices with optional filters"
    )
    public ResponseEntity<Map<String, Object>> getInvoices(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) InvoiceStatus status,
            @RequestParam(required = false) UUID propertyId,
            @RequestParam(required = false) UUID tenantId,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate,
            @RequestParam(required = false, defaultValue = "false") Boolean overdueOnly,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection
    ) {
        LOGGER.debug("Getting invoices with filters - search: {}, status: {}", search, status);

        InvoiceFilterDto filterDto = new InvoiceFilterDto(
                search, status, propertyId, tenantId, fromDate, toDate,
                overdueOnly, page, size, sortBy, sortDirection
        );

        Sort sort = Sort.by(
                "DESC".equalsIgnoreCase(sortDirection) ? Sort.Direction.DESC : Sort.Direction.ASC,
                sortBy
        );
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<InvoiceListDto> invoicePage = invoiceService.getInvoices(filterDto, pageable);

        Map<String, Object> responseBody = buildPageResponse(invoicePage, "Invoices retrieved successfully");
        return ResponseEntity.ok(responseBody);
    }

    /**
     * Update invoice (DRAFT status only)
     * PUT /api/v1/invoices/{id}
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Update invoice",
            description = "Update invoice details (only DRAFT invoices can be updated)"
    )
    public ResponseEntity<Map<String, Object>> updateInvoice(
            @PathVariable UUID id,
            @Valid @RequestBody InvoiceUpdateDto dto,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        LOGGER.info("Updating invoice: {} by user: {}", id, userDetails.getUsername());

        UUID userId = getUserIdFromUserDetails(userDetails);
        InvoiceResponseDto response = invoiceService.updateInvoice(id, dto, userId);

        Map<String, Object> responseBody = buildSuccessResponse(response, "Invoice updated successfully");
        return ResponseEntity.ok(responseBody);
    }

    // =================================================================
    // INVOICE LIFECYCLE OPERATIONS
    // =================================================================

    /**
     * Send invoice to tenant
     * POST /api/v1/invoices/{id}/send
     * AC #6, #11: Send invoice via email
     */
    @PostMapping("/{id}/send")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Send invoice",
            description = "Send invoice to tenant via email (changes status from DRAFT to SENT)"
    )
    public ResponseEntity<Map<String, Object>> sendInvoice(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        LOGGER.info("Sending invoice: {} by user: {}", id, userDetails.getUsername());

        UUID userId = getUserIdFromUserDetails(userDetails);
        InvoiceResponseDto response = invoiceService.sendInvoice(id, userId);

        Map<String, Object> responseBody = buildSuccessResponse(response, "Invoice sent successfully");
        return ResponseEntity.ok(responseBody);
    }

    /**
     * Cancel invoice
     * POST /api/v1/invoices/{id}/cancel
     */
    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Cancel invoice",
            description = "Cancel invoice (only DRAFT or SENT with no payments can be cancelled)"
    )
    public ResponseEntity<Map<String, Object>> cancelInvoice(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        LOGGER.info("Cancelling invoice: {} by user: {}", id, userDetails.getUsername());

        UUID userId = getUserIdFromUserDetails(userDetails);
        InvoiceResponseDto response = invoiceService.cancelInvoice(id, userId);

        Map<String, Object> responseBody = buildSuccessResponse(response, "Invoice cancelled successfully");
        return ResponseEntity.ok(responseBody);
    }

    // =================================================================
    // PAYMENT OPERATIONS
    // =================================================================

    /**
     * Record a payment against an invoice
     * POST /api/v1/invoices/{id}/payments
     * AC #7: Payment recording
     */
    @PostMapping("/{id}/payments")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Record payment",
            description = "Record a payment against an invoice"
    )
    public ResponseEntity<Map<String, Object>> recordPayment(
            @PathVariable UUID id,
            @Valid @RequestBody PaymentCreateDto dto,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        LOGGER.info("Recording payment for invoice: {} by user: {}", id, userDetails.getUsername());

        UUID userId = getUserIdFromUserDetails(userDetails);
        PaymentResponseDto response = invoiceService.recordPayment(id, dto, userId);

        Map<String, Object> responseBody = buildSuccessResponse(response, "Payment recorded successfully");
        return ResponseEntity.status(HttpStatus.CREATED).body(responseBody);
    }

    /**
     * Get payments for an invoice
     * GET /api/v1/invoices/{id}/payments
     */
    @GetMapping("/{id}/payments")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Get invoice payments",
            description = "Get all payments recorded against an invoice"
    )
    public ResponseEntity<Map<String, Object>> getInvoicePayments(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        LOGGER.debug("Getting payments for invoice: {}", id);

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "paymentDate"));
        Page<PaymentListDto> paymentPage = invoiceService.getInvoicePayments(id, pageable);

        Map<String, Object> responseBody = buildPageResponse(paymentPage, "Payments retrieved successfully");
        return ResponseEntity.ok(responseBody);
    }

    // =================================================================
    // TENANT INVOICES
    // =================================================================

    /**
     * Get invoices for a specific tenant
     * GET /api/v1/invoices/tenant/{tenantId}
     */
    @GetMapping("/tenant/{tenantId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Get tenant invoices",
            description = "Get all invoices for a specific tenant"
    )
    public ResponseEntity<Map<String, Object>> getTenantInvoices(
            @PathVariable UUID tenantId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        LOGGER.debug("Getting invoices for tenant: {}", tenantId);

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<InvoiceListDto> invoicePage = invoiceService.getTenantInvoices(tenantId, pageable);

        Map<String, Object> responseBody = buildPageResponse(invoicePage, "Tenant invoices retrieved successfully");
        return ResponseEntity.ok(responseBody);
    }

    /**
     * Get outstanding invoices for a tenant
     * GET /api/v1/invoices/tenant/{tenantId}/outstanding
     */
    @GetMapping("/tenant/{tenantId}/outstanding")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Get outstanding invoices",
            description = "Get all outstanding (unpaid) invoices for a tenant"
    )
    public ResponseEntity<Map<String, Object>> getOutstandingInvoices(@PathVariable UUID tenantId) {
        LOGGER.debug("Getting outstanding invoices for tenant: {}", tenantId);

        List<InvoiceListDto> invoices = invoiceService.getOutstandingInvoicesByTenant(tenantId);

        Map<String, Object> responseBody = buildSuccessResponse(invoices, "Outstanding invoices retrieved successfully");
        return ResponseEntity.ok(responseBody);
    }

    // =================================================================
    // SUMMARY AND ANALYTICS
    // =================================================================

    /**
     * Get invoice summary for dashboard
     * GET /api/v1/invoices/summary
     * AC #15: Dashboard statistics
     */
    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Get invoice summary",
            description = "Get invoice summary statistics for dashboard"
    )
    public ResponseEntity<Map<String, Object>> getInvoiceSummary(
            @RequestParam(required = false) UUID propertyId
    ) {
        LOGGER.debug("Getting invoice summary for property: {}", propertyId);

        InvoiceSummaryDto summary = invoiceService.getInvoiceSummary(propertyId);

        Map<String, Object> responseBody = buildSuccessResponse(summary, "Invoice summary retrieved successfully");
        return ResponseEntity.ok(responseBody);
    }

    // =================================================================
    // PAYMENTS ENDPOINTS
    // =================================================================

    /**
     * Get payment by ID
     * GET /api/v1/invoices/payments/{paymentId}
     */
    @GetMapping("/payments/{paymentId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Get payment",
            description = "Get payment details by ID"
    )
    public ResponseEntity<Map<String, Object>> getPayment(@PathVariable UUID paymentId) {
        LOGGER.debug("Getting payment: {}", paymentId);

        PaymentResponseDto response = invoiceService.getPaymentById(paymentId);

        Map<String, Object> responseBody = buildSuccessResponse(response, "Payment retrieved successfully");
        return ResponseEntity.ok(responseBody);
    }

    /**
     * Get paginated list of all payments
     * GET /api/v1/invoices/payments?tenantId=...&paymentMethod=...&page=0&size=20
     */
    @GetMapping("/payments")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "List payments",
            description = "Get paginated list of all payments with optional filters"
    )
    public ResponseEntity<Map<String, Object>> getPayments(
            @RequestParam(required = false) UUID invoiceId,
            @RequestParam(required = false) UUID tenantId,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate,
            @RequestParam(required = false) PaymentMethod paymentMethod,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "paymentDate") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection
    ) {
        LOGGER.debug("Getting payments with filters");

        PaymentFilterDto filterDto = new PaymentFilterDto(
                invoiceId, tenantId, fromDate, toDate, paymentMethod,
                page, size, sortBy, sortDirection
        );

        Sort sort = Sort.by(
                "DESC".equalsIgnoreCase(sortDirection) ? Sort.Direction.DESC : Sort.Direction.ASC,
                sortBy
        );
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<PaymentListDto> paymentPage = invoiceService.getPayments(filterDto, pageable);

        Map<String, Object> responseBody = buildPageResponse(paymentPage, "Payments retrieved successfully");
        return ResponseEntity.ok(responseBody);
    }

    // =================================================================
    // PDF GENERATION ENDPOINTS
    // =================================================================

    /**
     * Download invoice as PDF
     * GET /api/v1/invoices/{id}/pdf
     * AC #9: PDF invoice format
     */
    @GetMapping(value = "/{id}/pdf", produces = "application/pdf")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Download invoice PDF",
            description = "Download invoice as PDF document"
    )
    public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable UUID id) {
        LOGGER.info("Downloading PDF for invoice: {}", id);

        byte[] pdfContent = invoiceService.generateInvoicePdf(id);

        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=invoice-" + id + ".pdf")
                .header("Content-Type", "application/pdf")
                .body(pdfContent);
    }

    /**
     * Download payment receipt as PDF
     * GET /api/v1/invoices/payments/{paymentId}/receipt
     * AC #10: Payment receipt generation
     */
    @GetMapping(value = "/payments/{paymentId}/receipt", produces = "application/pdf")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Download payment receipt PDF",
            description = "Download payment receipt as PDF document"
    )
    public ResponseEntity<byte[]> downloadPaymentReceipt(@PathVariable UUID paymentId) {
        LOGGER.info("Downloading receipt PDF for payment: {}", paymentId);

        byte[] pdfContent = invoiceService.generatePaymentReceiptPdf(paymentId);

        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=receipt-" + paymentId + ".pdf")
                .header("Content-Type", "application/pdf")
                .body(pdfContent);
    }

    // =================================================================
    // HELPER METHODS
    // =================================================================

    /**
     * Get user ID from UserDetails
     */
    private UUID getUserIdFromUserDetails(UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found: " + userDetails.getUsername()));
        return user.getId();
    }

    /**
     * Build standard success response
     */
    private Map<String, Object> buildSuccessResponse(Object data, String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", message);
        response.put("data", data);
        response.put("timestamp", LocalDateTime.now().toString());
        return response;
    }

    /**
     * Build paginated response
     */
    private <T> Map<String, Object> buildPageResponse(Page<T> page, String message) {
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
