package com.ultrabms.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ultrabms.dto.admin.AdminUserCreateRequest;
import com.ultrabms.dto.admin.AdminUserResponse;
import com.ultrabms.dto.admin.AdminUserUpdateRequest;
import com.ultrabms.entity.Role;
import com.ultrabms.entity.User;
import com.ultrabms.entity.enums.UserStatus;
import com.ultrabms.exception.DuplicateResourceException;
import com.ultrabms.exception.EntityNotFoundException;
import com.ultrabms.exception.ValidationException;
import com.ultrabms.repository.UserRepository;
import com.ultrabms.service.AdminUserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.mockito.Mockito.lenient;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for AdminUserController.
 * Story 2.6: Admin User Management
 *
 * Tests all admin user management endpoints with MockMvc.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("AdminUserController Integration Tests")
class AdminUserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private AdminUserService adminUserService;

    @MockitoBean
    private UserRepository userRepository;

    private AdminUserResponse testUserResponse;
    private AdminUserCreateRequest createRequest;
    private AdminUserUpdateRequest updateRequest;
    private UUID testUserId;
    private UUID adminUserId;
    private User adminUser;
    private static final String BASE_URL = "/api/v1/admin/users";
    private static final String ADMIN_EMAIL = "user"; // Default username from @WithMockUser

    @BeforeEach
    void setUp() {
        testUserId = UUID.randomUUID();
        adminUserId = UUID.randomUUID();

        // Create admin user for getCurrentUserId() lookup
        Role adminRole = new Role();
        adminRole.setId(2L);
        adminRole.setName("PROPERTY_MANAGER");
        adminRole.setPermissions(new HashSet<>());

        adminUser = new User();
        adminUser.setId(adminUserId);
        adminUser.setEmail(ADMIN_EMAIL);
        adminUser.setFirstName("Admin");
        adminUser.setLastName("User");
        adminUser.setRole(adminRole);
        adminUser.setActive(true);
        adminUser.setStatus(UserStatus.ACTIVE);

        // Mock userRepository.findByEmail for all tests that need current user
        lenient().when(userRepository.findByEmail(ADMIN_EMAIL)).thenReturn(Optional.of(adminUser));

        testUserResponse = AdminUserResponse.builder()
                .id(testUserId)
                .firstName("Test")
                .lastName("User")
                .email("test@ultrabms.com")
                .phone("+971501234567")
                .role("PROPERTY_MANAGER")
                .roleId(2L)
                .status(UserStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        createRequest = AdminUserCreateRequest.builder()
                .firstName("New")
                .lastName("User")
                .email("newuser@ultrabms.com")
                .phone("+971502222222")
                .roleId(2L)
                .temporaryPassword("TempP@ss123!")
                .build();

        updateRequest = AdminUserUpdateRequest.builder()
                .firstName("Updated")
                .lastName("Name")
                .phone("+971503333333")
                .roleId(2L)
                .build();
    }

    // ==================== LIST USERS TESTS ====================

    @Nested
    @DisplayName("GET /api/v1/admin/users - List Users")
    class ListUsersTests {

        @Test
        @DisplayName("Should return 200 OK with paginated users")
        @WithMockUser(authorities = "users:read")
        void shouldReturnPaginatedUsers() throws Exception {
            // Arrange
            Page<AdminUserResponse> userPage = new PageImpl<>(
                    List.of(testUserResponse),
                    PageRequest.of(0, 20),
                    1
            );
            when(adminUserService.listUsers(any(), any(), any(), any())).thenReturn(userPage);

            // Act & Assert
            mockMvc.perform(get(BASE_URL)
                            .param("page", "0")
                            .param("size", "20"))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.content").isArray())
                    .andExpect(jsonPath("$.content", hasSize(1)))
                    .andExpect(jsonPath("$.content[0].email").value("test@ultrabms.com"))
                    .andExpect(jsonPath("$.totalElements").value(1));
        }

        @Test
        @DisplayName("Should return 200 OK with search filter")
        @WithMockUser(authorities = "users:read")
        void shouldReturnUsersWithSearchFilter() throws Exception {
            // Arrange
            Page<AdminUserResponse> userPage = new PageImpl<>(
                    List.of(testUserResponse),
                    PageRequest.of(0, 20),
                    1
            );
            when(adminUserService.listUsers(eq("test"), any(), any(), any())).thenReturn(userPage);

            // Act & Assert
            mockMvc.perform(get(BASE_URL)
                            .param("search", "test"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content[0].email").value("test@ultrabms.com"));
        }

        @Test
        @DisplayName("Should return 403 Forbidden without users:read permission")
        @WithMockUser(authorities = "other:permission")
        void shouldReturn403WithoutPermission() throws Exception {
            mockMvc.perform(get(BASE_URL))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("Should return 401 Unauthorized without authentication")
        void shouldReturn401WithoutAuth() throws Exception {
            mockMvc.perform(get(BASE_URL))
                    .andExpect(status().isUnauthorized());
        }
    }

    // ==================== GET USER BY ID TESTS ====================

    @Nested
    @DisplayName("GET /api/v1/admin/users/{id} - Get User By ID")
    class GetUserByIdTests {

        @Test
        @DisplayName("Should return 200 OK with user details")
        @WithMockUser(authorities = "users:read")
        void shouldReturnUserById() throws Exception {
            // Arrange
            when(adminUserService.getUserById(testUserId)).thenReturn(testUserResponse);

            // Act & Assert
            mockMvc.perform(get(BASE_URL + "/" + testUserId))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.id").value(testUserId.toString()))
                    .andExpect(jsonPath("$.email").value("test@ultrabms.com"))
                    .andExpect(jsonPath("$.firstName").value("Test"))
                    .andExpect(jsonPath("$.status").value("ACTIVE"));
        }

        @Test
        @DisplayName("Should return 404 Not Found when user doesn't exist")
        @WithMockUser(authorities = "users:read")
        void shouldReturn404WhenUserNotFound() throws Exception {
            // Arrange
            UUID nonExistentId = UUID.randomUUID();
            when(adminUserService.getUserById(nonExistentId))
                    .thenThrow(new EntityNotFoundException("User not found: " + nonExistentId));

            // Act & Assert
            mockMvc.perform(get(BASE_URL + "/" + nonExistentId))
                    .andExpect(status().isNotFound());
        }
    }

    // ==================== CREATE USER TESTS ====================

    @Nested
    @DisplayName("POST /api/v1/admin/users - Create User")
    class CreateUserTests {

        @Test
        @DisplayName("Should return 201 Created with valid request")
        @WithMockUser(authorities = "users:create")
        void shouldReturn201WithValidRequest() throws Exception {
            // Arrange
            when(adminUserService.createUser(any(), any(), any())).thenReturn(testUserResponse);

            // Act & Assert
            mockMvc.perform(post(BASE_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(createRequest)))
                    .andExpect(status().isCreated())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.email").value("test@ultrabms.com"))
                    .andExpect(jsonPath("$.status").value("ACTIVE"));
        }

        @Test
        @DisplayName("Should return 400 Bad Request with missing required fields")
        @WithMockUser(authorities = "users:create")
        void shouldReturn400WithMissingFields() throws Exception {
            // Arrange - missing email
            AdminUserCreateRequest invalidRequest = AdminUserCreateRequest.builder()
                    .firstName("New")
                    .lastName("User")
                    .roleId(2L)
                    .temporaryPassword("TempP@ss123!")
                    .build();

            // Act & Assert
            mockMvc.perform(post(BASE_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(invalidRequest)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Should return 409 Conflict when email already exists")
        @WithMockUser(authorities = "users:create")
        void shouldReturn409WhenEmailExists() throws Exception {
            // Arrange
            when(adminUserService.createUser(any(), any(), any()))
                    .thenThrow(new DuplicateResourceException("User", "email", createRequest.getEmail()));

            // Act & Assert
            mockMvc.perform(post(BASE_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(createRequest)))
                    .andExpect(status().isConflict());
        }

        @Test
        @DisplayName("Should return 403 Forbidden when non-SUPER_ADMIN creates SUPER_ADMIN")
        @WithMockUser(authorities = "users:create")
        void shouldReturn403WhenCreatingSuperAdminWithoutPermission() throws Exception {
            // Arrange
            AdminUserCreateRequest superAdminRequest = AdminUserCreateRequest.builder()
                    .firstName("Super")
                    .lastName("Admin")
                    .email("superadmin@ultrabms.com")
                    .roleId(1L) // SUPER_ADMIN
                    .temporaryPassword("TempP@ss123!")
                    .build();

            when(adminUserService.createUser(any(), any(), any()))
                    .thenThrow(new AccessDeniedException("Only SUPER_ADMIN can create other SUPER_ADMIN users"));

            // Act & Assert
            mockMvc.perform(post(BASE_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(superAdminRequest)))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("Should return 403 Forbidden without users:create permission")
        @WithMockUser(authorities = "users:read")
        void shouldReturn403WithoutCreatePermission() throws Exception {
            mockMvc.perform(post(BASE_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(createRequest)))
                    .andExpect(status().isForbidden());
        }
    }

    // ==================== UPDATE USER TESTS ====================

    @Nested
    @DisplayName("PUT /api/v1/admin/users/{id} - Update User")
    class UpdateUserTests {

        @Test
        @DisplayName("Should return 200 OK with updated user")
        @WithMockUser(authorities = "users:update")
        void shouldReturn200WithUpdatedUser() throws Exception {
            // Arrange
            AdminUserResponse updatedResponse = AdminUserResponse.builder()
                    .id(testUserId)
                    .firstName("Updated")
                    .lastName("Name")
                    .email("test@ultrabms.com")
                    .phone("+971503333333")
                    .role("PROPERTY_MANAGER")
                    .roleId(2L)
                    .status(UserStatus.ACTIVE)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();

            when(adminUserService.updateUser(eq(testUserId), any(), any(), any())).thenReturn(updatedResponse);

            // Act & Assert
            mockMvc.perform(put(BASE_URL + "/" + testUserId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(updateRequest)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.firstName").value("Updated"))
                    .andExpect(jsonPath("$.lastName").value("Name"));
        }

        @Test
        @DisplayName("Should return 404 Not Found when user doesn't exist")
        @WithMockUser(authorities = "users:update")
        void shouldReturn404WhenUserNotFound() throws Exception {
            // Arrange
            UUID nonExistentId = UUID.randomUUID();
            when(adminUserService.updateUser(eq(nonExistentId), any(), any(), any()))
                    .thenThrow(new EntityNotFoundException("User not found: " + nonExistentId));

            // Act & Assert
            mockMvc.perform(put(BASE_URL + "/" + nonExistentId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(updateRequest)))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("Should return 403 Forbidden without users:update permission")
        @WithMockUser(authorities = "users:read")
        void shouldReturn403WithoutUpdatePermission() throws Exception {
            mockMvc.perform(put(BASE_URL + "/" + testUserId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(updateRequest)))
                    .andExpect(status().isForbidden());
        }
    }

    // ==================== DEACTIVATE USER TESTS ====================

    @Nested
    @DisplayName("DELETE /api/v1/admin/users/{id} - Deactivate User")
    class DeactivateUserTests {

        @Test
        @DisplayName("Should return 204 No Content on successful deactivation")
        @WithMockUser(authorities = "users:delete")
        void shouldReturn204OnSuccessfulDeactivation() throws Exception {
            // Arrange
            doNothing().when(adminUserService).deactivateUser(eq(testUserId), any(), any());

            // Act & Assert
            mockMvc.perform(delete(BASE_URL + "/" + testUserId))
                    .andExpect(status().isNoContent());

            verify(adminUserService).deactivateUser(eq(testUserId), any(), any());
        }

        @Test
        @DisplayName("Should return 400 Bad Request when deactivating self")
        @WithMockUser(authorities = "users:delete")
        void shouldReturn400WhenDeactivatingSelf() throws Exception {
            // Arrange
            doThrow(new ValidationException("Cannot deactivate your own account"))
                    .when(adminUserService).deactivateUser(eq(testUserId), any(), any());

            // Act & Assert
            mockMvc.perform(delete(BASE_URL + "/" + testUserId))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Should return 404 Not Found when user doesn't exist")
        @WithMockUser(authorities = "users:delete")
        void shouldReturn404WhenUserNotFound() throws Exception {
            // Arrange
            UUID nonExistentId = UUID.randomUUID();
            doThrow(new EntityNotFoundException("User not found: " + nonExistentId))
                    .when(adminUserService).deactivateUser(eq(nonExistentId), any(), any());

            // Act & Assert
            mockMvc.perform(delete(BASE_URL + "/" + nonExistentId))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("Should return 403 Forbidden without users:delete permission")
        @WithMockUser(authorities = "users:read")
        void shouldReturn403WithoutDeletePermission() throws Exception {
            mockMvc.perform(delete(BASE_URL + "/" + testUserId))
                    .andExpect(status().isForbidden());
        }
    }

    // ==================== REACTIVATE USER TESTS ====================

    @Nested
    @DisplayName("POST /api/v1/admin/users/{id}/reactivate - Reactivate User")
    class ReactivateUserTests {

        @Test
        @DisplayName("Should return 200 OK with reactivated user")
        @WithMockUser(authorities = "users:update")
        void shouldReturn200OnSuccessfulReactivation() throws Exception {
            // Arrange
            AdminUserResponse reactivatedResponse = AdminUserResponse.builder()
                    .id(testUserId)
                    .firstName("Test")
                    .lastName("User")
                    .email("test@ultrabms.com")
                    .role("PROPERTY_MANAGER")
                    .roleId(2L)
                    .status(UserStatus.ACTIVE)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();

            when(adminUserService.reactivateUser(eq(testUserId), any(), any())).thenReturn(reactivatedResponse);

            // Act & Assert
            mockMvc.perform(post(BASE_URL + "/" + testUserId + "/reactivate"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("ACTIVE"));
        }

        @Test
        @DisplayName("Should return 400 Bad Request when user is already active")
        @WithMockUser(authorities = "users:update")
        void shouldReturn400WhenUserAlreadyActive() throws Exception {
            // Arrange
            when(adminUserService.reactivateUser(eq(testUserId), any(), any()))
                    .thenThrow(new ValidationException("User is already active"));

            // Act & Assert
            mockMvc.perform(post(BASE_URL + "/" + testUserId + "/reactivate"))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Should return 404 Not Found when user doesn't exist")
        @WithMockUser(authorities = "users:update")
        void shouldReturn404WhenUserNotFound() throws Exception {
            // Arrange
            UUID nonExistentId = UUID.randomUUID();
            when(adminUserService.reactivateUser(eq(nonExistentId), any(), any()))
                    .thenThrow(new EntityNotFoundException("User not found: " + nonExistentId));

            // Act & Assert
            mockMvc.perform(post(BASE_URL + "/" + nonExistentId + "/reactivate"))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("Should return 403 Forbidden without users:update permission")
        @WithMockUser(authorities = "users:read")
        void shouldReturn403WithoutUpdatePermission() throws Exception {
            mockMvc.perform(post(BASE_URL + "/" + testUserId + "/reactivate"))
                    .andExpect(status().isForbidden());
        }
    }
}
