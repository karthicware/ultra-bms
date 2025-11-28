package com.ultrabms.dto.parking;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

/**
 * DTO for bulk delete parking spots request
 * Story 3.8: Parking Spot Inventory Management
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkDeleteRequest {

    @NotEmpty(message = "At least one parking spot ID is required")
    private List<UUID> ids;
}
