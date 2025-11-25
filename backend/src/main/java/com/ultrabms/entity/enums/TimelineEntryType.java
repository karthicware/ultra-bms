package com.ultrabms.entity.enums;

/**
 * Timeline entry types for work order progress tracking.
 * Used to categorize events in the work order timeline.
 *
 * Story 4.4: Job Progress Tracking and Completion
 */
public enum TimelineEntryType {
    /**
     * Work order was created
     */
    CREATED,

    /**
     * Work order was assigned to a vendor/staff
     */
    ASSIGNED,

    /**
     * Work was started (status changed to IN_PROGRESS)
     */
    STARTED,

    /**
     * Progress update was added
     */
    PROGRESS_UPDATE,

    /**
     * Work was completed (status changed to COMPLETED)
     */
    COMPLETED,

    /**
     * Status was changed (generic status change)
     */
    STATUS_CHANGE,

    /**
     * Comment was added
     */
    COMMENT,

    /**
     * Work order was reassigned
     */
    REASSIGNED
}
