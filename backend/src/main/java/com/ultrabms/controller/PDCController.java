package com.ultrabms.controller;

import com.ultrabms.dto.pdc.*;
import com.ultrabms.entity.User;
import com.ultrabms.entity.enums.PDCStatus;
import com.ultrabms.repository.UserRepository;
import com.ultrabms.service.PDCService;
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
 * REST Controller for PDC (Post-Dated Cheque) Management
 * Handles PDC registration, status transitions, and analytics
 *
 * Story 6.3: Post-Dated Cheque (PDC) Management
 * AC #26: PDC Controller with REST endpoints
 */
@RestController
@RequestMapping("/api/v1/pdcs")
@Tag(name = "PDCs", description = "Post-Dated Cheque management APIs")
@SecurityRequirement(name = "Bearer Authentication")
public class PDCController {

    private static final Logger LOGGER = LoggerFactory.getLogger(PDCController.class);

    private final PDCService pdcService;
    private final UserRepository userRepository;

    public PDCController(PDCService pdcService, UserRepository userRepository) {
        this.pdcService = pdcService;
        this.userRepository = userRepository;
    }

    // =================================================================
    // PDC CREATION
    // =================================================================

    /**
     * Create a single PDC
     * POST /api/v1/pdcs
     * AC #2: PDC Registration
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Create PDC",
            description = "Register a single post-dated cheque"
    )
    public ResponseEntity<Map<String, Object>> createPDC(
            @RequestBody @Valid PDCCreateDto dto,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        LOGGER.info("Creating PDC for tenant: {} by user: {}", dto.tenantId(), userDetails.getUsername());

        UUID userId = getUserIdFromUserDetails(userDetails);
        PDCResponseDto response = pdcService.createPDC(dto, userId);

        Map<String, Object> responseBody = buildSuccessResponse(response, "PDC registered successfully");
        return ResponseEntity.status(HttpStatus.CREATED).body(responseBody);
    }

    /**
     * Create multiple PDCs in bulk
     * POST /api/v1/pdcs/bulk
     * AC #3: Bulk PDC registration (1-24 cheques)
     * AC #4: Max 24 PDCs per submission
     */
    @PostMapping("/bulk")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Create bulk PDCs",
            description = "Register multiple post-dated cheques (1-24 per submission)"
    )
    public ResponseEntity<Map<String, Object>> createBulkPDCs(
            @RequestBody @Valid PDCBulkCreateDto dto,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        LOGGER.info("Creating {} bulk PDCs for tenant: {} by user: {}",
                dto.pdcEntries().size(), dto.tenantId(), userDetails.getUsername());

        UUID userId = getUserIdFromUserDetails(userDetails);
        List<PDCResponseDto> response = pdcService.createBulkPDCs(dto, userId);

        Map<String, Object> responseBody = buildSuccessResponse(response,
                String.format("%d PDCs registered successfully", response.size()));
        return ResponseEntity.status(HttpStatus.CREATED).body(responseBody);
    }

    // =================================================================
    // PDC RETRIEVAL
    // =================================================================

    /**
     * Get PDC by ID
     * GET /api/v1/pdcs/{id}
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Get PDC",
            description = "Get PDC details by ID"
    )
    public ResponseEntity<Map<String, Object>> getPDC(@PathVariable UUID id) {
        LOGGER.debug("Getting PDC: {}", id);

        PDCResponseDto response = pdcService.getPDCById(id);

        Map<String, Object> responseBody = buildSuccessResponse(response, "PDC retrieved successfully");
        return ResponseEntity.ok(responseBody);
    }

    /**
     * Get paginated list of PDCs with filters
     * GET /api/v1/pdcs?search=...&status=...&tenantId=...&page=0&size=20
     * AC #6, #7: PDC list with search and filtering
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "List PDCs",
            description = "Get paginated list of PDCs with optional filters"
    )
    public ResponseEntity<Map<String, Object>> getPDCs(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) PDCStatus status,
            @RequestParam(required = false) UUID tenantId,
            @RequestParam(required = false) String bankName,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "chequeDate") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDirection
    ) {
        LOGGER.debug("Getting PDCs with filters: search={}, status={}, tenantId={}", search, status, tenantId);

        PDCFilterDto filterDto = PDCFilterDto.builder()
                .search(search)
                .status(status)
                .tenantId(tenantId)
                .bankName(bankName)
                .fromDate(fromDate)
                .toDate(toDate)
                .page(page)
                .size(size)
                .sortBy(sortBy)
                .sortDirection(sortDirection)
                .build();

        Sort sort = Sort.by(
                sortDirection.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC,
                sortBy
        );
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<PDCListDto> pdcPage = pdcService.getPDCs(filterDto, pageable);

        Map<String, Object> responseBody = buildPageResponse(pdcPage, "PDCs retrieved successfully");
        return ResponseEntity.ok(responseBody);
    }

    /**
     * Get PDCs by tenant
     * GET /api/v1/pdcs/tenant/{tenantId}
     */
    @GetMapping("/tenant/{tenantId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Get PDCs by tenant",
            description = "Get all PDCs for a specific tenant"
    )
    public ResponseEntity<Map<String, Object>> getPDCsByTenant(
            @PathVariable UUID tenantId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        LOGGER.debug("Getting PDCs for tenant: {}", tenantId);

        Pageable pageable = PageRequest.of(page, size, Sort.by("chequeDate").ascending());
        Page<PDCListDto> pdcPage = pdcService.getPDCsByTenant(tenantId, pageable);

        Map<String, Object> responseBody = buildPageResponse(pdcPage, "Tenant PDCs retrieved successfully");
        return ResponseEntity.ok(responseBody);
    }

    /**
     * Get PDCs by invoice
     * GET /api/v1/pdcs/invoice/{invoiceId}
     */
    @GetMapping("/invoice/{invoiceId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Get PDCs by invoice",
            description = "Get all PDCs linked to a specific invoice"
    )
    public ResponseEntity<Map<String, Object>> getPDCsByInvoice(@PathVariable UUID invoiceId) {
        LOGGER.debug("Getting PDCs for invoice: {}", invoiceId);

        List<PDCListDto> pdcs = pdcService.getPDCsByInvoice(invoiceId);

        Map<String, Object> responseBody = buildSuccessResponse(pdcs, "Invoice PDCs retrieved successfully");
        return ResponseEntity.ok(responseBody);
    }

    // =================================================================
    // PDC STATUS TRANSITIONS
    // =================================================================

    /**
     * Deposit PDC
     * POST /api/v1/pdcs/{id}/deposit
     * AC #9: Mark PDC as Deposited
     */
    @PostMapping("/{id}/deposit")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Deposit PDC",
            description = "Mark PDC as deposited to bank (DUE → DEPOSITED)"
    )
    public ResponseEntity<Map<String, Object>> depositPDC(
            @PathVariable UUID id,
            @RequestBody @Valid PDCDepositDto dto,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        LOGGER.info("Depositing PDC: {} by user: {}", id, userDetails.getUsername());

        UUID userId = getUserIdFromUserDetails(userDetails);
        PDCResponseDto response = pdcService.depositPDC(id, dto, userId);

        Map<String, Object> responseBody = buildSuccessResponse(response, "PDC deposited successfully");
        return ResponseEntity.ok(responseBody);
    }

    /**
     * Clear PDC
     * POST /api/v1/pdcs/{id}/clear
     * AC #10: Mark PDC as Cleared
     */
    @PostMapping("/{id}/clear")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Clear PDC",
            description = "Mark PDC as cleared/paid (DEPOSITED → CLEARED)"
    )
    public ResponseEntity<Map<String, Object>> clearPDC(
            @PathVariable UUID id,
            @RequestBody @Valid PDCClearDto dto,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        LOGGER.info("Clearing PDC: {} by user: {}", id, userDetails.getUsername());

        UUID userId = getUserIdFromUserDetails(userDetails);
        PDCResponseDto response = pdcService.clearPDC(id, dto, userId);

        Map<String, Object> responseBody = buildSuccessResponse(response, "PDC cleared successfully");
        return ResponseEntity.ok(responseBody);
    }

    /**
     * Bounce PDC
     * POST /api/v1/pdcs/{id}/bounce
     * AC #11: Mark PDC as Bounced
     */
    @PostMapping("/{id}/bounce")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Bounce PDC",
            description = "Mark PDC as bounced (DEPOSITED → BOUNCED)"
    )
    public ResponseEntity<Map<String, Object>> bouncePDC(
            @PathVariable UUID id,
            @RequestBody @Valid PDCBounceDto dto,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        LOGGER.info("Bouncing PDC: {} by user: {}", id, userDetails.getUsername());

        UUID userId = getUserIdFromUserDetails(userDetails);
        PDCResponseDto response = pdcService.bouncePDC(id, dto, userId);

        Map<String, Object> responseBody = buildSuccessResponse(response, "PDC marked as bounced");
        return ResponseEntity.ok(responseBody);
    }

    /**
     * Replace bounced PDC
     * POST /api/v1/pdcs/{id}/replace
     * AC #12: Replace Bounced PDC
     */
    @PostMapping("/{id}/replace")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Replace PDC",
            description = "Replace a bounced PDC with a new cheque (BOUNCED → REPLACED)"
    )
    public ResponseEntity<Map<String, Object>> replacePDC(
            @PathVariable UUID id,
            @RequestBody @Valid PDCReplaceDto dto,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        LOGGER.info("Replacing PDC: {} by user: {}", id, userDetails.getUsername());

        UUID userId = getUserIdFromUserDetails(userDetails);
        PDCResponseDto response = pdcService.replacePDC(id, dto, userId);

        Map<String, Object> responseBody = buildSuccessResponse(response, "PDC replaced successfully");
        return ResponseEntity.status(HttpStatus.CREATED).body(responseBody);
    }

    /**
     * Withdraw PDC
     * POST /api/v1/pdcs/{id}/withdraw
     * AC #13: Withdraw PDC
     */
    @PostMapping("/{id}/withdraw")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Withdraw PDC",
            description = "Withdraw PDC and return to tenant (RECEIVED/DUE → WITHDRAWN)"
    )
    public ResponseEntity<Map<String, Object>> withdrawPDC(
            @PathVariable UUID id,
            @RequestBody @Valid PDCWithdrawDto dto,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        LOGGER.info("Withdrawing PDC: {} by user: {}", id, userDetails.getUsername());

        UUID userId = getUserIdFromUserDetails(userDetails);
        PDCResponseDto response = pdcService.withdrawPDC(id, dto, userId);

        Map<String, Object> responseBody = buildSuccessResponse(response, "PDC withdrawn successfully");
        return ResponseEntity.ok(responseBody);
    }

    /**
     * Cancel PDC
     * POST /api/v1/pdcs/{id}/cancel
     * AC #15: Cancel PDC
     */
    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Cancel PDC",
            description = "Cancel PDC (RECEIVED → CANCELLED)"
    )
    public ResponseEntity<Map<String, Object>> cancelPDC(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        LOGGER.info("Cancelling PDC: {} by user: {}", id, userDetails.getUsername());

        UUID userId = getUserIdFromUserDetails(userDetails);
        PDCResponseDto response = pdcService.cancelPDC(id, userId);

        Map<String, Object> responseBody = buildSuccessResponse(response, "PDC cancelled successfully");
        return ResponseEntity.ok(responseBody);
    }

    // =================================================================
    // DASHBOARD AND ANALYTICS
    // =================================================================

    /**
     * Get PDC Dashboard
     * GET /api/v1/pdcs/dashboard
     * AC #1: PDC Dashboard with KPIs
     */
    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Get PDC Dashboard",
            description = "Get PDC dashboard with KPIs and summary data"
    )
    public ResponseEntity<Map<String, Object>> getDashboard() {
        LOGGER.debug("Getting PDC dashboard");

        PDCDashboardDto response = pdcService.getDashboard();

        Map<String, Object> responseBody = buildSuccessResponse(response, "Dashboard retrieved successfully");
        return ResponseEntity.ok(responseBody);
    }

    /**
     * Get tenant PDC history
     * GET /api/v1/pdcs/tenant/{tenantId}/history
     */
    @GetMapping("/tenant/{tenantId}/history")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Get tenant PDC history",
            description = "Get tenant's PDC history with statistics"
    )
    public ResponseEntity<Map<String, Object>> getTenantPDCHistory(
            @PathVariable UUID tenantId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        LOGGER.debug("Getting PDC history for tenant: {}", tenantId);

        Pageable pageable = PageRequest.of(page, size, Sort.by("chequeDate").descending());
        TenantPDCHistoryDto response = pdcService.getTenantPDCHistory(tenantId, pageable);

        Map<String, Object> responseBody = buildSuccessResponse(response, "Tenant PDC history retrieved successfully");
        return ResponseEntity.ok(responseBody);
    }

    // =================================================================
    // WITHDRAWAL HISTORY
    // =================================================================

    /**
     * Get withdrawal history
     * GET /api/v1/pdcs/withdrawals
     * AC #16: Withdrawal history page
     */
    @GetMapping("/withdrawals")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Get withdrawal history",
            description = "Get history of withdrawn PDCs"
    )
    public ResponseEntity<Map<String, Object>> getWithdrawalHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        LOGGER.debug("Getting withdrawal history");

        Pageable pageable = PageRequest.of(page, size, Sort.by("withdrawalDate").descending());
        Page<PDCListDto> withdrawalPage = pdcService.getWithdrawalHistory(pageable);

        Map<String, Object> responseBody = buildPageResponse(withdrawalPage, "Withdrawal history retrieved successfully");
        return ResponseEntity.ok(responseBody);
    }

    // =================================================================
    // UTILITY ENDPOINTS
    // =================================================================

    /**
     * Get distinct bank names
     * GET /api/v1/pdcs/banks
     */
    @GetMapping("/banks")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Get bank names",
            description = "Get distinct bank names for filter dropdown"
    )
    public ResponseEntity<Map<String, Object>> getBankNames() {
        LOGGER.debug("Getting distinct bank names");

        List<String> bankNames = pdcService.getDistinctBankNames();

        Map<String, Object> responseBody = buildSuccessResponse(bankNames, "Bank names retrieved successfully");
        return ResponseEntity.ok(responseBody);
    }

    /**
     * Get PDC holder name
     * GET /api/v1/pdcs/holder
     * AC #5: Display PDC Holder name
     */
    @GetMapping("/holder")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Get PDC holder name",
            description = "Get company legal name for PDC holder display"
    )
    public ResponseEntity<Map<String, Object>> getPDCHolderName() {
        LOGGER.debug("Getting PDC holder name");

        String holderName = pdcService.getPDCHolderName();

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", Map.of("pdcHolderName", holderName));
        response.put("timestamp", LocalDateTime.now().toString());

        return ResponseEntity.ok(response);
    }

    /**
     * Check if cheque number exists for tenant
     * GET /api/v1/pdcs/check-duplicate?chequeNumber=...&tenantId=...
     */
    @GetMapping("/check-duplicate")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Check cheque duplicate",
            description = "Check if cheque number already exists for tenant"
    )
    public ResponseEntity<Map<String, Object>> checkDuplicate(
            @RequestParam String chequeNumber,
            @RequestParam UUID tenantId
    ) {
        LOGGER.debug("Checking duplicate cheque: {} for tenant: {}", chequeNumber, tenantId);

        boolean exists = pdcService.chequeNumberExists(chequeNumber, tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", Map.of("exists", exists));
        response.put("timestamp", LocalDateTime.now().toString());

        return ResponseEntity.ok(response);
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
        data.put("currentPage", page.getNumber());
        data.put("pageSize", page.getSize());
        data.put("hasNext", page.hasNext());
        data.put("hasPrevious", page.hasPrevious());

        response.put("data", data);
        response.put("timestamp", LocalDateTime.now().toString());
        return response;
    }
}
