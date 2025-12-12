package com.ultrabms.repository;

import com.ultrabms.entity.Payment;
import com.ultrabms.entity.enums.PaymentMethod;
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
 * Repository interface for Payment entity.
 * Provides CRUD operations and custom queries for payment management.
 *
 * Story 6.1: Rent Invoicing and Payment Management
 */
@Repository
public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    // =================================================================
    // FIND BY UNIQUE IDENTIFIERS
    // =================================================================

    /**
     * Find payment by unique payment number
     *
     * @param paymentNumber Payment number (e.g., "PMT-2025-0001")
     * @return Optional payment
     */
    Optional<Payment> findByPaymentNumber(String paymentNumber);

    /**
     * Find the latest payment number to generate next sequence
     * Used for auto-generating payment numbers in format PMT-{YEAR}-{SEQUENCE}
     *
     * @param prefix Payment number prefix (e.g., "PMT-2025-")
     * @return Optional latest payment ordered by payment number desc
     */
    @Query("SELECT p FROM Payment p WHERE p.paymentNumber LIKE CONCAT(:prefix, '%') ORDER BY p.paymentNumber DESC LIMIT 1")
    Optional<Payment> findTopByPaymentNumberStartingWithOrderByPaymentNumberDesc(@Param("prefix") String prefix);

    // =================================================================
    // FIND BY INVOICE
    // =================================================================

    /**
     * Find payments by invoice with pagination
     *
     * @param invoiceId Invoice UUID
     * @param pageable  Pagination parameters
     * @return Page of payments
     */
    Page<Payment> findByInvoiceId(UUID invoiceId, Pageable pageable);

    /**
     * Find all payments for an invoice (no pagination)
     *
     * @param invoiceId Invoice UUID
     * @return List of payments ordered by payment date desc
     */
    List<Payment> findByInvoiceIdOrderByPaymentDateDesc(UUID invoiceId);

    /**
     * Get total amount paid for an invoice
     *
     * @param invoiceId Invoice UUID
     * @return Total paid amount
     */
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.invoice.id = :invoiceId")
    BigDecimal getTotalPaidForInvoice(@Param("invoiceId") UUID invoiceId);

    // =================================================================
    // FIND BY TENANT
    // =================================================================

    /**
     * Find payments by tenant with pagination
     *
     * @param tenantId Tenant UUID
     * @param pageable Pagination parameters
     * @return Page of payments
     */
    Page<Payment> findByTenantId(UUID tenantId, Pageable pageable);

    /**
     * Find payments by tenant within date range
     *
     * @param tenantId Tenant UUID
     * @param fromDate Start date
     * @param toDate   End date
     * @param pageable Pagination parameters
     * @return Page of payments
     */
    Page<Payment> findByTenantIdAndPaymentDateBetween(UUID tenantId, LocalDate fromDate, LocalDate toDate, Pageable pageable);

    /**
     * Get total amount paid by tenant
     *
     * @param tenantId Tenant UUID
     * @return Total paid amount
     */
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.tenant.id = :tenantId")
    BigDecimal getTotalPaidByTenant(@Param("tenantId") UUID tenantId);

    /**
     * Get total amount paid by tenant within date range
     *
     * @param tenantId Tenant UUID
     * @param fromDate Start date
     * @param toDate   End date
     * @return Total paid amount
     */
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.tenant.id = :tenantId AND p.paymentDate BETWEEN :fromDate AND :toDate")
    BigDecimal getTotalPaidByTenantInPeriod(@Param("tenantId") UUID tenantId, @Param("fromDate") LocalDate fromDate, @Param("toDate") LocalDate toDate);

    // =================================================================
    // FIND BY PAYMENT METHOD
    // =================================================================

    /**
     * Find payments by payment method with pagination
     *
     * @param paymentMethod Payment method
     * @param pageable      Pagination parameters
     * @return Page of payments
     */
    Page<Payment> findByPaymentMethod(PaymentMethod paymentMethod, Pageable pageable);

    /**
     * Find payments by payment method within date range
     *
     * @param paymentMethod Payment method
     * @param fromDate      Start date
     * @param toDate        End date
     * @param pageable      Pagination parameters
     * @return Page of payments
     */
    Page<Payment> findByPaymentMethodAndPaymentDateBetween(PaymentMethod paymentMethod, LocalDate fromDate, LocalDate toDate, Pageable pageable);

    // =================================================================
    // DATE RANGE QUERIES
    // =================================================================

    /**
     * Find payments within date range
     *
     * @param fromDate Start date
     * @param toDate   End date
     * @param pageable Pagination parameters
     * @return Page of payments
     */
    Page<Payment> findByPaymentDateBetween(LocalDate fromDate, LocalDate toDate, Pageable pageable);

    /**
     * Find payments for a specific date
     *
     * @param paymentDate Payment date
     * @param pageable    Pagination parameters
     * @return Page of payments
     */
    Page<Payment> findByPaymentDate(LocalDate paymentDate, Pageable pageable);

    // =================================================================
    // SEARCH QUERIES
    // =================================================================

    /**
     * Search payments by payment number, invoice number, or tenant name
     *
     * @param searchTerm Search term
     * @param pageable   Pagination parameters
     * @return Page of matching payments
     */
    // SCP-2025-12-12: Updated to use fullName instead of firstName/lastName
    @Query("SELECT p FROM Payment p WHERE " +
            "LOWER(p.paymentNumber) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(p.invoice.invoiceNumber) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(p.tenant.fullName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(p.transactionReference) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    Page<Payment> searchByKeyword(@Param("searchTerm") String searchTerm, Pageable pageable);

    /**
     * Advanced search with multiple filters
     *
     * @param invoiceId     Invoice UUID (optional)
     * @param tenantId      Tenant UUID (optional)
     * @param paymentMethod Payment method (optional)
     * @param fromDate      Start date (optional)
     * @param toDate        End date (optional)
     * @param pageable      Pagination parameters
     * @return Page of matching payments
     */
    @Query("SELECT p FROM Payment p WHERE " +
            "(:invoiceId IS NULL OR p.invoice.id = :invoiceId) AND " +
            "(:tenantId IS NULL OR p.tenant.id = :tenantId) AND " +
            "(:paymentMethod IS NULL OR p.paymentMethod = :paymentMethod) AND " +
            "(:fromDate IS NULL OR p.paymentDate >= :fromDate) AND " +
            "(:toDate IS NULL OR p.paymentDate <= :toDate)")
    Page<Payment> searchWithFilters(
            @Param("invoiceId") UUID invoiceId,
            @Param("tenantId") UUID tenantId,
            @Param("paymentMethod") PaymentMethod paymentMethod,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            Pageable pageable);

    // =================================================================
    // ANALYTICS AND COUNTS
    // =================================================================

    /**
     * Count payments by payment method
     *
     * @param paymentMethod Payment method
     * @return Count of payments
     */
    long countByPaymentMethod(PaymentMethod paymentMethod);

    /**
     * Count payments by invoice
     *
     * @param invoiceId Invoice UUID
     * @return Count of payments
     */
    long countByInvoiceId(UUID invoiceId);

    /**
     * Count payments by tenant
     *
     * @param tenantId Tenant UUID
     * @return Count of payments
     */
    long countByTenantId(UUID tenantId);

    /**
     * Get total amount collected within date range
     *
     * @param fromDate Start date
     * @param toDate   End date
     * @return Total collected amount
     */
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.paymentDate BETWEEN :fromDate AND :toDate")
    BigDecimal getTotalCollectedInPeriod(@Param("fromDate") LocalDate fromDate, @Param("toDate") LocalDate toDate);

    /**
     * Get total amount collected by payment method within date range
     *
     * @param paymentMethod Payment method
     * @param fromDate      Start date
     * @param toDate        End date
     * @return Total collected amount
     */
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.paymentMethod = :paymentMethod AND p.paymentDate BETWEEN :fromDate AND :toDate")
    BigDecimal getTotalCollectedByMethodInPeriod(@Param("paymentMethod") PaymentMethod paymentMethod, @Param("fromDate") LocalDate fromDate, @Param("toDate") LocalDate toDate);

    /**
     * Get payment summary by method for date range
     *
     * @param fromDate Start date
     * @param toDate   End date
     * @return List of [PaymentMethod, count, total] arrays
     */
    @Query("SELECT p.paymentMethod, COUNT(p), SUM(p.amount) FROM Payment p WHERE p.paymentDate BETWEEN :fromDate AND :toDate GROUP BY p.paymentMethod")
    List<Object[]> getPaymentSummaryByMethod(@Param("fromDate") LocalDate fromDate, @Param("toDate") LocalDate toDate);

    // =================================================================
    // PAYMENT NUMBER GENERATION
    // =================================================================

    /**
     * Get next payment number sequence value from database
     * Uses PostgreSQL sequence for atomic increment
     *
     * @return Next sequence value
     */
    @Query(value = "SELECT nextval('payment_number_seq')", nativeQuery = true)
    Long getNextPaymentNumberSequence();

    /**
     * Reset payment number sequence for new year
     * Should be called at the beginning of each year
     *
     * @param newValue New starting value (typically 1)
     */
    @Query(value = "SELECT setval('payment_number_seq', :newValue, false)", nativeQuery = true)
    void resetPaymentNumberSequence(@Param("newValue") Long newValue);

    // =================================================================
    // EXISTENCE CHECKS
    // =================================================================

    /**
     * Check if payment number already exists
     *
     * @param paymentNumber Payment number
     * @return True if exists
     */
    boolean existsByPaymentNumber(String paymentNumber);

    /**
     * Check if invoice has any payments
     *
     * @param invoiceId Invoice UUID
     * @return True if payments exist
     */
    boolean existsByInvoiceId(UUID invoiceId);

    // =================================================================
    // RECENT PAYMENTS
    // =================================================================

    /**
     * Get recent payments for dashboard display
     *
     * @param pageable Pagination with limit
     * @return List of recent payments
     */
    @Query("SELECT p FROM Payment p ORDER BY p.createdAt DESC")
    List<Payment> findRecentPayments(Pageable pageable);

    /**
     * Get recent payments for a property
     *
     * @param propertyId Property UUID
     * @param pageable   Pagination with limit
     * @return List of recent payments
     */
    @Query("SELECT p FROM Payment p WHERE p.invoice.property.id = :propertyId ORDER BY p.createdAt DESC")
    List<Payment> findRecentPaymentsByProperty(@Param("propertyId") UUID propertyId, Pageable pageable);

    // =================================================================
    // FINANCIAL REPORTING QUERIES (Story 6.4)
    // =================================================================

    /**
     * Get total cash inflows (payments) with optional property filter
     * Used for cash flow report
     */
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p " +
            "WHERE p.paymentDate BETWEEN :fromDate AND :toDate " +
            "AND (:propertyId IS NULL OR p.invoice.property.id = :propertyId)")
    BigDecimal getTotalCashInflowsInPeriodByProperty(
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            @Param("propertyId") UUID propertyId);

    /**
     * Get monthly cash inflows
     * Returns: [year, month, totalAmount]
     */
    @Query(value = "SELECT EXTRACT(YEAR FROM p.payment_date) as year, " +
            "EXTRACT(MONTH FROM p.payment_date) as month, " +
            "COALESCE(SUM(p.amount), 0) as total_amount " +
            "FROM payments p " +
            "JOIN invoices i ON p.invoice_id = i.id " +
            "WHERE p.payment_date BETWEEN :fromDate AND :toDate " +
            "AND (:propertyId IS NULL OR i.property_id = :propertyId) " +
            "GROUP BY EXTRACT(YEAR FROM p.payment_date), EXTRACT(MONTH FROM p.payment_date) " +
            "ORDER BY year ASC, month ASC", nativeQuery = true)
    List<Object[]> getMonthlyCashInflows(
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            @Param("propertyId") UUID propertyId);
}
