package com.ultrabms.service.impl;

import com.ultrabms.dto.dashboard.occupancy.*;
import com.ultrabms.dto.dashboard.occupancy.LeaseActivityDto.ActivityType;
import com.ultrabms.dto.dashboard.occupancy.OccupancyKpiDto.KpiValue;
import com.ultrabms.dto.dashboard.occupancy.OccupancyKpiDto.TrendDirection;
import com.ultrabms.dto.dashboard.occupancy.PortfolioOccupancyChartDto.OccupancySegment;
import com.ultrabms.dto.dashboard.occupancy.LeaseExpirationChartDto.MonthlyExpiration;
import com.ultrabms.repository.OccupancyDashboardRepository;
import com.ultrabms.service.OccupancyDashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Implementation of OccupancyDashboardService.
 * Uses caching (5-minute TTL) for performance per AC-15.
 *
 * Story 8.3: Occupancy Dashboard
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class OccupancyDashboardServiceImpl implements OccupancyDashboardService {

    private final OccupancyDashboardRepository occupancyDashboardRepository;

    // AC-12: Default configurable lease expiry period (100 days)
    // TODO: Add leaseExpiryDays field to CompanyProfile entity and read from there
    private static final int DEFAULT_EXPIRY_PERIOD_DAYS = 100;
    private static final int DEFAULT_ACTIVITY_LIMIT = 10;
    private static final int DEFAULT_EXPIRATION_LIST_LIMIT = 10;
    private static final int LEASE_CHART_MONTHS = 12;
    private static final int TREND_CALCULATION_DAYS = 30; // Days to look back for trend calculation

    // Chart colors for occupancy segments
    private static final Map<String, String> OCCUPANCY_COLORS = Map.of(
            "Occupied", "#22c55e",      // Green
            "Vacant", "#ef4444",         // Red
            "Under Renovation", "#f59e0b", // Amber
            "Notice Period", "#3b82f6"   // Blue
    );

    // =================================================================
    // COMPLETE DASHBOARD (AC-9)
    // =================================================================

    @Override
    @Cacheable(value = "occupancyDashboard", key = "#propertyId != null ? #propertyId.toString() : 'all'",
            unless = "#result == null")
    public OccupancyDashboardDto getOccupancyDashboard(UUID propertyId) {
        log.debug("Fetching occupancy dashboard for propertyId={}", propertyId);

        int expiryDays = getDefaultExpiryPeriodDays();

        return OccupancyDashboardDto.builder()
                .kpis(buildKpis(propertyId, expiryDays))
                .occupancyChart(buildOccupancyChart(propertyId))
                .leaseExpirationChart(buildLeaseExpirationChart(propertyId))
                .upcomingExpirations(getLeaseExpirations(expiryDays, 0, DEFAULT_EXPIRATION_LIST_LIMIT, propertyId))
                .recentActivity(getRecentActivity(DEFAULT_ACTIVITY_LIMIT, propertyId))
                .expiryPeriodDays(expiryDays)
                .build();
    }

    // =================================================================
    // KPI CALCULATIONS (AC-1 to AC-4)
    // =================================================================

    private OccupancyKpiDto buildKpis(UUID propertyId, int expiryDays) {
        log.debug("Calculating KPI values for propertyId={}", propertyId);

        Object[] occupancyStats = occupancyDashboardRepository.getOccupancyBreakdown(propertyId);
        Object[] rentStats = occupancyDashboardRepository.getAverageRentPerSqft(propertyId);
        Long expiringCount = occupancyDashboardRepository.countExpiringLeases(expiryDays, propertyId);
        Long vacantCount = occupancyDashboardRepository.countVacantUnits(propertyId);

        // Calculate occupancy rate
        long totalUnits = ((Number) occupancyStats[0]).longValue();
        long occupiedUnits = ((Number) occupancyStats[1]).longValue();
        BigDecimal occupancyRate = totalUnits > 0
                ? BigDecimal.valueOf(occupiedUnits)
                    .divide(BigDecimal.valueOf(totalUnits), 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                : BigDecimal.ZERO;

        // Average rent per sqft
        BigDecimal avgRentPerSqft = rentStats[2] != null
                ? new BigDecimal(rentStats[2].toString()).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // AC-1: Calculate trend based on recent lease activity
        TrendCalculation trendCalc = calculateOccupancyTrend(propertyId, totalUnits, occupiedUnits);

        return OccupancyKpiDto.builder()
                .portfolioOccupancy(KpiValue.builder()
                        .value(occupancyRate.setScale(1, RoundingMode.HALF_UP))
                        .previousValue(trendCalc.previousRate())
                        .changePercentage(trendCalc.changePercentage())
                        .trend(trendCalc.trend())
                        .formattedValue(occupancyRate.setScale(1, RoundingMode.HALF_UP) + "%")
                        .unit("%")
                        .build())
                .vacantUnits(KpiValue.builder()
                        .value(BigDecimal.valueOf(vacantCount))
                        .previousValue(null)
                        .changePercentage(null)
                        .trend(vacantCount > 0 ? TrendDirection.DOWN : TrendDirection.NEUTRAL) // Lower is better
                        .formattedValue(String.valueOf(vacantCount))
                        .unit("count")
                        .build())
                .leasesExpiring(KpiValue.builder()
                        .value(BigDecimal.valueOf(expiringCount))
                        .previousValue(null)
                        .changePercentage(null)
                        .trend(TrendDirection.NEUTRAL)
                        .formattedValue(String.valueOf(expiringCount))
                        .unit("count")
                        .build())
                .averageRentPerSqft(KpiValue.builder()
                        .value(avgRentPerSqft)
                        .previousValue(null)
                        .changePercentage(null)
                        .trend(TrendDirection.NEUTRAL)
                        .formattedValue(formatCurrency(avgRentPerSqft) + "/sqft")
                        .unit("AED/sqft")
                        .build())
                .build();
    }

    /**
     * AC-1: Calculate occupancy trend based on recent lease activity.
     * Compares new leases vs checkouts in the last 30 days to determine trend direction.
     */
    private TrendCalculation calculateOccupancyTrend(UUID propertyId, long totalUnits, long currentOccupied) {
        try {
            Object[] activityCounts = occupancyDashboardRepository.getActivityCountsForTrend(
                    TREND_CALCULATION_DAYS, propertyId);

            long newLeases = ((Number) activityCounts[0]).longValue();
            long checkouts = ((Number) activityCounts[1]).longValue();

            // Estimate previous occupied = current - new leases + checkouts
            long previousOccupied = currentOccupied - newLeases + checkouts;
            previousOccupied = Math.max(0, Math.min(previousOccupied, totalUnits)); // Clamp to valid range

            // Calculate rates
            BigDecimal currentRate = totalUnits > 0
                    ? BigDecimal.valueOf(currentOccupied)
                        .divide(BigDecimal.valueOf(totalUnits), 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100))
                    : BigDecimal.ZERO;

            BigDecimal previousRate = totalUnits > 0
                    ? BigDecimal.valueOf(previousOccupied)
                        .divide(BigDecimal.valueOf(totalUnits), 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100))
                    : BigDecimal.ZERO;

            // Calculate change percentage
            BigDecimal changePercentage = currentRate.subtract(previousRate).setScale(1, RoundingMode.HALF_UP);

            // Determine trend direction
            TrendDirection trend;
            if (changePercentage.compareTo(BigDecimal.ZERO) > 0) {
                trend = TrendDirection.UP;
            } else if (changePercentage.compareTo(BigDecimal.ZERO) < 0) {
                trend = TrendDirection.DOWN;
            } else {
                trend = TrendDirection.NEUTRAL;
            }

            log.debug("Occupancy trend calculation: newLeases={}, checkouts={}, prevOccupied={}, " +
                    "currentRate={}, previousRate={}, change={}, trend={}",
                    newLeases, checkouts, previousOccupied, currentRate, previousRate, changePercentage, trend);

            return new TrendCalculation(
                    previousRate.setScale(1, RoundingMode.HALF_UP),
                    changePercentage,
                    trend
            );
        } catch (Exception e) {
            log.warn("Error calculating occupancy trend, defaulting to NEUTRAL: {}", e.getMessage());
            return new TrendCalculation(null, null, TrendDirection.NEUTRAL);
        }
    }

    /**
     * Record to hold trend calculation results.
     */
    private record TrendCalculation(BigDecimal previousRate, BigDecimal changePercentage, TrendDirection trend) {}

    // =================================================================
    // OCCUPANCY DONUT CHART (AC-5)
    // =================================================================

    private PortfolioOccupancyChartDto buildOccupancyChart(UUID propertyId) {
        log.debug("Building occupancy chart for propertyId={}", propertyId);

        Object[] stats = occupancyDashboardRepository.getOccupancyBreakdown(propertyId);

        long totalUnits = ((Number) stats[0]).longValue();
        long occupiedUnits = ((Number) stats[1]).longValue();
        long vacantUnits = ((Number) stats[2]).longValue();
        long underRenovationUnits = ((Number) stats[3]).longValue();
        long noticePeriodUnits = ((Number) stats[4]).longValue();

        List<OccupancySegment> segments = new ArrayList<>();

        // Only add segments with count > 0
        if (occupiedUnits > 0) {
            segments.add(buildSegment("Occupied", occupiedUnits, totalUnits));
        }
        if (vacantUnits > 0) {
            segments.add(buildSegment("Vacant", vacantUnits, totalUnits));
        }
        if (underRenovationUnits > 0) {
            segments.add(buildSegment("Under Renovation", underRenovationUnits, totalUnits));
        }
        if (noticePeriodUnits > 0) {
            segments.add(buildSegment("Notice Period", noticePeriodUnits, totalUnits));
        }

        return PortfolioOccupancyChartDto.builder()
                .totalUnits(totalUnits)
                .segments(segments)
                .build();
    }

    private OccupancySegment buildSegment(String status, long count, long total) {
        BigDecimal percentage = total > 0
                ? BigDecimal.valueOf(count)
                    .divide(BigDecimal.valueOf(total), 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .setScale(1, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        return OccupancySegment.builder()
                .status(status)
                .count(count)
                .percentage(percentage)
                .color(OCCUPANCY_COLORS.getOrDefault(status, "#94a3b8")) // Default gray
                .build();
    }

    // =================================================================
    // LEASE EXPIRATIONS BAR CHART (AC-6)
    // =================================================================

    private LeaseExpirationChartDto buildLeaseExpirationChart(UUID propertyId) {
        log.debug("Building lease expiration chart for propertyId={}", propertyId);

        List<Object[]> monthlyData = occupancyDashboardRepository.getLeaseExpirationsByMonth(
                LEASE_CHART_MONTHS, propertyId);

        List<MonthlyExpiration> expirations = monthlyData.stream()
                .map(row -> MonthlyExpiration.builder()
                        .month((String) row[2])        // month_label
                        .yearMonth((String) row[3])    // year_month
                        .totalCount(((Number) row[4]).longValue())
                        .renewedCount(((Number) row[5]).longValue())
                        .pendingCount(((Number) row[6]).longValue())
                        .build())
                .collect(Collectors.toList());

        long totalExpiring = expirations.stream()
                .mapToLong(MonthlyExpiration::getTotalCount)
                .sum();

        return LeaseExpirationChartDto.builder()
                .monthlyData(expirations)
                .totalExpiring(totalExpiring)
                .build();
    }

    // =================================================================
    // LEASE EXPIRATIONS LIST (AC-7, AC-10)
    // =================================================================

    @Override
    @Cacheable(value = "occupancyLeaseExpirations",
            key = "#days + '_' + #page + '_' + #size + '_' + (#propertyId != null ? #propertyId.toString() : 'all')",
            unless = "#result == null")
    public List<LeaseExpirationListDto> getLeaseExpirations(int days, int page, int size, UUID propertyId) {
        log.debug("Fetching lease expirations: days={}, page={}, size={}, propertyId={}",
                days, page, size, propertyId);

        int effectiveDays = days > 0 ? days : DEFAULT_EXPIRY_PERIOD_DAYS;
        int effectiveSize = size > 0 ? size : DEFAULT_EXPIRATION_LIST_LIMIT;
        int offset = page * effectiveSize;

        List<Object[]> results = occupancyDashboardRepository.getUpcomingLeaseExpirations(
                effectiveDays, effectiveSize, offset, propertyId);

        return results.stream()
                .map(this::mapToLeaseExpirationDto)
                .collect(Collectors.toList());
    }

    private LeaseExpirationListDto mapToLeaseExpirationDto(Object[] row) {
        return LeaseExpirationListDto.builder()
                .tenantId((UUID) row[0])
                .tenantName((String) row[1])
                .unitId((UUID) row[2])
                .unitNumber((String) row[3])
                .propertyId((UUID) row[4])
                .propertyName((String) row[5])
                .expiryDate(row[6] != null ? ((java.sql.Date) row[6]).toLocalDate() : null)
                .daysRemaining(row[7] != null ? ((Number) row[7]).longValue() : 0L)
                .isRenewed((Boolean) row[8])
                .renewalStatus((String) row[9])
                .build();
    }

    // =================================================================
    // RECENT ACTIVITY (AC-8, AC-11)
    // =================================================================

    @Override
    @Cacheable(value = "occupancyRecentActivity",
            key = "#limit + '_' + (#propertyId != null ? #propertyId.toString() : 'all')",
            unless = "#result == null")
    public List<LeaseActivityDto> getRecentActivity(int limit, UUID propertyId) {
        log.debug("Fetching recent activity: limit={}, propertyId={}", limit, propertyId);

        int effectiveLimit = limit > 0 ? limit : DEFAULT_ACTIVITY_LIMIT;

        List<Object[]> results = occupancyDashboardRepository.getRecentLeaseActivity(
                effectiveLimit, propertyId);

        return results.stream()
                .map(this::mapToLeaseActivityDto)
                .collect(Collectors.toList());
    }

    private LeaseActivityDto mapToLeaseActivityDto(Object[] row) {
        String activityTypeStr = (String) row[1];
        ActivityType activityType = ActivityType.valueOf(activityTypeStr);

        LocalDateTime timestamp = null;
        if (row[7] != null) {
            if (row[7] instanceof Timestamp) {
                timestamp = ((Timestamp) row[7]).toLocalDateTime();
            } else if (row[7] instanceof LocalDateTime) {
                timestamp = (LocalDateTime) row[7];
            }
        }

        return LeaseActivityDto.builder()
                .id((UUID) row[0])
                .activityType(activityType)
                .tenantId((UUID) row[2])
                .tenantName((String) row[3])
                .unitId((UUID) row[4])
                .unitNumber((String) row[5])
                .propertyName((String) row[6])
                .timestamp(timestamp)
                .description((String) row[8])
                .icon(activityType.getIcon())
                .color(activityType.getColor())
                .build();
    }

    // =================================================================
    // CONFIGURATION (AC-12)
    // =================================================================

    @Override
    public int getDefaultExpiryPeriodDays() {
        // TODO: Read from CompanyProfile.leaseExpiryDays when field is added
        // CompanyProfile profile = companyProfileService.getCompanyProfile();
        // return profile.getLeaseExpiryDays() != null ? profile.getLeaseExpiryDays() : DEFAULT_EXPIRY_PERIOD_DAYS;
        return DEFAULT_EXPIRY_PERIOD_DAYS;
    }

    // =================================================================
    // UTILITY METHODS
    // =================================================================

    private String formatCurrency(BigDecimal amount) {
        if (amount == null) {
            return "AED 0.00";
        }
        return "AED " + String.format("%,.2f", amount);
    }
}
