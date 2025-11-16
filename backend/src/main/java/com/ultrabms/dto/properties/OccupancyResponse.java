package com.ultrabms.dto.properties;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for property occupancy metrics
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OccupancyResponse {

    private Integer total;
    private Integer available;
    private Integer occupied;
    private Integer underMaintenance;
    private Integer reserved;
    private Double occupancyPercentage;

    /**
     * Create OccupancyResponse from unit counts
     */
    public static OccupancyResponse fromCounts(
            int total,
            int available,
            int occupied,
            int underMaintenance,
            int reserved
    ) {
        double occupancyPercentage = total > 0 ? (double) occupied / total * 100 : 0.0;

        return OccupancyResponse.builder()
                .total(total)
                .available(available)
                .occupied(occupied)
                .underMaintenance(underMaintenance)
                .reserved(reserved)
                .occupancyPercentage(occupancyPercentage)
                .build();
    }
}
