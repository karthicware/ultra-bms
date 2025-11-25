package com.ultrabms.dto.workorders;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * DTO for progress update response
 * Used in POST /api/v1/work-orders/{id}/progress
 *
 * Story 4.4: Job Progress Tracking and Completion
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProgressUpdateResponseDto {

    /**
     * Progress update ID
     */
    private UUID progressUpdateId;

    /**
     * When the progress update was created
     */
    private LocalDateTime createdAt;

    /**
     * Photo URLs that were uploaded
     */
    private List<String> photoUrls;
}
