package com.ultrabms.dto.leads;

import com.ultrabms.entity.Quotation;
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
 * SCP-2025-12-06: Extended to include ALL fields for tenant auto-population
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeadConversionResponse {

    // ===== Lead Personal Information =====
    private UUID leadId;
    private String leadNumber;
    private String fullName;
    private String firstName;
    private String lastName;
    private String email;
    private String contactNumber;
    private String alternateContact;
    private String homeCountry;

    // ===== Identity Documents (from Quotation) =====
    private String emiratesId;
    private LocalDate emiratesIdExpiry;
    private String passportNumber;
    private LocalDate passportExpiryDate;
    private String nationality;
    // Document file paths
    private String emiratesIdFrontPath;
    private String emiratesIdBackPath;
    private String passportFrontPath;
    private String passportBackPath;

    // ===== Quotation Basic Info =====
    private UUID quotationId;
    private String quotationNumber;
    private UUID propertyId;
    private UUID unitId;

    // ===== Financial Information =====
    private BigDecimal baseRent;
    private BigDecimal serviceCharges;
    private BigDecimal securityDeposit;
    private BigDecimal adminFee;
    private BigDecimal totalFirstPayment;
    // SCP-2025-12-02: Parking from inventory
    private UUID parkingSpotId;
    private BigDecimal parkingFee;

    // ===== SCP-2025-12-06: Cheque Breakdown =====
    private BigDecimal yearlyRentAmount;
    private Integer numberOfCheques;
    private Quotation.FirstMonthPaymentMethod firstMonthPaymentMethod;
    private String chequeBreakdown; // JSON string of cheque items

    // ===== Terms & Conditions =====
    private String paymentTerms;
    private String moveinProcedures;
    private String cancellationPolicy;
    private String specialTerms;

    // ===== Conversion Metadata =====
    private String message;
}
