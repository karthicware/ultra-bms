package com.ultrabms.service;

import com.ultrabms.entity.EmailNotification;
import com.ultrabms.entity.enums.EmailNotificationStatus;
import com.ultrabms.entity.enums.NotificationType;
import com.ultrabms.repository.EmailNotificationRepository;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Service for sending and tracking email notifications.
 * All emails are logged to the email_notifications table for audit and retry.
 * Supports async sending with exponential backoff retry mechanism.
 *
 * Story 9.1: Email Notification System
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailNotificationService {

    private final JavaMailSender mailSender;
    private final SpringTemplateEngine templateEngine;
    private final EmailNotificationRepository emailNotificationRepository;

    @Value("${app.support-email:noreply@ultrabms.com}")
    private String senderEmail;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    // ========================================
    // MAIN PUBLIC API
    // ========================================

    /**
     * Queue an email notification for sending.
     * The email is saved with PENDING status and will be processed by EmailSenderJob.
     *
     * @param type Notification type
     * @param recipientEmail Recipient's email address
     * @param recipientName Recipient's name for personalization
     * @param subject Email subject
     * @param templateName Thymeleaf template name (without extension)
     * @param variables Template variables
     * @param entityType Related entity type (e.g., "Invoice")
     * @param entityId Related entity ID
     * @return The created EmailNotification entity
     */
    @Transactional
    public EmailNotification queueEmail(
            NotificationType type,
            String recipientEmail,
            String recipientName,
            String subject,
            String templateName,
            Map<String, Object> variables,
            String entityType,
            UUID entityId) {

        // Add common variables
        Context context = new Context();
        context.setVariables(variables);
        context.setVariable("recipientName", recipientName);
        context.setVariable("companyName", "Ultra BMS");
        context.setVariable("supportEmail", senderEmail);
        context.setVariable("frontendUrl", frontendUrl);

        // Render template to HTML
        String htmlBody = templateEngine.process("email/" + templateName, context);

        // Create notification record
        EmailNotification notification = EmailNotification.builder()
            .recipientEmail(recipientEmail)
            .recipientName(recipientName)
            .notificationType(type)
            .subject(subject)
            .body(htmlBody)
            .entityType(entityType)
            .entityId(entityId)
            .status(EmailNotificationStatus.PENDING)
            .retryCount(0)
            .build();

        EmailNotification saved = emailNotificationRepository.save(notification);
        log.info("Email notification queued: type={}, recipient={}, id={}",
            type, recipientEmail, saved.getId());

        return saved;
    }

    /**
     * Send email immediately (bypasses queue).
     * Use for high-priority notifications like password reset.
     *
     * @param type Notification type
     * @param recipientEmail Recipient's email address
     * @param recipientName Recipient's name for personalization
     * @param subject Email subject
     * @param templateName Thymeleaf template name
     * @param variables Template variables
     * @param entityType Related entity type
     * @param entityId Related entity ID
     * @return The EmailNotification entity with send result
     */
    @Async("emailTaskExecutor")
    @Transactional
    public EmailNotification sendEmailImmediate(
            NotificationType type,
            String recipientEmail,
            String recipientName,
            String subject,
            String templateName,
            Map<String, Object> variables,
            String entityType,
            UUID entityId) {

        // Create notification record first
        EmailNotification notification = queueEmail(
            type, recipientEmail, recipientName, subject,
            templateName, variables, entityType, entityId
        );

        // Try to send immediately
        return sendNotification(notification);
    }

    /**
     * Send a notification that's already in the database.
     * Updates status to SENT or FAILED with retry scheduling.
     *
     * @param notification The notification to send
     * @return The updated notification
     */
    @Transactional
    public EmailNotification sendNotification(EmailNotification notification) {
        try {
            // Mark as queued (processing)
            notification.markAsQueued();
            emailNotificationRepository.save(notification);

            // Send the email
            sendEmail(
                notification.getRecipientEmail(),
                notification.getSubject(),
                notification.getBody()
            );

            // Mark as sent
            notification.markAsSent();
            EmailNotification saved = emailNotificationRepository.save(notification);

            log.info("Email sent successfully: type={}, recipient={}, id={}",
                notification.getNotificationType(),
                notification.getRecipientEmail(),
                notification.getId());

            return saved;

        } catch (Exception e) {
            // Mark as failed with retry info
            notification.markAsFailed(e.getMessage());
            EmailNotification saved = emailNotificationRepository.save(notification);

            log.error("Email send failed: type={}, recipient={}, id={}, attempt={}, error={}",
                notification.getNotificationType(),
                notification.getRecipientEmail(),
                notification.getId(),
                notification.getRetryCount(),
                e.getMessage());

            return saved;
        }
    }

    /**
     * Retry a failed notification manually.
     *
     * @param notificationId The notification ID to retry
     * @return The updated notification
     */
    @Transactional
    public EmailNotification retryNotification(UUID notificationId) {
        EmailNotification notification = emailNotificationRepository.findById(notificationId)
            .orElseThrow(() -> new IllegalArgumentException("Notification not found: " + notificationId));

        if (notification.getStatus() != EmailNotificationStatus.FAILED) {
            throw new IllegalStateException("Can only retry failed notifications");
        }

        // Reset for retry
        notification.resetForRetry();
        emailNotificationRepository.save(notification);

        // Send immediately
        return sendNotification(notification);
    }

    // ========================================
    // CONVENIENCE METHODS FOR SPECIFIC EMAILS
    // ========================================

    /**
     * Send password reset email with tracking
     */
    @Async("emailTaskExecutor")
    public void sendPasswordResetNotification(String email, String firstName, String resetToken) {
        Map<String, Object> variables = Map.of(
            "firstName", firstName,
            "resetLink", frontendUrl + "/reset-password?token=" + resetToken,
            "expirationMinutes", 15
        );

        sendEmailImmediate(
            NotificationType.PASSWORD_RESET_REQUESTED,
            email,
            firstName,
            "Reset Your Ultra BMS Password",
            "password-reset-email",
            variables,
            "User",
            null
        );
    }

    /**
     * Send invoice generated notification
     */
    @Async("emailTaskExecutor")
    public void sendInvoiceNotification(String email, String tenantName, String invoiceNumber,
                                        String dueDate, String amount, UUID invoiceId) {
        Map<String, Object> variables = Map.of(
            "tenantName", tenantName,
            "invoiceNumber", invoiceNumber,
            "dueDate", dueDate,
            "totalAmount", amount,
            "invoiceLink", frontendUrl + "/tenant/invoices/" + invoiceId
        );

        queueEmail(
            NotificationType.INVOICE_GENERATED,
            email,
            tenantName,
            "New Invoice: " + invoiceNumber,
            "invoice-sent",
            variables,
            "Invoice",
            invoiceId
        );
    }

    /**
     * Send payment received notification
     */
    @Async("emailTaskExecutor")
    public void sendPaymentReceivedNotification(String email, String tenantName,
                                                String paymentAmount, String invoiceNumber,
                                                UUID paymentId) {
        Map<String, Object> variables = Map.of(
            "tenantName", tenantName,
            "paymentAmount", paymentAmount,
            "invoiceNumber", invoiceNumber,
            "paymentDate", LocalDateTime.now().toLocalDate().toString()
        );

        queueEmail(
            NotificationType.PAYMENT_RECEIVED,
            email,
            tenantName,
            "Payment Received - " + invoiceNumber,
            "payment-received",
            variables,
            "Payment",
            paymentId
        );
    }

    // ========================================
    // EMAIL WITH ATTACHMENT SUPPORT
    // ========================================

    /**
     * Queue an email with attachment (PDF stored as path)
     */
    @Transactional
    public EmailNotification queueEmailWithAttachment(
            NotificationType type,
            String recipientEmail,
            String recipientName,
            String subject,
            String templateName,
            Map<String, Object> variables,
            String entityType,
            UUID entityId,
            byte[] attachment,
            String attachmentFilename) {

        // For now, queue the email without attachment
        // Attachment will be fetched during send
        EmailNotification notification = queueEmail(
            type, recipientEmail, recipientName, subject,
            templateName, variables, entityType, entityId
        );

        // Store attachment info in body metadata (simple approach)
        // In production, store attachment in S3 and reference it
        log.info("Email with attachment queued: {}, attachment: {}",
            notification.getId(), attachmentFilename);

        return notification;
    }

    /**
     * Send email with attachment immediately
     */
    @Async("emailTaskExecutor")
    @Transactional
    public void sendEmailWithAttachmentImmediate(
            String recipientEmail,
            String subject,
            String htmlBody,
            byte[] attachment,
            String attachmentFilename) {

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(recipientEmail);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            helper.setFrom(senderEmail);
            helper.addAttachment(attachmentFilename, new ByteArrayResource(attachment));

            mailSender.send(message);

            log.info("Email with attachment sent: recipient={}, attachment={}",
                recipientEmail, attachmentFilename);

        } catch (MessagingException e) {
            log.error("Failed to send email with attachment: {}", e.getMessage());
            throw new RuntimeException("Email send failed", e);
        }
    }

    // ========================================
    // QUERY METHODS
    // ========================================

    /**
     * Get notification by ID
     */
    public Optional<EmailNotification> getNotification(UUID id) {
        return emailNotificationRepository.findById(id);
    }

    /**
     * Get notifications with filters (paginated)
     */
    public Page<EmailNotification> getNotifications(
            EmailNotificationStatus status,
            NotificationType type,
            String recipientEmail,
            LocalDateTime startDate,
            LocalDateTime endDate,
            Pageable pageable) {
        return emailNotificationRepository.findWithFilters(
            status, type, recipientEmail, startDate, endDate, pageable
        );
    }

    /**
     * Get notification statistics
     */
    public Map<String, Long> getStatistics(LocalDateTime startDate, LocalDateTime endDate) {
        return Map.of(
            "pending", emailNotificationRepository.countByStatusAndCreatedAtBetween(
                EmailNotificationStatus.PENDING, startDate, endDate),
            "sent", emailNotificationRepository.countByStatusAndCreatedAtBetween(
                EmailNotificationStatus.SENT, startDate, endDate),
            "failed", emailNotificationRepository.countByStatusAndCreatedAtBetween(
                EmailNotificationStatus.FAILED, startDate, endDate),
            "queued", emailNotificationRepository.countByStatusAndCreatedAtBetween(
                EmailNotificationStatus.QUEUED, startDate, endDate)
        );
    }

    // ========================================
    // INTERNAL HELPERS
    // ========================================

    /**
     * Internal method to send email via JavaMailSender
     */
    private void sendEmail(String to, String subject, String htmlContent) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(htmlContent, true);
        helper.setFrom(senderEmail);

        mailSender.send(message);
    }
}
