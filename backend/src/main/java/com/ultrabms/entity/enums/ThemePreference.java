package com.ultrabms.entity.enums;

/**
 * User theme preference enumeration.
 * Controls the application appearance for the user.
 *
 * Story 2.7: Admin Theme Settings & System Theme Support
 */
public enum ThemePreference {
    /**
     * Use operating system preference (prefers-color-scheme).
     * Default value for all users.
     */
    SYSTEM,

    /**
     * Force light theme regardless of OS preference.
     */
    LIGHT,

    /**
     * Force dark theme regardless of OS preference.
     */
    DARK
}
