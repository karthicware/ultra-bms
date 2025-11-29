package com.ultrabms.service;

import com.ultrabms.entity.NotificationSettings;
import com.ultrabms.entity.enums.NotificationFrequency;
import com.ultrabms.entity.enums.NotificationType;
import com.ultrabms.repository.NotificationSettingsRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for NotificationSettingsService
 * Story 9.1: Email Notification System (AC 40-42)
 */
@ExtendWith(MockitoExtension.class)
class NotificationSettingsServiceTest {

    @Mock
    private NotificationSettingsRepository notificationSettingsRepository;

    @InjectMocks
    private NotificationSettingsService notificationSettingsService;

    private UUID settingsId;
    private UUID userId;
    private NotificationSettings settings;

    @BeforeEach
    void setUp() {
        settingsId = UUID.randomUUID();
        userId = UUID.randomUUID();

        settings = NotificationSettings.builder()
            .notificationType(NotificationType.INVOICE_GENERATED)
            .emailEnabled(true)
            .frequency(NotificationFrequency.IMMEDIATE)
            .description("Invoice generation notification")
            .build();
    }

    @Nested
    @DisplayName("getAllSettings Tests")
    class GetAllSettingsTests {

        @Test
        @DisplayName("Should return all settings ordered by type")
        void shouldReturnAllSettingsOrdered() {
            // Given
            List<NotificationSettings> settingsList = List.of(settings);
            when(notificationSettingsRepository.findAllByOrderByNotificationTypeAsc())
                .thenReturn(settingsList);

            // When
            List<NotificationSettings> result = notificationSettingsService.getAllSettings();

            // Then
            assertThat(result).hasSize(1);
            verify(notificationSettingsRepository).findAllByOrderByNotificationTypeAsc();
        }
    }

    @Nested
    @DisplayName("getSettings Tests")
    class GetSettingsTests {

        @Test
        @DisplayName("Should return settings by notification type")
        void shouldReturnSettingsByType() {
            // Given
            when(notificationSettingsRepository.findByNotificationType(NotificationType.INVOICE_GENERATED))
                .thenReturn(Optional.of(settings));

            // When
            Optional<NotificationSettings> result = notificationSettingsService.getSettings(
                NotificationType.INVOICE_GENERATED
            );

            // Then
            assertThat(result).isPresent();
            assertThat(result.get().getNotificationType()).isEqualTo(NotificationType.INVOICE_GENERATED);
        }

        @Test
        @DisplayName("Should return empty for non-existent type")
        void shouldReturnEmptyForNonExistentType() {
            // Given
            when(notificationSettingsRepository.findByNotificationType(any()))
                .thenReturn(Optional.empty());

            // When
            Optional<NotificationSettings> result = notificationSettingsService.getSettings(
                NotificationType.ANNOUNCEMENT_PUBLISHED
            );

            // Then
            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("isNotificationEnabled Tests")
    class IsNotificationEnabledTests {

        @Test
        @DisplayName("Should return true when notification is enabled")
        void shouldReturnTrueWhenEnabled() {
            // Given
            when(notificationSettingsRepository.existsByNotificationTypeAndEmailEnabledTrue(
                NotificationType.INVOICE_GENERATED
            )).thenReturn(true);

            // When
            boolean result = notificationSettingsService.isNotificationEnabled(
                NotificationType.INVOICE_GENERATED
            );

            // Then
            assertThat(result).isTrue();
        }

        @Test
        @DisplayName("Should return false when notification is disabled")
        void shouldReturnFalseWhenDisabled() {
            // Given
            when(notificationSettingsRepository.existsByNotificationTypeAndEmailEnabledTrue(
                NotificationType.DOCUMENT_UPLOADED
            )).thenReturn(false);

            // When
            boolean result = notificationSettingsService.isNotificationEnabled(
                NotificationType.DOCUMENT_UPLOADED
            );

            // Then
            assertThat(result).isFalse();
        }
    }

    @Nested
    @DisplayName("updateSettings Tests")
    class UpdateSettingsTests {

        @Test
        @DisplayName("Should update email enabled setting")
        void shouldUpdateEmailEnabled() {
            // Given
            when(notificationSettingsRepository.findByNotificationType(NotificationType.INVOICE_GENERATED))
                .thenReturn(Optional.of(settings));
            when(notificationSettingsRepository.save(any(NotificationSettings.class)))
                .thenAnswer(inv -> inv.getArgument(0));

            // When
            NotificationSettings result = notificationSettingsService.updateSettings(
                NotificationType.INVOICE_GENERATED,
                false,
                null,
                userId
            );

            // Then
            assertThat(result.getEmailEnabled()).isFalse();
            assertThat(result.getUpdatedBy()).isEqualTo(userId);
        }

        @Test
        @DisplayName("Should update frequency setting")
        void shouldUpdateFrequency() {
            // Given
            when(notificationSettingsRepository.findByNotificationType(NotificationType.INVOICE_GENERATED))
                .thenReturn(Optional.of(settings));
            when(notificationSettingsRepository.save(any(NotificationSettings.class)))
                .thenAnswer(inv -> inv.getArgument(0));

            // When
            NotificationSettings result = notificationSettingsService.updateSettings(
                NotificationType.INVOICE_GENERATED,
                null,
                NotificationFrequency.DAILY_DIGEST,
                userId
            );

            // Then
            assertThat(result.getFrequency()).isEqualTo(NotificationFrequency.DAILY_DIGEST);
        }

        @Test
        @DisplayName("Should throw exception for non-existent type")
        void shouldThrowExceptionForNonExistentType() {
            // Given
            when(notificationSettingsRepository.findByNotificationType(any()))
                .thenReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> notificationSettingsService.updateSettings(
                NotificationType.ANNOUNCEMENT_PUBLISHED,
                true,
                null,
                userId
            ))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Settings not found");
        }
    }

    @Nested
    @DisplayName("toggleEnabled Tests")
    class ToggleEnabledTests {

        @Test
        @DisplayName("Should toggle from enabled to disabled")
        void shouldToggleFromEnabledToDisabled() {
            // Given
            settings.setEmailEnabled(true);
            when(notificationSettingsRepository.findByNotificationType(NotificationType.INVOICE_GENERATED))
                .thenReturn(Optional.of(settings));
            when(notificationSettingsRepository.save(any(NotificationSettings.class)))
                .thenAnswer(inv -> inv.getArgument(0));

            // When
            NotificationSettings result = notificationSettingsService.toggleEnabled(
                NotificationType.INVOICE_GENERATED,
                userId
            );

            // Then
            assertThat(result.getEmailEnabled()).isFalse();
        }

        @Test
        @DisplayName("Should toggle from disabled to enabled")
        void shouldToggleFromDisabledToEnabled() {
            // Given
            settings.setEmailEnabled(false);
            when(notificationSettingsRepository.findByNotificationType(NotificationType.INVOICE_GENERATED))
                .thenReturn(Optional.of(settings));
            when(notificationSettingsRepository.save(any(NotificationSettings.class)))
                .thenAnswer(inv -> inv.getArgument(0));

            // When
            NotificationSettings result = notificationSettingsService.toggleEnabled(
                NotificationType.INVOICE_GENERATED,
                userId
            );

            // Then
            assertThat(result.getEmailEnabled()).isTrue();
        }
    }

    @Nested
    @DisplayName("bulkUpdate Tests")
    class BulkUpdateTests {

        @Test
        @DisplayName("Should update multiple settings")
        void shouldUpdateMultipleSettings() {
            // Given
            NotificationSettings settings2 = NotificationSettings.builder()
                .notificationType(NotificationType.PAYMENT_RECEIVED)
                .emailEnabled(true)
                .frequency(NotificationFrequency.IMMEDIATE)
                .build();

            when(notificationSettingsRepository.findByNotificationType(NotificationType.INVOICE_GENERATED))
                .thenReturn(Optional.of(settings));
            when(notificationSettingsRepository.findByNotificationType(NotificationType.PAYMENT_RECEIVED))
                .thenReturn(Optional.of(settings2));
            when(notificationSettingsRepository.save(any(NotificationSettings.class)))
                .thenAnswer(inv -> inv.getArgument(0));

            // When
            List<NotificationSettings> result = notificationSettingsService.bulkUpdate(
                List.of(NotificationType.INVOICE_GENERATED, NotificationType.PAYMENT_RECEIVED),
                false,
                NotificationFrequency.DAILY_DIGEST,
                userId
            );

            // Then
            assertThat(result).hasSize(2);
            assertThat(result).allMatch(s -> !s.getEmailEnabled());
            assertThat(result).allMatch(s -> s.getFrequency() == NotificationFrequency.DAILY_DIGEST);
        }
    }

    @Nested
    @DisplayName("resetToDefaults Tests")
    class ResetToDefaultsTests {

        @Test
        @DisplayName("Should reset all settings to defaults")
        void shouldResetAllSettingsToDefaults() {
            // Given
            settings.setEmailEnabled(false);
            settings.setFrequency(NotificationFrequency.WEEKLY_DIGEST);

            when(notificationSettingsRepository.findAll()).thenReturn(List.of(settings));
            when(notificationSettingsRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

            // When
            notificationSettingsService.resetToDefaults(userId);

            // Then
            ArgumentCaptor<List<NotificationSettings>> captor = ArgumentCaptor.forClass(List.class);
            verify(notificationSettingsRepository).saveAll(captor.capture());

            List<NotificationSettings> saved = captor.getValue();
            assertThat(saved).allMatch(NotificationSettings::getEmailEnabled);
            assertThat(saved).allMatch(s -> s.getFrequency() == NotificationFrequency.IMMEDIATE);
            assertThat(saved).allMatch(s -> s.getUpdatedBy().equals(userId));
        }
    }

    @Nested
    @DisplayName("getEnabledSettings Tests")
    class GetEnabledSettingsTests {

        @Test
        @DisplayName("Should return only enabled settings")
        void shouldReturnOnlyEnabledSettings() {
            // Given
            when(notificationSettingsRepository.findByEmailEnabledTrue())
                .thenReturn(List.of(settings));

            // When
            List<NotificationSettings> result = notificationSettingsService.getEnabledSettings();

            // Then
            assertThat(result).hasSize(1);
            assertThat(result).allMatch(NotificationSettings::getEmailEnabled);
        }
    }

    @Nested
    @DisplayName("getSettingsByFrequency Tests")
    class GetSettingsByFrequencyTests {

        @Test
        @DisplayName("Should return settings by frequency")
        void shouldReturnSettingsByFrequency() {
            // Given
            when(notificationSettingsRepository.findByFrequency(NotificationFrequency.DAILY_DIGEST))
                .thenReturn(List.of());

            // When
            List<NotificationSettings> result = notificationSettingsService.getSettingsByFrequency(
                NotificationFrequency.DAILY_DIGEST
            );

            // Then
            verify(notificationSettingsRepository).findByFrequency(NotificationFrequency.DAILY_DIGEST);
        }
    }
}
