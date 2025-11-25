package com.ultrabms.scheduler;

import com.ultrabms.service.PMScheduleService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Scheduled job for processing preventive maintenance schedules.
 * Runs daily at midnight to generate work orders from active PM schedules.
 *
 * Story 4.2: Preventive Maintenance Scheduling
 */
@Component
public class PMScheduleJob {

    private static final Logger LOGGER = LoggerFactory.getLogger(PMScheduleJob.class);

    private final PMScheduleService pmScheduleService;

    public PMScheduleJob(PMScheduleService pmScheduleService) {
        this.pmScheduleService = pmScheduleService;
    }

    /**
     * Process PM schedules that are due for work order generation.
     * Runs every day at midnight (00:00:00).
     *
     * The job:
     * 1. Finds all ACTIVE PM schedules where nextGenerationDate <= today
     * 2. Generates work orders for each due schedule
     * 3. Updates nextGenerationDate to the next recurrence date
     * 4. Marks schedules as COMPLETED if they've reached their end date
     */
    @Scheduled(cron = "${pm.schedule.cron:0 0 0 * * *}")
    public void processScheduledGenerations() {
        LOGGER.info("Starting PM schedule job: Processing scheduled work order generations");

        try {
            int generatedCount = pmScheduleService.processScheduledGenerations();
            LOGGER.info("PM schedule job completed: Generated {} work orders", generatedCount);
        } catch (Exception e) {
            LOGGER.error("PM schedule job failed: {}", e.getMessage(), e);
        }
    }
}
