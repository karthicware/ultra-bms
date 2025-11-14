package com.ultrabms.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.springframework.security.core.GrantedAuthority;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Collections;
import java.util.stream.Collectors;

/**
 * User entity representing system users with role-based access control.
 * Supports six user roles: SUPER_ADMIN, PROPERTY_MANAGER, MAINTENANCE_SUPERVISOR,
 * FINANCE_MANAGER, TENANT, and VENDOR.
 */
@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_users_email", columnList = "email")
})
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class User extends BaseEntity {

    /**
     * User's email address - must be unique across the system
     */
    @NotNull(message = "Email cannot be null")
    @Email(message = "Email must be valid")
    @Size(max = 255, message = "Email must not exceed 255 characters")
    @Column(name = "email", unique = true, nullable = false, length = 255)
    private String email;

    /**
     * BCrypt hashed password - never exposed in JSON responses
     */
    @NotNull(message = "Password hash cannot be null")
    @Column(name = "password_hash", nullable = false)
    @JsonIgnore
    private String passwordHash;

    /**
     * User's first name
     */
    @NotNull(message = "First name cannot be null")
    @Size(max = 100, message = "First name must not exceed 100 characters")
    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    /**
     * User's last name
     */
    @NotNull(message = "Last name cannot be null")
    @Size(max = 100, message = "Last name must not exceed 100 characters")
    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    /**
     * User's role in the system - many-to-one relationship with roles table
     * Eagerly fetched to include permissions for authorization checks
     */
    @NotNull(message = "Role cannot be null")
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    /**
     * Whether the user account is active (soft delete pattern)
     */
    @Column(name = "active", nullable = false)
    private Boolean active = true;

    /**
     * User's phone number in E.164 format (optional)
     */
    @Size(max = 20, message = "Phone number must not exceed 20 characters")
    @Column(name = "phone", length = 20)
    private String phone;

    /**
     * Whether multi-factor authentication is enabled for this user
     */
    @Column(name = "mfa_enabled", nullable = false)
    private Boolean mfaEnabled = false;

    /**
     * Whether the account is currently locked due to failed login attempts
     */
    @Column(name = "account_locked", nullable = false)
    private Boolean accountLocked = false;

    /**
     * Timestamp until which the account is locked (null if not locked)
     */
    @Column(name = "locked_until")
    private LocalDateTime lockedUntil;

    /**
     * Number of consecutive failed login attempts
     */
    @Column(name = "failed_login_attempts", nullable = false)
    private Integer failedLoginAttempts = 0;

    /**
     * Get user authorities (permissions) for Spring Security.
     * Converts role permissions to GrantedAuthority collection.
     * SUPER_ADMIN always has all permissions.
     *
     * @return collection of GrantedAuthority representing user permissions
     */
    public Collection<? extends GrantedAuthority> getAuthorities() {
        if (role == null) {
            return Collections.emptyList();
        }
        return role.getPermissions().stream()
            .collect(Collectors.toList());
    }

    /**
     * Get the role name as a string (e.g., "SUPER_ADMIN", "PROPERTY_MANAGER")
     *
     * @return role name or null if role not set
     */
    public String getRoleName() {
        return role != null ? role.getName() : null;
    }

    /**
     * Check if user has a specific permission
     *
     * @param permissionName permission to check (e.g., "tenants:create")
     * @return true if user has the permission, false otherwise
     */
    public boolean hasPermission(String permissionName) {
        if (role == null) {
            return false;
        }
        // SUPER_ADMIN has all permissions
        if (role.isSuperAdmin()) {
            return true;
        }
        return role.hasPermission(permissionName);
    }

    /**
     * Check if user has a specific role
     *
     * @param roleName role to check (e.g., "SUPER_ADMIN")
     * @return true if user has the role, false otherwise
     */
    public boolean hasRole(String roleName) {
        return role != null && role.getName().equals(roleName);
    }
}
