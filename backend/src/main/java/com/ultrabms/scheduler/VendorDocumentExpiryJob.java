package com.ultrabms.scheduler;

import com.ultrabms.service.VendorDocumentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Scheduled job for processing vendor document expiry notifications and auto-suspension.
 * Runs daily at 6 AM to:
 * 1. Send 30-day expiry notifications to Property Managers (AC #19)
 * 2. Send 15-day expiry notifications to Vendors (AC #20)
 * 3. Auto-suspend vendors with expired critical documents (AC #21)
 *
 * Story 5.2: Vendor Document and License Management
 */
@Component
public class VendorDocumentExpiryJob {

    private static final Logger LOGGER = LoggerFactory.getLogger(VendorDocumentExpiryJob.class);

    private final VendorDocumentService vendorDocumentService;

    public VendorDocumentExpiryJob(VendorDocumentService vendorDocumentService) {
        this.vendorDocumentService = vendorDocumentService;
    }

    /**
     * Process document expiry notifications and auto-suspension.
     * Runs every day at 6 AM (06:00:00).
     *
     * The job:
     * 1. Finds critical documents expiring within 30 days (PM notification not yet sent)
     * 2. Sends email to PM and marks notification as sent
     * 3. Finds critical documents expiring within 15 days (vendor notification not yet sent)
     * 4. Sends email to vendor and marks notification as sent
     * 5. Finds vendors with expired critical documents
     * 6. Auto-suspends those vendors and sends notification
     */
    @Scheduled(cron = "${vendor.document.expiry.cron:0 0 6 * * *}")
    public void processDocumentExpiryNotifications() {
        LOGGER.info("Starting vendor document expiry job: Processing notifications and auto-suspension");

        try {
            // Step 1: Send 30-day expiry notifications to Property Manager (AC #19)
            int pm30DayCount = vendorDocumentService.sendExpiryNotifications30Day();
            LOGGER.info("Sent {} 30-day expiry notifications to Property Manager", pm30DayCount);

            // Step 2: Send 15-day expiry notifications to Vendors (AC #20)
            int vendor15DayCount = vendorDocumentService.sendExpiryNotifications15Day();
            LOGGER.info("Sent {} 15-day expiry notifications to Vendors", vendor15DayCount);

            // Step 3: Auto-suspend vendors with expired critical documents (AC #21)
            int suspendedCount = vendorDocumentService.processAutoSuspension();
            LOGGER.info("Auto-suspended {} vendors due to expired critical documents", suspendedCount);

            LOGGER.info("Vendor document expiry job completed: 30-day={}, 15-day={}, suspended={}",
                    pm30DayCount, vendor15DayCount, suspendedCount);

        } catch (Exception e) {
            LOGGER.error("Vendor document expiry job failed: {}", e.getMessage(), e);
        }
    }
}
