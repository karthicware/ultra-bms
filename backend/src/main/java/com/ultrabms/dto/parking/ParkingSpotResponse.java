package com.ultrabms.dto.parking;

import com.ultrabms.entity.ParkingSpot;
import com.ultrabms.entity.enums.ParkingSpotStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for parking spot response
 * Story 3.8: Parking Spot Inventory Management
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParkingSpotResponse {

    private UUID id;
    private String spotNumber;
    private UUID propertyId;
    private String propertyName;
    private BigDecimal defaultFee;
    private ParkingSpotStatus status;
    private UUID assignedTenantId;
    private String assignedTenantName;
    private LocalDateTime assignedAt;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * Convert ParkingSpot entity to ParkingSpotResponse DTO
     */
    public static ParkingSpotResponse fromEntity(ParkingSpot parkingSpot) {
        ParkingSpotResponseBuilder builder = ParkingSpotResponse.builder()
                .id(parkingSpot.getId())
                .spotNumber(parkingSpot.getSpotNumber())
                .defaultFee(parkingSpot.getDefaultFee())
                .status(parkingSpot.getStatus())
                .assignedAt(parkingSpot.getAssignedAt())
                .notes(parkingSpot.getNotes())
                .createdAt(parkingSpot.getCreatedAt())
                .updatedAt(parkingSpot.getUpdatedAt());

        // Set property info
        if (parkingSpot.getProperty() != null) {
            builder.propertyId(parkingSpot.getProperty().getId())
                   .propertyName(parkingSpot.getProperty().getName());
        }

        // Set assigned tenant info
        if (parkingSpot.getAssignedTenant() != null) {
            builder.assignedTenantId(parkingSpot.getAssignedTenant().getId())
                   .assignedTenantName(
                       parkingSpot.getAssignedTenant().getFirstName() + " " +
                       parkingSpot.getAssignedTenant().getLastName()
                   );
        }

        return builder.build();
    }
}
