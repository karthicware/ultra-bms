package com.ultrabms.service.impl;

import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.ultrabms.entity.Lead;
import com.ultrabms.entity.Quotation;
import com.ultrabms.exception.FileStorageException;
import com.ultrabms.service.QuotationPdfService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;

/**
 * Implementation of QuotationPdfService using iText
 */
@Slf4j
@Service
public class QuotationPdfServiceImpl implements QuotationPdfService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd MMM yyyy");
    private static final DeviceRgb PRIMARY_COLOR = new DeviceRgb(59, 130, 246); // Blue
    private static final DeviceRgb SECONDARY_COLOR = new DeviceRgb(107, 114, 128); // Gray

    @Override
    public byte[] generatePdf(Quotation quotation, Lead lead) {
        log.info("Generating PDF for quotation: {}", quotation.getQuotationNumber());

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdfDoc = new PdfDocument(writer);
            Document document = new Document(pdfDoc);

            // Add content
            addHeader(document, quotation);
            addLeadDetails(document, lead);
            addQuotationDetails(document, quotation);
            addRentBreakdown(document, quotation);
            addTermsAndConditions(document, quotation);
            addFooter(document, quotation);

            document.close();
            log.info("PDF generated successfully for quotation: {}", quotation.getQuotationNumber());
            return baos.toByteArray();

        } catch (Exception e) {
            log.error("Failed to generate PDF for quotation: {}", quotation.getQuotationNumber(), e);
            throw new FileStorageException("Failed to generate PDF", e);
        }
    }

    /**
     * Add header section with company logo and quotation number
     */
    private void addHeader(Document document, Quotation quotation) {
        // Company name and quotation title
        Paragraph title = new Paragraph("UltraBMS")
                .setFontSize(24)
                .setBold()
                .setFontColor(PRIMARY_COLOR);
        document.add(title);

        Paragraph subtitle = new Paragraph("Rental Quotation")
                .setFontSize(18)
                .setFontColor(SECONDARY_COLOR);
        document.add(subtitle);

        // Quotation number and date
        Table headerTable = new Table(UnitValue.createPercentArray(new float[]{1, 1}))
                .useAllAvailableWidth();

        headerTable.addCell(createCell("Quotation Number:", true));
        headerTable.addCell(createCell(quotation.getQuotationNumber(), false));

        headerTable.addCell(createCell("Issue Date:", true));
        headerTable.addCell(createCell(quotation.getIssueDate().format(DATE_FORMATTER), false));

        headerTable.addCell(createCell("Valid Until:", true));
        headerTable.addCell(createCell(quotation.getValidityDate().format(DATE_FORMATTER), false));

        document.add(headerTable);
        document.add(new Paragraph("\n"));
    }

    /**
     * Add lead/customer details section
     */
    private void addLeadDetails(Document document, Lead lead) {
        Paragraph sectionTitle = new Paragraph("Customer Details")
                .setFontSize(14)
                .setBold()
                .setFontColor(PRIMARY_COLOR);
        document.add(sectionTitle);

        Table leadTable = new Table(UnitValue.createPercentArray(new float[]{1, 2}))
                .useAllAvailableWidth();

        leadTable.addCell(createCell("Full Name:", true));
        leadTable.addCell(createCell(lead.getFullName(), false));

        leadTable.addCell(createCell("Email:", true));
        leadTable.addCell(createCell(lead.getEmail(), false));

        leadTable.addCell(createCell("Contact Number:", true));
        leadTable.addCell(createCell(lead.getContactNumber(), false));

        leadTable.addCell(createCell("Emirates ID:", true));
        leadTable.addCell(createCell(lead.getEmiratesId(), false));

        leadTable.addCell(createCell("Passport Number:", true));
        leadTable.addCell(createCell(lead.getPassportNumber(), false));

        leadTable.addCell(createCell("Home Country:", true));
        leadTable.addCell(createCell(lead.getHomeCountry(), false));

        document.add(leadTable);
        document.add(new Paragraph("\n"));
    }

    /**
     * Add quotation details section
     */
    private void addQuotationDetails(Document document, Quotation quotation) {
        Paragraph sectionTitle = new Paragraph("Property Details")
                .setFontSize(14)
                .setBold()
                .setFontColor(PRIMARY_COLOR);
        document.add(sectionTitle);

        Table detailsTable = new Table(UnitValue.createPercentArray(new float[]{1, 2}))
                .useAllAvailableWidth();

        detailsTable.addCell(createCell("Stay Type:", true));
        detailsTable.addCell(createCell(formatStayType(quotation.getStayType()), false));

        detailsTable.addCell(createCell("Property ID:", true));
        detailsTable.addCell(createCell(quotation.getPropertyId().toString(), false));

        detailsTable.addCell(createCell("Unit ID:", true));
        detailsTable.addCell(createCell(quotation.getUnitId().toString(), false));

        detailsTable.addCell(createCell("Parking Spots:", true));
        detailsTable.addCell(createCell(String.valueOf(quotation.getParkingSpots()), false));

        document.add(detailsTable);
        document.add(new Paragraph("\n"));
    }

    /**
     * Add rent breakdown table
     */
    private void addRentBreakdown(Document document, Quotation quotation) {
        Paragraph sectionTitle = new Paragraph("Rent Breakdown")
                .setFontSize(14)
                .setBold()
                .setFontColor(PRIMARY_COLOR);
        document.add(sectionTitle);

        Table breakdownTable = new Table(UnitValue.createPercentArray(new float[]{3, 1}))
                .useAllAvailableWidth()
                .setBorder(new SolidBorder(ColorConstants.LIGHT_GRAY, 1));

        // Header
        breakdownTable.addCell(createHeaderCell("Description"));
        breakdownTable.addCell(createHeaderCell("Amount (AED)"));

        // Items
        breakdownTable.addCell(createCell("Base Rent (Monthly)", false));
        breakdownTable.addCell(createCell(formatCurrency(quotation.getBaseRent()), false, TextAlignment.RIGHT));

        breakdownTable.addCell(createCell("Service Charges (Monthly)", false));
        breakdownTable.addCell(createCell(formatCurrency(quotation.getServiceCharges()), false, TextAlignment.RIGHT));

        breakdownTable.addCell(createCell(String.format("Parking Fee (Monthly × %d spots)", quotation.getParkingSpots()), false));
        BigDecimal parkingTotal = quotation.getParkingFee().multiply(BigDecimal.valueOf(quotation.getParkingSpots()));
        breakdownTable.addCell(createCell(formatCurrency(parkingTotal), false, TextAlignment.RIGHT));

        breakdownTable.addCell(createCell("Security Deposit (Refundable)", false));
        breakdownTable.addCell(createCell(formatCurrency(quotation.getSecurityDeposit()), false, TextAlignment.RIGHT));

        breakdownTable.addCell(createCell("Admin Fee (One-time)", false));
        breakdownTable.addCell(createCell(formatCurrency(quotation.getAdminFee()), false, TextAlignment.RIGHT));

        // Total
        breakdownTable.addCell(createHeaderCell("TOTAL FIRST PAYMENT"));
        breakdownTable.addCell(createHeaderCell(formatCurrency(quotation.getTotalFirstPayment()), TextAlignment.RIGHT));

        document.add(breakdownTable);
        document.add(new Paragraph("\n"));
    }

    /**
     * Add terms and conditions section
     */
    private void addTermsAndConditions(Document document, Quotation quotation) {
        // Payment Terms
        addTermsSection(document, "Payment Terms", quotation.getPaymentTerms());

        // Move-in Procedures
        addTermsSection(document, "Move-in Procedures", quotation.getMoveinProcedures());

        // Cancellation Policy
        addTermsSection(document, "Cancellation Policy", quotation.getCancellationPolicy());

        // Document Requirements (if provided)
        if (quotation.getDocumentRequirements() != null && !quotation.getDocumentRequirements().isEmpty()) {
            addTermsSection(document, "Required Documents", quotation.getDocumentRequirements());
        }

        // Special Terms (if provided)
        if (quotation.getSpecialTerms() != null && !quotation.getSpecialTerms().isEmpty()) {
            addTermsSection(document, "Special Terms", quotation.getSpecialTerms());
        }
    }

    /**
     * Add a terms section with title and content
     */
    private void addTermsSection(Document document, String title, String content) {
        Paragraph sectionTitle = new Paragraph(title)
                .setFontSize(12)
                .setBold()
                .setFontColor(PRIMARY_COLOR);
        document.add(sectionTitle);

        Paragraph sectionContent = new Paragraph(content)
                .setFontSize(10);
        document.add(sectionContent);
        document.add(new Paragraph("\n"));
    }

    /**
     * Add footer with contact information
     */
    private void addFooter(Document document, Quotation quotation) {
        document.add(new Paragraph("\n"));

        Paragraph footer = new Paragraph("This quotation is valid until " +
                quotation.getValidityDate().format(DATE_FORMATTER) + ".\n" +
                "For any questions, please contact us at info@ultrabms.com or call +971-XXX-XXXX.")
                .setFontSize(9)
                .setFontColor(SECONDARY_COLOR)
                .setTextAlignment(TextAlignment.CENTER);
        document.add(footer);

        Paragraph signature = new Paragraph("\n\nAuthorized Signature: ___________________")
                .setFontSize(10)
                .setTextAlignment(TextAlignment.RIGHT);
        document.add(signature);
    }

    /**
     * Create a table cell
     */
    private Cell createCell(String content, boolean isBold) {
        Paragraph paragraph = new Paragraph(content);
        if (isBold) {
            paragraph.setBold();
        }
        return new Cell().add(paragraph).setBorder(Border.NO_BORDER).setPadding(5);
    }

    /**
     * Create a table cell with custom alignment
     */
    private Cell createCell(String content, boolean isBold, TextAlignment alignment) {
        Paragraph paragraph = new Paragraph(content);
        if (isBold) {
            paragraph.setBold();
        }
        return new Cell()
                .add(paragraph)
                .setBorder(Border.NO_BORDER)
                .setPadding(5)
                .setTextAlignment(alignment);
    }

    /**
     * Create a header cell for tables
     */
    private Cell createHeaderCell(String content) {
        return new Cell()
                .add(new Paragraph(content).setBold().setFontColor(ColorConstants.WHITE))
                .setBackgroundColor(PRIMARY_COLOR)
                .setPadding(8)
                .setTextAlignment(TextAlignment.LEFT);
    }

    /**
     * Create a header cell with custom alignment
     */
    private Cell createHeaderCell(String content, TextAlignment alignment) {
        return new Cell()
                .add(new Paragraph(content).setBold().setFontColor(ColorConstants.WHITE))
                .setBackgroundColor(PRIMARY_COLOR)
                .setPadding(8)
                .setTextAlignment(alignment);
    }

    /**
     * Format currency value
     */
    private String formatCurrency(BigDecimal amount) {
        return String.format("%,.2f", amount);
    }

    /**
     * Format stay type enum to readable string
     */
    private String formatStayType(Quotation.StayType stayType) {
        return switch (stayType) {
            case STUDIO -> "Studio";
            case ONE_BHK -> "1 BHK";
            case TWO_BHK -> "2 BHK";
            case THREE_BHK -> "3 BHK";
            case VILLA -> "Villa";
        };
    }
}
