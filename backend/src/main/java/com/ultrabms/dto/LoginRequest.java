package com.ultrabms.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * Data Transfer Object for user login requests.
 *
 * <p>This record encapsulates the credentials required to authenticate a user.</p>
 *
 * @param email user's email address
 * @param password user's plain text password (will be verified against BCrypt hash)
 */
@Schema(description = "User login request with email and password credentials")
public record LoginRequest(
        @NotBlank(message = "Email is required")
        @Email(message = "Email must be valid")
        @Schema(description = "User's email address", example = "john.doe@ultrabms.com", required = true)
        String email,

        @NotBlank(message = "Password is required")
        @Schema(description = "User's password", example = "P@ssw0rd123", required = true)
        String password
) {
}
