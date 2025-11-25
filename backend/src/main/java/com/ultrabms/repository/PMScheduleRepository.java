package com.ultrabms.repository;

import com.ultrabms.entity.PMSchedule;
import com.ultrabms.entity.enums.PMScheduleStatus;
import com.ultrabms.entity.enums.RecurrenceType;
import com.ultrabms.entity.enums.WorkOrderCategory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Repository interface for PMSchedule entity.
 * Provides CRUD operations and custom queries for preventive maintenance schedule management.
 *
 * Story 4.2: Preventive Maintenance Scheduling
 */
@Repository
public interface PMScheduleRepository extends JpaRepository<PMSchedule, UUID> {

    // =================================================================
    // BASIC QUERIES
    // =================================================================

    /**
     * Find PM schedules by status
     *
     * @param status PM schedule status
     * @param pageable Pagination parameters
     * @return Page of PM schedules
     */
    Page<PMSchedule> findByStatusOrderByNextGenerationDateAsc(PMScheduleStatus status, Pageable pageable);

    /**
     * Find PM schedules by multiple statuses
     *
     * @param statuses List of statuses
     * @param pageable Pagination parameters
     * @return Page of PM schedules
     */
    Page<PMSchedule> findByStatusInOrderByNextGenerationDateAsc(List<PMScheduleStatus> statuses, Pageable pageable);

    // =================================================================
    // PROPERTY-BASED QUERIES
    // =================================================================

    /**
     * Find PM schedules for a specific property
     *
     * @param propertyId Property UUID
     * @param pageable Pagination parameters
     * @return Page of PM schedules
     */
    Page<PMSchedule> findByPropertyIdOrderByNextGenerationDateAsc(UUID propertyId, Pageable pageable);

    /**
     * Find PM schedules for a specific property with status filter
     *
     * @param propertyId Property UUID
     * @param statuses List of statuses
     * @param pageable Pagination parameters
     * @return Page of PM schedules
     */
    Page<PMSchedule> findByPropertyIdAndStatusIn(UUID propertyId, List<PMScheduleStatus> statuses, Pageable pageable);

    /**
     * Find PM schedules that apply to all properties (propertyId is null)
     *
     * @param statuses List of statuses
     * @param pageable Pagination parameters
     * @return Page of PM schedules
     */
    Page<PMSchedule> findByPropertyIdIsNullAndStatusIn(List<PMScheduleStatus> statuses, Pageable pageable);

    // =================================================================
    // SCHEDULED JOB QUERIES
    // =================================================================

    /**
     * Find active PM schedules that are due for work order generation.
     * Used by the scheduled job to find schedules that need to generate work orders.
     *
     * @param status ACTIVE status
     * @param today Current date
     * @return List of PM schedules due for generation
     */
    List<PMSchedule> findByStatusAndNextGenerationDateLessThanEqual(PMScheduleStatus status, LocalDate today);

    /**
     * Find active PM schedules due for work order generation (alternative query)
     *
     * @param today Current date
     * @return List of active PM schedules due for generation
     */
    @Query("SELECT ps FROM PMSchedule ps WHERE ps.status = 'ACTIVE' AND ps.nextGenerationDate <= :today")
    List<PMSchedule> findDueForGeneration(@Param("today") LocalDate today);

    // =================================================================
    // SEARCH QUERIES
    // =================================================================

    /**
     * Search PM schedules by schedule name (case-insensitive)
     *
     * @param searchTerm Search term for schedule name
     * @param pageable Pagination parameters
     * @return Page of matching PM schedules
     */
    @Query("SELECT ps FROM PMSchedule ps WHERE " +
            "LOWER(ps.scheduleName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) AND " +
            "ps.status <> 'DELETED'")
    Page<PMSchedule> searchByScheduleName(
            @Param("searchTerm") String searchTerm,
            Pageable pageable);

    /**
     * Advanced search with multiple filters
     *
     * @param propertyId Property UUID (optional)
     * @param statuses List of statuses (optional)
     * @param categories List of categories (optional)
     * @param recurrenceTypes List of recurrence types (optional)
     * @param searchTerm Search term for schedule name (optional)
     * @param pageable Pagination parameters
     * @return Page of matching PM schedules
     */
    @Query("SELECT ps FROM PMSchedule ps WHERE " +
            "(:propertyId IS NULL OR ps.propertyId = :propertyId OR ps.propertyId IS NULL) AND " +
            "(:statuses IS NULL OR ps.status IN :statuses) AND " +
            "(:categories IS NULL OR ps.category IN :categories) AND " +
            "(:recurrenceTypes IS NULL OR ps.recurrenceType IN :recurrenceTypes) AND " +
            "(:searchTerm IS NULL OR LOWER(ps.scheduleName) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    Page<PMSchedule> searchWithFilters(
            @Param("propertyId") UUID propertyId,
            @Param("statuses") List<PMScheduleStatus> statuses,
            @Param("categories") List<WorkOrderCategory> categories,
            @Param("recurrenceTypes") List<RecurrenceType> recurrenceTypes,
            @Param("searchTerm") String searchTerm,
            Pageable pageable);

    // =================================================================
    // CATEGORY AND RECURRENCE QUERIES
    // =================================================================

    /**
     * Find PM schedules by category
     *
     * @param category Work order category
     * @param pageable Pagination parameters
     * @return Page of PM schedules
     */
    Page<PMSchedule> findByCategoryAndStatusIn(WorkOrderCategory category, List<PMScheduleStatus> statuses, Pageable pageable);

    /**
     * Find PM schedules by recurrence type
     *
     * @param recurrenceType Recurrence type
     * @param statuses List of statuses
     * @param pageable Pagination parameters
     * @return Page of PM schedules
     */
    Page<PMSchedule> findByRecurrenceTypeAndStatusIn(RecurrenceType recurrenceType, List<PMScheduleStatus> statuses, Pageable pageable);

    // =================================================================
    // ANALYTICS AND COUNTS
    // =================================================================

    /**
     * Count PM schedules by status
     *
     * @param status PM schedule status
     * @return Count of PM schedules
     */
    long countByStatus(PMScheduleStatus status);

    /**
     * Count PM schedules by property and status
     *
     * @param propertyId Property UUID
     * @param status PM schedule status
     * @return Count of PM schedules
     */
    long countByPropertyIdAndStatus(UUID propertyId, PMScheduleStatus status);

    /**
     * Count PM schedules by category
     *
     * @param category Work order category
     * @return Count of PM schedules
     */
    long countByCategoryAndStatus(WorkOrderCategory category, PMScheduleStatus status);

    /**
     * Count PM schedules due for generation within a date range
     *
     * @param startDate Start date
     * @param endDate End date
     * @return Count of PM schedules due
     */
    @Query("SELECT COUNT(ps) FROM PMSchedule ps WHERE " +
            "ps.status = 'ACTIVE' AND " +
            "ps.nextGenerationDate BETWEEN :startDate AND :endDate")
    long countDueForGenerationBetween(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    // =================================================================
    // CREATED BY QUERIES
    // =================================================================

    /**
     * Find PM schedules created by a specific user
     *
     * @param createdBy User UUID
     * @param pageable Pagination parameters
     * @return Page of PM schedules
     */
    Page<PMSchedule> findByCreatedByOrderByCreatedAtDesc(UUID createdBy, Pageable pageable);

    // =================================================================
    // EXISTENCE CHECKS
    // =================================================================

    /**
     * Check if a PM schedule exists for a property with a specific category (to avoid duplicates)
     *
     * @param propertyId Property UUID
     * @param category Work order category
     * @param recurrenceType Recurrence type
     * @param status Status (typically ACTIVE)
     * @return True if exists
     */
    boolean existsByPropertyIdAndCategoryAndRecurrenceTypeAndStatus(
            UUID propertyId,
            WorkOrderCategory category,
            RecurrenceType recurrenceType,
            PMScheduleStatus status);

    /**
     * Check if a property has any active PM schedules
     *
     * @param propertyId Property UUID
     * @param status Status (ACTIVE)
     * @return True if property has active PM schedules
     */
    boolean existsByPropertyIdAndStatus(UUID propertyId, PMScheduleStatus status);
}
