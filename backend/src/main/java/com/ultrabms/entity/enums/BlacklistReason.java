package com.ultrabms.entity.enums;

/**
 * Enum representing reasons why a token was blacklisted.
 *
 * <p>Used for audit trail and security monitoring to track why sessions were terminated.</p>
 */
public enum BlacklistReason {
    /**
     * User explicitly logged out from current device
     */
    LOGOUT,

    /**
     * User logged out from all devices simultaneously
     */
    LOGOUT_ALL,

    /**
     * Session expired due to inactivity (idle timeout exceeded)
     */
    IDLE_TIMEOUT,

    /**
     * Session expired due to absolute time limit (12 hours)
     */
    ABSOLUTE_TIMEOUT,

    /**
     * Token blacklisted after password reset for security
     */
    PASSWORD_RESET,

    /**
     * Token blacklisted due to suspicious activity or security violation
     */
    SECURITY_VIOLATION
}
