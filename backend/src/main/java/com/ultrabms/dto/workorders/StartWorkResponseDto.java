package com.ultrabms.dto.workorders;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * DTO for start work response
 * Used in PATCH /api/v1/work-orders/{id}/start
 *
 * Story 4.4: Job Progress Tracking and Completion
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StartWorkResponseDto {

    /**
     * Work order ID
     */
    private UUID workOrderId;

    /**
     * New status (IN_PROGRESS)
     */
    private String status;

    /**
     * When work was started
     */
    private LocalDateTime startedAt;

    /**
     * Before photo URLs that were uploaded
     */
    private List<String> beforePhotoUrls;
}
