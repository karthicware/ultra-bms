package com.ultrabms.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ultrabms.dto.UserDto;
import com.ultrabms.security.CustomUserDetailsService;
import com.ultrabms.security.RolePermissionService;
import com.ultrabms.service.UserService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for UserController authorization.
 * Tests that @PreAuthorize annotations correctly enforce RBAC permissions.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("UserController Authorization Tests")
class UserControllerAuthorizationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private UserService userService;

    @MockitoBean
    private CustomUserDetailsService userDetailsService;

    @MockitoBean
    private RolePermissionService rolePermissionService;

    @MockitoBean
    private com.ultrabms.security.JwtTokenProvider jwtTokenProvider;

    @MockitoBean
    private com.ultrabms.repository.TokenBlacklistRepository tokenBlacklistRepository;

    private static final UUID TEST_USER_ID = UUID.randomUUID();

    @Nested
    @DisplayName("GET /api/v1/users - List All Users")
    class GetAllUsersTests {

        @Test
        @DisplayName("Should allow SUPER_ADMIN to list users")
        @WithMockUser(username = "admin@test.com",
                     authorities = {"users:read"})
        void shouldAllowSuperAdminToListUsers() throws Exception {
            mockMvc.perform(get("/api/v1/users"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("Should deny TENANT from listing users")
        @WithMockUser(username = "tenant@test.com", roles = {"TENANT"})
        void shouldDenyTenantFromListingUsers() throws Exception {
            mockMvc.perform(get("/api/v1/users"))
                .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("Should deny unauthenticated access")
        void shouldDenyUnauthenticatedAccess() throws Exception {
            mockMvc.perform(get("/api/v1/users"))
                .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("Should deny PROPERTY_MANAGER without user:read permission")
        @WithMockUser(username = "pm@test.com", roles = {"PROPERTY_MANAGER"})
        void shouldDenyPropertyManagerWithoutPermission() throws Exception {
            mockMvc.perform(get("/api/v1/users"))
                .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("GET /api/v1/users/{id} - Get User By ID")
    class GetUserByIdTests {

        @Test
        @DisplayName("Should allow SUPER_ADMIN to get user by ID")
        @WithMockUser(username = "admin@test.com",
                     authorities = {"users:read"})
        void shouldAllowSuperAdminToGetUserById() throws Exception {
            UserDto userDto = new UserDto(
                TEST_USER_ID,
                "test@test.com",
                "Test",
                "User",
                "TENANT",
                true,
                false,
                null,
                null
            );

            when(userService.findById(TEST_USER_ID)).thenReturn(userDto);

            mockMvc.perform(get("/api/v1/users/{id}", TEST_USER_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(TEST_USER_ID.toString()));
        }

        @Test
        @DisplayName("Should deny TENANT from getting user by ID")
        @WithMockUser(username = "tenant@test.com", roles = {"TENANT"})
        void shouldDenyTenantFromGettingUserById() throws Exception {
            mockMvc.perform(get("/api/v1/users/{id}", TEST_USER_ID))
                .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("POST /api/v1/users - Create User")
    class CreateUserTests {

        @Test
        @DisplayName("Should allow SUPER_ADMIN to create user")
        @WithMockUser(username = "admin@test.com",
                     authorities = {"users:create"})
        void shouldAllowSuperAdminToCreateUser() throws Exception {
            UserDto userDto = new UserDto(
                null,
                "newuser@test.com",
                "Test",
                "User",
                "TENANT",
                true,
                false,
                null,
                null
            );

            UserDto createdUser = new UserDto(
                UUID.randomUUID(),
                userDto.email(),
                userDto.firstName(),
                userDto.lastName(),
                userDto.roleName(),
                true,
                false,
                null,
                null
            );

            when(userService.create(any(UserDto.class))).thenReturn(createdUser);

            mockMvc.perform(post("/api/v1/users")
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(userDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("newuser@test.com"));
        }

        @Test
        @DisplayName("Should deny PROPERTY_MANAGER from creating user")
        @WithMockUser(username = "pm@test.com", roles = {"PROPERTY_MANAGER"})
        void shouldDenyPropertyManagerFromCreatingUser() throws Exception {
            UserDto userDto = new UserDto(
                null,
                "newuser@test.com",
                "Test",
                "User",
                "TENANT",
                true,
                false,
                null,
                null
            );

            mockMvc.perform(post("/api/v1/users")
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(userDto)))
                .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("Should deny TENANT from creating user")
        @WithMockUser(username = "tenant@test.com", roles = {"TENANT"})
        void shouldDenyTenantFromCreatingUser() throws Exception {
            UserDto userDto = new UserDto(
                null,
                "newuser@test.com",
                "Test",
                "User",
                "TENANT",
                true,
                false,
                null,
                null
            );

            mockMvc.perform(post("/api/v1/users")
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(userDto)))
                .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("Should deny MAINTENANCE_SUPERVISOR from creating user")
        @WithMockUser(username = "ms@test.com", roles = {"MAINTENANCE_SUPERVISOR"})
        void shouldDenyMaintenanceSupervisorFromCreatingUser() throws Exception {
            UserDto userDto = new UserDto(
                null,
                "newuser@test.com",
                "Test",
                "User",
                "TENANT",
                true,
                false,
                null,
                null
            );

            mockMvc.perform(post("/api/v1/users")
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(userDto)))
                .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("PUT /api/v1/users/{id} - Update User")
    class UpdateUserTests {

        @Test
        @DisplayName("Should allow SUPER_ADMIN to update user")
        @WithMockUser(username = "admin@test.com",
                     authorities = {"users:update"})
        void shouldAllowSuperAdminToUpdateUser() throws Exception {
            UserDto userDto = new UserDto(
                TEST_USER_ID,
                "updated@test.com",
                "Updated",
                "User",
                "TENANT",
                true,
                false,
                null,
                null
            );

            when(userService.update(any(UUID.class), any(UserDto.class))).thenReturn(userDto);

            mockMvc.perform(put("/api/v1/users/{id}", TEST_USER_ID)
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(userDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("updated@test.com"));
        }

        @Test
        @DisplayName("Should deny TENANT from updating user")
        @WithMockUser(username = "tenant@test.com", roles = {"TENANT"})
        void shouldDenyTenantFromUpdatingUser() throws Exception {
            UserDto userDto = new UserDto(
                null,
                "updated@test.com",
                "Test",
                "User",
                "TENANT",
                true,
                false,
                null,
                null
            );

            mockMvc.perform(put("/api/v1/users/{id}", TEST_USER_ID)
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(userDto)))
                .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("Should deny FINANCE_MANAGER from updating user")
        @WithMockUser(username = "fm@test.com", roles = {"FINANCE_MANAGER"})
        void shouldDenyFinanceManagerFromUpdatingUser() throws Exception {
            UserDto userDto = new UserDto(
                null,
                "updated@test.com",
                "Test",
                "User",
                "FINANCE_MANAGER",
                true,
                false,
                null,
                null
            );

            mockMvc.perform(put("/api/v1/users/{id}", TEST_USER_ID)
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(userDto)))
                .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("DELETE /api/v1/users/{id} - Delete User")
    class DeleteUserTests {

        @Test
        @DisplayName("Should allow SUPER_ADMIN to delete user")
        @WithMockUser(username = "admin@test.com",
                     authorities = {"users:delete"})
        void shouldAllowSuperAdminToDeleteUser() throws Exception {
            mockMvc.perform(delete("/api/v1/users/{id}", TEST_USER_ID)
                    .with(csrf()))
                .andExpect(status().isNoContent());
        }

        @Test
        @DisplayName("Should deny PROPERTY_MANAGER from deleting user")
        @WithMockUser(username = "pm@test.com", roles = {"PROPERTY_MANAGER"})
        void shouldDenyPropertyManagerFromDeletingUser() throws Exception {
            mockMvc.perform(delete("/api/v1/users/{id}", TEST_USER_ID)
                    .with(csrf()))
                .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("Should deny TENANT from deleting user")
        @WithMockUser(username = "tenant@test.com", roles = {"TENANT"})
        void shouldDenyTenantFromDeletingUser() throws Exception {
            mockMvc.perform(delete("/api/v1/users/{id}", TEST_USER_ID)
                    .with(csrf()))
                .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("Should deny MAINTENANCE_SUPERVISOR from deleting user")
        @WithMockUser(username = "ms@test.com", roles = {"MAINTENANCE_SUPERVISOR"})
        void shouldDenyMaintenanceSupervisorFromDeletingUser() throws Exception {
            mockMvc.perform(delete("/api/v1/users/{id}", TEST_USER_ID)
                    .with(csrf()))
                .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("Should deny FINANCE_MANAGER from deleting user")
        @WithMockUser(username = "fm@test.com", roles = {"FINANCE_MANAGER"})
        void shouldDenyFinanceManagerFromDeletingUser() throws Exception {
            mockMvc.perform(delete("/api/v1/users/{id}", TEST_USER_ID)
                    .with(csrf()))
                .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("Should deny VENDOR from deleting user")
        @WithMockUser(username = "vendor@test.com", roles = {"VENDOR"})
        void shouldDenyVendorFromDeletingUser() throws Exception {
            mockMvc.perform(delete("/api/v1/users/{id}", TEST_USER_ID)
                    .with(csrf()))
                .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("Role-Based Access Summary Tests")
    class RoleBasedAccessSummaryTests {

        @Test
        @DisplayName("SUPER_ADMIN should have full access to all user operations")
        @WithMockUser(username = "admin@test.com",
                     authorities = {"users:create", "users:read", "users:update", "users:delete"})
        void superAdminShouldHaveFullAccess() throws Exception {
            // Can read
            mockMvc.perform(get("/api/v1/users"))
                .andExpect(status().isOk());

            // Can create
            UserDto userDto = new UserDto(
                null,
                "test@test.com",
                "Test",
                "User",
                "TENANT",
                true,
                false,
                null,
                null
            );
            when(userService.create(any(UserDto.class))).thenReturn(userDto);

            mockMvc.perform(post("/api/v1/users")
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(userDto)))
                .andExpect(status().isCreated());

            // Can delete
            mockMvc.perform(delete("/api/v1/users/{id}", TEST_USER_ID)
                    .with(csrf()))
                .andExpect(status().isNoContent());
        }

        @Test
        @DisplayName("TENANT should have no access to user management")
        @WithMockUser(username = "tenant@test.com", roles = {"TENANT"})
        void tenantShouldHaveNoAccess() throws Exception {
            // Cannot read
            mockMvc.perform(get("/api/v1/users"))
                .andExpect(status().isForbidden());

            // Cannot create
            UserDto userDto = new UserDto(
                null,
                "test@test.com",
                "Test",
                "User",
                "TENANT",
                true,
                false,
                null,
                null
            );

            mockMvc.perform(post("/api/v1/users")
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(userDto)))
                .andExpect(status().isForbidden());

            // Cannot delete
            mockMvc.perform(delete("/api/v1/users/{id}", TEST_USER_ID)
                    .with(csrf()))
                .andExpect(status().isForbidden());
        }
    }
}
