package com.ultrabms.dto.parking;

import com.ultrabms.entity.enums.ParkingSpotStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for changing parking spot status
 * Story 3.8: Parking Spot Inventory Management
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChangeStatusRequest {

    @NotNull(message = "Status is required")
    private ParkingSpotStatus status;
}
