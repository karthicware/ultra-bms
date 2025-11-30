package com.ultrabms.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ultrabms.dto.user.AvatarUploadResponse;
import com.ultrabms.dto.user.UserProfileResponse;
import com.ultrabms.dto.user.UserProfileUpdateRequest;
import com.ultrabms.entity.Role;
import com.ultrabms.entity.User;
import com.ultrabms.exception.EntityNotFoundException;
import com.ultrabms.exception.ValidationException;
import com.ultrabms.repository.UserRepository;
import com.ultrabms.service.UserProfileService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for UserProfileController.
 * Story 2.9: User Profile Customization
 *
 * Tests user profile endpoints with MockMvc.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("UserProfileController Integration Tests")
class UserProfileControllerTest {

    private static final String TEST_USER_ID = "550e8400-e29b-41d4-a716-446655440000";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private UserProfileService userProfileService;

    @MockitoBean
    private UserRepository userRepository;

    private UUID testUserId;
    private User testUser;
    private UserProfileResponse profileResponse;
    private UserProfileUpdateRequest updateRequest;
    private AvatarUploadResponse avatarResponse;

    @BeforeEach
    void setUp() {
        testUserId = UUID.fromString(TEST_USER_ID);

        // Create test user for getCurrentUserId() lookup
        Role userRole = new Role();
        userRole.setId(2L);
        userRole.setName("PROPERTY_MANAGER");
        userRole.setPermissions(new HashSet<>());

        testUser = new User();
        testUser.setId(testUserId);
        testUser.setEmail(TEST_USER_ID); // username in @WithMockUser
        testUser.setFirstName("John");
        testUser.setLastName("Doe");
        testUser.setRole(userRole);
        testUser.setActive(true);

        // Mock UserRepository to return user for getCurrentUserId()
        when(userRepository.findByEmail(TEST_USER_ID)).thenReturn(Optional.of(testUser));

        profileResponse = UserProfileResponse.builder()
                .id(testUserId)
                .email("john.doe@ultrabms.com")
                .firstName("John")
                .lastName("Doe")
                .displayName("Johnny D.")
                .avatarUrl("https://s3.amazonaws.com/bucket/avatar.jpg")
                .contactPhone("+971501234567")
                .role("PROPERTY_MANAGER")
                .build();

        updateRequest = UserProfileUpdateRequest.builder()
                .displayName("Johnny D.")
                .contactPhone("+971501234567")
                .build();

        avatarResponse = AvatarUploadResponse.builder()
                .avatarUrl("https://s3.amazonaws.com/bucket/avatar.jpg")
                .message("Avatar uploaded successfully")
                .build();
    }

    // ==================== GET PROFILE TESTS ====================

    @Test
    @DisplayName("GET /api/v1/users/me/profile - Should return 200 OK with profile")
    @WithMockUser(username = TEST_USER_ID, roles = {"PROPERTY_MANAGER"})
    void getProfileShouldReturn200WithProfile() throws Exception {
        // Arrange
        when(userProfileService.getProfile(eq(testUserId))).thenReturn(profileResponse);

        // Act & Assert
        mockMvc.perform(get("/api/v1/users/me/profile"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(TEST_USER_ID))
                .andExpect(jsonPath("$.data.email").value("john.doe@ultrabms.com"))
                .andExpect(jsonPath("$.data.firstName").value("John"))
                .andExpect(jsonPath("$.data.lastName").value("Doe"))
                .andExpect(jsonPath("$.data.displayName").value("Johnny D."))
                .andExpect(jsonPath("$.data.avatarUrl").value("https://s3.amazonaws.com/bucket/avatar.jpg"))
                .andExpect(jsonPath("$.data.contactPhone").value("+971501234567"))
                .andExpect(jsonPath("$.data.role").value("PROPERTY_MANAGER"))
                .andExpect(jsonPath("$.timestamp").exists());

        verify(userProfileService, times(1)).getProfile(eq(testUserId));
    }

    @Test
    @DisplayName("GET /api/v1/users/me/profile - Should return 401 when not authenticated")
    void getProfileShouldReturn401WhenNotAuthenticated() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/v1/users/me/profile"))
                .andExpect(status().isUnauthorized());

        verify(userProfileService, never()).getProfile(any());
    }

    @Test
    @DisplayName("GET /api/v1/users/me/profile - Should return 403 for TENANT role")
    @WithMockUser(username = TEST_USER_ID, roles = {"TENANT"})
    void getProfileShouldReturn403ForTenant() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/v1/users/me/profile"))
                .andExpect(status().isForbidden());

        verify(userProfileService, never()).getProfile(any());
    }

    // ==================== UPDATE PROFILE TESTS ====================

    @Test
    @DisplayName("PUT /api/v1/users/me/profile - Should return 200 OK when update successful")
    @WithMockUser(username = TEST_USER_ID, roles = {"PROPERTY_MANAGER"})
    void updateProfileShouldReturn200WhenSuccessful() throws Exception {
        // Arrange
        when(userProfileService.updateProfile(eq(testUserId), any(UserProfileUpdateRequest.class)))
                .thenReturn(profileResponse);

        // Act & Assert
        mockMvc.perform(put("/api/v1/users/me/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.displayName").value("Johnny D."))
                .andExpect(jsonPath("$.message").value("Profile updated successfully"));

        verify(userProfileService, times(1)).updateProfile(eq(testUserId), any(UserProfileUpdateRequest.class));
    }

    @Test
    @DisplayName("PUT /api/v1/users/me/profile - Should return 400 when displayName too long")
    @WithMockUser(username = TEST_USER_ID, roles = {"PROPERTY_MANAGER"})
    void updateProfileShouldReturn400WhenDisplayNameTooLong() throws Exception {
        // Arrange
        String longDisplayName = "A".repeat(101);
        UserProfileUpdateRequest invalidRequest = UserProfileUpdateRequest.builder()
                .displayName(longDisplayName)
                .build();

        // Act & Assert
        mockMvc.perform(put("/api/v1/users/me/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());

        verify(userProfileService, never()).updateProfile(any(), any());
    }

    @Test
    @DisplayName("PUT /api/v1/users/me/profile - Should return 401 when not authenticated")
    void updateProfileShouldReturn401WhenNotAuthenticated() throws Exception {
        // Act & Assert
        mockMvc.perform(put("/api/v1/users/me/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isUnauthorized());

        verify(userProfileService, never()).updateProfile(any(), any());
    }

    // ==================== UPLOAD AVATAR TESTS ====================

    @Test
    @DisplayName("POST /api/v1/users/me/avatar - Should return 200 OK when upload successful")
    @WithMockUser(username = TEST_USER_ID, roles = {"PROPERTY_MANAGER"})
    void uploadAvatarShouldReturn200WhenSuccessful() throws Exception {
        // Arrange
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "avatar.jpg",
                "image/jpeg",
                new byte[1024]
        );

        when(userProfileService.uploadAvatar(eq(testUserId), any())).thenReturn(avatarResponse);

        // Act & Assert
        mockMvc.perform(multipart("/api/v1/users/me/avatar")
                        .file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.avatarUrl").value("https://s3.amazonaws.com/bucket/avatar.jpg"))
                .andExpect(jsonPath("$.message").value("Avatar uploaded successfully"));

        verify(userProfileService, times(1)).uploadAvatar(eq(testUserId), any());
    }

    @Test
    @DisplayName("POST /api/v1/users/me/avatar - Should return 400 when file validation fails")
    @WithMockUser(username = TEST_USER_ID, roles = {"PROPERTY_MANAGER"})
    void uploadAvatarShouldReturn400WhenValidationFails() throws Exception {
        // Arrange
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "document.pdf",
                "application/pdf",
                new byte[1024]
        );

        when(userProfileService.uploadAvatar(eq(testUserId), any()))
                .thenThrow(new ValidationException("Avatar must be PNG or JPG format"));

        // Act & Assert
        mockMvc.perform(multipart("/api/v1/users/me/avatar")
                        .file(file))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/v1/users/me/avatar - Should return 401 when not authenticated")
    void uploadAvatarShouldReturn401WhenNotAuthenticated() throws Exception {
        // Arrange
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "avatar.jpg",
                "image/jpeg",
                new byte[1024]
        );

        // Act & Assert
        mockMvc.perform(multipart("/api/v1/users/me/avatar")
                        .file(file))
                .andExpect(status().isUnauthorized());

        verify(userProfileService, never()).uploadAvatar(any(), any());
    }

    // ==================== DELETE AVATAR TESTS ====================

    @Test
    @DisplayName("DELETE /api/v1/users/me/avatar - Should return 204 No Content when successful")
    @WithMockUser(username = TEST_USER_ID, roles = {"PROPERTY_MANAGER"})
    void deleteAvatarShouldReturn204WhenSuccessful() throws Exception {
        // Arrange
        doNothing().when(userProfileService).deleteAvatar(eq(testUserId));

        // Act & Assert
        mockMvc.perform(delete("/api/v1/users/me/avatar"))
                .andExpect(status().isNoContent());

        verify(userProfileService, times(1)).deleteAvatar(eq(testUserId));
    }

    @Test
    @DisplayName("DELETE /api/v1/users/me/avatar - Should return 401 when not authenticated")
    void deleteAvatarShouldReturn401WhenNotAuthenticated() throws Exception {
        // Act & Assert
        mockMvc.perform(delete("/api/v1/users/me/avatar"))
                .andExpect(status().isUnauthorized());

        verify(userProfileService, never()).deleteAvatar(any());
    }

    @Test
    @DisplayName("DELETE /api/v1/users/me/avatar - Should return 403 for TENANT role")
    @WithMockUser(username = TEST_USER_ID, roles = {"TENANT"})
    void deleteAvatarShouldReturn403ForTenant() throws Exception {
        // Act & Assert
        mockMvc.perform(delete("/api/v1/users/me/avatar"))
                .andExpect(status().isForbidden());

        verify(userProfileService, never()).deleteAvatar(any());
    }

    // ==================== ROLE ACCESS TESTS ====================

    @Test
    @DisplayName("GET /api/v1/users/me/profile - Should allow SUPER_ADMIN access")
    @WithMockUser(username = TEST_USER_ID, roles = {"SUPER_ADMIN"})
    void getProfileShouldAllowSuperAdmin() throws Exception {
        // Arrange
        when(userProfileService.getProfile(eq(testUserId))).thenReturn(profileResponse);

        // Act & Assert
        mockMvc.perform(get("/api/v1/users/me/profile"))
                .andExpect(status().isOk());

        verify(userProfileService, times(1)).getProfile(eq(testUserId));
    }

    @Test
    @DisplayName("GET /api/v1/users/me/profile - Should allow FINANCE_MANAGER access")
    @WithMockUser(username = TEST_USER_ID, roles = {"FINANCE_MANAGER"})
    void getProfileShouldAllowFinanceManager() throws Exception {
        // Arrange
        when(userProfileService.getProfile(eq(testUserId))).thenReturn(profileResponse);

        // Act & Assert
        mockMvc.perform(get("/api/v1/users/me/profile"))
                .andExpect(status().isOk());

        verify(userProfileService, times(1)).getProfile(eq(testUserId));
    }

    @Test
    @DisplayName("GET /api/v1/users/me/profile - Should allow MAINTENANCE_SUPERVISOR access")
    @WithMockUser(username = TEST_USER_ID, roles = {"MAINTENANCE_SUPERVISOR"})
    void getProfileShouldAllowMaintenanceSupervisor() throws Exception {
        // Arrange
        when(userProfileService.getProfile(eq(testUserId))).thenReturn(profileResponse);

        // Act & Assert
        mockMvc.perform(get("/api/v1/users/me/profile"))
                .andExpect(status().isOk());

        verify(userProfileService, times(1)).getProfile(eq(testUserId));
    }
}
