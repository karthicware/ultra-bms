package com.ultrabms.entity;

import com.ultrabms.entity.enums.AssigneeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * WorkOrderAssignment entity tracks all work order assignments (initial and reassignments).
 * This entity is append-only - each assignment creates a new entry.
 * Provides complete assignment history for work orders.
 *
 * Story 4.3: Work Order Assignment and Vendor Coordination
 */
@Entity
@Table(
    name = "work_order_assignments",
    indexes = {
        @Index(name = "idx_wo_assignments_work_order_id", columnList = "work_order_id"),
        @Index(name = "idx_wo_assignments_assignee_id", columnList = "assignee_id"),
        @Index(name = "idx_wo_assignments_assigned_by", columnList = "assigned_by"),
        @Index(name = "idx_wo_assignments_assigned_date", columnList = "assigned_date")
    }
)
@Data
@Builder
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class WorkOrderAssignment extends BaseEntity {

    /**
     * Reference to the work order being assigned
     */
    @NotNull(message = "Work order ID cannot be null")
    @Column(name = "work_order_id", nullable = false)
    private UUID workOrderId;

    /**
     * Type of assignee (INTERNAL_STAFF or EXTERNAL_VENDOR)
     * Determines how assigneeId should be interpreted
     */
    @NotNull(message = "Assignee type cannot be null")
    @Enumerated(EnumType.STRING)
    @Column(name = "assignee_type", nullable = false, length = 20)
    private AssigneeType assigneeType;

    /**
     * UUID of the assignee (polymorphic - can reference User or Vendor)
     * If assigneeType = INTERNAL_STAFF, this references users table
     * If assigneeType = EXTERNAL_VENDOR, this references vendors table
     */
    @NotNull(message = "Assignee ID cannot be null")
    @Column(name = "assignee_id", nullable = false)
    private UUID assigneeId;

    /**
     * User who performed the assignment (property manager or supervisor)
     */
    @NotNull(message = "Assigned by cannot be null")
    @Column(name = "assigned_by", nullable = false)
    private UUID assignedBy;

    /**
     * Date and time when the assignment was made
     */
    @NotNull(message = "Assigned date cannot be null")
    @Column(name = "assigned_date", nullable = false)
    private LocalDateTime assignedDate;

    /**
     * Reason for reassignment (nullable for initial assignment)
     * Required when work order is being reassigned from one assignee to another
     */
    @Size(min = 10, max = 200, message = "Reassignment reason must be between 10 and 200 characters")
    @Column(name = "reassignment_reason", length = 200)
    private String reassignmentReason;

    /**
     * Optional notes for the assignee regarding this work order
     */
    @Size(max = 500, message = "Assignment notes must be less than 500 characters")
    @Column(name = "assignment_notes", length = 500)
    private String assignmentNotes;
}
