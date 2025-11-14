package com.ultrabms.entity.enums;

/**
 * Enum representing JWT token types for blacklist tracking.
 *
 * <p>Distinguishes between short-lived access tokens and long-lived refresh tokens
 * in the token blacklist for session management.</p>
 */
public enum TokenType {
    /**
     * Access token (short-lived, typically 1 hour)
     * Used for API authentication
     */
    ACCESS,

    /**
     * Refresh token (long-lived, typically 7 days)
     * Used to obtain new access tokens
     */
    REFRESH
}
