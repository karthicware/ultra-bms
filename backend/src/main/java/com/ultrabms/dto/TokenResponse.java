package com.ultrabms.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/**
 * Data Transfer Object for token refresh response.
 *
 * <p>This record contains the new access token issued after a successful
 * refresh token validation.</p>
 *
 * @param accessToken new JWT access token (1 hour expiration)
 * @param expiresIn access token expiration time in seconds
 */
@Schema(description = "Token response with new access token")
public record TokenResponse(
        @NotBlank(message = "Access token is required")
        @Schema(description = "New JWT access token (1 hour expiration)", example = "eyJhbGciOiJIUzI1NiIs...", required = true)
        String accessToken,

        @NotNull(message = "Expiration time is required")
        @Positive(message = "Expiration time must be positive")
        @Schema(description = "Access token expiration time in seconds", example = "3600", required = true)
        Long expiresIn
) {
}
