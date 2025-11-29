package com.ultrabms.controller;

import com.ultrabms.dto.notification.*;
import com.ultrabms.entity.EmailNotification;
import com.ultrabms.entity.NotificationSettings;
import com.ultrabms.entity.User;
import com.ultrabms.entity.enums.EmailNotificationStatus;
import com.ultrabms.entity.enums.NotificationType;
import com.ultrabms.repository.UserRepository;
import com.ultrabms.service.EmailNotificationService;
import com.ultrabms.service.NotificationSettingsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST Controller for Email Notifications and Settings Management
 * Handles notification history, retry operations, and settings configuration.
 *
 * Story 9.1: Email Notification System (AC 27-32)
 */
@RestController
@RequestMapping("/api/v1/notifications")
@Tag(name = "Notifications", description = "Email notification management APIs")
@SecurityRequirement(name = "Bearer Authentication")
@RequiredArgsConstructor
@Slf4j
public class NotificationController {

    private final EmailNotificationService emailNotificationService;
    private final NotificationSettingsService notificationSettingsService;
    private final UserRepository userRepository;

    // =================================================================
    // NOTIFICATION ENDPOINTS (AC 27-30)
    // =================================================================

    /**
     * Send immediate email notification (AC 27)
     * POST /api/v1/notifications/send
     */
    @PostMapping("/send")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(
        summary = "Send immediate email",
        description = "Send an email notification immediately (admin only)"
    )
    public ResponseEntity<Map<String, Object>> sendEmail(
            @Valid @RequestBody SendEmailRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        log.info("Sending immediate email: type={}, recipient={}, by={}",
            request.notificationType(), request.recipientEmail(), userDetails.getUsername());

        EmailNotification notification = emailNotificationService.sendEmailImmediate(
            request.notificationType(),
            request.recipientEmail(),
            request.recipientName(),
            request.subject(),
            request.templateName(),
            request.variables() != null ? request.variables() : Map.of(),
            request.entityType(),
            request.entityId()
        );

        Map<String, Object> response = buildSuccessResponse(
            EmailNotificationDTO.fromEntity(notification),
            "Email queued for immediate delivery"
        );
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
    }

    /**
     * List notification history with filters (AC 28)
     * GET /api/v1/notifications
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'FINANCE_MANAGER')")
    @Operation(
        summary = "List notifications",
        description = "Get paginated notification history with optional filters"
    )
    public ResponseEntity<Map<String, Object>> listNotifications(
            @RequestParam(required = false) EmailNotificationStatus status,
            @RequestParam(required = false) NotificationType type,
            @RequestParam(required = false) String recipientEmail,
            @RequestParam(required = false) LocalDateTime startDate,
            @RequestParam(required = false) LocalDateTime endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        log.debug("Listing notifications: status={}, type={}, page={}, size={}",
            status, type, page, size);

        Sort sort = sortDir.equalsIgnoreCase("asc")
            ? Sort.by(sortBy).ascending()
            : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<EmailNotification> notifications = emailNotificationService.getNotifications(
            status, type, recipientEmail, startDate, endDate, pageable
        );

        Page<EmailNotificationDTO> dtoPage = notifications.map(EmailNotificationDTO::fromEntity);

        Map<String, Object> response = buildPageResponse(dtoPage, "Notifications retrieved successfully");
        return ResponseEntity.ok(response);
    }

    /**
     * Get notification details (AC 29)
     * GET /api/v1/notifications/{id}
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'FINANCE_MANAGER')")
    @Operation(
        summary = "Get notification details",
        description = "Get detailed information about a specific notification"
    )
    public ResponseEntity<Map<String, Object>> getNotification(@PathVariable UUID id) {
        log.debug("Getting notification: {}", id);

        EmailNotification notification = emailNotificationService.getNotification(id)
            .orElseThrow(() -> new IllegalArgumentException("Notification not found: " + id));

        Map<String, Object> response = buildSuccessResponse(
            EmailNotificationDTO.fromEntity(notification),
            "Notification retrieved successfully"
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Retry failed notification (AC 30)
     * POST /api/v1/notifications/retry/{id}
     */
    @PostMapping("/retry/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(
        summary = "Retry failed notification",
        description = "Retry sending a failed email notification"
    )
    public ResponseEntity<Map<String, Object>> retryNotification(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {

        log.info("Retrying notification: {} by {}", id, userDetails.getUsername());

        EmailNotification notification = emailNotificationService.retryNotification(id);

        Map<String, Object> response = buildSuccessResponse(
            EmailNotificationDTO.fromEntity(notification),
            "Notification retry initiated"
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Get notification statistics
     * GET /api/v1/notifications/stats
     */
    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(
        summary = "Get notification statistics",
        description = "Get email notification statistics for a time period"
    )
    public ResponseEntity<Map<String, Object>> getStatistics(
            @RequestParam(required = false) LocalDateTime startDate,
            @RequestParam(required = false) LocalDateTime endDate) {

        LocalDateTime start = startDate != null ? startDate : LocalDateTime.now().minusDays(30);
        LocalDateTime end = endDate != null ? endDate : LocalDateTime.now();

        Map<String, Long> stats = emailNotificationService.getStatistics(start, end);

        EmailStatsDTO statsDto = new EmailStatsDTO(
            stats.getOrDefault("pending", 0L),
            stats.getOrDefault("queued", 0L),
            stats.getOrDefault("sent", 0L),
            stats.getOrDefault("failed", 0L),
            start,
            end
        );

        Map<String, Object> response = buildSuccessResponse(statsDto, "Statistics retrieved successfully");
        return ResponseEntity.ok(response);
    }

    // =================================================================
    // NOTIFICATION SETTINGS ENDPOINTS (AC 31-32)
    // =================================================================

    /**
     * Get notification settings (AC 31)
     * GET /api/v1/notifications/settings
     */
    @GetMapping("/settings")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(
        summary = "Get notification settings",
        description = "Get all notification type settings"
    )
    public ResponseEntity<Map<String, Object>> getSettings() {
        log.debug("Getting all notification settings");

        List<NotificationSettings> settings = notificationSettingsService.getAllSettings();
        List<NotificationSettingsDTO> dtos = settings.stream()
            .map(NotificationSettingsDTO::fromEntity)
            .toList();

        Map<String, Object> response = buildSuccessResponse(dtos, "Settings retrieved successfully");
        return ResponseEntity.ok(response);
    }

    /**
     * Update notification settings (AC 32)
     * PUT /api/v1/notifications/settings
     */
    @PutMapping("/settings")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(
        summary = "Update notification settings",
        description = "Update settings for a specific notification type"
    )
    public ResponseEntity<Map<String, Object>> updateSettings(
            @Valid @RequestBody UpdateSettingsRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        log.info("Updating notification settings: type={}, enabled={}, frequency={}, by={}",
            request.notificationType(), request.emailEnabled(), request.frequency(),
            userDetails.getUsername());

        UUID userId = getUserIdFromUserDetails(userDetails);

        NotificationSettings settings = notificationSettingsService.updateSettings(
            request.notificationType(),
            request.emailEnabled(),
            request.frequency(),
            userId
        );

        Map<String, Object> response = buildSuccessResponse(
            NotificationSettingsDTO.fromEntity(settings),
            "Settings updated successfully"
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Reset all settings to defaults
     * POST /api/v1/notifications/settings/reset
     */
    @PostMapping("/settings/reset")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(
        summary = "Reset notification settings",
        description = "Reset all notification settings to defaults (Super Admin only)"
    )
    public ResponseEntity<Map<String, Object>> resetSettings(
            @AuthenticationPrincipal UserDetails userDetails) {

        log.info("Resetting notification settings to defaults by {}", userDetails.getUsername());

        UUID userId = getUserIdFromUserDetails(userDetails);
        notificationSettingsService.resetToDefaults(userId);

        List<NotificationSettings> settings = notificationSettingsService.getAllSettings();
        List<NotificationSettingsDTO> dtos = settings.stream()
            .map(NotificationSettingsDTO::fromEntity)
            .toList();

        Map<String, Object> response = buildSuccessResponse(dtos, "Settings reset to defaults");
        return ResponseEntity.ok(response);
    }

    // =================================================================
    // TEST EMAIL ENDPOINT (AC 36)
    // =================================================================

    /**
     * Send test email to verify configuration
     * POST /api/v1/notifications/test
     */
    @PostMapping("/test")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(
        summary = "Send test email",
        description = "Send a test email to verify email configuration is working"
    )
    public ResponseEntity<Map<String, Object>> sendTestEmail(
            @RequestParam String recipientEmail,
            @AuthenticationPrincipal UserDetails userDetails) {

        log.info("Sending test email to {} by {}", recipientEmail, userDetails.getUsername());

        EmailNotification notification = emailNotificationService.sendEmailImmediate(
            NotificationType.NEW_USER_CREATED,
            recipientEmail,
            "Test User",
            "Ultra BMS - Test Email",
            "user-welcome-email",
            Map.of(
                "firstName", "Test User",
                "email", recipientEmail,
                "tempPassword", "Test1234!",
                "loginUrl", "http://localhost:3000/login"
            ),
            "System",
            null
        );

        Map<String, Object> response = buildSuccessResponse(
            EmailNotificationDTO.fromEntity(notification),
            "Test email sent. Check the notification status for delivery result."
        );
        return ResponseEntity.ok(response);
    }

    // =================================================================
    // HELPER METHODS
    // =================================================================

    private UUID getUserIdFromUserDetails(UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
            .orElseThrow(() -> new IllegalStateException("User not found: " + userDetails.getUsername()));
        return user.getId();
    }

    private Map<String, Object> buildSuccessResponse(Object data, String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", message);
        response.put("data", data);
        response.put("timestamp", LocalDateTime.now());
        return response;
    }

    private Map<String, Object> buildPageResponse(Page<?> page, String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", message);
        response.put("data", page.getContent());
        response.put("pagination", Map.of(
            "page", page.getNumber(),
            "size", page.getSize(),
            "totalElements", page.getTotalElements(),
            "totalPages", page.getTotalPages(),
            "first", page.isFirst(),
            "last", page.isLast()
        ));
        response.put("timestamp", LocalDateTime.now());
        return response;
    }
}
