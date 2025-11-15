package com.ultrabms.service;

import com.ultrabms.entity.Lead;
import com.ultrabms.entity.Quotation;
import com.ultrabms.entity.User;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Service for sending email notifications asynchronously.
 * Uses Thymeleaf templates for HTML and plain text email content.
 * All email operations run in background thread pool to avoid blocking API responses.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final SpringTemplateEngine templateEngine;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Value("${app.support-email}")
    private String supportEmail;

    private static final int TOKEN_EXPIRATION_MINUTES = 15;
    private static final DateTimeFormatter TIMESTAMP_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * Send password reset email asynchronously with secure token link.
     * Email contains branded HTML template with reset button and expiration warning.
     * Fails silently (logs error) to avoid blocking user workflow if email delivery fails.
     *
     * @param user User requesting password reset
     * @param resetToken Secure 64-character hex token for password reset
     */
    @Async("emailTaskExecutor")
    public void sendPasswordResetEmail(User user, String resetToken) {
        try {
            // Generate reset link with token
            String resetLink = frontendUrl + "/reset-password?token=" + resetToken;

            // Build Thymeleaf context with template variables
            Context context = new Context();
            context.setVariable("firstName", user.getFirstName());
            context.setVariable("resetLink", resetLink);
            context.setVariable("expirationMinutes", TOKEN_EXPIRATION_MINUTES);
            context.setVariable("supportEmail", supportEmail);

            // Render HTML and plain text templates
            String htmlContent = templateEngine.process("email/password-reset-email", context);
            String textContent = templateEngine.process("email/password-reset-email.txt", context);

            // Send email
            sendEmail(
                user.getEmail(),
                "Reset Your Ultra BMS Password",
                textContent,
                htmlContent
            );

            log.info("Password reset email sent successfully to user: {} ({})", user.getId(), user.getEmail());

        } catch (Exception e) {
            // Fail silently - don't throw exception to user, just log error
            log.error("Failed to send password reset email to user: {} ({})", user.getId(), user.getEmail(), e);
        }
    }

    /**
     * Send password change confirmation email asynchronously.
     * Notifies user of successful password reset with security alert message.
     * Fails silently (logs error) to avoid blocking user workflow if email delivery fails.
     *
     * @param user User whose password was changed
     */
    @Async("emailTaskExecutor")
    public void sendPasswordChangeConfirmation(User user) {
        try {
            // Generate login link
            String loginLink = frontendUrl + "/login";

            // Build Thymeleaf context with template variables
            Context context = new Context();
            context.setVariable("firstName", user.getFirstName());
            context.setVariable("email", user.getEmail());
            context.setVariable("loginLink", loginLink);
            context.setVariable("timestamp", LocalDateTime.now().format(TIMESTAMP_FORMATTER));
            context.setVariable("supportEmail", supportEmail);

            // Render HTML and plain text templates
            String htmlContent = templateEngine.process("email/password-change-confirmation", context);
            String textContent = templateEngine.process("email/password-change-confirmation.txt", context);

            // Send email
            sendEmail(
                user.getEmail(),
                "Your Ultra BMS Password Has Been Changed",
                textContent,
                htmlContent
            );

            log.info("Password change confirmation email sent successfully to user: {} ({})", user.getId(), user.getEmail());

        } catch (Exception e) {
            // Fail silently - don't throw exception to user, just log error
            log.error("Failed to send password change confirmation email to user: {} ({})", user.getId(), user.getEmail(), e);
        }
    }

    /**
     * Send quotation email to lead with PDF attachment asynchronously.
     * Email contains branded HTML template with quotation details and PDF attachment.
     * Fails silently (logs error) to avoid blocking user workflow if email delivery fails.
     *
     * @param lead The lead entity
     * @param quotation The quotation entity
     * @param pdfContent The quotation PDF content
     */
    @Async("emailTaskExecutor")
    public void sendQuotationEmail(Lead lead, Quotation quotation, byte[] pdfContent) {
        try {
            // Build Thymeleaf context with template variables
            Context context = new Context();
            context.setVariable("leadName", lead.getFullName());
            context.setVariable("quotationNumber", quotation.getQuotationNumber());
            context.setVariable("issueDate", quotation.getIssueDate().format(DateTimeFormatter.ofPattern("dd MMM yyyy")));
            context.setVariable("validityDate", quotation.getValidityDate().format(DateTimeFormatter.ofPattern("dd MMM yyyy")));
            context.setVariable("totalAmount", quotation.getTotalFirstPayment());
            context.setVariable("frontendUrl", frontendUrl);
            context.setVariable("supportEmail", supportEmail);

            // Render HTML and plain text templates
            String htmlContent = templateEngine.process("email/quotation-email", context);
            String textContent = templateEngine.process("email/quotation-email.txt", context);

            // Send email with PDF attachment
            sendEmailWithAttachment(
                lead.getEmail(),
                "Your Rental Quotation from UltraBMS",
                textContent,
                htmlContent,
                pdfContent,
                String.format("quotation-%s.pdf", quotation.getQuotationNumber())
            );

            log.info("Quotation email sent successfully to lead: {} ({})", lead.getId(), lead.getEmail());

        } catch (Exception e) {
            // Fail silently - don't throw exception to user, just log error
            log.error("Failed to send quotation email to lead: {} ({})", lead.getId(), lead.getEmail(), e);
        }
    }

    /**
     * Send welcome email to new lead asynchronously.
     * Confirms lead registration and provides next steps information.
     * Fails silently (logs error) to avoid blocking user workflow if email delivery fails.
     *
     * @param lead The lead entity
     */
    @Async("emailTaskExecutor")
    public void sendWelcomeEmail(Lead lead) {
        try {
            // Build Thymeleaf context with template variables
            Context context = new Context();
            context.setVariable("leadName", lead.getFullName());
            context.setVariable("leadNumber", lead.getLeadNumber());
            context.setVariable("frontendUrl", frontendUrl);
            context.setVariable("supportEmail", supportEmail);

            // Render HTML and plain text templates
            String htmlContent = templateEngine.process("email/welcome-email", context);
            String textContent = templateEngine.process("email/welcome-email.txt", context);

            // Send email
            sendEmail(
                lead.getEmail(),
                "Welcome to UltraBMS - Your Lead Registration Confirmed",
                textContent,
                htmlContent
            );

            log.info("Welcome email sent successfully to lead: {} ({})", lead.getId(), lead.getEmail());

        } catch (Exception e) {
            // Fail silently - don't throw exception to user, just log error
            log.error("Failed to send welcome email to lead: {} ({})", lead.getId(), lead.getEmail(), e);
        }
    }

    /**
     * Send quotation accepted notification to admin asynchronously.
     * Notifies admin that a lead has accepted a quotation.
     * Fails silently (logs error) to avoid blocking user workflow if email delivery fails.
     *
     * @param lead The lead entity
     * @param quotation The quotation entity
     */
    @Async("emailTaskExecutor")
    public void sendQuotationAcceptedNotification(Lead lead, Quotation quotation) {
        try {
            // Build Thymeleaf context with template variables
            Context context = new Context();
            context.setVariable("leadName", lead.getFullName());
            context.setVariable("leadNumber", lead.getLeadNumber());
            context.setVariable("quotationNumber", quotation.getQuotationNumber());
            context.setVariable("totalAmount", quotation.getTotalFirstPayment());
            context.setVariable("frontendUrl", frontendUrl);

            // Render HTML and plain text templates
            String htmlContent = templateEngine.process("email/quotation-accepted-notification", context);
            String textContent = templateEngine.process("email/quotation-accepted-notification.txt", context);

            // Send email to support/admin email
            sendEmail(
                supportEmail,
                String.format("Quotation Accepted: %s - %s", quotation.getQuotationNumber(), lead.getFullName()),
                textContent,
                htmlContent
            );

            log.info("Quotation accepted notification sent successfully for quotation: {} ({})",
                    quotation.getId(), quotation.getQuotationNumber());

        } catch (Exception e) {
            // Fail silently - don't throw exception to user, just log error
            log.error("Failed to send quotation accepted notification for quotation: {} ({})",
                    quotation.getId(), quotation.getQuotationNumber(), e);
        }
    }

    /**
     * Internal helper method to send multipart email (HTML + plain text fallback).
     * Creates MimeMessage with both HTML and text content for email client compatibility.
     *
     * @param to Recipient email address
     * @param subject Email subject line
     * @param textContent Plain text version of email
     * @param htmlContent HTML version of email
     * @throws MessagingException if email cannot be sent
     */
    private void sendEmail(String to, String subject, String textContent, String htmlContent) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(textContent, htmlContent);
        helper.setFrom(supportEmail);

        mailSender.send(message);
    }

    /**
     * Internal helper method to send multipart email with attachment.
     * Creates MimeMessage with both HTML and text content plus PDF attachment.
     *
     * @param to Recipient email address
     * @param subject Email subject line
     * @param textContent Plain text version of email
     * @param htmlContent HTML version of email
     * @param attachment PDF content as byte array
     * @param attachmentFilename Filename for the PDF attachment
     * @throws MessagingException if email cannot be sent
     */
    private void sendEmailWithAttachment(String to, String subject, String textContent, String htmlContent,
                                          byte[] attachment, String attachmentFilename) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(textContent, htmlContent);
        helper.setFrom(supportEmail);

        // Add PDF attachment
        helper.addAttachment(attachmentFilename, new ByteArrayResource(attachment), "application/pdf");

        mailSender.send(message);
    }
}
