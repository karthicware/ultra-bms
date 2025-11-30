package com.ultrabms.scheduler;

import com.ultrabms.service.AnnouncementService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Scheduled job for announcement expiry management.
 * Runs daily at midnight to update PUBLISHED announcements that have passed
 * their expiresAt date to EXPIRED status.
 *
 * Story 9.2: Internal Announcement Management (AC #23-26)
 */
@Component
public class AnnouncementExpiryJob {

    private static final Logger LOGGER = LoggerFactory.getLogger(AnnouncementExpiryJob.class);

    private final AnnouncementService announcementService;

    public AnnouncementExpiryJob(AnnouncementService announcementService) {
        this.announcementService = announcementService;
    }

    /**
     * Check for expired announcements and update their status.
     * Runs daily at midnight (00:00:00).
     *
     * AC #23: Expired announcements automatically hidden from tenant portal
     * AC #24: Status updated from PUBLISHED to EXPIRED
     * AC #25: Visible in History tab after expiry
     * AC #26: Can be archived or deleted by admins
     */
    @Scheduled(cron = "${announcement.expiry.cron:0 0 0 * * *}")
    @Transactional
    public void expireOverdueAnnouncements() {
        LOGGER.info("Starting announcement expiry job");

        try {
            int expiredCount = announcementService.expireOverdueAnnouncements();
            LOGGER.info("Announcement expiry job completed. Expired {} announcements", expiredCount);
        } catch (Exception e) {
            LOGGER.error("Error in announcement expiry job: {}", e.getMessage(), e);
        }
    }
}
