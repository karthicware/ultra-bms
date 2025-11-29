package com.ultrabms.scheduler;

import com.ultrabms.entity.EmailNotification;
import com.ultrabms.entity.enums.EmailNotificationStatus;
import com.ultrabms.repository.EmailNotificationRepository;
import com.ultrabms.service.EmailNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Scheduled job for processing queued email notifications.
 * Runs every 1 minute to process PENDING and retry FAILED emails.
 * Uses exponential backoff: 1 min, 5 min, 15 min (max 3 retries).
 *
 * Story 9.1: Email Notification System (AC 18-20)
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class EmailSenderJob {

    private final EmailNotificationRepository emailNotificationRepository;
    private final EmailNotificationService emailNotificationService;

    @Value("${email.queue.batch-size:50}")
    private int batchSize;

    /**
     * Process pending email notifications (AC #18).
     * Runs every 1 minute.
     *
     * Processes emails in PENDING status up to configured batch size.
     * Failed emails are scheduled for retry with exponential backoff.
     */
    @Scheduled(fixedRate = 60000) // Every 1 minute
    public void processQueuedEmails() {
        log.debug("Starting email queue processing job");

        try {
            // Find pending notifications (limit to batch size)
            List<EmailNotification> pendingNotifications = emailNotificationRepository
                .findPendingNotifications(PageRequest.of(0, batchSize));

            if (pendingNotifications.isEmpty()) {
                log.debug("No pending email notifications to process");
                return;
            }

            log.info("Processing {} pending email notifications", pendingNotifications.size());

            int successCount = 0;
            int failedCount = 0;

            for (EmailNotification notification : pendingNotifications) {
                try {
                    EmailNotification result = emailNotificationService.sendNotification(notification);
                    if (result.getStatus() == EmailNotificationStatus.SENT) {
                        successCount++;
                    } else {
                        failedCount++;
                    }
                } catch (Exception e) {
                    failedCount++;
                    log.error("Error processing notification {}: {}",
                        notification.getId(), e.getMessage());
                }
            }

            log.info("Email queue processing completed: {} sent, {} failed",
                successCount, failedCount);

        } catch (Exception e) {
            log.error("Email queue processing job failed: {}", e.getMessage(), e);
        }
    }

    /**
     * Process failed emails that are ready for retry (AC #19).
     * Runs every 1 minute (same as queue processor).
     *
     * Processes emails in FAILED status where:
     * - nextRetryAt is in the past
     * - retryCount < MAX_RETRY_COUNT (3)
     *
     * Exponential backoff schedule:
     * - Retry 1: 1 minute after failure
     * - Retry 2: 5 minutes after failure
     * - Retry 3: 15 minutes after failure
     */
    @Scheduled(fixedRate = 60000) // Every 1 minute
    public void processRetryEmails() {
        log.debug("Starting email retry processing job");

        try {
            // Find failed notifications ready for retry
            List<EmailNotification> retryNotifications = emailNotificationRepository
                .findReadyForRetry(
                    EmailNotificationStatus.FAILED,
                    LocalDateTime.now(),
                    EmailNotification.MAX_RETRY_COUNT
                );

            if (retryNotifications.isEmpty()) {
                log.debug("No failed email notifications ready for retry");
                return;
            }

            log.info("Processing {} failed email notifications for retry", retryNotifications.size());

            int successCount = 0;
            int failedCount = 0;

            for (EmailNotification notification : retryNotifications) {
                try {
                    log.info("Retrying notification {}, attempt {} of {}",
                        notification.getId(),
                        notification.getRetryCount() + 1,
                        EmailNotification.MAX_RETRY_COUNT);

                    // Reset status and attempt send
                    notification.resetForRetry();
                    EmailNotification result = emailNotificationService.sendNotification(notification);

                    if (result.getStatus() == EmailNotificationStatus.SENT) {
                        successCount++;
                        log.info("Retry successful for notification {}", notification.getId());
                    } else {
                        failedCount++;
                        log.warn("Retry failed for notification {}, next retry at: {}",
                            notification.getId(), result.getNextRetryAt());
                    }
                } catch (Exception e) {
                    failedCount++;
                    log.error("Error retrying notification {}: {}",
                        notification.getId(), e.getMessage());
                }
            }

            log.info("Email retry processing completed: {} sent, {} failed",
                successCount, failedCount);

        } catch (Exception e) {
            log.error("Email retry processing job failed: {}", e.getMessage(), e);
        }
    }

    /**
     * Cleanup old sent notifications (optional, runs daily).
     * Keeps the email_notifications table manageable.
     */
    @Scheduled(cron = "0 0 4 * * *") // 4 AM daily
    public void cleanupOldNotifications() {
        log.info("Starting email notification cleanup job");

        try {
            // Delete notifications older than 90 days
            LocalDateTime cutoffDate = LocalDateTime.now().minusDays(90);
            List<EmailNotification> oldNotifications =
                emailNotificationRepository.findByCreatedAtBefore(cutoffDate);

            if (!oldNotifications.isEmpty()) {
                emailNotificationRepository.deleteByCreatedAtBefore(cutoffDate);
                log.info("Cleaned up {} old email notifications", oldNotifications.size());
            } else {
                log.debug("No old email notifications to clean up");
            }
        } catch (Exception e) {
            log.error("Email notification cleanup job failed: {}", e.getMessage(), e);
        }
    }

    /**
     * Log email statistics (runs every hour).
     * Provides visibility into email system health.
     */
    @Scheduled(cron = "0 0 * * * *") // Every hour
    public void logEmailStatistics() {
        try {
            long pending = emailNotificationRepository.countByStatus(EmailNotificationStatus.PENDING);
            long queued = emailNotificationRepository.countByStatus(EmailNotificationStatus.QUEUED);
            long sent = emailNotificationRepository.countByStatus(EmailNotificationStatus.SENT);
            long failed = emailNotificationRepository.countByStatus(EmailNotificationStatus.FAILED);

            if (pending > 0 || failed > 0) {
                log.info("Email stats - Pending: {}, Queued: {}, Sent: {}, Failed: {}",
                    pending, queued, sent, failed);
            }

            // Warn if there are stuck emails
            if (pending > 100) {
                log.warn("High number of pending emails ({}), check email queue processor", pending);
            }
            if (failed > 10) {
                log.warn("Multiple failed emails ({}), check SMTP configuration", failed);
            }

        } catch (Exception e) {
            log.error("Failed to log email statistics: {}", e.getMessage());
        }
    }
}
