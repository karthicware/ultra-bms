package com.ultrabms.scheduler;

import com.ultrabms.dto.pdc.PDCListDto;
import com.ultrabms.entity.User;
import com.ultrabms.entity.enums.UserRole;
import com.ultrabms.repository.UserRepository;
import com.ultrabms.service.IEmailService;
import com.ultrabms.service.PDCService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Scheduled jobs for PDC (Post-Dated Cheque) management.
 * Handles automated status transitions and reminder emails.
 *
 * Story 6.3: Post-Dated Cheque (PDC) Management
 * AC #8: Automated RECEIVED → DUE status transition
 * AC #29: Email reminder for PDCs due for deposit
 */
@Component
public class PDCSchedulerJob {

    private static final Logger LOGGER = LoggerFactory.getLogger(PDCSchedulerJob.class);
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("MMM dd, yyyy");

    private final PDCService pdcService;
    private final IEmailService emailService;
    private final UserRepository userRepository;

    public PDCSchedulerJob(
            PDCService pdcService,
            IEmailService emailService,
            UserRepository userRepository
    ) {
        this.pdcService = pdcService;
        this.emailService = emailService;
        this.userRepository = userRepository;
    }

    /**
     * Transition RECEIVED PDCs to DUE status when cheque date is within 7 days.
     * Runs every day at 6:00 AM.
     *
     * AC #8: PDCs transition from RECEIVED to DUE when cheque_date is within 7 days
     */
    @Scheduled(cron = "${pdc.transition.cron:0 0 6 * * *}")
    @Transactional
    public void transitionReceivedToDue() {
        LOGGER.info("Starting PDC RECEIVED → DUE transition job");

        try {
            int transitionedCount = pdcService.transitionReceivedToDue();
            LOGGER.info("PDC transition job completed: {} PDCs transitioned from RECEIVED to DUE", transitionedCount);
        } catch (Exception e) {
            LOGGER.error("PDC transition job failed: {}", e.getMessage(), e);
        }
    }

    /**
     * Send deposit reminder emails for PDCs due today.
     * Runs every day at 9:00 AM.
     *
     * AC #29: Email reminder for PDCs due for deposit
     */
    @Scheduled(cron = "${pdc.reminder.cron:0 0 9 * * *}")
    public void sendDepositReminders() {
        LOGGER.info("Starting PDC deposit reminder job");

        try {
            LocalDate today = LocalDate.now();

            // Get PDCs due today (cheque date = today)
            List<PDCListDto> duePDCs = pdcService.getPDCsDueForReminder(today);

            if (duePDCs.isEmpty()) {
                LOGGER.info("No PDCs due for deposit today");
                return;
            }

            LOGGER.info("Found {} PDCs due for deposit today", duePDCs.size());

            // Get admin users to notify
            List<User> adminUsers = userRepository.findByRoleAndActiveTrue(UserRole.SUPER_ADMIN);

            if (adminUsers.isEmpty()) {
                LOGGER.warn("No active admin users found to send PDC deposit reminders");
                return;
            }

            // Convert PDC list to map format for email template
            List<Map<String, Object>> pdcList = duePDCs.stream()
                    .map(this::convertPDCToMap)
                    .collect(Collectors.toList());

            // Send reminder to each admin
            int sentCount = 0;
            for (User admin : adminUsers) {
                try {
                    String adminName = admin.getFirstName() != null ? admin.getFirstName() : "Admin";
                    emailService.sendPDCDepositReminder(admin.getEmail(), adminName, pdcList);
                    sentCount++;
                } catch (Exception e) {
                    LOGGER.error("Failed to send PDC deposit reminder to admin {}: {}", admin.getEmail(), e.getMessage());
                }
            }

            LOGGER.info("PDC deposit reminder job completed: sent {} reminders for {} PDCs", sentCount, duePDCs.size());

        } catch (Exception e) {
            LOGGER.error("PDC deposit reminder job failed: {}", e.getMessage(), e);
        }
    }

    /**
     * Send deposit reminders for PDCs due tomorrow.
     * Runs every day at 4:00 PM (day before reminder).
     *
     * AC #29: Email reminder for PDCs due for deposit (advance notice)
     */
    @Scheduled(cron = "${pdc.advance-reminder.cron:0 0 16 * * *}")
    public void sendAdvanceDepositReminders() {
        LOGGER.info("Starting PDC advance deposit reminder job");

        try {
            LocalDate tomorrow = LocalDate.now().plusDays(1);

            // Get PDCs due tomorrow
            List<PDCListDto> duePDCs = pdcService.getPDCsDueForReminder(tomorrow);

            if (duePDCs.isEmpty()) {
                LOGGER.info("No PDCs due for deposit tomorrow");
                return;
            }

            LOGGER.info("Found {} PDCs due for deposit tomorrow", duePDCs.size());

            // Get admin users to notify
            List<User> adminUsers = userRepository.findByRoleAndActiveTrue(UserRole.SUPER_ADMIN);

            if (adminUsers.isEmpty()) {
                LOGGER.warn("No active admin users found to send advance PDC deposit reminders");
                return;
            }

            // Convert PDC list to map format for email template
            List<Map<String, Object>> pdcList = duePDCs.stream()
                    .map(this::convertPDCToMap)
                    .collect(Collectors.toList());

            // Send reminder to each admin
            int sentCount = 0;
            for (User admin : adminUsers) {
                try {
                    String adminName = admin.getFirstName() != null ? admin.getFirstName() : "Admin";
                    emailService.sendPDCDepositReminder(admin.getEmail(), adminName, pdcList);
                    sentCount++;
                } catch (Exception e) {
                    LOGGER.error("Failed to send advance PDC deposit reminder to admin {}: {}", admin.getEmail(), e.getMessage());
                }
            }

            LOGGER.info("PDC advance deposit reminder job completed: sent {} reminders for {} PDCs", sentCount, duePDCs.size());

        } catch (Exception e) {
            LOGGER.error("PDC advance deposit reminder job failed: {}", e.getMessage(), e);
        }
    }

    /**
     * Convert PDCListDto to Map for email template
     */
    private Map<String, Object> convertPDCToMap(PDCListDto pdc) {
        Map<String, Object> map = new HashMap<>();
        map.put("chequeNumber", pdc.chequeNumber());
        map.put("tenantName", pdc.tenantName());
        map.put("bankName", pdc.bankName());
        map.put("formattedAmount", pdc.formattedAmount());
        map.put("chequeDate", pdc.chequeDate() != null
                ? pdc.chequeDate().format(DATE_FORMATTER)
                : "N/A");
        return map;
    }
}
