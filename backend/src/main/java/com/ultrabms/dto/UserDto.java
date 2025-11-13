package com.ultrabms.dto;

import com.ultrabms.entity.enums.UserRole;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Data Transfer Object for User entity.
 *
 * <p>This record represents user data in API requests and responses, excluding
 * sensitive fields like passwordHash. Using records (Java 17+) provides immutability
 * and reduces boilerplate code.</p>
 *
 * <p>Validation annotations ensure data integrity at the API boundary before
 * reaching the service layer.</p>
 *
 * @param id user's unique identifier (null for creation)
 * @param email user's email address (must be unique)
 * @param firstName user's first name
 * @param lastName user's last name
 * @param role user's role in the system
 * @param active whether the user account is active
 * @param mfaEnabled whether MFA is enabled for this user
 * @param createdAt when the user was created (audit field)
 * @param updatedAt when the user was last updated (audit field)
 */
@Schema(description = "User information including role and status")
public record UserDto(
        @Schema(description = "User's unique identifier", example = "550e8400-e29b-41d4-a716-446655440000")
        UUID id,

        @NotBlank(message = "Email is required")
        @Email(message = "Email must be valid")
        @Size(max = 255, message = "Email must not exceed 255 characters")
        @Schema(description = "User's email address (unique)", example = "john.doe@ultrabms.com")
        String email,

        @NotBlank(message = "First name is required")
        @Size(max = 100, message = "First name must not exceed 100 characters")
        @Schema(description = "User's first name", example = "John")
        String firstName,

        @NotBlank(message = "Last name is required")
        @Size(max = 100, message = "Last name must not exceed 100 characters")
        @Schema(description = "User's last name", example = "Doe")
        String lastName,

        @NotNull(message = "Role is required")
        @Schema(description = "User's role in the system", example = "PROPERTY_MANAGER")
        UserRole role,

        @Schema(description = "Whether the user account is active", example = "true")
        Boolean active,

        @Schema(description = "Whether multi-factor authentication is enabled", example = "false")
        Boolean mfaEnabled,

        @Schema(description = "When the user was created", example = "2025-11-13T10:30:00")
        LocalDateTime createdAt,

        @Schema(description = "When the user was last updated", example = "2025-11-13T10:30:00")
        LocalDateTime updatedAt
) {
    /**
     * Creates a UserDto for user creation (without ID and audit fields).
     *
     * @param email user's email
     * @param firstName user's first name
     * @param lastName user's last name
     * @param role user's role
     * @param active whether the account is active
     * @param mfaEnabled whether MFA is enabled
     * @return a new UserDto instance
     */
    public static UserDto forCreation(
            String email,
            String firstName,
            String lastName,
            UserRole role,
            Boolean active,
            Boolean mfaEnabled
    ) {
        return new UserDto(null, email, firstName, lastName, role, active, mfaEnabled, null, null);
    }
}
