package com.ultrabms.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/**
 * Data Transfer Object for login response containing JWT tokens and user profile.
 *
 * <p>This record includes both access and refresh tokens, along with token expiration
 * time and the authenticated user's profile information.</p>
 *
 * @param accessToken JWT access token (1 hour expiration)
 * @param refreshToken JWT refresh token (7 days expiration, also set as HTTP-only cookie)
 * @param expiresIn access token expiration time in seconds
 * @param user authenticated user's profile information
 */
@Schema(description = "Login response with JWT tokens and user profile")
public record LoginResponse(
        @NotBlank(message = "Access token is required")
        @Schema(description = "JWT access token (1 hour expiration)", example = "eyJhbGciOiJIUzI1NiIs...", required = true)
        String accessToken,

        @NotBlank(message = "Refresh token is required")
        @Schema(description = "JWT refresh token (7 days expiration)", example = "eyJhbGciOiJIUzI1NiIs...", required = true)
        String refreshToken,

        @NotNull(message = "Expiration time is required")
        @Positive(message = "Expiration time must be positive")
        @Schema(description = "Access token expiration time in seconds", example = "3600", required = true)
        Long expiresIn,

        @NotNull(message = "User profile is required")
        @Schema(description = "Authenticated user's profile (excluding password)", required = true)
        UserDto user
) {
}
