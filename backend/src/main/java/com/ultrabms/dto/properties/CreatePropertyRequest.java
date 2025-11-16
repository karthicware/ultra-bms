package com.ultrabms.dto.properties;

import com.ultrabms.entity.enums.PropertyStatus;
import com.ultrabms.entity.enums.PropertyType;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * DTO for creating a new property
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePropertyRequest {

    @NotBlank(message = "Property name is required")
    @Size(min = 2, max = 200, message = "Property name must be between 2 and 200 characters")
    private String name;

    @NotBlank(message = "Address is required")
    @Size(min = 5, max = 500, message = "Address must be between 5 and 500 characters")
    private String address;

    @NotNull(message = "Property type is required")
    private PropertyType propertyType;

    @NotNull(message = "Total units count is required")
    @Min(value = 1, message = "Total units count must be at least 1")
    @Max(value = 10000, message = "Total units count cannot exceed 10000")
    private Integer totalUnitsCount;

    private UUID managerId;

    @Min(value = 1800, message = "Year built must be 1800 or later")
    @Max(value = 2100, message = "Year built cannot exceed 2100")
    private Integer yearBuilt;

    @DecimalMin(value = "0.01", message = "Total square footage must be positive")
    private BigDecimal totalSquareFootage;

    @Size(max = 50, message = "Cannot have more than 50 amenities")
    private List<String> amenities;

    @Builder.Default
    private PropertyStatus status = PropertyStatus.ACTIVE;
}
