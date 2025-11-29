package com.ultrabms.controller;

import com.ultrabms.dto.bankaccount.BankAccountDetailResponse;
import com.ultrabms.dto.bankaccount.BankAccountRequest;
import com.ultrabms.dto.bankaccount.BankAccountResponse;
import com.ultrabms.service.BankAccountService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import com.ultrabms.security.CurrentUser;
import com.ultrabms.security.UserPrincipal;
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

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST Controller for bank account management.
 *
 * RBAC (AC #20):
 * - ADMIN/SUPER_ADMIN: Full CRUD access (can see unmasked account numbers)
 * - FINANCE_MANAGER: Read-only access (masked account numbers)
 * - Other roles: No access (403 Forbidden)
 *
 * Story 6.5: Bank Account Management
 * AC #14-19: REST API endpoints
 * AC #20: RBAC - Admin/Super Admin only for CRUD
 */
@RestController
@RequestMapping("/api/v1/bank-accounts")
@Tag(name = "Bank Accounts", description = "Company bank account management for PDC deposits and payments")
public class BankAccountController {

    private static final Logger LOGGER = LoggerFactory.getLogger(BankAccountController.class);

    private final BankAccountService bankAccountService;

    public BankAccountController(BankAccountService bankAccountService) {
        this.bankAccountService = bankAccountService;
    }

    /**
     * Get all bank accounts with optional search filter.
     * AC #14: GET /api/v1/bank-accounts returns list with masked values
     *
     * Access: ADMIN, SUPER_ADMIN, FINANCE_MANAGER
     *
     * @param search Optional search term to filter by bank name or account name
     * @return List of bank accounts with masked sensitive values
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'FINANCE_MANAGER')")
    @Operation(
        summary = "Get all bank accounts",
        description = "Retrieve all bank accounts with masked account numbers and IBANs. " +
                      "Supports optional search by bank name or account name."
    )
    public ResponseEntity<Map<String, Object>> getAllBankAccounts(
            @RequestParam(required = false) String search
    ) {
        LOGGER.debug("Getting all bank accounts with search: {}", search);

        List<BankAccountResponse> accounts = bankAccountService.findAll(search);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", accounts);
        response.put("count", accounts.size());
        response.put("timestamp", LocalDateTime.now());

        return ResponseEntity.ok(response);
    }

    /**
     * Get a single bank account by ID.
     * AC #15: GET /api/v1/bank-accounts/{id} returns bank account details
     *
     * Access: ADMIN, SUPER_ADMIN (full details), FINANCE_MANAGER (masked)
     *
     * @param id The bank account UUID
     * @param authentication Spring Security authentication object
     * @return Bank account details
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'FINANCE_MANAGER')")
    @Operation(
        summary = "Get bank account by ID",
        description = "Retrieve a single bank account. ADMIN/SUPER_ADMIN see full account numbers, " +
                      "FINANCE_MANAGER sees masked values."
    )
    public ResponseEntity<Map<String, Object>> getBankAccountById(
            @PathVariable UUID id,
            Authentication authentication
    ) {
        LOGGER.debug("Getting bank account by ID: {}", id);

        BankAccountDetailResponse account;

        // Check if user is ADMIN or SUPER_ADMIN for full details
        boolean isAdmin = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(auth -> auth.equals("ROLE_ADMIN") || auth.equals("ROLE_SUPER_ADMIN"));

        if (isAdmin) {
            account = bankAccountService.findById(id);
        } else {
            account = bankAccountService.findByIdMasked(id);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", account);
        response.put("timestamp", LocalDateTime.now());

        return ResponseEntity.ok(response);
    }

    /**
     * Create a new bank account.
     * AC #16: POST /api/v1/bank-accounts creates new bank account
     *
     * Access: ADMIN, SUPER_ADMIN only
     *
     * @param request The bank account data
     * @param authentication Spring Security authentication object
     * @return The created bank account
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(
        summary = "Create bank account",
        description = "Create a new bank account. Validates IBAN uniqueness and SWIFT format."
    )
    public ResponseEntity<Map<String, Object>> createBankAccount(
            @Valid @RequestBody BankAccountRequest request,
            @CurrentUser UserPrincipal currentUser
    ) {
        LOGGER.debug("Creating bank account by user: {}", currentUser.getId());

        UUID userId = currentUser.getId();
        BankAccountResponse account = bankAccountService.create(request, userId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", account);
        response.put("message", "Bank account created successfully");
        response.put("timestamp", LocalDateTime.now());

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Update an existing bank account.
     * AC #17: PUT /api/v1/bank-accounts/{id} updates bank account
     *
     * Access: ADMIN, SUPER_ADMIN only
     *
     * @param id The bank account UUID
     * @param request The updated bank account data
     * @return The updated bank account
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(
        summary = "Update bank account",
        description = "Update an existing bank account. Validates IBAN uniqueness (excluding current account)."
    )
    public ResponseEntity<Map<String, Object>> updateBankAccount(
            @PathVariable UUID id,
            @Valid @RequestBody BankAccountRequest request
    ) {
        LOGGER.debug("Updating bank account: {}", id);

        BankAccountResponse account = bankAccountService.update(id, request);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", account);
        response.put("message", "Bank account updated successfully");
        response.put("timestamp", LocalDateTime.now());

        return ResponseEntity.ok(response);
    }

    /**
     * Delete (deactivate) a bank account.
     * AC #18: DELETE /api/v1/bank-accounts/{id} soft deletes bank account
     *
     * Access: ADMIN, SUPER_ADMIN only
     *
     * Validation:
     * - Cannot delete if linked to active PDCs (AC #5)
     * - At least one active account must remain (AC #10)
     *
     * @param id The bank account UUID
     * @return 200 OK with success message
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(
        summary = "Delete bank account",
        description = "Soft delete (deactivate) a bank account. Fails if linked to active PDCs " +
                      "or if it's the only active account."
    )
    public ResponseEntity<Map<String, Object>> deleteBankAccount(@PathVariable UUID id) {
        LOGGER.debug("Deleting bank account: {}", id);

        bankAccountService.delete(id);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Bank account deleted successfully");
        response.put("timestamp", LocalDateTime.now());

        return ResponseEntity.ok(response);
    }

    /**
     * Set a bank account as the primary account.
     * AC #19: PATCH /api/v1/bank-accounts/{id}/primary sets bank account as primary
     *
     * Access: ADMIN, SUPER_ADMIN only
     *
     * Only one account can be primary at a time. Previous primary is demoted.
     *
     * @param id The bank account UUID
     * @return The updated bank account
     */
    @PatchMapping("/{id}/primary")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(
        summary = "Set bank account as primary",
        description = "Set a bank account as the primary account. The previous primary account " +
                      "will be demoted. Only active accounts can be set as primary."
    )
    public ResponseEntity<Map<String, Object>> setPrimaryAccount(@PathVariable UUID id) {
        LOGGER.debug("Setting bank account as primary: {}", id);

        BankAccountResponse account = bankAccountService.setPrimary(id);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", account);
        response.put("message", "Bank account set as primary");
        response.put("timestamp", LocalDateTime.now());

        return ResponseEntity.ok(response);
    }

    /**
     * Get all active bank accounts for dropdown selection.
     * Used by PDC management for deposit destination selection.
     *
     * Access: ADMIN, SUPER_ADMIN, FINANCE_MANAGER
     *
     * @return List of active bank accounts for dropdown
     */
    @GetMapping("/dropdown")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'FINANCE_MANAGER')")
    @Operation(
        summary = "Get bank accounts for dropdown",
        description = "Get all active bank accounts formatted for dropdown selection. " +
                      "Returns masked account numbers suitable for display."
    )
    public ResponseEntity<Map<String, Object>> getBankAccountsForDropdown() {
        LOGGER.debug("Getting bank accounts for dropdown");

        List<BankAccountResponse> accounts = bankAccountService.findAllActiveForDropdown();

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", accounts);
        response.put("count", accounts.size());
        response.put("timestamp", LocalDateTime.now());

        return ResponseEntity.ok(response);
    }

    /**
     * Get the primary bank account.
     *
     * Access: ADMIN, SUPER_ADMIN, FINANCE_MANAGER
     *
     * @return The primary bank account if exists
     */
    @GetMapping("/primary")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'FINANCE_MANAGER')")
    @Operation(
        summary = "Get primary bank account",
        description = "Get the bank account marked as primary. Returns null if no primary is set."
    )
    public ResponseEntity<Map<String, Object>> getPrimaryAccount() {
        LOGGER.debug("Getting primary bank account");

        BankAccountResponse account = bankAccountService.getPrimaryAccount();

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", account);
        response.put("timestamp", LocalDateTime.now());

        return ResponseEntity.ok(response);
    }
}
