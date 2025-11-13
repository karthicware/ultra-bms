package com.ultrabms.entity;

import jakarta.persistence.*;
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
     * Constructor for creating a new blacklist entry.
     *
     * @param tokenHash hashed token value
     * @param expiresAt when the token expires
     */
    public TokenBlacklist(String tokenHash, LocalDateTime expiresAt) {
        this.tokenHash = tokenHash;
        this.expiresAt = expiresAt;
        this.blacklistedAt = LocalDateTime.now();
    }
}
