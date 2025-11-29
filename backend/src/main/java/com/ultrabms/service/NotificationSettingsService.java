package com.ultrabms.service;

import com.ultrabms.entity.NotificationSettings;
import com.ultrabms.entity.enums.NotificationFrequency;
import com.ultrabms.entity.enums.NotificationType;
import com.ultrabms.repository.NotificationSettingsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Service for managing notification settings.
 * Provides CRUD operations and business logic for system-level notification configuration.
 *
 * Story 9.1: Email Notification System (AC 23-26)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationSettingsService {

    private final NotificationSettingsRepository notificationSettingsRepository;

    // ========================================
    // READ OPERATIONS
    // ========================================

    /**
     * Get all notification settings
     */
    public List<NotificationSettings> getAllSettings() {
        return notificationSettingsRepository.findAllByOrderByNotificationTypeAsc();
    }

    /**
     * Get settings for a specific notification type
     */
    public Optional<NotificationSettings> getSettings(NotificationType type) {
        return notificationSettingsRepository.findByNotificationType(type);
    }

    /**
     * Get settings by ID
     */
    public Optional<NotificationSettings> getSettingsById(UUID id) {
        return notificationSettingsRepository.findById(id);
    }

    /**
     * Check if a notification type is enabled
     */
    public boolean isNotificationEnabled(NotificationType type) {
        return notificationSettingsRepository.existsByNotificationTypeAndEmailEnabledTrue(type);
    }

    /**
     * Get all enabled notification types
     */
    public List<NotificationSettings> getEnabledSettings() {
        return notificationSettingsRepository.findByEmailEnabledTrue();
    }

    /**
     * Get settings by frequency
     */
    public List<NotificationSettings> getSettingsByFrequency(NotificationFrequency frequency) {
        return notificationSettingsRepository.findByFrequency(frequency);
    }

    // ========================================
    // UPDATE OPERATIONS
    // ========================================

    /**
     * Update settings for a notification type
     */
    @Transactional
    public NotificationSettings updateSettings(
            NotificationType type,
            Boolean emailEnabled,
            NotificationFrequency frequency,
            UUID updatedBy) {

        NotificationSettings settings = notificationSettingsRepository.findByNotificationType(type)
            .orElseThrow(() -> new IllegalArgumentException("Settings not found for type: " + type));

        if (emailEnabled != null) {
            settings.setEmailEnabled(emailEnabled);
        }
        if (frequency != null) {
            settings.setFrequency(frequency);
        }
        settings.setUpdatedBy(updatedBy);

        NotificationSettings saved = notificationSettingsRepository.save(settings);
        log.info("Updated notification settings for type={}, enabled={}, frequency={}, by={}",
            type, emailEnabled, frequency, updatedBy);

        return saved;
    }

    /**
     * Toggle email enabled status for a notification type
     */
    @Transactional
    public NotificationSettings toggleEnabled(NotificationType type, UUID updatedBy) {
        NotificationSettings settings = notificationSettingsRepository.findByNotificationType(type)
            .orElseThrow(() -> new IllegalArgumentException("Settings not found for type: " + type));

        settings.setEmailEnabled(!settings.getEmailEnabled());
        settings.setUpdatedBy(updatedBy);

        NotificationSettings saved = notificationSettingsRepository.save(settings);
        log.info("Toggled notification {} to enabled={}", type, saved.getEmailEnabled());

        return saved;
    }

    /**
     * Update frequency for a notification type
     */
    @Transactional
    public NotificationSettings updateFrequency(
            NotificationType type,
            NotificationFrequency frequency,
            UUID updatedBy) {

        NotificationSettings settings = notificationSettingsRepository.findByNotificationType(type)
            .orElseThrow(() -> new IllegalArgumentException("Settings not found for type: " + type));

        settings.setFrequency(frequency);
        settings.setUpdatedBy(updatedBy);

        NotificationSettings saved = notificationSettingsRepository.save(settings);
        log.info("Updated notification {} frequency to {}", type, frequency);

        return saved;
    }

    /**
     * Bulk update multiple settings
     */
    @Transactional
    public List<NotificationSettings> bulkUpdate(
            List<NotificationType> types,
            Boolean emailEnabled,
            NotificationFrequency frequency,
            UUID updatedBy) {

        List<NotificationSettings> updated = types.stream()
            .map(type -> updateSettings(type, emailEnabled, frequency, updatedBy))
            .toList();

        log.info("Bulk updated {} notification settings", updated.size());
        return updated;
    }

    // ========================================
    // INITIALIZATION
    // ========================================

    /**
     * Initialize default settings for any missing notification types.
     * Called on application startup or when new notification types are added.
     */
    @Transactional
    public void initializeDefaultSettings() {
        List<NotificationSettings> existingSettings = notificationSettingsRepository.findAll();

        // Find missing notification types
        List<NotificationType> existingTypes = existingSettings.stream()
            .map(NotificationSettings::getNotificationType)
            .toList();

        int created = 0;
        for (NotificationType type : NotificationType.values()) {
            if (!existingTypes.contains(type)) {
                NotificationSettings settings = NotificationSettings.builder()
                    .notificationType(type)
                    .emailEnabled(true)
                    .frequency(NotificationFrequency.IMMEDIATE)
                    .description(type.name().replace("_", " ").toLowerCase())
                    .build();

                notificationSettingsRepository.save(settings);
                created++;
                log.info("Created default settings for notification type: {}", type);
            }
        }

        if (created > 0) {
            log.info("Initialized {} new notification settings", created);
        }
    }

    /**
     * Reset all settings to defaults
     */
    @Transactional
    public void resetToDefaults(UUID updatedBy) {
        List<NotificationSettings> allSettings = notificationSettingsRepository.findAll();

        for (NotificationSettings settings : allSettings) {
            settings.setEmailEnabled(true);
            settings.setFrequency(NotificationFrequency.IMMEDIATE);
            settings.setUpdatedBy(updatedBy);
        }

        notificationSettingsRepository.saveAll(allSettings);
        log.info("Reset all notification settings to defaults");
    }
}
