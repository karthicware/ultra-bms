package com.ultrabms.controller;

import com.ultrabms.dto.expenses.*;
import com.ultrabms.entity.User;
import com.ultrabms.entity.enums.ExpenseCategory;
import com.ultrabms.entity.enums.ExpensePaymentStatus;
import com.ultrabms.repository.UserRepository;
import com.ultrabms.service.ExpenseService;
import com.ultrabms.service.FileStorageService;
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
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST Controller for Expense Management
 * Handles expense CRUD, payments, batch processing, and analytics
 *
 * Story 6.2: Expense Management and Vendor Payments
 * AC #24: ExpenseController with REST endpoints
 */
@RestController
@RequestMapping("/api/v1/expenses")
@Tag(name = "Expenses", description = "Expense management and vendor payment APIs")
@SecurityRequirement(name = "Bearer Authentication")
public class ExpenseController {

    private static final Logger LOGGER = LoggerFactory.getLogger(ExpenseController.class);

    private final ExpenseService expenseService;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    public ExpenseController(
            ExpenseService expenseService,
            UserRepository userRepository,
            FileStorageService fileStorageService
    ) {
        this.expenseService = expenseService;
        this.userRepository = userRepository;
        this.fileStorageService = fileStorageService;
    }

    // =================================================================
    // EXPENSE CRUD OPERATIONS
    // =================================================================

    /**
     * Create a new expense with optional receipt upload
     * POST /api/v1/expenses
     * AC #4: Manual expense creation with multipart form data
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Create expense",
            description = "Create a new expense with optional receipt file"
    )
    public ResponseEntity<Map<String, Object>> createExpense(
            @RequestPart("expense") @Valid ExpenseCreateDto dto,
            @RequestPart(value = "receipt", required = false) MultipartFile receiptFile,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        LOGGER.info("Creating expense with category: {} by user: {}", dto.category(), userDetails.getUsername());

        UUID userId = getUserIdFromUserDetails(userDetails);
        ExpenseResponseDto response = expenseService.createExpense(dto, receiptFile, userId);

        Map<String, Object> responseBody = buildSuccessResponse(response, "Expense created successfully");
        return ResponseEntity.status(HttpStatus.CREATED).body(responseBody);
    }

    /**
     * Get expense by ID
     * GET /api/v1/expenses/{id}
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Get expense",
            description = "Get expense details by ID"
    )
    public ResponseEntity<Map<String, Object>> getExpense(@PathVariable UUID id) {
        LOGGER.debug("Getting expense: {}", id);

        ExpenseResponseDto response = expenseService.getExpenseById(id);

        Map<String, Object> responseBody = buildSuccessResponse(response, "Expense retrieved successfully");
        return ResponseEntity.ok(responseBody);
    }

    /**
     * Get paginated list of expenses with filters
     * GET /api/v1/expenses?search=...&category=...&paymentStatus=...&page=0&size=20
     * AC #6: Expense list with filtering
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "List expenses",
            description = "Get paginated list of expenses with optional filters"
    )
    public ResponseEntity<Map<String, Object>> getExpenses(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) ExpenseCategory category,
            @RequestParam(required = false) ExpensePaymentStatus paymentStatus,
            @RequestParam(required = false) UUID propertyId,
            @RequestParam(required = false) UUID vendorId,
            @RequestParam(required = false) UUID workOrderId,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "expenseDate") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection
    ) {
        LOGGER.debug("Getting expenses with filters - search: {}, category: {}, status: {}", search, category, paymentStatus);

        ExpenseFilterDto filterDto = ExpenseFilterDto.builder()
                .searchTerm(search)
                .category(category)
                .paymentStatus(paymentStatus)
                .propertyId(propertyId)
                .vendorId(vendorId)
                .workOrderId(workOrderId)
                .fromDate(fromDate)
                .toDate(toDate)
                .page(page)
                .size(size)
                .sortBy(sortBy)
                .sortDirection(sortDirection)
                .build();

        Sort sort = Sort.by(
                "DESC".equalsIgnoreCase(sortDirection) ? Sort.Direction.DESC : Sort.Direction.ASC,
                sortBy
        );
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<ExpenseListDto> expensePage = expenseService.getExpenses(filterDto, pageable);

        Map<String, Object> responseBody = buildPageResponse(expensePage, "Expenses retrieved successfully");
        return ResponseEntity.ok(responseBody);
    }

    /**
     * Update expense (PENDING status only)
     * PUT /api/v1/expenses/{id}
     * AC #5: Edit PENDING expenses
     */
    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Update expense",
            description = "Update expense details (PENDING status only)"
    )
    public ResponseEntity<Map<String, Object>> updateExpense(
            @PathVariable UUID id,
            @RequestPart("expense") @Valid ExpenseUpdateDto dto,
            @RequestPart(value = "receipt", required = false) MultipartFile receiptFile,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        LOGGER.info("Updating expense: {} by user: {}", id, userDetails.getUsername());

        UUID userId = getUserIdFromUserDetails(userDetails);
        ExpenseResponseDto response = expenseService.updateExpense(id, dto, receiptFile, userId);

        Map<String, Object> responseBody = buildSuccessResponse(response, "Expense updated successfully");
        return ResponseEntity.ok(responseBody);
    }

    /**
     * Delete expense (PENDING status only)
     * DELETE /api/v1/expenses/{id}
     * AC #4: Soft delete
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Delete expense",
            description = "Soft delete expense (PENDING status only)"
    )
    public ResponseEntity<Map<String, Object>> deleteExpense(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        LOGGER.info("Deleting expense: {} by user: {}", id, userDetails.getUsername());

        UUID userId = getUserIdFromUserDetails(userDetails);
        expenseService.deleteExpense(id, userId);

        Map<String, Object> responseBody = buildSuccessResponse(null, "Expense deleted successfully");
        return ResponseEntity.ok(responseBody);
    }

    // =================================================================
    // PAYMENT OPERATIONS
    // =================================================================

    /**
     * Mark expense as paid
     * POST /api/v1/expenses/{id}/pay
     * AC #7: Mark expense as paid
     */
    @PostMapping("/{id}/pay")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Mark expense as paid",
            description = "Record payment for a pending expense"
    )
    public ResponseEntity<Map<String, Object>> markExpenseAsPaid(
            @PathVariable UUID id,
            @Valid @RequestBody ExpensePayDto dto,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        LOGGER.info("Marking expense as paid: {} by user: {}", id, userDetails.getUsername());

        UUID userId = getUserIdFromUserDetails(userDetails);
        ExpenseResponseDto response = expenseService.markExpenseAsPaid(id, dto, userId);

        Map<String, Object> responseBody = buildSuccessResponse(response, "Expense marked as paid");
        return ResponseEntity.ok(responseBody);
    }

    /**
     * Process batch payment for multiple expenses
     * POST /api/v1/expenses/batch-payment
     * AC #9: Batch payment processing
     */
    @PostMapping("/batch-payment")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Process batch payment",
            description = "Pay multiple expenses in a single batch"
    )
    public ResponseEntity<Map<String, Object>> processBatchPayment(
            @Valid @RequestBody BatchPaymentRequestDto dto,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        LOGGER.info("Processing batch payment for {} expenses by user: {}",
                dto.expenseIds().size(), userDetails.getUsername());

        UUID userId = getUserIdFromUserDetails(userDetails);
        BatchPaymentResponseDto response = expenseService.processBatchPayment(dto, userId);

        Map<String, Object> responseBody = buildSuccessResponse(response, "Batch payment processed");
        return ResponseEntity.ok(responseBody);
    }

    // =================================================================
    // VENDOR PENDING PAYMENTS
    // =================================================================

    /**
     * Get pending payments grouped by vendor
     * GET /api/v1/expenses/pending-by-vendor?vendorId=...
     * AC #8: Pending payments page with vendor accordion
     */
    @GetMapping("/pending-by-vendor")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Get pending payments by vendor",
            description = "Get pending expenses grouped by vendor for batch payment view"
    )
    public ResponseEntity<Map<String, Object>> getPendingPaymentsByVendor(
            @RequestParam(required = false) UUID vendorId
    ) {
        LOGGER.debug("Getting pending payments by vendor: {}", vendorId);

        List<VendorExpenseGroupDto> groups = expenseService.getPendingPaymentsByVendor(vendorId);

        Map<String, Object> responseBody = buildSuccessResponse(groups, "Pending payments retrieved successfully");
        return ResponseEntity.ok(responseBody);
    }

    // =================================================================
    // DASHBOARD AND ANALYTICS
    // =================================================================

    /**
     * Get expense summary for dashboard
     * GET /api/v1/expenses/summary?fromDate=...&toDate=...
     * AC #12: Category breakdown, monthly trend
     */
    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Get expense summary",
            description = "Get expense summary with category breakdown and trends"
    )
    public ResponseEntity<Map<String, Object>> getExpenseSummary(
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate
    ) {
        // Default to last 12 months if not specified
        if (toDate == null) {
            toDate = LocalDate.now();
        }
        if (fromDate == null) {
            fromDate = toDate.minusMonths(12);
        }

        LOGGER.debug("Getting expense summary from {} to {}", fromDate, toDate);

        ExpenseSummaryDto summary = expenseService.getExpenseSummary(fromDate, toDate);

        Map<String, Object> responseBody = buildSuccessResponse(summary, "Expense summary retrieved successfully");
        return ResponseEntity.ok(responseBody);
    }

    // =================================================================
    // RECEIPT OPERATIONS
    // =================================================================

    /**
     * Upload receipt for expense
     * POST /api/v1/expenses/{id}/receipt
     */
    @PostMapping(value = "/{id}/receipt", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Upload receipt",
            description = "Upload or replace receipt file for expense"
    )
    public ResponseEntity<Map<String, Object>> uploadReceipt(
            @PathVariable UUID id,
            @RequestPart("receipt") MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        LOGGER.info("Uploading receipt for expense: {} by user: {}", id, userDetails.getUsername());

        UUID userId = getUserIdFromUserDetails(userDetails);
        ExpenseResponseDto response = expenseService.uploadReceipt(id, file, userId);

        Map<String, Object> responseBody = buildSuccessResponse(response, "Receipt uploaded successfully");
        return ResponseEntity.ok(responseBody);
    }

    /**
     * Delete receipt from expense
     * DELETE /api/v1/expenses/{id}/receipt
     */
    @DeleteMapping("/{id}/receipt")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Delete receipt",
            description = "Delete receipt file from expense (PENDING status only)"
    )
    public ResponseEntity<Map<String, Object>> deleteReceipt(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        LOGGER.info("Deleting receipt for expense: {} by user: {}", id, userDetails.getUsername());

        UUID userId = getUserIdFromUserDetails(userDetails);
        ExpenseResponseDto response = expenseService.deleteReceipt(id, userId);

        Map<String, Object> responseBody = buildSuccessResponse(response, "Receipt deleted successfully");
        return ResponseEntity.ok(responseBody);
    }

    /**
     * Get download URL for receipt
     * GET /api/v1/expenses/{id}/receipt/download
     */
    @GetMapping("/{id}/receipt/download")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Get receipt download URL",
            description = "Get presigned URL for receipt download"
    )
    public ResponseEntity<Map<String, Object>> getReceiptDownloadUrl(@PathVariable UUID id) {
        LOGGER.debug("Getting receipt download URL for expense: {}", id);

        ExpenseResponseDto expense = expenseService.getExpenseById(id);
        if (expense.receiptFilePath() == null || expense.receiptFilePath().isEmpty()) {
            Map<String, Object> responseBody = buildSuccessResponse(null, "No receipt found");
            return ResponseEntity.ok(responseBody);
        }

        String downloadUrl = fileStorageService.getDownloadUrl(expense.receiptFilePath());

        Map<String, Object> data = new HashMap<>();
        data.put("downloadUrl", downloadUrl);
        data.put("fileName", expense.receiptFileName());

        Map<String, Object> responseBody = buildSuccessResponse(data, "Receipt download URL generated");
        return ResponseEntity.ok(responseBody);
    }

    // =================================================================
    // PDF GENERATION
    // =================================================================

    /**
     * Download payment summary PDF
     * POST /api/v1/expenses/payment-summary/pdf
     * AC #10: Payment summary PDF
     */
    @PostMapping(value = "/payment-summary/pdf", produces = "application/pdf")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Download payment summary PDF",
            description = "Generate and download payment summary PDF for selected expenses"
    )
    public ResponseEntity<byte[]> downloadPaymentSummaryPdf(
            @RequestBody List<UUID> expenseIds
    ) {
        LOGGER.info("Generating payment summary PDF for {} expenses", expenseIds.size());

        byte[] pdfContent = expenseService.generatePaymentSummaryPdf(expenseIds);

        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=expense-payment-summary.pdf")
                .header("Content-Type", "application/pdf")
                .body(pdfContent);
    }

    // =================================================================
    // REFERENCE DATA
    // =================================================================

    /**
     * Get available expense categories
     * GET /api/v1/expenses/categories
     */
    @GetMapping("/categories")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Get expense categories",
            description = "Get list of available expense categories"
    )
    public ResponseEntity<Map<String, Object>> getCategories() {
        List<Map<String, String>> categories = java.util.Arrays.stream(ExpenseCategory.values())
                .map(c -> Map.of(
                        "value", c.name(),
                        "label", c.getDisplayName()
                ))
                .toList();

        Map<String, Object> responseBody = buildSuccessResponse(categories, "Categories retrieved successfully");
        return ResponseEntity.ok(responseBody);
    }

    /**
     * Get available payment statuses
     * GET /api/v1/expenses/payment-statuses
     */
    @GetMapping("/payment-statuses")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Get payment statuses",
            description = "Get list of available payment statuses"
    )
    public ResponseEntity<Map<String, Object>> getPaymentStatuses() {
        List<Map<String, String>> statuses = java.util.Arrays.stream(ExpensePaymentStatus.values())
                .map(s -> Map.of(
                        "value", s.name(),
                        "label", s.getDisplayName()
                ))
                .toList();

        Map<String, Object> responseBody = buildSuccessResponse(statuses, "Payment statuses retrieved successfully");
        return ResponseEntity.ok(responseBody);
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
