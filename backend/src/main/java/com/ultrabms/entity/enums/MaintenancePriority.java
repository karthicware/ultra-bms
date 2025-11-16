package com.ultrabms.entity.enums;

/**
 * Maintenance request priority enumeration
 * Indicates urgency level of the maintenance issue
 */
public enum MaintenancePriority {
    /**
     * High priority - Safety/emergency issues requiring immediate attention
     * Examples: No water, no power, gas leak, AC failure in summer
     */
    HIGH,

    /**
     * Medium priority - Important but not urgent issues
     * Examples: Leaking faucet, broken appliance, door lock issue
     */
    MEDIUM,

    /**
     * Low priority - Non-critical maintenance
     * Examples: Paint touch-up, minor repairs, cosmetic issues
     */
    LOW
}
