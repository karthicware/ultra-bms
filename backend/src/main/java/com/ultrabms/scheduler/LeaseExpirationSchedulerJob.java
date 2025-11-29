package com.ultrabms.scheduler;

import com.ultrabms.entity.Tenant;
import com.ultrabms.entity.enums.TenantStatus;
import com.ultrabms.repository.TenantRepository;
import com.ultrabms.service.IEmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * Scheduled job for lease expiration monitoring and notifications.
 * Handles tenant status updates and expiry reminder emails.
 *
 * Story 3.6: Tenant Lease Extension and Renewal (AC #9)
 */
@Component
public class LeaseExpirationSchedulerJob {

    private static final Logger LOGGER = LoggerFactory.getLogger(LeaseExpirationSchedulerJob.class);

    private final TenantRepository tenantRepository;
    private final IEmailService emailService;

    public LeaseExpirationSchedulerJob(
            TenantRepository tenantRepository,
            IEmailService emailService) {
        this.tenantRepository = tenantRepository;
        this.emailService = emailService;
    }

    /**
     * Monitor lease expirations and update tenant status.
     * Runs every day at 6 AM.
     *
     * Updates ACTIVE tenants to EXPIRING_SOON when lease ends within 60 days.
     * Updates EXPIRING_SOON or ACTIVE tenants to EXPIRED when lease end date is past.
     */
    @Scheduled(cron = "${lease.expiration.cron:0 0 6 * * *}")
    @Transactional
    public void monitorLeaseExpirations() {
        LOGGER.info("Starting lease expiration monitoring job");

        try {
            LocalDate today = LocalDate.now();
            LocalDate in60Days = today.plusDays(60);

            // 1. Mark expired leases
            int expiredCount = markExpiredLeases(today);
            LOGGER.info("Marked {} leases as EXPIRED", expiredCount);

            // 2. Mark leases expiring within 60 days
            int expiringSoonCount = markExpiringSoonLeases(today, in60Days);
            LOGGER.info("Marked {} leases as EXPIRING_SOON", expiringSoonCount);

            LOGGER.info("Lease expiration monitoring completed");
        } catch (Exception e) {
            LOGGER.error("Lease expiration monitoring job failed: {}", e.getMessage(), e);
        }
    }

    /**
     * Send 60-day lease expiry reminders.
     * Runs every day at 8 AM.
     *
     * Sends reminder to tenants whose lease expires in ~60 days
     * and haven't been notified yet.
     */
    @Scheduled(cron = "${lease.reminder.60day.cron:0 0 8 * * *}")
    @Transactional
    public void send60DayReminders() {
        LOGGER.info("Starting 60-day lease expiry reminder job");

        try {
            LocalDate today = LocalDate.now();
            LocalDate in60Days = today.plusDays(60);
            LocalDate in59Days = today.plusDays(59);

            // Find tenants with leases expiring in 59-60 days who haven't been notified
            List<Tenant> tenants = tenantRepository.findExpiringLeases(in59Days, in60Days, TenantStatus.ACTIVE, true);

            int sentCount = 0;
            for (Tenant tenant : tenants) {
                if (!Boolean.TRUE.equals(tenant.getExpiry60DayNotified())) {
                    int daysRemaining = (int) java.time.temporal.ChronoUnit.DAYS.between(today, tenant.getLeaseEndDate());
                    try {
                        emailService.sendLeaseExpiryReminder(tenant, daysRemaining);
                        tenant.setExpiry60DayNotified(true);
                        tenantRepository.save(tenant);
                        sentCount++;
                    } catch (Exception e) {
                        LOGGER.error("Failed to send 60-day reminder to tenant {}: {}", tenant.getId(), e.getMessage());
                    }
                }
            }

            LOGGER.info("60-day reminder job completed: {} reminders sent", sentCount);
        } catch (Exception e) {
            LOGGER.error("60-day reminder job failed: {}", e.getMessage(), e);
        }
    }

    /**
     * Send 30-day lease expiry reminders.
     * Runs every day at 9 AM.
     *
     * Sends reminder to tenants whose lease expires in ~30 days
     * and haven't been notified for this threshold yet.
     */
    @Scheduled(cron = "${lease.reminder.30day.cron:0 0 9 * * *}")
    @Transactional
    public void send30DayReminders() {
        LOGGER.info("Starting 30-day lease expiry reminder job");

        try {
            LocalDate today = LocalDate.now();
            LocalDate in30Days = today.plusDays(30);
            LocalDate in29Days = today.plusDays(29);

            // Find tenants with leases expiring in 29-30 days who haven't been notified
            List<Tenant> tenants = tenantRepository.findExpiringLeases(in29Days, in30Days, TenantStatus.ACTIVE, true);
            tenants.addAll(tenantRepository.findExpiringLeases(in29Days, in30Days, TenantStatus.EXPIRING_SOON, true));

            int sentCount = 0;
            for (Tenant tenant : tenants) {
                if (!Boolean.TRUE.equals(tenant.getExpiry30DayNotified())) {
                    int daysRemaining = (int) java.time.temporal.ChronoUnit.DAYS.between(today, tenant.getLeaseEndDate());
                    try {
                        emailService.sendLeaseExpiryReminder(tenant, daysRemaining);
                        tenant.setExpiry30DayNotified(true);
                        tenantRepository.save(tenant);
                        sentCount++;
                    } catch (Exception e) {
                        LOGGER.error("Failed to send 30-day reminder to tenant {}: {}", tenant.getId(), e.getMessage());
                    }
                }
            }

            LOGGER.info("30-day reminder job completed: {} reminders sent", sentCount);
        } catch (Exception e) {
            LOGGER.error("30-day reminder job failed: {}", e.getMessage(), e);
        }
    }

    /**
     * Send 14-day lease expiry reminders (urgent).
     * Runs every day at 10 AM.
     *
     * Sends urgent reminder to tenants whose lease expires in ~14 days
     * and haven't been notified for this threshold yet.
     */
    @Scheduled(cron = "${lease.reminder.14day.cron:0 0 10 * * *}")
    @Transactional
    public void send14DayReminders() {
        LOGGER.info("Starting 14-day lease expiry reminder job");

        try {
            LocalDate today = LocalDate.now();
            LocalDate in14Days = today.plusDays(14);
            LocalDate in13Days = today.plusDays(13);

            // Find tenants with leases expiring in 13-14 days who haven't been notified
            List<Tenant> tenants = tenantRepository.findExpiringLeases(in13Days, in14Days, TenantStatus.ACTIVE, true);
            tenants.addAll(tenantRepository.findExpiringLeases(in13Days, in14Days, TenantStatus.EXPIRING_SOON, true));

            int sentCount = 0;
            for (Tenant tenant : tenants) {
                if (!Boolean.TRUE.equals(tenant.getExpiry14DayNotified())) {
                    int daysRemaining = (int) java.time.temporal.ChronoUnit.DAYS.between(today, tenant.getLeaseEndDate());
                    try {
                        emailService.sendLeaseExpiryReminder(tenant, daysRemaining);
                        tenant.setExpiry14DayNotified(true);
                        tenantRepository.save(tenant);
                        sentCount++;
                    } catch (Exception e) {
                        LOGGER.error("Failed to send 14-day reminder to tenant {}: {}", tenant.getId(), e.getMessage());
                    }
                }
            }

            LOGGER.info("14-day reminder job completed: {} reminders sent", sentCount);
        } catch (Exception e) {
            LOGGER.error("14-day reminder job failed: {}", e.getMessage(), e);
        }
    }

    // ========================================================================
    // Private Helper Methods
    // ========================================================================

    /**
     * Mark tenants with past lease end dates as EXPIRED
     */
    private int markExpiredLeases(LocalDate today) {
        List<Tenant> expiredTenants = tenantRepository.findExpiringLeases(
                LocalDate.MIN, today.minusDays(1), TenantStatus.ACTIVE, true);
        expiredTenants.addAll(tenantRepository.findExpiringLeases(
                LocalDate.MIN, today.minusDays(1), TenantStatus.EXPIRING_SOON, true));

        int count = 0;
        for (Tenant tenant : expiredTenants) {
            if (tenant.getLeaseEndDate().isBefore(today)) {
                tenant.setStatus(TenantStatus.EXPIRED);
                tenantRepository.save(tenant);
                count++;
            }
        }
        return count;
    }

    /**
     * Mark active tenants with leases expiring within 60 days as EXPIRING_SOON
     */
    private int markExpiringSoonLeases(LocalDate today, LocalDate in60Days) {
        List<Tenant> expiringTenants = tenantRepository.findExpiringLeases(
                today, in60Days, TenantStatus.ACTIVE, true);

        int count = 0;
        for (Tenant tenant : expiringTenants) {
            tenant.setStatus(TenantStatus.EXPIRING_SOON);
            tenantRepository.save(tenant);
            count++;
        }
        return count;
    }
}
