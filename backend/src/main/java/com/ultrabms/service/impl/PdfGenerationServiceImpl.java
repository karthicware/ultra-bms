package com.ultrabms.service.impl;

import com.itextpdf.io.font.constants.StandardFonts;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.HorizontalAlignment;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.ultrabms.dto.checkout.CheckoutResponse;
import com.ultrabms.dto.checkout.DepositRefundDto;
import com.ultrabms.dto.expenses.ExpenseResponseDto;
import com.ultrabms.entity.Invoice;
import com.ultrabms.entity.Payment;
import com.ultrabms.entity.Tenant;
import com.ultrabms.entity.enums.DeductionType;
import com.ultrabms.entity.enums.InvoiceStatus;
import com.ultrabms.entity.enums.ItemCondition;
import com.ultrabms.entity.enums.RefundMethod;
import com.ultrabms.service.PdfGenerationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

/**
 * PDF Generation Service Implementation
 * Story 6.1: Rent Invoicing and Payment Management
 * AC #9, #10: PDF invoice and payment receipt generation
 */
@Service
public class PdfGenerationServiceImpl implements PdfGenerationService {

    private static final Logger LOGGER = LoggerFactory.getLogger(PdfGenerationServiceImpl.class);
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd MMM yyyy");
    private static final NumberFormat CURRENCY_FORMATTER = NumberFormat.getCurrencyInstance(new Locale("en", "AE"));

    // Company branding colors
    private static final DeviceRgb PRIMARY_COLOR = new DeviceRgb(37, 99, 235); // Blue
    private static final DeviceRgb HEADER_BG = new DeviceRgb(243, 244, 246); // Light gray

    public PdfGenerationServiceImpl() {
        // Initialize currency formatter for AED
        CURRENCY_FORMATTER.setMinimumFractionDigits(2);
        CURRENCY_FORMATTER.setMaximumFractionDigits(2);
    }

    @Override
    public byte[] generateInvoicePdf(Invoice invoice) {
        LOGGER.info("Generating PDF for invoice: {}", invoice.getInvoiceNumber());

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf);

            PdfFont boldFont = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);
            PdfFont regularFont = PdfFontFactory.createFont(StandardFonts.HELVETICA);

            // Get tenant details from invoice
            Tenant tenant = invoice.getTenant();
            if (tenant == null) {
                throw new RuntimeException("Tenant not found for invoice");
            }

            // Add header
            addInvoiceHeader(document, invoice, boldFont, regularFont);

            // Add tenant and property info
            addTenantPropertyInfo(document, tenant, boldFont, regularFont);

            // Add invoice details table
            addInvoiceDetailsTable(document, invoice, boldFont, regularFont);

            // Add payment history if any
            if (invoice.getPayments() != null && !invoice.getPayments().isEmpty()) {
                addPaymentHistory(document, invoice.getPayments(), boldFont, regularFont);
            }

            // Add footer with notes
            addInvoiceFooter(document, invoice, regularFont);

            document.close();

            LOGGER.info("Successfully generated PDF for invoice: {}", invoice.getInvoiceNumber());
            return baos.toByteArray();

        } catch (Exception e) {
            LOGGER.error("Failed to generate invoice PDF: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to generate invoice PDF", e);
        }
    }

    @Override
    public byte[] generatePaymentReceiptPdf(Payment payment) {
        LOGGER.info("Generating receipt PDF for payment: {}", payment.getPaymentNumber());

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf);

            PdfFont boldFont = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);
            PdfFont regularFont = PdfFontFactory.createFont(StandardFonts.HELVETICA);

            Invoice invoice = payment.getInvoice();
            Tenant tenant = invoice.getTenant();
            if (tenant == null) {
                throw new RuntimeException("Tenant not found for invoice");
            }

            // Add receipt header
            addReceiptHeader(document, payment, boldFont, regularFont);

            // Add tenant info
            addReceiptTenantInfo(document, tenant, invoice, boldFont, regularFont);

            // Add payment details
            addPaymentDetails(document, payment, invoice, boldFont, regularFont);

            // Add footer
            addReceiptFooter(document, regularFont);

            document.close();

            LOGGER.info("Successfully generated receipt PDF for payment: {}", payment.getPaymentNumber());
            return baos.toByteArray();

        } catch (Exception e) {
            LOGGER.error("Failed to generate payment receipt PDF: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to generate payment receipt PDF", e);
        }
    }

    // ============================================================
    // INVOICE PDF HELPERS
    // ============================================================

    private void addInvoiceHeader(Document document, Invoice invoice, PdfFont boldFont, PdfFont regularFont) {
        // Company name and logo placeholder
        Paragraph companyName = new Paragraph("Ultra BMS")
                .setFont(boldFont)
                .setFontSize(24)
                .setFontColor(PRIMARY_COLOR);
        document.add(companyName);

        Paragraph companySubtitle = new Paragraph("Property Management System")
                .setFont(regularFont)
                .setFontSize(10)
                .setFontColor(ColorConstants.GRAY);
        document.add(companySubtitle);

        document.add(new Paragraph("\n"));

        // Invoice title and number
        Table headerTable = new Table(UnitValue.createPercentArray(new float[]{1, 1}))
                .setWidth(UnitValue.createPercentValue(100));

        // Left side - Invoice title
        Cell leftCell = new Cell()
                .setBorder(Border.NO_BORDER)
                .add(new Paragraph("TAX INVOICE")
                        .setFont(boldFont)
                        .setFontSize(20)
                        .setFontColor(ColorConstants.DARK_GRAY));
        headerTable.addCell(leftCell);

        // Right side - Invoice details
        Cell rightCell = new Cell()
                .setBorder(Border.NO_BORDER)
                .setTextAlignment(TextAlignment.RIGHT);

        rightCell.add(new Paragraph("Invoice #: " + invoice.getInvoiceNumber())
                .setFont(boldFont)
                .setFontSize(12));
        rightCell.add(new Paragraph("Date: " + invoice.getInvoiceDate().format(DATE_FORMATTER))
                .setFont(regularFont)
                .setFontSize(10));
        rightCell.add(new Paragraph("Due Date: " + invoice.getDueDate().format(DATE_FORMATTER))
                .setFont(regularFont)
                .setFontSize(10));
        rightCell.add(new Paragraph("Status: " + getStatusLabel(invoice.getStatus()))
                .setFont(boldFont)
                .setFontSize(10)
                .setFontColor(getStatusColor(invoice.getStatus())));

        headerTable.addCell(rightCell);
        document.add(headerTable);

        document.add(new Paragraph("\n"));
    }

    private void addTenantPropertyInfo(Document document, Tenant tenant, PdfFont boldFont, PdfFont regularFont) {
        Table infoTable = new Table(UnitValue.createPercentArray(new float[]{1, 1}))
                .setWidth(UnitValue.createPercentValue(100));

        // Bill To section
        Cell billToCell = new Cell()
                .setBorder(Border.NO_BORDER)
                .setBackgroundColor(HEADER_BG)
                .setPadding(10);

        billToCell.add(new Paragraph("BILL TO")
                .setFont(boldFont)
                .setFontSize(10)
                .setFontColor(ColorConstants.GRAY));
        billToCell.add(new Paragraph(tenant.getFirstName() + " " + tenant.getLastName())
                .setFont(boldFont)
                .setFontSize(12));
        billToCell.add(new Paragraph(tenant.getEmail())
                .setFont(regularFont)
                .setFontSize(10));
        billToCell.add(new Paragraph(tenant.getPhone())
                .setFont(regularFont)
                .setFontSize(10));

        infoTable.addCell(billToCell);

        // Property section
        Cell propertyCell = new Cell()
                .setBorder(Border.NO_BORDER)
                .setBackgroundColor(HEADER_BG)
                .setPadding(10);

        propertyCell.add(new Paragraph("PROPERTY")
                .setFont(boldFont)
                .setFontSize(10)
                .setFontColor(ColorConstants.GRAY));
        propertyCell.add(new Paragraph("Tenant #: " + tenant.getTenantNumber())
                .setFont(regularFont)
                .setFontSize(10));
        propertyCell.add(new Paragraph("Property: " + (tenant.getProperty() != null ? tenant.getProperty().getName() : "N/A"))
                .setFont(regularFont)
                .setFontSize(10));
        propertyCell.add(new Paragraph("Unit: " + (tenant.getUnit() != null ? tenant.getUnit().getUnitNumber() : "N/A"))
                .setFont(regularFont)
                .setFontSize(10));

        infoTable.addCell(propertyCell);
        document.add(infoTable);

        document.add(new Paragraph("\n"));
    }

    private void addInvoiceDetailsTable(Document document, Invoice invoice, PdfFont boldFont, PdfFont regularFont) {
        // Create table with description and amount columns
        Table table = new Table(UnitValue.createPercentArray(new float[]{3, 1}))
                .setWidth(UnitValue.createPercentValue(100));

        // Header row
        table.addHeaderCell(createHeaderCell("Description", boldFont));
        table.addHeaderCell(createHeaderCell("Amount (AED)", boldFont).setTextAlignment(TextAlignment.RIGHT));

        // Base Rent
        table.addCell(createBodyCell("Base Rent", regularFont));
        table.addCell(createBodyCell(formatCurrency(invoice.getBaseRent()), regularFont)
                .setTextAlignment(TextAlignment.RIGHT));

        // Service Charges
        if (invoice.getServiceCharges() != null && invoice.getServiceCharges().compareTo(BigDecimal.ZERO) > 0) {
            table.addCell(createBodyCell("Service Charges", regularFont));
            table.addCell(createBodyCell(formatCurrency(invoice.getServiceCharges()), regularFont)
                    .setTextAlignment(TextAlignment.RIGHT));
        }

        // Parking Fees
        if (invoice.getParkingFees() != null && invoice.getParkingFees().compareTo(BigDecimal.ZERO) > 0) {
            table.addCell(createBodyCell("Parking Fees", regularFont));
            table.addCell(createBodyCell(formatCurrency(invoice.getParkingFees()), regularFont)
                    .setTextAlignment(TextAlignment.RIGHT));
        }

        // Additional Charges
        if (invoice.getAdditionalCharges() != null && !invoice.getAdditionalCharges().isEmpty()) {
            for (Invoice.AdditionalCharge charge : invoice.getAdditionalCharges()) {
                table.addCell(createBodyCell(charge.getDescription(), regularFont));
                table.addCell(createBodyCell(formatCurrency(charge.getAmount()), regularFont)
                        .setTextAlignment(TextAlignment.RIGHT));
            }
        }

        // Late Fee
        if (Boolean.TRUE.equals(invoice.getLateFeeApplied())) {
            table.addCell(createBodyCell("Late Fee", regularFont)
                    .setFontColor(ColorConstants.RED));
            table.addCell(createBodyCell("Applied", regularFont)
                    .setTextAlignment(TextAlignment.RIGHT)
                    .setFontColor(ColorConstants.RED));
        }

        document.add(table);

        // Totals section
        document.add(new Paragraph("\n"));

        Table totalsTable = new Table(UnitValue.createPercentArray(new float[]{3, 1}))
                .setWidth(UnitValue.createPercentValue(100));

        // Total Amount
        totalsTable.addCell(createBodyCell("Total Amount", boldFont)
                .setTextAlignment(TextAlignment.RIGHT)
                .setBorder(Border.NO_BORDER));
        totalsTable.addCell(createBodyCell(formatCurrency(invoice.getTotalAmount()), boldFont)
                .setTextAlignment(TextAlignment.RIGHT)
                .setBorder(Border.NO_BORDER));

        // Paid Amount
        totalsTable.addCell(createBodyCell("Paid Amount", regularFont)
                .setTextAlignment(TextAlignment.RIGHT)
                .setFontColor(new DeviceRgb(22, 163, 74))
                .setBorder(Border.NO_BORDER));
        totalsTable.addCell(createBodyCell(formatCurrency(invoice.getPaidAmount()), regularFont)
                .setTextAlignment(TextAlignment.RIGHT)
                .setFontColor(new DeviceRgb(22, 163, 74))
                .setBorder(Border.NO_BORDER));

        // Balance Due
        totalsTable.addCell(createBodyCell("Balance Due", boldFont)
                .setTextAlignment(TextAlignment.RIGHT)
                .setFontColor(new DeviceRgb(217, 119, 6))
                .setBorder(Border.NO_BORDER));
        totalsTable.addCell(createBodyCell(formatCurrency(invoice.getBalanceAmount()), boldFont)
                .setTextAlignment(TextAlignment.RIGHT)
                .setFontColor(new DeviceRgb(217, 119, 6))
                .setBorder(Border.NO_BORDER));

        document.add(totalsTable);
    }

    private void addPaymentHistory(Document document, List<Payment> payments, PdfFont boldFont, PdfFont regularFont) {
        document.add(new Paragraph("\n"));
        document.add(new Paragraph("Payment History")
                .setFont(boldFont)
                .setFontSize(14)
                .setFontColor(ColorConstants.DARK_GRAY));

        Table table = new Table(UnitValue.createPercentArray(new float[]{2, 2, 2, 2}))
                .setWidth(UnitValue.createPercentValue(100));

        table.addHeaderCell(createHeaderCell("Payment #", boldFont));
        table.addHeaderCell(createHeaderCell("Date", boldFont));
        table.addHeaderCell(createHeaderCell("Method", boldFont));
        table.addHeaderCell(createHeaderCell("Amount", boldFont).setTextAlignment(TextAlignment.RIGHT));

        for (Payment payment : payments) {
            table.addCell(createBodyCell(payment.getPaymentNumber(), regularFont));
            table.addCell(createBodyCell(payment.getPaymentDate().format(DATE_FORMATTER), regularFont));
            table.addCell(createBodyCell(payment.getPaymentMethod().name().replace("_", " "), regularFont));
            table.addCell(createBodyCell(formatCurrency(payment.getAmount()), regularFont)
                    .setTextAlignment(TextAlignment.RIGHT));
        }

        document.add(table);
    }

    private void addInvoiceFooter(Document document, Invoice invoice, PdfFont regularFont) {
        document.add(new Paragraph("\n\n"));

        if (invoice.getNotes() != null && !invoice.getNotes().isEmpty()) {
            document.add(new Paragraph("Notes:")
                    .setFont(regularFont)
                    .setFontSize(10)
                    .setFontColor(ColorConstants.GRAY));
            document.add(new Paragraph(invoice.getNotes())
                    .setFont(regularFont)
                    .setFontSize(10));
        }

        document.add(new Paragraph("\n"));
        document.add(new Paragraph("Thank you for your payment.")
                .setFont(regularFont)
                .setFontSize(10)
                .setFontColor(ColorConstants.GRAY)
                .setTextAlignment(TextAlignment.CENTER));

        document.add(new Paragraph("For any questions, please contact your property manager.")
                .setFont(regularFont)
                .setFontSize(9)
                .setFontColor(ColorConstants.GRAY)
                .setTextAlignment(TextAlignment.CENTER));
    }

    // ============================================================
    // RECEIPT PDF HELPERS
    // ============================================================

    private void addReceiptHeader(Document document, Payment payment, PdfFont boldFont, PdfFont regularFont) {
        Paragraph companyName = new Paragraph("Ultra BMS")
                .setFont(boldFont)
                .setFontSize(24)
                .setFontColor(PRIMARY_COLOR);
        document.add(companyName);

        document.add(new Paragraph("\n"));

        Paragraph receiptTitle = new Paragraph("PAYMENT RECEIPT")
                .setFont(boldFont)
                .setFontSize(20)
                .setFontColor(ColorConstants.DARK_GRAY)
                .setTextAlignment(TextAlignment.CENTER);
        document.add(receiptTitle);

        Paragraph receiptNumber = new Paragraph("Receipt #: " + payment.getPaymentNumber())
                .setFont(boldFont)
                .setFontSize(12)
                .setTextAlignment(TextAlignment.CENTER);
        document.add(receiptNumber);

        Paragraph receiptDate = new Paragraph("Date: " + payment.getPaymentDate().format(DATE_FORMATTER))
                .setFont(regularFont)
                .setFontSize(10)
                .setTextAlignment(TextAlignment.CENTER);
        document.add(receiptDate);

        document.add(new Paragraph("\n"));
    }

    private void addReceiptTenantInfo(Document document, Tenant tenant, Invoice invoice, PdfFont boldFont, PdfFont regularFont) {
        Table infoTable = new Table(UnitValue.createPercentArray(new float[]{1, 1}))
                .setWidth(UnitValue.createPercentValue(100));

        Cell tenantCell = new Cell()
                .setBorder(Border.NO_BORDER)
                .setBackgroundColor(HEADER_BG)
                .setPadding(10);

        tenantCell.add(new Paragraph("RECEIVED FROM")
                .setFont(boldFont)
                .setFontSize(10)
                .setFontColor(ColorConstants.GRAY));
        tenantCell.add(new Paragraph(tenant.getFirstName() + " " + tenant.getLastName())
                .setFont(boldFont)
                .setFontSize(12));
        tenantCell.add(new Paragraph("Tenant #: " + tenant.getTenantNumber())
                .setFont(regularFont)
                .setFontSize(10));

        infoTable.addCell(tenantCell);

        Cell invoiceCell = new Cell()
                .setBorder(Border.NO_BORDER)
                .setBackgroundColor(HEADER_BG)
                .setPadding(10);

        invoiceCell.add(new Paragraph("FOR INVOICE")
                .setFont(boldFont)
                .setFontSize(10)
                .setFontColor(ColorConstants.GRAY));
        invoiceCell.add(new Paragraph(invoice.getInvoiceNumber())
                .setFont(boldFont)
                .setFontSize(12));
        invoiceCell.add(new Paragraph("Invoice Date: " + invoice.getInvoiceDate().format(DATE_FORMATTER))
                .setFont(regularFont)
                .setFontSize(10));

        infoTable.addCell(invoiceCell);
        document.add(infoTable);

        document.add(new Paragraph("\n"));
    }

    private void addPaymentDetails(Document document, Payment payment, Invoice invoice, PdfFont boldFont, PdfFont regularFont) {
        Table table = new Table(UnitValue.createPercentArray(new float[]{2, 3}))
                .setWidth(UnitValue.createPercentValue(100));

        // Payment Amount
        table.addCell(createBodyCell("Payment Amount", boldFont)
                .setBackgroundColor(HEADER_BG));
        table.addCell(createBodyCell(formatCurrency(payment.getAmount()), boldFont)
                .setFontSize(16)
                .setFontColor(new DeviceRgb(22, 163, 74)));

        // Payment Method
        table.addCell(createBodyCell("Payment Method", regularFont));
        table.addCell(createBodyCell(payment.getPaymentMethod().name().replace("_", " "), regularFont));

        // Payment Date
        table.addCell(createBodyCell("Payment Date", regularFont));
        table.addCell(createBodyCell(payment.getPaymentDate().format(DATE_FORMATTER), regularFont));

        // Transaction Reference
        if (payment.getTransactionReference() != null && !payment.getTransactionReference().isEmpty()) {
            table.addCell(createBodyCell("Transaction Reference", regularFont));
            table.addCell(createBodyCell(payment.getTransactionReference(), regularFont));
        }

        // Invoice Balance After Payment
        BigDecimal balanceAfterPayment = invoice.getBalanceAmount();
        table.addCell(createBodyCell("Invoice Balance", regularFont));
        table.addCell(createBodyCell(formatCurrency(balanceAfterPayment), regularFont)
                .setFontColor(balanceAfterPayment.compareTo(BigDecimal.ZERO) > 0
                        ? new DeviceRgb(217, 119, 6)
                        : new DeviceRgb(22, 163, 74)));

        document.add(table);

        // Notes
        if (payment.getNotes() != null && !payment.getNotes().isEmpty()) {
            document.add(new Paragraph("\n"));
            document.add(new Paragraph("Notes: " + payment.getNotes())
                    .setFont(regularFont)
                    .setFontSize(10)
                    .setFontColor(ColorConstants.GRAY));
        }
    }

    private void addReceiptFooter(Document document, PdfFont regularFont) {
        document.add(new Paragraph("\n\n"));

        document.add(new Paragraph("This is a computer-generated receipt and does not require a signature.")
                .setFont(regularFont)
                .setFontSize(9)
                .setFontColor(ColorConstants.GRAY)
                .setTextAlignment(TextAlignment.CENTER));

        document.add(new Paragraph("Thank you for your payment.")
                .setFont(regularFont)
                .setFontSize(10)
                .setFontColor(ColorConstants.GRAY)
                .setTextAlignment(TextAlignment.CENTER));
    }

    // ============================================================
    // EXPENSE PAYMENT SUMMARY PDF
    // ============================================================

    @Override
    public byte[] generateExpensePaymentSummaryPdf(List<ExpenseResponseDto> expenses) {
        LOGGER.info("Generating expense payment summary PDF for {} expenses", expenses.size());

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf);

            PdfFont boldFont = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);
            PdfFont regularFont = PdfFontFactory.createFont(StandardFonts.HELVETICA);

            // Header
            addExpenseSummaryHeader(document, boldFont, regularFont);

            // Summary table
            addExpenseSummaryTable(document, expenses, boldFont, regularFont);

            // Totals
            addExpenseSummaryTotals(document, expenses, boldFont);

            // Footer
            addExpenseSummaryFooter(document, regularFont);

            document.close();

            LOGGER.info("Successfully generated expense payment summary PDF");
            return baos.toByteArray();

        } catch (Exception e) {
            LOGGER.error("Failed to generate expense payment summary PDF: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to generate expense payment summary PDF", e);
        }
    }

    private void addExpenseSummaryHeader(Document document, PdfFont boldFont, PdfFont regularFont) {
        Paragraph companyName = new Paragraph("Ultra BMS")
                .setFont(boldFont)
                .setFontSize(24)
                .setFontColor(PRIMARY_COLOR);
        document.add(companyName);

        Paragraph subtitle = new Paragraph("Property Management System")
                .setFont(regularFont)
                .setFontSize(10)
                .setFontColor(ColorConstants.GRAY);
        document.add(subtitle);

        document.add(new Paragraph("\n"));

        Paragraph title = new Paragraph("EXPENSE PAYMENT SUMMARY")
                .setFont(boldFont)
                .setFontSize(20)
                .setFontColor(ColorConstants.DARK_GRAY)
                .setTextAlignment(TextAlignment.CENTER);
        document.add(title);

        Paragraph date = new Paragraph("Generated: " + java.time.LocalDate.now().format(DATE_FORMATTER))
                .setFont(regularFont)
                .setFontSize(10)
                .setTextAlignment(TextAlignment.CENTER);
        document.add(date);

        document.add(new Paragraph("\n"));
    }

    private void addExpenseSummaryTable(Document document, List<ExpenseResponseDto> expenses, PdfFont boldFont, PdfFont regularFont) {
        Table table = new Table(UnitValue.createPercentArray(new float[]{1.5f, 1.5f, 2, 1.5f, 1.5f, 1}))
                .setWidth(UnitValue.createPercentValue(100));

        // Headers
        table.addHeaderCell(createHeaderCell("Expense #", boldFont));
        table.addHeaderCell(createHeaderCell("Category", boldFont));
        table.addHeaderCell(createHeaderCell("Vendor", boldFont));
        table.addHeaderCell(createHeaderCell("Expense Date", boldFont));
        table.addHeaderCell(createHeaderCell("Payment Date", boldFont));
        table.addHeaderCell(createHeaderCell("Amount", boldFont).setTextAlignment(TextAlignment.RIGHT));

        // Data rows
        for (ExpenseResponseDto expense : expenses) {
            table.addCell(createBodyCell(expense.expenseNumber(), regularFont));
            table.addCell(createBodyCell(expense.categoryDisplayName() != null ? expense.categoryDisplayName() : "", regularFont));
            table.addCell(createBodyCell(expense.vendorCompanyName() != null ? expense.vendorCompanyName() : "-", regularFont));
            table.addCell(createBodyCell(expense.expenseDate() != null ? expense.expenseDate().format(DATE_FORMATTER) : "", regularFont));
            table.addCell(createBodyCell(expense.paymentDate() != null ? expense.paymentDate().format(DATE_FORMATTER) : "", regularFont));
            table.addCell(createBodyCell(formatCurrency(expense.amount()), regularFont)
                    .setTextAlignment(TextAlignment.RIGHT));
        }

        document.add(table);
    }

    private void addExpenseSummaryTotals(Document document, List<ExpenseResponseDto> expenses, PdfFont boldFont) {
        BigDecimal total = expenses.stream()
                .map(ExpenseResponseDto::amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        document.add(new Paragraph("\n"));

        Table totalsTable = new Table(UnitValue.createPercentArray(new float[]{4, 1}))
                .setWidth(UnitValue.createPercentValue(100));

        totalsTable.addCell(new Cell()
                .add(new Paragraph("Total Expenses: " + expenses.size()))
                .setFont(boldFont)
                .setFontSize(12)
                .setBorder(Border.NO_BORDER)
                .setTextAlignment(TextAlignment.RIGHT));

        totalsTable.addCell(new Cell()
                .add(new Paragraph(formatCurrency(total)))
                .setFont(boldFont)
                .setFontSize(14)
                .setFontColor(PRIMARY_COLOR)
                .setBorder(Border.NO_BORDER)
                .setTextAlignment(TextAlignment.RIGHT));

        document.add(totalsTable);
    }

    private void addExpenseSummaryFooter(Document document, PdfFont regularFont) {
        document.add(new Paragraph("\n\n"));

        document.add(new Paragraph("This is a computer-generated document.")
                .setFont(regularFont)
                .setFontSize(9)
                .setFontColor(ColorConstants.GRAY)
                .setTextAlignment(TextAlignment.CENTER));
    }

    // ============================================================
    // CHECKOUT PDF METHODS - Story 3.7
    // ============================================================

    @Override
    public byte[] generateInspectionReportPdf(CheckoutResponse checkout) {
        LOGGER.info("Generating inspection report PDF for checkout: {}", checkout.getCheckoutNumber());

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf);

            PdfFont boldFont = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);
            PdfFont regularFont = PdfFontFactory.createFont(StandardFonts.HELVETICA);

            // Header
            addInspectionReportHeader(document, checkout, boldFont, regularFont);

            // Property and tenant info
            addInspectionPropertyInfo(document, checkout, boldFont, regularFont);

            // Inspection summary
            addInspectionSummary(document, checkout, boldFont, regularFont);

            // Inspection checklist details
            if (checkout.getInspectionChecklist() != null && !checkout.getInspectionChecklist().isEmpty()) {
                addInspectionChecklist(document, checkout, boldFont, regularFont);
            }

            // Photos summary
            if (checkout.getInspectionPhotos() != null && !checkout.getInspectionPhotos().isEmpty()) {
                addInspectionPhotosSection(document, checkout, boldFont, regularFont);
            }

            // Footer with signatures
            addInspectionReportFooter(document, checkout, regularFont);

            document.close();

            LOGGER.info("Successfully generated inspection report PDF for checkout: {}", checkout.getCheckoutNumber());
            return baos.toByteArray();

        } catch (Exception e) {
            LOGGER.error("Failed to generate inspection report PDF: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to generate inspection report PDF", e);
        }
    }

    @Override
    public byte[] generateDepositStatementPdf(CheckoutResponse checkout, DepositRefundDto depositRefund) {
        LOGGER.info("Generating deposit statement PDF for checkout: {}", checkout.getCheckoutNumber());

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf);

            PdfFont boldFont = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);
            PdfFont regularFont = PdfFontFactory.createFont(StandardFonts.HELVETICA);

            // Header
            addDepositStatementHeader(document, checkout, boldFont, regularFont);

            // Tenant and property info
            addDepositTenantInfo(document, checkout, boldFont, regularFont);

            // Original deposit
            addOriginalDepositSection(document, checkout, depositRefund, boldFont, regularFont);

            // Deductions breakdown
            if (depositRefund.getDeductions() != null && !depositRefund.getDeductions().isEmpty()) {
                addDeductionsTable(document, depositRefund, boldFont, regularFont);
            }

            // Net refund calculation
            addNetRefundSection(document, depositRefund, boldFont, regularFont);

            // Footer
            addDepositStatementFooter(document, regularFont);

            document.close();

            LOGGER.info("Successfully generated deposit statement PDF for checkout: {}", checkout.getCheckoutNumber());
            return baos.toByteArray();

        } catch (Exception e) {
            LOGGER.error("Failed to generate deposit statement PDF: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to generate deposit statement PDF", e);
        }
    }

    @Override
    public byte[] generateRefundReceiptPdf(CheckoutResponse checkout, DepositRefundDto depositRefund) {
        LOGGER.info("Generating refund receipt PDF for checkout: {}", checkout.getCheckoutNumber());

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf);

            PdfFont boldFont = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);
            PdfFont regularFont = PdfFontFactory.createFont(StandardFonts.HELVETICA);

            // Header
            addRefundReceiptHeader(document, depositRefund, boldFont, regularFont);

            // Recipient info
            addRefundRecipientInfo(document, checkout, boldFont, regularFont);

            // Refund details
            addRefundDetails(document, depositRefund, boldFont, regularFont);

            // Payment method details
            addRefundPaymentMethodDetails(document, depositRefund, boldFont, regularFont);

            // Footer
            addRefundReceiptFooter(document, regularFont);

            document.close();

            LOGGER.info("Successfully generated refund receipt PDF for checkout: {}", checkout.getCheckoutNumber());
            return baos.toByteArray();

        } catch (Exception e) {
            LOGGER.error("Failed to generate refund receipt PDF: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to generate refund receipt PDF", e);
        }
    }

    // ============================================================
    // INSPECTION REPORT HELPERS
    // ============================================================

    private void addInspectionReportHeader(Document document, CheckoutResponse checkout, PdfFont boldFont, PdfFont regularFont) {
        Paragraph companyName = new Paragraph("Ultra BMS")
                .setFont(boldFont)
                .setFontSize(24)
                .setFontColor(PRIMARY_COLOR);
        document.add(companyName);

        Paragraph subtitle = new Paragraph("Property Management System")
                .setFont(regularFont)
                .setFontSize(10)
                .setFontColor(ColorConstants.GRAY);
        document.add(subtitle);

        document.add(new Paragraph("\n"));

        Paragraph title = new Paragraph("UNIT INSPECTION REPORT")
                .setFont(boldFont)
                .setFontSize(20)
                .setFontColor(ColorConstants.DARK_GRAY)
                .setTextAlignment(TextAlignment.CENTER);
        document.add(title);

        Table headerTable = new Table(UnitValue.createPercentArray(new float[]{1, 1}))
                .setWidth(UnitValue.createPercentValue(100));

        Cell leftCell = new Cell().setBorder(Border.NO_BORDER);
        leftCell.add(new Paragraph("Checkout #: " + checkout.getCheckoutNumber())
                .setFont(boldFont).setFontSize(11));

        Cell rightCell = new Cell().setBorder(Border.NO_BORDER).setTextAlignment(TextAlignment.RIGHT);
        rightCell.add(new Paragraph("Inspection Date: " +
                (checkout.getInspectionDate() != null ? checkout.getInspectionDate().format(DATE_FORMATTER) : "Pending"))
                .setFont(regularFont).setFontSize(10));

        headerTable.addCell(leftCell);
        headerTable.addCell(rightCell);
        document.add(headerTable);

        document.add(new Paragraph("\n"));
    }

    private void addInspectionPropertyInfo(Document document, CheckoutResponse checkout, PdfFont boldFont, PdfFont regularFont) {
        Table infoTable = new Table(UnitValue.createPercentArray(new float[]{1, 1}))
                .setWidth(UnitValue.createPercentValue(100));

        // Tenant info
        Cell tenantCell = new Cell().setBorder(Border.NO_BORDER).setBackgroundColor(HEADER_BG).setPadding(10);
        tenantCell.add(new Paragraph("TENANT").setFont(boldFont).setFontSize(10).setFontColor(ColorConstants.GRAY));
        tenantCell.add(new Paragraph(checkout.getTenantName()).setFont(boldFont).setFontSize(12));
        tenantCell.add(new Paragraph("Tenant #: " + checkout.getTenantNumber()).setFont(regularFont).setFontSize(10));
        tenantCell.add(new Paragraph("Email: " + (checkout.getTenantEmail() != null ? checkout.getTenantEmail() : "N/A"))
                .setFont(regularFont).setFontSize(10));
        infoTable.addCell(tenantCell);

        // Property info
        Cell propertyCell = new Cell().setBorder(Border.NO_BORDER).setBackgroundColor(HEADER_BG).setPadding(10);
        propertyCell.add(new Paragraph("PROPERTY").setFont(boldFont).setFontSize(10).setFontColor(ColorConstants.GRAY));
        propertyCell.add(new Paragraph(checkout.getPropertyName()).setFont(boldFont).setFontSize(12));
        propertyCell.add(new Paragraph("Unit: " + checkout.getUnitNumber()).setFont(regularFont).setFontSize(10));
        propertyCell.add(new Paragraph("Checkout Date: " +
                (checkout.getCheckoutDate() != null ? checkout.getCheckoutDate().format(DATE_FORMATTER) : "Pending"))
                .setFont(regularFont).setFontSize(10));
        infoTable.addCell(propertyCell);

        document.add(infoTable);
        document.add(new Paragraph("\n"));
    }

    private void addInspectionSummary(Document document, CheckoutResponse checkout, PdfFont boldFont, PdfFont regularFont) {
        document.add(new Paragraph("Inspection Summary")
                .setFont(boldFont).setFontSize(14).setFontColor(ColorConstants.DARK_GRAY));

        Table summaryTable = new Table(UnitValue.createPercentArray(new float[]{1, 1, 1, 1}))
                .setWidth(UnitValue.createPercentValue(100));

        // Status
        summaryTable.addCell(createSummaryCell("Status", checkout.getStatus().name().replace("_", " "), boldFont, regularFont));

        // Inspection completed
        summaryTable.addCell(createSummaryCell("Inspection",
                checkout.getInspectionDate() != null ? "Completed" : "Pending", boldFont, regularFont));

        // Damages found
        int damagesCount = 0;
        if (checkout.getInspectionChecklist() != null) {
            for (Object section : checkout.getInspectionChecklist()) {
                if (section instanceof java.util.Map) {
                    @SuppressWarnings("unchecked")
                    java.util.Map<String, Object> sectionMap = (java.util.Map<String, Object>) section;
                    Object items = sectionMap.get("items");
                    if (items instanceof java.util.List) {
                        for (Object item : (java.util.List<?>) items) {
                            if (item instanceof java.util.Map) {
                                @SuppressWarnings("unchecked")
                                java.util.Map<String, Object> itemMap = (java.util.Map<String, Object>) item;
                                String condition = (String) itemMap.get("condition");
                                if ("DAMAGED".equals(condition) || "NEEDS_REPAIR".equals(condition)) {
                                    damagesCount++;
                                }
                            }
                        }
                    }
                }
            }
        }
        summaryTable.addCell(createSummaryCell("Issues Found", String.valueOf(damagesCount), boldFont, regularFont));

        // Photos count
        int photosCount = checkout.getInspectionPhotos() != null ? checkout.getInspectionPhotos().size() : 0;
        summaryTable.addCell(createSummaryCell("Photos", String.valueOf(photosCount), boldFont, regularFont));

        document.add(summaryTable);
        document.add(new Paragraph("\n"));
    }

    private Cell createSummaryCell(String label, String value, PdfFont boldFont, PdfFont regularFont) {
        Cell cell = new Cell().setPadding(8).setBackgroundColor(HEADER_BG);
        cell.add(new Paragraph(label).setFont(regularFont).setFontSize(9).setFontColor(ColorConstants.GRAY));
        cell.add(new Paragraph(value).setFont(boldFont).setFontSize(12));
        return cell;
    }

    private void addInspectionChecklist(Document document, CheckoutResponse checkout, PdfFont boldFont, PdfFont regularFont) {
        document.add(new Paragraph("Inspection Checklist")
                .setFont(boldFont).setFontSize(14).setFontColor(ColorConstants.DARK_GRAY));

        if (checkout.getInspectionChecklist() == null) {
            document.add(new Paragraph("No inspection data available.")
                    .setFont(regularFont).setFontSize(10).setFontColor(ColorConstants.GRAY));
            return;
        }

        for (Object section : checkout.getInspectionChecklist()) {
            if (section instanceof java.util.Map) {
                @SuppressWarnings("unchecked")
                java.util.Map<String, Object> sectionMap = (java.util.Map<String, Object>) section;
                String sectionName = (String) sectionMap.get("name");

                document.add(new Paragraph(sectionName != null ? sectionName : "Section")
                        .setFont(boldFont).setFontSize(11).setFontColor(PRIMARY_COLOR).setMarginTop(10));

                Table itemsTable = new Table(UnitValue.createPercentArray(new float[]{3, 1.5f, 3}))
                        .setWidth(UnitValue.createPercentValue(100));

                itemsTable.addHeaderCell(createHeaderCell("Item", boldFont));
                itemsTable.addHeaderCell(createHeaderCell("Condition", boldFont));
                itemsTable.addHeaderCell(createHeaderCell("Notes", boldFont));

                Object items = sectionMap.get("items");
                if (items instanceof java.util.List) {
                    for (Object item : (java.util.List<?>) items) {
                        if (item instanceof java.util.Map) {
                            @SuppressWarnings("unchecked")
                            java.util.Map<String, Object> itemMap = (java.util.Map<String, Object>) item;
                            String itemName = (String) itemMap.get("name");
                            String condition = (String) itemMap.get("condition");
                            String notes = (String) itemMap.get("notes");

                            itemsTable.addCell(createBodyCell(itemName != null ? itemName : "", regularFont));

                            Cell conditionCell = createBodyCell(formatCondition(condition), regularFont);
                            conditionCell.setFontColor(getConditionColor(condition));
                            itemsTable.addCell(conditionCell);

                            itemsTable.addCell(createBodyCell(notes != null ? notes : "-", regularFont));
                        }
                    }
                }

                document.add(itemsTable);
            }
        }
        document.add(new Paragraph("\n"));
    }

    private void addInspectionPhotosSection(Document document, CheckoutResponse checkout, PdfFont boldFont, PdfFont regularFont) {
        document.add(new Paragraph("Inspection Photos")
                .setFont(boldFont).setFontSize(14).setFontColor(ColorConstants.DARK_GRAY));

        Table photosTable = new Table(UnitValue.createPercentArray(new float[]{2, 2, 2, 2}))
                .setWidth(UnitValue.createPercentValue(100));

        photosTable.addHeaderCell(createHeaderCell("Photo ID", boldFont));
        photosTable.addHeaderCell(createHeaderCell("Section", boldFont));
        photosTable.addHeaderCell(createHeaderCell("Type", boldFont));
        photosTable.addHeaderCell(createHeaderCell("Uploaded", boldFont));

        if (checkout.getInspectionPhotos() != null) {
            for (Object photo : checkout.getInspectionPhotos()) {
                if (photo instanceof java.util.Map) {
                    @SuppressWarnings("unchecked")
                    java.util.Map<String, Object> photoMap = (java.util.Map<String, Object>) photo;

                    String photoId = (String) photoMap.get("id");
                    String section = (String) photoMap.get("section");
                    String type = (String) photoMap.get("type");
                    String uploadedAt = photoMap.get("uploadedAt") != null ? photoMap.get("uploadedAt").toString() : "";

                    photosTable.addCell(createBodyCell(photoId != null ? photoId.substring(0, Math.min(8, photoId.length())) + "..." : "", regularFont));
                    photosTable.addCell(createBodyCell(section != null ? section : "", regularFont));
                    photosTable.addCell(createBodyCell(type != null ? type : "", regularFont));
                    photosTable.addCell(createBodyCell(uploadedAt, regularFont));
                }
            }
        }

        document.add(photosTable);
        document.add(new Paragraph("\n"));
    }

    private void addInspectionReportFooter(Document document, CheckoutResponse checkout, PdfFont regularFont) {
        document.add(new Paragraph("\n"));

        // Inspector signature section
        Table signatureTable = new Table(UnitValue.createPercentArray(new float[]{1, 1}))
                .setWidth(UnitValue.createPercentValue(100));

        Cell inspectorCell = new Cell().setBorder(Border.NO_BORDER).setPadding(10);
        inspectorCell.add(new Paragraph("Inspector Signature").setFont(regularFont).setFontSize(10));
        inspectorCell.add(new Paragraph("\n\n_________________________").setFont(regularFont).setFontSize(10));
        inspectorCell.add(new Paragraph("Name: " + (checkout.getInspectorName() != null ? checkout.getInspectorName() : "_____________"))
                .setFont(regularFont).setFontSize(10));
        inspectorCell.add(new Paragraph("Date: " + (checkout.getInspectionDate() != null ? checkout.getInspectionDate().format(DATE_FORMATTER) : "_____________"))
                .setFont(regularFont).setFontSize(10));
        signatureTable.addCell(inspectorCell);

        Cell tenantCell = new Cell().setBorder(Border.NO_BORDER).setPadding(10);
        tenantCell.add(new Paragraph("Tenant Acknowledgment").setFont(regularFont).setFontSize(10));
        tenantCell.add(new Paragraph("\n\n_________________________").setFont(regularFont).setFontSize(10));
        tenantCell.add(new Paragraph("Name: " + checkout.getTenantName()).setFont(regularFont).setFontSize(10));
        tenantCell.add(new Paragraph("Date: _____________").setFont(regularFont).setFontSize(10));
        signatureTable.addCell(tenantCell);

        document.add(signatureTable);

        document.add(new Paragraph("\n"));
        document.add(new Paragraph("This inspection report is a legal document. Any disputes must be raised within 7 days of checkout.")
                .setFont(regularFont).setFontSize(9).setFontColor(ColorConstants.GRAY).setTextAlignment(TextAlignment.CENTER));
    }

    // ============================================================
    // DEPOSIT STATEMENT HELPERS
    // ============================================================

    private void addDepositStatementHeader(Document document, CheckoutResponse checkout, PdfFont boldFont, PdfFont regularFont) {
        Paragraph companyName = new Paragraph("Ultra BMS")
                .setFont(boldFont).setFontSize(24).setFontColor(PRIMARY_COLOR);
        document.add(companyName);

        Paragraph subtitle = new Paragraph("Property Management System")
                .setFont(regularFont).setFontSize(10).setFontColor(ColorConstants.GRAY);
        document.add(subtitle);

        document.add(new Paragraph("\n"));

        Paragraph title = new Paragraph("SECURITY DEPOSIT STATEMENT")
                .setFont(boldFont).setFontSize(20).setFontColor(ColorConstants.DARK_GRAY).setTextAlignment(TextAlignment.CENTER);
        document.add(title);

        Paragraph checkoutRef = new Paragraph("Checkout Reference: " + checkout.getCheckoutNumber())
                .setFont(boldFont).setFontSize(11).setTextAlignment(TextAlignment.CENTER);
        document.add(checkoutRef);

        Paragraph date = new Paragraph("Generated: " + java.time.LocalDate.now().format(DATE_FORMATTER))
                .setFont(regularFont).setFontSize(10).setTextAlignment(TextAlignment.CENTER);
        document.add(date);

        document.add(new Paragraph("\n"));
    }

    private void addDepositTenantInfo(Document document, CheckoutResponse checkout, PdfFont boldFont, PdfFont regularFont) {
        Table infoTable = new Table(UnitValue.createPercentArray(new float[]{1, 1}))
                .setWidth(UnitValue.createPercentValue(100));

        Cell tenantCell = new Cell().setBorder(Border.NO_BORDER).setBackgroundColor(HEADER_BG).setPadding(10);
        tenantCell.add(new Paragraph("TENANT DETAILS").setFont(boldFont).setFontSize(10).setFontColor(ColorConstants.GRAY));
        tenantCell.add(new Paragraph(checkout.getTenantName()).setFont(boldFont).setFontSize(12));
        tenantCell.add(new Paragraph("Tenant #: " + checkout.getTenantNumber()).setFont(regularFont).setFontSize(10));
        tenantCell.add(new Paragraph("Email: " + (checkout.getTenantEmail() != null ? checkout.getTenantEmail() : "N/A"))
                .setFont(regularFont).setFontSize(10));
        infoTable.addCell(tenantCell);

        Cell leaseCell = new Cell().setBorder(Border.NO_BORDER).setBackgroundColor(HEADER_BG).setPadding(10);
        leaseCell.add(new Paragraph("LEASE DETAILS").setFont(boldFont).setFontSize(10).setFontColor(ColorConstants.GRAY));
        leaseCell.add(new Paragraph(checkout.getPropertyName() + " - Unit " + checkout.getUnitNumber())
                .setFont(boldFont).setFontSize(12));
        leaseCell.add(new Paragraph("Checkout Date: " +
                (checkout.getCheckoutDate() != null ? checkout.getCheckoutDate().format(DATE_FORMATTER) : "Pending"))
                .setFont(regularFont).setFontSize(10));
        leaseCell.add(new Paragraph("Checkout Reason: " +
                (checkout.getCheckoutReason() != null ? checkout.getCheckoutReason().name().replace("_", " ") : "N/A"))
                .setFont(regularFont).setFontSize(10));
        infoTable.addCell(leaseCell);

        document.add(infoTable);
        document.add(new Paragraph("\n"));
    }

    private void addOriginalDepositSection(Document document, CheckoutResponse checkout, DepositRefundDto depositRefund,
            PdfFont boldFont, PdfFont regularFont) {
        document.add(new Paragraph("Security Deposit Details")
                .setFont(boldFont).setFontSize(14).setFontColor(ColorConstants.DARK_GRAY));

        Table depositTable = new Table(UnitValue.createPercentArray(new float[]{3, 2}))
                .setWidth(UnitValue.createPercentValue(100));

        depositTable.addCell(createBodyCell("Original Security Deposit", boldFont).setBackgroundColor(HEADER_BG));
        depositTable.addCell(createBodyCell(formatCurrency(depositRefund.getOriginalDeposit()), boldFont)
                .setTextAlignment(TextAlignment.RIGHT).setBackgroundColor(HEADER_BG));

        document.add(depositTable);
        document.add(new Paragraph("\n"));
    }

    private void addDeductionsTable(Document document, DepositRefundDto depositRefund, PdfFont boldFont, PdfFont regularFont) {
        document.add(new Paragraph("Deductions")
                .setFont(boldFont).setFontSize(14).setFontColor(ColorConstants.DARK_GRAY));

        Table deductionsTable = new Table(UnitValue.createPercentArray(new float[]{2, 3, 1.5f}))
                .setWidth(UnitValue.createPercentValue(100));

        deductionsTable.addHeaderCell(createHeaderCell("Type", boldFont));
        deductionsTable.addHeaderCell(createHeaderCell("Description", boldFont));
        deductionsTable.addHeaderCell(createHeaderCell("Amount", boldFont).setTextAlignment(TextAlignment.RIGHT));

        for (DepositRefundDto.DeductionDto deduction : depositRefund.getDeductions()) {
            deductionsTable.addCell(createBodyCell(formatDeductionType(deduction.getType()), regularFont));
            deductionsTable.addCell(createBodyCell(
                    deduction.getDescription() != null ? deduction.getDescription() : "-", regularFont));
            deductionsTable.addCell(createBodyCell(formatCurrency(deduction.getAmount()), regularFont)
                    .setTextAlignment(TextAlignment.RIGHT).setFontColor(new DeviceRgb(220, 38, 38)));
        }

        // Total deductions row
        deductionsTable.addCell(new Cell(1, 2).add(new Paragraph("Total Deductions"))
                .setFont(boldFont).setFontSize(10).setPadding(8).setTextAlignment(TextAlignment.RIGHT)
                .setBackgroundColor(HEADER_BG));
        deductionsTable.addCell(createBodyCell(formatCurrency(depositRefund.getTotalDeductions()), boldFont)
                .setTextAlignment(TextAlignment.RIGHT).setFontColor(new DeviceRgb(220, 38, 38))
                .setBackgroundColor(HEADER_BG));

        document.add(deductionsTable);
        document.add(new Paragraph("\n"));
    }

    private void addNetRefundSection(Document document, DepositRefundDto depositRefund, PdfFont boldFont, PdfFont regularFont) {
        Table netRefundTable = new Table(UnitValue.createPercentArray(new float[]{3, 2}))
                .setWidth(UnitValue.createPercentValue(100));

        // Net refund
        if (depositRefund.getNetRefund() != null && depositRefund.getNetRefund().compareTo(java.math.BigDecimal.ZERO) > 0) {
            netRefundTable.addCell(new Cell().add(new Paragraph("NET REFUND AMOUNT"))
                    .setFont(boldFont).setFontSize(14).setPadding(12).setBackgroundColor(new DeviceRgb(220, 252, 231)));
            netRefundTable.addCell(new Cell().add(new Paragraph(formatCurrency(depositRefund.getNetRefund())))
                    .setFont(boldFont).setFontSize(16).setPadding(12).setTextAlignment(TextAlignment.RIGHT)
                    .setFontColor(new DeviceRgb(22, 163, 74)).setBackgroundColor(new DeviceRgb(220, 252, 231)));
        }

        // Amount owed by tenant
        if (depositRefund.getAmountOwedByTenant() != null &&
                depositRefund.getAmountOwedByTenant().compareTo(java.math.BigDecimal.ZERO) > 0) {
            netRefundTable.addCell(new Cell().add(new Paragraph("AMOUNT OWED BY TENANT"))
                    .setFont(boldFont).setFontSize(14).setPadding(12).setBackgroundColor(new DeviceRgb(254, 226, 226)));
            netRefundTable.addCell(new Cell().add(new Paragraph(formatCurrency(depositRefund.getAmountOwedByTenant())))
                    .setFont(boldFont).setFontSize(16).setPadding(12).setTextAlignment(TextAlignment.RIGHT)
                    .setFontColor(new DeviceRgb(220, 38, 38)).setBackgroundColor(new DeviceRgb(254, 226, 226)));
        }

        document.add(netRefundTable);
    }

    private void addDepositStatementFooter(Document document, PdfFont regularFont) {
        document.add(new Paragraph("\n\n"));

        document.add(new Paragraph("This deposit statement is a summary of deductions from the security deposit.")
                .setFont(regularFont).setFontSize(9).setFontColor(ColorConstants.GRAY).setTextAlignment(TextAlignment.CENTER));
        document.add(new Paragraph("Any disputes must be raised within 14 days of statement date.")
                .setFont(regularFont).setFontSize(9).setFontColor(ColorConstants.GRAY).setTextAlignment(TextAlignment.CENTER));
    }

    // ============================================================
    // REFUND RECEIPT HELPERS
    // ============================================================

    private void addRefundReceiptHeader(Document document, DepositRefundDto depositRefund, PdfFont boldFont, PdfFont regularFont) {
        Paragraph companyName = new Paragraph("Ultra BMS")
                .setFont(boldFont).setFontSize(24).setFontColor(PRIMARY_COLOR);
        document.add(companyName);

        Paragraph subtitle = new Paragraph("Property Management System")
                .setFont(regularFont).setFontSize(10).setFontColor(ColorConstants.GRAY);
        document.add(subtitle);

        document.add(new Paragraph("\n"));

        Paragraph title = new Paragraph("DEPOSIT REFUND RECEIPT")
                .setFont(boldFont).setFontSize(20).setFontColor(ColorConstants.DARK_GRAY).setTextAlignment(TextAlignment.CENTER);
        document.add(title);

        Paragraph receiptRef = new Paragraph("Receipt #: " +
                (depositRefund.getRefundReference() != null ? depositRefund.getRefundReference() : depositRefund.getId().toString().substring(0, 8)))
                .setFont(boldFont).setFontSize(11).setTextAlignment(TextAlignment.CENTER);
        document.add(receiptRef);

        Paragraph date = new Paragraph("Date: " +
                (depositRefund.getRefundDate() != null ? depositRefund.getRefundDate().format(DATE_FORMATTER) : java.time.LocalDate.now().format(DATE_FORMATTER)))
                .setFont(regularFont).setFontSize(10).setTextAlignment(TextAlignment.CENTER);
        document.add(date);

        document.add(new Paragraph("\n"));
    }

    private void addRefundRecipientInfo(Document document, CheckoutResponse checkout, PdfFont boldFont, PdfFont regularFont) {
        Table infoTable = new Table(UnitValue.createPercentArray(new float[]{1}))
                .setWidth(UnitValue.createPercentValue(100));

        Cell recipientCell = new Cell().setBorder(Border.NO_BORDER).setBackgroundColor(HEADER_BG).setPadding(10);
        recipientCell.add(new Paragraph("REFUND RECIPIENT").setFont(boldFont).setFontSize(10).setFontColor(ColorConstants.GRAY));
        recipientCell.add(new Paragraph(checkout.getTenantName()).setFont(boldFont).setFontSize(14));
        recipientCell.add(new Paragraph("Tenant #: " + checkout.getTenantNumber()).setFont(regularFont).setFontSize(10));
        recipientCell.add(new Paragraph("Property: " + checkout.getPropertyName() + " - Unit " + checkout.getUnitNumber())
                .setFont(regularFont).setFontSize(10));
        recipientCell.add(new Paragraph("Checkout #: " + checkout.getCheckoutNumber()).setFont(regularFont).setFontSize(10));
        infoTable.addCell(recipientCell);

        document.add(infoTable);
        document.add(new Paragraph("\n"));
    }

    private void addRefundDetails(Document document, DepositRefundDto depositRefund, PdfFont boldFont, PdfFont regularFont) {
        Table detailsTable = new Table(UnitValue.createPercentArray(new float[]{2, 3}))
                .setWidth(UnitValue.createPercentValue(100));

        // Refund amount (highlighted)
        detailsTable.addCell(new Cell().add(new Paragraph("Refund Amount"))
                .setFont(boldFont).setFontSize(12).setPadding(12).setBackgroundColor(new DeviceRgb(220, 252, 231)));
        detailsTable.addCell(new Cell().add(new Paragraph(formatCurrency(depositRefund.getNetRefund())))
                .setFont(boldFont).setFontSize(18).setPadding(12).setTextAlignment(TextAlignment.RIGHT)
                .setFontColor(new DeviceRgb(22, 163, 74)).setBackgroundColor(new DeviceRgb(220, 252, 231)));

        // Original deposit
        detailsTable.addCell(createBodyCell("Original Deposit", regularFont));
        detailsTable.addCell(createBodyCell(formatCurrency(depositRefund.getOriginalDeposit()), regularFont)
                .setTextAlignment(TextAlignment.RIGHT));

        // Total deductions
        detailsTable.addCell(createBodyCell("Total Deductions", regularFont));
        detailsTable.addCell(createBodyCell(formatCurrency(depositRefund.getTotalDeductions()), regularFont)
                .setTextAlignment(TextAlignment.RIGHT).setFontColor(new DeviceRgb(220, 38, 38)));

        // Refund status
        detailsTable.addCell(createBodyCell("Status", regularFont));
        detailsTable.addCell(createBodyCell(
                depositRefund.getRefundStatus() != null ? depositRefund.getRefundStatus().name().replace("_", " ") : "PROCESSED",
                boldFont).setTextAlignment(TextAlignment.RIGHT).setFontColor(new DeviceRgb(22, 163, 74)));

        // Transaction ID
        if (depositRefund.getTransactionId() != null) {
            detailsTable.addCell(createBodyCell("Transaction ID", regularFont));
            detailsTable.addCell(createBodyCell(depositRefund.getTransactionId(), regularFont)
                    .setTextAlignment(TextAlignment.RIGHT));
        }

        document.add(detailsTable);
        document.add(new Paragraph("\n"));
    }

    private void addRefundPaymentMethodDetails(Document document, DepositRefundDto depositRefund, PdfFont boldFont, PdfFont regularFont) {
        document.add(new Paragraph("Payment Details")
                .setFont(boldFont).setFontSize(14).setFontColor(ColorConstants.DARK_GRAY));

        Table paymentTable = new Table(UnitValue.createPercentArray(new float[]{2, 3}))
                .setWidth(UnitValue.createPercentValue(100));

        paymentTable.addCell(createBodyCell("Payment Method", regularFont));
        paymentTable.addCell(createBodyCell(formatRefundMethod(depositRefund.getRefundMethod()), boldFont)
                .setTextAlignment(TextAlignment.RIGHT));

        if (depositRefund.getRefundMethod() == RefundMethod.BANK_TRANSFER) {
            if (depositRefund.getBankName() != null) {
                paymentTable.addCell(createBodyCell("Bank Name", regularFont));
                paymentTable.addCell(createBodyCell(depositRefund.getBankName(), regularFont)
                        .setTextAlignment(TextAlignment.RIGHT));
            }
            if (depositRefund.getAccountHolderName() != null) {
                paymentTable.addCell(createBodyCell("Account Holder", regularFont));
                paymentTable.addCell(createBodyCell(depositRefund.getAccountHolderName(), regularFont)
                        .setTextAlignment(TextAlignment.RIGHT));
            }
            if (depositRefund.getMaskedIban() != null) {
                paymentTable.addCell(createBodyCell("IBAN", regularFont));
                paymentTable.addCell(createBodyCell(depositRefund.getMaskedIban(), regularFont)
                        .setTextAlignment(TextAlignment.RIGHT));
            }
        } else if (depositRefund.getRefundMethod() == RefundMethod.CHEQUE) {
            if (depositRefund.getChequeNumber() != null) {
                paymentTable.addCell(createBodyCell("Cheque Number", regularFont));
                paymentTable.addCell(createBodyCell(depositRefund.getChequeNumber(), regularFont)
                        .setTextAlignment(TextAlignment.RIGHT));
            }
            if (depositRefund.getChequeDate() != null) {
                paymentTable.addCell(createBodyCell("Cheque Date", regularFont));
                paymentTable.addCell(createBodyCell(depositRefund.getChequeDate().format(DATE_FORMATTER), regularFont)
                        .setTextAlignment(TextAlignment.RIGHT));
            }
        }

        // Processed date
        if (depositRefund.getProcessedAt() != null) {
            paymentTable.addCell(createBodyCell("Processed On", regularFont));
            paymentTable.addCell(createBodyCell(depositRefund.getProcessedAt().toLocalDate().format(DATE_FORMATTER), regularFont)
                    .setTextAlignment(TextAlignment.RIGHT));
        }

        document.add(paymentTable);
    }

    private void addRefundReceiptFooter(Document document, PdfFont regularFont) {
        document.add(new Paragraph("\n\n"));

        document.add(new Paragraph("This is an official receipt for the security deposit refund.")
                .setFont(regularFont).setFontSize(9).setFontColor(ColorConstants.GRAY).setTextAlignment(TextAlignment.CENTER));
        document.add(new Paragraph("Please retain this receipt for your records.")
                .setFont(regularFont).setFontSize(9).setFontColor(ColorConstants.GRAY).setTextAlignment(TextAlignment.CENTER));
        document.add(new Paragraph("\n"));
        document.add(new Paragraph("Thank you for being our tenant.")
                .setFont(regularFont).setFontSize(10).setFontColor(ColorConstants.GRAY).setTextAlignment(TextAlignment.CENTER));
    }

    // ============================================================
    // CHECKOUT PDF HELPER METHODS
    // ============================================================

    private String formatCondition(String condition) {
        if (condition == null) return "N/A";
        try {
            ItemCondition itemCondition = ItemCondition.valueOf(condition);
            return switch (itemCondition) {
                case GOOD -> "Good";
                case FAIR -> "Fair";
                case NEEDS_REPAIR -> "Needs Repair";
                case DAMAGED -> "Damaged";
                case MISSING -> "Missing";
                case NOT_APPLICABLE -> "N/A";
            };
        } catch (IllegalArgumentException e) {
            return condition.replace("_", " ");
        }
    }

    private DeviceRgb getConditionColor(String condition) {
        if (condition == null) return new DeviceRgb(107, 114, 128);
        try {
            ItemCondition itemCondition = ItemCondition.valueOf(condition);
            return switch (itemCondition) {
                case GOOD -> new DeviceRgb(22, 163, 74); // Green
                case FAIR -> new DeviceRgb(217, 119, 6); // Amber
                case NEEDS_REPAIR -> new DeviceRgb(234, 88, 12); // Orange
                case DAMAGED -> new DeviceRgb(220, 38, 38); // Red
                case MISSING -> new DeviceRgb(127, 29, 29); // Dark red
                case NOT_APPLICABLE -> new DeviceRgb(107, 114, 128); // Gray
            };
        } catch (IllegalArgumentException e) {
            return new DeviceRgb(107, 114, 128);
        }
    }

    private String formatDeductionType(DeductionType type) {
        if (type == null) return "Other";
        return switch (type) {
            case UNPAID_RENT -> "Unpaid Rent";
            case UNPAID_UTILITIES -> "Unpaid Utilities";
            case DAMAGE_REPAIRS -> "Damage Repairs";
            case CLEANING_FEE -> "Cleaning Fee";
            case KEY_REPLACEMENT -> "Key Replacement";
            case EARLY_TERMINATION_PENALTY -> "Early Termination Penalty";
            case OTHER -> "Other";
        };
    }

    private String formatRefundMethod(RefundMethod method) {
        if (method == null) return "N/A";
        return switch (method) {
            case BANK_TRANSFER -> "Bank Transfer";
            case CHEQUE -> "Cheque";
            case CASH -> "Cash";
        };
    }

    // ============================================================
    // HELPER METHODS
    // ============================================================

    private Cell createHeaderCell(String text, PdfFont font) {
        return new Cell()
                .add(new Paragraph(text))
                .setFont(font)
                .setFontSize(10)
                .setBackgroundColor(PRIMARY_COLOR)
                .setFontColor(ColorConstants.WHITE)
                .setPadding(8);
    }

    private Cell createBodyCell(String text, PdfFont font) {
        return new Cell()
                .add(new Paragraph(text))
                .setFont(font)
                .setFontSize(10)
                .setPadding(8);
    }

    private String formatCurrency(BigDecimal amount) {
        if (amount == null) {
            return "AED 0.00";
        }
        return "AED " + String.format("%,.2f", amount);
    }

    private String getStatusLabel(InvoiceStatus status) {
        return switch (status) {
            case DRAFT -> "Draft";
            case SENT -> "Sent";
            case PARTIALLY_PAID -> "Partially Paid";
            case PAID -> "Paid";
            case OVERDUE -> "Overdue";
            case CANCELLED -> "Cancelled";
        };
    }

    private DeviceRgb getStatusColor(InvoiceStatus status) {
        return switch (status) {
            case DRAFT -> new DeviceRgb(107, 114, 128); // Gray
            case SENT -> new DeviceRgb(37, 99, 235); // Blue
            case PARTIALLY_PAID -> new DeviceRgb(217, 119, 6); // Amber
            case PAID -> new DeviceRgb(22, 163, 74); // Green
            case OVERDUE -> new DeviceRgb(220, 38, 38); // Red
            case CANCELLED -> new DeviceRgb(107, 114, 128); // Gray
        };
    }
}
