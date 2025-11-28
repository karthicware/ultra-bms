package com.ultrabms.service;

import com.ultrabms.dto.settings.AppearanceSettingsRequest;
import com.ultrabms.dto.settings.AppearanceSettingsResponse;
import com.ultrabms.entity.User;
import com.ultrabms.entity.enums.ThemePreference;
import com.ultrabms.exception.EntityNotFoundException;
import com.ultrabms.repository.UserRepository;
import com.ultrabms.service.impl.SettingsServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for SettingsServiceImpl.
 * Story 2.7: Admin Theme Settings & System Theme Support
 *
 * Tests theme preference retrieval and update logic.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("SettingsService Unit Tests")
class SettingsServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private SettingsServiceImpl settingsService;

    private UUID testUserId;
    private User testUser;

    @BeforeEach
    void setUp() {
        testUserId = UUID.randomUUID();
        testUser = new User();
        testUser.setId(testUserId);
        testUser.setEmail("test@ultrabms.com");
        testUser.setFirstName("Test");
        testUser.setLastName("User");
        testUser.setThemePreference(ThemePreference.SYSTEM);
    }

    // ==================== GET APPEARANCE SETTINGS TESTS ====================

    @Test
    @DisplayName("getAppearanceSettings - Should return SYSTEM theme preference for user with default")
    void getAppearanceSettingsShouldReturnSystemThemeForDefault() {
        // Arrange
        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));

        // Act
        AppearanceSettingsResponse response = settingsService.getAppearanceSettings(testUserId);

        // Assert
        assertThat(response).isNotNull();
        assertThat(response.getThemePreference()).isEqualTo(ThemePreference.SYSTEM);
        verify(userRepository, times(1)).findById(testUserId);
    }

    @Test
    @DisplayName("getAppearanceSettings - Should return LIGHT theme preference")
    void getAppearanceSettingsShouldReturnLightTheme() {
        // Arrange
        testUser.setThemePreference(ThemePreference.LIGHT);
        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));

        // Act
        AppearanceSettingsResponse response = settingsService.getAppearanceSettings(testUserId);

        // Assert
        assertThat(response.getThemePreference()).isEqualTo(ThemePreference.LIGHT);
    }

    @Test
    @DisplayName("getAppearanceSettings - Should return DARK theme preference")
    void getAppearanceSettingsShouldReturnDarkTheme() {
        // Arrange
        testUser.setThemePreference(ThemePreference.DARK);
        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));

        // Act
        AppearanceSettingsResponse response = settingsService.getAppearanceSettings(testUserId);

        // Assert
        assertThat(response.getThemePreference()).isEqualTo(ThemePreference.DARK);
    }

    @Test
    @DisplayName("getAppearanceSettings - Should throw EntityNotFoundException when user not found")
    void getAppearanceSettingsShouldThrowWhenUserNotFound() {
        // Arrange
        when(userRepository.findById(testUserId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> settingsService.getAppearanceSettings(testUserId))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("User not found");

        verify(userRepository, times(1)).findById(testUserId);
    }

    // ==================== UPDATE APPEARANCE SETTINGS TESTS ====================

    @Test
    @DisplayName("updateAppearanceSettings - Should update theme to DARK")
    void updateAppearanceSettingsShouldUpdateToDark() {
        // Arrange
        AppearanceSettingsRequest request = AppearanceSettingsRequest.builder()
                .themePreference(ThemePreference.DARK)
                .build();
        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        AppearanceSettingsResponse response = settingsService.updateAppearanceSettings(testUserId, request);

        // Assert
        assertThat(response).isNotNull();
        assertThat(response.getThemePreference()).isEqualTo(ThemePreference.DARK);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        assertThat(userCaptor.getValue().getThemePreference()).isEqualTo(ThemePreference.DARK);
    }

    @Test
    @DisplayName("updateAppearanceSettings - Should update theme to LIGHT")
    void updateAppearanceSettingsShouldUpdateToLight() {
        // Arrange
        testUser.setThemePreference(ThemePreference.DARK); // Start with DARK
        AppearanceSettingsRequest request = AppearanceSettingsRequest.builder()
                .themePreference(ThemePreference.LIGHT)
                .build();
        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        AppearanceSettingsResponse response = settingsService.updateAppearanceSettings(testUserId, request);

        // Assert
        assertThat(response.getThemePreference()).isEqualTo(ThemePreference.LIGHT);
    }

    @Test
    @DisplayName("updateAppearanceSettings - Should update theme to SYSTEM")
    void updateAppearanceSettingsShouldUpdateToSystem() {
        // Arrange
        testUser.setThemePreference(ThemePreference.DARK); // Start with DARK
        AppearanceSettingsRequest request = AppearanceSettingsRequest.builder()
                .themePreference(ThemePreference.SYSTEM)
                .build();
        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        AppearanceSettingsResponse response = settingsService.updateAppearanceSettings(testUserId, request);

        // Assert
        assertThat(response.getThemePreference()).isEqualTo(ThemePreference.SYSTEM);
    }

    @Test
    @DisplayName("updateAppearanceSettings - Should throw EntityNotFoundException when user not found")
    void updateAppearanceSettingsShouldThrowWhenUserNotFound() {
        // Arrange
        AppearanceSettingsRequest request = AppearanceSettingsRequest.builder()
                .themePreference(ThemePreference.DARK)
                .build();
        when(userRepository.findById(testUserId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> settingsService.updateAppearanceSettings(testUserId, request))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("User not found");

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("updateAppearanceSettings - Should persist changes to database")
    void updateAppearanceSettingsShouldPersistChanges() {
        // Arrange
        AppearanceSettingsRequest request = AppearanceSettingsRequest.builder()
                .themePreference(ThemePreference.DARK)
                .build();
        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        settingsService.updateAppearanceSettings(testUserId, request);

        // Assert
        verify(userRepository, times(1)).save(testUser);
    }

    @Test
    @DisplayName("updateAppearanceSettings - Should handle sequential updates correctly")
    void updateAppearanceSettingsShouldHandleSequentialUpdates() {
        // Arrange
        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act - First update to DARK
        AppearanceSettingsRequest darkRequest = AppearanceSettingsRequest.builder()
                .themePreference(ThemePreference.DARK)
                .build();
        AppearanceSettingsResponse darkResponse = settingsService.updateAppearanceSettings(testUserId, darkRequest);

        // Act - Second update to LIGHT
        AppearanceSettingsRequest lightRequest = AppearanceSettingsRequest.builder()
                .themePreference(ThemePreference.LIGHT)
                .build();
        AppearanceSettingsResponse lightResponse = settingsService.updateAppearanceSettings(testUserId, lightRequest);

        // Assert
        assertThat(darkResponse.getThemePreference()).isEqualTo(ThemePreference.DARK);
        assertThat(lightResponse.getThemePreference()).isEqualTo(ThemePreference.LIGHT);
        verify(userRepository, times(2)).save(any(User.class));
    }

    // ==================== THEME PREFERENCE ENUM TESTS ====================

    @Test
    @DisplayName("ThemePreference enum - Should have exactly three values")
    void themePreferenceEnumShouldHaveThreeValues() {
        // Assert
        assertThat(ThemePreference.values()).hasSize(3);
        assertThat(ThemePreference.values()).containsExactlyInAnyOrder(
                ThemePreference.SYSTEM,
                ThemePreference.LIGHT,
                ThemePreference.DARK
        );
    }

    @Test
    @DisplayName("Default theme preference should be SYSTEM")
    void defaultThemePreferenceShouldBeSystem() {
        // Arrange
        User newUser = new User();

        // Assert - Default from entity
        assertThat(newUser.getThemePreference()).isEqualTo(ThemePreference.SYSTEM);
    }
}
