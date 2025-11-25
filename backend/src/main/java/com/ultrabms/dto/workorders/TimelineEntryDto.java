package com.ultrabms.dto.workorders;

import com.ultrabms.entity.enums.TimelineEntryType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * DTO for timeline entry representing work order events
 * Used in GET /api/v1/work-orders/{id}/timeline
 *
 * Story 4.4: Job Progress Tracking and Completion
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TimelineEntryDto {

    /**
     * Type of timeline entry
     */
    private TimelineEntryType type;

    /**
     * When this event occurred
     */
    private LocalDateTime timestamp;

    /**
     * User who performed this action
     */
    private UUID userId;

    /**
     * User's full name
     */
    private String userName;

    /**
     * User's avatar URL (optional)
     */
    private String userAvatar;

    /**
     * Details specific to this entry type
     * Content varies by type:
     * - CREATED: title, description
     * - ASSIGNED: assigneeName, assigneeType, assignmentNotes
     * - STARTED: startedAt
     * - PROGRESS_UPDATE: progressNotes, estimatedCompletionDate
     * - COMPLETED: completionNotes, hoursSpent, totalCost, recommendations, followUpRequired, followUpDescription
     */
    private Map<String, Object> details;

    /**
     * Photo URLs associated with this timeline entry (optional)
     */
    private List<String> photoUrls;
}
