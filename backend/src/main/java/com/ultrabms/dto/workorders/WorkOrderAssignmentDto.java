package com.ultrabms.dto.workorders;

import com.ultrabms.entity.enums.AssigneeType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for work order assignment history entry
 * Used in GET /api/v1/work-orders/{id}/assignment-history
 *
 * Story 4.3: Work Order Assignment and Vendor Coordination
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkOrderAssignmentDto {

    /**
     * Assignment ID
     */
    private UUID id;

    /**
     * Work order ID
     */
    private UUID workOrderId;

    /**
     * Type of assignee
     */
    private AssigneeType assigneeType;

    /**
     * Assignee ID (user or vendor)
     */
    private UUID assigneeId;

    /**
     * Resolved assignee name for display
     */
    private String assigneeName;

    /**
     * User who made the assignment
     */
    private UUID assignedBy;

    /**
     * Resolved assignor name for display
     */
    private String assignedByName;

    /**
     * When the assignment was made
     */
    private LocalDateTime assignedDate;

    /**
     * Reason for reassignment (null for initial assignment)
     */
    private String reassignmentReason;

    /**
     * Optional notes provided with assignment
     */
    private String assignmentNotes;

    /**
     * True if this is the initial assignment, false for reassignments
     */
    private boolean initialAssignment;
}
