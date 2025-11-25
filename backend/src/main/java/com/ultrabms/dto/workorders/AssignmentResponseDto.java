package com.ultrabms.dto.workorders;

import com.ultrabms.entity.enums.AssigneeType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for assignment/reassignment response
 * Used as response for POST /api/v1/work-orders/{id}/assign and /reassign
 *
 * Story 4.3: Work Order Assignment and Vendor Coordination
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignmentResponseDto {

    /**
     * Work order ID
     */
    private UUID workOrderId;

    /**
     * Assigned to details
     */
    private AssigneeInfo assignedTo;

    /**
     * Previous assignee (for reassignment only)
     */
    private AssigneeInfo previousAssignee;

    /**
     * When the assignment was made
     */
    private LocalDateTime assignedDate;

    /**
     * Assignee information
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AssigneeInfo {
        private UUID id;
        private String name;
        private AssigneeType type;
    }
}
