package com.ultrabms.repository;

import com.ultrabms.entity.Invoice;
import com.ultrabms.entity.enums.InvoiceStatus;
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
 * Repository interface for Invoice entity.
 * Provides CRUD operations and custom queries for invoice management.
 *
 * Story 6.1: Rent Invoicing and Payment Management
 */
@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, UUID> {

    // =================================================================
    // FIND BY UNIQUE IDENTIFIERS
    // =================================================================

    /**
     * Find invoice by unique invoice number
     *
     * @param invoiceNumber Invoice number (e.g., "INV-2025-0001")
     * @return Optional invoice
     */
    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);

    /**
     * Find the latest invoice number to generate next sequence
     * Used for auto-generating invoice numbers in format INV-{YEAR}-{SEQUENCE}
     *
     * @param prefix Invoice number prefix (e.g., "INV-2025-")
     * @return Optional latest invoice ordered by invoice number desc
     */
    @Query("SELECT i FROM Invoice i WHERE i.invoiceNumber LIKE CONCAT(:prefix, '%') ORDER BY i.invoiceNumber DESC LIMIT 1")
    Optional<Invoice> findTopByInvoiceNumberStartingWithOrderByInvoiceNumberDesc(@Param("prefix") String prefix);

    // =================================================================
    // FIND BY TENANT
    // =================================================================

    /**
     * Find invoices by tenant with pagination
     *
     * @param tenantId Tenant UUID
     * @param pageable Pagination parameters
     * @return Page of invoices
     */
    Page<Invoice> findByTenantId(UUID tenantId, Pageable pageable);

    /**
     * Find invoices by tenant and status
     *
     * @param tenantId Tenant UUID
     * @param status   Invoice status
     * @param pageable Pagination parameters
     * @return Page of invoices
     */
    Page<Invoice> findByTenantIdAndStatus(UUID tenantId, InvoiceStatus status, Pageable pageable);

    /**
     * Find outstanding invoices for tenant (SENT, PARTIALLY_PAID, or OVERDUE)
     *
     * @param tenantId Tenant UUID
     * @return List of outstanding invoices
     */
    @Query("SELECT i FROM Invoice i WHERE i.tenant.id = :tenantId AND i.status IN ('SENT', 'PARTIALLY_PAID', 'OVERDUE') ORDER BY i.dueDate ASC")
    List<Invoice> findOutstandingInvoicesByTenant(@Param("tenantId") UUID tenantId);

    // =================================================================
    // FIND BY PROPERTY
    // =================================================================

    /**
     * Find invoices by property with pagination
     *
     * @param propertyId Property UUID
     * @param pageable   Pagination parameters
     * @return Page of invoices
     */
    Page<Invoice> findByPropertyId(UUID propertyId, Pageable pageable);

    /**
     * Find invoices by property and status
     *
     * @param propertyId Property UUID
     * @param status     Invoice status
     * @param pageable   Pagination parameters
     * @return Page of invoices
     */
    Page<Invoice> findByPropertyIdAndStatus(UUID propertyId, InvoiceStatus status, Pageable pageable);

    // =================================================================
    // FIND BY STATUS
    // =================================================================

    /**
     * Find invoices by status with pagination
     *
     * @param status   Invoice status
     * @param pageable Pagination parameters
     * @return Page of invoices
     */
    Page<Invoice> findByStatus(InvoiceStatus status, Pageable pageable);

    /**
     * Find invoices by multiple statuses
     *
     * @param statuses List of statuses
     * @param pageable Pagination parameters
     * @return Page of invoices
     */
    Page<Invoice> findByStatusIn(List<InvoiceStatus> statuses, Pageable pageable);

    // =================================================================
    // OVERDUE QUERIES
    // =================================================================

    /**
     * Find invoices that are past due and need to be marked overdue
     * Finds SENT or PARTIALLY_PAID invoices where dueDate < today
     *
     * @param today    Current date
     * @param statuses Status list (SENT, PARTIALLY_PAID)
     * @return List of overdue invoices
     */
    @Query("SELECT i FROM Invoice i WHERE i.status IN :statuses AND i.dueDate < :today")
    List<Invoice> findOverdueInvoices(@Param("today") LocalDate today, @Param("statuses") List<InvoiceStatus> statuses);

    /**
     * Find overdue invoices where late fee hasn't been applied yet
     *
     * @param today Current date
     * @return List of invoices needing late fee
     */
    @Query("SELECT i FROM Invoice i WHERE i.status = 'OVERDUE' AND i.lateFeeApplied = false AND i.dueDate < :today")
    List<Invoice> findOverdueInvoicesWithoutLateFee(@Param("today") LocalDate today);

    /**
     * Find all OVERDUE status invoices
     *
     * @param pageable Pagination parameters
     * @return Page of overdue invoices
     */
    @Query("SELECT i FROM Invoice i WHERE i.status = 'OVERDUE' ORDER BY i.dueDate ASC")
    Page<Invoice> findOverdueInvoices(Pageable pageable);

    // =================================================================
    // SEARCH QUERIES
    // =================================================================

    /**
     * Search invoices by invoice number or tenant name (case-insensitive)
     *
     * @param searchTerm Search term
     * @param pageable   Pagination parameters
     * @return Page of matching invoices
     */
    @Query("SELECT i FROM Invoice i WHERE " +
            "LOWER(i.invoiceNumber) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(CONCAT(i.tenant.firstName, ' ', i.tenant.lastName)) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    Page<Invoice> searchByKeyword(@Param("searchTerm") String searchTerm, Pageable pageable);

    /**
     * Advanced search with multiple filters
     *
     * @param searchTerm Search term for invoice number or tenant name (optional)
     * @param status     Invoice status (optional)
     * @param propertyId Property UUID (optional)
     * @param tenantId   Tenant UUID (optional)
     * @param fromDate   Start date range (optional)
     * @param toDate     End date range (optional)
     * @param pageable   Pagination parameters
     * @return Page of matching invoices
     */
    @Query("SELECT i FROM Invoice i WHERE " +
            "(:searchTerm IS NULL OR :searchTerm = '' OR " +
            "LOWER(i.invoiceNumber) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(CONCAT(i.tenant.firstName, ' ', i.tenant.lastName)) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) AND " +
            "(:status IS NULL OR i.status = :status) AND " +
            "(:propertyId IS NULL OR i.property.id = :propertyId) AND " +
            "(:tenantId IS NULL OR i.tenant.id = :tenantId) AND " +
            "(:fromDate IS NULL OR i.invoiceDate >= :fromDate) AND " +
            "(:toDate IS NULL OR i.invoiceDate <= :toDate)")
    Page<Invoice> searchWithFilters(
            @Param("searchTerm") String searchTerm,
            @Param("status") InvoiceStatus status,
            @Param("propertyId") UUID propertyId,
            @Param("tenantId") UUID tenantId,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            Pageable pageable);

    // =================================================================
    // DATE RANGE QUERIES
    // =================================================================

    /**
     * Find invoices within date range
     *
     * @param fromDate Start date
     * @param toDate   End date
     * @param pageable Pagination parameters
     * @return Page of invoices
     */
    Page<Invoice> findByInvoiceDateBetween(LocalDate fromDate, LocalDate toDate, Pageable pageable);

    /**
     * Find invoices due within date range
     *
     * @param fromDate Start date
     * @param toDate   End date
     * @param pageable Pagination parameters
     * @return Page of invoices
     */
    Page<Invoice> findByDueDateBetween(LocalDate fromDate, LocalDate toDate, Pageable pageable);

    // =================================================================
    // ANALYTICS AND COUNTS
    // =================================================================

    /**
     * Count invoices by status
     *
     * @param status Invoice status
     * @return Count of invoices
     */
    long countByStatus(InvoiceStatus status);

    /**
     * Count invoices by tenant
     *
     * @param tenantId Tenant UUID
     * @return Count of invoices
     */
    long countByTenantId(UUID tenantId);

    /**
     * Count invoices by property
     *
     * @param propertyId Property UUID
     * @return Count of invoices
     */
    long countByPropertyId(UUID propertyId);

    /**
     * Get total outstanding amount for tenant
     *
     * @param tenantId Tenant UUID
     * @return Total balance amount
     */
    @Query("SELECT COALESCE(SUM(i.balanceAmount), 0) FROM Invoice i WHERE i.tenant.id = :tenantId AND i.status IN ('SENT', 'PARTIALLY_PAID', 'OVERDUE')")
    BigDecimal getTotalOutstandingByTenant(@Param("tenantId") UUID tenantId);

    /**
     * Get total outstanding amount for property
     *
     * @param propertyId Property UUID
     * @return Total balance amount
     */
    @Query("SELECT COALESCE(SUM(i.balanceAmount), 0) FROM Invoice i WHERE i.property.id = :propertyId AND i.status IN ('SENT', 'PARTIALLY_PAID', 'OVERDUE')")
    BigDecimal getTotalOutstandingByProperty(@Param("propertyId") UUID propertyId);

    /**
     * Get total invoiced amount within date range
     *
     * @param fromDate Start date
     * @param toDate   End date
     * @return Total amount
     */
    @Query("SELECT COALESCE(SUM(i.totalAmount), 0) FROM Invoice i WHERE i.invoiceDate BETWEEN :fromDate AND :toDate AND i.status != 'CANCELLED'")
    BigDecimal getTotalInvoicedInPeriod(@Param("fromDate") LocalDate fromDate, @Param("toDate") LocalDate toDate);

    /**
     * Get total collected amount within date range
     *
     * @param fromDate Start date
     * @param toDate   End date
     * @return Total collected amount
     */
    @Query("SELECT COALESCE(SUM(i.paidAmount), 0) FROM Invoice i WHERE i.invoiceDate BETWEEN :fromDate AND :toDate AND i.status != 'CANCELLED'")
    BigDecimal getTotalCollectedInPeriod(@Param("fromDate") LocalDate fromDate, @Param("toDate") LocalDate toDate);

    /**
     * Get total overdue amount
     *
     * @return Total overdue balance
     */
    @Query("SELECT COALESCE(SUM(i.balanceAmount), 0) FROM Invoice i WHERE i.status = 'OVERDUE'")
    BigDecimal getTotalOverdueAmount();

    /**
     * Count overdue invoices
     *
     * @return Count of overdue invoices
     */
    @Query("SELECT COUNT(i) FROM Invoice i WHERE i.status = 'OVERDUE'")
    long countOverdueInvoices();

    // =================================================================
    // INVOICE NUMBER GENERATION
    // =================================================================

    /**
     * Get next invoice number sequence value from database
     * Uses PostgreSQL sequence for atomic increment
     *
     * @return Next sequence value
     */
    @Query(value = "SELECT nextval('invoice_number_seq')", nativeQuery = true)
    Long getNextInvoiceNumberSequence();

    /**
     * Reset invoice number sequence for new year
     * Should be called at the beginning of each year
     *
     * @param newValue New starting value (typically 1)
     */
    @Query(value = "SELECT setval('invoice_number_seq', :newValue, false)", nativeQuery = true)
    void resetInvoiceNumberSequence(@Param("newValue") Long newValue);

    // =================================================================
    // EXISTENCE CHECKS
    // =================================================================

    /**
     * Check if invoice number already exists
     *
     * @param invoiceNumber Invoice number
     * @return True if exists
     */
    boolean existsByInvoiceNumber(String invoiceNumber);

    /**
     * Check if tenant has any outstanding invoices
     *
     * @param tenantId Tenant UUID
     * @return True if outstanding invoices exist
     */
    @Query("SELECT CASE WHEN COUNT(i) > 0 THEN true ELSE false END FROM Invoice i WHERE i.tenant.id = :tenantId AND i.status IN ('SENT', 'PARTIALLY_PAID', 'OVERDUE')")
    boolean hasOutstandingInvoices(@Param("tenantId") UUID tenantId);

    // =================================================================
    // SCHEDULED JOB QUERIES
    // =================================================================

    /**
     * Find invoices needing reminder emails (due in X days)
     *
     * @param reminderDate Date to check
     * @param statuses     Valid statuses (SENT, PARTIALLY_PAID)
     * @return List of invoices due on the reminder date
     */
    @Query("SELECT i FROM Invoice i WHERE i.dueDate = :reminderDate AND i.status IN :statuses")
    List<Invoice> findInvoicesForReminder(@Param("reminderDate") LocalDate reminderDate, @Param("statuses") List<InvoiceStatus> statuses);

    /**
     * Find tenants needing invoice generation for a specific due day
     * Used by scheduled invoice generation job
     *
     * @param today Current date
     * @return List of tenant IDs needing invoice generation
     */
    @Query(value = "SELECT DISTINCT t.id FROM tenants t " +
            "WHERE t.status = 'ACTIVE' AND t.payment_due_date = :dayOfMonth " +
            "AND NOT EXISTS (SELECT 1 FROM invoices i WHERE i.tenant_id = t.id AND " +
            "EXTRACT(MONTH FROM i.invoice_date) = :month AND EXTRACT(YEAR FROM i.invoice_date) = :year)",
            nativeQuery = true)
    List<UUID> findTenantsNeedingInvoice(@Param("dayOfMonth") int dayOfMonth, @Param("month") int month, @Param("year") int year);
}
