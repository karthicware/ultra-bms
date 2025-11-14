package com.ultrabms.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request DTO for password reset completion.
 * Contains the reset token and new password.
 *
 * @param token Password reset token (64-character hex string)
 * @param newPassword New password meeting strength requirements
 */
public record ResetPasswordRequest(
    @NotBlank(message = "Token cannot be blank")
    String token,

    @NotBlank(message = "New password cannot be blank")
    @Size(min = 8, message = "Password must be at least 8 characters")
    String newPassword
) {
}
