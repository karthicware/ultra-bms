package com.ultrabms.dto.quotations;

import com.ultrabms.entity.Quotation;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * DTO for creating a new quotation
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateQuotationRequest {

    @NotNull(message = "Lead ID is required")
    private UUID leadId;

    @NotNull(message = "Property ID is required")
    private UUID propertyId;

    @NotNull(message = "Unit ID is required")
    private UUID unitId;

    // SCP-2025-12-04: Made optional as it's being removed from frontend
    private Quotation.StayType stayType;

    @NotNull(message = "Issue date is required")
    private LocalDate issueDate;

    @NotNull(message = "Validity date is required")
    @Future(message = "Validity date must be in the future")
    private LocalDate validityDate;

    @NotNull(message = "Base rent is required")
    @DecimalMin(value = "0.01", message = "Base rent must be greater than 0")
    @Digits(integer = 10, fraction = 2, message = "Base rent must have at most 10 integer digits and 2 decimal places")
    private BigDecimal baseRent;

    @NotNull(message = "Service charges is required")
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

    @NotNull(message = "Security deposit is required")
    @DecimalMin(value = "0.00", message = "Security deposit must be non-negative")
    @Digits(integer = 10, fraction = 2, message = "Security deposit must have at most 10 integer digits and 2 decimal places")
    private BigDecimal securityDeposit;

    @NotNull(message = "Admin fee is required")
    @DecimalMin(value = "0.00", message = "Admin fee must be non-negative")
    @Digits(integer = 10, fraction = 2, message = "Admin fee must have at most 10 integer digits and 2 decimal places")
    private BigDecimal adminFee;

    private String documentRequirements;

    // SCP-2025-12-04: Identity document fields (moved from Lead)
    @NotBlank(message = "Emirates ID number is required")
    private String emiratesIdNumber;

    @NotNull(message = "Emirates ID expiry date is required")
    private LocalDate emiratesIdExpiry;

    @NotBlank(message = "Passport number is required")
    private String passportNumber;

    @NotNull(message = "Passport expiry date is required")
    private LocalDate passportExpiry;

    @NotBlank(message = "Nationality is required")
    private String nationality;

    // Document file paths (will be set after S3 upload)
    private String emiratesIdFrontPath;
    private String emiratesIdBackPath;
    private String passportPath;

    @NotBlank(message = "Payment terms is required")
    private String paymentTerms;

    @NotBlank(message = "Move-in procedures is required")
    private String moveinProcedures;

    @NotBlank(message = "Cancellation policy is required")
    private String cancellationPolicy;

    private String specialTerms;
}
