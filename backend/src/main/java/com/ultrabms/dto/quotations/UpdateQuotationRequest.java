package com.ultrabms.dto.quotations;

import com.ultrabms.entity.Quotation;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Future;
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

    @Future(message = "Validity date must be in the future")
    private LocalDate validityDate;

    @DecimalMin(value = "0.01", message = "Base rent must be greater than 0")
    @Digits(integer = 10, fraction = 2, message = "Base rent must have at most 10 integer digits and 2 decimal places")
    private BigDecimal baseRent;

    @DecimalMin(value = "0.00", message = "Service charges must be non-negative")
    @Digits(integer = 10, fraction = 2, message = "Service charges must have at most 10 integer digits and 2 decimal places")
    private BigDecimal serviceCharges;

    @Min(value = 0, message = "Parking spots must be non-negative")
    private Integer parkingSpots;

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
}
