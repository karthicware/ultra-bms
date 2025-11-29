package com.ultrabms.scheduler;

import com.ultrabms.service.ComplianceScheduleService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Scheduled job for updating compliance schedule statuses.
 * Runs daily at 6 AM to update schedule statuses based on due dates.
 *
 * Story 7.3: Compliance and Inspection Tracking
 * AC #25: Daily job at 6AM to update UPCOMING→DUE (≤30 days), DUE→OVERDUE (past due)
 */
@Component
public class ComplianceStatusUpdateJob {

    private static final Logger LOGGER = LoggerFactory.getLogger(ComplianceStatusUpdateJob.class);

    private final ComplianceScheduleService complianceScheduleService;

    public ComplianceStatusUpdateJob(ComplianceScheduleService complianceScheduleService) {
        this.complianceScheduleService = complianceScheduleService;
    }

    /**
     * Update compliance schedule statuses.
     * Runs every day at 6 AM.
     *
     * - Updates UPCOMING schedules to DUE when due date is within 30 days
     * - Updates DUE/UPCOMING schedules to OVERDUE when past due date
     */
    @Scheduled(cron = "${compliance.status.update.cron:0 0 6 * * *}")
    public void updateComplianceStatuses() {
        LOGGER.info("Starting compliance status update job");

        try {
            complianceScheduleService.updateScheduleStatuses();
            LOGGER.info("Compliance status update job completed successfully");
        } catch (Exception e) {
            LOGGER.error("Compliance status update job failed: {}", e.getMessage(), e);
        }
    }
}
