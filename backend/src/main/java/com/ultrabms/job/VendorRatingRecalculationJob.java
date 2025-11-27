package com.ultrabms.job;

import com.ultrabms.entity.Vendor;
import com.ultrabms.entity.VendorRating;
import com.ultrabms.entity.enums.VendorStatus;
import com.ultrabms.repository.VendorRatingRepository;
import com.ultrabms.repository.VendorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;

/**
 * Scheduled Job: Vendor Rating Recalculation
 * Story 5.3: Vendor Performance Tracking and Rating (AC #18)
 *
 * Recalculates aggregated ratings for all vendors nightly.
 * Runs at 2 AM daily.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class VendorRatingRecalculationJob {

    private final VendorRepository vendorRepository;
    private final VendorRatingRepository vendorRatingRepository;

    /**
     * Recalculate overall ratings for all active vendors
     * Runs daily at 2 AM
     */
    @Scheduled(cron = "${jobs.vendor-rating-recalculation.cron:0 0 2 * * ?}")
    @Transactional
    public void recalculateVendorRatings() {
        log.info("Starting vendor rating recalculation job");
        long startTime = System.currentTimeMillis();
        int vendorsProcessed = 0;
        int vendorsUpdated = 0;

        try {
            // Get all active vendors (use large page to get all)
            List<Vendor> vendors = vendorRepository.findByStatusAndIsDeletedFalse(
                    VendorStatus.ACTIVE, PageRequest.of(0, 10000)).getContent();
            log.info("Found {} active vendors to process", vendors.size());

            for (Vendor vendor : vendors) {
                try {
                    boolean updated = recalculateVendorRating(vendor);
                    vendorsProcessed++;
                    if (updated) {
                        vendorsUpdated++;
                    }
                } catch (Exception e) {
                    log.error("Error recalculating rating for vendor {}: {}",
                            vendor.getId(), e.getMessage(), e);
                }
            }

            long duration = System.currentTimeMillis() - startTime;
            log.info("Vendor rating recalculation completed. Processed: {}, Updated: {}, Duration: {}ms",
                    vendorsProcessed, vendorsUpdated, duration);

        } catch (Exception e) {
            log.error("Vendor rating recalculation job failed: {}", e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Recalculate rating for a single vendor
     *
     * @param vendor The vendor to recalculate
     * @return true if the rating was updated
     */
    private boolean recalculateVendorRating(Vendor vendor) {
        // Get all ratings for this vendor
        List<VendorRating> ratings = vendorRatingRepository.findByVendorIdOrderByRatedAtDesc(vendor.getId());

        if (ratings.isEmpty()) {
            // No ratings - set to zero if not already
            if (vendor.getRating() == null || vendor.getRating().compareTo(BigDecimal.ZERO) != 0) {
                vendor.setRating(BigDecimal.ZERO);
                vendorRepository.save(vendor);
                log.debug("Reset rating to 0 for vendor {} (no ratings)", vendor.getVendorNumber());
                return true;
            }
            return false;
        }

        // Calculate average overall score
        BigDecimal totalScore = BigDecimal.ZERO;
        for (VendorRating rating : ratings) {
            totalScore = totalScore.add(rating.getOverallScore());
        }
        BigDecimal averageRating = totalScore.divide(
                BigDecimal.valueOf(ratings.size()),
                2,
                RoundingMode.HALF_UP
        );

        // Only update if changed
        if (vendor.getRating() == null || vendor.getRating().compareTo(averageRating) != 0) {
            BigDecimal previousRating = vendor.getRating();
            vendor.setRating(averageRating);
            vendorRepository.save(vendor);
            log.debug("Updated rating for vendor {} from {} to {} (based on {} ratings)",
                    vendor.getVendorNumber(), previousRating, averageRating, ratings.size());
            return true;
        }

        return false;
    }

    /**
     * Manual trigger for recalculating a single vendor's rating
     * Can be called from service layer when needed
     *
     * @param vendorId The vendor ID
     */
    @Transactional
    public void recalculateSingleVendor(UUID vendorId) {
        log.info("Manual rating recalculation triggered for vendor: {}", vendorId);
        vendorRepository.findById(vendorId).ifPresentOrElse(
                vendor -> {
                    boolean updated = recalculateVendorRating(vendor);
                    log.info("Manual recalculation completed for vendor {}. Updated: {}",
                            vendorId, updated);
                },
                () -> log.warn("Vendor not found for manual recalculation: {}", vendorId)
        );
    }
}
