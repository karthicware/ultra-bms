package com.ultrabms.entity.enums;

/**
 * Status enumeration for preventive maintenance schedules.
 * Tracks the lifecycle state of a PM schedule.
 *
 * Story 4.2: Preventive Maintenance Scheduling
 */
public enum PMScheduleStatus {
    /**
     * Schedule is active and generating work orders automatically
     */
    ACTIVE,

    /**
     * Schedule is paused, no automatic work order generation
     * Can be resumed to ACTIVE state
     */
    PAUSED,

    /**
     * Schedule is completed (end date reached or manually completed)
     * Cannot be edited or resumed
     */
    COMPLETED,

    /**
     * Schedule has been soft deleted
     * Only possible if no work orders have been generated
     */
    DELETED
}
