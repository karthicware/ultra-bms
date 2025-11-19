package com.ultrabms.dto.units;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

/**
 * DTO for bulk creating units
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkCreateUnitsRequest {

    @NotNull(message = "Property ID is required")
    private UUID propertyId;

    @NotBlank(message = "Starting unit number is required")
    @Size(min = 1, max = 20, message = "Starting unit number must be between 1 and 20 characters")
    private String startingUnitNumber;

    @NotNull(message = "Count is required")
    @Min(value = 2, message = "Count must be at least 2")
    @Max(value = 500, message = "Count cannot exceed 500")
    private Integer count;

    @Min(value = -5, message = "Floor must be at least -5")
    @Max(value = 200, message = "Floor cannot exceed 200")
    private Integer floor;

    @NotNull(message = "Increment pattern is required")
    private IncrementPattern incrementPattern;

    @NotNull(message = "Bedroom count is required")
    @Min(value = 0, message = "Bedroom count cannot be negative")
    @Max(value = 20, message = "Bedroom count cannot exceed 20")
    private Integer bedroomCount;

    @NotNull(message = "Bathroom count is required")
    @DecimalMin(value = "0.0", message = "Bathroom count cannot be negative")
    @DecimalMax(value = "20.0", message = "Bathroom count cannot exceed 20")
    private BigDecimal bathroomCount;

    @NotNull(message = "Square footage is required")
    @DecimalMin(value = "1.0", message = "Square footage must be positive")
    private BigDecimal squareFootage;

    @NotNull(message = "Monthly rent is required")
    @DecimalMin(value = "0.01", message = "Monthly rent must be positive")
    private BigDecimal monthlyRent;

    private Map<String, Object> features;

    /**
     * Enum for unit number increment patterns
     */
    public enum IncrementPattern {
        SEQUENTIAL,      // 101, 102, 103, ...
        FLOOR_BASED,     // 0101, 0102, ..., 0201, 0202, ...
        CUSTOM           // User provides custom list
    }
}
