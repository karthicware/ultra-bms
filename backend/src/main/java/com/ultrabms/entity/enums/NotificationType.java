package com.ultrabms.entity.enums;

/**
 * Notification type enumeration.
 * Defines all types of email notifications that can be sent by the system.
 *
 * Story 9.1: Email Notification System
 */
public enum NotificationType {
    // ========================================
    // AUTHENTICATION NOTIFICATIONS
    // ========================================
    /**
     * Password reset link requested by user
     */
    PASSWORD_RESET_REQUESTED,

    /**
     * Password was successfully changed
     */
    PASSWORD_CHANGED,

    /**
     * New user account created (welcome email)
     */
    NEW_USER_CREATED,

    // ========================================
    // TENANT NOTIFICATIONS
    // ========================================
    /**
     * Tenant successfully onboarded
     */
    TENANT_ONBOARDED,

    /**
     * Lease document uploaded for tenant
     */
    LEASE_UPLOADED,

    /**
     * Lease expiring in 90 days
     */
    LEASE_EXPIRING_90,

    /**
     * Lease expiring in 60 days
     */
    LEASE_EXPIRING_60,

    /**
     * Lease expiring in 30 days
     */
    LEASE_EXPIRING_30,

    // ========================================
    // MAINTENANCE NOTIFICATIONS
    // ========================================
    /**
     * Maintenance request submitted by tenant
     */
    MAINTENANCE_REQUEST_SUBMITTED,

    /**
     * Work order assigned to vendor/technician
     */
    WORK_ORDER_ASSIGNED,

    /**
     * Work order status changed
     */
    WORK_ORDER_STATUS_CHANGED,

    /**
     * Work order completed
     */
    WORK_ORDER_COMPLETED,

    // ========================================
    // FINANCIAL NOTIFICATIONS
    // ========================================
    /**
     * Invoice generated for tenant
     */
    INVOICE_GENERATED,

    /**
     * Payment received from tenant
     */
    PAYMENT_RECEIVED,

    /**
     * Invoice overdue by 7 days
     */
    INVOICE_OVERDUE_7,

    /**
     * Invoice overdue by 14 days
     */
    INVOICE_OVERDUE_14,

    /**
     * Invoice overdue by 30 days
     */
    INVOICE_OVERDUE_30,

    /**
     * Post-dated cheque due for deposit soon
     */
    PDC_DUE_SOON,

    /**
     * Post-dated cheque bounced
     */
    PDC_BOUNCED,

    // ========================================
    // VENDOR NOTIFICATIONS
    // ========================================
    /**
     * New vendor registered in system
     */
    VENDOR_REGISTERED,

    /**
     * Vendor document expiring soon
     */
    VENDOR_DOCUMENT_EXPIRING,

    /**
     * Vendor license has expired
     */
    VENDOR_LICENSE_EXPIRED,

    // ========================================
    // COMPLIANCE NOTIFICATIONS
    // ========================================
    /**
     * Compliance item due soon
     */
    COMPLIANCE_DUE_SOON,

    /**
     * Compliance item is overdue
     */
    COMPLIANCE_OVERDUE,

    /**
     * Inspection scheduled
     */
    INSPECTION_SCHEDULED,

    // ========================================
    // DOCUMENT NOTIFICATIONS
    // ========================================
    /**
     * Document uploaded to system
     */
    DOCUMENT_UPLOADED,

    /**
     * Document expiring soon
     */
    DOCUMENT_EXPIRING,

    // ========================================
    // ANNOUNCEMENT NOTIFICATIONS
    // ========================================
    /**
     * Announcement published to recipients
     */
    ANNOUNCEMENT_PUBLISHED
}
