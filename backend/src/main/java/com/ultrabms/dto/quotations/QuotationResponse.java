package com.ultrabms.dto.quotations;

import com.ultrabms.entity.Quotation;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * DTO for Quotation response
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuotationResponse {

    private UUID id;
    private String quotationNumber;
    private UUID leadId;
    private String leadName; // For display purposes
    private String leadEmail; // For display purposes
    private String leadContactNumber; // For display purposes
    private UUID propertyId;
    private String propertyName; // For display purposes
    private UUID unitId;
    private String unitNumber; // For display purposes
    private String parkingSpotNumber; // For display purposes
    // SCP-2025-12-06: Removed stayType - unit.bedroomCount provides this info
    private LocalDate issueDate;
    private LocalDate validityDate;
    private BigDecimal baseRent;
    private BigDecimal serviceCharges;
    // SCP-2025-12-02: Changed from parkingSpots to parkingSpotId
    private UUID parkingSpotId;
    private BigDecimal parkingFee;
    private BigDecimal securityDeposit;
    private BigDecimal adminFee;
    private BigDecimal totalFirstPayment;
    private String documentRequirements;
    // SCP-2025-12-06: Cheque breakdown fields
    // SCP-2025-12-10: Added numberOfPayments (total installments) and numberOfCheques (actual cheques)
    private BigDecimal yearlyRentAmount;
    private Integer numberOfPayments; // Total payment installments (what user selects, e.g., 12)
    private Integer numberOfCheques;  // Actual cheques needed (numberOfPayments - 1 if first month is CASH)
    private Quotation.FirstMonthPaymentMethod firstMonthPaymentMethod;
    private BigDecimal firstMonthTotal; // Custom first month total (includes one-time fees + first rent)
    private Integer paymentDueDate; // SCP-2025-12-10: Day of month (1-31) for subsequent payment due dates
    private String chequeBreakdown; // JSON string of cheque breakdown items
    private String paymentTerms;
    private String moveinProcedures;
    private String cancellationPolicy;
    private String specialTerms;
    // SCP-2025-12-04: Identity document fields (moved from Lead)
    private String emiratesIdNumber;
    private LocalDate emiratesIdExpiry;
    private String passportNumber;
    private LocalDate passportExpiry;
    private String nationality;
    // SCP-2025-12-12: Full name and DOB from Emirates ID OCR
    private String fullName;
    private LocalDate dateOfBirth;
    private String emiratesIdFrontPath;
    private String emiratesIdBackPath;
    private String passportFrontPath;
    private String passportBackPath;
    private Quotation.QuotationStatus status;
    // SCP-2025-12-10: Track if quotation was modified after being sent
    private Boolean isModified;
    // SCP-2025-12-10: Conversion tracking
    private UUID convertedTenantId;
    private LocalDateTime convertedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime sentAt;
    private LocalDateTime acceptedAt;
    private LocalDateTime rejectedAt;
    private String rejectionReason;
    private UUID createdBy;

    /**
     * Convert Quotation entity to QuotationResponse DTO (without related entity details)
     */
    public static QuotationResponse fromEntity(Quotation quotation) {
        return fromEntity(quotation, null, null, null, null, null, null);
    }

    /**
     * Convert Quotation entity to QuotationResponse DTO with related entity details
     */
    public static QuotationResponse fromEntity(
            Quotation quotation,
            String leadName,
            String leadEmail,
            String leadContactNumber,
            String propertyName,
            String unitNumber,
            String parkingSpotNumber) {
        return QuotationResponse.builder()
                .id(quotation.getId())
                .quotationNumber(quotation.getQuotationNumber())
                .leadId(quotation.getLeadId())
                .leadName(leadName)
                .leadEmail(leadEmail)
                .leadContactNumber(leadContactNumber)
                .propertyId(quotation.getPropertyId())
                .propertyName(propertyName)
                .unitId(quotation.getUnitId())
                .unitNumber(unitNumber)
                .parkingSpotNumber(parkingSpotNumber)
                // SCP-2025-12-06: Removed stayType - unit.bedroomCount provides this info
                .issueDate(quotation.getIssueDate())
                .validityDate(quotation.getValidityDate())
                .baseRent(quotation.getBaseRent())
                .serviceCharges(quotation.getServiceCharges())
                .parkingSpotId(quotation.getParkingSpotId())
                .parkingFee(quotation.getParkingFee())
                .securityDeposit(quotation.getSecurityDeposit())
                .adminFee(quotation.getAdminFee())
                .totalFirstPayment(quotation.getTotalFirstPayment())
                .documentRequirements(quotation.getDocumentRequirements())
                // SCP-2025-12-06: Cheque breakdown fields
                // SCP-2025-12-10: Added numberOfPayments
                .yearlyRentAmount(quotation.getYearlyRentAmount())
                .numberOfPayments(quotation.getNumberOfPayments())
                .numberOfCheques(quotation.getNumberOfCheques())
                .firstMonthPaymentMethod(quotation.getFirstMonthPaymentMethod())
                .firstMonthTotal(quotation.getFirstMonthTotal())
                .paymentDueDate(quotation.getPaymentDueDate())
                .chequeBreakdown(quotation.getChequeBreakdown())
                .paymentTerms(quotation.getPaymentTerms())
                .moveinProcedures(quotation.getMoveinProcedures())
                .cancellationPolicy(quotation.getCancellationPolicy())
                .specialTerms(quotation.getSpecialTerms())
                // SCP-2025-12-04: Identity document fields
                .emiratesIdNumber(quotation.getEmiratesIdNumber())
                .emiratesIdExpiry(quotation.getEmiratesIdExpiry())
                .passportNumber(quotation.getPassportNumber())
                .passportExpiry(quotation.getPassportExpiry())
                .nationality(quotation.getNationality())
                // SCP-2025-12-12: Full name and DOB from Emirates ID OCR
                .fullName(quotation.getFullName())
                .dateOfBirth(quotation.getDateOfBirth())
                .emiratesIdFrontPath(quotation.getEmiratesIdFrontPath())
                .emiratesIdBackPath(quotation.getEmiratesIdBackPath())
                .passportFrontPath(quotation.getPassportFrontPath())
                .passportBackPath(quotation.getPassportBackPath())
                .status(quotation.getStatus())
                // SCP-2025-12-10: Track if quotation was modified after being sent
                .isModified(quotation.getIsModified())
                // SCP-2025-12-10: Conversion tracking
                .convertedTenantId(quotation.getConvertedTenantId())
                .convertedAt(quotation.getConvertedAt())
                .createdAt(quotation.getCreatedAt())
                .updatedAt(quotation.getUpdatedAt())
                .sentAt(quotation.getSentAt())
                .acceptedAt(quotation.getAcceptedAt())
                .rejectedAt(quotation.getRejectedAt())
                .rejectionReason(quotation.getRejectionReason())
                .createdBy(quotation.getCreatedBy())
                .build();
    }
}
