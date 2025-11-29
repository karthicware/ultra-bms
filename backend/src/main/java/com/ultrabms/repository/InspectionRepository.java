package com.ultrabms.repository;

import com.ultrabms.entity.Inspection;
import com.ultrabms.entity.enums.InspectionResult;
import com.ultrabms.entity.enums.InspectionStatus;
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
 * Repository interface for Inspection entity.
 * Provides CRUD operations and custom queries for inspection management.
 *
 * Story 7.3: Compliance and Inspection Tracking
 * AC #44: Repositories with custom queries
 */
@Repository
public interface InspectionRepository extends JpaRepository<Inspection, UUID> {

    // =================================================================
    // FIND BY RELATIONSHIPS
    // =================================================================

    /**
     * Find inspections by compliance schedule
     *
     * @param complianceScheduleId Schedule UUID
     * @return List of inspections
     */
    List<Inspection> findByComplianceSchedule_Id(UUID complianceScheduleId);

    /**
     * Find inspections by property
     *
     * @param propertyId Property UUID
     * @return List of inspections
     */
    List<Inspection> findByProperty_Id(UUID propertyId);

    /**
     * Find inspections by property and status
     *
     * @param propertyId Property UUID
     * @param status     Inspection status
     * @return List of inspections
     */
    List<Inspection> findByProperty_IdAndStatus(UUID propertyId, InspectionStatus status);

    // =================================================================
    // STATUS-BASED QUERIES
    // =================================================================

    /**
     * Find inspections by status
     *
     * @param status Inspection status
     * @return List of inspections
     */
    List<Inspection> findByStatus(InspectionStatus status);

    /**
     * Find scheduled inspections
     *
     * @return List of scheduled inspections
     */
    default List<Inspection> findScheduled() {
        return findByStatus(InspectionStatus.SCHEDULED);
    }

    /**
     * Find inspections by result
     *
     * @param result Inspection result
     * @return List of inspections
     */
    List<Inspection> findByResult(InspectionResult result);

    // =================================================================
    // DATE-BASED QUERIES
    // =================================================================

    /**
     * Find inspections scheduled within a date range
     *
     * @param startDate Start date
     * @param endDate   End date
     * @return List of inspections
     */
    List<Inspection> findByScheduledDateBetween(LocalDate startDate, LocalDate endDate);

    /**
     * Find upcoming inspections (scheduled within next N days)
     *
     * @param today   Current date
     * @param endDate End date (today + N days)
     * @return List of upcoming inspections
     */
    @Query("""
        SELECT i FROM Inspection i
        WHERE i.status = 'SCHEDULED'
        AND i.scheduledDate BETWEEN :today AND :endDate
        ORDER BY i.scheduledDate ASC
        """)
    List<Inspection> findUpcomingInspections(
        @Param("today") LocalDate today,
        @Param("endDate") LocalDate endDate
    );

    // =================================================================
    // PAGINATED QUERIES
    // =================================================================

    /**
     * Find inspections with filters (paginated)
     *
     * @param propertyId           Optional property filter
     * @param complianceScheduleId Optional schedule filter
     * @param status               Optional status filter
     * @param result               Optional result filter
     * @param scheduledDateStart   Optional scheduled date start
     * @param scheduledDateEnd     Optional scheduled date end
     * @param pageable             Pagination info
     * @return Page of inspections
     */
    @Query("""
        SELECT i FROM Inspection i
        WHERE (:propertyId IS NULL OR i.property.id = :propertyId)
        AND (:complianceScheduleId IS NULL OR i.complianceSchedule.id = :complianceScheduleId)
        AND (:status IS NULL OR i.status = :status)
        AND (:result IS NULL OR i.result = :result)
        AND (:scheduledDateStart IS NULL OR i.scheduledDate >= :scheduledDateStart)
        AND (:scheduledDateEnd IS NULL OR i.scheduledDate <= :scheduledDateEnd)
        """)
    Page<Inspection> findWithFilters(
        @Param("propertyId") UUID propertyId,
        @Param("complianceScheduleId") UUID complianceScheduleId,
        @Param("status") InspectionStatus status,
        @Param("result") InspectionResult result,
        @Param("scheduledDateStart") LocalDate scheduledDateStart,
        @Param("scheduledDateEnd") LocalDate scheduledDateEnd,
        Pageable pageable
    );

    // =================================================================
    // COUNT QUERIES
    // =================================================================

    /**
     * Count inspections by status
     *
     * @param status Inspection status
     * @return Count
     */
    long countByStatus(InspectionStatus status);

    /**
     * Count inspections by result
     *
     * @param result Inspection result
     * @return Count
     */
    long countByResult(InspectionResult result);

    /**
     * Count upcoming inspections within days
     *
     * @param today   Current date
     * @param endDate End date
     * @return Count
     */
    @Query("""
        SELECT COUNT(i) FROM Inspection i
        WHERE i.status = 'SCHEDULED'
        AND i.scheduledDate BETWEEN :today AND :endDate
        """)
    long countUpcomingInspections(
        @Param("today") LocalDate today,
        @Param("endDate") LocalDate endDate
    );

    // =================================================================
    // DASHBOARD QUERIES
    // =================================================================

    /**
     * Count inspections by status for dashboard
     *
     * @return List of [status, count] arrays
     */
    @Query("""
        SELECT i.status, COUNT(i)
        FROM Inspection i
        GROUP BY i.status
        """)
    List<Object[]> countInspectionsByStatus();

    // =================================================================
    // SOFT DELETE AWARE QUERIES
    // =================================================================

    /**
     * Find all non-deleted inspections (paginated)
     */
    Page<Inspection> findByIsDeletedFalse(Pageable pageable);

    /**
     * Find inspections by property (paginated, non-deleted)
     */
    @Query("""
        SELECT i FROM Inspection i
        JOIN i.complianceSchedule cs
        WHERE cs.property.id = :propertyId
        AND i.isDeleted = false
        """)
    Page<Inspection> findByPropertyId(@Param("propertyId") UUID propertyId, Pageable pageable);

    /**
     * Count inspections by status (non-deleted only)
     */
    long countByStatusAndIsDeletedFalse(InspectionStatus status);

    /**
     * Find inspections with filters (simplified for service)
     */
    @Query("""
        SELECT i FROM Inspection i
        JOIN i.complianceSchedule cs
        WHERE i.isDeleted = false
        AND (:propertyId IS NULL OR cs.property.id = :propertyId)
        AND (:scheduleId IS NULL OR cs.id = :scheduleId)
        AND (:status IS NULL OR i.status = :status)
        AND (:fromDate IS NULL OR i.scheduledDate >= :fromDate)
        AND (:toDate IS NULL OR i.scheduledDate <= :toDate)
        ORDER BY i.scheduledDate DESC
        """)
    Page<Inspection> findWithFilters(
        @Param("propertyId") UUID propertyId,
        @Param("scheduleId") UUID scheduleId,
        @Param("status") InspectionStatus status,
        @Param("fromDate") LocalDate fromDate,
        @Param("toDate") LocalDate toDate,
        Pageable pageable
    );
}
