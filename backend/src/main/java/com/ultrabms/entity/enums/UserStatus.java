package com.ultrabms.entity.enums;

/**
 * User account status enumeration.
 * Controls user login eligibility and visibility.
 *
 * Story 2.6: Admin User Management
 */
public enum UserStatus {
    /**
     * User account is active and can log in.
     * Default status for existing users.
     */
    ACTIVE,

    /**
     * User account is deactivated (soft-deleted).
     * Cannot log in until reactivated by an admin.
     */
    INACTIVE,

    /**
     * User account is pending activation.
     * May be used for email verification flows.
     */
    PENDING
}
