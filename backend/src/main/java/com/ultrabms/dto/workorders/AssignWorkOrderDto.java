package com.ultrabms.dto.workorders;

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
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignWorkOrderDto {

    /**
     * Vendor or staff member to assign the work order to
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
