package com.ultrabms.service.impl;

import com.ultrabms.dto.vendor.VendorComparisonDto;
import com.ultrabms.dto.vendor.VendorPerformanceDto;
import com.ultrabms.dto.vendor.VendorRatingDistributionDto;
import com.ultrabms.dto.vendor.VendorRatingDto;
import com.ultrabms.dto.vendor.VendorRatingRequestDto;
import com.ultrabms.entity.User;
import com.ultrabms.entity.Vendor;
import com.ultrabms.entity.VendorRating;
import com.ultrabms.entity.WorkOrder;
import com.ultrabms.entity.enums.VendorStatus;
import com.ultrabms.entity.enums.WorkOrderCategory;
import com.ultrabms.entity.enums.WorkOrderStatus;
import com.ultrabms.exception.DuplicateResourceException;
import com.ultrabms.exception.ResourceNotFoundException;
import com.ultrabms.mapper.VendorRatingMapper;
import com.ultrabms.repository.UserRepository;
import com.ultrabms.repository.VendorRatingRepository;
import com.ultrabms.repository.VendorRepository;
import com.ultrabms.repository.WorkOrderRepository;
import com.ultrabms.service.VendorRatingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Implementation of VendorRatingService.
 * Story 5.3: Vendor Performance Tracking and Rating
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class VendorRatingServiceImpl implements VendorRatingService {

    private final VendorRatingRepository vendorRatingRepository;
    private final WorkOrderRepository workOrderRepository;
    private final VendorRepository vendorRepository;
    private final UserRepository userRepository;
    private final VendorRatingMapper vendorRatingMapper;

    // =================================================================
    // RATING SUBMISSION
    // =================================================================

    @Override
    @Transactional
    public VendorRatingDto submitRating(UUID workOrderId, VendorRatingRequestDto dto, UUID userId) {
        log.info("Submitting rating for work order: {} by user: {}", workOrderId, userId);

        // Check if rating already exists
        if (vendorRatingRepository.existsByWorkOrderId(workOrderId)) {
            throw new DuplicateResourceException("A rating already exists for this work order");
        }

        // Get work order
        WorkOrder workOrder = workOrderRepository.findById(workOrderId)
                .orElseThrow(() -> new ResourceNotFoundException("Work order not found: " + workOrderId));

        // Validate work order is completed
        if (workOrder.getStatus() != WorkOrderStatus.COMPLETED) {
            throw new IllegalStateException("Can only rate completed work orders. Current status: " + workOrder.getStatus());
        }

        // Get assigned vendor from work order
        Vendor vendor = workOrder.getAssignedTo();
        if (vendor == null) {
            throw new IllegalStateException("Work order has no assigned vendor");
        }

        // Get user
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        // Create rating
        VendorRating rating = vendorRatingMapper.toEntity(dto, workOrder, vendor, user);
        rating = vendorRatingRepository.save(rating);

        // Update vendor's overall rating
        recalculateVendorRating(vendor.getId());

        log.info("Rating submitted successfully. Rating ID: {}, Vendor: {}, Score: {}",
                rating.getId(), vendor.getCompanyName(), rating.getOverallScore());

        return vendorRatingMapper.toDto(rating);
    }

    @Override
    @Transactional
    public VendorRatingDto updateRating(UUID workOrderId, VendorRatingRequestDto dto, UUID userId) {
        log.info("Updating rating for work order: {} by user: {}", workOrderId, userId);

        // Get existing rating
        VendorRating rating = vendorRatingRepository.findByWorkOrderId(workOrderId)
                .orElseThrow(() -> new ResourceNotFoundException("Rating not found for work order: " + workOrderId));

        // Check if update is allowed (within 7 days)
        if (!rating.isUpdateAllowed()) {
            throw new IllegalStateException("Rating update window has expired (7 days)");
        }

        // Update rating
        vendorRatingMapper.updateEntity(dto, rating);
        rating = vendorRatingRepository.save(rating);

        // Recalculate vendor's overall rating
        recalculateVendorRating(rating.getVendorId());

        log.info("Rating updated successfully. Rating ID: {}, New Score: {}",
                rating.getId(), rating.getOverallScore());

        return vendorRatingMapper.toDto(rating);
    }

    @Override
    @Transactional(readOnly = true)
    public VendorRatingDto getRatingByWorkOrderId(UUID workOrderId) {
        return vendorRatingRepository.findByWorkOrderId(workOrderId)
                .map(vendorRatingMapper::toDto)
                .orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean ratingExistsForWorkOrder(UUID workOrderId) {
        return vendorRatingRepository.existsByWorkOrderId(workOrderId);
    }

    // =================================================================
    // VENDOR PERFORMANCE
    // =================================================================

    @Override
    @Transactional(readOnly = true)
    public VendorPerformanceDto getVendorPerformance(UUID vendorId) {
        log.debug("Getting performance for vendor: {}", vendorId);

        Vendor vendor = vendorRepository.findById(vendorId)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor not found: " + vendorId));

        // Get rating statistics
        BigDecimal overallRating = vendorRatingRepository.calculateAverageRatingByVendorId(vendorId);
        Double avgQuality = vendorRatingRepository.calculateAverageQualityScoreByVendorId(vendorId);
        Double avgTimeliness = vendorRatingRepository.calculateAverageTimelinessScoreByVendorId(vendorId);
        Double avgCommunication = vendorRatingRepository.calculateAverageCommunicationScoreByVendorId(vendorId);
        Double avgProfessionalism = vendorRatingRepository.calculateAverageProfessionalismScoreByVendorId(vendorId);

        // Get work order statistics
        List<WorkOrder> completedOrders = workOrderRepository.findCompletedByVendorId(vendorId);
        long totalJobsCompleted = completedOrders.size();

        Double averageCompletionTime = calculateAverageCompletionTime(completedOrders);
        Double onTimeCompletionRate = calculateOnTimeRate(completedOrders);
        BigDecimal totalAmountPaid = calculateTotalAmountPaid(completedOrders);

        // Get rating distribution
        VendorRatingDistributionDto distribution = getRatingDistribution(vendorId);

        return VendorPerformanceDto.builder()
                .vendorId(vendorId)
                .vendorName(vendor.getCompanyName())
                .vendorNumber(vendor.getVendorNumber())
                .overallRating(overallRating != null ? overallRating : BigDecimal.ZERO)
                .totalJobsCompleted(totalJobsCompleted)
                .averageCompletionTime(averageCompletionTime)
                .onTimeCompletionRate(onTimeCompletionRate)
                .totalAmountPaid(totalAmountPaid)
                .ratingDistribution(distribution)
                .averageQualityScore(avgQuality)
                .averageTimelinessScore(avgTimeliness)
                .averageCommunicationScore(avgCommunication)
                .averageProfessionalismScore(avgProfessionalism)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<VendorRatingDto> getVendorRatings(UUID vendorId, Pageable pageable) {
        // Verify vendor exists
        if (!vendorRepository.existsById(vendorId)) {
            throw new ResourceNotFoundException("Vendor not found: " + vendorId);
        }

        return vendorRatingRepository.findByVendorIdOrderByRatedAtDesc(vendorId, pageable)
                .map(vendorRatingMapper::toDto);
    }

    // =================================================================
    // TOP-RATED AND RANKING
    // =================================================================

    @Override
    @Transactional(readOnly = true)
    public List<VendorPerformanceDto> getTopRatedVendors(WorkOrderCategory category, int limit) {
        log.debug("Getting top {} rated vendors for category: {}", limit, category);

        // Get active vendors sorted by rating
        Pageable pageable = PageRequest.of(0, Math.min(limit, 50), Sort.by(Sort.Direction.DESC, "rating"));

        List<Vendor> vendors;
        if (category != null) {
            // Convert category to JSON format for JSONB query
            String categoryJson = "[\"" + category.name() + "\"]";
            vendors = vendorRepository.findByStatusAndServiceCategoriesContaining(
                    VendorStatus.ACTIVE, categoryJson, pageable).getContent();
        } else {
            vendors = vendorRepository.findByStatus(VendorStatus.ACTIVE, pageable).getContent();
        }

        return vendors.stream()
                .map(v -> getVendorPerformance(v.getId()))
                .collect(Collectors.toList());
    }

    // =================================================================
    // COMPARISON
    // =================================================================

    @Override
    @Transactional(readOnly = true)
    public VendorComparisonDto getVendorsComparison(List<UUID> vendorIds) {
        log.debug("Comparing vendors: {}", vendorIds);

        if (vendorIds == null || vendorIds.size() < 2) {
            throw new IllegalArgumentException("At least 2 vendors must be selected for comparison");
        }
        if (vendorIds.size() > 4) {
            throw new IllegalArgumentException("Maximum 4 vendors can be compared at once");
        }

        List<VendorComparisonDto.VendorComparisonEntry> entries = new ArrayList<>();

        for (UUID vendorId : vendorIds) {
            Vendor vendor = vendorRepository.findById(vendorId)
                    .orElseThrow(() -> new ResourceNotFoundException("Vendor not found: " + vendorId));

            VendorPerformanceDto performance = getVendorPerformance(vendorId);

            VendorComparisonDto.VendorComparisonEntry entry = VendorComparisonDto.VendorComparisonEntry.builder()
                    .id(vendor.getId())
                    .vendorNumber(vendor.getVendorNumber())
                    .companyName(vendor.getCompanyName())
                    .overallRating(performance.getOverallRating())
                    .totalJobsCompleted(performance.getTotalJobsCompleted())
                    .onTimeCompletionRate(performance.getOnTimeCompletionRate())
                    .averageCompletionTime(performance.getAverageCompletionTime())
                    .hourlyRate(vendor.getHourlyRate())
                    .serviceCategories(vendor.getServiceCategories().stream()
                            .map(Enum::name)
                            .collect(Collectors.toList()))
                    .totalAmountPaid(performance.getTotalAmountPaid())
                    .build();

            entries.add(entry);
        }

        // Mark best values
        markBestValues(entries);

        return VendorComparisonDto.builder()
                .vendors(entries)
                .comparedAt(LocalDateTime.now())
                .build();
    }

    // =================================================================
    // RATING RECALCULATION
    // =================================================================

    @Override
    @Transactional
    public void recalculateVendorRating(UUID vendorId) {
        log.debug("Recalculating rating for vendor: {}", vendorId);

        Vendor vendor = vendorRepository.findById(vendorId)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor not found: " + vendorId));

        BigDecimal avgRating = vendorRatingRepository.calculateAverageRatingByVendorId(vendorId);

        if (avgRating != null) {
            vendor.setRating(avgRating.setScale(2, RoundingMode.HALF_UP));
        } else {
            vendor.setRating(BigDecimal.ZERO);
        }

        vendorRepository.save(vendor);
        log.info("Vendor {} rating updated to: {}", vendor.getVendorNumber(), vendor.getRating());
    }

    @Override
    @Transactional
    public void recalculateAllVendorRatings() {
        log.info("Starting batch recalculation of all vendor ratings");

        List<UUID> vendorIds = vendorRatingRepository.findAllVendorIdsWithRatings();
        int count = 0;

        for (UUID vendorId : vendorIds) {
            try {
                recalculateVendorRating(vendorId);
                count++;
            } catch (Exception e) {
                log.error("Error recalculating rating for vendor: {}", vendorId, e);
            }
        }

        log.info("Batch rating recalculation complete. Processed {} vendors", count);
    }

    // =================================================================
    // PRIVATE HELPER METHODS
    // =================================================================

    private VendorRatingDistributionDto getRatingDistribution(UUID vendorId) {
        long fiveStar = vendorRatingRepository.countFiveStarRatingsByVendorId(vendorId);
        long fourStar = vendorRatingRepository.countFourStarRatingsByVendorId(vendorId);
        long threeStar = vendorRatingRepository.countThreeStarRatingsByVendorId(vendorId);
        long twoStar = vendorRatingRepository.countTwoStarRatingsByVendorId(vendorId);
        long oneStar = vendorRatingRepository.countOneStarRatingsByVendorId(vendorId);
        long total = fiveStar + fourStar + threeStar + twoStar + oneStar;

        return VendorRatingDistributionDto.builder()
                .fiveStarCount(fiveStar)
                .fiveStarPercent(total > 0 ? (fiveStar * 100.0) / total : 0)
                .fourStarCount(fourStar)
                .fourStarPercent(total > 0 ? (fourStar * 100.0) / total : 0)
                .threeStarCount(threeStar)
                .threeStarPercent(total > 0 ? (threeStar * 100.0) / total : 0)
                .twoStarCount(twoStar)
                .twoStarPercent(total > 0 ? (twoStar * 100.0) / total : 0)
                .oneStarCount(oneStar)
                .oneStarPercent(total > 0 ? (oneStar * 100.0) / total : 0)
                .totalCount(total)
                .build();
    }

    private Double calculateAverageCompletionTime(List<WorkOrder> completedOrders) {
        if (completedOrders.isEmpty()) {
            return null;
        }

        double totalDays = 0;
        int count = 0;

        for (WorkOrder wo : completedOrders) {
            if (wo.getCompletedAt() != null && wo.getCreatedAt() != null) {
                long hours = Duration.between(wo.getCreatedAt(), wo.getCompletedAt()).toHours();
                totalDays += hours / 24.0;
                count++;
            }
        }

        return count > 0 ? Math.round(totalDays / count * 100.0) / 100.0 : null;
    }

    private Double calculateOnTimeRate(List<WorkOrder> completedOrders) {
        if (completedOrders.isEmpty()) {
            return null;
        }

        long onTime = completedOrders.stream()
                .filter(wo -> wo.getCompletedAt() != null && wo.getScheduledDate() != null)
                .filter(wo -> !wo.getCompletedAt().toLocalDate().isAfter(wo.getScheduledDate()))
                .count();

        return Math.round((onTime * 100.0) / completedOrders.size() * 100.0) / 100.0;
    }

    private BigDecimal calculateTotalAmountPaid(List<WorkOrder> completedOrders) {
        return completedOrders.stream()
                .map(WorkOrder::getActualCost)
                .filter(cost -> cost != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private void markBestValues(List<VendorComparisonDto.VendorComparisonEntry> entries) {
        if (entries.isEmpty()) return;

        // Best rating
        BigDecimal maxRating = entries.stream()
                .map(VendorComparisonDto.VendorComparisonEntry::getOverallRating)
                .filter(r -> r != null)
                .max(Comparator.naturalOrder())
                .orElse(BigDecimal.ZERO);

        // Best on-time rate
        Double maxOnTimeRate = entries.stream()
                .map(VendorComparisonDto.VendorComparisonEntry::getOnTimeCompletionRate)
                .filter(r -> r != null)
                .max(Comparator.naturalOrder())
                .orElse(0.0);

        // Lowest hourly rate
        BigDecimal minHourlyRate = entries.stream()
                .map(VendorComparisonDto.VendorComparisonEntry::getHourlyRate)
                .filter(r -> r != null)
                .min(Comparator.naturalOrder())
                .orElse(BigDecimal.ZERO);

        // Most jobs completed
        long maxJobs = entries.stream()
                .mapToLong(VendorComparisonDto.VendorComparisonEntry::getTotalJobsCompleted)
                .max()
                .orElse(0);

        for (VendorComparisonDto.VendorComparisonEntry entry : entries) {
            entry.setBestRating(entry.getOverallRating() != null &&
                    entry.getOverallRating().compareTo(maxRating) == 0 &&
                    maxRating.compareTo(BigDecimal.ZERO) > 0);

            entry.setBestOnTimeRate(entry.getOnTimeCompletionRate() != null &&
                    entry.getOnTimeCompletionRate().equals(maxOnTimeRate) &&
                    maxOnTimeRate > 0);

            entry.setLowestHourlyRate(entry.getHourlyRate() != null &&
                    entry.getHourlyRate().compareTo(minHourlyRate) == 0);

            entry.setMostJobsCompleted(entry.getTotalJobsCompleted() == maxJobs && maxJobs > 0);
        }
    }
}
