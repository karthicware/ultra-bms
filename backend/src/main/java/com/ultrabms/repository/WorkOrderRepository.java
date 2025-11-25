package com.ultrabms.repository;

import com.ultrabms.entity.WorkOrder;
import com.ultrabms.entity.enums.WorkOrderCategory;
import com.ultrabms.entity.enums.WorkOrderPriority;
import com.ultrabms.entity.enums.WorkOrderStatus;
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
 * Repository interface for WorkOrder entity.
 * Provides CRUD operations and custom queries for work order management.
 *
 * Story 4.1: Work Order Creation and Management
 */
@Repository
public interface WorkOrderRepository extends JpaRepository<WorkOrder, UUID> {

    // =================================================================
    // FIND BY WORK ORDER NUMBER
    // =================================================================

    /**
     * Find work order by unique work order number
     *
     * @param workOrderNumber Work order number (e.g., "WO-2025-0001")
     * @return Optional work order
     */
    Optional<WorkOrder> findByWorkOrderNumber(String workOrderNumber);

    /**
     * Find the latest work order number to generate next sequence
     * Used for auto-generating work order numbers in format WO-{YEAR}-{SEQUENCE}
     *
     * @return Optional latest work order ordered by work order number desc
     */
    Optional<WorkOrder> findTopByOrderByWorkOrderNumberDesc();

    // =================================================================
    // PROPERTY AND UNIT QUERIES
    // =================================================================

    /**
     * Find all work orders for a specific property, ordered by scheduled date (newest first)
     * Primary query for property manager work order list
     *
     * @param propertyId Property UUID
     * @param pageable   Pagination parameters
     * @return Page of work orders
     */
    Page<WorkOrder> findByPropertyIdOrderByScheduledDateDesc(UUID propertyId, Pageable pageable);

    /**
     * Find work orders by property and status filter (multiple statuses)
     *
     * @param propertyId Property UUID
     * @param statuses   List of statuses to filter by
     * @param pageable   Pagination parameters
     * @return Page of matching work orders
     */
    Page<WorkOrder> findByPropertyIdAndStatusIn(UUID propertyId, List<WorkOrderStatus> statuses, Pageable pageable);

    /**
     * Find work orders by property and category filter (multiple categories)
     *
     * @param propertyId Property UUID
     * @param categories List of categories to filter by
     * @param pageable   Pagination parameters
     * @return Page of matching work orders
     */
    Page<WorkOrder> findByPropertyIdAndCategoryIn(UUID propertyId, List<WorkOrderCategory> categories,
            Pageable pageable);

    /**
     * Find work orders by property and priority filter (multiple priorities)
     *
     * @param propertyId Property UUID
     * @param priorities List of priorities to filter by
     * @param pageable   Pagination parameters
     * @return Page of matching work orders
     */
    Page<WorkOrder> findByPropertyIdAndPriorityIn(UUID propertyId, List<WorkOrderPriority> priorities,
            Pageable pageable);

    /**
     * Find all work orders for a specific unit
     *
     * @param unitId   Unit UUID
     * @param pageable Pagination parameters
     * @return Page of work orders
     */
    Page<WorkOrder> findByUnitIdOrderByScheduledDateDesc(UUID unitId, Pageable pageable);

    // =================================================================
    // SEARCH QUERIES
    // =================================================================

    /**
     * Search work orders by work order number, title, or description (case-insensitive)
     *
     * @param propertyId Property UUID (optional filtering by property)
     * @param searchTerm Search term to match
     * @param pageable   Pagination parameters
     * @return Page of matching work orders
     */
    @Query("SELECT wo FROM WorkOrder wo WHERE " +
            "(:propertyId IS NULL OR wo.propertyId = :propertyId) AND " +
            "(LOWER(wo.workOrderNumber) LIKE LOWER(CAST(:searchTerm AS string)) OR " +
            "LOWER(wo.title) LIKE LOWER(CAST(:searchTerm AS string)) OR " +
            "LOWER(wo.description) LIKE LOWER(CAST(:searchTerm AS string)))")
    Page<WorkOrder> searchByKeyword(
            @Param("propertyId") UUID propertyId,
            @Param("searchTerm") String searchTerm,
            Pageable pageable);

    /**
     * Advanced search with multiple filters: property, status, category, priority, date range
     *
     * @param propertyId Property UUID (optional)
     * @param statuses   List of statuses (optional)
     * @param categories List of categories (optional)
     * @param priorities List of priorities (optional)
     * @param startDate  Start date for scheduled date range (optional)
     * @param endDate    End date for scheduled date range (optional)
     * @param searchTerm Search term for work order number/title/description (optional)
     * @param pageable   Pagination parameters
     * @return Page of matching work orders
     */
    @Query("SELECT wo FROM WorkOrder wo WHERE " +
            "(:propertyId IS NULL OR wo.propertyId = :propertyId) AND " +
            "(:statuses IS NULL OR wo.status IN :statuses) AND " +
            "(:categories IS NULL OR wo.category IN :categories) AND " +
            "(:priorities IS NULL OR wo.priority IN :priorities) AND " +
            "(:startDate IS NULL OR wo.scheduledDate >= :startDate) AND " +
            "(:endDate IS NULL OR wo.scheduledDate <= :endDate) AND " +
            "(:searchTerm IS NULL OR " +
            "LOWER(wo.workOrderNumber) LIKE LOWER(CAST(:searchTerm AS string)) OR " +
            "LOWER(wo.title) LIKE LOWER(CAST(:searchTerm AS string)) OR " +
            "LOWER(wo.description) LIKE LOWER(CAST(:searchTerm AS string)))")
    Page<WorkOrder> searchWithFilters(
            @Param("propertyId") UUID propertyId,
            @Param("statuses") List<WorkOrderStatus> statuses,
            @Param("categories") List<WorkOrderCategory> categories,
            @Param("priorities") List<WorkOrderPriority> priorities,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("searchTerm") String searchTerm,
            Pageable pageable);

    // =================================================================
    // ASSIGNMENT QUERIES
    // =================================================================

    /**
     * Find all unassigned work orders (status = OPEN)
     *
     * @param status   Status (OPEN)
     * @param pageable Pagination parameters
     * @return Page of unassigned work orders
     */
    Page<WorkOrder> findByStatusOrderByScheduledDateAsc(WorkOrderStatus status, Pageable pageable);

    /**
     * Find unassigned work orders for a property
     *
     * @param propertyId Property UUID
     * @param status     Status (OPEN)
     * @return List of unassigned work orders
     */
    List<WorkOrder> findByPropertyIdAndStatus(UUID propertyId, WorkOrderStatus status);

    /**
     * Find all work orders assigned to a specific vendor/staff member
     *
     * @param assignedTo Vendor/staff UUID
     * @param pageable   Pagination parameters
     * @return Page of assigned work orders
     */
    Page<WorkOrder> findByAssignedToOrderByScheduledDateAsc(UUID assignedTo, Pageable pageable);

    /**
     * Find work orders by assignee and status
     *
     * @param assignedTo Vendor/staff UUID
     * @param statuses   List of statuses
     * @param pageable   Pagination parameters
     * @return Page of matching work orders
     */
    Page<WorkOrder> findByAssignedToAndStatusIn(UUID assignedTo, List<WorkOrderStatus> statuses, Pageable pageable);

    // =================================================================
    // MAINTENANCE REQUEST LINK
    // =================================================================

    /**
     * Find work order created from a specific maintenance request
     *
     * @param maintenanceRequestId Maintenance request UUID
     * @return Optional work order
     */
    Optional<WorkOrder> findByMaintenanceRequestId(UUID maintenanceRequestId);

    /**
     * Check if a work order already exists for a maintenance request
     *
     * @param maintenanceRequestId Maintenance request UUID
     * @return True if work order exists
     */
    boolean existsByMaintenanceRequestId(UUID maintenanceRequestId);

    // =================================================================
    // ANALYTICS AND COUNTS
    // =================================================================

    /**
     * Count work orders by property
     *
     * @param propertyId Property UUID
     * @return Count of work orders
     */
    long countByPropertyId(UUID propertyId);

    /**
     * Count work orders by property and status
     *
     * @param propertyId Property UUID
     * @param status     Status enum
     * @return Count of work orders matching status
     */
    long countByPropertyIdAndStatus(UUID propertyId, WorkOrderStatus status);

    /**
     * Count work orders by property and status in list
     *
     * @param propertyId Property UUID
     * @param statuses   List of statuses
     * @return Count of work orders matching statuses
     */
    long countByPropertyIdAndStatusIn(UUID propertyId, List<WorkOrderStatus> statuses);

    /**
     * Count work orders by category for analytics
     *
     * @param propertyId Property UUID
     * @param category   Category enum
     * @return Count of work orders in category
     */
    long countByPropertyIdAndCategory(UUID propertyId, WorkOrderCategory category);

    /**
     * Count work orders by priority for analytics
     *
     * @param propertyId Property UUID
     * @param priority   Priority enum
     * @return Count of work orders with priority
     */
    long countByPropertyIdAndPriority(UUID propertyId, WorkOrderPriority priority);

    /**
     * Count overdue work orders (scheduled date in past, status not COMPLETED or CLOSED)
     *
     * @param propertyId Property UUID
     * @param now        Current timestamp
     * @param statuses   List of non-completed statuses (OPEN, ASSIGNED, IN_PROGRESS)
     * @return Count of overdue work orders
     */
    @Query("SELECT COUNT(wo) FROM WorkOrder wo WHERE wo.propertyId = :propertyId AND " +
            "wo.scheduledDate < :now AND wo.status IN :statuses")
    long countOverdueWorkOrders(
            @Param("propertyId") UUID propertyId,
            @Param("now") LocalDateTime now,
            @Param("statuses") List<WorkOrderStatus> statuses);

    // =================================================================
    // EXISTENCE CHECKS
    // =================================================================

    /**
     * Check if work order number already exists
     *
     * @param workOrderNumber Work order number
     * @return True if exists
     */
    boolean existsByWorkOrderNumber(String workOrderNumber);

    /**
     * Check if property has any open work orders
     *
     * @param propertyId Property UUID
     * @param status     Status (OPEN)
     * @return True if property has open work orders
     */
    boolean existsByPropertyIdAndStatus(UUID propertyId, WorkOrderStatus status);
}
