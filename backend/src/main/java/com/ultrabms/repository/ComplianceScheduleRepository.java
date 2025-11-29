package com.ultrabms.repository;

import com.ultrabms.entity.ComplianceSchedule;
import com.ultrabms.entity.enums.ComplianceCategory;
import com.ultrabms.entity.enums.ComplianceScheduleStatus;
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
 * Repository interface for ComplianceSchedule entity.
 * Provides CRUD operations and custom queries for compliance schedule management.
 *
 * Story 7.3: Compliance and Inspection Tracking
 * AC #44: Repositories with custom queries
 */
@Repository
public interface ComplianceScheduleRepository extends JpaRepository<ComplianceSchedule, UUID> {

    // =================================================================
    // FIND BY RELATIONSHIPS
    // =================================================================

    /**
     * Find schedules by compliance requirement
     *
     * @param complianceRequirementId Requirement UUID
     * @return List of schedules
     */
    List<ComplianceSchedule> findByComplianceRequirementId(UUID complianceRequirementId);

    /**
     * Find schedules by property
     *
     * @param propertyId Property UUID
     * @return List of schedules
     */
    List<ComplianceSchedule> findByPropertyId(UUID propertyId);

    /**
     * Find schedules by property and status
     *
     * @param propertyId Property UUID
     * @param status     Schedule status
     * @return List of schedules
     */
    List<ComplianceSchedule> findByPropertyIdAndStatus(UUID propertyId, ComplianceScheduleStatus status);

    /**
     * Find schedules by requirement and property
     *
     * @param complianceRequirementId Requirement UUID
     * @param propertyId              Property UUID
     * @return List of schedules
     */
    List<ComplianceSchedule> findByComplianceRequirementIdAndPropertyId(UUID complianceRequirementId, UUID propertyId);

    // =================================================================
    // STATUS-BASED QUERIES
    // =================================================================

    /**
     * Find all schedules by status
     *
     * @param status Schedule status
     * @return List of schedules
     */
    List<ComplianceSchedule> findByStatus(ComplianceScheduleStatus status);

    /**
     * Find overdue schedules
     *
     * @return List of overdue schedules
     */
    default List<ComplianceSchedule> findOverdue() {
        return findByStatus(ComplianceScheduleStatus.OVERDUE);
    }

    /**
     * Find schedules that are not completed or exempt
     *
     * @return List of active schedules
     */
    @Query("SELECT cs FROM ComplianceSchedule cs WHERE cs.status NOT IN ('COMPLETED', 'EXEMPT')")
    List<ComplianceSchedule> findActiveSchedules();

    // =================================================================
    // DATE-BASED QUERIES
    // =================================================================

    /**
     * Find schedules due within a date range
     *
     * @param startDate Start date
     * @param endDate   End date
     * @return List of schedules
     */
    List<ComplianceSchedule> findByDueDateBetween(LocalDate startDate, LocalDate endDate);

    /**
     * Find schedules due before a specific date
     *
     * @param date Due date threshold
     * @return List of schedules
     */
    List<ComplianceSchedule> findByDueDateBefore(LocalDate date);

    /**
     * Find schedules due on or before today that are still UPCOMING
     * Used by scheduler job to update to DUE status
     *
     * @param date Current date
     * @return List of schedules to update
     */
    @Query("""
        SELECT cs FROM ComplianceSchedule cs
        WHERE cs.status = 'UPCOMING'
        AND cs.dueDate <= :date
        """)
    List<ComplianceSchedule> findUpcomingSchedulesDueBefore(@Param("date") LocalDate date);

    /**
     * Find schedules past due date that are still DUE
     * Used by scheduler job to update to OVERDUE status
     *
     * @param date Current date
     * @return List of schedules to update
     */
    @Query("""
        SELECT cs FROM ComplianceSchedule cs
        WHERE cs.status = 'DUE'
        AND cs.dueDate < :date
        """)
    List<ComplianceSchedule> findDueSchedulesPastDueDate(@Param("date") LocalDate date);

    /**
     * Find schedules due within next N days for reminder notifications
     * Excludes COMPLETED and EXEMPT schedules
     *
     * @param startDate Start date (typically today)
     * @param endDate   End date (typically today + 30 days)
     * @return List of schedules for reminders
     */
    @Query("""
        SELECT cs FROM ComplianceSchedule cs
        WHERE cs.status NOT IN ('COMPLETED', 'EXEMPT')
        AND cs.dueDate BETWEEN :startDate AND :endDate
        """)
    List<ComplianceSchedule> findSchedulesForReminder(
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );

    // =================================================================
    // PAGINATED QUERIES
    // =================================================================

    /**
     * Find schedules with filters (paginated)
     *
     * @param propertyId    Optional property filter
     * @param requirementId Optional requirement filter
     * @param category      Optional category filter
     * @param status        Optional status filter
     * @param dueDateStart  Optional due date start
     * @param dueDateEnd    Optional due date end
     * @param pageable      Pagination info
     * @return Page of schedules
     */
    @Query("""
        SELECT cs FROM ComplianceSchedule cs
        JOIN cs.complianceRequirement cr
        WHERE (:propertyId IS NULL OR cs.property.id = :propertyId)
        AND (:requirementId IS NULL OR cr.id = :requirementId)
        AND (:category IS NULL OR cr.category = :category)
        AND (:status IS NULL OR cs.status = :status)
        AND (:dueDateStart IS NULL OR cs.dueDate >= :dueDateStart)
        AND (:dueDateEnd IS NULL OR cs.dueDate <= :dueDateEnd)
        """)
    Page<ComplianceSchedule> findWithFilters(
        @Param("propertyId") UUID propertyId,
        @Param("requirementId") UUID requirementId,
        @Param("category") ComplianceCategory category,
        @Param("status") ComplianceScheduleStatus status,
        @Param("dueDateStart") LocalDate dueDateStart,
        @Param("dueDateEnd") LocalDate dueDateEnd,
        Pageable pageable
    );

    // =================================================================
    // COUNT QUERIES
    // =================================================================

    /**
     * Count schedules by status
     *
     * @param status Schedule status
     * @return Count
     */
    long countByStatus(ComplianceScheduleStatus status);

    /**
     * Count schedules by property and status
     *
     * @param propertyId Property UUID
     * @param status     Schedule status
     * @return Count
     */
    long countByPropertyIdAndStatus(UUID propertyId, ComplianceScheduleStatus status);

    /**
     * Count overdue schedules for a property
     *
     * @param propertyId Property UUID
     * @return Count of overdue schedules
     */
    default long countOverdueByProperty(UUID propertyId) {
        return countByPropertyIdAndStatus(propertyId, ComplianceScheduleStatus.OVERDUE);
    }

    // =================================================================
    // DASHBOARD QUERIES
    // =================================================================

    /**
     * Count schedules by category for dashboard
     *
     * @return List of [category, count] arrays
     */
    @Query("""
        SELECT cr.category, COUNT(cs)
        FROM ComplianceSchedule cs
        JOIN cs.complianceRequirement cr
        WHERE cs.status NOT IN ('COMPLETED', 'EXEMPT')
        GROUP BY cr.category
        """)
    List<Object[]> countSchedulesByCategory();

    /**
     * Calculate compliance rate (completed / total * 100)
     * Excludes EXEMPT schedules from calculation
     *
     * @return Compliance rate percentage
     */
    @Query(value = """
        SELECT
            CASE
                WHEN COUNT(*) FILTER (WHERE status != 'EXEMPT') = 0 THEN 100.0
                ELSE (COUNT(*) FILTER (WHERE status = 'COMPLETED') * 100.0 /
                      COUNT(*) FILTER (WHERE status != 'EXEMPT'))
            END
        FROM compliance_schedules
        """, nativeQuery = true)
    Double calculateComplianceRate();

    // =================================================================
    // SOFT DELETE AWARE QUERIES
    // =================================================================

    /**
     * Find all non-deleted schedules (paginated)
     */
    Page<ComplianceSchedule> findByIsDeletedFalse(Pageable pageable);

    /**
     * Count non-deleted schedules by status
     */
    long countByStatusAndIsDeletedFalse(ComplianceScheduleStatus status);

    /**
     * Count all non-deleted schedules
     */
    long countByIsDeletedFalse();

    /**
     * Count schedules by category (non-deleted)
     */
    @Query("""
        SELECT COUNT(cs) FROM ComplianceSchedule cs
        JOIN cs.requirement cr
        WHERE cr.category = :category
        AND cs.isDeleted = false
        """)
    long countByCategoryAndIsDeletedFalse(@Param("category") ComplianceCategory category);

    /**
     * Find schedules with filters (simplified for service)
     */
    @Query("""
        SELECT cs FROM ComplianceSchedule cs
        JOIN cs.requirement cr
        WHERE cs.isDeleted = false
        AND (:propertyId IS NULL OR cs.property.id = :propertyId)
        AND (:category IS NULL OR cr.category = :category)
        AND (:status IS NULL OR cs.status = :status)
        ORDER BY cs.dueDate ASC
        """)
    Page<ComplianceSchedule> findWithFilters(
        @Param("propertyId") UUID propertyId,
        @Param("category") ComplianceCategory category,
        @Param("status") ComplianceScheduleStatus status,
        Pageable pageable
    );

    // =================================================================
    // SCHEDULE NUMBER GENERATION
    // =================================================================

    /**
     * Get next sequence value for schedule number generation
     */
    @Query(value = "SELECT nextval('compliance_schedule_number_seq')", nativeQuery = true)
    Long getNextScheduleNumberSequence();

    // =================================================================
    // EXISTENCE CHECKS
    // =================================================================

    /**
     * Check if active schedule exists for property-requirement combo
     */
    @Query("""
        SELECT COUNT(cs) > 0 FROM ComplianceSchedule cs
        WHERE cs.property.id = :propertyId
        AND cs.requirement.id = :requirementId
        AND cs.status <> :excludeStatus
        AND cs.isDeleted = false
        """)
    boolean existsByPropertyIdAndRequirementIdAndStatusNot(
        @Param("propertyId") UUID propertyId,
        @Param("requirementId") UUID requirementId,
        @Param("excludeStatus") ComplianceScheduleStatus excludeStatus
    );

    /**
     * Check if schedule exists for property-requirement-dueDate combo
     */
    @Query("""
        SELECT COUNT(cs) > 0 FROM ComplianceSchedule cs
        WHERE cs.property.id = :propertyId
        AND cs.requirement.id = :requirementId
        AND cs.dueDate = :dueDate
        AND cs.isDeleted = false
        """)
    boolean existsByPropertyIdAndRequirementIdAndDueDateAndIsDeletedFalse(
        @Param("propertyId") UUID propertyId,
        @Param("requirementId") UUID requirementId,
        @Param("dueDate") LocalDate dueDate
    );

    // =================================================================
    // STATUS UPDATE QUERIES (FOR SCHEDULER)
    // =================================================================

    /**
     * Update UPCOMING schedules to DUE status (within 30 days of due date)
     */
    @Query("""
        UPDATE ComplianceSchedule cs
        SET cs.status = 'DUE'
        WHERE cs.status = 'UPCOMING'
        AND cs.dueDate <= :dueSoonDate
        AND cs.isDeleted = false
        """)
    @org.springframework.data.jpa.repository.Modifying
    int updateStatusToDue(@Param("dueSoonDate") LocalDate dueSoonDate);

    /**
     * Update DUE/UPCOMING schedules to OVERDUE status (past due date)
     */
    @Query("""
        UPDATE ComplianceSchedule cs
        SET cs.status = 'OVERDUE'
        WHERE cs.status IN ('UPCOMING', 'DUE')
        AND cs.dueDate < :today
        AND cs.isDeleted = false
        """)
    @org.springframework.data.jpa.repository.Modifying
    int updateStatusToOverdue(@Param("today") LocalDate today);
}
