package com.ultrabms.entity.enums;

/**
 * Invoice status enumeration
 * Tracks invoice lifecycle from creation to completion
 *
 * Story 6.1: Rent Invoicing and Payment Management
 */
public enum InvoiceStatus {
    /**
     * Invoice created but not yet sent to tenant
     */
    DRAFT,

    /**
     * Invoice sent to tenant via email
     */
    SENT,

    /**
     * Partial payment received
     */
    PARTIALLY_PAID,

    /**
     * Invoice fully paid
     */
    PAID,

    /**
     * Payment past due date
     */
    OVERDUE,

    /**
     * Invoice cancelled
     */
    CANCELLED
}
