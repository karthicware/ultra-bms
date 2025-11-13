package com.ultrabms.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.ultrabms.entity.enums.UserRole;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

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
     * User's role in the system (stored as string for flexibility)
     */
    @NotNull(message = "Role cannot be null")
    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private UserRole role;

    /**
     * Whether the user account is active (soft delete pattern)
     */
    @Column(name = "active", nullable = false)
    private Boolean active = true;

    /**
     * Whether multi-factor authentication is enabled for this user
     */
    @Column(name = "mfa_enabled", nullable = false)
    private Boolean mfaEnabled = false;
}
