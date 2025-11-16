package com.ultrabms.entity.enums;

/**
 * Maintenance request category enumeration
 * Defines the type of maintenance issue reported by tenant
 */
public enum MaintenanceCategory {
    /**
     * Plumbing issues (leaks, clogs, water pressure, pipes)
     */
    PLUMBING,

    /**
     * Electrical issues (power outages, switches, outlets, wiring)
     */
    ELECTRICAL,

    /**
     * Heating, Ventilation, and Air Conditioning issues
     */
    HVAC,

    /**
     * Appliance issues (refrigerator, stove, washer, dryer)
     */
    APPLIANCE,

    /**
     * Carpentry issues (doors, windows, cabinets, flooring)
     */
    CARPENTRY,

    /**
     * Pest control issues (insects, rodents)
     */
    PEST_CONTROL,

    /**
     * Cleaning and maintenance issues
     */
    CLEANING,

    /**
     * Other maintenance issues not covered by specific categories
     */
    OTHER
}
