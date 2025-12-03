package com.ultrabms.dto.quotations;

import com.ultrabms.entity.Quotation;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
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
    private UUID propertyId;
    private UUID unitId;
    private Quotation.StayType stayType;
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
    private String paymentTerms;
    private String moveinProcedures;
    private String cancellationPolicy;
    private String specialTerms;
    private Quotation.QuotationStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime sentAt;
    private LocalDateTime acceptedAt;
    private LocalDateTime rejectedAt;
    private String rejectionReason;
    private UUID createdBy;

    /**
     * Convert Quotation entity to QuotationResponse DTO
     */
    public static QuotationResponse fromEntity(Quotation quotation) {
        return QuotationResponse.builder()
                .id(quotation.getId())
                .quotationNumber(quotation.getQuotationNumber())
                .leadId(quotation.getLeadId())
                .propertyId(quotation.getPropertyId())
                .unitId(quotation.getUnitId())
                .stayType(quotation.getStayType())
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
                .paymentTerms(quotation.getPaymentTerms())
                .moveinProcedures(quotation.getMoveinProcedures())
                .cancellationPolicy(quotation.getCancellationPolicy())
                .specialTerms(quotation.getSpecialTerms())
                .status(quotation.getStatus())
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
