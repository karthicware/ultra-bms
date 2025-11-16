package com.ultrabms.entity.enums;

/**
 * Preferred access time enumeration
 * Defines when tenant prefers vendor to access the unit for maintenance
 */
public enum PreferredAccessTime {
    /**
     * Immediate access required (for emergency/high priority requests)
     */
    IMMEDIATE,

    /**
     * Morning time slot (8 AM - 12 PM)
     */
    MORNING,

    /**
     * Afternoon time slot (12 PM - 5 PM)
     */
    AFTERNOON,

    /**
     * Evening time slot (5 PM - 8 PM)
     */
    EVENING,

    /**
     * Any time convenient for vendor
     */
    ANY_TIME
}
