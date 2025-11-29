package com.ultrabms.repository;

import com.ultrabms.entity.Expense;
import com.ultrabms.entity.enums.ExpenseCategory;
import com.ultrabms.entity.enums.ExpensePaymentStatus;
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
 * Repository interface for Expense entity.
 * Provides CRUD operations and custom queries for expense management.
 *
 * Story 6.2: Expense Management and Vendor Payments
 * AC #22: ExpenseRepository with filter queries
 */
@Repository
public interface ExpenseRepository extends JpaRepository<Expense, UUID> {

    // =================================================================
    // FIND BY UNIQUE IDENTIFIERS
    // =================================================================

    /**
     * Find expense by unique expense number
     *
     * @param expenseNumber Expense number (e.g., "EXP-2025-0001")
     * @return Optional expense
     */
    Optional<Expense> findByExpenseNumberAndIsDeletedFalse(String expenseNumber);

    /**
     * Find expense by ID (non-deleted only)
     *
     * @param id Expense UUID
     * @return Optional expense
     */
    Optional<Expense> findByIdAndIsDeletedFalse(UUID id);

    /**
     * Find expense linked to work order (for duplicate check)
     *
     * @param workOrderId Work order UUID
     * @return Optional expense
     */
    Optional<Expense> findByWorkOrderIdAndIsDeletedFalse(UUID workOrderId);

    /**
     * Find the latest expense number to generate next sequence
     *
     * @param prefix Expense number prefix (e.g., "EXP-2025-")
     * @return Optional latest expense ordered by expense number desc
     */
    @Query("SELECT e FROM Expense e WHERE e.expenseNumber LIKE CONCAT(:prefix, '%') ORDER BY e.expenseNumber DESC LIMIT 1")
    Optional<Expense> findTopByExpenseNumberStartingWithOrderByExpenseNumberDesc(@Param("prefix") String prefix);

    // =================================================================
    // BASIC FILTERS (NON-DELETED ONLY)
    // =================================================================

    /**
     * Find expenses by category
     *
     * @param category Expense category
     * @param pageable Pagination parameters
     * @return Page of expenses
     */
    Page<Expense> findByCategoryAndIsDeletedFalse(ExpenseCategory category, Pageable pageable);

    /**
     * Find expenses by payment status
     *
     * @param paymentStatus Payment status
     * @param pageable      Pagination parameters
     * @return Page of expenses
     */
    Page<Expense> findByPaymentStatusAndIsDeletedFalse(ExpensePaymentStatus paymentStatus, Pageable pageable);

    /**
     * Find expenses by property
     *
     * @param propertyId Property UUID
     * @param pageable   Pagination parameters
     * @return Page of expenses
     */
    Page<Expense> findByPropertyIdAndIsDeletedFalse(UUID propertyId, Pageable pageable);

    /**
     * Find expenses by vendor
     *
     * @param vendorId Vendor UUID
     * @param pageable Pagination parameters
     * @return Page of expenses
     */
    Page<Expense> findByVendorIdAndIsDeletedFalse(UUID vendorId, Pageable pageable);

    /**
     * Find expenses by work order
     *
     * @param workOrderId Work order UUID
     * @param pageable    Pagination parameters
     * @return Page of expenses
     */
    Page<Expense> findByWorkOrderIdAndIsDeletedFalse(UUID workOrderId, Pageable pageable);

    /**
     * Find all non-deleted expenses with pagination
     *
     * @param pageable Pagination parameters
     * @return Page of expenses
     */
    Page<Expense> findByIsDeletedFalse(Pageable pageable);

    // =================================================================
    // VENDOR PAYMENT QUERIES
    // =================================================================

    /**
     * Find pending expenses for a vendor
     *
     * @param vendorId Vendor UUID
     * @return List of pending expenses
     */
    @Query("SELECT e FROM Expense e WHERE e.vendor.id = :vendorId AND e.paymentStatus = 'PENDING' AND e.isDeleted = false ORDER BY e.expenseDate ASC")
    List<Expense> findPendingExpensesByVendor(@Param("vendorId") UUID vendorId);

    /**
     * Find all pending expenses grouped for batch payment
     *
     * @return List of pending expenses ordered by vendor
     */
    @Query("SELECT e FROM Expense e WHERE e.paymentStatus = 'PENDING' AND e.isDeleted = false AND e.vendor IS NOT NULL ORDER BY e.vendor.companyName, e.expenseDate ASC")
    List<Expense> findAllPendingExpensesForBatchPayment();

    /**
     * Find pending expenses by vendor IDs
     *
     * @param vendorIds List of vendor UUIDs
     * @return List of pending expenses
     */
    @Query("SELECT e FROM Expense e WHERE e.vendor.id IN :vendorIds AND e.paymentStatus = 'PENDING' AND e.isDeleted = false ORDER BY e.vendor.companyName, e.expenseDate ASC")
    List<Expense> findPendingExpensesByVendors(@Param("vendorIds") List<UUID> vendorIds);

    /**
     * Get total pending amount for a vendor
     *
     * @param vendorId Vendor UUID
     * @return Total pending amount
     */
    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.vendor.id = :vendorId AND e.paymentStatus = 'PENDING' AND e.isDeleted = false")
    BigDecimal getTotalPendingAmountByVendor(@Param("vendorId") UUID vendorId);

    /**
     * Count pending expenses for a vendor
     *
     * @param vendorId Vendor UUID
     * @return Count of pending expenses
     */
    @Query("SELECT COUNT(e) FROM Expense e WHERE e.vendor.id = :vendorId AND e.paymentStatus = 'PENDING' AND e.isDeleted = false")
    long countPendingExpensesByVendor(@Param("vendorId") UUID vendorId);

    // =================================================================
    // SEARCH AND FILTER QUERIES
    // =================================================================

    /**
     * Search expenses with comprehensive filters
     *
     * @param searchTerm    Search term for expense number or description
     * @param category      Expense category (optional)
     * @param paymentStatus Payment status (optional)
     * @param propertyId    Property UUID (optional)
     * @param vendorId      Vendor UUID (optional)
     * @param workOrderId   Work order UUID (optional)
     * @param fromDate      Start date range (optional)
     * @param toDate        End date range (optional)
     * @param pageable      Pagination parameters
     * @return Page of matching expenses
     */
    @Query("SELECT e FROM Expense e WHERE e.isDeleted = false AND " +
            "(:searchTerm IS NULL OR :searchTerm = '' OR " +
            "LOWER(e.expenseNumber) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(e.description) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) AND " +
            "(:category IS NULL OR e.category = :category) AND " +
            "(:paymentStatus IS NULL OR e.paymentStatus = :paymentStatus) AND " +
            "(:propertyId IS NULL OR e.property.id = :propertyId) AND " +
            "(:vendorId IS NULL OR e.vendor.id = :vendorId) AND " +
            "(:workOrderId IS NULL OR e.workOrder.id = :workOrderId) AND " +
            "(:fromDate IS NULL OR e.expenseDate >= :fromDate) AND " +
            "(:toDate IS NULL OR e.expenseDate <= :toDate)")
    Page<Expense> searchWithFilters(
            @Param("searchTerm") String searchTerm,
            @Param("category") ExpenseCategory category,
            @Param("paymentStatus") ExpensePaymentStatus paymentStatus,
            @Param("propertyId") UUID propertyId,
            @Param("vendorId") UUID vendorId,
            @Param("workOrderId") UUID workOrderId,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            Pageable pageable);

    // =================================================================
    // DATE RANGE QUERIES
    // =================================================================

    /**
     * Find expenses within date range
     *
     * @param fromDate Start date
     * @param toDate   End date
     * @param pageable Pagination parameters
     * @return Page of expenses
     */
    Page<Expense> findByExpenseDateBetweenAndIsDeletedFalse(LocalDate fromDate, LocalDate toDate, Pageable pageable);

    // =================================================================
    // ANALYTICS AND COUNTS
    // =================================================================

    /**
     * Count expenses by category
     *
     * @param category Expense category
     * @return Count of expenses
     */
    @Query("SELECT COUNT(e) FROM Expense e WHERE e.category = :category AND e.isDeleted = false")
    long countByCategory(@Param("category") ExpenseCategory category);

    /**
     * Count expenses by payment status
     *
     * @param paymentStatus Payment status
     * @return Count of expenses
     */
    @Query("SELECT COUNT(e) FROM Expense e WHERE e.paymentStatus = :paymentStatus AND e.isDeleted = false")
    long countByPaymentStatus(@Param("paymentStatus") ExpensePaymentStatus paymentStatus);

    /**
     * Get total expenses amount by category for date range
     *
     * @param category Expense category
     * @param fromDate Start date
     * @param toDate   End date
     * @return Total amount
     */
    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.category = :category AND e.isDeleted = false AND e.expenseDate BETWEEN :fromDate AND :toDate")
    BigDecimal getTotalAmountByCategoryInPeriod(
            @Param("category") ExpenseCategory category,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate);

    /**
     * Get total expenses amount for date range
     *
     * @param fromDate Start date
     * @param toDate   End date
     * @return Total amount
     */
    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.isDeleted = false AND e.expenseDate BETWEEN :fromDate AND :toDate")
    BigDecimal getTotalAmountInPeriod(@Param("fromDate") LocalDate fromDate, @Param("toDate") LocalDate toDate);

    /**
     * Get total pending expenses amount
     *
     * @return Total pending amount
     */
    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.paymentStatus = 'PENDING' AND e.isDeleted = false")
    BigDecimal getTotalPendingAmount();

    /**
     * Get total paid expenses amount for date range
     *
     * @param fromDate Start date
     * @param toDate   End date
     * @return Total paid amount
     */
    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.paymentStatus = 'PAID' AND e.isDeleted = false AND e.paymentDate BETWEEN :fromDate AND :toDate")
    BigDecimal getTotalPaidAmountInPeriod(@Param("fromDate") LocalDate fromDate, @Param("toDate") LocalDate toDate);

    /**
     * Get category breakdown summary
     *
     * @param fromDate Start date
     * @param toDate   End date
     * @return List of Object arrays [category, amount, count]
     */
    @Query("SELECT e.category, COALESCE(SUM(e.amount), 0), COUNT(e) FROM Expense e WHERE e.isDeleted = false AND e.expenseDate BETWEEN :fromDate AND :toDate GROUP BY e.category ORDER BY SUM(e.amount) DESC")
    List<Object[]> getCategoryBreakdown(@Param("fromDate") LocalDate fromDate, @Param("toDate") LocalDate toDate);

    /**
     * Get monthly expense trend
     *
     * @param fromDate Start date
     * @param toDate   End date
     * @return List of Object arrays [year, month, totalAmount, paidAmount]
     */
    @Query(value = "SELECT EXTRACT(YEAR FROM e.expense_date) as year, " +
            "EXTRACT(MONTH FROM e.expense_date) as month, " +
            "COALESCE(SUM(e.amount), 0) as total_amount, " +
            "COALESCE(SUM(CASE WHEN e.payment_status = 'PAID' THEN e.amount ELSE 0 END), 0) as paid_amount " +
            "FROM expenses e WHERE e.is_deleted = false AND e.expense_date BETWEEN :fromDate AND :toDate " +
            "GROUP BY EXTRACT(YEAR FROM e.expense_date), EXTRACT(MONTH FROM e.expense_date) " +
            "ORDER BY year ASC, month ASC", nativeQuery = true)
    List<Object[]> getMonthlyTrend(@Param("fromDate") LocalDate fromDate, @Param("toDate") LocalDate toDate);

    // =================================================================
    // EXPENSE NUMBER GENERATION
    // =================================================================

    /**
     * Get next expense number sequence value from database
     *
     * @return Next sequence value
     */
    @Query(value = "SELECT nextval('expense_number_seq')", nativeQuery = true)
    Long getNextExpenseNumberSequence();

    /**
     * Reset expense number sequence for new year
     *
     * @param newValue New starting value
     */
    @Query(value = "SELECT setval('expense_number_seq', :newValue, false)", nativeQuery = true)
    void resetExpenseNumberSequence(@Param("newValue") Long newValue);

    // =================================================================
    // EXISTENCE CHECKS
    // =================================================================

    /**
     * Check if expense number already exists
     *
     * @param expenseNumber Expense number
     * @return True if exists
     */
    boolean existsByExpenseNumber(String expenseNumber);

    /**
     * Check if work order already has an expense (idempotency check)
     *
     * @param workOrderId Work order UUID
     * @return True if expense exists
     */
    @Query("SELECT CASE WHEN COUNT(e) > 0 THEN true ELSE false END FROM Expense e WHERE e.workOrder.id = :workOrderId AND e.isDeleted = false")
    boolean existsByWorkOrderId(@Param("workOrderId") UUID workOrderId);

    // =================================================================
    // BATCH OPERATIONS
    // =================================================================

    /**
     * Find expenses by IDs (for batch payment)
     *
     * @param ids List of expense UUIDs
     * @return List of expenses
     */
    @Query("SELECT e FROM Expense e WHERE e.id IN :ids AND e.isDeleted = false")
    List<Expense> findByIdIn(@Param("ids") List<UUID> ids);

    /**
     * Count pending expenses by IDs (validation for batch payment)
     *
     * @param ids List of expense UUIDs
     * @return Count of pending expenses
     */
    @Query("SELECT COUNT(e) FROM Expense e WHERE e.id IN :ids AND e.paymentStatus = 'PENDING' AND e.isDeleted = false")
    long countPendingByIdIn(@Param("ids") List<UUID> ids);

    // =================================================================
    // FINANCIAL REPORTING QUERIES (Story 6.4)
    // =================================================================

    /**
     * Get expense breakdown by category with optional property filter
     */
    @Query("SELECT e.category, COALESCE(SUM(e.amount), 0), COUNT(e) " +
            "FROM Expense e " +
            "WHERE e.isDeleted = false AND e.expenseDate BETWEEN :fromDate AND :toDate " +
            "AND (:propertyId IS NULL OR e.property.id = :propertyId) " +
            "GROUP BY e.category ORDER BY SUM(e.amount) DESC")
    List<Object[]> getCategoryBreakdownByProperty(
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            @Param("propertyId") UUID propertyId);

    /**
     * Get monthly expense trend with optional property filter
     */
    @Query(value = "SELECT EXTRACT(YEAR FROM e.expense_date) as year, " +
            "EXTRACT(MONTH FROM e.expense_date) as month, " +
            "COALESCE(SUM(e.amount), 0) as total_amount " +
            "FROM expenses e " +
            "WHERE e.is_deleted = false AND e.expense_date BETWEEN :fromDate AND :toDate " +
            "AND (:propertyId IS NULL OR e.property_id = :propertyId) " +
            "GROUP BY EXTRACT(YEAR FROM e.expense_date), EXTRACT(MONTH FROM e.expense_date) " +
            "ORDER BY year ASC, month ASC", nativeQuery = true)
    List<Object[]> getMonthlyExpenseTrend(
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            @Param("propertyId") UUID propertyId);

    /**
     * Get top vendors by payment amount
     * Returns: [vendorId, vendorName, totalPaid]
     */
    @Query("SELECT e.vendor.id, e.vendor.companyName, COALESCE(SUM(e.amount), 0) " +
            "FROM Expense e " +
            "WHERE e.isDeleted = false AND e.paymentStatus = 'PAID' " +
            "AND e.vendor IS NOT NULL " +
            "AND e.paymentDate BETWEEN :fromDate AND :toDate " +
            "AND (:propertyId IS NULL OR e.property.id = :propertyId) " +
            "GROUP BY e.vendor.id, e.vendor.companyName " +
            "ORDER BY SUM(e.amount) DESC " +
            "LIMIT 5")
    List<Object[]> getTopVendorsByPayment(
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            @Param("propertyId") UUID propertyId);

    /**
     * Get maintenance cost by property
     */
    @Query("SELECT e.property.id, e.property.name, COALESCE(SUM(e.amount), 0) " +
            "FROM Expense e " +
            "WHERE e.isDeleted = false AND e.category = 'MAINTENANCE' " +
            "AND e.expenseDate BETWEEN :fromDate AND :toDate " +
            "GROUP BY e.property.id, e.property.name " +
            "ORDER BY SUM(e.amount) DESC")
    List<Object[]> getMaintenanceCostByProperty(@Param("fromDate") LocalDate fromDate, @Param("toDate") LocalDate toDate);

    /**
     * Get total expense amount with optional property filter
     */
    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e " +
            "WHERE e.isDeleted = false AND e.expenseDate BETWEEN :fromDate AND :toDate " +
            "AND (:propertyId IS NULL OR e.property.id = :propertyId)")
    BigDecimal getTotalExpensesInPeriodByProperty(
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            @Param("propertyId") UUID propertyId);

    /**
     * Get total paid expense amount with optional property filter (for cash outflows)
     */
    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e " +
            "WHERE e.isDeleted = false AND e.paymentStatus = 'PAID' " +
            "AND e.paymentDate BETWEEN :fromDate AND :toDate " +
            "AND (:propertyId IS NULL OR e.property.id = :propertyId)")
    BigDecimal getTotalPaidExpensesInPeriodByProperty(
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            @Param("propertyId") UUID propertyId);

    /**
     * Get highest expense category
     * Returns: [category, totalAmount]
     */
    @Query("SELECT e.category, COALESCE(SUM(e.amount), 0) " +
            "FROM Expense e " +
            "WHERE e.isDeleted = false AND e.expenseDate BETWEEN :fromDate AND :toDate " +
            "AND (:propertyId IS NULL OR e.property.id = :propertyId) " +
            "GROUP BY e.category " +
            "ORDER BY SUM(e.amount) DESC " +
            "LIMIT 1")
    Object[] getHighestExpenseCategory(
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            @Param("propertyId") UUID propertyId);
}
