package com.ultrabms.dto.workorders;

import com.ultrabms.entity.enums.AssigneeType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * DTO for reassigning a work order to a different vendor or staff member
 * Used in POST /api/v1/work-orders/{id}/reassign
 *
 * Story 4.3: Work Order Assignment and Vendor Coordination
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReassignWorkOrderDto {

    /**
     * Type of new assignee (INTERNAL_STAFF or EXTERNAL_VENDOR)
     */
    @NotNull(message = "New assignee type is required")
    private AssigneeType newAssigneeType;

    /**
     * New vendor or staff member to assign the work order to
     */
    @NotNull(message = "New assignee ID is required")
    private UUID newAssigneeId;

    /**
     * Required explanation for why the work order is being reassigned
     * Must be at least 10 characters
     */
    @NotBlank(message = "Reassignment reason is required")
    @Size(min = 10, max = 200, message = "Reassignment reason must be between 10 and 200 characters")
    private String reassignmentReason;

    /**
     * Optional notes for the new assignee
     */
    @Size(max = 500, message = "Assignment notes must be less than 500 characters")
    private String assignmentNotes;
}
