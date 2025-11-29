package com.ultrabms.entity.enums;

/**
 * Asset category enumeration.
 * Categories for classifying assets in the system.
 *
 * Story 7.1: Asset Registry and Tracking
 * AC #2: AssetCategory enum with display names
 */
public enum AssetCategory {
    /**
     * Heating, Ventilation, and Air Conditioning systems
     */
    HVAC("HVAC"),

    /**
     * Elevators and lifts
     */
    ELEVATOR("Elevator"),

    /**
     * Power generators
     */
    GENERATOR("Generator"),

    /**
     * Water pumps and systems
     */
    WATER_PUMP("Water Pump"),

    /**
     * Fire safety and suppression systems
     */
    FIRE_SYSTEM("Fire System"),

    /**
     * Security and surveillance systems
     */
    SECURITY_SYSTEM("Security System"),

    /**
     * Electrical panels and distribution systems
     */
    ELECTRICAL_PANEL("Electrical Panel"),

    /**
     * Plumbing fixtures and systems
     */
    PLUMBING_FIXTURE("Plumbing Fixture"),

    /**
     * Household and building appliances
     */
    APPLIANCE("Appliance"),

    /**
     * Other equipment and assets
     */
    OTHER("Other");

    private final String displayName;

    AssetCategory(String displayName) {
        this.displayName = displayName;
    }

    /**
     * Get the display name for this category
     *
     * @return Human-readable display name
     */
    public String getDisplayName() {
        return displayName;
    }
}
