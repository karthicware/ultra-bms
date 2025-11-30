package com.ultrabms.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ultrabms.dto.settings.AppearanceSettingsRequest;
import com.ultrabms.dto.settings.AppearanceSettingsResponse;
import com.ultrabms.entity.Role;
import com.ultrabms.entity.User;
import com.ultrabms.entity.enums.ThemePreference;
import com.ultrabms.exception.EntityNotFoundException;
import com.ultrabms.repository.UserRepository;
import com.ultrabms.service.SettingsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.HashSet;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for SettingsController.
 * Story 2.7: Admin Theme Settings & System Theme Support
 *
 * Tests appearance settings endpoints with MockMvc.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("SettingsController Integration Tests")
class SettingsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private SettingsService settingsService;

    @MockitoBean
    private UserRepository userRepository;

    private UUID testUserId;
    private AppearanceSettingsResponse settingsResponse;
    private AppearanceSettingsRequest settingsRequest;

    @BeforeEach
    void setUp() {
        testUserId = UUID.randomUUID();

        settingsResponse = AppearanceSettingsResponse.builder()
                .themePreference(ThemePreference.SYSTEM)
                .build();

        settingsRequest = AppearanceSettingsRequest.builder()
                .themePreference(ThemePreference.DARK)
                .build();

        // Mock UserRepository for all test user IDs used in @WithMockUser annotations
        setupUserMock("550e8400-e29b-41d4-a716-446655440000");
        setupUserMock("550e8400-e29b-41d4-a716-446655440001");
        setupUserMock("550e8400-e29b-41d4-a716-446655440002");
        setupUserMock("550e8400-e29b-41d4-a716-446655440003");
    }

    private void setupUserMock(String userId) {
        UUID id = UUID.fromString(userId);
        Role userRole = new Role();
        userRole.setId(2L);
        userRole.setName("USER");
        userRole.setPermissions(new HashSet<>());

        User user = new User();
        user.setId(id);
        user.setEmail(userId); // username in @WithMockUser
        user.setFirstName("Test");
        user.setLastName("User");
        user.setRole(userRole);
        user.setActive(true);

        when(userRepository.findByEmail(userId)).thenReturn(Optional.of(user));
    }

    // ==================== GET APPEARANCE SETTINGS TESTS ====================

    @Test
    @DisplayName("GET /api/v1/settings/appearance - Should return 200 OK with current settings")
    @WithMockUser(username = "550e8400-e29b-41d4-a716-446655440000")
    void getAppearanceSettingsShouldReturn200WithSettings() throws Exception {
        // Arrange
        UUID userId = UUID.fromString("550e8400-e29b-41d4-a716-446655440000");
        when(settingsService.getAppearanceSettings(eq(userId))).thenReturn(settingsResponse);

        // Act & Assert
        mockMvc.perform(get("/api/v1/settings/appearance"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.themePreference").value("SYSTEM"))
                .andExpect(jsonPath("$.timestamp").exists());

        verify(settingsService, times(1)).getAppearanceSettings(eq(userId));
    }

    @Test
    @DisplayName("GET /api/v1/settings/appearance - Should return 401 when not authenticated")
    void getAppearanceSettingsShouldReturn401WhenNotAuthenticated() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/v1/settings/appearance"))
                .andExpect(status().isUnauthorized());

        verify(settingsService, never()).getAppearanceSettings(any());
    }

    @Test
    @DisplayName("GET /api/v1/settings/appearance - Should return LIGHT theme preference")
    @WithMockUser(username = "550e8400-e29b-41d4-a716-446655440001")
    void getAppearanceSettingsShouldReturnLightTheme() throws Exception {
        // Arrange
        UUID userId = UUID.fromString("550e8400-e29b-41d4-a716-446655440001");
        AppearanceSettingsResponse lightResponse = AppearanceSettingsResponse.builder()
                .themePreference(ThemePreference.LIGHT)
                .build();
        when(settingsService.getAppearanceSettings(eq(userId))).thenReturn(lightResponse);

        // Act & Assert
        mockMvc.perform(get("/api/v1/settings/appearance"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.themePreference").value("LIGHT"));
    }

    @Test
    @DisplayName("GET /api/v1/settings/appearance - Should return DARK theme preference")
    @WithMockUser(username = "550e8400-e29b-41d4-a716-446655440002")
    void getAppearanceSettingsShouldReturnDarkTheme() throws Exception {
        // Arrange
        UUID userId = UUID.fromString("550e8400-e29b-41d4-a716-446655440002");
        AppearanceSettingsResponse darkResponse = AppearanceSettingsResponse.builder()
                .themePreference(ThemePreference.DARK)
                .build();
        when(settingsService.getAppearanceSettings(eq(userId))).thenReturn(darkResponse);

        // Act & Assert
        mockMvc.perform(get("/api/v1/settings/appearance"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.themePreference").value("DARK"));
    }

    @Test
    @DisplayName("GET /api/v1/settings/appearance - Should return 404 when user not found")
    @WithMockUser(username = "550e8400-e29b-41d4-a716-446655440003")
    void getAppearanceSettingsShouldReturn404WhenUserNotFound() throws Exception {
        // Arrange
        UUID userId = UUID.fromString("550e8400-e29b-41d4-a716-446655440003");
        when(settingsService.getAppearanceSettings(eq(userId)))
                .thenThrow(new EntityNotFoundException("User not found"));

        // Act & Assert
        mockMvc.perform(get("/api/v1/settings/appearance"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Not Found"));
    }

    // ==================== PUT APPEARANCE SETTINGS TESTS ====================

    @Test
    @DisplayName("PUT /api/v1/settings/appearance - Should return 200 OK when updating to DARK theme")
    @WithMockUser(username = "550e8400-e29b-41d4-a716-446655440000")
    void updateAppearanceSettingsShouldReturn200WhenUpdatingToDark() throws Exception {
        // Arrange
        UUID userId = UUID.fromString("550e8400-e29b-41d4-a716-446655440000");
        AppearanceSettingsResponse updatedResponse = AppearanceSettingsResponse.builder()
                .themePreference(ThemePreference.DARK)
                .build();
        when(settingsService.updateAppearanceSettings(eq(userId), any(AppearanceSettingsRequest.class)))
                .thenReturn(updatedResponse);

        // Act & Assert
        mockMvc.perform(put("/api/v1/settings/appearance")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(settingsRequest)))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.themePreference").value("DARK"))
                .andExpect(jsonPath("$.message").value("Appearance settings updated successfully"))
                .andExpect(jsonPath("$.timestamp").exists());

        verify(settingsService, times(1)).updateAppearanceSettings(eq(userId), any(AppearanceSettingsRequest.class));
    }

    @Test
    @DisplayName("PUT /api/v1/settings/appearance - Should return 200 OK when updating to LIGHT theme")
    @WithMockUser(username = "550e8400-e29b-41d4-a716-446655440000")
    void updateAppearanceSettingsShouldReturn200WhenUpdatingToLight() throws Exception {
        // Arrange
        UUID userId = UUID.fromString("550e8400-e29b-41d4-a716-446655440000");
        AppearanceSettingsRequest lightRequest = AppearanceSettingsRequest.builder()
                .themePreference(ThemePreference.LIGHT)
                .build();
        AppearanceSettingsResponse lightResponse = AppearanceSettingsResponse.builder()
                .themePreference(ThemePreference.LIGHT)
                .build();
        when(settingsService.updateAppearanceSettings(eq(userId), any(AppearanceSettingsRequest.class)))
                .thenReturn(lightResponse);

        // Act & Assert
        mockMvc.perform(put("/api/v1/settings/appearance")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(lightRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.themePreference").value("LIGHT"));
    }

    @Test
    @DisplayName("PUT /api/v1/settings/appearance - Should return 200 OK when updating to SYSTEM theme")
    @WithMockUser(username = "550e8400-e29b-41d4-a716-446655440000")
    void updateAppearanceSettingsShouldReturn200WhenUpdatingToSystem() throws Exception {
        // Arrange
        UUID userId = UUID.fromString("550e8400-e29b-41d4-a716-446655440000");
        AppearanceSettingsRequest systemRequest = AppearanceSettingsRequest.builder()
                .themePreference(ThemePreference.SYSTEM)
                .build();
        AppearanceSettingsResponse systemResponse = AppearanceSettingsResponse.builder()
                .themePreference(ThemePreference.SYSTEM)
                .build();
        when(settingsService.updateAppearanceSettings(eq(userId), any(AppearanceSettingsRequest.class)))
                .thenReturn(systemResponse);

        // Act & Assert
        mockMvc.perform(put("/api/v1/settings/appearance")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(systemRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.themePreference").value("SYSTEM"));
    }

    @Test
    @DisplayName("PUT /api/v1/settings/appearance - Should return 401 when not authenticated")
    void updateAppearanceSettingsShouldReturn401WhenNotAuthenticated() throws Exception {
        // Act & Assert
        mockMvc.perform(put("/api/v1/settings/appearance")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(settingsRequest)))
                .andExpect(status().isUnauthorized());

        verify(settingsService, never()).updateAppearanceSettings(any(), any());
    }

    @Test
    @DisplayName("PUT /api/v1/settings/appearance - Should return 400 when theme preference is null")
    @WithMockUser(username = "550e8400-e29b-41d4-a716-446655440000")
    void updateAppearanceSettingsShouldReturn400WhenThemePreferenceIsNull() throws Exception {
        // Arrange - Request with null theme preference
        String invalidJson = "{\"themePreference\": null}";

        // Act & Assert
        mockMvc.perform(put("/api/v1/settings/appearance")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest());

        verify(settingsService, never()).updateAppearanceSettings(any(), any());
    }

    @Test
    @DisplayName("PUT /api/v1/settings/appearance - Should return 400 when request body is empty")
    @WithMockUser(username = "550e8400-e29b-41d4-a716-446655440000")
    void updateAppearanceSettingsShouldReturn400WhenRequestBodyIsEmpty() throws Exception {
        // Act & Assert
        mockMvc.perform(put("/api/v1/settings/appearance")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());

        verify(settingsService, never()).updateAppearanceSettings(any(), any());
    }

    @Test
    @DisplayName("PUT /api/v1/settings/appearance - Should reject invalid theme preference value")
    @WithMockUser(username = "550e8400-e29b-41d4-a716-446655440000")
    void updateAppearanceSettingsShouldRejectInvalidThemePreference() throws Exception {
        // Arrange - Invalid enum value causes Jackson deserialization failure
        String invalidJson = "{\"themePreference\": \"INVALID\"}";

        // Act & Assert - Invalid enum values cause deserialization error (500 - internal server error)
        // Jackson cannot deserialize invalid enum values
        mockMvc.perform(put("/api/v1/settings/appearance")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isInternalServerError());

        verify(settingsService, never()).updateAppearanceSettings(any(), any());
    }

    @Test
    @DisplayName("PUT /api/v1/settings/appearance - Should return 404 when user not found")
    @WithMockUser(username = "550e8400-e29b-41d4-a716-446655440003")
    void updateAppearanceSettingsShouldReturn404WhenUserNotFound() throws Exception {
        // Arrange
        UUID userId = UUID.fromString("550e8400-e29b-41d4-a716-446655440003");
        when(settingsService.updateAppearanceSettings(eq(userId), any(AppearanceSettingsRequest.class)))
                .thenThrow(new EntityNotFoundException("User not found"));

        // Act & Assert
        mockMvc.perform(put("/api/v1/settings/appearance")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(settingsRequest)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Not Found"));
    }

    // ==================== RBAC TESTS ====================

    @Test
    @DisplayName("Any authenticated user can access appearance settings (AC#11)")
    @WithMockUser(username = "550e8400-e29b-41d4-a716-446655440000", roles = {"TENANT"})
    void anyAuthenticatedUserCanAccessAppearanceSettings() throws Exception {
        // Arrange
        UUID userId = UUID.fromString("550e8400-e29b-41d4-a716-446655440000");
        when(settingsService.getAppearanceSettings(eq(userId))).thenReturn(settingsResponse);

        // Act & Assert - Even TENANT role can access
        mockMvc.perform(get("/api/v1/settings/appearance"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Property Manager can access appearance settings (AC#11)")
    @WithMockUser(username = "550e8400-e29b-41d4-a716-446655440000", roles = {"PROPERTY_MANAGER"})
    void propertyManagerCanAccessAppearanceSettings() throws Exception {
        // Arrange
        UUID userId = UUID.fromString("550e8400-e29b-41d4-a716-446655440000");
        when(settingsService.getAppearanceSettings(eq(userId))).thenReturn(settingsResponse);

        // Act & Assert
        mockMvc.perform(get("/api/v1/settings/appearance"))
                .andExpect(status().isOk());
    }
}
