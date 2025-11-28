package com.ultrabms.dto.parking;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for parking spot counts by status
 * Story 3.8: Parking Spot Inventory Management
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParkingSpotCountsResponse {

    private long available;
    private long assigned;
    private long underMaintenance;
    private long total;

    /**
     * Create counts response
     */
    public static ParkingSpotCountsResponse of(long available, long assigned, long underMaintenance) {
        return ParkingSpotCountsResponse.builder()
                .available(available)
                .assigned(assigned)
                .underMaintenance(underMaintenance)
                .total(available + assigned + underMaintenance)
                .build();
    }
}
