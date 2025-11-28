package com.ultrabms.dto.admin;

import com.ultrabms.entity.enums.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for returning user details in admin API responses.
 * Used in GET /api/v1/admin/users and all CRUD operations.
 *
 * Story 2.6: Admin User Management
 * AC: #1 - User List API
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserResponse {

    /**
     * User's unique identifier
     */
    private UUID id;

    /**
     * User's first name
     */
    private String firstName;

    /**
     * User's last name
     */
    private String lastName;

    /**
     * User's email address
     */
    private String email;

    /**
     * User's phone number
     */
    private String phone;

    /**
     * User's role name (e.g., "SUPER_ADMIN", "PROPERTY_MANAGER")
     */
    private String role;

    /**
     * User's role ID for editing purposes
     */
    private Long roleId;

    /**
     * User's account status (ACTIVE, INACTIVE, PENDING)
     */
    private UserStatus status;

    /**
     * When the user account was created
     */
    private LocalDateTime createdAt;

    /**
     * When the user account was last updated
     */
    private LocalDateTime updatedAt;
}
