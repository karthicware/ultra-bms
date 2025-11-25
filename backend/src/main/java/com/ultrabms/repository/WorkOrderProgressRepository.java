package com.ultrabms.repository;

import com.ultrabms.entity.WorkOrderProgress;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository interface for WorkOrderProgress entity.
 * Provides CRUD operations and custom queries for progress update management.
 *
 * Story 4.4: Job Progress Tracking and Completion
 */
@Repository
public interface WorkOrderProgressRepository extends JpaRepository<WorkOrderProgress, UUID> {

    // =================================================================
    // FIND BY WORK ORDER
    // =================================================================

    /**
     * Find all progress updates for a work order, ordered by created date (newest first)
     *
     * @param workOrderId Work order UUID
     * @return List of progress updates
     */
    List<WorkOrderProgress> findByWorkOrderIdOrderByCreatedAtDesc(UUID workOrderId);

    /**
     * Find all progress updates for a work order, ordered by created date (oldest first)
     * Useful for timeline display in chronological order
     *
     * @param workOrderId Work order UUID
     * @return List of progress updates
     */
    List<WorkOrderProgress> findByWorkOrderIdOrderByCreatedAtAsc(UUID workOrderId);

    /**
     * Find progress updates for a work order with pagination
     *
     * @param workOrderId Work order UUID
     * @param pageable    Pagination parameters
     * @return Page of progress updates
     */
    Page<WorkOrderProgress> findByWorkOrderIdOrderByCreatedAtDesc(UUID workOrderId, Pageable pageable);

    // =================================================================
    // FIND BY USER
    // =================================================================

    /**
     * Find all progress updates submitted by a specific user
     *
     * @param userId User UUID
     * @return List of progress updates
     */
    List<WorkOrderProgress> findByUserIdOrderByCreatedAtDesc(UUID userId);

    /**
     * Find progress updates by user with pagination
     *
     * @param userId   User UUID
     * @param pageable Pagination parameters
     * @return Page of progress updates
     */
    Page<WorkOrderProgress> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    // =================================================================
    // COUNT QUERIES
    // =================================================================

    /**
     * Count progress updates for a work order
     *
     * @param workOrderId Work order UUID
     * @return Count of progress updates
     */
    long countByWorkOrderId(UUID workOrderId);

    /**
     * Count progress updates submitted by a user
     *
     * @param userId User UUID
     * @return Count of progress updates
     */
    long countByUserId(UUID userId);

    // =================================================================
    // PHOTO QUERIES
    // =================================================================

    /**
     * Find all progress updates with photos for a work order
     * Used for building photo gallery
     *
     * @param workOrderId Work order UUID
     * @return List of progress updates with non-empty photo arrays
     */
    @Query("SELECT wp FROM WorkOrderProgress wp WHERE wp.workOrderId = :workOrderId " +
           "AND jsonb_array_length(CAST(wp.photoUrls AS string)) > 0 " +
           "ORDER BY wp.createdAt DESC")
    List<WorkOrderProgress> findByWorkOrderIdWithPhotos(@Param("workOrderId") UUID workOrderId);

    // =================================================================
    // EXISTENCE CHECKS
    // =================================================================

    /**
     * Check if any progress updates exist for a work order
     *
     * @param workOrderId Work order UUID
     * @return True if progress updates exist
     */
    boolean existsByWorkOrderId(UUID workOrderId);

    /**
     * Check if user has submitted any progress updates for a work order
     *
     * @param workOrderId Work order UUID
     * @param userId      User UUID
     * @return True if user has progress updates for this work order
     */
    boolean existsByWorkOrderIdAndUserId(UUID workOrderId, UUID userId);

    // =================================================================
    // DELETE OPERATIONS
    // =================================================================

    /**
     * Delete all progress updates for a work order
     * Used when work order is deleted (cascaded in DB, but explicit method for service layer)
     *
     * @param workOrderId Work order UUID
     */
    void deleteByWorkOrderId(UUID workOrderId);
}
