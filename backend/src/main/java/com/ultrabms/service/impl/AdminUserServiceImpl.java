package com.ultrabms.service.impl;

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
import com.ultrabms.service.AdminUserService;
import com.ultrabms.service.AuditLogService;
import com.ultrabms.service.EmailService;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Implementation of AdminUserService for admin user management.
 * Handles CRUD operations with audit logging and role validation.
 *
 * Story 2.6: Admin User Management
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AdminUserServiceImpl implements AdminUserService {

    private static final String SUPER_ADMIN_ROLE = "SUPER_ADMIN";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;
    private final EmailService emailService;

    // =================================================================
    // LIST USERS
    // =================================================================

    @Override
    @Transactional(readOnly = true)
    public Page<AdminUserResponse> listUsers(String search, String role, String status, Pageable pageable) {
        log.debug("Listing users with search={}, role={}, status={}", search, role, status);

        Specification<User> spec = buildUserSpecification(search, role, status);
        Page<User> userPage = userRepository.findAll(spec, pageable);

        return userPage.map(this::toAdminUserResponse);
    }

    private Specification<User> buildUserSpecification(String search, String role, String status) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Search filter (name or email)
            if (search != null && !search.isBlank()) {
                String searchLower = "%" + search.toLowerCase() + "%";
                Predicate firstNameLike = cb.like(cb.lower(root.get("firstName")), searchLower);
                Predicate lastNameLike = cb.like(cb.lower(root.get("lastName")), searchLower);
                Predicate emailLike = cb.like(cb.lower(root.get("email")), searchLower);
                predicates.add(cb.or(firstNameLike, lastNameLike, emailLike));
            }

            // Role filter
            if (role != null && !role.isBlank()) {
                predicates.add(cb.equal(root.get("role").get("name"), role));
            }

            // Status filter
            if (status != null && !status.isBlank()) {
                try {
                    UserStatus userStatus = UserStatus.valueOf(status.toUpperCase());
                    predicates.add(cb.equal(root.get("status"), userStatus));
                } catch (IllegalArgumentException e) {
                    log.warn("Invalid status filter value: {}", status);
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    // =================================================================
    // GET USER BY ID
    // =================================================================

    @Override
    @Transactional(readOnly = true)
    public AdminUserResponse getUserById(UUID userId) {
        log.debug("Getting user by ID: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + userId));

        return toAdminUserResponse(user);
    }

    // =================================================================
    // CREATE USER
    // =================================================================

    @Override
    @Transactional
    public AdminUserResponse createUser(AdminUserCreateRequest request, UUID creatorId, String ipAddress) {
        log.info("Creating user with email: {} by admin: {}", request.getEmail(), creatorId);

        // Validate email uniqueness
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("User", "email", request.getEmail());
        }

        // Get role and validate
        Role role = roleRepository.findById(request.getRoleId())
                .orElseThrow(() -> new EntityNotFoundException("Role not found: " + request.getRoleId()));

        // Get creator for role validation
        User creator = userRepository.findById(creatorId)
                .orElseThrow(() -> new EntityNotFoundException("Creator user not found: " + creatorId));

        // Validate SUPER_ADMIN role assignment
        if (SUPER_ADMIN_ROLE.equals(role.getName()) && !SUPER_ADMIN_ROLE.equals(creator.getRoleName())) {
            throw new AccessDeniedException("Only SUPER_ADMIN can create other SUPER_ADMIN users");
        }

        // Create user entity
        User user = new User();
        user.setEmail(request.getEmail());
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPhone(request.getPhone());
        user.setPasswordHash(passwordEncoder.encode(request.getTemporaryPassword()));
        user.setRole(role);
        user.setStatus(UserStatus.ACTIVE);
        user.setMustChangePassword(true); // Force password change on first login
        user.setActive(true);
        user.setMfaEnabled(false);
        user.setAccountLocked(false);
        user.setFailedLoginAttempts(0);

        // Save user
        User savedUser = userRepository.save(user);
        log.info("User created successfully: {} with ID: {}", savedUser.getEmail(), savedUser.getId());

        // Send welcome email asynchronously
        emailService.sendUserWelcomeEmail(savedUser, request.getTemporaryPassword());

        // Audit log
        auditLogService.logSecurityEvent(
                creatorId,
                "CREATE_USER",
                ipAddress,
                Map.of(
                        "targetUserId", savedUser.getId().toString(),
                        "targetEmail", savedUser.getEmail(),
                        "roleAssigned", role.getName()
                )
        );

        return toAdminUserResponse(savedUser);
    }

    // =================================================================
    // UPDATE USER
    // =================================================================

    @Override
    @Transactional
    public AdminUserResponse updateUser(UUID userId, AdminUserUpdateRequest request, UUID updaterId, String ipAddress) {
        log.info("Updating user: {} by admin: {}", userId, updaterId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + userId));

        // Get new role and validate
        Role newRole = roleRepository.findById(request.getRoleId())
                .orElseThrow(() -> new EntityNotFoundException("Role not found: " + request.getRoleId()));

        // Get updater for role validation
        User updater = userRepository.findById(updaterId)
                .orElseThrow(() -> new EntityNotFoundException("Updater user not found: " + updaterId));

        // Validate SUPER_ADMIN role assignment (if changing to SUPER_ADMIN)
        if (SUPER_ADMIN_ROLE.equals(newRole.getName())
                && !SUPER_ADMIN_ROLE.equals(user.getRoleName())
                && !SUPER_ADMIN_ROLE.equals(updater.getRoleName())) {
            throw new AccessDeniedException("Only SUPER_ADMIN can assign SUPER_ADMIN role");
        }

        // Track changes for audit log
        List<String> changes = new ArrayList<>();
        if (!user.getFirstName().equals(request.getFirstName())) {
            changes.add("firstName");
        }
        if (!user.getLastName().equals(request.getLastName())) {
            changes.add("lastName");
        }
        if (!java.util.Objects.equals(user.getPhone(), request.getPhone())) {
            changes.add("phone");
        }
        if (!user.getRole().getId().equals(request.getRoleId())) {
            changes.add("role: " + user.getRoleName() + " -> " + newRole.getName());
        }

        // Update fields (email is immutable)
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPhone(request.getPhone());
        user.setRole(newRole);

        // Save user
        User updatedUser = userRepository.save(user);
        log.info("User updated successfully: {}", userId);

        // Audit log
        auditLogService.logSecurityEvent(
                updaterId,
                "UPDATE_USER",
                ipAddress,
                Map.of(
                        "targetUserId", userId.toString(),
                        "targetEmail", user.getEmail(),
                        "fieldsChanged", String.join(", ", changes)
                )
        );

        return toAdminUserResponse(updatedUser);
    }

    // =================================================================
    // DEACTIVATE USER
    // =================================================================

    @Override
    @Transactional
    public void deactivateUser(UUID userId, UUID adminId, String ipAddress) {
        log.info("Deactivating user: {} by admin: {}", userId, adminId);

        // Prevent self-deactivation
        if (userId.equals(adminId)) {
            throw new ValidationException("Cannot deactivate your own account");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + userId));

        // Check if already inactive
        if (user.getStatus() == UserStatus.INACTIVE) {
            throw new ValidationException("User is already inactive");
        }

        // Deactivate user
        user.setStatus(UserStatus.INACTIVE);
        user.setActive(false);
        userRepository.save(user);

        log.info("User deactivated successfully: {}", userId);

        // Audit log
        auditLogService.logSecurityEvent(
                adminId,
                "DEACTIVATE_USER",
                ipAddress,
                Map.of(
                        "targetUserId", userId.toString(),
                        "targetEmail", user.getEmail(),
                        "previousStatus", "ACTIVE"
                )
        );
    }

    // =================================================================
    // REACTIVATE USER
    // =================================================================

    @Override
    @Transactional
    public AdminUserResponse reactivateUser(UUID userId, UUID adminId, String ipAddress) {
        log.info("Reactivating user: {} by admin: {}", userId, adminId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + userId));

        // Check if already active
        if (user.getStatus() == UserStatus.ACTIVE) {
            throw new ValidationException("User is already active");
        }

        // Reactivate user
        user.setStatus(UserStatus.ACTIVE);
        user.setActive(true);
        User reactivatedUser = userRepository.save(user);

        log.info("User reactivated successfully: {}", userId);

        // Audit log
        auditLogService.logSecurityEvent(
                adminId,
                "REACTIVATE_USER",
                ipAddress,
                Map.of(
                        "targetUserId", userId.toString(),
                        "targetEmail", user.getEmail(),
                        "previousStatus", "INACTIVE"
                )
        );

        return toAdminUserResponse(reactivatedUser);
    }

    // =================================================================
    // ROLE VALIDATION
    // =================================================================

    @Override
    public boolean canAssignRole(String currentUserRoleName, String targetRoleName) {
        // SUPER_ADMIN can assign any role
        if (SUPER_ADMIN_ROLE.equals(currentUserRoleName)) {
            return true;
        }
        // Non-SUPER_ADMIN cannot assign SUPER_ADMIN role
        return !SUPER_ADMIN_ROLE.equals(targetRoleName);
    }

    // =================================================================
    // MAPPING HELPERS
    // =================================================================

    private AdminUserResponse toAdminUserResponse(User user) {
        return AdminUserResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRoleName())
                .roleId(user.getRole().getId())
                .status(user.getStatus())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
