package com.ultrabms.repository;

import com.ultrabms.entity.EmailNotification;
import com.ultrabms.entity.enums.EmailNotificationStatus;
import com.ultrabms.entity.enums.NotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Repository for EmailNotification entity.
 * Provides query methods for email notification management and queue processing.
 *
 * Story 9.1: Email Notification System
 */
@Repository
public interface EmailNotificationRepository extends JpaRepository<EmailNotification, UUID> {

    // ========================================
    // QUEUE PROCESSING QUERIES
    // ========================================

    /**
     * Find all notifications by status
     */
    List<EmailNotification> findByStatus(EmailNotificationStatus status);

    /**
     * Find pending/queued notifications ready for processing
     */
    List<EmailNotification> findByStatusIn(List<EmailNotificationStatus> statuses);

    /**
     * Find notifications ready for retry (failed with nextRetryAt in the past)
     */
    @Query("SELECT e FROM EmailNotification e WHERE e.status = :status " +
           "AND e.nextRetryAt IS NOT NULL AND e.nextRetryAt <= :now " +
           "AND e.retryCount < :maxRetries ORDER BY e.nextRetryAt ASC")
    List<EmailNotification> findReadyForRetry(
        @Param("status") EmailNotificationStatus status,
        @Param("now") LocalDateTime now,
        @Param("maxRetries") int maxRetries
    );

    /**
     * Find failed notifications with retry count less than max (for retry processing)
     */
    List<EmailNotification> findByStatusAndRetryCountLessThan(
        EmailNotificationStatus status,
        int maxRetryCount
    );

    /**
     * Find pending notifications with batch size limit (for scheduled job)
     */
    @Query("SELECT e FROM EmailNotification e WHERE e.status = 'PENDING' ORDER BY e.createdAt ASC")
    List<EmailNotification> findPendingNotifications(Pageable pageable);

    // ========================================
    // RECIPIENT QUERIES
    // ========================================

    /**
     * Find notifications by recipient email (paginated)
     */
    Page<EmailNotification> findByRecipientEmailOrderByCreatedAtDesc(
        String recipientEmail,
        Pageable pageable
    );

    /**
     * Find notifications by recipient email (non-paginated)
     */
    List<EmailNotification> findByRecipientEmailOrderByCreatedAtDesc(String recipientEmail);

    // ========================================
    // ENTITY REFERENCE QUERIES
    // ========================================

    /**
     * Find notifications by entity type and entity ID
     */
    List<EmailNotification> findByEntityTypeAndEntityId(String entityType, UUID entityId);

    /**
     * Find notifications by entity type
     */
    List<EmailNotification> findByEntityTypeOrderByCreatedAtDesc(String entityType);

    // ========================================
    // NOTIFICATION TYPE QUERIES
    // ========================================

    /**
     * Find notifications by type
     */
    List<EmailNotification> findByNotificationType(NotificationType notificationType);

    /**
     * Find notifications by type (paginated)
     */
    Page<EmailNotification> findByNotificationTypeOrderByCreatedAtDesc(
        NotificationType notificationType,
        Pageable pageable
    );

    // ========================================
    // DATE RANGE QUERIES
    // ========================================

    /**
     * Find notifications within a date range
     */
    Page<EmailNotification> findByCreatedAtBetweenOrderByCreatedAtDesc(
        LocalDateTime startDate,
        LocalDateTime endDate,
        Pageable pageable
    );

    // ========================================
    // STATISTICS QUERIES
    // ========================================

    /**
     * Count notifications by status
     */
    long countByStatus(EmailNotificationStatus status);

    /**
     * Count notifications by status within date range
     */
    long countByStatusAndCreatedAtBetween(
        EmailNotificationStatus status,
        LocalDateTime startDate,
        LocalDateTime endDate
    );

    /**
     * Count notifications by type
     */
    long countByNotificationType(NotificationType notificationType);

    /**
     * Count notifications by type and status
     */
    long countByNotificationTypeAndStatus(NotificationType notificationType, EmailNotificationStatus status);

    // ========================================
    // COMBINED FILTER QUERIES
    // ========================================

    /**
     * Find notifications with multiple filters
     */
    @Query("SELECT e FROM EmailNotification e WHERE " +
           "(:status IS NULL OR e.status = :status) AND " +
           "(:notificationType IS NULL OR e.notificationType = :notificationType) AND " +
           "(:recipientEmail IS NULL OR e.recipientEmail LIKE %:recipientEmail%) AND " +
           "(:startDate IS NULL OR e.createdAt >= :startDate) AND " +
           "(:endDate IS NULL OR e.createdAt <= :endDate) " +
           "ORDER BY e.createdAt DESC")
    Page<EmailNotification> findWithFilters(
        @Param("status") EmailNotificationStatus status,
        @Param("notificationType") NotificationType notificationType,
        @Param("recipientEmail") String recipientEmail,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate,
        Pageable pageable
    );

    // ========================================
    // CLEANUP QUERIES
    // ========================================

    /**
     * Delete old notifications (for data retention)
     */
    void deleteByCreatedAtBefore(LocalDateTime cutoffDate);

    /**
     * Find old notifications for archival
     */
    List<EmailNotification> findByCreatedAtBefore(LocalDateTime cutoffDate);
}
