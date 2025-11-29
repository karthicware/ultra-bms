package com.ultrabms.dto.notification;

import com.ultrabms.entity.enums.NotificationFrequency;
import com.ultrabms.entity.enums.NotificationType;
import jakarta.validation.constraints.NotNull;

/**
 * Request DTO for updating notification settings.
 *
 * Story 9.1: Email Notification System
 */
public record UpdateSettingsRequest(
    @NotNull(message = "Notification type is required")
    NotificationType notificationType,

    Boolean emailEnabled,

    NotificationFrequency frequency
) {}
