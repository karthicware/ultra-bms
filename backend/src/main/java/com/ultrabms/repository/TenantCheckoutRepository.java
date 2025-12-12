package com.ultrabms.repository;

import com.ultrabms.entity.TenantCheckout;
import com.ultrabms.entity.enums.CheckoutStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for TenantCheckout entity.
 * Provides CRUD operations and custom queries for checkout management.
 *
 * Story 3.7: Tenant Checkout and Deposit Refund Processing
 */
@Repository
public interface TenantCheckoutRepository extends JpaRepository<TenantCheckout, UUID> {

    /**
     * Find checkout by checkout number
     *
     * @param checkoutNumber Checkout number (e.g., CHK-2025-0001)
     * @return Optional checkout
     */
    Optional<TenantCheckout> findByCheckoutNumber(String checkoutNumber);

    /**
     * Find checkout by tenant ID
     *
     * @param tenantId Tenant UUID
     * @return Optional checkout (should only be one active per tenant)
     */
    Optional<TenantCheckout> findByTenantId(UUID tenantId);

    /**
     * Find all checkouts for a tenant (historical)
     *
     * @param tenantId Tenant UUID
     * @return List of checkouts ordered by created date DESC
     */
    List<TenantCheckout> findByTenantIdOrderByCreatedAtDesc(UUID tenantId);

    /**
     * Find checkouts by property
     *
     * @param propertyId Property UUID
     * @param pageable   Pagination
     * @return Page of checkouts
     */
    Page<TenantCheckout> findByPropertyId(UUID propertyId, Pageable pageable);

    /**
     * Find checkouts by status
     *
     * @param status   Checkout status
     * @param pageable Pagination
     * @return Page of checkouts
     */
    Page<TenantCheckout> findByStatus(CheckoutStatus status, Pageable pageable);

    /**
     * Find checkouts by multiple statuses
     *
     * @param statuses List of statuses
     * @param pageable Pagination
     * @return Page of checkouts
     */
    Page<TenantCheckout> findByStatusIn(List<CheckoutStatus> statuses, Pageable pageable);

    /**
     * Find checkouts by property and status
     *
     * @param propertyId Property UUID
     * @param status     Checkout status
     * @param pageable   Pagination
     * @return Page of checkouts
     */
    Page<TenantCheckout> findByPropertyIdAndStatus(UUID propertyId, CheckoutStatus status, Pageable pageable);

    /**
     * Check if tenant has active (non-completed) checkout
     *
     * @param tenantId Tenant UUID
     * @return True if active checkout exists
     */
    @Query("SELECT COUNT(c) > 0 FROM TenantCheckout c WHERE c.tenant.id = :tenantId AND c.status != 'COMPLETED'")
    boolean existsActiveCheckoutByTenantId(@Param("tenantId") UUID tenantId);

    /**
     * Find checkouts with move-out date in range
     *
     * @param startDate Start date
     * @param endDate   End date
     * @param pageable  Pagination
     * @return Page of checkouts
     */
    Page<TenantCheckout> findByExpectedMoveOutDateBetween(LocalDate startDate, LocalDate endDate, Pageable pageable);

    /**
     * Search checkouts by tenant name or checkout number
     *
     * @param searchTerm Search term
     * @param pageable   Pagination
     * @return Page of checkouts
     */
    // SCP-2025-12-12: Updated to use fullName instead of firstName/lastName
    @Query("SELECT c FROM TenantCheckout c " +
           "WHERE LOWER(c.checkoutNumber) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(c.tenant.fullName) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<TenantCheckout> searchByCheckoutNumberOrTenantName(@Param("search") String searchTerm, Pageable pageable);

    /**
     * Find checkouts with filters
     *
     * @param status     Checkout status (optional)
     * @param propertyId Property UUID (optional)
     * @param fromDate   Start date (optional)
     * @param toDate     End date (optional)
     * @param search     Search term (optional)
     * @param pageable   Pagination
     * @return Page of checkouts
     */
    // SCP-2025-12-12: Updated to use fullName instead of firstName/lastName
    @Query("SELECT c FROM TenantCheckout c " +
           "WHERE (:status IS NULL OR c.status = :status) " +
           "AND (:propertyId IS NULL OR c.property.id = :propertyId) " +
           "AND (:fromDate IS NULL OR c.expectedMoveOutDate >= :fromDate) " +
           "AND (:toDate IS NULL OR c.expectedMoveOutDate <= :toDate) " +
           "AND (:search IS NULL OR :search = '' " +
           "     OR LOWER(c.checkoutNumber) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "     OR LOWER(c.tenant.fullName) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<TenantCheckout> findWithFilters(
            @Param("status") CheckoutStatus status,
            @Param("propertyId") UUID propertyId,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            @Param("search") String search,
            Pageable pageable
    );

    /**
     * Count checkouts by status
     *
     * @param status Checkout status
     * @return Count of checkouts
     */
    long countByStatus(CheckoutStatus status);

    /**
     * Count all checkouts by each status
     *
     * @return List of status counts
     */
    @Query("SELECT c.status, COUNT(c) FROM TenantCheckout c GROUP BY c.status")
    List<Object[]> countByStatusGrouped();

    /**
     * Find checkouts pending inspection (past inspection date, not complete)
     *
     * @param date     Current date
     * @param pageable Pagination
     * @return Page of checkouts
     */
    @Query("SELECT c FROM TenantCheckout c " +
           "WHERE c.inspectionDate <= :date " +
           "AND c.status = 'INSPECTION_SCHEDULED'")
    Page<TenantCheckout> findPendingInspection(@Param("date") LocalDate date, Pageable pageable);

    /**
     * Find completed checkouts in date range (for reporting)
     *
     * @param startDate Start date
     * @param endDate   End date
     * @return List of completed checkouts
     */
    @Query("SELECT c FROM TenantCheckout c " +
           "WHERE c.status = 'COMPLETED' " +
           "AND c.completedAt >= :startDate AND c.completedAt < :endDate " +
           "ORDER BY c.completedAt DESC")
    List<TenantCheckout> findCompletedInDateRange(
            @Param("startDate") java.time.LocalDateTime startDate,
            @Param("endDate") java.time.LocalDateTime endDate
    );
}
