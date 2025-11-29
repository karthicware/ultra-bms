package com.ultrabms.scheduler;

import com.ultrabms.entity.ComplianceSchedule;
import com.ultrabms.entity.User;
import com.ultrabms.entity.enums.UserRole;
import com.ultrabms.repository.ComplianceScheduleRepository;
import com.ultrabms.repository.UserRepository;
import com.ultrabms.service.IEmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Scheduled job for sending compliance reminder notifications.
 * Runs daily at 8 AM to send reminders for compliance items due within 14 days.
 *
 * Story 7.3: Compliance and Inspection Tracking
 * AC #26: Daily job at 8AM to send reminder notifications for items due within 14 days
 */
@Component
public class ComplianceReminderNotificationJob {

    private static final Logger LOGGER = LoggerFactory.getLogger(ComplianceReminderNotificationJob.class);
    private static final int REMINDER_DAYS_THRESHOLD = 14;
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("MMM dd, yyyy");

    private final ComplianceScheduleRepository scheduleRepository;
    private final UserRepository userRepository;
    private final IEmailService emailService;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    public ComplianceReminderNotificationJob(
            ComplianceScheduleRepository scheduleRepository,
            UserRepository userRepository,
            IEmailService emailService) {
        this.scheduleRepository = scheduleRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    /**
     * Send compliance reminder notifications.
     * Runs every day at 8 AM.
     *
     * Sends reminders for compliance items due within the next 14 days
     * to property managers and administrators.
     */
    @Scheduled(cron = "${compliance.reminder.notification.cron:0 0 8 * * *}")
    @Transactional(readOnly = true)
    public void sendComplianceReminders() {
        LOGGER.info("Starting compliance reminder notification job");

        try {
            LocalDate today = LocalDate.now();
            LocalDate reminderEndDate = today.plusDays(REMINDER_DAYS_THRESHOLD);

            // Find schedules due within next 14 days (excluding COMPLETED and EXEMPT)
            List<ComplianceSchedule> schedules = scheduleRepository.findSchedulesForReminder(today, reminderEndDate);

            if (schedules.isEmpty()) {
                LOGGER.info("No compliance reminders to send");
                return;
            }

            // Get admin/property manager users to notify
            List<User> managers = userRepository.findByRoleIn(
                    List.of(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PROPERTY_MANAGER)
            );

            if (managers.isEmpty()) {
                LOGGER.warn("No managers found to send compliance reminders to");
                return;
            }

            int sentCount = 0;
            for (ComplianceSchedule schedule : schedules) {
                long daysUntilDue = ChronoUnit.DAYS.between(today, schedule.getDueDate());

                // Get schedule details (requires fetching lazy relationships)
                String scheduleNumber = schedule.getScheduleNumber() != null
                        ? schedule.getScheduleNumber()
                        : schedule.getId().toString().substring(0, 8).toUpperCase();
                String requirementName = schedule.getComplianceRequirement().getRequirementName();
                String categoryDisplayName = schedule.getComplianceRequirement().getCategory().name();
                String propertyName = schedule.getProperty().getName();
                String dueDate = schedule.getDueDate().format(DATE_FORMATTER);
                String portalUrl = frontendUrl + "/property-manager/compliance/schedules/" + schedule.getId();

                // Send to all managers
                for (User manager : managers) {
                    try {
                        emailService.sendComplianceReminderNotification(
                                manager.getEmail(),
                                manager.getFirstName() + " " + manager.getLastName(),
                                scheduleNumber,
                                requirementName,
                                categoryDisplayName,
                                propertyName,
                                dueDate,
                                daysUntilDue,
                                portalUrl
                        );
                        sentCount++;
                    } catch (Exception e) {
                        LOGGER.error("Failed to send compliance reminder to {} for schedule {}: {}",
                                manager.getEmail(), scheduleNumber, e.getMessage());
                    }
                }
            }

            LOGGER.info("Compliance reminder notification job completed: {} reminders sent for {} schedules",
                    sentCount, schedules.size());

        } catch (Exception e) {
            LOGGER.error("Compliance reminder notification job failed: {}", e.getMessage(), e);
        }
    }
}
