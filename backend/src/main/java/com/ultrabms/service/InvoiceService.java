package com.ultrabms.service;

import com.ultrabms.dto.invoices.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

/**
 * Service interface for Invoice and Payment operations.
 * Handles invoice CRUD, payment recording, and invoice lifecycle management.
 *
 * Story 6.1: Rent Invoicing and Payment Management
 */
public interface InvoiceService {

    // =================================================================
    // INVOICE OPERATIONS
    // =================================================================

    /**
     * Create a new invoice for a tenant
     * AC #4: Manual invoice creation
     *
     * @param dto       InvoiceCreateDto with invoice data
     * @param createdBy User UUID who is creating the invoice
     * @return Created invoice response DTO
     */
    InvoiceResponseDto createInvoice(InvoiceCreateDto dto, UUID createdBy);

    /**
     * Get invoice by ID with full details and payment history
     *
     * @param id Invoice UUID
     * @return Invoice response DTO with payments
     */
    InvoiceResponseDto getInvoiceById(UUID id);

    /**
     * Get paginated list of invoices with filters
     *
     * @param filterDto Filter parameters
     * @param pageable  Pagination parameters
     * @return Page of invoice list DTOs
     */
    Page<InvoiceListDto> getInvoices(InvoiceFilterDto filterDto, Pageable pageable);

    /**
     * Update invoice details (DRAFT status only)
     *
     * @param id        Invoice UUID
     * @param dto       InvoiceUpdateDto with updated data
     * @param updatedBy User UUID who is updating
     * @return Updated invoice response DTO
     */
    InvoiceResponseDto updateInvoice(UUID id, InvoiceUpdateDto dto, UUID updatedBy);

    /**
     * Send invoice to tenant (DRAFT -> SENT)
     * AC #6, #11: Send invoice via email
     *
     * @param id     Invoice UUID
     * @param sentBy User UUID who is sending
     * @return Updated invoice response DTO
     */
    InvoiceResponseDto sendInvoice(UUID id, UUID sentBy);

    /**
     * Cancel invoice (DRAFT or SENT with no payments)
     *
     * @param id          Invoice UUID
     * @param cancelledBy User UUID who is cancelling
     * @return Updated invoice response DTO
     */
    InvoiceResponseDto cancelInvoice(UUID id, UUID cancelledBy);

    /**
     * Get invoices for a specific tenant
     *
     * @param tenantId Tenant UUID
     * @param pageable Pagination parameters
     * @return Page of invoice list DTOs
     */
    Page<InvoiceListDto> getTenantInvoices(UUID tenantId, Pageable pageable);

    /**
     * Get outstanding invoices for a tenant
     *
     * @param tenantId Tenant UUID
     * @return List of outstanding invoice DTOs
     */
    java.util.List<InvoiceListDto> getOutstandingInvoicesByTenant(UUID tenantId);

    // =================================================================
    // PAYMENT OPERATIONS
    // =================================================================

    /**
     * Record a payment against an invoice
     * AC #7: Payment recording with receipt generation
     *
     * @param invoiceId  Invoice UUID
     * @param dto        PaymentCreateDto with payment data
     * @param recordedBy User UUID who is recording the payment
     * @return Payment response DTO
     */
    PaymentResponseDto recordPayment(UUID invoiceId, PaymentCreateDto dto, UUID recordedBy);

    /**
     * Get payment by ID
     *
     * @param paymentId Payment UUID
     * @return Payment response DTO
     */
    PaymentResponseDto getPaymentById(UUID paymentId);

    /**
     * Get payments for an invoice
     *
     * @param invoiceId Invoice UUID
     * @param pageable  Pagination parameters
     * @return Page of payment list DTOs
     */
    Page<PaymentListDto> getInvoicePayments(UUID invoiceId, Pageable pageable);

    /**
     * Get payments with filters
     *
     * @param filterDto Filter parameters
     * @param pageable  Pagination parameters
     * @return Page of payment list DTOs
     */
    Page<PaymentListDto> getPayments(PaymentFilterDto filterDto, Pageable pageable);

    // =================================================================
    // SUMMARY AND ANALYTICS
    // =================================================================

    /**
     * Get invoice summary for dashboard
     * AC #15: Display all invoices with status, outstanding balance
     *
     * @param propertyId Optional property UUID to filter by
     * @return Invoice summary DTO
     */
    InvoiceSummaryDto getInvoiceSummary(UUID propertyId);

    // =================================================================
    // PDF GENERATION
    // =================================================================

    /**
     * Generate invoice PDF
     * AC #9: PDF invoice format
     *
     * @param invoiceId Invoice UUID
     * @return PDF content as byte array
     */
    byte[] generateInvoicePdf(UUID invoiceId);

    /**
     * Generate payment receipt PDF
     * AC #10: Payment receipt generation
     *
     * @param paymentId Payment UUID
     * @return PDF content as byte array
     */
    byte[] generatePaymentReceiptPdf(UUID paymentId);

    // =================================================================
    // SCHEDULED OPERATIONS
    // =================================================================

    /**
     * Generate scheduled invoices for all active tenants
     * AC #3: Automated invoice generation
     *
     * @return Number of invoices generated
     */
    int generateScheduledInvoices();

    /**
     * Mark overdue invoices
     * AC #12: Update invoice status to OVERDUE when past due
     *
     * @return Number of invoices marked as overdue
     */
    int markOverdueInvoices();

    /**
     * Apply late fees to overdue invoices
     * AC #13: Apply late fee based on configurable percentage
     *
     * @return Number of invoices with late fees applied
     */
    int applyLateFees();

    /**
     * Send payment reminder emails for invoices due soon
     * AC #14: Send reminder emails based on configurable days
     *
     * @param daysBefore Number of days before due date to send reminder
     * @return Number of reminders sent
     */
    int sendPaymentReminders(int daysBefore);
}
