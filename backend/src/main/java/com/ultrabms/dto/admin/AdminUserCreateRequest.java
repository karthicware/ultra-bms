package com.ultrabms.dto.admin;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for creating a new user via admin API.
 * Used in POST /api/v1/admin/users
 *
 * Story 2.6: Admin User Management
 * AC: #2 - Create User API
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserCreateRequest {

    /**
     * User's first name (required)
     */
    @NotBlank(message = "First name is required")
    @Size(max = 100, message = "First name must not exceed 100 characters")
    private String firstName;

    /**
     * User's last name (required)
     */
    @NotBlank(message = "Last name is required")
    @Size(max = 100, message = "Last name must not exceed 100 characters")
    private String lastName;

    /**
     * User's email address (required, must be unique)
     */
    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email address")
    @Size(max = 255, message = "Email must not exceed 255 characters")
    private String email;

    /**
     * User's phone number in E.164 format (optional)
     */
    @Size(max = 20, message = "Phone number must not exceed 20 characters")
    private String phone;

    /**
     * Role ID to assign to the user (required)
     */
    @NotNull(message = "Role ID is required")
    private Long roleId;

    /**
     * Temporary password for the new user (required).
     * User must change this on first login.
     */
    @NotBlank(message = "Temporary password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String temporaryPassword;
}
