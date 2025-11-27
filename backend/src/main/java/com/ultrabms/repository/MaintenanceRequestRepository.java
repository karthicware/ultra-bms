package com.ultrabms.repository;

import com.ultrabms.entity.MaintenanceRequest;
import com.ultrabms.entity.enums.MaintenanceCategory;
import com.ultrabms.entity.enums.MaintenanceStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for MaintenanceRequest entity.
 * Provides CRUD operations and custom queries for tenant maintenance request
 * management.
 *
 * Story 3.5: Tenant Portal - Maintenance Request Submission
 */
@Repository
public interface MaintenanceRequestRepository extends JpaRepository<MaintenanceRequest, UUID> {

    // =================================================================
    // FIND BY REQUEST NUMBER
    // =================================================================

    /**
     * Find maintenance request by unique request number
     *
     * @param requestNumber Request number (e.g., "MR-2025-0001")
     * @return Optional maintenance request
     */
    Optional<MaintenanceRequest> findByRequestNumber(String requestNumber);

    /**
     * Find the latest request number to generate next sequence
     * Used for auto-generating request numbers in format MR-{YEAR}-{SEQUENCE}
     *
     * @return Optional latest maintenance request ordered by request number desc
     */
    Optional<MaintenanceRequest> findTopByOrderByRequestNumberDesc();

    // =================================================================
    // TENANT QUERIES
    // =================================================================

    /**
     * Find all maintenance requests for a specific tenant, ordered by submission
     * date (newest first)
     * Primary query for tenant portal "My Requests" list
     *
     * @param tenantId Tenant UUID
     * @param pageable Pagination parameters
     * @return Page of maintenance requests
     */
    Page<MaintenanceRequest> findByTenantIdOrderBySubmittedAtDesc(UUID tenantId, Pageable pageable);

    /**
     * Find maintenance requests by tenant and status filter (multiple statuses)
     * Used for filtering requests by status (e.g., "Open" = SUBMITTED + ASSIGNED)
     *
     * @param tenantId Tenant UUID
     * @param statuses List of statuses to filter by
     * @param pageable Pagination parameters
     * @return Page of matching maintenance requests
     */
    Page<MaintenanceRequest> findByTenantIdAndStatusIn(UUID tenantId, List<MaintenanceStatus> statuses,
            Pageable pageable);

    /**
     * Find maintenance requests by tenant and category filter (multiple categories)
     * Used for filtering requests by category (e.g., PLUMBING, ELECTRICAL)
     *
     * @param tenantId   Tenant UUID
     * @param categories List of categories to filter by
     * @param pageable   Pagination parameters
     * @return Page of matching maintenance requests
     */
    Page<MaintenanceRequest> findByTenantIdAndCategoryIn(UUID tenantId, List<MaintenanceCategory> categories,
            Pageable pageable);

    /**
     * Search maintenance requests by title or description (case-insensitive)
     * Supports partial matching for tenant portal search
     *
     * @param tenantId   Tenant UUID
     * @param searchTerm Search term to match against title or description
     * @param pageable   Pagination parameters
     * @return Page of matching maintenance requests
     */
    @Query("SELECT mr FROM MaintenanceRequest mr WHERE mr.tenantId = :tenantId AND " +
            "(LOWER(mr.title) LIKE LOWER(CAST(:searchTerm AS string)) OR " +
            "LOWER(mr.description) LIKE LOWER(CAST(:searchTerm AS string)) OR " +
            "LOWER(mr.requestNumber) LIKE LOWER(CAST(:searchTerm AS string)))")
    Page<MaintenanceRequest> searchByTenantIdAndKeyword(
            @Param("tenantId") UUID tenantId,
            @Param("searchTerm") String searchTerm,
            Pageable pageable);

    // =================================================================
    // COMBINED FILTERS
    // =================================================================

    /**
     * Advanced search with multiple filters: status, category, and search term
     * Used for tenant portal advanced filtering
     *
     * @param tenantId   Tenant UUID
     * @param statuses   List of statuses (optional, can be empty)
     * @param categories List of categories (optional, can be empty)
     * @param searchTerm Search term for title/description/requestNumber
     * @param pageable   Pagination parameters
     * @return Page of matching maintenance requests
     */
    @Query("SELECT mr FROM MaintenanceRequest mr WHERE mr.tenantId = :tenantId " +
            "AND (:#{#statuses == null || #statuses.isEmpty()} = true OR mr.status IN :statuses) " +
            "AND (:#{#categories == null || #categories.isEmpty()} = true OR mr.category IN :categories) " +
            "AND (:#{#searchTerm == null} = true OR " +
            "LOWER(mr.title) LIKE LOWER(CAST(:searchTerm AS string)) OR " +
            "LOWER(mr.description) LIKE LOWER(CAST(:searchTerm AS string)) OR " +
            "LOWER(mr.requestNumber) LIKE LOWER(CAST(:searchTerm AS string)))")
    Page<MaintenanceRequest> searchWithFilters(
            @Param("tenantId") UUID tenantId,
            @Param("statuses") List<MaintenanceStatus> statuses,
            @Param("categories") List<MaintenanceCategory> categories,
            @Param("searchTerm") String searchTerm,
            Pageable pageable);

    // =================================================================
    // PROPERTY MANAGER QUERIES
    // =================================================================

    /**
     * Find all maintenance requests for a property (for property manager view)
     *
     * @param propertyId Property UUID
     * @param pageable   Pagination parameters
     * @return Page of maintenance requests
     */
    Page<MaintenanceRequest> findByPropertyIdOrderBySubmittedAtDesc(UUID propertyId, Pageable pageable);

    /**
     * Find maintenance requests by property and status
     *
     * @param propertyId Property UUID
     * @param statuses   List of statuses
     * @param pageable   Pagination parameters
     * @return Page of matching maintenance requests
     */
    Page<MaintenanceRequest> findByPropertyIdAndStatusIn(UUID propertyId, List<MaintenanceStatus> statuses,
            Pageable pageable);

    /**
     * Find all unassigned requests for a property (status = SUBMITTED)
     * Used by property manager to view pending assignments
     *
     * @param propertyId Property UUID
     * @param status     Status (SUBMITTED)
     * @return List of unassigned maintenance requests
     */
    List<MaintenanceRequest> findByPropertyIdAndStatus(UUID propertyId, MaintenanceStatus status);

    // =================================================================
    // VENDOR QUERIES
    // =================================================================

    /**
     * Find all maintenance requests assigned to a specific vendor
     *
     * @param vendorId Vendor UUID
     * @param pageable Pagination parameters
     * @return Page of assigned maintenance requests
     */
    Page<MaintenanceRequest> findByAssignedToOrderBySubmittedAtDesc(UUID vendorId, Pageable pageable);

    /**
     * Find vendor's requests by status
     *
     * @param vendorId Vendor UUID
     * @param statuses List of statuses
     * @param pageable Pagination parameters
     * @return Page of matching maintenance requests
     */
    Page<MaintenanceRequest> findByAssignedToAndStatusIn(UUID vendorId, List<MaintenanceStatus> statuses,
            Pageable pageable);

    // =================================================================
    // UNIT QUERIES
    // =================================================================

    /**
     * Find all maintenance requests for a specific unit
     * Useful for unit history and analytics
     *
     * @param unitId   Unit UUID
     * @param pageable Pagination parameters
     * @return Page of maintenance requests
     */
    Page<MaintenanceRequest> findByUnitIdOrderBySubmittedAtDesc(UUID unitId, Pageable pageable);

    // =================================================================
    // ANALYTICS AND COUNTS
    // =================================================================

    /**
     * Count maintenance requests by tenant
     *
     * @param tenantId Tenant UUID
     * @return Count of requests
     */
    long countByTenantId(UUID tenantId);

    /**
     * Count maintenance requests by tenant and status
     * Used for dashboard statistics (e.g., "Open Requests" count)
     *
     * @param tenantId Tenant UUID
     * @param status   Status enum
     * @return Count of requests matching status
     */
    long countByTenantIdAndStatus(UUID tenantId, MaintenanceStatus status);

    /**
     * Count maintenance requests by tenant and status in list
     * Used for "Open" count (SUBMITTED + ASSIGNED + IN_PROGRESS)
     *
     * @param tenantId Tenant UUID
     * @param statuses List of statuses
     * @return Count of requests matching statuses
     */
    long countByTenantIdAndStatusIn(UUID tenantId, List<MaintenanceStatus> statuses);

    /**
     * Count maintenance requests by category for analytics
     * Used by property managers to identify common issues
     *
     * @param propertyId Property UUID
     * @param category   Category enum
     * @return Count of requests in category
     */
    long countByPropertyIdAndCategory(UUID propertyId, MaintenanceCategory category);

    // =================================================================
    // EXISTENCE CHECKS
    // =================================================================

    /**
     * Check if request number already exists
     * Used for validation during request creation
     *
     * @param requestNumber Request number
     * @return True if exists
     */
    boolean existsByRequestNumber(String requestNumber);

    /**
     * Check if tenant has any requests in SUBMITTED status
     *
     * @param tenantId Tenant UUID
     * @param status   Status (SUBMITTED)
     * @return True if tenant has submitted requests awaiting assignment
     */
    boolean existsByTenantIdAndStatus(UUID tenantId, MaintenanceStatus status);
}
