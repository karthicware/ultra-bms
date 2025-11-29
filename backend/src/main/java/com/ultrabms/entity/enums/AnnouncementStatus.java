package com.ultrabms.entity.enums;

/**
 * Announcement status enumeration.
 * Tracks announcement lifecycle from creation to archival.
 *
 * Story 9.2: Internal Announcement Management
 */
public enum AnnouncementStatus {
    /**
     * Announcement created but not yet published.
     * Can be edited, published, or deleted.
     */
    DRAFT,

    /**
     * Announcement published and visible to tenants.
     * Cannot be edited. Can be archived or deleted.
     */
    PUBLISHED,

    /**
     * Announcement past its expiry date.
     * Automatically set by scheduled job.
     * Hidden from tenant portal, visible in manager's History tab.
     */
    EXPIRED,

    /**
     * Announcement manually archived.
     * Hidden from tenant portal, visible in manager's History tab.
     */
    ARCHIVED
}
