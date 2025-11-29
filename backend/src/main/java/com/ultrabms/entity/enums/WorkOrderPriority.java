package com.ultrabms.entity.enums;

/**
 * Work order priority enumeration
 * Indicates urgency level of the maintenance work
 *
 * Story 4.1: Work Order Creation and Management
 */
public enum WorkOrderPriority {
    /**
     * Urgent priority - Critical compliance violations and safety issues
     * Requires immediate action
     * Examples: Compliance violations, fire safety issues, critical repairs
     */
    URGENT,

    /**
     * High priority - Emergency repairs, safety issues
     * Requires immediate attention
     * Examples: Gas leak, flooding, electrical hazards, AC failure in extreme weather
     */
    HIGH,

    /**
     * Medium priority - Non-urgent repairs
     * Should be addressed within reasonable timeframe
     * Examples: Leaking faucet, broken appliance, faulty lock
     */
    MEDIUM,

    /**
     * Low priority - General maintenance
     * Can be scheduled at convenience
     * Examples: Routine maintenance, cosmetic repairs, minor touch-ups
     */
    LOW
}
