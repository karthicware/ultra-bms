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
     * Send maintenance request confirmation email to tenant asynchronously.
     * Confirms request submission with request number, details, and tracking link.
     * Fails silently (logs error) to avoid blocking user workflow if email delivery fails.
     *
     * @param tenant Tenant entity who submitted the request
     * @param request MaintenanceRequest entity with request details
     */
    @Async("emailTaskExecutor")
    public void sendMaintenanceRequestConfirmation(com.ultrabms.entity.Tenant tenant, com.ultrabms.entity.MaintenanceRequest request) {
        try {
            // Build tracking URL
            String trackingUrl = frontendUrl + "/tenant/requests/" + request.getId();

            // Build Thymeleaf context with template variables
            Context context = new Context();
            context.setVariable("tenantName", tenant.getFirstName() + " " + tenant.getLastName());
            context.setVariable("requestNumber", request.getRequestNumber());
            context.setVariable("category", request.getCategory().toString().replace("_", " "));
            context.setVariable("priority", request.getPriority().toString());
            context.setVariable("title", request.getTitle());
            context.setVariable("submittedAt", request.getSubmittedAt().format(DateTimeFormatter.ofPattern("MMM dd, yyyy hh:mm a")));
            context.setVariable("propertyName", tenant.getProperty().getName());
            context.setVariable("unitNumber", tenant.getUnit().getUnitNumber());
            context.setVariable("trackingUrl", trackingUrl);
            context.setVariable("supportEmail", supportEmail);

            // Render HTML and plain text templates
            String htmlContent = templateEngine.process("email/maintenance-request-confirmation", context);
            String textContent = templateEngine.process("email/maintenance-request-confirmation.txt", context);

            // Send email
            sendEmail(
                tenant.getEmail(),
                String.format("Maintenance Request Confirmed: %s", request.getRequestNumber()),
                textContent,
                htmlContent
            );

            log.info("Maintenance request confirmation email sent successfully to tenant: {} ({})",
                    tenant.getId(), tenant.getEmail());

        } catch (Exception e) {
            // Fail silently - don't throw exception to user, just log error
            log.error("Failed to send maintenance request confirmation email to tenant: {} ({})",
                    tenant.getId(), tenant.getEmail(), e);
        }
    }

    /**
     * Send new maintenance request notification to property manager asynchronously.
     * Notifies property manager of new request with full details and management link.
     * Fails silently (logs error) to avoid blocking user workflow if email delivery fails.
     *
     * @param tenant Tenant entity who submitted the request
     * @param request MaintenanceRequest entity with request details
     */
    @Async("emailTaskExecutor")
    public void sendMaintenanceRequestNotification(com.ultrabms.entity.Tenant tenant, com.ultrabms.entity.MaintenanceRequest request) {
        try {
            // Build management URL
            String managementUrl = frontendUrl + "/property-manager/requests/" + request.getId();

            // Build Thymeleaf context with template variables
            Context context = new Context();
            context.setVariable("requestNumber", request.getRequestNumber());
            context.setVariable("tenantName", tenant.getFirstName() + " " + tenant.getLastName());
            context.setVariable("tenantEmail", tenant.getEmail());
            context.setVariable("tenantPhone", tenant.getPhone() != null ? tenant.getPhone() : "Not provided");
            context.setVariable("propertyName", tenant.getProperty().getName());
            context.setVariable("unitNumber", tenant.getUnit().getUnitNumber());
            context.setVariable("category", request.getCategory().toString().replace("_", " "));
            context.setVariable("priority", request.getPriority().toString());
            context.setVariable("title", request.getTitle());
            context.setVariable("description", request.getDescription());
            context.setVariable("preferredAccessTime", request.getPreferredAccessTime().toString().replace("_", " "));
            context.setVariable("preferredAccessDate", request.getPreferredAccessDate().format(DateTimeFormatter.ofPattern("MMM dd, yyyy")));
            context.setVariable("photoCount", request.getAttachments() != null ? request.getAttachments().size() : 0);
            context.setVariable("managementUrl", managementUrl);

            // Render HTML and plain text templates
            String htmlContent = templateEngine.process("email/maintenance-request-new", context);
            String textContent = templateEngine.process("email/maintenance-request-new.txt", context);

            // Send email to property manager (using support email for now)
            sendEmail(
                supportEmail,
                String.format("New Maintenance Request: %s - %s",
                        request.getRequestNumber(),
                        request.getTitle()),
                textContent,
                htmlContent
            );

            log.info("Maintenance request notification email sent successfully to property manager for request: {} ({})",
                    request.getId(), request.getRequestNumber());

        } catch (Exception e) {
            // Fail silently - don't throw exception to user, just log error
            log.error("Failed to send maintenance request notification email for request: {} ({})",
                    request.getId(), request.getRequestNumber(), e);
        }
    }

    /**
     * Send maintenance request status change notification to tenant asynchronously.
     * Notifies tenant when request status changes (ASSIGNED, IN_PROGRESS, COMPLETED, CLOSED).
     * Fails silently (logs error) to avoid blocking user workflow if email delivery fails.
     *
     * @param tenant Tenant entity who owns the request
     * @param request MaintenanceRequest entity with updated status
     * @param vendorName Name of assigned vendor (if applicable)
     * @param vendorContact Contact info of assigned vendor (if applicable)
     */
    @Async("emailTaskExecutor")
    public void sendMaintenanceRequestStatusChange(
            com.ultrabms.entity.Tenant tenant,
            com.ultrabms.entity.MaintenanceRequest request,
            String vendorName,
            String vendorContact
    ) {
        try {
            // Build tracking URL
            String trackingUrl = frontendUrl + "/tenant/requests/" + request.getId();

            // Build status-specific message and label
            String statusMessage;
            String statusLabel;
            switch (request.getStatus()) {
                case ASSIGNED:
                    statusMessage = "Your maintenance request has been assigned to a vendor.";
                    statusLabel = "Assigned to Vendor";
                    break;
                case IN_PROGRESS:
                    statusMessage = "Work has started on your maintenance request.";
                    statusLabel = "Work in Progress";
                    break;
                case COMPLETED:
                    statusMessage = "Your maintenance request has been completed. Please review and provide feedback.";
                    statusLabel = "Work Completed";
                    break;
                case CLOSED:
                    statusMessage = "Your maintenance request has been closed.";
                    statusLabel = "Request Closed";
                    break;
                default:
                    statusMessage = "Your maintenance request status has been updated.";
                    statusLabel = request.getStatus().toString();
            }

            // Build Thymeleaf context with template variables
            Context context = new Context();
            context.setVariable("tenantName", tenant.getFirstName() + " " + tenant.getLastName());
            context.setVariable("requestNumber", request.getRequestNumber());
            context.setVariable("title", request.getTitle());
            context.setVariable("status", request.getStatus().toString());
            context.setVariable("statusMessage", statusMessage);
            context.setVariable("statusLabel", statusLabel);
            context.setVariable("vendorName", vendorName);
            context.setVariable("vendorContact", vendorContact);
            context.setVariable("estimatedCompletionDate",
                    request.getEstimatedCompletionDate() != null
                            ? request.getEstimatedCompletionDate().format(DateTimeFormatter.ofPattern("MMM dd, yyyy"))
                            : null);
            context.setVariable("workNotes", request.getWorkNotes());
            context.setVariable("trackingUrl", trackingUrl);
            context.setVariable("supportEmail", supportEmail);

            // Render HTML and plain text templates
            String htmlContent = templateEngine.process("email/maintenance-request-status-change", context);
            String textContent = templateEngine.process("email/maintenance-request-status-change.txt", context);

            // Send email
            sendEmail(
                tenant.getEmail(),
                String.format("Update: Maintenance Request %s - %s",
                        request.getRequestNumber(),
                        statusLabel),
                textContent,
                htmlContent
            );

            log.info("Maintenance request status change email sent successfully to tenant: {} ({}) for request: {}",
                    tenant.getId(), tenant.getEmail(), request.getRequestNumber());

        } catch (Exception e) {
            // Fail silently - don't throw exception to user, just log error
            log.error("Failed to send maintenance request status change email to tenant: {} ({}) for request: {}",
                    tenant.getId(), tenant.getEmail(), request.getRequestNumber(), e);
        }
    }

    // ========================================================================
    // Story 4.3: Work Order Assignment Email Notifications
    // ========================================================================

    /**
     * Send work order assignment notification email to assignee asynchronously.
     * Notifies internal staff or external vendor when a work order is assigned to them.
     * Fails silently (logs error) to avoid blocking user workflow if email delivery fails.
     *
     * @param assigneeEmail Assignee's email address
     * @param assigneeName Assignee's display name
     * @param workOrder Work order entity with all details
     * @param assignedByName Name of the user who made the assignment
     * @param assignmentNotes Optional notes from the assignment
     */
    @Async("emailTaskExecutor")
    public void sendWorkOrderAssignmentEmail(
            String assigneeEmail,
            String assigneeName,
            com.ultrabms.entity.WorkOrder workOrder,
            String assignedByName,
            String assignmentNotes
    ) {
        try {
            // Build work order URL
            String workOrderUrl = frontendUrl + "/property-manager/work-orders/" + workOrder.getId();

            // Build Thymeleaf context with template variables
            Context context = new Context();
            context.setVariable("assigneeName", assigneeName);
            context.setVariable("workOrderNumber", workOrder.getWorkOrderNumber());
            context.setVariable("title", workOrder.getTitle());
            context.setVariable("description", workOrder.getDescription());
            context.setVariable("category", workOrder.getCategory().toString().replace("_", " "));
            context.setVariable("priority", workOrder.getPriority().toString());
            context.setVariable("propertyName", workOrder.getProperty() != null ? workOrder.getProperty().getName() : "N/A");
            context.setVariable("unitNumber", workOrder.getUnit() != null ? workOrder.getUnit().getUnitNumber() : null);
            context.setVariable("scheduledDate", workOrder.getScheduledDate() != null
                    ? workOrder.getScheduledDate().format(DateTimeFormatter.ofPattern("MMM dd, yyyy"))
                    : null);
            context.setVariable("assignedByName", assignedByName);
            context.setVariable("assignedDate", LocalDateTime.now().format(DateTimeFormatter.ofPattern("MMM dd, yyyy hh:mm a")));
            context.setVariable("assignmentNotes", assignmentNotes);
            context.setVariable("accessInstructions", workOrder.getAccessInstructions());
            context.setVariable("workOrderUrl", workOrderUrl);
            context.setVariable("supportEmail", supportEmail);

            // Render HTML and plain text templates
            String htmlContent = templateEngine.process("email/work-order-assignment", context);
            String textContent = templateEngine.process("email/work-order-assignment.txt", context);

            // Send email
            sendEmail(
                assigneeEmail,
                String.format("Work Order Assigned: %s - %s", workOrder.getWorkOrderNumber(), workOrder.getTitle()),
                textContent,
                htmlContent
            );

            log.info("Work order assignment email sent successfully to: {} for work order: {}",
                    assigneeEmail, workOrder.getWorkOrderNumber());

        } catch (Exception e) {
            // Fail silently - don't throw exception to user, just log error
            log.error("Failed to send work order assignment email to: {} for work order: {}",
                    assigneeEmail, workOrder.getWorkOrderNumber(), e);
        }
    }

    /**
     * Send work order reassignment notification email to new assignee asynchronously.
     * Notifies new assignee when a work order is reassigned from another staff/vendor.
     * Fails silently (logs error) to avoid blocking user workflow if email delivery fails.
     *
     * @param newAssigneeEmail New assignee's email address
     * @param newAssigneeName New assignee's display name
     * @param previousAssigneeName Name of the previous assignee
     * @param workOrder Work order entity with all details
     * @param reassignedByName Name of the user who made the reassignment
     * @param reassignmentReason Reason for the reassignment
     * @param assignmentNotes Optional notes from the reassignment
     */
    @Async("emailTaskExecutor")
    public void sendWorkOrderReassignmentEmail(
            String newAssigneeEmail,
            String newAssigneeName,
            String previousAssigneeName,
            com.ultrabms.entity.WorkOrder workOrder,
            String reassignedByName,
            String reassignmentReason,
            String assignmentNotes
    ) {
        try {
            // Build work order URL
            String workOrderUrl = frontendUrl + "/property-manager/work-orders/" + workOrder.getId();

            // Build Thymeleaf context with template variables
            Context context = new Context();
            context.setVariable("newAssigneeName", newAssigneeName);
            context.setVariable("previousAssigneeName", previousAssigneeName);
            context.setVariable("workOrderNumber", workOrder.getWorkOrderNumber());
            context.setVariable("title", workOrder.getTitle());
            context.setVariable("description", workOrder.getDescription());
            context.setVariable("category", workOrder.getCategory().toString().replace("_", " "));
            context.setVariable("priority", workOrder.getPriority().toString());
            context.setVariable("propertyName", workOrder.getProperty() != null ? workOrder.getProperty().getName() : "N/A");
            context.setVariable("unitNumber", workOrder.getUnit() != null ? workOrder.getUnit().getUnitNumber() : null);
            context.setVariable("scheduledDate", workOrder.getScheduledDate() != null
                    ? workOrder.getScheduledDate().format(DateTimeFormatter.ofPattern("MMM dd, yyyy"))
                    : null);
            context.setVariable("reassignedByName", reassignedByName);
            context.setVariable("reassignedDate", LocalDateTime.now().format(DateTimeFormatter.ofPattern("MMM dd, yyyy hh:mm a")));
            context.setVariable("reassignmentReason", reassignmentReason);
            context.setVariable("assignmentNotes", assignmentNotes);
            context.setVariable("accessInstructions", workOrder.getAccessInstructions());
            context.setVariable("workOrderUrl", workOrderUrl);
            context.setVariable("supportEmail", supportEmail);

            // Render HTML and plain text templates
            String htmlContent = templateEngine.process("email/work-order-reassignment", context);
            String textContent = templateEngine.process("email/work-order-reassignment.txt", context);

            // Send email
            sendEmail(
                newAssigneeEmail,
                String.format("Work Order Reassigned: %s - %s", workOrder.getWorkOrderNumber(), workOrder.getTitle()),
                textContent,
                htmlContent
            );

            log.info("Work order reassignment email sent successfully to: {} for work order: {}",
                    newAssigneeEmail, workOrder.getWorkOrderNumber());

        } catch (Exception e) {
            // Fail silently - don't throw exception to user, just log error
            log.error("Failed to send work order reassignment email to: {} for work order: {}",
                    newAssigneeEmail, workOrder.getWorkOrderNumber(), e);
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
