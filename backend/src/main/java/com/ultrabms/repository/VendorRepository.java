package com.ultrabms.repository;

import com.ultrabms.entity.Vendor;
import com.ultrabms.entity.enums.VendorStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for Vendor entity.
 * Provides CRUD operations and custom queries for vendor management.
 *
 * Story 5.1: Vendor Registration and Profile Management
 */
@Repository
public interface VendorRepository extends JpaRepository<Vendor, UUID> {

    // =================================================================
    // FIND BY UNIQUE IDENTIFIERS
    // =================================================================

    /**
     * Find vendor by email address (excluding deleted vendors)
     *
     * @param email Email address
     * @return Optional vendor
     */
    Optional<Vendor> findByEmailAndIsDeletedFalse(String email);

    /**
     * Find vendor by unique vendor number
     *
     * @param vendorNumber Vendor number (e.g., "VND-2025-0001")
     * @return Optional vendor
     */
    Optional<Vendor> findByVendorNumber(String vendorNumber);

    /**
     * Find the latest vendor number to generate next sequence
     * Used for auto-generating vendor numbers in format VND-{YEAR}-{SEQUENCE}
     *
     * @param prefix Vendor number prefix (e.g., "VND-2025-")
     * @return Optional latest vendor ordered by vendor number desc
     */
    @Query("SELECT v FROM Vendor v WHERE v.vendorNumber LIKE CONCAT(:prefix, '%') ORDER BY v.vendorNumber DESC LIMIT 1")
    Optional<Vendor> findTopByVendorNumberStartingWithOrderByVendorNumberDesc(@Param("prefix") String prefix);

    // =================================================================
    // EMAIL UNIQUENESS VALIDATION
    // =================================================================

    /**
     * Check if email exists for another vendor (excluding given vendor and deleted vendors)
     * Used for update validation
     *
     * @param email Email address
     * @param id    Vendor ID to exclude
     * @return True if email exists for another vendor
     */
    boolean existsByEmailAndIdNotAndIsDeletedFalse(String email, UUID id);

    /**
     * Check if email exists for any non-deleted vendor
     * Used for create validation
     *
     * @param email Email address
     * @return True if email exists
     */
    boolean existsByEmailAndIsDeletedFalse(String email);

    // =================================================================
    // LIST QUERIES (EXCLUDING DELETED)
    // =================================================================

    /**
     * Find all non-deleted vendors with pagination
     *
     * @param pageable Pagination parameters
     * @return Page of vendors
     */
    Page<Vendor> findByIsDeletedFalse(Pageable pageable);

    /**
     * Find vendors by status (excluding deleted)
     *
     * @param status   Vendor status
     * @param pageable Pagination parameters
     * @return Page of vendors
     */
    Page<Vendor> findByStatusAndIsDeletedFalse(VendorStatus status, Pageable pageable);

    /**
     * Find active vendors for work order assignment
     *
     * @param status   ACTIVE status
     * @param pageable Pagination parameters
     * @return Page of active vendors
     */
    Page<Vendor> findByStatusAndIsDeletedFalseOrderByCompanyNameAsc(VendorStatus status, Pageable pageable);

    // =================================================================
    // SEARCH QUERIES
    // =================================================================

    /**
     * Search vendors by company name, contact person, or vendor number (case-insensitive)
     * Excludes deleted vendors
     *
     * @param searchTerm Search term
     * @param pageable   Pagination parameters
     * @return Page of matching vendors
     */
    @Query("SELECT v FROM Vendor v WHERE v.isDeleted = false AND " +
            "(LOWER(v.companyName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(v.contactPersonName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(v.vendorNumber) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    Page<Vendor> searchByKeyword(@Param("searchTerm") String searchTerm, Pageable pageable);

    /**
     * Advanced search with multiple filters
     *
     * @param searchTerm Search term for company name, contact person, vendor number (optional)
     * @param status     Vendor status (optional)
     * @param minRating  Minimum rating (optional)
     * @param pageable   Pagination parameters
     * @return Page of matching vendors
     */
    @Query("SELECT v FROM Vendor v WHERE v.isDeleted = false AND " +
            "(:searchTerm IS NULL OR :searchTerm = '' OR " +
            "LOWER(v.companyName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(v.contactPersonName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(v.vendorNumber) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) AND " +
            "(:status IS NULL OR v.status = :status) AND " +
            "(:minRating IS NULL OR v.rating >= :minRating)")
    Page<Vendor> searchWithFilters(
            @Param("searchTerm") String searchTerm,
            @Param("status") VendorStatus status,
            @Param("minRating") BigDecimal minRating,
            Pageable pageable);

    // =================================================================
    // SERVICE CATEGORY QUERIES (JSONB)
    // =================================================================

    /**
     * Find vendors that provide a specific service category
     * Uses PostgreSQL JSONB containment operator
     *
     * @param category Service category
     * @param status   Vendor status (typically ACTIVE)
     * @param pageable Pagination parameters
     * @return Page of vendors providing the service
     */
    @Query(value = "SELECT * FROM vendors v WHERE v.is_deleted = false AND " +
            "v.status = :#{#status.name()} AND " +
            "v.service_categories @> :categoryJson::jsonb",
            countQuery = "SELECT COUNT(*) FROM vendors v WHERE v.is_deleted = false AND " +
                    "v.status = :#{#status.name()} AND " +
                    "v.service_categories @> :categoryJson::jsonb",
            nativeQuery = true)
    Page<Vendor> findByServiceCategoryAndStatus(
            @Param("categoryJson") String categoryJson,
            @Param("status") VendorStatus status,
            Pageable pageable);

    /**
     * Find active vendors for a specific service category
     * Convenience method for work order assignment
     *
     * @param category Service category to match
     * @return List of active vendors providing the service
     */
    @Query(value = "SELECT * FROM vendors v WHERE v.is_deleted = false AND " +
            "v.status = 'ACTIVE' AND " +
            "v.service_categories @> :categoryJson::jsonb " +
            "ORDER BY v.rating DESC, v.company_name ASC",
            nativeQuery = true)
    List<Vendor> findActiveVendorsByServiceCategory(@Param("categoryJson") String categoryJson);

    // =================================================================
    // ANALYTICS AND COUNTS
    // =================================================================

    /**
     * Count non-deleted vendors
     *
     * @return Total vendor count
     */
    long countByIsDeletedFalse();

    /**
     * Count vendors by status (excluding deleted)
     *
     * @param status Vendor status
     * @return Count of vendors with status
     */
    long countByStatusAndIsDeletedFalse(VendorStatus status);

    /**
     * Count vendors with minimum rating (excluding deleted)
     *
     * @param minRating Minimum rating
     * @return Count of vendors meeting rating threshold
     */
    @Query("SELECT COUNT(v) FROM Vendor v WHERE v.isDeleted = false AND v.rating >= :minRating")
    long countByMinRating(@Param("minRating") BigDecimal minRating);

    /**
     * Get top-rated vendors
     *
     * @param minRating Minimum rating threshold
     * @param limit     Maximum number of results
     * @return List of top-rated vendors
     */
    @Query("SELECT v FROM Vendor v WHERE v.isDeleted = false AND v.status = 'ACTIVE' AND v.rating >= :minRating " +
            "ORDER BY v.rating DESC, v.totalJobsCompleted DESC")
    List<Vendor> findTopRatedVendors(@Param("minRating") BigDecimal minRating, Pageable pageable);

    // =================================================================
    // EXISTENCE CHECKS
    // =================================================================

    /**
     * Check if vendor number already exists
     *
     * @param vendorNumber Vendor number
     * @return True if exists
     */
    boolean existsByVendorNumber(String vendorNumber);

    /**
     * Check if vendor exists and is active
     *
     * @param id     Vendor UUID
     * @param status Expected status
     * @return True if vendor exists with status
     */
    boolean existsByIdAndStatusAndIsDeletedFalse(UUID id, VendorStatus status);

    // =================================================================
    // VENDOR NUMBER GENERATION
    // =================================================================

    /**
     * Get next vendor number sequence value from database
     * Uses PostgreSQL sequence for atomic increment
     *
     * @return Next sequence value
     */
    @Query(value = "SELECT nextval('vendor_number_seq')", nativeQuery = true)
    Long getNextVendorNumberSequence();

    /**
     * Reset vendor number sequence for new year
     * Should be called at the beginning of each year
     *
     * @param newValue New starting value (typically 1)
     */
    @Query(value = "SELECT setval('vendor_number_seq', :newValue, false)", nativeQuery = true)
    void resetVendorNumberSequence(@Param("newValue") Long newValue);

    // =================================================================
    // VENDOR RANKING QUERIES (Story 5.3)
    // =================================================================

    /**
     * Find vendors by status with pagination
     *
     * @param status   Vendor status
     * @param pageable Pagination and sorting
     * @return Page of vendors
     */
    @Query("SELECT v FROM Vendor v WHERE v.isDeleted = false AND v.status = :status")
    Page<Vendor> findByStatus(@Param("status") VendorStatus status, Pageable pageable);

    /**
     * Find vendors by status and service category containing a specific category
     *
     * @param status   Vendor status
     * @param category Service category to match
     * @param pageable Pagination and sorting
     * @return Page of vendors
     */
    @Query(value = "SELECT * FROM vendors v WHERE v.is_deleted = false AND " +
            "v.status = :#{#status.name()} AND " +
            "v.service_categories @> :categoryJson::jsonb",
            countQuery = "SELECT COUNT(*) FROM vendors v WHERE v.is_deleted = false AND " +
                    "v.status = :#{#status.name()} AND " +
                    "v.service_categories @> :categoryJson::jsonb",
            nativeQuery = true)
    Page<Vendor> findByStatusAndServiceCategoriesContaining(
            @Param("status") VendorStatus status,
            @Param("categoryJson") String categoryJson,
            Pageable pageable);
}
