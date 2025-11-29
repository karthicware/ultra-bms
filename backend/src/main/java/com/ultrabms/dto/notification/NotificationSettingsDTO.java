package com.ultrabms.dto.notification;

import com.ultrabms.entity.NotificationSettings;
import com.ultrabms.entity.enums.NotificationFrequency;
import com.ultrabms.entity.enums.NotificationType;

import java.util.UUID;

/**
 * DTO for notification settings responses.
 *
 * Story 9.1: Email Notification System
 */
public record NotificationSettingsDTO(
    UUID id,
    NotificationType notificationType,
    Boolean emailEnabled,
    NotificationFrequency frequency,
    String description
) {
    public static NotificationSettingsDTO fromEntity(NotificationSettings entity) {
        return new NotificationSettingsDTO(
            entity.getId(),
            entity.getNotificationType(),
            entity.getEmailEnabled(),
            entity.getFrequency(),
            entity.getDescription()
        );
    }
}
