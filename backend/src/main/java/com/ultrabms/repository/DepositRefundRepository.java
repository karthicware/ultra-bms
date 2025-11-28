package com.ultrabms.repository;

import com.ultrabms.entity.DepositRefund;
import com.ultrabms.entity.enums.RefundStatus;
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
 * Repository interface for DepositRefund entity.
 * Provides CRUD operations and custom queries for deposit refund management.
 *
 * Story 3.7: Tenant Checkout and Deposit Refund Processing
 */
@Repository
public interface DepositRefundRepository extends JpaRepository<DepositRefund, UUID> {

    /**
     * Find deposit refund by checkout ID
     *
     * @param checkoutId Checkout UUID
     * @return Optional deposit refund
     */
    Optional<DepositRefund> findByCheckoutId(UUID checkoutId);

    /**
     * Find deposit refund by refund reference
     *
     * @param refundReference Refund reference (e.g., REF-2025-0001)
     * @return Optional deposit refund
     */
    Optional<DepositRefund> findByRefundReference(String refundReference);

    /**
     * Find refunds by status
     *
     * @param status   Refund status
     * @param pageable Pagination
     * @return Page of deposit refunds
     */
    Page<DepositRefund> findByRefundStatus(RefundStatus status, Pageable pageable);

    /**
     * Find refunds by multiple statuses
     *
     * @param statuses List of statuses
     * @param pageable Pagination
     * @return Page of deposit refunds
     */
    Page<DepositRefund> findByRefundStatusIn(List<RefundStatus> statuses, Pageable pageable);

    /**
     * Find refunds requiring approval (PENDING_APPROVAL status)
     *
     * @param pageable Pagination
     * @return Page of deposit refunds
     */
    @Query("SELECT d FROM DepositRefund d WHERE d.refundStatus = 'PENDING_APPROVAL' ORDER BY d.createdAt ASC")
    Page<DepositRefund> findPendingApproval(Pageable pageable);

    /**
     * Find refunds requiring approval with amount > threshold
     *
     * @param threshold Amount threshold
     * @param pageable  Pagination
     * @return Page of deposit refunds
     */
    @Query("SELECT d FROM DepositRefund d WHERE d.netRefund > :threshold AND d.refundStatus = 'PENDING_APPROVAL'")
    Page<DepositRefund> findPendingApprovalAboveThreshold(@Param("threshold") BigDecimal threshold, Pageable pageable);

    /**
     * Find refunds by refund date range
     *
     * @param startDate Start date
     * @param endDate   End date
     * @param pageable  Pagination
     * @return Page of deposit refunds
     */
    Page<DepositRefund> findByRefundDateBetween(LocalDate startDate, LocalDate endDate, Pageable pageable);

    /**
     * Count refunds by status
     *
     * @param status Refund status
     * @return Count of refunds
     */
    long countByRefundStatus(RefundStatus status);

    /**
     * Count all refunds by each status
     *
     * @return List of status counts
     */
    @Query("SELECT d.refundStatus, COUNT(d) FROM DepositRefund d GROUP BY d.refundStatus")
    List<Object[]> countByStatusGrouped();

    /**
     * Sum of refunds by status
     *
     * @param status Refund status
     * @return Sum of net refund amounts
     */
    @Query("SELECT COALESCE(SUM(d.netRefund), 0) FROM DepositRefund d WHERE d.refundStatus = :status")
    BigDecimal sumNetRefundByStatus(@Param("status") RefundStatus status);

    /**
     * Sum of completed refunds in date range
     *
     * @param startDate Start date
     * @param endDate   End date
     * @return Sum of completed refund amounts
     */
    @Query("SELECT COALESCE(SUM(d.netRefund), 0) FROM DepositRefund d " +
           "WHERE d.refundStatus = 'COMPLETED' " +
           "AND d.processedAt >= :startDate AND d.processedAt < :endDate")
    BigDecimal sumCompletedRefundsInDateRange(
            @Param("startDate") java.time.LocalDateTime startDate,
            @Param("endDate") java.time.LocalDateTime endDate
    );

    /**
     * Find refunds pending for more than specified days
     *
     * @param date     Date to compare against
     * @param statuses List of pending statuses
     * @return List of overdue refunds
     */
    @Query("SELECT d FROM DepositRefund d " +
           "WHERE d.refundStatus IN :statuses " +
           "AND d.createdAt < :date " +
           "ORDER BY d.createdAt ASC")
    List<DepositRefund> findOverdueRefunds(
            @Param("date") java.time.LocalDateTime date,
            @Param("statuses") List<RefundStatus> statuses
    );

    /**
     * Find refunds on hold with specific reason pattern
     *
     * @param status       ON_HOLD status
     * @param reasonPattern Pattern to search in notes
     * @return List of held refunds
     */
    @Query("SELECT d FROM DepositRefund d " +
           "WHERE d.refundStatus = :status " +
           "AND LOWER(d.notes) LIKE LOWER(CONCAT('%', :reason, '%'))")
    List<DepositRefund> findHeldByReason(
            @Param("status") RefundStatus status,
            @Param("reason") String reasonPattern
    );

    /**
     * Average refund processing time (days from creation to completion)
     *
     * @return Average days or null if no completed refunds
     */
    @Query(value = "SELECT AVG(EXTRACT(DAY FROM (processed_at - created_at))) " +
           "FROM deposit_refunds WHERE refund_status = 'COMPLETED' AND processed_at IS NOT NULL",
           nativeQuery = true)
    Double averageProcessingTimeDays();

    /**
     * Check if checkout has deposit refund
     *
     * @param checkoutId Checkout UUID
     * @return True if deposit refund exists
     */
    boolean existsByCheckoutId(UUID checkoutId);
}
