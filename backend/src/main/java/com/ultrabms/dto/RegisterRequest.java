package com.ultrabms.dto;

import com.ultrabms.validator.StrongPassword;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;

/**
 * Data Transfer Object for user registration requests.
 *
 * <p>This record encapsulates the data required to register a new user in the system.
 * Password validation enforces minimum security requirements per AC2.</p>
 *
 * @param email user's email address (RFC 5322 compliant, unique)
 * @param password plain text password (will be hashed with BCrypt before storage)
 * @param firstName user's first name
 * @param lastName user's last name
 * @param role user's role in the system
 * @param phone optional phone number (E.164 format)
 */
@Schema(description = "User registration request with credentials and profile information")
public record RegisterRequest(
        @NotBlank(message = "Email is required")
        @Email(message = "Email must be valid (RFC 5322 compliant)")
        @Size(max = 255, message = "Email must not exceed 255 characters")
        @Schema(description = "User's email address (unique)", example = "john.doe@ultrabms.com", required = true)
        String email,

        @NotBlank(message = "Password is required")
        @StrongPassword
        @Schema(
                description = "User's password (min 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character)",
                example = "P@ssw0rd123",
                required = true
        )
        String password,

        @NotBlank(message = "First name is required")
        @Size(max = 100, message = "First name must not exceed 100 characters")
        @Schema(description = "User's first name", example = "John", required = true)
        String firstName,

        @NotBlank(message = "Last name is required")
        @Size(max = 100, message = "Last name must not exceed 100 characters")
        @Schema(description = "User's last name", example = "Doe", required = true)
        String lastName,

        @NotBlank(message = "Role is required")
        @Schema(
                description = "User's role in the system (role name)",
                example = "PROPERTY_MANAGER",
                allowableValues = {"SUPER_ADMIN", "PROPERTY_MANAGER", "MAINTENANCE_SUPERVISOR", "FINANCE_MANAGER", "TENANT", "VENDOR"},
                required = true
        )
        String roleName,

        @Pattern(
                regexp = "^\\+971[0-9]{9}$",
                message = "Phone number must be a valid UAE number in E.164 format (e.g., +971501234567)"
        )
        @Schema(description = "User's phone number - UAE numbers only in E.164 format (optional)", example = "+971501234567")
        String phone
) {
}
