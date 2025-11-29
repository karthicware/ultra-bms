package com.ultrabms.service;

import com.ultrabms.dto.bankaccount.BankAccountDetailResponse;
import com.ultrabms.dto.bankaccount.BankAccountRequest;
import com.ultrabms.dto.bankaccount.BankAccountResponse;

import java.util.List;
import java.util.UUID;

/**
 * Service interface for bank account management.
 *
 * Story 6.5: Bank Account Management
 * AC #14-19: CRUD operations for bank accounts
 */
public interface BankAccountService {

    /**
     * Get all bank accounts, optionally filtered by search term.
     * AC #14: GET /api/v1/bank-accounts returns list with masked values
     *
     * @param search Optional search term to filter by bank name or account name
     * @return List of bank accounts with masked sensitive values
     */
    List<BankAccountResponse> findAll(String search);

    /**
     * Get a single bank account by ID.
     * AC #15: GET /api/v1/bank-accounts/{id} returns bank account details
     *
     * @param id The bank account UUID
     * @return Bank account details with full values for ADMIN/SUPER_ADMIN
     */
    BankAccountDetailResponse findById(UUID id);

    /**
     * Get a single bank account by ID with masked values only.
     * For FINANCE_MANAGER who should not see full account numbers.
     *
     * @param id The bank account UUID
     * @return Bank account details with masked sensitive values
     */
    BankAccountDetailResponse findByIdMasked(UUID id);

    /**
     * Create a new bank account.
     * AC #16: POST /api/v1/bank-accounts creates new bank account
     *
     * @param request The bank account data
     * @param userId The ID of the user creating the account
     * @return The created bank account with masked values
     */
    BankAccountResponse create(BankAccountRequest request, UUID userId);

    /**
     * Update an existing bank account.
     * AC #17: PUT /api/v1/bank-accounts/{id} updates bank account
     *
     * @param id The bank account UUID to update
     * @param request The updated bank account data
     * @return The updated bank account with masked values
     */
    BankAccountResponse update(UUID id, BankAccountRequest request);

    /**
     * Delete (deactivate) a bank account.
     * AC #18: DELETE /api/v1/bank-accounts/{id} soft deletes bank account
     * AC #5: Validation - cannot delete if linked to active PDCs
     * AC #10: Validation - at least one active account must remain
     *
     * @param id The bank account UUID to delete
     */
    void delete(UUID id);

    /**
     * Set a bank account as the primary account.
     * AC #19: PATCH /api/v1/bank-accounts/{id}/primary sets bank account as primary
     * AC #6: Only one account can be primary, previous primary is demoted
     *
     * @param id The bank account UUID to set as primary
     * @return The updated bank account with masked values
     */
    BankAccountResponse setPrimary(UUID id);

    /**
     * Get all active bank accounts for dropdown selection.
     * Used by PDC management for deposit destination selection.
     *
     * @return List of active bank accounts for dropdown
     */
    List<BankAccountResponse> findAllActiveForDropdown();

    /**
     * Get the primary bank account.
     *
     * @return The primary bank account if exists, null otherwise
     */
    BankAccountResponse getPrimaryAccount();
}
