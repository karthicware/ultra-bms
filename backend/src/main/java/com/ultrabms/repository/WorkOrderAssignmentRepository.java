package com.ultrabms.repository;

import com.ultrabms.entity.WorkOrderAssignment;
import com.ultrabms.entity.enums.AssigneeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for WorkOrderAssignment entity operations.
 * Provides methods for querying assignment history and tracking reassignments.
 *
 * Story 4.3: Work Order Assignment and Vendor Coordination
 */
@Repository
public interface WorkOrderAssignmentRepository extends JpaRepository<WorkOrderAssignment, UUID> {

    /**
     * Find all assignments for a work order, ordered by date descending (newest first)
     *
     * @param workOrderId Work order UUID
     * @param pageable Pagination info
     * @return Page of assignments
     */
    Page<WorkOrderAssignment> findByWorkOrderIdOrderByAssignedDateDesc(UUID workOrderId, Pageable pageable);

    /**
     * Find all assignments for a work order (unpaged, for full history)
     *
     * @param workOrderId Work order UUID
     * @return List of all assignments ordered by date descending
     */
    List<WorkOrderAssignment> findByWorkOrderIdOrderByAssignedDateDesc(UUID workOrderId);

    /**
     * Find all assignments for a work order, ordered by date ascending (oldest first)
     *
     * @param workOrderId Work order UUID
     * @return List of all assignments ordered by date ascending
     */
    List<WorkOrderAssignment> findByWorkOrderIdOrderByAssignedDateAsc(UUID workOrderId);

    /**
     * Find the most recent assignment for a work order
     *
     * @param workOrderId Work order UUID
     * @return Optional containing the latest assignment
     */
    Optional<WorkOrderAssignment> findFirstByWorkOrderIdOrderByAssignedDateDesc(UUID workOrderId);

    /**
     * Count total assignments for a work order
     *
     * @param workOrderId Work order UUID
     * @return Number of assignments
     */
    long countByWorkOrderId(UUID workOrderId);

    /**
     * Find all assignments to a specific assignee
     *
     * @param assigneeId Assignee UUID
     * @param pageable Pagination info
     * @return Page of assignments
     */
    Page<WorkOrderAssignment> findByAssigneeIdOrderByAssignedDateDesc(UUID assigneeId, Pageable pageable);

    /**
     * Find assignments by assignee type
     *
     * @param assigneeType Type of assignee (INTERNAL_STAFF or EXTERNAL_VENDOR)
     * @param pageable Pagination info
     * @return Page of assignments
     */
    Page<WorkOrderAssignment> findByAssigneeTypeOrderByAssignedDateDesc(AssigneeType assigneeType, Pageable pageable);

    /**
     * Find assignments made by a specific user
     *
     * @param assignedBy User who made the assignment
     * @param pageable Pagination info
     * @return Page of assignments
     */
    Page<WorkOrderAssignment> findByAssignedByOrderByAssignedDateDesc(UUID assignedBy, Pageable pageable);

    /**
     * Find assignments within a date range
     *
     * @param startDate Start of date range
     * @param endDate End of date range
     * @param pageable Pagination info
     * @return Page of assignments
     */
    Page<WorkOrderAssignment> findByAssignedDateBetweenOrderByAssignedDateDesc(
        LocalDateTime startDate,
        LocalDateTime endDate,
        Pageable pageable
    );

    /**
     * Check if a work order has ever been assigned
     *
     * @param workOrderId Work order UUID
     * @return true if at least one assignment exists
     */
    boolean existsByWorkOrderId(UUID workOrderId);

    /**
     * Find all reassignments (assignments with non-null reassignment reason)
     *
     * @param workOrderId Work order UUID
     * @return List of reassignments
     */
    @Query("SELECT a FROM WorkOrderAssignment a WHERE a.workOrderId = :workOrderId AND a.reassignmentReason IS NOT NULL ORDER BY a.assignedDate DESC")
    List<WorkOrderAssignment> findReassignmentsByWorkOrderId(@Param("workOrderId") UUID workOrderId);

    /**
     * Count reassignments for a work order
     *
     * @param workOrderId Work order UUID
     * @return Number of reassignments
     */
    @Query("SELECT COUNT(a) FROM WorkOrderAssignment a WHERE a.workOrderId = :workOrderId AND a.reassignmentReason IS NOT NULL")
    long countReassignmentsByWorkOrderId(@Param("workOrderId") UUID workOrderId);
}
