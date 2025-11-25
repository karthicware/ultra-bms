package com.ultrabms.dto.workorders;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * DTO for returning progress update details
 * Used in GET /api/v1/work-orders/{id}/progress
 *
 * Story 4.4: Job Progress Tracking and Completion
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProgressUpdateDto {

    /**
     * Progress update ID
     */
    private UUID id;

    /**
     * Work order ID
     */
    private UUID workOrderId;

    /**
     * User who submitted this progress update
     */
    private UUID userId;

    /**
     * User's full name
     */
    private String userName;

    /**
     * Progress notes describing work done
     */
    private String progressNotes;

    /**
     * Photo URLs for during photos
     */
    private List<String> photoUrls;

    /**
     * Updated estimated completion date
     */
    private LocalDateTime estimatedCompletionDate;

    /**
     * When the progress update was created
     */
    private LocalDateTime createdAt;
}
