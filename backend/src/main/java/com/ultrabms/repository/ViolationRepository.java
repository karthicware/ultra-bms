package com.ultrabms.repository;

import com.ultrabms.entity.Violation;
import com.ultrabms.entity.enums.FineStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for Violation entity.
 * Provides CRUD operations and custom queries for violation management.
 *
 * Story 7.3: Compliance and Inspection Tracking
 * AC #44: Repositories with custom queries
 */
@Repository
public interface ViolationRepository extends JpaRepository<Violation, UUID> {

    // =================================================================
    // FIND BY UNIQUE IDENTIFIERS
    // =================================================================

    /**
     * Find violation by unique violation number
     *
     * @param violationNumber Violation number (e.g., "VIO-2025-0001")
     * @return Optional violation
     */
    Optional<Violation> findByViolationNumber(String violationNumber);

    /**
     * Find the latest violation number to generate next sequence
     * Used for auto-generating violation numbers in format VIO-{YEAR}-{SEQUENCE}
     *
     * @param prefix Violation number prefix (e.g., "VIO-2025-")
     * @return Optional latest violation ordered by violation number desc
     */
    @Query("SELECT v FROM Violation v WHERE v.violationNumber LIKE CONCAT(:prefix, '%') ORDER BY v.violationNumber DESC LIMIT 1")
    Optional<Violation> findTopByViolationNumberStartingWithOrderByViolationNumberDesc(@Param("prefix") String prefix);

    // =================================================================
    // FIND BY RELATIONSHIPS
    // =================================================================

    /**
     * Find violations by compliance schedule
     *
     * @param complianceScheduleId Schedule UUID
     * @return List of violations
     */
    List<Violation> findByComplianceSchedule_Id(UUID complianceScheduleId);

    // =================================================================
    // STATUS-BASED QUERIES
    // =================================================================

    /**
     * Find violations by fine status
     *
     * @param fineStatus Fine status
     * @return List of violations
     */
    List<Violation> findByFineStatus(FineStatus fineStatus);

    /**
     * Find pending violations (unpaid fines)
     *
     * @return List of pending violations
     */
    default List<Violation> findPendingViolations() {
        return findByFineStatus(FineStatus.PENDING);
    }

    /**
     * Find unresolved violations (no resolution date)
     *
     * @return List of unresolved violations
     */
    List<Violation> findByResolutionDateIsNull();

    // =================================================================
    // DATE-BASED QUERIES
    // =================================================================

    /**
     * Find violations within a date range
     *
     * @param startDate Start date
     * @param endDate   End date
     * @return List of violations
     */
    List<Violation> findByViolationDateBetween(LocalDate startDate, LocalDate endDate);

    /**
     * Find recent violations (last N days)
     *
     * @param startDate Start date (today - N days)
     * @return List of recent violations ordered by date desc
     */
    @Query("""
        SELECT v FROM Violation v
        WHERE v.violationDate >= :startDate
        ORDER BY v.violationDate DESC
        """)
    List<Violation> findRecentViolations(@Param("startDate") LocalDate startDate);

    /**
     * Find recent violations with limit
     *
     * @param startDate Start date
     * @param limit     Max number of violations
     * @return List of recent violations
     */
    @Query(value = """
        SELECT v.* FROM violations v
        WHERE v.violation_date >= :startDate
        ORDER BY v.violation_date DESC
        LIMIT :limit
        """, nativeQuery = true)
    List<Violation> findRecentViolationsWithLimit(
        @Param("startDate") LocalDate startDate,
        @Param("limit") int limit
    );

    // =================================================================
    // PAGINATED QUERIES
    // =================================================================

    /**
     * Find violations with filters (paginated)
     *
     * @param complianceScheduleId Optional schedule filter
     * @param fineStatus           Optional fine status filter
     * @param violationDateStart   Optional violation date start
     * @param violationDateEnd     Optional violation date end
     * @param pageable             Pagination info
     * @return Page of violations
     */
    @Query("""
        SELECT v FROM Violation v
        WHERE (:complianceScheduleId IS NULL OR v.complianceSchedule.id = :complianceScheduleId)
        AND (:fineStatus IS NULL OR v.fineStatus = :fineStatus)
        AND (:violationDateStart IS NULL OR v.violationDate >= :violationDateStart)
        AND (:violationDateEnd IS NULL OR v.violationDate <= :violationDateEnd)
        """)
    Page<Violation> findWithFilters(
        @Param("complianceScheduleId") UUID complianceScheduleId,
        @Param("fineStatus") FineStatus fineStatus,
        @Param("violationDateStart") LocalDate violationDateStart,
        @Param("violationDateEnd") LocalDate violationDateEnd,
        Pageable pageable
    );

    // =================================================================
    // COUNT QUERIES
    // =================================================================

    /**
     * Count violations by fine status
     *
     * @param fineStatus Fine status
     * @return Count
     */
    long countByFineStatus(FineStatus fineStatus);

    /**
     * Count recent violations (last N days)
     *
     * @param startDate Start date
     * @return Count
     */
    @Query("""
        SELECT COUNT(v) FROM Violation v
        WHERE v.violationDate >= :startDate
        """)
    long countRecentViolations(@Param("startDate") LocalDate startDate);

    /**
     * Count violations by compliance schedule
     *
     * @param complianceScheduleId Schedule UUID
     * @return Count
     */
    long countByComplianceSchedule_Id(UUID complianceScheduleId);

    // =================================================================
    // SOFT DELETE AWARE QUERIES
    // =================================================================

    /**
     * Find all non-deleted violations (paginated)
     */
    Page<Violation> findByIsDeletedFalse(Pageable pageable);

    /**
     * Count violations by fine status (non-deleted only)
     */
    long countByFineStatusAndIsDeletedFalse(FineStatus fineStatus);

    /**
     * Find violations by property (paginated, non-deleted)
     */
    @Query("""
        SELECT v FROM Violation v
        JOIN v.complianceSchedule cs
        WHERE cs.property.id = :propertyId
        AND v.isDeleted = false
        ORDER BY v.violationDate DESC
        """)
    Page<Violation> findByPropertyId(@Param("propertyId") UUID propertyId, Pageable pageable);

    /**
     * Find violations with filters (includes propertyId)
     */
    @Query("""
        SELECT v FROM Violation v
        JOIN v.complianceSchedule cs
        WHERE v.isDeleted = false
        AND (:propertyId IS NULL OR cs.property.id = :propertyId)
        AND (:scheduleId IS NULL OR cs.id = :scheduleId)
        AND (:fineStatus IS NULL OR v.fineStatus = :fineStatus)
        AND (:fromDate IS NULL OR v.violationDate >= :fromDate)
        AND (:toDate IS NULL OR v.violationDate <= :toDate)
        ORDER BY v.violationDate DESC
        """)
    Page<Violation> findWithFilters(
        @Param("propertyId") UUID propertyId,
        @Param("scheduleId") UUID scheduleId,
        @Param("fineStatus") FineStatus fineStatus,
        @Param("fromDate") LocalDate fromDate,
        @Param("toDate") LocalDate toDate,
        Pageable pageable
    );

    // =================================================================
    // VIOLATION NUMBER GENERATION
    // =================================================================

    /**
     * Get next sequence value for violation number generation
     */
    @Query(value = "SELECT nextval('violation_number_seq')", nativeQuery = true)
    Long getNextViolationNumberSequence();
}
