package com.ultrabms.dto.quotations;

import com.ultrabms.entity.Quotation;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * DTO for updating an existing quotation
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateQuotationRequest {

    private UUID propertyId;

    private UUID unitId;

    private Quotation.StayType stayType;

    // Note: No @Future validation for updates - quotation may have been created earlier
    private LocalDate validityDate;

    @DecimalMin(value = "0.01", message = "Base rent must be greater than 0")
    @Digits(integer = 10, fraction = 2, message = "Base rent must have at most 10 integer digits and 2 decimal places")
    private BigDecimal baseRent;

    @DecimalMin(value = "0.00", message = "Service charges must be non-negative")
    @Digits(integer = 10, fraction = 2, message = "Service charges must have at most 10 integer digits and 2 decimal places")
    private BigDecimal serviceCharges;

    // SCP-2025-12-02: Changed from parkingSpots count to optional single spot selection
    // parkingSpotId references a ParkingSpot UUID from parking inventory
    private UUID parkingSpotId;

    // Optional parking fee - editable (auto-populated from spot, can be overridden)
    @DecimalMin(value = "0.00", message = "Parking fee must be non-negative")
    @Digits(integer = 10, fraction = 2, message = "Parking fee must have at most 10 integer digits and 2 decimal places")
    private BigDecimal parkingFee;

    @DecimalMin(value = "0.00", message = "Security deposit must be non-negative")
    @Digits(integer = 10, fraction = 2, message = "Security deposit must have at most 10 integer digits and 2 decimal places")
    private BigDecimal securityDeposit;

    @DecimalMin(value = "0.00", message = "Admin fee must be non-negative")
    @Digits(integer = 10, fraction = 2, message = "Admin fee must have at most 10 integer digits and 2 decimal places")
    private BigDecimal adminFee;

    private String documentRequirements;

    private String paymentTerms;

    private String moveinProcedures;

    private String cancellationPolicy;

    private String specialTerms;

    // SCP-2025-12-06: Cheque breakdown fields
    @DecimalMin(value = "0.00", message = "Yearly rent amount must be non-negative")
    @Digits(integer = 12, fraction = 2, message = "Yearly rent amount must have at most 12 integer digits and 2 decimal places")
    private BigDecimal yearlyRentAmount;

    @Min(value = 1, message = "Minimum 1 cheque required")
    private Integer numberOfCheques;

    private Quotation.FirstMonthPaymentMethod firstMonthPaymentMethod;

    @DecimalMin(value = "0.00", message = "First month total must be non-negative")
    @Digits(integer = 12, fraction = 2, message = "First month total must have at most 12 integer digits and 2 decimal places")
    private BigDecimal firstMonthTotal;

    private String chequeBreakdown;

    // SCP-2025-12-04: Identity document fields (moved from Lead)
    private String emiratesIdNumber;
    private LocalDate emiratesIdExpiry;
    private String passportNumber;
    private LocalDate passportExpiry;
    private String nationality;

    // Document file paths (will be set after S3 upload)
    private String emiratesIdFrontPath;
    private String emiratesIdBackPath;
    private String passportFrontPath;
    private String passportBackPath;
}
