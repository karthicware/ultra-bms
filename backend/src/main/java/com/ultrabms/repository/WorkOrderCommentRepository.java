package com.ultrabms.repository;

import com.ultrabms.entity.WorkOrderComment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository interface for WorkOrderComment entity.
 * Provides CRUD operations and custom queries for work order comments.
 *
 * Story 4.1: Work Order Creation and Management
 */
@Repository
public interface WorkOrderCommentRepository extends JpaRepository<WorkOrderComment, UUID> {

    /**
     * Find all comments for a specific work order, ordered by creation date (oldest first)
     * Used to display comment timeline/history
     *
     * @param workOrderId Work order UUID
     * @return List of comments in chronological order
     */
    List<WorkOrderComment> findByWorkOrderIdOrderByCreatedAtAsc(UUID workOrderId);

    /**
     * Find all comments for a specific work order with pagination
     *
     * @param workOrderId Work order UUID
     * @param pageable    Pagination parameters
     * @return Page of comments
     */
    Page<WorkOrderComment> findByWorkOrderIdOrderByCreatedAtDesc(UUID workOrderId, Pageable pageable);

    /**
     * Find all status change comments for a work order
     * Used to display status history timeline
     *
     * @param workOrderId    Work order UUID
     * @param isStatusChange True to get only status change comments
     * @return List of status change comments in chronological order
     */
    List<WorkOrderComment> findByWorkOrderIdAndIsStatusChangeOrderByCreatedAtAsc(UUID workOrderId,
            Boolean isStatusChange);

    /**
     * Count comments for a work order
     *
     * @param workOrderId Work order UUID
     * @return Count of comments
     */
    long countByWorkOrderId(UUID workOrderId);

    /**
     * Delete all comments for a work order (used when work order is deleted)
     *
     * @param workOrderId Work order UUID
     */
    void deleteByWorkOrderId(UUID workOrderId);
}
