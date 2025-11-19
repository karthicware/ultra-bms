package com.ultrabms.entity;

import com.ultrabms.entity.enums.BlacklistReason;
import com.ultrabms.entity.enums.TokenType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entity representing blacklisted JWT tokens for secure logout implementation.
 *
 * <p>When a user logs out, both access and refresh tokens are added to this blacklist
 * to prevent their reuse even if they haven't expired yet.</p>
 *
 * <p>Expired tokens are automatically cleaned up by a scheduled job to prevent
 * database growth.</p>
 */
@Entity
@Table(name = "token_blacklist", indexes = {
    @Index(name = "idx_token_blacklist_token_hash", columnList = "token_hash"),
    @Index(name = "idx_token_blacklist_expires_at", columnList = "expires_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TokenBlacklist {

    /**
     * Unique identifier for the blacklist entry
     */
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    /**
     * Hashed token value (using SHA-256 for security)
     * Storing the hash instead of the actual token prevents token leakage if database is compromised
     */
    @NotNull(message = "Token hash cannot be null")
    @Column(name = "token_hash", nullable = false, unique = true, length = 64)
    private String tokenHash;

    /**
     * When the token expires (copied from token's exp claim)
     * Used for automatic cleanup of expired entries
     */
    @NotNull(message = "Token expiration date cannot be null")
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    /**
     * When the token was added to the blacklist
     */
    @NotNull(message = "Blacklisted date cannot be null")
    @Column(name = "blacklisted_at", nullable = false)
    private LocalDateTime blacklistedAt;

    /**
     * Type of token (ACCESS or REFRESH)
     * Distinguishes between short-lived access tokens and long-lived refresh tokens
     */
    @NotNull(message = "Token type cannot be null")
    @Enumerated(EnumType.STRING)
    @Column(name = "token_type", nullable = false, length = 20)
    private TokenType tokenType = TokenType.ACCESS;

    /**
     * Reason why the token was blacklisted
     * Used for audit trail and security monitoring
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "reason", length = 100)
    private BlacklistReason reason;

    /**
     * When the token was blacklisted (same as blacklistedAt, for consistency)
     * Added for uniformity with other entities
     */
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    /**
     * Constructor for creating a new blacklist entry.
     *
     * @param tokenHash hashed token value
     * @param expiresAt when the token expires
     */
    public TokenBlacklist(String tokenHash, LocalDateTime expiresAt) {
        this.tokenHash = tokenHash;
        this.expiresAt = expiresAt;
        this.blacklistedAt = LocalDateTime.now();
        this.createdAt = LocalDateTime.now();
        this.tokenType = TokenType.ACCESS;
    }

    /**
     * Constructor for creating a new blacklist entry with token type and reason.
     *
     * @param tokenHash hashed token value
     * @param tokenType type of token (ACCESS or REFRESH)
     * @param expiresAt when the token expires
     * @param reason    why the token was blacklisted
     */
    public TokenBlacklist(String tokenHash, TokenType tokenType, LocalDateTime expiresAt, BlacklistReason reason) {
        this.tokenHash = tokenHash;
        this.tokenType = tokenType;
        this.expiresAt = expiresAt;
        this.reason = reason;
        this.blacklistedAt = LocalDateTime.now();
        this.createdAt = LocalDateTime.now();
    }
}
