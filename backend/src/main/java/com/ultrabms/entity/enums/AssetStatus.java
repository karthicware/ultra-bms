package com.ultrabms.entity.enums;

/**
 * Asset status enumeration.
 * Status values for tracking asset lifecycle.
 *
 * Story 7.1: Asset Registry and Tracking
 * AC #3: AssetStatus enum with display names and colors
 */
public enum AssetStatus {
    /**
     * Asset is operational and in use
     */
    ACTIVE("Active", "#22c55e"),

    /**
     * Asset is currently being maintained or repaired
     */
    UNDER_MAINTENANCE("Under Maintenance", "#f59e0b"),

    /**
     * Asset is not operational but not yet disposed
     */
    OUT_OF_SERVICE("Out of Service", "#ef4444"),

    /**
     * Asset has been disposed/retired (soft delete)
     */
    DISPOSED("Disposed", "#6b7280");

    private final String displayName;
    private final String color;

    AssetStatus(String displayName, String color) {
        this.displayName = displayName;
        this.color = color;
    }

    /**
     * Get the display name for this status
     *
     * @return Human-readable display name
     */
    public String getDisplayName() {
        return displayName;
    }

    /**
     * Get the color associated with this status (hex format)
     *
     * @return Color hex code
     */
    public String getColor() {
        return color;
    }
}
