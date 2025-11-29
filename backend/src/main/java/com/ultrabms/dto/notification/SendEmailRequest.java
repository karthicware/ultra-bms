package com.ultrabms.dto.notification;

import com.ultrabms.entity.enums.NotificationType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.Map;
import java.util.UUID;

/**
 * Request DTO for sending immediate email notifications.
 *
 * Story 9.1: Email Notification System
 */
public record SendEmailRequest(
    @NotNull(message = "Notification type is required")
    NotificationType notificationType,

    @NotBlank(message = "Recipient email is required")
    @Email(message = "Invalid email format")
    String recipientEmail,

    @Size(max = 255, message = "Recipient name must be less than 255 characters")
    String recipientName,

    @NotBlank(message = "Subject is required")
    @Size(max = 500, message = "Subject must be less than 500 characters")
    String subject,

    @NotBlank(message = "Template name is required")
    String templateName,

    Map<String, Object> variables,

    @Size(max = 100, message = "Entity type must be less than 100 characters")
    String entityType,

    UUID entityId
) {}
