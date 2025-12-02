package com.ultrabms.service.impl;

import com.ultrabms.dto.dashboard.vendor.ExpiringDocumentDto;
import com.ultrabms.dto.dashboard.vendor.JobsBySpecializationDto;
import com.ultrabms.dto.dashboard.vendor.TopVendorDto;
import com.ultrabms.dto.dashboard.vendor.VendorDashboardDto;
import com.ultrabms.dto.dashboard.vendor.VendorKpiDto;
import com.ultrabms.dto.dashboard.vendor.VendorPerformanceSnapshotDto;
import com.ultrabms.entity.enums.VendorDocumentType;
import com.ultrabms.entity.enums.WorkOrderCategory;
import com.ultrabms.repository.VendorDashboardRepository;
import com.ultrabms.service.VendorDashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Implementation of VendorDashboardService.
 * Provides vendor dashboard data with 5-minute Ehcache caching (AC-16).
 *
 * Story 8.5: Vendor Dashboard
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class VendorDashboardServiceImpl implements VendorDashboardService {

    private final VendorDashboardRepository vendorDashboardRepository;

    private static final int DEFAULT_EXPIRING_DAYS = 30;
    private static final int DEFAULT_EXPIRING_DOCUMENTS_LIMIT = 10;
    private static final int DEFAULT_TOP_VENDORS_LIMIT = 5;

    // Performance tier thresholds (from story constraints)
    private static final BigDecimal GREEN_RATING_THRESHOLD = new BigDecimal("4.0");
    private static final BigDecimal GREEN_SLA_THRESHOLD = new BigDecimal("80.0");
    private static final BigDecimal YELLOW_RATING_THRESHOLD = new BigDecimal("3.0");
    private static final BigDecimal YELLOW_SLA_THRESHOLD = new BigDecimal("60.0");

    @Override
    @Cacheable(value = "vendorDashboard", key = "'all'")
    public VendorDashboardDto getVendorDashboard() {
        log.debug("Fetching complete vendor dashboard data");

        return VendorDashboardDto.builder()
                .kpis(getKpis())
                .jobsBySpecialization(getJobsBySpecialization())
                .performanceSnapshot(getPerformanceSnapshot())
                .expiringDocuments(getExpiringDocuments(DEFAULT_EXPIRING_DAYS, DEFAULT_EXPIRING_DOCUMENTS_LIMIT))
                .topVendors(getTopVendors(DEFAULT_TOP_VENDORS_LIMIT))
                .build();
    }

    @Override
    @Cacheable(value = "vendorKpis", key = "'kpis'")
    public VendorKpiDto getKpis() {
        log.debug("Fetching vendor KPIs");

        // AC-1: Total Active Vendors
        Long activeVendors = vendorDashboardRepository.countActiveVendors();

        // AC-2: Average SLA Compliance
        Double avgSla = vendorDashboardRepository.calculateAverageSlaCompliance();
        BigDecimal avgSlaCompliance = avgSla != null
                ? BigDecimal.valueOf(avgSla).setScale(1, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // AC-3: Top Performing Vendor
        VendorKpiDto.TopVendorKpi topVendor = null;
        Object[] topVendorData = vendorDashboardRepository.getTopPerformingVendor();
        if (topVendorData != null) {
            topVendor = VendorKpiDto.TopVendorKpi.builder()
                    .vendorId((UUID) topVendorData[0])
                    .vendorName((String) topVendorData[1])
                    .rating(toBigDecimal(topVendorData[2]))
                    .totalJobsCompleted(toInteger(topVendorData[3]))
                    .build();
        }

        // AC-4: Expiring Documents
        Long expiringCount = vendorDashboardRepository.countExpiringDocuments(DEFAULT_EXPIRING_DAYS);
        Boolean hasCritical = vendorDashboardRepository.hasCriticalDocumentsExpiring(DEFAULT_EXPIRING_DAYS);
        VendorKpiDto.ExpiringDocsKpi expiringDocs = VendorKpiDto.ExpiringDocsKpi.builder()
                .count(expiringCount != null ? expiringCount : 0L)
                .hasCriticalExpiring(hasCritical != null && hasCritical)
                .build();

        return VendorKpiDto.builder()
                .totalActiveVendors(activeVendors)
                .avgSlaCompliance(avgSlaCompliance)
                .topPerformingVendor(topVendor)
                .expiringDocuments(expiringDocs)
                .build();
    }

    @Override
    @Cacheable(value = "vendorJobsBySpecialization", key = "'jobs'")
    public List<JobsBySpecializationDto> getJobsBySpecialization() {
        log.debug("Fetching jobs by specialization");

        List<Object[]> data = vendorDashboardRepository.getJobsBySpecialization();
        List<JobsBySpecializationDto> result = new ArrayList<>();

        for (Object[] row : data) {
            String categoryStr = (String) row[0];
            WorkOrderCategory category = null;
            try {
                category = WorkOrderCategory.valueOf(categoryStr);
            } catch (IllegalArgumentException e) {
                log.warn("Unknown category: {}", categoryStr);
            }

            result.add(JobsBySpecializationDto.builder()
                    .specialization(category)
                    .displayName((String) row[1])
                    .jobCount(toLong(row[2]))
                    .vendorCount(toLong(row[3]))
                    .build());
        }

        return result;
    }

    @Override
    @Cacheable(value = "vendorPerformanceSnapshot", key = "'performance'")
    public List<VendorPerformanceSnapshotDto> getPerformanceSnapshot() {
        log.debug("Fetching vendor performance snapshot");

        List<Object[]> data = vendorDashboardRepository.getVendorPerformanceSnapshot();
        List<VendorPerformanceSnapshotDto> result = new ArrayList<>();

        for (Object[] row : data) {
            BigDecimal slaCompliance = toBigDecimal(row[2]);
            BigDecimal rating = toBigDecimal(row[3]);
            Integer jobCount = toInteger(row[4]);

            // Calculate performance tier (from story constraints)
            VendorPerformanceSnapshotDto.PerformanceTier tier = calculatePerformanceTier(rating, slaCompliance);

            result.add(VendorPerformanceSnapshotDto.builder()
                    .vendorId((UUID) row[0])
                    .vendorName((String) row[1])
                    .slaCompliance(slaCompliance)
                    .rating(rating)
                    .jobCount(jobCount)
                    .performanceTier(tier)
                    .build());
        }

        return result;
    }

    @Override
    @Cacheable(value = "vendorExpiringDocuments", key = "'expiring-' + #withinDays + '-' + #limit")
    public List<ExpiringDocumentDto> getExpiringDocuments(int withinDays, int limit) {
        log.debug("Fetching expiring documents within {} days, limit {}", withinDays, limit);

        List<Object[]> data = vendorDashboardRepository.getVendorsWithExpiringDocuments(withinDays, limit);
        List<ExpiringDocumentDto> result = new ArrayList<>();

        LocalDate today = LocalDate.now();

        for (Object[] row : data) {
            String docTypeStr = (String) row[3];
            VendorDocumentType documentType = VendorDocumentType.valueOf(docTypeStr);
            LocalDate expiryDate = ((java.sql.Date) row[4]).toLocalDate();
            long daysUntilExpiry = ChronoUnit.DAYS.between(today, expiryDate);

            result.add(ExpiringDocumentDto.builder()
                    .documentId((UUID) row[0])
                    .vendorId((UUID) row[1])
                    .vendorName((String) row[2])
                    .documentType(documentType)
                    .documentTypeName(formatDocumentTypeName(documentType))
                    .expiryDate(expiryDate)
                    .daysUntilExpiry(daysUntilExpiry)
                    .isCritical(documentType.isCritical())
                    .build());
        }

        return result;
    }

    @Override
    @Cacheable(value = "vendorTopVendors", key = "'top-' + #limit")
    public List<TopVendorDto> getTopVendors(int limit) {
        log.debug("Fetching top {} vendors by jobs this month", limit);

        List<Object[]> data = vendorDashboardRepository.getTopVendorsByJobsThisMonth(limit);
        List<TopVendorDto> result = new ArrayList<>();

        int rank = 1;
        for (Object[] row : data) {
            result.add(TopVendorDto.builder()
                    .rank(rank++)
                    .vendorId((UUID) row[0])
                    .vendorName((String) row[1])
                    .jobsCompletedThisMonth(toInteger(row[2]))
                    .avgRating(toBigDecimal(row[3]))
                    .totalJobsCompleted(toInteger(row[4]))
                    .build());
        }

        return result;
    }

    // =================================================================
    // HELPER METHODS
    // =================================================================

    /**
     * Calculate performance tier based on rating and SLA compliance
     * Per story constraints:
     * - GREEN: rating >= 4 AND SLA >= 80%
     * - YELLOW: rating >= 3 OR SLA >= 60%
     * - RED: below thresholds
     */
    private VendorPerformanceSnapshotDto.PerformanceTier calculatePerformanceTier(
            BigDecimal rating, BigDecimal slaCompliance) {

        if (rating == null) rating = BigDecimal.ZERO;
        if (slaCompliance == null) slaCompliance = BigDecimal.ZERO;

        // GREEN: rating >= 4 AND SLA >= 80%
        if (rating.compareTo(GREEN_RATING_THRESHOLD) >= 0 &&
                slaCompliance.compareTo(GREEN_SLA_THRESHOLD) >= 0) {
            return VendorPerformanceSnapshotDto.PerformanceTier.GREEN;
        }

        // YELLOW: rating >= 3 OR SLA >= 60%
        if (rating.compareTo(YELLOW_RATING_THRESHOLD) >= 0 ||
                slaCompliance.compareTo(YELLOW_SLA_THRESHOLD) >= 0) {
            return VendorPerformanceSnapshotDto.PerformanceTier.YELLOW;
        }

        // RED: below thresholds
        return VendorPerformanceSnapshotDto.PerformanceTier.RED;
    }

    /**
     * Format document type name for display
     */
    private String formatDocumentTypeName(VendorDocumentType type) {
        if (type == null) return "";
        return switch (type) {
            case TRADE_LICENSE -> "Trade License";
            case INSURANCE -> "Insurance";
            case CERTIFICATION -> "Certification";
            case ID_COPY -> "ID Copy";
        };
    }

    /**
     * Convert Object to BigDecimal safely
     */
    private BigDecimal toBigDecimal(Object value) {
        if (value == null) return BigDecimal.ZERO;
        if (value instanceof BigDecimal) return (BigDecimal) value;
        if (value instanceof Number) return BigDecimal.valueOf(((Number) value).doubleValue());
        return BigDecimal.ZERO;
    }

    /**
     * Convert Object to Integer safely
     */
    private Integer toInteger(Object value) {
        if (value == null) return 0;
        if (value instanceof Integer) return (Integer) value;
        if (value instanceof Number) return ((Number) value).intValue();
        return 0;
    }

    /**
     * Convert Object to Long safely
     */
    private Long toLong(Object value) {
        if (value == null) return 0L;
        if (value instanceof Long) return (Long) value;
        if (value instanceof Number) return ((Number) value).longValue();
        return 0L;
    }
}
