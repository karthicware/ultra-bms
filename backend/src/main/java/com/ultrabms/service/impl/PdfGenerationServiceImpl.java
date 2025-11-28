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
import com.ultrabms.dto.expenses.ExpenseResponseDto;
import com.ultrabms.entity.Invoice;
import com.ultrabms.entity.Payment;
import com.ultrabms.entity.Tenant;
import com.ultrabms.entity.enums.InvoiceStatus;
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
