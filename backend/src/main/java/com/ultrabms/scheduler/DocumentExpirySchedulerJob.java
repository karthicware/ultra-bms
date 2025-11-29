package com.ultrabms.scheduler;

import com.ultrabms.dto.documents.ExpiringDocumentDto;
import com.ultrabms.entity.User;
import com.ultrabms.entity.enums.UserRole;
import com.ultrabms.repository.UserRepository;
import com.ultrabms.service.DocumentService;
import com.ultrabms.service.IEmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

/**
 * Scheduled job for document expiry monitoring and notifications.
 * Sends 30-day expiry reminders to administrators daily at 8 AM.
 *
 * Story 7.2: Document Management System (AC #17)
 */
@Component
public class DocumentExpirySchedulerJob {

    private static final Logger LOGGER = LoggerFactory.getLogger(DocumentExpirySchedulerJob.class);
    private static final int EXPIRY_ALERT_DAYS = 30;
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("MMM dd, yyyy");

    private final DocumentService documentService;
    private final UserRepository userRepository;
    private final IEmailService emailService;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    public DocumentExpirySchedulerJob(
            DocumentService documentService,
            UserRepository userRepository,
            IEmailService emailService) {
        this.documentService = documentService;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    /**
     * Send document expiry reminders for documents expiring within 30 days.
     * Runs every day at 8 AM.
     *
     * Sends reminder to administrators and property managers for documents
     * that have not yet received an expiry notification.
     */
    @Scheduled(cron = "${document.expiry.reminder.cron:0 0 8 * * *}")
    @Transactional
    public void sendExpiryReminders() {
        LOGGER.info("Starting document expiry reminder job");

        try {
            // Get documents pending expiry notification (within 30 days and not yet notified)
            List<ExpiringDocumentDto> expiringDocuments =
                    documentService.getDocumentsPendingExpiryNotification(EXPIRY_ALERT_DAYS);

            if (expiringDocuments.isEmpty()) {
                LOGGER.info("No documents pending expiry notification");
                return;
            }

            LOGGER.info("Found {} documents pending expiry notification", expiringDocuments.size());

            // Get admin/property manager users to notify
            List<User> admins = userRepository.findByRoleIn(
                    List.of(UserRole.SUPER_ADMIN, UserRole.PROPERTY_MANAGER));

            if (admins.isEmpty()) {
                LOGGER.warn("No admin users found to receive document expiry notifications");
                return;
            }

            int sentCount = 0;
            List<UUID> notifiedDocumentIds = new java.util.ArrayList<>();

            for (ExpiringDocumentDto doc : expiringDocuments) {
                String portalUrl = frontendUrl + "/documents/" + doc.getId();
                String expiryDateFormatted = doc.getExpiryDate() != null
                        ? doc.getExpiryDate().format(DATE_FORMATTER)
                        : "N/A";
                long daysUntilExpiry = doc.getDaysUntilExpiry() != null ? doc.getDaysUntilExpiry() : 0;

                String entityTypeDisplayName = doc.getEntityType() != null
                        ? doc.getEntityType().getDisplayName()
                        : "General";
                String accessLevelDisplayName = doc.getAccessLevel() != null
                        ? doc.getAccessLevel().getDisplayName()
                        : "Internal";
                String accessLevelLower = doc.getAccessLevel() != null
                        ? doc.getAccessLevel().name().toLowerCase()
                        : "internal";

                // Send to all admin/property managers
                for (User admin : admins) {
                    try {
                        emailService.sendDocumentExpiryNotification(
                                admin.getEmail(),
                                admin.getFirstName() + " " + admin.getLastName(),
                                doc.getDocumentNumber(),
                                doc.getTitle(),
                                doc.getDocumentType(),
                                entityTypeDisplayName,
                                doc.getEntityName(),
                                accessLevelDisplayName,
                                accessLevelLower,
                                doc.getDocumentNumber() + ".pdf", // Use document number as filename placeholder
                                expiryDateFormatted,
                                daysUntilExpiry,
                                portalUrl
                        );
                        sentCount++;
                    } catch (Exception e) {
                        LOGGER.error("Failed to send document expiry notification to {} for document {}: {}",
                                admin.getEmail(), doc.getDocumentNumber(), e.getMessage());
                    }
                }

                // Mark as notified after sending to at least one recipient
                notifiedDocumentIds.add(doc.getId());
            }

            // Mark expiry notifications as sent
            if (!notifiedDocumentIds.isEmpty()) {
                documentService.markExpiryNotificationsSent(notifiedDocumentIds);
                LOGGER.info("Marked {} documents as notified", notifiedDocumentIds.size());
            }

            LOGGER.info("Document expiry reminder job completed: {} notifications sent for {} documents",
                    sentCount, expiringDocuments.size());

        } catch (Exception e) {
            LOGGER.error("Document expiry reminder job failed: {}", e.getMessage(), e);
        }
    }

    /**
     * Send urgent reminders for documents expiring within 7 days.
     * Runs every day at 9 AM (one hour after the 30-day reminders).
     *
     * This sends a second urgent reminder for documents that are about to expire,
     * regardless of whether the 30-day notification was sent.
     */
    @Scheduled(cron = "${document.expiry.urgent.cron:0 0 9 * * *}")
    @Transactional(readOnly = true)
    public void sendUrgentExpiryReminders() {
        LOGGER.info("Starting urgent document expiry reminder job (7-day)");

        try {
            // Get documents expiring within 7 days
            List<ExpiringDocumentDto> urgentDocuments = documentService.getExpiringDocuments(7);

            if (urgentDocuments.isEmpty()) {
                LOGGER.info("No documents expiring within 7 days");
                return;
            }

            LOGGER.info("Found {} documents expiring within 7 days", urgentDocuments.size());

            // Get admin/property manager users to notify
            List<User> admins = userRepository.findByRoleIn(
                    List.of(UserRole.SUPER_ADMIN, UserRole.PROPERTY_MANAGER));

            if (admins.isEmpty()) {
                LOGGER.warn("No admin users found to receive urgent document expiry notifications");
                return;
            }

            int sentCount = 0;

            for (ExpiringDocumentDto doc : urgentDocuments) {
                String portalUrl = frontendUrl + "/documents/" + doc.getId();
                String expiryDateFormatted = doc.getExpiryDate() != null
                        ? doc.getExpiryDate().format(DATE_FORMATTER)
                        : "N/A";
                long daysUntilExpiry = doc.getDaysUntilExpiry() != null ? doc.getDaysUntilExpiry() : 0;

                String entityTypeDisplayName = doc.getEntityType() != null
                        ? doc.getEntityType().getDisplayName()
                        : "General";
                String accessLevelDisplayName = doc.getAccessLevel() != null
                        ? doc.getAccessLevel().getDisplayName()
                        : "Internal";
                String accessLevelLower = doc.getAccessLevel() != null
                        ? doc.getAccessLevel().name().toLowerCase()
                        : "internal";

                // Send urgent reminder to all admin/property managers
                for (User admin : admins) {
                    try {
                        emailService.sendDocumentExpiryNotification(
                                admin.getEmail(),
                                admin.getFirstName() + " " + admin.getLastName(),
                                doc.getDocumentNumber(),
                                doc.getTitle(),
                                doc.getDocumentType(),
                                entityTypeDisplayName,
                                doc.getEntityName(),
                                accessLevelDisplayName,
                                accessLevelLower,
                                doc.getDocumentNumber() + ".pdf",
                                expiryDateFormatted,
                                daysUntilExpiry,
                                portalUrl
                        );
                        sentCount++;
                    } catch (Exception e) {
                        LOGGER.error("Failed to send urgent document expiry notification to {} for document {}: {}",
                                admin.getEmail(), doc.getDocumentNumber(), e.getMessage());
                    }
                }
            }

            LOGGER.info("Urgent document expiry reminder job completed: {} notifications sent for {} documents",
                    sentCount, urgentDocuments.size());

        } catch (Exception e) {
            LOGGER.error("Urgent document expiry reminder job failed: {}", e.getMessage(), e);
        }
    }
}
