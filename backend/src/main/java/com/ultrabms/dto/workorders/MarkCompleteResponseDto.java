package com.ultrabms.dto.workorders;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * DTO for mark complete response
 * Used in PATCH /api/v1/work-orders/{id}/complete
 *
 * Story 4.4: Job Progress Tracking and Completion
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MarkCompleteResponseDto {

    /**
     * Work order ID
     */
    private UUID workOrderId;

    /**
     * New status (COMPLETED)
     */
    private String status;

    /**
     * When work was completed
     */
    private LocalDateTime completedAt;

    /**
     * Total cost of the work
     */
    private BigDecimal totalCost;

    /**
     * Hours spent on the work
     */
    private BigDecimal hoursSpent;

    /**
     * After photo URLs that were uploaded
     */
    private List<String> afterPhotoUrls;
}
