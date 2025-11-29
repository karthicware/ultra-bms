package com.ultrabms.dto.notification;

import com.ultrabms.entity.EmailNotification;
import com.ultrabms.entity.enums.EmailNotificationStatus;
import com.ultrabms.entity.enums.NotificationType;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for email notification responses.
 *
 * Story 9.1: Email Notification System
 */
public record EmailNotificationDTO(
    UUID id,
    String recipientEmail,
    String recipientName,
    NotificationType notificationType,
    String subject,
    EmailNotificationStatus status,
    String entityType,
    UUID entityId,
    LocalDateTime sentAt,
    LocalDateTime failedAt,
    String failureReason,
    Integer retryCount,
    LocalDateTime nextRetryAt,
    LocalDateTime createdAt
) {
    public static EmailNotificationDTO fromEntity(EmailNotification entity) {
        return new EmailNotificationDTO(
            entity.getId(),
            entity.getRecipientEmail(),
            entity.getRecipientName(),
            entity.getNotificationType(),
            entity.getSubject(),
            entity.getStatus(),
            entity.getEntityType(),
            entity.getEntityId(),
            entity.getSentAt(),
            entity.getFailedAt(),
            entity.getFailureReason(),
            entity.getRetryCount(),
            entity.getNextRetryAt(),
            entity.getCreatedAt()
        );
    }
}
