package com.ultrabms.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entity representing password reset tokens for secure account recovery workflow.
 * Tokens are cryptographically secure (64-char hex from 32 bytes) with 15-minute expiration.
 * Single-use tokens are invalidated after successful password reset.
 */
@Entity
@Table(name = "password_reset_tokens", indexes = {
    @Index(name = "idx_password_reset_tokens_token", columnList = "token"),
    @Index(name = "idx_password_reset_tokens_expires_at", columnList = "expires_at"),
    @Index(name = "idx_password_reset_tokens_user_id", columnList = "user_id")
})
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class PasswordResetToken extends BaseEntity {

    /**
     * User requesting password reset - cascades on delete
     */
    @NotNull(message = "User cannot be null")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /**
     * Cryptographically secure random token (64-char hex encoded from 32 bytes)
     * Unique across all tokens for secure validation
     */
    @NotNull(message = "Token cannot be null")
    @Size(min = 64, max = 255, message = "Token must be between 64 and 255 characters")
    @Column(name = "token", unique = true, nullable = false, length = 255)
    private String token;

    /**
     * Token expiration timestamp - tokens valid for 15 minutes from creation
     */
    @NotNull(message = "Expiration time cannot be null")
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    /**
     * Single-use flag - true after password successfully reset
     * Prevents token reuse for security
     */
    @Column(name = "used", nullable = false)
    private Boolean used = false;

    /**
     * Check if token has expired based on current time.
     *
     * @return true if token expiration time is in the past, false otherwise
     */
    public boolean isExpired() {
        return expiresAt.isBefore(LocalDateTime.now());
    }

    /**
     * Check if token is valid for password reset.
     * Token is valid if it hasn't been used and hasn't expired.
     *
     * @return true if token can be used for password reset, false otherwise
     */
    public boolean isValid() {
        return !used && !isExpired();
    }
}
