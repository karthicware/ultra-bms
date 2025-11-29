package com.ultrabms.entity;

import com.ultrabms.entity.enums.NotificationFrequency;
import com.ultrabms.entity.enums.NotificationType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
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
 * NotificationSettings entity for system-level notification configuration.
 * Controls which notification types are enabled and their delivery frequency.
 * One record per NotificationType (singleton per type).
 *
 * Story 9.1: Email Notification System (AC 23-26)
 */
@Entity
@Table(
    name = "notification_settings",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_notification_settings_type", columnNames = {"notification_type"})
    },
    indexes = {
        @Index(name = "idx_notification_settings_type", columnList = "notification_type")
    }
)
@Data
@Builder
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class NotificationSettings extends BaseEntity {

    /**
     * The notification type this setting applies to
     */
    @NotNull(message = "Notification type is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "notification_type", nullable = false, unique = true, length = 50)
    private NotificationType notificationType;

    /**
     * Whether email notifications are enabled for this type
     */
    @Column(name = "email_enabled", nullable = false)
    @Builder.Default
    private Boolean emailEnabled = true;

    /**
     * Delivery frequency for this notification type
     */
    @NotNull(message = "Frequency is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "frequency", nullable = false, length = 20)
    @Builder.Default
    private NotificationFrequency frequency = NotificationFrequency.IMMEDIATE;

    /**
     * Human-readable description of this notification type
     */
    @Size(max = 255, message = "Description must be less than 255 characters")
    @Column(name = "description", length = 255)
    private String description;

    /**
     * User who last updated this setting
     */
    @Column(name = "updated_by")
    private UUID updatedBy;

    // ========================================
    // LIFECYCLE CALLBACKS
    // ========================================

    @PrePersist
    protected void onCreate() {
        if (this.emailEnabled == null) {
            this.emailEnabled = true;
        }
        if (this.frequency == null) {
            this.frequency = NotificationFrequency.IMMEDIATE;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        // updatedAt is handled by BaseEntity
    }

    // ========================================
    // HELPER METHODS
    // ========================================

    /**
     * Check if notifications should be sent for this type
     */
    public boolean shouldSendEmail() {
        return Boolean.TRUE.equals(this.emailEnabled);
    }

    /**
     * Check if notifications should be sent immediately
     */
    public boolean isImmediate() {
        return this.frequency == NotificationFrequency.IMMEDIATE;
    }

    /**
     * Check if notifications should be batched daily
     */
    public boolean isDailyDigest() {
        return this.frequency == NotificationFrequency.DAILY_DIGEST;
    }

    /**
     * Check if notifications should be batched weekly
     */
    public boolean isWeeklyDigest() {
        return this.frequency == NotificationFrequency.WEEKLY_DIGEST;
    }
}
