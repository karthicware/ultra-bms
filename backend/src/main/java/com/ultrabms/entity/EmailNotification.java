package com.ultrabms.entity;

import com.ultrabms.entity.enums.EmailNotificationStatus;
import com.ultrabms.entity.enums.NotificationType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * EmailNotification entity for tracking all email sends in the system.
 * Supports retry mechanism with exponential backoff for failed emails.
 *
 * Story 9.1: Email Notification System
 */
@Entity
@Table(
    name = "email_notifications",
    indexes = {
        @Index(name = "idx_email_notifications_status", columnList = "status"),
        @Index(name = "idx_email_notifications_recipient_email", columnList = "recipient_email"),
        @Index(name = "idx_email_notifications_notification_type", columnList = "notification_type"),
        @Index(name = "idx_email_notifications_entity_type_id", columnList = "entity_type, entity_id"),
        @Index(name = "idx_email_notifications_created_at", columnList = "created_at"),
        @Index(name = "idx_email_notifications_next_retry_at", columnList = "next_retry_at")
    }
)
@Data
@Builder
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class EmailNotification extends BaseEntity {

    // ========================================
    // RECIPIENT INFORMATION
    // ========================================

    /**
     * Email address of the recipient
     */
    @NotBlank(message = "Recipient email is required")
    @Email(message = "Invalid email format")
    @Size(max = 255, message = "Email must be less than 255 characters")
    @Column(name = "recipient_email", nullable = false, length = 255)
    private String recipientEmail;

    /**
     * Name of the recipient (for personalization)
     */
    @Size(max = 255, message = "Recipient name must be less than 255 characters")
    @Column(name = "recipient_name", length = 255)
    private String recipientName;

    // ========================================
    // NOTIFICATION TYPE AND CONTENT
    // ========================================

    /**
     * Type of notification being sent
     */
    @NotNull(message = "Notification type is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "notification_type", nullable = false, length = 50)
    private NotificationType notificationType;

    /**
     * Email subject line
     */
    @NotBlank(message = "Subject is required")
    @Size(max = 500, message = "Subject must be less than 500 characters")
    @Column(name = "subject", nullable = false, length = 500)
    private String subject;

    /**
     * Email body content (HTML)
     */
    @NotBlank(message = "Body is required")
    @Column(name = "body", nullable = false, columnDefinition = "TEXT")
    private String body;

    // ========================================
    // ENTITY REFERENCE (for linking)
    // ========================================

    /**
     * Type of entity this notification is related to (e.g., "Invoice", "WorkOrder")
     */
    @Size(max = 100, message = "Entity type must be less than 100 characters")
    @Column(name = "entity_type", length = 100)
    private String entityType;

    /**
     * ID of the related entity
     */
    @Column(name = "entity_id")
    private UUID entityId;

    // ========================================
    // STATUS AND TRACKING
    // ========================================

    /**
     * Current status of the email notification
     */
    @NotNull(message = "Status is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private EmailNotificationStatus status = EmailNotificationStatus.PENDING;

    /**
     * Timestamp when email was successfully sent
     */
    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    /**
     * Timestamp when email last failed
     */
    @Column(name = "failed_at")
    private LocalDateTime failedAt;

    /**
     * Reason for failure (error message)
     */
    @Column(name = "failure_reason", columnDefinition = "TEXT")
    private String failureReason;

    // ========================================
    // RETRY MECHANISM
    // ========================================

    /**
     * Number of retry attempts made (max 3)
     */
    @Column(name = "retry_count", nullable = false)
    @Builder.Default
    private Integer retryCount = 0;

    /**
     * When to attempt next retry (calculated with exponential backoff)
     */
    @Column(name = "next_retry_at")
    private LocalDateTime nextRetryAt;

    // ========================================
    // LIFECYCLE CALLBACKS
    // ========================================

    @PrePersist
    protected void onCreate() {
        if (this.status == null) {
            this.status = EmailNotificationStatus.PENDING;
        }
        if (this.retryCount == null) {
            this.retryCount = 0;
        }
    }

    // ========================================
    // HELPER METHODS
    // ========================================

    /**
     * Maximum number of retry attempts
     */
    public static final int MAX_RETRY_COUNT = 3;

    /**
     * Check if this notification can be retried
     */
    public boolean canRetry() {
        return this.status == EmailNotificationStatus.FAILED && this.retryCount < MAX_RETRY_COUNT;
    }

    /**
     * Mark notification as sent
     */
    public void markAsSent() {
        this.status = EmailNotificationStatus.SENT;
        this.sentAt = LocalDateTime.now();
        this.failedAt = null;
        this.failureReason = null;
        this.nextRetryAt = null;
    }

    /**
     * Mark notification as failed with retry scheduling
     * Uses exponential backoff: 1 min, 5 min, 15 min
     */
    public void markAsFailed(String reason) {
        this.status = EmailNotificationStatus.FAILED;
        this.failedAt = LocalDateTime.now();
        this.failureReason = reason;
        this.retryCount++;

        if (canRetry()) {
            // Exponential backoff: 1, 5, 15 minutes
            int delayMinutes = (int) Math.pow(5, this.retryCount - 1);
            this.nextRetryAt = LocalDateTime.now().plusMinutes(delayMinutes);
        } else {
            this.nextRetryAt = null;
        }
    }

    /**
     * Mark notification as queued for processing
     */
    public void markAsQueued() {
        this.status = EmailNotificationStatus.QUEUED;
    }

    /**
     * Reset for retry (set back to PENDING)
     */
    public void resetForRetry() {
        this.status = EmailNotificationStatus.PENDING;
        this.nextRetryAt = null;
    }

    /**
     * Check if this is an immediate notification (no delay)
     */
    public boolean isImmediate() {
        return this.nextRetryAt == null || !LocalDateTime.now().isBefore(this.nextRetryAt);
    }
}
