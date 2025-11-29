package com.ultrabms.repository;

import com.ultrabms.entity.NotificationSettings;
import com.ultrabms.entity.enums.NotificationFrequency;
import com.ultrabms.entity.enums.NotificationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for NotificationSettings entity.
 * Provides query methods for notification settings management.
 *
 * Story 9.1: Email Notification System
 */
@Repository
public interface NotificationSettingsRepository extends JpaRepository<NotificationSettings, UUID> {

    /**
     * Find settings by notification type
     */
    Optional<NotificationSettings> findByNotificationType(NotificationType notificationType);

    /**
     * Find all enabled notification types
     */
    List<NotificationSettings> findByEmailEnabledTrue();

    /**
     * Find all disabled notification types
     */
    List<NotificationSettings> findByEmailEnabledFalse();

    /**
     * Find settings by frequency
     */
    List<NotificationSettings> findByFrequency(NotificationFrequency frequency);

    /**
     * Find all settings ordered by notification type
     */
    List<NotificationSettings> findAllByOrderByNotificationTypeAsc();

    /**
     * Check if a notification type is enabled
     */
    boolean existsByNotificationTypeAndEmailEnabledTrue(NotificationType notificationType);
}
