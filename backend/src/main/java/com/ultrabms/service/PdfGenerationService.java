package com.ultrabms.service;

import com.ultrabms.dto.expenses.ExpenseResponseDto;
import com.ultrabms.entity.Invoice;
import com.ultrabms.entity.Payment;

import java.util.List;

/**
 * Service for generating PDF documents
 * Story 6.1: Rent Invoicing and Payment Management
 * Story 6.2: Expense Management and Vendor Payments
 * AC #9, #10: PDF invoice and payment receipt generation
 */
public interface PdfGenerationService {

    /**
     * Generate invoice PDF
     * AC #9: PDF invoice format
     *
     * @param invoice The invoice to generate PDF for
     * @return PDF content as byte array
     */
    byte[] generateInvoicePdf(Invoice invoice);

    /**
     * Generate payment receipt PDF
     * AC #10: Payment receipt generation
     *
     * @param payment The payment to generate receipt for
     * @return PDF content as byte array
     */
    byte[] generatePaymentReceiptPdf(Payment payment);

    /**
     * Generate expense payment summary PDF
     * Story 6.2 AC #10: Payment summary PDF with batch payment details
     *
     * @param expenses List of expense DTOs to include in summary
     * @return PDF content as byte array
     */
    byte[] generateExpensePaymentSummaryPdf(List<ExpenseResponseDto> expenses);
}
