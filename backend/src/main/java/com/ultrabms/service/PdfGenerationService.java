package com.ultrabms.service;

import com.ultrabms.dto.checkout.CheckoutResponse;
import com.ultrabms.dto.checkout.DepositRefundDto;
import com.ultrabms.dto.expenses.ExpenseResponseDto;
import com.ultrabms.entity.Announcement;
import com.ultrabms.entity.Invoice;
import com.ultrabms.entity.Payment;

import java.util.List;

/**
 * Service for generating PDF documents
 * Story 6.1: Rent Invoicing and Payment Management
 * Story 6.2: Expense Management and Vendor Payments
 * Story 3.7: Tenant Checkout and Deposit Refund Processing
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

    // ============================================================
    // CHECKOUT PDF METHODS - Story 3.7
    // ============================================================

    /**
     * Generate inspection report PDF
     * Story 3.7 AC #10: Inspection report with checklist results and photos
     *
     * @param checkout Checkout response with inspection data
     * @return PDF content as byte array
     */
    byte[] generateInspectionReportPdf(CheckoutResponse checkout);

    /**
     * Generate deposit statement PDF
     * Story 3.7 AC #10: Deposit statement with deductions breakdown
     *
     * @param checkout Checkout response with deposit calculation
     * @param depositRefund Deposit refund details
     * @return PDF content as byte array
     */
    byte[] generateDepositStatementPdf(CheckoutResponse checkout, DepositRefundDto depositRefund);

    /**
     * Generate refund receipt PDF
     * Story 3.7 AC #10: Refund receipt with transaction details
     *
     * @param checkout Checkout response
     * @param depositRefund Deposit refund details with processed refund
     * @return PDF content as byte array
     */
    byte[] generateRefundReceiptPdf(CheckoutResponse checkout, DepositRefundDto depositRefund);

    // ============================================================
    // FINANCIAL REPORT PDF METHODS - Story 6.4
    // ============================================================

    /**
     * Generate Income Statement PDF report
     * Story 6.4 AC #16: PDF export for reports
     *
     * @param incomeStatement Income statement data
     * @return PDF content as byte array
     */
    byte[] generateIncomeStatementPdf(com.ultrabms.dto.reports.IncomeStatementDto incomeStatement);

    /**
     * Generate Cash Flow Summary PDF report
     * Story 6.4 AC #16: PDF export for reports
     *
     * @param cashFlow Cash flow summary data
     * @return PDF content as byte array
     */
    byte[] generateCashFlowPdf(com.ultrabms.dto.reports.CashFlowSummaryDto cashFlow);

    /**
     * Generate AR Aging PDF report
     * Story 6.4 AC #16: PDF export for reports
     *
     * @param arAging AR aging data
     * @return PDF content as byte array
     */
    byte[] generateARAgingPdf(com.ultrabms.dto.reports.ARAgingDto arAging);

    /**
     * Generate Revenue Breakdown PDF report
     * Story 6.4 AC #16: PDF export for reports
     *
     * @param revenueBreakdown Revenue breakdown data
     * @return PDF content as byte array
     */
    byte[] generateRevenueBreakdownPdf(com.ultrabms.dto.reports.RevenueBreakdownDto revenueBreakdown);

    /**
     * Generate Expense Breakdown PDF report
     * Story 6.4 AC #16: PDF export for reports
     *
     * @param expenseBreakdown Expense breakdown data
     * @return PDF content as byte array
     */
    byte[] generateExpenseBreakdownPdf(com.ultrabms.dto.reports.ExpenseBreakdownDto expenseBreakdown);

    /**
     * Generate Financial Dashboard PDF report
     * Story 6.4 AC #16: PDF export for reports
     *
     * @param dashboard Financial dashboard data
     * @return PDF content as byte array
     */
    byte[] generateFinancialDashboardPdf(com.ultrabms.dto.reports.FinancialDashboardDto dashboard);

    // ============================================================
    // ANNOUNCEMENT PDF METHODS - Story 9.2
    // ============================================================

    /**
     * Generate announcement PDF
     * Story 9.2 AC #35-39: Printable announcement with company letterhead
     *
     * @param announcement The announcement to generate PDF for
     * @return PDF content as byte array
     */
    byte[] generateAnnouncementPdf(Announcement announcement);
}
