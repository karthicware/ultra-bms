package com.ultrabms.dto.leads;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * DTO for Lead to Tenant conversion response
 * Contains pre-populated data for tenant onboarding
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeadConversionResponse {

    // Lead information
    private UUID leadId;
    private String leadNumber;
    private String fullName;
    private String emiratesId;
    private String passportNumber;
    private LocalDate passportExpiryDate;
    private String homeCountry;
    private String email;
    private String contactNumber;

    // Quotation information
    private UUID quotationId;
    private String quotationNumber;
    private UUID propertyId;
    private UUID unitId;
    private BigDecimal baseRent;
    private BigDecimal serviceCharges;
    // SCP-2025-12-02: Changed from parkingSpots count to parkingSpotId
    private UUID parkingSpotId;
    private BigDecimal parkingFee;
    private BigDecimal securityDeposit;
    private BigDecimal adminFee;
    private BigDecimal totalFirstPayment;

    // Conversion metadata
    private String message;
}
