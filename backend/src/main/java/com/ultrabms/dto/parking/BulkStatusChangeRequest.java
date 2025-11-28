package com.ultrabms.dto.parking;

import com.ultrabms.entity.enums.ParkingSpotStatus;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

/**
 * DTO for bulk status change parking spots request
 * Story 3.8: Parking Spot Inventory Management
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkStatusChangeRequest {

    @NotEmpty(message = "At least one parking spot ID is required")
    private List<UUID> ids;

    @NotNull(message = "Status is required")
    private ParkingSpotStatus status;
}
