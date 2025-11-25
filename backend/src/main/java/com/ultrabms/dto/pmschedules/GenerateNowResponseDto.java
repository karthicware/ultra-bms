package com.ultrabms.dto.pmschedules;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * DTO for generate now action response.
 * Returns the created work order info.
 *
 * Story 4.2: Preventive Maintenance Scheduling
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GenerateNowResponseDto {

    /**
     * Generated work order ID
     */
    private UUID workOrderId;

    /**
     * Work order number (e.g., WO-2025-0001)
     */
    private String workOrderNumber;
}
