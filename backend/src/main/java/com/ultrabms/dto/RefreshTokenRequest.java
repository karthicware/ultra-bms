package com.ultrabms.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

/**
 * Data Transfer Object for token refresh requests.
 *
 * <p>This record contains the refresh token used to obtain a new access token
 * without requiring the user to re-authenticate.</p>
 *
 * @param refreshToken JWT refresh token (obtained from login response)
 */
@Schema(description = "Token refresh request with refresh token")
public record RefreshTokenRequest(
        @NotBlank(message = "Refresh token is required")
        @Schema(description = "JWT refresh token", example = "eyJhbGciOiJIUzI1NiIs...", required = true)
        String refreshToken
) {
}
