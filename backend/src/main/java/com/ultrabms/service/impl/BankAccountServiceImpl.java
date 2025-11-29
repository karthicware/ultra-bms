package com.ultrabms.service.impl;

import com.ultrabms.dto.bankaccount.BankAccountDetailResponse;
import com.ultrabms.dto.bankaccount.BankAccountRequest;
import com.ultrabms.dto.bankaccount.BankAccountResponse;
import com.ultrabms.entity.BankAccount;
import com.ultrabms.entity.enums.BankAccountStatus;
import com.ultrabms.exception.EntityNotFoundException;
import com.ultrabms.exception.ValidationException;
import com.ultrabms.repository.BankAccountRepository;
import com.ultrabms.repository.PDCRepository;
import com.ultrabms.service.BankAccountService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Implementation of BankAccountService for managing bank accounts.
 *
 * Story 6.5: Bank Account Management
 * AC #14-19: CRUD operations for bank accounts
 * AC #9: IBAN uniqueness validation
 * AC #10: At least one active account must remain (delete validation)
 */
@Service
public class BankAccountServiceImpl implements BankAccountService {

    private static final Logger LOGGER = LoggerFactory.getLogger(BankAccountServiceImpl.class);

    private final BankAccountRepository bankAccountRepository;
    private final PDCRepository pdcRepository;

    public BankAccountServiceImpl(BankAccountRepository bankAccountRepository, PDCRepository pdcRepository) {
        this.bankAccountRepository = bankAccountRepository;
        this.pdcRepository = pdcRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<BankAccountResponse> findAll(String search) {
        LOGGER.debug("Finding all bank accounts with search: {}", search);

        List<BankAccount> accounts;
        if (StringUtils.hasText(search)) {
            accounts = bankAccountRepository.searchByBankNameOrAccountName(search.trim());
        } else {
            accounts = bankAccountRepository.findAllOrderByPrimaryAndBankName();
        }

        return accounts.stream()
                .map(BankAccountResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public BankAccountDetailResponse findById(UUID id) {
        LOGGER.debug("Finding bank account by ID: {}", id);

        BankAccount account = bankAccountRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Bank account not found with id: " + id));

        return BankAccountDetailResponse.fromEntity(account);
    }

    @Override
    @Transactional(readOnly = true)
    public BankAccountDetailResponse findByIdMasked(UUID id) {
        LOGGER.debug("Finding bank account by ID (masked): {}", id);

        BankAccount account = bankAccountRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Bank account not found with id: " + id));

        return BankAccountDetailResponse.fromEntityMasked(account);
    }

    @Override
    @Transactional
    public BankAccountResponse create(BankAccountRequest request, UUID userId) {
        LOGGER.debug("Creating bank account by user: {}", userId);

        // AC #9: Validate IBAN uniqueness
        String normalizedIban = normalizeIban(request.getIban());
        if (bankAccountRepository.existsByIban(normalizedIban)) {
            throw new ValidationException("IBAN already exists. Each bank account must have a unique IBAN.", "iban", request.getIban());
        }

        // Validate account number uniqueness
        if (bankAccountRepository.existsByAccountNumber(request.getAccountNumber())) {
            throw new ValidationException("Account number already exists.", "accountNumber", request.getAccountNumber());
        }

        BankAccount account = BankAccount.builder()
                .bankName(request.getBankName().trim())
                .accountName(request.getAccountName().trim())
                .accountNumber(request.getAccountNumber().trim())
                .iban(normalizedIban)
                .swiftCode(normalizeSwiftCode(request.getSwiftCode()))
                .isPrimary(request.getIsPrimary() != null && request.getIsPrimary())
                .status(request.getStatus() != null ? request.getStatus() : BankAccountStatus.ACTIVE)
                .createdBy(userId)
                .build();

        // Handle primary account logic
        if (Boolean.TRUE.equals(account.getIsPrimary())) {
            demoteCurrentPrimary();
        }

        BankAccount savedAccount = bankAccountRepository.save(account);
        LOGGER.info("Bank account created successfully: {} by user: {}", savedAccount.getId(), userId);

        return BankAccountResponse.fromEntity(savedAccount);
    }

    @Override
    @Transactional
    public BankAccountResponse update(UUID id, BankAccountRequest request) {
        LOGGER.debug("Updating bank account: {}", id);

        BankAccount account = bankAccountRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Bank account not found with id: " + id));

        // AC #9: Validate IBAN uniqueness (excluding current account)
        String normalizedIban = normalizeIban(request.getIban());
        if (bankAccountRepository.existsByIbanAndIdNot(normalizedIban, id)) {
            throw new ValidationException("IBAN already exists. Each bank account must have a unique IBAN.", "iban", request.getIban());
        }

        // Validate account number uniqueness (excluding current account)
        if (bankAccountRepository.existsByAccountNumberAndIdNot(request.getAccountNumber(), id)) {
            throw new ValidationException("Account number already exists.", "accountNumber", request.getAccountNumber());
        }

        // Update fields
        account.setBankName(request.getBankName().trim());
        account.setAccountName(request.getAccountName().trim());
        account.setAccountNumber(request.getAccountNumber().trim());
        account.setIban(normalizedIban);
        account.setSwiftCode(normalizeSwiftCode(request.getSwiftCode()));
        account.setStatus(request.getStatus());

        // Handle primary account change
        boolean wasPrimary = account.getIsPrimary();
        boolean wantsPrimary = request.getIsPrimary() != null && request.getIsPrimary();

        if (wantsPrimary && !wasPrimary) {
            // Becoming primary - demote current primary
            demoteCurrentPrimary();
            account.setIsPrimary(true);
        } else if (!wantsPrimary && wasPrimary) {
            // Demoting from primary
            account.setIsPrimary(false);
        }

        BankAccount savedAccount = bankAccountRepository.save(account);
        LOGGER.info("Bank account updated successfully: {}", id);

        return BankAccountResponse.fromEntity(savedAccount);
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        LOGGER.debug("Deleting bank account: {}", id);

        BankAccount account = bankAccountRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Bank account not found with id: " + id));

        // AC #5: Validate no active PDCs linked to this bank account
        long activePDCs = pdcRepository.countActivePDCsByBankAccount(id);
        if (activePDCs > 0) {
            throw new ValidationException("Cannot delete bank account. " + activePDCs +
                    " active PDC(s) are linked to this account. Please reassign or clear PDCs first.");
        }

        // AC #10: Validate at least one active account remains
        if (account.isActive()) {
            long remainingActiveAccounts = bankAccountRepository.countActiveAccountsExcluding(id);
            if (remainingActiveAccounts == 0) {
                throw new ValidationException("Cannot delete the only active bank account. " +
                        "At least one active bank account is required.");
            }
        }

        // Soft delete by setting status to INACTIVE
        account.deactivate();
        account.setIsPrimary(false); // Demote from primary if was primary
        bankAccountRepository.save(account);

        LOGGER.info("Bank account deactivated (soft deleted): {}", id);
    }

    @Override
    @Transactional
    public BankAccountResponse setPrimary(UUID id) {
        LOGGER.debug("Setting bank account as primary: {}", id);

        BankAccount account = bankAccountRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Bank account not found with id: " + id));

        // Validate account is active
        if (!account.isActive()) {
            throw new ValidationException("Cannot set inactive bank account as primary. " +
                    "Please activate the account first.");
        }

        // Already primary - no-op
        if (Boolean.TRUE.equals(account.getIsPrimary())) {
            LOGGER.debug("Bank account {} is already primary", id);
            return BankAccountResponse.fromEntity(account);
        }

        // Demote current primary
        demoteCurrentPrimary();

        // Set as primary
        account.setPrimaryAccount();
        BankAccount savedAccount = bankAccountRepository.save(account);

        LOGGER.info("Bank account set as primary: {}", id);
        return BankAccountResponse.fromEntity(savedAccount);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BankAccountResponse> findAllActiveForDropdown() {
        LOGGER.debug("Finding all active bank accounts for dropdown");

        return bankAccountRepository.findAllActiveForDropdown().stream()
                .map(BankAccountResponse::fromEntityForDropdown)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public BankAccountResponse getPrimaryAccount() {
        LOGGER.debug("Getting primary bank account");

        return bankAccountRepository.findPrimaryActiveAccount()
                .map(BankAccountResponse::fromEntity)
                .orElse(null);
    }

    // =================================================================
    // PRIVATE HELPER METHODS
    // =================================================================

    /**
     * Demote the current primary account to non-primary.
     */
    private void demoteCurrentPrimary() {
        Optional<BankAccount> currentPrimary = bankAccountRepository.findByIsPrimaryTrue();
        currentPrimary.ifPresent(primary -> {
            primary.demoteFromPrimary();
            bankAccountRepository.save(primary);
            LOGGER.debug("Demoted current primary account: {}", primary.getId());
        });
    }

    /**
     * Normalize IBAN to uppercase without spaces.
     */
    private String normalizeIban(String iban) {
        if (iban == null) return null;
        return iban.toUpperCase().replaceAll("\\s", "");
    }

    /**
     * Normalize SWIFT code to uppercase without spaces.
     */
    private String normalizeSwiftCode(String swiftCode) {
        if (swiftCode == null) return null;
        return swiftCode.toUpperCase().replaceAll("\\s", "");
    }
}
