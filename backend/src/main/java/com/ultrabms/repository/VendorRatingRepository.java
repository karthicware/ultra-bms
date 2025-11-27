package com.ultrabms.repository;

import com.ultrabms.entity.VendorRating;
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
 * Repository interface for VendorRating entity operations.
 * Story 5.3: Vendor Performance Tracking and Rating
 *
 * Provides methods for:
 * - CRUD operations on vendor ratings
 * - Querying ratings by vendor
 * - Calculating average ratings
 * - Rating distribution analysis
 */
@Repository
public interface VendorRatingRepository extends JpaRepository<VendorRating, UUID> {

    // =================================================================
    // FIND BY WORK ORDER
    // =================================================================

    /**
     * Find rating by work order ID.
     *
     * @param workOrderId UUID of the work order
     * @return Optional containing the rating if exists
     */
    Optional<VendorRating> findByWorkOrderId(UUID workOrderId);

    /**
     * Check if a rating exists for a work order.
     *
     * @param workOrderId UUID of the work order
     * @return true if rating exists
     */
    boolean existsByWorkOrderId(UUID workOrderId);

    // =================================================================
    // FIND BY VENDOR
    // =================================================================

    /**
     * Find all ratings for a vendor, ordered by rated_at descending.
     *
     * @param vendorId UUID of the vendor
     * @param pageable pagination information
     * @return Page of vendor ratings
     */
    @Query("SELECT vr FROM VendorRating vr WHERE vr.vendor.id = :vendorId ORDER BY vr.ratedAt DESC")
    Page<VendorRating> findByVendorIdOrderByRatedAtDesc(@Param("vendorId") UUID vendorId, Pageable pageable);

    /**
     * Find all ratings for a vendor (unpaged).
     *
     * @param vendorId UUID of the vendor
     * @return List of vendor ratings
     */
    List<VendorRating> findByVendorIdOrderByRatedAtDesc(UUID vendorId);

    /**
     * Count total ratings for a vendor.
     *
     * @param vendorId UUID of the vendor
     * @return count of ratings
     */
    long countByVendorId(UUID vendorId);

    // =================================================================
    // RATING CALCULATIONS
    // =================================================================

    /**
     * Calculate average overall rating for a vendor.
     *
     * @param vendorId UUID of the vendor
     * @return average rating or null if no ratings exist
     */
    @Query("SELECT AVG(vr.overallScore) FROM VendorRating vr WHERE vr.vendor.id = :vendorId")
    BigDecimal calculateAverageRatingByVendorId(@Param("vendorId") UUID vendorId);

    /**
     * Calculate average quality score for a vendor.
     *
     * @param vendorId UUID of the vendor
     * @return average quality score
     */
    @Query("SELECT AVG(vr.qualityScore) FROM VendorRating vr WHERE vr.vendor.id = :vendorId")
    Double calculateAverageQualityScoreByVendorId(@Param("vendorId") UUID vendorId);

    /**
     * Calculate average timeliness score for a vendor.
     *
     * @param vendorId UUID of the vendor
     * @return average timeliness score
     */
    @Query("SELECT AVG(vr.timelinessScore) FROM VendorRating vr WHERE vr.vendor.id = :vendorId")
    Double calculateAverageTimelinessScoreByVendorId(@Param("vendorId") UUID vendorId);

    /**
     * Calculate average communication score for a vendor.
     *
     * @param vendorId UUID of the vendor
     * @return average communication score
     */
    @Query("SELECT AVG(vr.communicationScore) FROM VendorRating vr WHERE vr.vendor.id = :vendorId")
    Double calculateAverageCommunicationScoreByVendorId(@Param("vendorId") UUID vendorId);

    /**
     * Calculate average professionalism score for a vendor.
     *
     * @param vendorId UUID of the vendor
     * @return average professionalism score
     */
    @Query("SELECT AVG(vr.professionalismScore) FROM VendorRating vr WHERE vr.vendor.id = :vendorId")
    Double calculateAverageProfessionalismScoreByVendorId(@Param("vendorId") UUID vendorId);

    // =================================================================
    // RATING DISTRIBUTION
    // =================================================================

    /**
     * Count ratings by overall score range for a vendor (5 stars: 4.5-5.0).
     *
     * @param vendorId UUID of the vendor
     * @return count of 5-star ratings
     */
    @Query("SELECT COUNT(vr) FROM VendorRating vr WHERE vr.vendor.id = :vendorId AND vr.overallScore >= 4.5")
    long countFiveStarRatingsByVendorId(@Param("vendorId") UUID vendorId);

    /**
     * Count ratings by overall score range for a vendor (4 stars: 3.5-4.49).
     *
     * @param vendorId UUID of the vendor
     * @return count of 4-star ratings
     */
    @Query("SELECT COUNT(vr) FROM VendorRating vr WHERE vr.vendor.id = :vendorId AND vr.overallScore >= 3.5 AND vr.overallScore < 4.5")
    long countFourStarRatingsByVendorId(@Param("vendorId") UUID vendorId);

    /**
     * Count ratings by overall score range for a vendor (3 stars: 2.5-3.49).
     *
     * @param vendorId UUID of the vendor
     * @return count of 3-star ratings
     */
    @Query("SELECT COUNT(vr) FROM VendorRating vr WHERE vr.vendor.id = :vendorId AND vr.overallScore >= 2.5 AND vr.overallScore < 3.5")
    long countThreeStarRatingsByVendorId(@Param("vendorId") UUID vendorId);

    /**
     * Count ratings by overall score range for a vendor (2 stars: 1.5-2.49).
     *
     * @param vendorId UUID of the vendor
     * @return count of 2-star ratings
     */
    @Query("SELECT COUNT(vr) FROM VendorRating vr WHERE vr.vendor.id = :vendorId AND vr.overallScore >= 1.5 AND vr.overallScore < 2.5")
    long countTwoStarRatingsByVendorId(@Param("vendorId") UUID vendorId);

    /**
     * Count ratings by overall score range for a vendor (1 star: 1.0-1.49).
     *
     * @param vendorId UUID of the vendor
     * @return count of 1-star ratings
     */
    @Query("SELECT COUNT(vr) FROM VendorRating vr WHERE vr.vendor.id = :vendorId AND vr.overallScore >= 1.0 AND vr.overallScore < 1.5")
    long countOneStarRatingsByVendorId(@Param("vendorId") UUID vendorId);

    // =================================================================
    // BATCH OPERATIONS
    // =================================================================

    /**
     * Find all vendor IDs that have ratings.
     * Used for batch recalculation job.
     *
     * @return List of vendor UUIDs
     */
    @Query("SELECT DISTINCT vr.vendor.id FROM VendorRating vr")
    List<UUID> findAllVendorIdsWithRatings();

    /**
     * Delete all ratings for a vendor.
     * Used when vendor is deleted.
     *
     * @param vendorId UUID of the vendor
     */
    void deleteByVendorId(UUID vendorId);
}
