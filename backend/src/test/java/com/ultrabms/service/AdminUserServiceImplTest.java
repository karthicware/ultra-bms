package com.ultrabms.service;

import com.ultrabms.service.IEmailService;

import com.ultrabms.dto.admin.AdminUserCreateRequest;
import com.ultrabms.dto.admin.AdminUserResponse;
import com.ultrabms.dto.admin.AdminUserUpdateRequest;
import com.ultrabms.entity.Role;
import com.ultrabms.entity.User;
import com.ultrabms.entity.enums.UserStatus;
import com.ultrabms.exception.DuplicateResourceException;
import com.ultrabms.exception.EntityNotFoundException;
import com.ultrabms.exception.ValidationException;
import com.ultrabms.repository.RoleRepository;
import com.ultrabms.repository.UserRepository;
import com.ultrabms.service.impl.AdminUserServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for AdminUserServiceImpl.
 * Story 2.6: Admin User Management
 *
 * Tests CRUD operations, role validation, and audit logging.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AdminUserServiceImpl Tests")
class AdminUserServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private IEmailService emailService;

    @Spy
    private BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder(12);

    @InjectMocks
    private AdminUserServiceImpl adminUserService;

    private User testUser;
    private User adminUser;
    private User superAdminUser;
    private Role propertyManagerRole;
    private Role superAdminRole;
    private static final String TEST_IP = "192.168.1.1";

    @BeforeEach
    void setUp() {
        // Create Property Manager role
        propertyManagerRole = new Role();
        propertyManagerRole.setId(2L);
        propertyManagerRole.setName("PROPERTY_MANAGER");
        propertyManagerRole.setDescription("Property Manager Role");
        propertyManagerRole.setPermissions(new HashSet<>());

        // Create Super Admin role
        superAdminRole = new Role();
        superAdminRole.setId(1L);
        superAdminRole.setName("SUPER_ADMIN");
        superAdminRole.setDescription("Super Admin Role");
        superAdminRole.setPermissions(new HashSet<>());

        // Create test user (Property Manager)
        testUser = new User();
        testUser.setId(UUID.randomUUID());
        testUser.setEmail("test@ultrabms.com");
        testUser.setPasswordHash(passwordEncoder.encode("P@ssw0rd123"));
        testUser.setFirstName("Test");
        testUser.setLastName("User");
        testUser.setRole(propertyManagerRole);
        testUser.setPhone("+971501234567");
        testUser.setActive(true);
        testUser.setStatus(UserStatus.ACTIVE);
        testUser.setMustChangePassword(false);
        testUser.setMfaEnabled(false);
        testUser.setAccountLocked(false);
        testUser.setFailedLoginAttempts(0);
        testUser.setCreatedAt(LocalDateTime.now());
        testUser.setUpdatedAt(LocalDateTime.now());

        // Create admin user (Property Manager - for creating users)
        adminUser = new User();
        adminUser.setId(UUID.randomUUID());
        adminUser.setEmail("admin@ultrabms.com");
        adminUser.setPasswordHash(passwordEncoder.encode("AdminP@ss123"));
        adminUser.setFirstName("Admin");
        adminUser.setLastName("User");
        adminUser.setRole(propertyManagerRole);
        adminUser.setPhone("+971509876543");
        adminUser.setActive(true);
        adminUser.setStatus(UserStatus.ACTIVE);

        // Create super admin user
        superAdminUser = new User();
        superAdminUser.setId(UUID.randomUUID());
        superAdminUser.setEmail("superadmin@ultrabms.com");
        superAdminUser.setPasswordHash(passwordEncoder.encode("SuperP@ss123"));
        superAdminUser.setFirstName("Super");
        superAdminUser.setLastName("Admin");
        superAdminUser.setRole(superAdminRole);
        superAdminUser.setPhone("+971505555555");
        superAdminUser.setActive(true);
        superAdminUser.setStatus(UserStatus.ACTIVE);
    }

    // ==================== LIST USERS TESTS ====================

    @Nested
    @DisplayName("List Users Tests")
    class ListUsersTests {

        @Test
        @DisplayName("Should return paginated list of users")
        void shouldReturnPaginatedListOfUsers() {
            // Arrange
            Pageable pageable = PageRequest.of(0, 20);
            Page<User> userPage = new PageImpl<>(List.of(testUser, adminUser), pageable, 2);
            when(userRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(userPage);

            // Act
            Page<AdminUserResponse> result = adminUserService.listUsers(null, null, null, pageable);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(2);
            assertThat(result.getTotalElements()).isEqualTo(2);
            verify(userRepository).findAll(any(Specification.class), eq(pageable));
        }

        @Test
        @DisplayName("Should filter users by search term")
        void shouldFilterUsersBySearchTerm() {
            // Arrange
            Pageable pageable = PageRequest.of(0, 20);
            Page<User> userPage = new PageImpl<>(List.of(testUser), pageable, 1);
            when(userRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(userPage);

            // Act
            Page<AdminUserResponse> result = adminUserService.listUsers("test", null, null, pageable);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
            verify(userRepository).findAll(any(Specification.class), eq(pageable));
        }

        @Test
        @DisplayName("Should filter users by status")
        void shouldFilterUsersByStatus() {
            // Arrange
            Pageable pageable = PageRequest.of(0, 20);
            Page<User> userPage = new PageImpl<>(List.of(testUser), pageable, 1);
            when(userRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(userPage);

            // Act
            Page<AdminUserResponse> result = adminUserService.listUsers(null, null, "ACTIVE", pageable);

            // Assert
            assertThat(result).isNotNull();
            verify(userRepository).findAll(any(Specification.class), eq(pageable));
        }
    }

    // ==================== GET USER BY ID TESTS ====================

    @Nested
    @DisplayName("Get User By ID Tests")
    class GetUserByIdTests {

        @Test
        @DisplayName("Should return user by ID")
        void shouldReturnUserById() {
            // Arrange
            when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));

            // Act
            AdminUserResponse result = adminUserService.getUserById(testUser.getId());

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getId()).isEqualTo(testUser.getId());
            assertThat(result.getEmail()).isEqualTo(testUser.getEmail());
        }

        @Test
        @DisplayName("Should throw EntityNotFoundException when user not found")
        void shouldThrowExceptionWhenUserNotFound() {
            // Arrange
            UUID nonExistentId = UUID.randomUUID();
            when(userRepository.findById(nonExistentId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> adminUserService.getUserById(nonExistentId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("User not found");
        }
    }

    // ==================== CREATE USER TESTS ====================

    @Nested
    @DisplayName("Create User Tests")
    class CreateUserTests {

        @Test
        @DisplayName("Should successfully create new user")
        void shouldSuccessfullyCreateNewUser() {
            // Arrange
            AdminUserCreateRequest request = AdminUserCreateRequest.builder()
                    .firstName("New")
                    .lastName("User")
                    .email("newuser@ultrabms.com")
                    .phone("+971501111111")
                    .roleId(2L)
                    .temporaryPassword("TempP@ss123")
                    .build();

            when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);
            when(roleRepository.findById(2L)).thenReturn(Optional.of(propertyManagerRole));
            when(userRepository.findById(adminUser.getId())).thenReturn(Optional.of(adminUser));
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
                User savedUser = invocation.getArgument(0);
                savedUser.setId(UUID.randomUUID());
                savedUser.setCreatedAt(LocalDateTime.now());
                savedUser.setUpdatedAt(LocalDateTime.now());
                return savedUser;
            });

            // Act
            AdminUserResponse result = adminUserService.createUser(request, adminUser.getId(), TEST_IP);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getEmail()).isEqualTo(request.getEmail());
            assertThat(result.getFirstName()).isEqualTo(request.getFirstName());
            assertThat(result.getStatus()).isEqualTo(UserStatus.ACTIVE);

            // Verify password was encoded
            ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
            verify(userRepository).save(userCaptor.capture());
            User savedUser = userCaptor.getValue();
            assertThat(savedUser.getMustChangePassword()).isTrue();
            assertThat(passwordEncoder.matches("TempP@ss123", savedUser.getPasswordHash())).isTrue();

            // Verify welcome email was sent
            verify(emailService).sendUserWelcomeEmail(any(User.class), eq("TempP@ss123"));

            // Verify audit log
            verify(auditLogService).logSecurityEvent(eq(adminUser.getId()), eq("CREATE_USER"), eq(TEST_IP), anyMap());
        }

        @Test
        @DisplayName("Should throw DuplicateResourceException when email already exists")
        void shouldThrowExceptionWhenEmailExists() {
            // Arrange
            AdminUserCreateRequest request = AdminUserCreateRequest.builder()
                    .firstName("Duplicate")
                    .lastName("User")
                    .email("test@ultrabms.com") // existing email
                    .roleId(2L)
                    .temporaryPassword("TempP@ss123")
                    .build();

            when(userRepository.existsByEmail(request.getEmail())).thenReturn(true);

            // Act & Assert
            assertThatThrownBy(() -> adminUserService.createUser(request, adminUser.getId(), TEST_IP))
                    .isInstanceOf(DuplicateResourceException.class);
        }

        @Test
        @DisplayName("Should throw AccessDeniedException when non-SUPER_ADMIN tries to create SUPER_ADMIN")
        void shouldThrowExceptionWhenNonSuperAdminCreatesSuperAdmin() {
            // Arrange
            AdminUserCreateRequest request = AdminUserCreateRequest.builder()
                    .firstName("New")
                    .lastName("SuperAdmin")
                    .email("newsuperadmin@ultrabms.com")
                    .roleId(1L) // SUPER_ADMIN role
                    .temporaryPassword("TempP@ss123")
                    .build();

            when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);
            when(roleRepository.findById(1L)).thenReturn(Optional.of(superAdminRole));
            when(userRepository.findById(adminUser.getId())).thenReturn(Optional.of(adminUser)); // Non-SUPER_ADMIN

            // Act & Assert
            assertThatThrownBy(() -> adminUserService.createUser(request, adminUser.getId(), TEST_IP))
                    .isInstanceOf(AccessDeniedException.class)
                    .hasMessageContaining("Only SUPER_ADMIN can create other SUPER_ADMIN users");
        }

        @Test
        @DisplayName("Should allow SUPER_ADMIN to create another SUPER_ADMIN")
        void shouldAllowSuperAdminToCreateSuperAdmin() {
            // Arrange
            AdminUserCreateRequest request = AdminUserCreateRequest.builder()
                    .firstName("New")
                    .lastName("SuperAdmin")
                    .email("newsuperadmin@ultrabms.com")
                    .roleId(1L)
                    .temporaryPassword("TempP@ss123")
                    .build();

            when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);
            when(roleRepository.findById(1L)).thenReturn(Optional.of(superAdminRole));
            when(userRepository.findById(superAdminUser.getId())).thenReturn(Optional.of(superAdminUser));
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
                User savedUser = invocation.getArgument(0);
                savedUser.setId(UUID.randomUUID());
                savedUser.setCreatedAt(LocalDateTime.now());
                savedUser.setUpdatedAt(LocalDateTime.now());
                return savedUser;
            });

            // Act
            AdminUserResponse result = adminUserService.createUser(request, superAdminUser.getId(), TEST_IP);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getRole()).isEqualTo("SUPER_ADMIN");
        }
    }

    // ==================== UPDATE USER TESTS ====================

    @Nested
    @DisplayName("Update User Tests")
    class UpdateUserTests {

        @Test
        @DisplayName("Should successfully update user")
        void shouldSuccessfullyUpdateUser() {
            // Arrange
            AdminUserUpdateRequest request = AdminUserUpdateRequest.builder()
                    .firstName("Updated")
                    .lastName("Name")
                    .phone("+971502222222")
                    .roleId(2L)
                    .build();

            when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));
            when(roleRepository.findById(2L)).thenReturn(Optional.of(propertyManagerRole));
            when(userRepository.findById(adminUser.getId())).thenReturn(Optional.of(adminUser));
            when(userRepository.save(any(User.class))).thenReturn(testUser);

            // Act
            AdminUserResponse result = adminUserService.updateUser(testUser.getId(), request, adminUser.getId(), TEST_IP);

            // Assert
            assertThat(result).isNotNull();
            verify(userRepository).save(any(User.class));
            verify(auditLogService).logSecurityEvent(eq(adminUser.getId()), eq("UPDATE_USER"), eq(TEST_IP), anyMap());
        }

        @Test
        @DisplayName("Should throw EntityNotFoundException when user to update not found")
        void shouldThrowExceptionWhenUserToUpdateNotFound() {
            // Arrange
            UUID nonExistentId = UUID.randomUUID();
            AdminUserUpdateRequest request = AdminUserUpdateRequest.builder()
                    .firstName("Updated")
                    .lastName("Name")
                    .roleId(2L)
                    .build();

            when(userRepository.findById(nonExistentId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> adminUserService.updateUser(nonExistentId, request, adminUser.getId(), TEST_IP))
                    .isInstanceOf(EntityNotFoundException.class);
        }

        @Test
        @DisplayName("Should throw AccessDeniedException when non-SUPER_ADMIN assigns SUPER_ADMIN role")
        void shouldThrowExceptionWhenNonSuperAdminAssignsSuperAdminRole() {
            // Arrange
            AdminUserUpdateRequest request = AdminUserUpdateRequest.builder()
                    .firstName("Updated")
                    .lastName("Name")
                    .roleId(1L) // SUPER_ADMIN
                    .build();

            when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));
            when(roleRepository.findById(1L)).thenReturn(Optional.of(superAdminRole));
            when(userRepository.findById(adminUser.getId())).thenReturn(Optional.of(adminUser)); // Non-SUPER_ADMIN

            // Act & Assert
            assertThatThrownBy(() -> adminUserService.updateUser(testUser.getId(), request, adminUser.getId(), TEST_IP))
                    .isInstanceOf(AccessDeniedException.class)
                    .hasMessageContaining("Only SUPER_ADMIN can assign SUPER_ADMIN role");
        }
    }

    // ==================== DEACTIVATE USER TESTS ====================

    @Nested
    @DisplayName("Deactivate User Tests")
    class DeactivateUserTests {

        @Test
        @DisplayName("Should successfully deactivate user")
        void shouldSuccessfullyDeactivateUser() {
            // Arrange
            when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));

            // Act
            adminUserService.deactivateUser(testUser.getId(), adminUser.getId(), TEST_IP);

            // Assert
            ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
            verify(userRepository).save(userCaptor.capture());
            User deactivatedUser = userCaptor.getValue();
            assertThat(deactivatedUser.getStatus()).isEqualTo(UserStatus.INACTIVE);
            assertThat(deactivatedUser.getActive()).isFalse();

            verify(auditLogService).logSecurityEvent(eq(adminUser.getId()), eq("DEACTIVATE_USER"), eq(TEST_IP), anyMap());
        }

        @Test
        @DisplayName("Should throw ValidationException when trying to deactivate own account")
        void shouldThrowExceptionWhenDeactivatingSelf() {
            // Act & Assert
            assertThatThrownBy(() -> adminUserService.deactivateUser(adminUser.getId(), adminUser.getId(), TEST_IP))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Cannot deactivate your own account");
        }

        @Test
        @DisplayName("Should throw ValidationException when user is already inactive")
        void shouldThrowExceptionWhenUserAlreadyInactive() {
            // Arrange
            testUser.setStatus(UserStatus.INACTIVE);
            when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));

            // Act & Assert
            assertThatThrownBy(() -> adminUserService.deactivateUser(testUser.getId(), adminUser.getId(), TEST_IP))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("User is already inactive");
        }
    }

    // ==================== REACTIVATE USER TESTS ====================

    @Nested
    @DisplayName("Reactivate User Tests")
    class ReactivateUserTests {

        @Test
        @DisplayName("Should successfully reactivate user")
        void shouldSuccessfullyReactivateUser() {
            // Arrange
            testUser.setStatus(UserStatus.INACTIVE);
            testUser.setActive(false);
            when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));
            when(userRepository.save(any(User.class))).thenReturn(testUser);

            // Act
            AdminUserResponse result = adminUserService.reactivateUser(testUser.getId(), adminUser.getId(), TEST_IP);

            // Assert
            assertThat(result).isNotNull();

            ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
            verify(userRepository).save(userCaptor.capture());
            User reactivatedUser = userCaptor.getValue();
            assertThat(reactivatedUser.getStatus()).isEqualTo(UserStatus.ACTIVE);
            assertThat(reactivatedUser.getActive()).isTrue();

            verify(auditLogService).logSecurityEvent(eq(adminUser.getId()), eq("REACTIVATE_USER"), eq(TEST_IP), anyMap());
        }

        @Test
        @DisplayName("Should throw ValidationException when user is already active")
        void shouldThrowExceptionWhenUserAlreadyActive() {
            // Arrange
            when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));

            // Act & Assert
            assertThatThrownBy(() -> adminUserService.reactivateUser(testUser.getId(), adminUser.getId(), TEST_IP))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("User is already active");
        }
    }

    // ==================== ROLE VALIDATION TESTS ====================

    @Nested
    @DisplayName("Role Validation Tests")
    class RoleValidationTests {

        @Test
        @DisplayName("SUPER_ADMIN can assign any role")
        void superAdminCanAssignAnyRole() {
            assertThat(adminUserService.canAssignRole("SUPER_ADMIN", "SUPER_ADMIN")).isTrue();
            assertThat(adminUserService.canAssignRole("SUPER_ADMIN", "PROPERTY_MANAGER")).isTrue();
            assertThat(adminUserService.canAssignRole("SUPER_ADMIN", "TENANT")).isTrue();
        }

        @Test
        @DisplayName("Non-SUPER_ADMIN cannot assign SUPER_ADMIN role")
        void nonSuperAdminCannotAssignSuperAdminRole() {
            assertThat(adminUserService.canAssignRole("PROPERTY_MANAGER", "SUPER_ADMIN")).isFalse();
            assertThat(adminUserService.canAssignRole("TENANT", "SUPER_ADMIN")).isFalse();
        }

        @Test
        @DisplayName("Non-SUPER_ADMIN can assign other roles")
        void nonSuperAdminCanAssignOtherRoles() {
            assertThat(adminUserService.canAssignRole("PROPERTY_MANAGER", "TENANT")).isTrue();
            assertThat(adminUserService.canAssignRole("PROPERTY_MANAGER", "VENDOR")).isTrue();
        }
    }
}
