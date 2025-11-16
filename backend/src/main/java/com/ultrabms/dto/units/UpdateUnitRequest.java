package com.ultrabms.dto.units;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Map;

/**
 * DTO for updating an existing unit
 * All fields are optional to allow partial updates
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUnitRequest {

    @Size(min = 1, max = 20, message = "Unit number must be between 1 and 20 characters")
    private String unitNumber;

    @Min(value = -5, message = "Floor must be at least -5")
    @Max(value = 200, message = "Floor cannot exceed 200")
    private Integer floor;

    @Min(value = 0, message = "Bedroom count cannot be negative")
    @Max(value = 20, message = "Bedroom count cannot exceed 20")
    private Integer bedroomCount;

    @DecimalMin(value = "0.0", message = "Bathroom count cannot be negative")
    @DecimalMax(value = "20.0", message = "Bathroom count cannot exceed 20")
    private BigDecimal bathroomCount;

    @DecimalMin(value = "1.0", message = "Square footage must be positive")
    private BigDecimal squareFootage;

    @DecimalMin(value = "0.01", message = "Monthly rent must be positive")
    private BigDecimal monthlyRent;

    private Map<String, Object> features;
}
