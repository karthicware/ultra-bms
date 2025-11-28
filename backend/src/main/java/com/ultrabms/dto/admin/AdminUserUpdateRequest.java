package com.ultrabms.dto.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for updating an existing user via admin API.
 * Used in PUT /api/v1/admin/users/{id}
 * Note: Email is immutable and cannot be updated.
 *
 * Story 2.6: Admin User Management
 * AC: #4 - Update User API
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserUpdateRequest {

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
     * User's phone number in E.164 format (optional)
     */
    @Size(max = 20, message = "Phone number must not exceed 20 characters")
    private String phone;

    /**
     * Role ID to assign to the user (required)
     */
    @NotNull(message = "Role ID is required")
    private Long roleId;
}
