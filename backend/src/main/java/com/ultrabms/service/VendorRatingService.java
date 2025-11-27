package com.ultrabms.service;

import com.ultrabms.dto.vendor.VendorComparisonDto;
import com.ultrabms.dto.vendor.VendorPerformanceDto;
import com.ultrabms.dto.vendor.VendorRatingDto;
import com.ultrabms.dto.vendor.VendorRatingRequestDto;
import com.ultrabms.entity.enums.WorkOrderCategory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

/**
 * Service interface for vendor rating operations.
 * Story 5.3: Vendor Performance Tracking and Rating
 */
public interface VendorRatingService {

    // =================================================================
    // RATING SUBMISSION
    // =================================================================

    /**
     * Submit a rating for a completed work order.
     *
     * @param workOrderId UUID of the completed work order
     * @param dto         Rating data
     * @param userId      ID of user submitting the rating
     * @return Created rating DTO
     * @throws IllegalStateException    if work order is not completed or has no vendor
     * @throws IllegalArgumentException if rating already exists for this work order
     */
    VendorRatingDto submitRating(UUID workOrderId, VendorRatingRequestDto dto, UUID userId);

    /**
     * Update an existing rating (allowed within 7 days).
     *
     * @param workOrderId UUID of the work order
     * @param dto         Updated rating data
     * @param userId      ID of user updating the rating
     * @return Updated rating DTO
     * @throws IllegalStateException if rating doesn't exist or update window expired
     */
    VendorRatingDto updateRating(UUID workOrderId, VendorRatingRequestDto dto, UUID userId);

    /**
     * Get rating for a work order.
     *
     * @param workOrderId UUID of the work order
     * @return Rating DTO or null if no rating exists
     */
    VendorRatingDto getRatingByWorkOrderId(UUID workOrderId);

    /**
     * Check if a rating exists for a work order.
     *
     * @param workOrderId UUID of the work order
     * @return true if rating exists
     */
    boolean ratingExistsForWorkOrder(UUID workOrderId);

    // =================================================================
    // VENDOR PERFORMANCE
    // =================================================================

    /**
     * Get performance metrics for a vendor.
     *
     * @param vendorId UUID of the vendor
     * @return Performance metrics DTO
     */
    VendorPerformanceDto getVendorPerformance(UUID vendorId);

    /**
     * Get paginated ratings for a vendor.
     *
     * @param vendorId UUID of the vendor
     * @param pageable Pagination information
     * @return Page of rating DTOs
     */
    Page<VendorRatingDto> getVendorRatings(UUID vendorId, Pageable pageable);

    // =================================================================
    // TOP-RATED AND RANKING
    // =================================================================

    /**
     * Get list of top-rated vendors.
     *
     * @param category Optional service category filter
     * @param limit    Maximum number of vendors to return
     * @return List of top-rated vendors with performance data
     */
    List<VendorPerformanceDto> getTopRatedVendors(WorkOrderCategory category, int limit);

    // =================================================================
    // COMPARISON
    // =================================================================

    /**
     * Get comparison data for multiple vendors.
     *
     * @param vendorIds List of vendor UUIDs (2-4 vendors)
     * @return Comparison DTO with side-by-side metrics
     * @throws IllegalArgumentException if less than 2 or more than 4 vendors specified
     */
    VendorComparisonDto getVendorsComparison(List<UUID> vendorIds);

    // =================================================================
    // RATING RECALCULATION
    // =================================================================

    /**
     * Recalculate overall rating for a vendor.
     * Updates the vendor.rating field with the new average.
     *
     * @param vendorId UUID of the vendor
     */
    void recalculateVendorRating(UUID vendorId);

    /**
     * Recalculate ratings for all vendors.
     * Used by scheduled job.
     */
    void recalculateAllVendorRatings();
}
