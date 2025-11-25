package com.ultrabms.dto.workorders;

import com.ultrabms.entity.enums.AssigneeType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * DTO for assigning a work order to a vendor or staff member
 * Used in POST /api/v1/work-orders/{id}/assign
 *
 * Story 4.1: Work Order Creation and Management
 * Story 4.3: Work Order Assignment and Vendor Coordination
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignWorkOrderDto {

    /**
     * Type of assignee (INTERNAL_STAFF or EXTERNAL_VENDOR)
     * Story 4.3: Required to determine how to resolve assignedTo reference
     */
    @NotNull(message = "Assignee type is required")
    private AssigneeType assigneeType;

    /**
     * Vendor or staff member to assign the work order to
     * If assigneeType = INTERNAL_STAFF, this references users table
     * If assigneeType = EXTERNAL_VENDOR, this references vendors table
     */
    @NotNull(message = "Assignee ID is required")
    private UUID assignedTo;

    /**
     * Optional assignment notes (max 500 chars)
     * Example: "Urgent, complete by EOD", "Follow-up from previous visit"
     */
    @Size(max = 500, message = "Assignment notes must be less than 500 characters")
    private String assignmentNotes;
}
