package com.ultrabms.dto.parking;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * DTO for creating a new parking spot
 * Story 3.8: Parking Spot Inventory Management
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateParkingSpotRequest {

    @NotNull(message = "Property ID is required")
    private UUID propertyId;

    @NotBlank(message = "Spot number is required")
    @Size(max = 20, message = "Spot number cannot exceed 20 characters")
    private String spotNumber;

    @NotNull(message = "Default fee is required")
    @DecimalMin(value = "0.00", message = "Default fee cannot be negative")
    private BigDecimal defaultFee;

    @Size(max = 500, message = "Notes cannot exceed 500 characters")
    private String notes;
}
