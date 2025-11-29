package com.ultrabms.entity.enums;

/**
 * Announcement template enumeration.
 * Pre-defined templates with default content for common announcement types.
 *
 * Story 9.2: Internal Announcement Management
 */
public enum AnnouncementTemplate {
    /**
     * Template for office closure announcements.
     * Used for holidays, emergency closures, etc.
     */
    OFFICE_CLOSURE,

    /**
     * Template for maintenance schedule announcements.
     * Used for planned building maintenance, utility work, etc.
     */
    MAINTENANCE_SCHEDULE,

    /**
     * Template for policy update announcements.
     * Used for rule changes, new policies, etc.
     */
    POLICY_UPDATE
}
