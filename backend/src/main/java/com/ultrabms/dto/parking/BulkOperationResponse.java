package com.ultrabms.dto.parking;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

/**
 * DTO for bulk operation response
 * Story 3.8: Parking Spot Inventory Management
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkOperationResponse {

    private int successCount;
    private int failedCount;
    private List<UUID> failedIds;
    private String message;

    /**
     * Create a success response
     */
    public static BulkOperationResponse success(int count, String message) {
        return BulkOperationResponse.builder()
                .successCount(count)
                .failedCount(0)
                .failedIds(List.of())
                .message(message)
                .build();
    }

    /**
     * Create a partial success response
     */
    public static BulkOperationResponse partial(int successCount, List<UUID> failedIds, String message) {
        return BulkOperationResponse.builder()
                .successCount(successCount)
                .failedCount(failedIds.size())
                .failedIds(failedIds)
                .message(message)
                .build();
    }
}
