package com.ultrabms.repository;

import com.ultrabms.entity.BankAccount;
import com.ultrabms.entity.enums.BankAccountStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for BankAccount entity.
 * Provides CRUD operations and custom queries for bank account management.
 *
 * Story 6.5: Bank Account Management
 */
@Repository
public interface BankAccountRepository extends JpaRepository<BankAccount, UUID> {

    // =================================================================
    // FIND BY UNIQUE IDENTIFIERS
    // =================================================================

    /**
     * Find bank account by IBAN (unique identifier)
     *
     * @param iban IBAN number
     * @return Optional bank account
     */
    Optional<BankAccount> findByIban(String iban);

    /**
     * Find bank account by account number
     *
     * @param accountNumber Account number
     * @return Optional bank account
     */
    Optional<BankAccount> findByAccountNumber(String accountNumber);

    // =================================================================
    // STATUS-BASED QUERIES
    // =================================================================

    /**
     * Find all bank accounts by status
     *
     * @param status Bank account status
     * @return List of bank accounts
     */
    List<BankAccount> findByStatus(BankAccountStatus status);

    /**
     * Find all active bank accounts
     *
     * @return List of active bank accounts
     */
    @Query("SELECT b FROM BankAccount b WHERE b.status = 'ACTIVE' ORDER BY b.isPrimary DESC, b.bankName ASC")
    List<BankAccount> findAllActive();

    /**
     * Find all bank accounts ordered by primary first, then bank name
     *
     * @return List of all bank accounts
     */
    @Query("SELECT b FROM BankAccount b ORDER BY b.isPrimary DESC, b.bankName ASC")
    List<BankAccount> findAllOrderByPrimaryAndBankName();

    // =================================================================
    // PRIMARY ACCOUNT QUERIES
    // =================================================================

    /**
     * Find the primary bank account
     *
     * @return Optional primary bank account
     */
    Optional<BankAccount> findByIsPrimaryTrue();

    /**
     * Find the primary active bank account
     *
     * @return Optional primary active bank account
     */
    @Query("SELECT b FROM BankAccount b WHERE b.isPrimary = true AND b.status = 'ACTIVE'")
    Optional<BankAccount> findPrimaryActiveAccount();

    // =================================================================
    // SEARCH QUERIES (AC #2, AC #14)
    // =================================================================

    /**
     * Search bank accounts by bank name or account name
     *
     * @param searchTerm Search term (case-insensitive)
     * @return List of matching bank accounts
     */
    @Query("SELECT b FROM BankAccount b WHERE " +
            "LOWER(b.bankName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(b.accountName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
            "ORDER BY b.isPrimary DESC, b.bankName ASC")
    List<BankAccount> searchByBankNameOrAccountName(@Param("searchTerm") String searchTerm);

    /**
     * Search active bank accounts by bank name or account name
     *
     * @param searchTerm Search term (case-insensitive)
     * @return List of matching active bank accounts
     */
    @Query("SELECT b FROM BankAccount b WHERE b.status = 'ACTIVE' AND (" +
            "LOWER(b.bankName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(b.accountName) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) " +
            "ORDER BY b.isPrimary DESC, b.bankName ASC")
    List<BankAccount> searchActiveByBankNameOrAccountName(@Param("searchTerm") String searchTerm);

    // =================================================================
    // EXISTENCE CHECKS (AC #9)
    // =================================================================

    /**
     * Check if IBAN already exists
     *
     * @param iban IBAN number
     * @return True if exists
     */
    boolean existsByIban(String iban);

    /**
     * Check if IBAN exists for another bank account (for update validation)
     *
     * @param iban IBAN number
     * @param id   Current bank account ID to exclude
     * @return True if exists for another account
     */
    @Query("SELECT CASE WHEN COUNT(b) > 0 THEN true ELSE false END FROM BankAccount b WHERE b.iban = :iban AND b.id != :id")
    boolean existsByIbanAndIdNot(@Param("iban") String iban, @Param("id") UUID id);

    /**
     * Check if account number already exists
     *
     * @param accountNumber Account number
     * @return True if exists
     */
    boolean existsByAccountNumber(String accountNumber);

    /**
     * Check if account number exists for another bank account (for update validation)
     *
     * @param accountNumber Account number
     * @param id            Current bank account ID to exclude
     * @return True if exists for another account
     */
    @Query("SELECT CASE WHEN COUNT(b) > 0 THEN true ELSE false END FROM BankAccount b WHERE b.accountNumber = :accountNumber AND b.id != :id")
    boolean existsByAccountNumberAndIdNot(@Param("accountNumber") String accountNumber, @Param("id") UUID id);

    // =================================================================
    // COUNT QUERIES (AC #10)
    // =================================================================

    /**
     * Count active bank accounts
     *
     * @return Count of active bank accounts
     */
    @Query("SELECT COUNT(b) FROM BankAccount b WHERE b.status = 'ACTIVE'")
    long countActiveAccounts();

    /**
     * Count active bank accounts excluding a specific account (for delete validation)
     *
     * @param id ID of account to exclude
     * @return Count of other active bank accounts
     */
    @Query("SELECT COUNT(b) FROM BankAccount b WHERE b.status = 'ACTIVE' AND b.id != :id")
    long countActiveAccountsExcluding(@Param("id") UUID id);

    // =================================================================
    // BANK NAME QUERIES (for dropdown population)
    // =================================================================

    /**
     * Get distinct bank names for dropdown
     *
     * @return List of distinct bank names
     */
    @Query("SELECT DISTINCT b.bankName FROM BankAccount b ORDER BY b.bankName ASC")
    List<String> findDistinctBankNames();

    /**
     * Get all active bank accounts for dropdown selection (PDC deposit destination)
     *
     * @return List of active bank accounts with masked display
     */
    @Query("SELECT b FROM BankAccount b WHERE b.status = 'ACTIVE' ORDER BY b.isPrimary DESC, b.bankName ASC")
    List<BankAccount> findAllActiveForDropdown();
}
