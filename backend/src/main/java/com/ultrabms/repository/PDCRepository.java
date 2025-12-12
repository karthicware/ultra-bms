package com.ultrabms.repository;

import com.ultrabms.entity.PDC;
import com.ultrabms.entity.enums.PDCStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for PDC (Post-Dated Cheque) entity.
 * Provides CRUD operations and custom queries for PDC management.
 *
 * Story 6.3: Post-Dated Cheque (PDC) Management
 */
@Repository
public interface PDCRepository extends JpaRepository<PDC, UUID> {

    // =================================================================
    // FIND BY UNIQUE IDENTIFIERS
    // =================================================================

    /**
     * Find PDC by cheque number and tenant (unique constraint)
     *
     * @param chequeNumber Cheque number from physical cheque
     * @param tenantId     Tenant UUID
     * @return Optional PDC
     */
    Optional<PDC> findByChequeNumberAndTenantId(String chequeNumber, UUID tenantId);

    /**
     * Check if cheque number already exists for tenant
     *
     * @param chequeNumber Cheque number
     * @param tenantId     Tenant UUID
     * @return True if exists
     */
    boolean existsByChequeNumberAndTenantId(String chequeNumber, UUID tenantId);

    // =================================================================
    // FIND BY TENANT
    // =================================================================

    /**
     * Find PDCs by tenant with pagination
     *
     * @param tenantId Tenant UUID
     * @param pageable Pagination parameters
     * @return Page of PDCs
     */
    Page<PDC> findByTenantId(UUID tenantId, Pageable pageable);

    /**
     * Find PDCs by tenant and status
     *
     * @param tenantId Tenant UUID
     * @param status   PDC status
     * @param pageable Pagination parameters
     * @return Page of PDCs
     */
    Page<PDC> findByTenantIdAndStatus(UUID tenantId, PDCStatus status, Pageable pageable);

    /**
     * Find PDCs by tenant and status list
     *
     * @param tenantId Tenant UUID
     * @param statuses List of statuses
     * @return List of PDCs
     */
    List<PDC> findByTenantIdAndStatusIn(UUID tenantId, List<PDCStatus> statuses);

    /**
     * Count PDCs by tenant and status
     *
     * @param tenantId Tenant UUID
     * @param status   PDC status
     * @return Count
     */
    long countByTenantIdAndStatus(UUID tenantId, PDCStatus status);

    // =================================================================
    // FIND BY STATUS
    // =================================================================

    /**
     * Find PDCs by status with pagination
     *
     * @param status   PDC status
     * @param pageable Pagination parameters
     * @return Page of PDCs
     */
    Page<PDC> findByStatus(PDCStatus status, Pageable pageable);

    /**
     * Find PDCs by multiple statuses
     *
     * @param statuses List of statuses
     * @param pageable Pagination parameters
     * @return Page of PDCs
     */
    Page<PDC> findByStatusIn(List<PDCStatus> statuses, Pageable pageable);

    /**
     * Count PDCs by status
     *
     * @param status PDC status
     * @return Count
     */
    long countByStatus(PDCStatus status);

    // =================================================================
    // SCHEDULER QUERIES (RECEIVED -> DUE TRANSITION)
    // =================================================================

    /**
     * Find RECEIVED PDCs with cheque date within due window
     * Used by 6 AM scheduler job for auto-transition to DUE status
     *
     * @param today          Current date
     * @param dueWindowEnd   Date 7 days from today
     * @return List of PDCs to transition to DUE
     */
    @Query("SELECT p FROM PDC p WHERE p.status = 'RECEIVED' " +
           "AND p.chequeDate >= :today AND p.chequeDate <= :dueWindowEnd")
    List<PDC> findReceivedPDCsWithinDueWindow(
            @Param("today") LocalDate today,
            @Param("dueWindowEnd") LocalDate dueWindowEnd);

    /**
     * Find DUE PDCs for deposit reminder
     * Used by 9 AM scheduler job for reminder emails
     *
     * @param reminderDate Date to check
     * @return List of PDCs due on reminder date
     */
    @Query("SELECT p FROM PDC p WHERE p.status = 'DUE' AND p.chequeDate = :reminderDate")
    List<PDC> findDuePDCsForReminder(@Param("reminderDate") LocalDate reminderDate);

    // =================================================================
    // DASHBOARD QUERIES
    // =================================================================

    /**
     * Find upcoming PDCs due this week (status = DUE)
     *
     * @param today        Current date
     * @param weekEnd      End of week (7 days from today)
     * @param pageable     Pagination
     * @return Page of upcoming PDCs
     */
    @Query("SELECT p FROM PDC p WHERE p.status = 'DUE' " +
           "AND p.chequeDate BETWEEN :today AND :weekEnd " +
           "ORDER BY p.chequeDate ASC")
    Page<PDC> findUpcomingPDCsThisWeek(
            @Param("today") LocalDate today,
            @Param("weekEnd") LocalDate weekEnd,
            Pageable pageable);

    /**
     * Find recently deposited PDCs
     *
     * @param fromDate  Start of period
     * @param pageable  Pagination
     * @return Page of recently deposited PDCs
     */
    @Query("SELECT p FROM PDC p WHERE p.status = 'DEPOSITED' " +
           "AND p.depositDate >= :fromDate " +
           "ORDER BY p.depositDate DESC")
    Page<PDC> findRecentlyDepositedPDCs(
            @Param("fromDate") LocalDate fromDate,
            Pageable pageable);

    /**
     * Count PDCs due this week
     *
     * @param today    Current date
     * @param weekEnd  End of week
     * @return Count
     */
    @Query("SELECT COUNT(p) FROM PDC p WHERE p.status = 'DUE' " +
           "AND p.chequeDate BETWEEN :today AND :weekEnd")
    long countPDCsDueThisWeek(
            @Param("today") LocalDate today,
            @Param("weekEnd") LocalDate weekEnd);

    /**
     * Get total value of PDCs due this week
     *
     * @param today    Current date
     * @param weekEnd  End of week
     * @return Total value
     */
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM PDC p WHERE p.status = 'DUE' " +
           "AND p.chequeDate BETWEEN :today AND :weekEnd")
    BigDecimal getTotalValueDueThisWeek(
            @Param("today") LocalDate today,
            @Param("weekEnd") LocalDate weekEnd);

    /**
     * Count deposited PDCs within period
     *
     * @param fromDate Start date
     * @param toDate   End date
     * @return Count
     */
    @Query("SELECT COUNT(p) FROM PDC p WHERE p.status = 'DEPOSITED' " +
           "AND p.depositDate BETWEEN :fromDate AND :toDate")
    long countDepositedPDCsInPeriod(
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate);

    /**
     * Get total value of deposited PDCs within period
     *
     * @param fromDate Start date
     * @param toDate   End date
     * @return Total value
     */
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM PDC p WHERE p.status = 'DEPOSITED' " +
           "AND p.depositDate BETWEEN :fromDate AND :toDate")
    BigDecimal getTotalValueDepositedInPeriod(
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate);

    /**
     * Get total outstanding PDC value (RECEIVED + DUE + DEPOSITED)
     *
     * @return Total outstanding value
     */
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM PDC p " +
           "WHERE p.status IN ('RECEIVED', 'DUE', 'DEPOSITED')")
    BigDecimal getTotalOutstandingValue();

    /**
     * Count recently bounced PDCs (last 30 days)
     *
     * @param fromDate 30 days ago
     * @return Count
     */
    @Query("SELECT COUNT(p) FROM PDC p WHERE p.status = 'BOUNCED' " +
           "AND p.bouncedDate >= :fromDate")
    long countRecentlyBouncedPDCs(@Param("fromDate") LocalDate fromDate);

    // =================================================================
    // TENANT HISTORY QUERIES
    // =================================================================

    /**
     * Count total PDCs for tenant
     *
     * @param tenantId Tenant UUID
     * @return Count
     */
    long countByTenantId(UUID tenantId);

    /**
     * Count cleared PDCs for tenant
     *
     * @param tenantId Tenant UUID
     * @return Count
     */
    @Query("SELECT COUNT(p) FROM PDC p WHERE p.tenant.id = :tenantId AND p.status = 'CLEARED'")
    long countClearedPDCsByTenant(@Param("tenantId") UUID tenantId);

    /**
     * Count bounced PDCs for tenant
     *
     * @param tenantId Tenant UUID
     * @return Count
     */
    @Query("SELECT COUNT(p) FROM PDC p WHERE p.tenant.id = :tenantId AND p.status = 'BOUNCED'")
    long countBouncedPDCsByTenant(@Param("tenantId") UUID tenantId);

    /**
     * Count pending PDCs for tenant (RECEIVED + DUE + DEPOSITED)
     *
     * @param tenantId Tenant UUID
     * @return Count
     */
    @Query("SELECT COUNT(p) FROM PDC p WHERE p.tenant.id = :tenantId " +
           "AND p.status IN ('RECEIVED', 'DUE', 'DEPOSITED')")
    long countPendingPDCsByTenant(@Param("tenantId") UUID tenantId);

    /**
     * Calculate bounce rate for tenant (percentage)
     * Formula: (bounced / (cleared + bounced)) * 100
     * Returns 0 if no cleared or bounced PDCs
     *
     * @param tenantId Tenant UUID
     * @return Bounce rate as percentage
     */
    @Query(value = "SELECT CASE " +
           "WHEN (COUNT(*) FILTER(WHERE status IN ('CLEARED', 'BOUNCED'))) = 0 THEN 0.0 " +
           "ELSE (COUNT(*) FILTER(WHERE status = 'BOUNCED') * 100.0 / " +
           "COUNT(*) FILTER(WHERE status IN ('CLEARED', 'BOUNCED'))) " +
           "END FROM pdcs WHERE tenant_id = :tenantId", nativeQuery = true)
    Double calculateBounceRateByTenant(@Param("tenantId") UUID tenantId);

    // =================================================================
    // WITHDRAWAL HISTORY QUERIES
    // =================================================================

    /**
     * Find withdrawn PDCs with pagination
     *
     * @param pageable Pagination
     * @return Page of withdrawn PDCs
     */
    @Query("SELECT p FROM PDC p WHERE p.status = 'WITHDRAWN' ORDER BY p.withdrawalDate DESC")
    Page<PDC> findWithdrawnPDCs(Pageable pageable);

    /**
     * Find withdrawn PDCs within date range
     *
     * @param fromDate Start date
     * @param toDate   End date
     * @param pageable Pagination
     * @return Page of withdrawn PDCs
     */
    @Query("SELECT p FROM PDC p WHERE p.status = 'WITHDRAWN' " +
           "AND p.withdrawalDate BETWEEN :fromDate AND :toDate " +
           "ORDER BY p.withdrawalDate DESC")
    Page<PDC> findWithdrawnPDCsInPeriod(
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            Pageable pageable);

    /**
     * Find withdrawn PDCs by reason
     *
     * @param withdrawalReason Reason for withdrawal
     * @param pageable         Pagination
     * @return Page of withdrawn PDCs
     */
    @Query("SELECT p FROM PDC p WHERE p.status = 'WITHDRAWN' " +
           "AND p.withdrawalReason = :withdrawalReason " +
           "ORDER BY p.withdrawalDate DESC")
    Page<PDC> findWithdrawnPDCsByReason(
            @Param("withdrawalReason") String withdrawalReason,
            Pageable pageable);

    // =================================================================
    // SEARCH QUERIES
    // =================================================================

    /**
     * Search PDCs by cheque number or tenant name
     *
     * @param searchTerm Search term
     * @param pageable   Pagination
     * @return Page of matching PDCs
     */
    // SCP-2025-12-12: Updated to use fullName instead of firstName/lastName
    @Query("SELECT p FROM PDC p WHERE " +
           "LOWER(p.chequeNumber) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(p.tenant.fullName) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    Page<PDC> searchByKeyword(@Param("searchTerm") String searchTerm, Pageable pageable);

    /**
     * Advanced search with multiple filters
     *
     * @param searchTerm Search term (optional)
     * @param status     PDC status (optional)
     * @param tenantId   Tenant UUID (optional)
     * @param bankName   Bank name (optional)
     * @param fromDate   Start date (optional)
     * @param toDate     End date (optional)
     * @param pageable   Pagination
     * @return Page of matching PDCs
     */
    // SCP-2025-12-12: Updated to use fullName instead of firstName/lastName
    @Query("SELECT p FROM PDC p WHERE " +
           "(:searchTerm IS NULL OR :searchTerm = '' OR " +
           "LOWER(p.chequeNumber) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(p.tenant.fullName) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) AND " +
           "(:status IS NULL OR p.status = :status) AND " +
           "(:tenantId IS NULL OR p.tenant.id = :tenantId) AND " +
           "(:bankName IS NULL OR :bankName = '' OR LOWER(p.bankName) LIKE LOWER(CONCAT('%', :bankName, '%'))) AND " +
           "(:fromDate IS NULL OR p.chequeDate >= :fromDate) AND " +
           "(:toDate IS NULL OR p.chequeDate <= :toDate)")
    Page<PDC> searchWithFilters(
            @Param("searchTerm") String searchTerm,
            @Param("status") PDCStatus status,
            @Param("tenantId") UUID tenantId,
            @Param("bankName") String bankName,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            Pageable pageable);

    // =================================================================
    // INVOICE INTEGRATION
    // =================================================================

    /**
     * Find PDCs linked to an invoice
     *
     * @param invoiceId Invoice UUID
     * @return List of linked PDCs
     */
    List<PDC> findByInvoiceId(UUID invoiceId);

    /**
     * Find PDCs linked to a lease
     *
     * @param leaseId  Lease UUID
     * @param pageable Pagination
     * @return Page of PDCs
     */
    Page<PDC> findByLeaseId(UUID leaseId, Pageable pageable);

    // =================================================================
    // REPLACEMENT CHAIN QUERIES
    // =================================================================

    /**
     * Find replacement PDC for a bounced PDC
     *
     * @param originalPdcId Original PDC UUID
     * @return Optional replacement PDC
     */
    @Query("SELECT p FROM PDC p WHERE p.originalPdc.id = :originalPdcId")
    Optional<PDC> findReplacementPDC(@Param("originalPdcId") UUID originalPdcId);

    /**
     * Find the complete replacement chain for a PDC
     * Starting from the first PDC to the latest replacement
     *
     * @param pdcId Any PDC ID in the chain
     * @return List of PDCs in the chain (ordered by creation)
     */
    @Query("SELECT p FROM PDC p WHERE p.id = :pdcId " +
           "OR p.originalPdc.id = :pdcId " +
           "OR p.replacementPdc.id = :pdcId " +
           "ORDER BY p.createdAt ASC")
    List<PDC> findReplacementChain(@Param("pdcId") UUID pdcId);

    // =================================================================
    // BANK ACCOUNT QUERIES (Story 6.5)
    // =================================================================

    /**
     * Count active PDCs linked to a bank account.
     * Active statuses: RECEIVED, DUE, DEPOSITED
     * Used for bank account delete validation.
     *
     * @param bankAccountId Bank account UUID
     * @return Count of active PDCs
     */
    @Query("SELECT COUNT(p) FROM PDC p WHERE p.bankAccountId = :bankAccountId " +
           "AND p.status IN ('RECEIVED', 'DUE', 'DEPOSITED')")
    long countActivePDCsByBankAccount(@Param("bankAccountId") UUID bankAccountId);

    // =================================================================
    // BANK NAME QUERIES
    // =================================================================

    /**
     * Get distinct bank names for filter dropdown
     *
     * @return List of distinct bank names
     */
    @Query("SELECT DISTINCT p.bankName FROM PDC p ORDER BY p.bankName ASC")
    List<String> findDistinctBankNames();

    /**
     * Find PDCs by bank name
     *
     * @param bankName Bank name
     * @param pageable Pagination
     * @return Page of PDCs
     */
    Page<PDC> findByBankNameContainingIgnoreCase(String bankName, Pageable pageable);
}
