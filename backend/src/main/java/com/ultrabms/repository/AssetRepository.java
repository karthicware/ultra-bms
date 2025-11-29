package com.ultrabms.repository;

import com.ultrabms.entity.Asset;
import com.ultrabms.entity.enums.AssetCategory;
import com.ultrabms.entity.enums.AssetStatus;
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
 * Repository interface for Asset entity.
 * Provides CRUD operations and custom queries for asset management.
 *
 * Story 7.1: Asset Registry and Tracking
 * AC #29: AssetRepository with custom queries for filters, search, expiry check
 */
@Repository
public interface AssetRepository extends JpaRepository<Asset, UUID> {

    // =================================================================
    // FIND BY UNIQUE IDENTIFIERS
    // =================================================================

    /**
     * Find asset by unique asset number
     *
     * @param assetNumber Asset number (e.g., "AST-2025-0001")
     * @return Optional asset
     */
    Optional<Asset> findByAssetNumber(String assetNumber);

    /**
     * Find asset by ID (excluding soft-deleted)
     *
     * @param id Asset UUID
     * @return Optional asset if exists and not soft-deleted
     */
    Optional<Asset> findByIdAndIsDeletedFalse(UUID id);

    /**
     * Find asset by ID (non-disposed only)
     *
     * @param id Asset UUID
     * @return Optional asset
     */
    @Query("SELECT a FROM Asset a WHERE a.id = :id AND a.status != 'DISPOSED'")
    Optional<Asset> findByIdAndNotDisposed(@Param("id") UUID id);

    /**
     * Find the latest asset number to generate next sequence
     *
     * @param prefix Asset number prefix (e.g., "AST-2025-")
     * @return Optional latest asset ordered by asset number desc
     */
    @Query("SELECT a FROM Asset a WHERE a.assetNumber LIKE CONCAT(:prefix, '%') ORDER BY a.assetNumber DESC LIMIT 1")
    Optional<Asset> findTopByAssetNumberStartingWithOrderByAssetNumberDesc(@Param("prefix") String prefix);

    // =================================================================
    // BASIC FILTERS
    // =================================================================

    /**
     * Find all assets with pagination (excluding DISPOSED)
     *
     * @param pageable Pagination parameters
     * @return Page of assets
     */
    @Query("SELECT a FROM Asset a WHERE a.status != 'DISPOSED'")
    Page<Asset> findAllActive(Pageable pageable);

    /**
     * Find assets by property
     *
     * @param propertyId Property UUID
     * @param pageable   Pagination parameters
     * @return Page of assets
     */
    Page<Asset> findByPropertyIdAndStatusNot(UUID propertyId, AssetStatus status, Pageable pageable);

    /**
     * Find assets by category
     *
     * @param category Asset category
     * @param pageable Pagination parameters
     * @return Page of assets
     */
    Page<Asset> findByCategoryAndStatusNot(AssetCategory category, AssetStatus status, Pageable pageable);

    /**
     * Find assets by status
     *
     * @param status   Asset status
     * @param pageable Pagination parameters
     * @return Page of assets
     */
    Page<Asset> findByStatus(AssetStatus status, Pageable pageable);

    // =================================================================
    // SEARCH AND FILTER QUERIES
    // =================================================================

    /**
     * Search assets with comprehensive filters
     *
     * @param searchTerm Search term for asset number, name, location, manufacturer
     * @param propertyId Property UUID (optional)
     * @param category   Asset category (optional)
     * @param status     Asset status (optional)
     * @param pageable   Pagination parameters
     * @return Page of matching assets
     */
    @Query("SELECT a FROM Asset a WHERE " +
            "(:searchTerm IS NULL OR :searchTerm = '' OR " +
            "LOWER(a.assetNumber) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(a.assetName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(a.location) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(a.manufacturer) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(a.serialNumber) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) AND " +
            "(:propertyId IS NULL OR a.propertyId = :propertyId) AND " +
            "(:category IS NULL OR a.category = :category) AND " +
            "(:status IS NULL OR a.status = :status)")
    Page<Asset> searchWithFilters(
            @Param("searchTerm") String searchTerm,
            @Param("propertyId") UUID propertyId,
            @Param("category") AssetCategory category,
            @Param("status") AssetStatus status,
            Pageable pageable);

    /**
     * Search assets with comprehensive filters excluding DISPOSED
     *
     * @param searchTerm Search term
     * @param propertyId Property UUID (optional)
     * @param category   Asset category (optional)
     * @param status     Asset status (optional, if null excludes DISPOSED)
     * @param pageable   Pagination parameters
     * @return Page of matching assets
     */
    @Query("SELECT a FROM Asset a WHERE " +
            "(:searchTerm IS NULL OR :searchTerm = '' OR " +
            "LOWER(a.assetNumber) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(a.assetName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(a.location) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(a.manufacturer) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(a.serialNumber) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) AND " +
            "(:propertyId IS NULL OR a.propertyId = :propertyId) AND " +
            "(:category IS NULL OR a.category = :category) AND " +
            "((:status IS NULL AND a.status != 'DISPOSED') OR a.status = :status)")
    Page<Asset> searchWithFiltersExcludingDisposed(
            @Param("searchTerm") String searchTerm,
            @Param("propertyId") UUID propertyId,
            @Param("category") AssetCategory category,
            @Param("status") AssetStatus status,
            Pageable pageable);

    // =================================================================
    // WARRANTY EXPIRY QUERIES
    // =================================================================

    /**
     * Find assets with warranty expiring within specified days
     *
     * @param startDate Start of date range (usually today)
     * @param endDate   End of date range (today + days)
     * @return List of assets with expiring warranties
     */
    @Query("SELECT a FROM Asset a WHERE a.warrantyExpiryDate IS NOT NULL AND " +
            "a.warrantyExpiryDate BETWEEN :startDate AND :endDate AND " +
            "a.status = 'ACTIVE' ORDER BY a.warrantyExpiryDate ASC")
    List<Asset> findAssetsWithExpiringWarranty(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    /**
     * Find assets with expired warranty (for notification job)
     *
     * @param today Today's date
     * @return List of assets with expired warranty
     */
    @Query("SELECT a FROM Asset a WHERE a.warrantyExpiryDate IS NOT NULL AND " +
            "a.warrantyExpiryDate < :today AND a.status = 'ACTIVE'")
    List<Asset> findAssetsWithExpiredWarranty(@Param("today") LocalDate today);

    /**
     * Count assets with warranty expiring in next N days
     *
     * @param startDate Start date
     * @param endDate   End date
     * @return Count of expiring assets
     */
    @Query("SELECT COUNT(a) FROM Asset a WHERE a.warrantyExpiryDate IS NOT NULL AND " +
            "a.warrantyExpiryDate BETWEEN :startDate AND :endDate AND a.status = 'ACTIVE'")
    long countAssetsWithExpiringWarranty(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    // =================================================================
    // ASSET NUMBER GENERATION
    // =================================================================

    /**
     * Get next asset number sequence value from database
     *
     * @return Next sequence value
     */
    @Query(value = "SELECT nextval('asset_number_seq')", nativeQuery = true)
    Long getNextAssetNumberSequence();

    /**
     * Reset asset number sequence for new year
     *
     * @param newValue New starting value
     */
    @Query(value = "SELECT setval('asset_number_seq', :newValue, false)", nativeQuery = true)
    void resetAssetNumberSequence(@Param("newValue") Long newValue);

    // =================================================================
    // EXISTENCE CHECKS
    // =================================================================

    /**
     * Check if asset number already exists
     *
     * @param assetNumber Asset number
     * @return True if exists
     */
    boolean existsByAssetNumber(String assetNumber);

    // =================================================================
    // DROPDOWN QUERIES
    // =================================================================

    /**
     * Find assets for dropdown (ACTIVE and UNDER_MAINTENANCE only)
     *
     * @param propertyId Property UUID (optional)
     * @return List of assets for dropdown
     */
    @Query("SELECT a FROM Asset a WHERE " +
            "(:propertyId IS NULL OR a.propertyId = :propertyId) AND " +
            "a.status IN ('ACTIVE', 'UNDER_MAINTENANCE') " +
            "ORDER BY a.assetName ASC")
    List<Asset> findForDropdown(@Param("propertyId") UUID propertyId);

    // =================================================================
    // ANALYTICS AND COUNTS
    // =================================================================

    /**
     * Count assets by status
     *
     * @param status Asset status
     * @return Count of assets
     */
    long countByStatus(AssetStatus status);

    /**
     * Count assets by category
     *
     * @param category Asset category
     * @return Count of assets
     */
    long countByCategory(AssetCategory category);

    /**
     * Count assets by property
     *
     * @param propertyId Property UUID
     * @return Count of assets
     */
    @Query("SELECT COUNT(a) FROM Asset a WHERE a.propertyId = :propertyId AND a.status != 'DISPOSED'")
    long countByPropertyId(@Param("propertyId") UUID propertyId);

    /**
     * Get category breakdown
     *
     * @return List of Object arrays [category, count]
     */
    @Query("SELECT a.category, COUNT(a) FROM Asset a WHERE a.status != 'DISPOSED' GROUP BY a.category ORDER BY COUNT(a) DESC")
    List<Object[]> getCategoryBreakdown();

    /**
     * Get status breakdown
     *
     * @return List of Object arrays [status, count]
     */
    @Query("SELECT a.status, COUNT(a) FROM Asset a GROUP BY a.status ORDER BY COUNT(a) DESC")
    List<Object[]> getStatusBreakdown();
}
