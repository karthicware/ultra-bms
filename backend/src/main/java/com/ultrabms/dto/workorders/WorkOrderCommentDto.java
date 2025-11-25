package com.ultrabms.dto.workorders;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for returning work order comments
 * Used in timeline/history display
 *
 * Story 4.1: Work Order Creation and Management
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkOrderCommentDto {

    /**
     * Comment ID
     */
    private UUID id;

    /**
     * Work order ID
     */
    private UUID workOrderId;

    /**
     * User who created the comment
     */
    private UUID createdBy;

    /**
     * User's full name
     */
    private String createdByName;

    /**
     * Comment text
     */
    private String commentText;

    /**
     * Is this comment marking a status change?
     */
    private Boolean isStatusChange;

    /**
     * Previous status (only if isStatusChange = true)
     */
    private String previousStatus;

    /**
     * New status (only if isStatusChange = true)
     */
    private String newStatus;

    /**
     * When the comment was created
     */
    private LocalDateTime createdAt;
}
