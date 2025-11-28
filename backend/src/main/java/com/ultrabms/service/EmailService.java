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
     * @param propertyName Name of the property for the work order
     * @param unitNumber Unit number (nullable for property-wide work)
     * @param assignedByName Name of the user who made the assignment
     * @param assignmentNotes Optional notes from the assignment
     */
    @Async("emailTaskExecutor")
    public void sendWorkOrderAssignmentEmail(
            String assigneeEmail,
            String assigneeName,
            com.ultrabms.entity.WorkOrder workOrder,
            String propertyName,
            String unitNumber,
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
            context.setVariable("propertyName", propertyName != null ? propertyName : "N/A");
            context.setVariable("unitNumber", unitNumber);
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
     * @param propertyName Name of the property for the work order
     * @param unitNumber Unit number (nullable for property-wide work)
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
            String propertyName,
            String unitNumber,
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
            context.setVariable("propertyName", propertyName != null ? propertyName : "N/A");
            context.setVariable("unitNumber", unitNumber);
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
     * Send notification to PREVIOUS assignee when work order is reassigned to someone else.
     * Informs them they are no longer responsible and provides reason for change.
     *
     * Story 4.3: Work Order Assignment and Vendor Coordination (AC #15)
     *
     * @param previousAssigneeEmail Email of the previous assignee
     * @param previousAssigneeName Name of the previous assignee
     * @param newAssigneeName Name of the new assignee
     * @param newAssigneeType Type of the new assignee (for display)
     * @param workOrder Work order entity with all details
     * @param propertyName Name of the property for the work order
     * @param unitNumber Unit number (nullable for property-wide work)
     * @param reassignedByName Name of the user who made the reassignment
     * @param reassignmentReason Reason for the reassignment
     */
    @Async("emailTaskExecutor")
    public void sendWorkOrderRemovedFromAssignmentEmail(
            String previousAssigneeEmail,
            String previousAssigneeName,
            String newAssigneeName,
            String newAssigneeType,
            com.ultrabms.entity.WorkOrder workOrder,
            String propertyName,
            String unitNumber,
            String reassignedByName,
            String reassignmentReason
    ) {
        try {
            // Build Thymeleaf context with template variables
            Context context = new Context();
            context.setVariable("previousAssigneeName", previousAssigneeName);
            context.setVariable("newAssigneeName", newAssigneeName);
            context.setVariable("newAssigneeType", newAssigneeType.replace("_", " "));
            context.setVariable("workOrderNumber", workOrder.getWorkOrderNumber());
            context.setVariable("title", workOrder.getTitle());
            context.setVariable("category", workOrder.getCategory().toString().replace("_", " "));
            context.setVariable("priority", workOrder.getPriority().toString());
            context.setVariable("propertyName", propertyName != null ? propertyName : "N/A");
            context.setVariable("unitNumber", unitNumber);
            context.setVariable("reassignedByName", reassignedByName);
            context.setVariable("reassignedDate", LocalDateTime.now().format(DateTimeFormatter.ofPattern("MMM dd, yyyy hh:mm a")));
            context.setVariable("reassignmentReason", reassignmentReason);
            context.setVariable("supportEmail", supportEmail);

            // Render plain text template (HTML template can be added later)
            String textContent = templateEngine.process("email/work-order-removed-from-assignment.txt", context);

            // Send email (text only for now)
            sendEmail(
                previousAssigneeEmail,
                String.format("Work Order Reassigned: %s - No Longer Assigned to You", workOrder.getWorkOrderNumber()),
                textContent,
                textContent // Use text as HTML fallback
            );

            log.info("Work order removed from assignment email sent successfully to: {} for work order: {}",
                    previousAssigneeEmail, workOrder.getWorkOrderNumber());

        } catch (Exception e) {
            // Fail silently - don't throw exception to user, just log error
            log.error("Failed to send work order removed from assignment email to: {} for work order: {}",
                    previousAssigneeEmail, workOrder.getWorkOrderNumber(), e);
        }
    }

    // ========================================================================
    // Story 4.4: Job Progress Tracking and Completion Email Notifications
    // ========================================================================

    /**
     * Send work started notification email to property manager asynchronously.
     * Notifies property manager when assignee starts work on a work order.
     * Story 4.4: Job Progress Tracking and Completion (AC #27)
     *
     * @param pmEmail Property manager's email address
     * @param workOrder Work order entity
     * @param propertyName Name of the property
     * @param unitNumber Unit number (nullable)
     * @param assigneeName Name of the assignee who started work
     */
    @Async("emailTaskExecutor")
    public void sendWorkOrderStartedEmail(
            String pmEmail,
            com.ultrabms.entity.WorkOrder workOrder,
            String propertyName,
            String unitNumber,
            String assigneeName
    ) {
        try {
            String workOrderUrl = frontendUrl + "/property-manager/work-orders/" + workOrder.getId();

            Context context = new Context();
            context.setVariable("workOrderNumber", workOrder.getWorkOrderNumber());
            context.setVariable("title", workOrder.getTitle());
            context.setVariable("category", workOrder.getCategory().toString().replace("_", " "));
            context.setVariable("priority", workOrder.getPriority().toString());
            context.setVariable("propertyName", propertyName);
            context.setVariable("unitNumber", unitNumber);
            context.setVariable("assigneeName", assigneeName);
            context.setVariable("startedAt", LocalDateTime.now().format(DateTimeFormatter.ofPattern("MMM dd, yyyy hh:mm a")));
            context.setVariable("workOrderUrl", workOrderUrl);
            context.setVariable("supportEmail", supportEmail);

            String textContent = templateEngine.process("email/work-order-started.txt", context);

            sendEmail(
                pmEmail,
                String.format("Work Started: %s - %s", workOrder.getWorkOrderNumber(), workOrder.getTitle()),
                textContent,
                textContent
            );

            log.info("Work order started email sent successfully to: {} for work order: {}",
                    pmEmail, workOrder.getWorkOrderNumber());

        } catch (Exception e) {
            log.error("Failed to send work order started email to: {} for work order: {}",
                    pmEmail, workOrder.getWorkOrderNumber(), e);
        }
    }

    /**
     * Send progress update notification email to property manager asynchronously.
     * Notifies property manager when assignee adds a progress update.
     * Story 4.4: Job Progress Tracking and Completion (AC #27)
     *
     * @param pmEmail Property manager's email address
     * @param workOrder Work order entity
     * @param propertyName Name of the property
     * @param unitNumber Unit number (nullable)
     * @param assigneeName Name of the assignee who added the update
     * @param progressNotes Progress notes content
     */
    @Async("emailTaskExecutor")
    public void sendWorkOrderProgressUpdateEmail(
            String pmEmail,
            com.ultrabms.entity.WorkOrder workOrder,
            String propertyName,
            String unitNumber,
            String assigneeName,
            String progressNotes
    ) {
        try {
            String workOrderUrl = frontendUrl + "/property-manager/work-orders/" + workOrder.getId();

            Context context = new Context();
            context.setVariable("workOrderNumber", workOrder.getWorkOrderNumber());
            context.setVariable("title", workOrder.getTitle());
            context.setVariable("category", workOrder.getCategory().toString().replace("_", " "));
            context.setVariable("propertyName", propertyName);
            context.setVariable("unitNumber", unitNumber);
            context.setVariable("assigneeName", assigneeName);
            context.setVariable("progressNotes", progressNotes);
            context.setVariable("updatedAt", LocalDateTime.now().format(DateTimeFormatter.ofPattern("MMM dd, yyyy hh:mm a")));
            context.setVariable("workOrderUrl", workOrderUrl);
            context.setVariable("supportEmail", supportEmail);

            String textContent = templateEngine.process("email/work-order-progress-update.txt", context);

            sendEmail(
                pmEmail,
                String.format("Progress Update: %s - %s", workOrder.getWorkOrderNumber(), workOrder.getTitle()),
                textContent,
                textContent
            );

            log.info("Work order progress update email sent successfully to: {} for work order: {}",
                    pmEmail, workOrder.getWorkOrderNumber());

        } catch (Exception e) {
            log.error("Failed to send work order progress update email to: {} for work order: {}",
                    pmEmail, workOrder.getWorkOrderNumber(), e);
        }
    }

    /**
     * Send work completed notification email to property manager asynchronously.
     * Notifies property manager when assignee completes a work order.
     * Story 4.4: Job Progress Tracking and Completion (AC #27)
     *
     * @param pmEmail Property manager's email address
     * @param workOrder Work order entity
     * @param propertyName Name of the property
     * @param unitNumber Unit number (nullable)
     * @param assigneeName Name of the assignee who completed work
     * @param completionNotes Completion notes
     * @param hoursSpent Total hours spent
     * @param totalCost Total cost
     * @param recommendations Recommendations (nullable)
     * @param followUpRequired Whether follow-up is required
     * @param followUpDescription Follow-up description (nullable)
     */
    @Async("emailTaskExecutor")
    public void sendWorkOrderCompletedEmail(
            String pmEmail,
            com.ultrabms.entity.WorkOrder workOrder,
            String propertyName,
            String unitNumber,
            String assigneeName,
            String completionNotes,
            java.math.BigDecimal hoursSpent,
            java.math.BigDecimal totalCost,
            String recommendations,
            Boolean followUpRequired,
            String followUpDescription
    ) {
        try {
            String workOrderUrl = frontendUrl + "/property-manager/work-orders/" + workOrder.getId();

            Context context = new Context();
            context.setVariable("workOrderNumber", workOrder.getWorkOrderNumber());
            context.setVariable("title", workOrder.getTitle());
            context.setVariable("category", workOrder.getCategory().toString().replace("_", " "));
            context.setVariable("priority", workOrder.getPriority().toString());
            context.setVariable("propertyName", propertyName);
            context.setVariable("unitNumber", unitNumber);
            context.setVariable("assigneeName", assigneeName);
            context.setVariable("completedAt", LocalDateTime.now().format(DateTimeFormatter.ofPattern("MMM dd, yyyy hh:mm a")));
            context.setVariable("completionNotes", completionNotes);
            context.setVariable("hoursSpent", hoursSpent != null ? hoursSpent.toString() : "N/A");
            context.setVariable("totalCost", totalCost != null ? "AED " + totalCost.toString() : "N/A");
            context.setVariable("recommendations", recommendations);
            context.setVariable("followUpRequired", Boolean.TRUE.equals(followUpRequired));
            context.setVariable("followUpDescription", followUpDescription);
            context.setVariable("workOrderUrl", workOrderUrl);
            context.setVariable("supportEmail", supportEmail);

            String textContent = templateEngine.process("email/work-order-completed.txt", context);

            String subject = Boolean.TRUE.equals(followUpRequired)
                    ? String.format("Work Completed (Follow-up Required): %s - %s", workOrder.getWorkOrderNumber(), workOrder.getTitle())
                    : String.format("Work Completed: %s - %s", workOrder.getWorkOrderNumber(), workOrder.getTitle());

            sendEmail(
                pmEmail,
                subject,
                textContent,
                textContent
            );

            log.info("Work order completed email sent successfully to: {} for work order: {}",
                    pmEmail, workOrder.getWorkOrderNumber());

        } catch (Exception e) {
            log.error("Failed to send work order completed email to: {} for work order: {}",
                    pmEmail, workOrder.getWorkOrderNumber(), e);
        }
    }

    // ========================================================================
    // Story 5.2: Vendor Document Expiry Email Notifications
    // ========================================================================

    /**
     * Send 30-day document expiry notification to Property Manager asynchronously.
     * Notifies PM about vendor documents expiring within 30 days.
     * Story 5.2: Vendor Document and License Management (AC #19)
     *
     * @param vendor Vendor entity with expiring document
     * @param documentType Type of document expiring
     * @param fileName Name of the document file
     * @param expiryDate Document expiry date
     * @param daysUntilExpiry Days remaining until expiry
     */
    @Async("emailTaskExecutor")
    public void sendDocumentExpiry30DayNotification(
            com.ultrabms.entity.Vendor vendor,
            String documentType,
            String fileName,
            java.time.LocalDate expiryDate,
            Long daysUntilExpiry
    ) {
        try {
            String vendorUrl = frontendUrl + "/property-manager/vendors/" + vendor.getId();

            Context context = new Context();
            context.setVariable("vendorName", vendor.getCompanyName());
            context.setVariable("vendorNumber", vendor.getVendorNumber());
            context.setVariable("documentType", documentType.replace("_", " "));
            context.setVariable("fileName", fileName);
            context.setVariable("expiryDate", expiryDate.format(java.time.format.DateTimeFormatter.ofPattern("MMM dd, yyyy")));
            context.setVariable("daysUntilExpiry", daysUntilExpiry);
            context.setVariable("vendorUrl", vendorUrl);
            context.setVariable("supportEmail", supportEmail);

            String textContent = templateEngine.process("email/vendor-document-expiry-30-day.txt", context);

            sendEmail(
                supportEmail,  // PM notification goes to support email
                String.format("Document Expiring Soon: %s - %s (%d days)",
                        vendor.getCompanyName(), documentType.replace("_", " "), daysUntilExpiry),
                textContent,
                textContent
            );

            log.info("30-day document expiry notification sent for vendor: {} document: {}",
                    vendor.getVendorNumber(), documentType);

        } catch (Exception e) {
            log.error("Failed to send 30-day document expiry notification for vendor: {} document: {}",
                    vendor.getVendorNumber(), documentType, e);
        }
    }

    /**
     * Send 15-day document expiry notification to Vendor asynchronously.
     * Notifies vendor directly about their expiring documents.
     * Story 5.2: Vendor Document and License Management (AC #20)
     *
     * @param vendor Vendor entity with expiring document
     * @param documentType Type of document expiring
     * @param fileName Name of the document file
     * @param expiryDate Document expiry date
     * @param daysUntilExpiry Days remaining until expiry
     */
    @Async("emailTaskExecutor")
    public void sendDocumentExpiry15DayNotification(
            com.ultrabms.entity.Vendor vendor,
            String documentType,
            String fileName,
            java.time.LocalDate expiryDate,
            Long daysUntilExpiry
    ) {
        try {
            Context context = new Context();
            context.setVariable("vendorName", vendor.getCompanyName());
            context.setVariable("contactPersonName", vendor.getContactPersonName());
            context.setVariable("documentType", documentType.replace("_", " "));
            context.setVariable("fileName", fileName);
            context.setVariable("expiryDate", expiryDate.format(java.time.format.DateTimeFormatter.ofPattern("MMM dd, yyyy")));
            context.setVariable("daysUntilExpiry", daysUntilExpiry);
            context.setVariable("supportEmail", supportEmail);

            String textContent = templateEngine.process("email/vendor-document-expiry-15-day.txt", context);

            sendEmail(
                vendor.getEmail(),
                String.format("URGENT: Your %s Expires in %d Days",
                        documentType.replace("_", " "), daysUntilExpiry),
                textContent,
                textContent
            );

            log.info("15-day document expiry notification sent to vendor: {} for document: {}",
                    vendor.getEmail(), documentType);

        } catch (Exception e) {
            log.error("Failed to send 15-day document expiry notification to vendor: {} for document: {}",
                    vendor.getEmail(), documentType, e);
        }
    }

    /**
     * Send vendor suspension notification due to expired documents asynchronously.
     * Notifies vendor that their account has been suspended due to expired critical documents.
     * Story 5.2: Vendor Document and License Management (AC #21)
     *
     * @param vendor Vendor entity that has been suspended
     * @param expiredDocumentTypes List of expired document types
     */
    @Async("emailTaskExecutor")
    public void sendVendorSuspendedDueToExpiredDocuments(
            com.ultrabms.entity.Vendor vendor,
            java.util.List<String> expiredDocumentTypes
    ) {
        try {
            String expiredDocsFormatted = expiredDocumentTypes.stream()
                    .map(type -> type.replace("_", " "))
                    .collect(java.util.stream.Collectors.joining(", "));

            Context context = new Context();
            context.setVariable("vendorName", vendor.getCompanyName());
            context.setVariable("contactPersonName", vendor.getContactPersonName());
            context.setVariable("vendorNumber", vendor.getVendorNumber());
            context.setVariable("expiredDocuments", expiredDocsFormatted);
            context.setVariable("supportEmail", supportEmail);

            String textContent = templateEngine.process("email/vendor-suspended-expired-documents.txt", context);

            // Send to vendor
            sendEmail(
                vendor.getEmail(),
                String.format("Account Suspended: Expired Documents - %s", vendor.getCompanyName()),
                textContent,
                textContent
            );

            // Also notify PM
            sendEmail(
                supportEmail,
                String.format("Vendor Suspended: %s (%s) - Expired Documents",
                        vendor.getCompanyName(), vendor.getVendorNumber()),
                textContent,
                textContent
            );

            log.info("Vendor suspension notification sent to vendor: {} for expired documents: {}",
                    vendor.getEmail(), expiredDocsFormatted);

        } catch (Exception e) {
            log.error("Failed to send vendor suspension notification to vendor: {}",
                    vendor.getEmail(), e);
        }
    }

    /**
     * Send vendor reactivation notification after document renewal asynchronously.
     * Notifies vendor that their account has been reactivated after uploading valid documents.
     * Story 5.2: Vendor Document and License Management (AC #22)
     *
     * @param vendor Vendor entity that has been reactivated
     */
    @Async("emailTaskExecutor")
    public void sendVendorReactivatedNotification(
            com.ultrabms.entity.Vendor vendor
    ) {
        try {
            Context context = new Context();
            context.setVariable("vendorName", vendor.getCompanyName());
            context.setVariable("contactPersonName", vendor.getContactPersonName());
            context.setVariable("vendorNumber", vendor.getVendorNumber());
            context.setVariable("supportEmail", supportEmail);

            String textContent = templateEngine.process("email/vendor-reactivated.txt", context);

            sendEmail(
                vendor.getEmail(),
                String.format("Account Reactivated: %s", vendor.getCompanyName()),
                textContent,
                textContent
            );

            log.info("Vendor reactivation notification sent to vendor: {}",
                    vendor.getEmail());

        } catch (Exception e) {
            log.error("Failed to send vendor reactivation notification to vendor: {}",
                    vendor.getEmail(), e);
        }
    }

    // ========================================================================
    // Story 6.1: Invoice and Payment Email Notifications
    // ========================================================================

    /**
     * Send invoice email to tenant asynchronously with PDF attachment.
     * Story 6.1: Rent Invoicing and Payment Management (AC #11)
     *
     * @param invoice Invoice entity
     * @param pdfContent Invoice PDF content
     */
    @Async("emailTaskExecutor")
    public void sendInvoiceEmail(com.ultrabms.entity.Invoice invoice, byte[] pdfContent) {
        try {
            com.ultrabms.entity.Tenant tenant = invoice.getTenant();
            String invoiceUrl = frontendUrl + "/tenant/invoices/" + invoice.getId();

            Context context = new Context();
            context.setVariable("tenantName", tenant.getFirstName() + " " + tenant.getLastName());
            context.setVariable("invoiceNumber", invoice.getInvoiceNumber());
            context.setVariable("invoiceDate", invoice.getInvoiceDate().format(java.time.format.DateTimeFormatter.ofPattern("MMM dd, yyyy")));
            context.setVariable("dueDate", invoice.getDueDate().format(java.time.format.DateTimeFormatter.ofPattern("MMM dd, yyyy")));
            context.setVariable("propertyName", invoice.getProperty() != null ? invoice.getProperty().getName() : "N/A");
            context.setVariable("unitNumber", invoice.getUnit() != null ? invoice.getUnit().getUnitNumber() : "N/A");
            context.setVariable("baseRent", formatCurrency(invoice.getBaseRent()));
            context.setVariable("serviceCharges", formatCurrency(invoice.getServiceCharges()));
            context.setVariable("parkingFees", formatCurrency(invoice.getParkingFees()));
            context.setVariable("lateFee", formatCurrency(invoice.getLateFee()));
            context.setVariable("totalAmount", formatCurrency(invoice.getTotalAmount()));
            context.setVariable("balanceAmount", formatCurrency(invoice.getBalanceAmount()));
            context.setVariable("additionalCharges", invoice.getAdditionalCharges());
            context.setVariable("notes", invoice.getNotes());
            context.setVariable("invoiceUrl", invoiceUrl);
            context.setVariable("supportEmail", supportEmail);

            String htmlContent = templateEngine.process("email/invoice-sent", context);
            String textContent = templateEngine.process("email/invoice-sent.txt", context);

            sendEmailWithAttachment(
                tenant.getEmail(),
                String.format("Invoice %s - Payment Due %s",
                        invoice.getInvoiceNumber(),
                        invoice.getDueDate().format(java.time.format.DateTimeFormatter.ofPattern("MMM dd, yyyy"))),
                textContent,
                htmlContent,
                pdfContent,
                String.format("invoice-%s.pdf", invoice.getInvoiceNumber())
            );

            log.info("Invoice email sent successfully to tenant: {} ({}) for invoice: {}",
                    tenant.getId(), tenant.getEmail(), invoice.getInvoiceNumber());

        } catch (Exception e) {
            log.error("Failed to send invoice email to tenant for invoice: {}",
                    invoice.getInvoiceNumber(), e);
        }
    }

    /**
     * Send payment received confirmation email to tenant.
     * Story 6.1: Rent Invoicing and Payment Management (AC #7)
     *
     * @param payment Payment entity
     * @param receiptPdf Payment receipt PDF content
     */
    @Async("emailTaskExecutor")
    public void sendPaymentReceivedEmail(com.ultrabms.entity.Payment payment, byte[] receiptPdf) {
        try {
            com.ultrabms.entity.Invoice invoice = payment.getInvoice();
            com.ultrabms.entity.Tenant tenant = invoice.getTenant();
            String receiptUrl = frontendUrl + "/tenant/invoices/" + invoice.getId() + "/payments/" + payment.getId();

            Context context = new Context();
            context.setVariable("tenantName", tenant.getFirstName() + " " + tenant.getLastName());
            context.setVariable("receiptNumber", payment.getPaymentNumber());
            context.setVariable("invoiceNumber", invoice.getInvoiceNumber());
            context.setVariable("paymentDate", payment.getPaymentDate().format(java.time.format.DateTimeFormatter.ofPattern("MMM dd, yyyy")));
            context.setVariable("paymentMethod", payment.getPaymentMethod().toString().replace("_", " "));
            context.setVariable("amountPaid", formatCurrency(payment.getAmount()));
            context.setVariable("referenceNumber", payment.getTransactionReference());
            context.setVariable("previousBalance", formatCurrency(invoice.getBalanceAmount().add(payment.getAmount())));
            context.setVariable("newBalance", formatCurrency(invoice.getBalanceAmount()));
            context.setVariable("isPaidInFull", invoice.getBalanceAmount().compareTo(java.math.BigDecimal.ZERO) <= 0);
            context.setVariable("receiptUrl", receiptUrl);
            context.setVariable("supportEmail", supportEmail);

            String htmlContent = templateEngine.process("email/payment-received", context);
            String textContent = templateEngine.process("email/payment-received.txt", context);

            sendEmailWithAttachment(
                tenant.getEmail(),
                String.format("Payment Received - Receipt %s", payment.getPaymentNumber()),
                textContent,
                htmlContent,
                receiptPdf,
                String.format("receipt-%s.pdf", payment.getPaymentNumber())
            );

            log.info("Payment received email sent successfully to tenant: {} ({}) for payment: {}",
                    tenant.getId(), tenant.getEmail(), payment.getPaymentNumber());

        } catch (Exception e) {
            log.error("Failed to send payment received email for payment: {}",
                    payment.getId(), e);
        }
    }

    /**
     * Send payment reminder email to tenant before due date.
     * Story 6.1: Rent Invoicing and Payment Management (AC #14)
     *
     * @param invoice Invoice entity
     * @param daysUntilDue Number of days until the due date
     */
    @Async("emailTaskExecutor")
    public void sendPaymentReminderEmail(com.ultrabms.entity.Invoice invoice, int daysUntilDue) {
        try {
            com.ultrabms.entity.Tenant tenant = invoice.getTenant();
            String invoiceUrl = frontendUrl + "/tenant/invoices/" + invoice.getId();
            String paymentUrl = frontendUrl + "/tenant/invoices/" + invoice.getId() + "/pay";

            Context context = new Context();
            context.setVariable("tenantName", tenant.getFirstName() + " " + tenant.getLastName());
            context.setVariable("invoiceNumber", invoice.getInvoiceNumber());
            context.setVariable("dueDate", invoice.getDueDate().format(java.time.format.DateTimeFormatter.ofPattern("MMM dd, yyyy")));
            context.setVariable("daysUntilDue", daysUntilDue);
            context.setVariable("balanceAmount", formatCurrency(invoice.getBalanceAmount()));
            context.setVariable("propertyName", invoice.getProperty() != null ? invoice.getProperty().getName() : "N/A");
            context.setVariable("unitNumber", invoice.getUnit() != null ? invoice.getUnit().getUnitNumber() : "N/A");
            context.setVariable("isUrgent", daysUntilDue <= 3);
            context.setVariable("invoiceUrl", invoiceUrl);
            context.setVariable("paymentUrl", paymentUrl);
            context.setVariable("supportEmail", supportEmail);

            String htmlContent = templateEngine.process("email/payment-reminder", context);
            String textContent = templateEngine.process("email/payment-reminder.txt", context);

            String subject = daysUntilDue <= 3
                    ? String.format("URGENT: Payment Due in %d Day%s - Invoice %s",
                            daysUntilDue, daysUntilDue == 1 ? "" : "s", invoice.getInvoiceNumber())
                    : String.format("Payment Reminder - Invoice %s Due in %d Days",
                            invoice.getInvoiceNumber(), daysUntilDue);

            sendEmail(
                tenant.getEmail(),
                subject,
                textContent,
                htmlContent
            );

            log.info("Payment reminder email sent successfully to tenant: {} ({}) for invoice: {} - {} days until due",
                    tenant.getId(), tenant.getEmail(), invoice.getInvoiceNumber(), daysUntilDue);

        } catch (Exception e) {
            log.error("Failed to send payment reminder email for invoice: {}",
                    invoice.getInvoiceNumber(), e);
        }
    }

    /**
     * Send overdue invoice notification email to tenant.
     * Story 6.1: Rent Invoicing and Payment Management (AC #12)
     *
     * @param invoice Invoice entity marked as overdue
     * @param daysOverdue Number of days past due date
     */
    @Async("emailTaskExecutor")
    public void sendOverdueInvoiceEmail(com.ultrabms.entity.Invoice invoice, long daysOverdue) {
        try {
            com.ultrabms.entity.Tenant tenant = invoice.getTenant();
            String invoiceUrl = frontendUrl + "/tenant/invoices/" + invoice.getId();
            String paymentUrl = frontendUrl + "/tenant/invoices/" + invoice.getId() + "/pay";

            Context context = new Context();
            context.setVariable("tenantName", tenant.getFirstName() + " " + tenant.getLastName());
            context.setVariable("invoiceNumber", invoice.getInvoiceNumber());
            context.setVariable("dueDate", invoice.getDueDate().format(java.time.format.DateTimeFormatter.ofPattern("MMM dd, yyyy")));
            context.setVariable("daysOverdue", daysOverdue);
            context.setVariable("balanceAmount", formatCurrency(invoice.getBalanceAmount()));
            context.setVariable("lateFee", formatCurrency(invoice.getLateFee()));
            context.setVariable("lateFeeApplied", invoice.getLateFeeApplied());
            context.setVariable("propertyName", invoice.getProperty() != null ? invoice.getProperty().getName() : "N/A");
            context.setVariable("unitNumber", invoice.getUnit() != null ? invoice.getUnit().getUnitNumber() : "N/A");
            context.setVariable("invoiceUrl", invoiceUrl);
            context.setVariable("paymentUrl", paymentUrl);
            context.setVariable("supportEmail", supportEmail);

            String htmlContent = templateEngine.process("email/invoice-overdue", context);
            String textContent = templateEngine.process("email/invoice-overdue.txt", context);

            sendEmail(
                tenant.getEmail(),
                String.format("OVERDUE: Invoice %s - %d Day%s Past Due",
                        invoice.getInvoiceNumber(), daysOverdue, daysOverdue == 1 ? "" : "s"),
                textContent,
                htmlContent
            );

            log.info("Overdue invoice email sent successfully to tenant: {} ({}) for invoice: {} - {} days overdue",
                    tenant.getId(), tenant.getEmail(), invoice.getInvoiceNumber(), daysOverdue);

        } catch (Exception e) {
            log.error("Failed to send overdue invoice email for invoice: {}",
                    invoice.getInvoiceNumber(), e);
        }
    }

    /**
     * Send late fee applied notification email to tenant.
     * Story 6.1: Rent Invoicing and Payment Management (AC #13)
     *
     * @param invoice Invoice entity with late fee applied
     */
    @Async("emailTaskExecutor")
    public void sendLateFeeAppliedEmail(com.ultrabms.entity.Invoice invoice) {
        try {
            com.ultrabms.entity.Tenant tenant = invoice.getTenant();
            String invoiceUrl = frontendUrl + "/tenant/invoices/" + invoice.getId();

            Context context = new Context();
            context.setVariable("tenantName", tenant.getFirstName() + " " + tenant.getLastName());
            context.setVariable("invoiceNumber", invoice.getInvoiceNumber());
            context.setVariable("dueDate", invoice.getDueDate().format(java.time.format.DateTimeFormatter.ofPattern("MMM dd, yyyy")));
            context.setVariable("lateFeeAmount", formatCurrency(invoice.getLateFee()));
            context.setVariable("previousBalance", formatCurrency(invoice.getBalanceAmount().subtract(invoice.getLateFee())));
            context.setVariable("newBalance", formatCurrency(invoice.getBalanceAmount()));
            context.setVariable("invoiceUrl", invoiceUrl);
            context.setVariable("supportEmail", supportEmail);

            String htmlContent = templateEngine.process("email/late-fee-applied", context);
            String textContent = templateEngine.process("email/late-fee-applied.txt", context);

            sendEmail(
                tenant.getEmail(),
                String.format("Late Fee Applied - Invoice %s", invoice.getInvoiceNumber()),
                textContent,
                htmlContent
            );

            log.info("Late fee applied email sent successfully to tenant: {} ({}) for invoice: {}",
                    tenant.getId(), tenant.getEmail(), invoice.getInvoiceNumber());

        } catch (Exception e) {
            log.error("Failed to send late fee applied email for invoice: {}",
                    invoice.getInvoiceNumber(), e);
        }
    }

    /**
     * Helper method to format currency amounts in AED
     */
    private String formatCurrency(java.math.BigDecimal amount) {
        if (amount == null) {
            return "AED 0.00";
        }
        return String.format("AED %,.2f", amount);
    }

    // ========================================================================
    // Email Helper Methods
    // ========================================================================

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
