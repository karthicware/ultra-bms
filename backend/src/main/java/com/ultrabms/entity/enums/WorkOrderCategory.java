package com.ultrabms.entity.enums;

/**
 * Work order category enumeration
 * Defines the type of maintenance work to be performed
 *
 * Story 4.1: Work Order Creation and Management
 */
public enum WorkOrderCategory {
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
     * Cleaning and janitorial services
     */
    CLEANING,

    /**
     * Painting and decorating work
     */
    PAINTING,

    /**
     * Landscaping and outdoor maintenance
     */
    LANDSCAPING,

    /**
     * Inspection-related remediation work from compliance failures
     */
    INSPECTION,

    /**
     * Other maintenance work not covered by specific categories
     */
    OTHER
}
