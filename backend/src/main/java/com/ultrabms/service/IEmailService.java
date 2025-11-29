package com.ultrabms.service;

import com.ultrabms.entity.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Interface for email service operations.
 * Allows mocking in unit tests without ByteBuddy/Mockito class modification issues.
 */
public interface IEmailService {

    // Password management emails
    void sendPasswordResetEmail(User user, String resetToken);
    void sendPasswordChangeConfirmation(User user);

    // Quotation and lead emails
    void sendQuotationEmail(Lead lead, Quotation quotation, byte[] pdfContent);
    void sendWelcomeEmail(Lead lead);
    void sendQuotationAcceptedNotification(Lead lead, Quotation quotation);

    // Maintenance request emails
    void sendMaintenanceRequestConfirmation(Tenant tenant, MaintenanceRequest request);
    void sendMaintenanceRequestNotification(Tenant tenant, MaintenanceRequest request);
    void sendMaintenanceRequestStatusChange(Tenant tenant, MaintenanceRequest request, String vendorName, String vendorContact);

    // Work order emails
    void sendWorkOrderAssignmentEmail(String assigneeEmail, String assigneeName, WorkOrder workOrder,
                                       String propertyName, String unitNumber, String assignedByName, String assignmentNotes);
    void sendWorkOrderReassignmentEmail(String newAssigneeEmail, String newAssigneeName, String previousAssigneeName,
                                         WorkOrder workOrder, String propertyName, String unitNumber,
                                         String reassignedByName, String reassignmentReason, String assignmentNotes);
    void sendWorkOrderRemovedFromAssignmentEmail(String previousAssigneeEmail, String previousAssigneeName,
                                                  String newAssigneeName, String newAssigneeType, WorkOrder workOrder,
                                                  String propertyName, String unitNumber, String reassignedByName,
                                                  String reassignmentReason);
    void sendWorkOrderStartedEmail(String pmEmail, WorkOrder workOrder, String propertyName, String unitNumber, String assigneeName);
    void sendWorkOrderProgressUpdateEmail(String pmEmail, WorkOrder workOrder, String propertyName, String unitNumber,
                                           String assigneeName, String progressNotes);
    void sendWorkOrderCompletedEmail(String pmEmail, WorkOrder workOrder, String propertyName, String unitNumber,
                                      String assigneeName, String completionNotes, BigDecimal hoursSpent, BigDecimal totalCost,
                                      String recommendations, Boolean followUpRequired, String followUpDescription);

    // Vendor document emails
    void sendDocumentExpiry30DayNotification(Vendor vendor, String documentType, String fileName, LocalDate expiryDate, Long daysUntilExpiry);
    void sendDocumentExpiry15DayNotification(Vendor vendor, String documentType, String fileName, LocalDate expiryDate, Long daysUntilExpiry);
    void sendVendorSuspendedDueToExpiredDocuments(Vendor vendor, List<String> expiredDocumentTypes);
    void sendVendorReactivatedNotification(Vendor vendor);

    // Invoice and payment emails
    void sendInvoiceEmail(Invoice invoice, byte[] pdfContent);
    void sendPaymentReceivedEmail(Payment payment, byte[] receiptPdf);
    void sendPaymentReminderEmail(Invoice invoice, int daysUntilDue);
    void sendOverdueInvoiceEmail(Invoice invoice, long daysOverdue);
    void sendLateFeeAppliedEmail(Invoice invoice);

    // Admin user emails
    void sendUserWelcomeEmail(User user, String temporaryPassword);

    // Vendor payment emails
    void sendVendorPaymentNotification(String vendorEmail, String vendorName, String totalAmount, String paymentDate,
                                        String paymentMethod, String transactionReference, int expenseCount,
                                        List<Map<String, String>> expenseDetails);

    // Lease extension and renewal emails
    void sendLeaseExtensionConfirmation(Tenant tenant, LeaseExtension extension);
    void sendLeaseExpiryReminder(Tenant tenant, int daysRemaining);
    void sendRenewalRequestConfirmation(Tenant tenant, RenewalRequest request);
    void sendRenewalRequestStatusUpdate(Tenant tenant, RenewalRequest request);

    // Checkout emails
    void sendCheckoutInitiatedNotification(Tenant tenant, TenantCheckout checkout);
    void sendInspectionScheduledNotification(Tenant tenant, TenantCheckout checkout);
    void sendCheckoutCompletedNotification(Tenant tenant, TenantCheckout checkout);

    // PDC emails
    void sendPDCDepositReminder(String adminEmail, String adminName, List<Map<String, Object>> pdcList);
    void sendPDCBouncedNotification(String adminEmail, PDC pdc);

    // Asset warranty emails
    void sendWarrantyExpiryReminder(String recipientEmail, String recipientName, Asset asset,
                                     String propertyName, int daysUntilExpiry);
}
