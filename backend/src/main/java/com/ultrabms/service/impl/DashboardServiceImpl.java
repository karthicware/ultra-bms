package com.ultrabms.service.impl;

import com.ultrabms.dto.dashboard.*;
import com.ultrabms.dto.dashboard.AlertDto.AlertSeverity;
import com.ultrabms.dto.dashboard.AlertDto.AlertType;
import com.ultrabms.dto.dashboard.KpiCardsDto.AgingBreakdown;
import com.ultrabms.dto.dashboard.KpiCardsDto.KpiCardDto;
import com.ultrabms.dto.dashboard.KpiCardsDto.ReceivablesKpiDto;
import com.ultrabms.dto.dashboard.KpiCardsDto.TrendDirection;
import com.ultrabms.dto.dashboard.PropertyComparisonDto.PerformanceRank;
import com.ultrabms.repository.DashboardRepository;
import com.ultrabms.service.DashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Month;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Implementation of DashboardService for Executive Dashboard.
 * Uses caching and optimized queries for performance.
 *
 * Story 8.1: Executive Summary Dashboard
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class DashboardServiceImpl implements DashboardService {

    private final DashboardRepository dashboardRepository;

    private static final int DEFAULT_MAINTENANCE_QUEUE_LIMIT = 5;
    private static final int DEFAULT_PM_JOBS_DAYS = 30;
    private static final int DEFAULT_LEASE_MONTHS = 12;
    private static final int RENEWAL_PLANNING_THRESHOLD = 5;

    // =================================================================
    // COMPLETE DASHBOARD (AC-11)
    // =================================================================

    @Override
    @Cacheable(value = "executiveDashboard", key = "#propertyId + '_' + #startDate + '_' + #endDate",
            unless = "#result == null")
    public ExecutiveDashboardDto getExecutiveDashboard(UUID propertyId, LocalDate startDate, LocalDate endDate) {
        log.debug("Fetching executive dashboard for propertyId={}, period={} to {}", propertyId, startDate, endDate);

        // Default date range: current year to today
        LocalDate effectiveStartDate = startDate != null ? startDate : LocalDate.of(LocalDate.now().getYear(), 1, 1);
        LocalDate effectiveEndDate = endDate != null ? endDate : LocalDate.now();

        return ExecutiveDashboardDto.builder()
                .kpis(getKpiCards(propertyId, effectiveStartDate, effectiveEndDate))
                .priorityMaintenanceQueue(getPriorityMaintenanceQueue(propertyId, DEFAULT_MAINTENANCE_QUEUE_LIMIT))
                .upcomingPmJobs(getUpcomingPmJobs(propertyId, DEFAULT_PM_JOBS_DAYS))
                .leaseExpirations(getLeaseExpirationTimeline(propertyId, DEFAULT_LEASE_MONTHS))
                .criticalAlerts(getCriticalAlerts(propertyId))
                .propertyComparison(getPropertyComparison(effectiveStartDate, effectiveEndDate))
                .build();
    }

    // =================================================================
    // KPI DATA (AC-12)
    // =================================================================

    @Override
    @Cacheable(value = "dashboardKpis", key = "#propertyId + '_' + #startDate + '_' + #endDate",
            unless = "#result == null")
    public KpiCardsDto getKpiCards(UUID propertyId, LocalDate startDate, LocalDate endDate) {
        log.debug("Calculating KPI cards for propertyId={}, period={} to {}", propertyId, startDate, endDate);

        // Calculate previous period for trend comparison
        long periodDays = java.time.temporal.ChronoUnit.DAYS.between(startDate, endDate);
        LocalDate prevStartDate = startDate.minusDays(periodDays);
        LocalDate prevEndDate = startDate.minusDays(1);

        return KpiCardsDto.builder()
                .netProfitLoss(calculateNetProfitLoss(propertyId, startDate, endDate, prevStartDate, prevEndDate))
                .occupancyRate(calculateOccupancyRate(propertyId))
                .overdueMaintenance(calculateOverdueMaintenance(propertyId))
                .outstandingReceivables(calculateReceivables(propertyId))
                .build();
    }

    private KpiCardDto calculateNetProfitLoss(UUID propertyId, LocalDate startDate, LocalDate endDate,
                                               LocalDate prevStartDate, LocalDate prevEndDate) {
        // Current period
        BigDecimal revenue = dashboardRepository.getTotalRevenueForPeriod(startDate, endDate, propertyId);
        BigDecimal expenses = dashboardRepository.getTotalExpensesForPeriod(startDate, endDate, propertyId);
        BigDecimal netProfitLoss = revenue.subtract(expenses);

        // Previous period for trend
        BigDecimal prevRevenue = dashboardRepository.getTotalRevenueForPeriod(prevStartDate, prevEndDate, propertyId);
        BigDecimal prevExpenses = dashboardRepository.getTotalExpensesForPeriod(prevStartDate, prevEndDate, propertyId);
        BigDecimal prevNetProfitLoss = prevRevenue.subtract(prevExpenses);

        BigDecimal changePercent = calculateChangePercent(netProfitLoss, prevNetProfitLoss);

        return KpiCardDto.builder()
                .value(netProfitLoss)
                .previousValue(prevNetProfitLoss)
                .changePercentage(changePercent)
                .trend(determineTrend(changePercent, true)) // Higher is better
                .formattedValue(formatCurrency(netProfitLoss))
                .unit("AED")
                .build();
    }

    private KpiCardDto calculateOccupancyRate(UUID propertyId) {
        Object[] stats = dashboardRepository.getOccupancyStats(propertyId);
        long totalUnits = ((Number) stats[0]).longValue();
        long occupiedUnits = ((Number) stats[1]).longValue();

        BigDecimal occupancyRate = totalUnits > 0
                ? BigDecimal.valueOf(occupiedUnits)
                    .divide(BigDecimal.valueOf(totalUnits), 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                : BigDecimal.ZERO;

        return KpiCardDto.builder()
                .value(occupancyRate)
                .previousValue(null) // No previous period for occupancy snapshot
                .changePercentage(null)
                .trend(TrendDirection.NEUTRAL)
                .formattedValue(occupancyRate.setScale(1, RoundingMode.HALF_UP) + "%")
                .unit("%")
                .build();
    }

    private KpiCardDto calculateOverdueMaintenance(UUID propertyId) {
        Long overdueCount = dashboardRepository.countOverdueMaintenanceJobs(
                LocalDateTime.now(), propertyId);

        return KpiCardDto.builder()
                .value(BigDecimal.valueOf(overdueCount))
                .previousValue(null)
                .changePercentage(null)
                .trend(overdueCount > 0 ? TrendDirection.DOWN : TrendDirection.NEUTRAL) // Lower is better
                .formattedValue(String.valueOf(overdueCount))
                .unit("count")
                .build();
    }

    private ReceivablesKpiDto calculateReceivables(UUID propertyId) {
        Object[] aging = dashboardRepository.getReceivablesAging(LocalDate.now(), propertyId);

        BigDecimal totalOutstanding = new BigDecimal(aging[0].toString());
        BigDecimal current = new BigDecimal(aging[1].toString());
        BigDecimal thirtyPlus = new BigDecimal(aging[2].toString());
        BigDecimal sixtyPlus = new BigDecimal(aging[3].toString());
        BigDecimal ninetyPlus = new BigDecimal(aging[4].toString());

        return ReceivablesKpiDto.builder()
                .totalAmount(totalOutstanding)
                .changePercentage(null)
                .trend(TrendDirection.NEUTRAL)
                .aging(AgingBreakdown.builder()
                        .current(current)
                        .thirtyPlus(thirtyPlus)
                        .sixtyPlus(sixtyPlus)
                        .ninetyPlus(ninetyPlus)
                        .build())
                .build();
    }

    // =================================================================
    // PRIORITY MAINTENANCE QUEUE (AC-13)
    // =================================================================

    @Override
    @Cacheable(value = "maintenanceQueue", key = "#propertyId + '_' + #limit", unless = "#result == null")
    public List<MaintenanceQueueItemDto> getPriorityMaintenanceQueue(UUID propertyId, int limit) {
        log.debug("Fetching priority maintenance queue for propertyId={}, limit={}", propertyId, limit);

        List<Object[]> results = dashboardRepository.getHighPriorityMaintenanceQueue(
                limit > 0 ? limit : DEFAULT_MAINTENANCE_QUEUE_LIMIT, propertyId);

        return results.stream()
                .map(this::mapToMaintenanceQueueItem)
                .collect(Collectors.toList());
    }

    private MaintenanceQueueItemDto mapToMaintenanceQueueItem(Object[] row) {
        return MaintenanceQueueItemDto.builder()
                .id((UUID) row[0])
                .workOrderNumber((String) row[1])
                .propertyName((String) row[2])
                .unitNumber((String) row[3])
                .title((String) row[4])
                .description((String) row[5])
                .priority((String) row[6])
                .status((String) row[7])
                .scheduledDate(row[8] != null ? ((java.sql.Timestamp) row[8]).toLocalDateTime().toLocalDate() : null)
                .daysOverdue(row[9] != null ? ((Number) row[9]).intValue() : 0)
                .isOverdue((Boolean) row[10])
                .build();
    }

    // =================================================================
    // PM JOBS CHART DATA (AC-14)
    // =================================================================

    @Override
    @Cacheable(value = "pmJobsChart", key = "#propertyId + '_' + #days", unless = "#result == null")
    public List<PmJobChartDataDto> getUpcomingPmJobs(UUID propertyId, int days) {
        log.debug("Fetching upcoming PM jobs for propertyId={}, days={}", propertyId, days);

        List<Object[]> results = dashboardRepository.getUpcomingPmJobsByCategory(
                days > 0 ? days : DEFAULT_PM_JOBS_DAYS, propertyId);

        return results.stream()
                .map(row -> PmJobChartDataDto.builder()
                        .category((String) row[0])
                        .scheduledCount(((Number) row[1]).intValue())
                        .overdueCount(((Number) row[2]).intValue())
                        .totalCount(((Number) row[3]).intValue())
                        .build())
                .collect(Collectors.toList());
    }

    // =================================================================
    // LEASE EXPIRATIONS TIMELINE (AC-15)
    // =================================================================

    @Override
    @Cacheable(value = "leaseExpirations", key = "#propertyId + '_' + #months", unless = "#result == null")
    public List<LeaseExpirationTimelineDto> getLeaseExpirationTimeline(UUID propertyId, int months) {
        log.debug("Fetching lease expirations for propertyId={}, months={}", propertyId, months);

        List<Object[]> results = dashboardRepository.getLeaseExpirationTimeline(
                months > 0 ? months : DEFAULT_LEASE_MONTHS, propertyId);

        return results.stream()
                .map(row -> {
                    int year = ((Number) row[0]).intValue();
                    int month = ((Number) row[1]).intValue();
                    int count = ((Number) row[2]).intValue();
                    String monthName = Month.of(month).getDisplayName(TextStyle.SHORT, Locale.ENGLISH);

                    return LeaseExpirationTimelineDto.builder()
                            .year(year)
                            .month(month)
                            .monthName(monthName)
                            .expirationCount(count)
                            .needsRenewalPlanning(count > RENEWAL_PLANNING_THRESHOLD)
                            .build();
                })
                .collect(Collectors.toList());
    }

    // =================================================================
    // CRITICAL ALERTS (AC-16)
    // =================================================================

    @Override
    @Cacheable(value = "criticalAlerts", key = "#propertyId", unless = "#result == null")
    public List<AlertDto> getCriticalAlerts(UUID propertyId) {
        log.debug("Fetching critical alerts for propertyId={}", propertyId);

        List<Object[]> results = dashboardRepository.getCriticalAlerts(propertyId);

        return results.stream()
                .filter(row -> ((Number) row[2]).longValue() > 0) // Only include alerts with count > 0
                .map(row -> {
                    String alertType = (String) row[0];
                    String severity = (String) row[1];
                    long count = ((Number) row[2]).longValue();

                    return AlertDto.builder()
                            .id(UUID.randomUUID())
                            .type(AlertType.valueOf(alertType))
                            .severity(AlertSeverity.valueOf(severity))
                            .title(getAlertTitle(alertType))
                            .description(getAlertDescription(alertType, count))
                            .count((int) count)
                            .actionUrl(getAlertActionUrl(alertType))
                            .build();
                })
                .sorted(Comparator.comparing(alert -> {
                    // Sort by severity: URGENT first, then WARNING, then INFO
                    return switch (alert.getSeverity()) {
                        case URGENT -> 0;
                        case WARNING -> 1;
                        case INFO -> 2;
                    };
                }))
                .collect(Collectors.toList());
    }

    private String getAlertTitle(String alertType) {
        return switch (alertType) {
            case "OVERDUE_COMPLIANCE" -> "Overdue Compliance";
            case "BOUNCED_CHEQUES" -> "Bounced Cheques";
            case "EXPIRED_VENDOR_LICENSES" -> "Expired Vendor Licenses";
            case "DOCUMENTS_EXPIRING_SOON" -> "Documents Expiring Soon";
            case "HIGH_VALUE_INVOICE_OVERDUE" -> "High-Value Invoices Overdue";
            case "LOW_OCCUPANCY" -> "Low Occupancy Properties";
            case "HIGH_MAINTENANCE_COST" -> "High Maintenance Costs";
            default -> alertType;
        };
    }

    private String getAlertDescription(String alertType, long count) {
        return switch (alertType) {
            case "OVERDUE_COMPLIANCE" -> count + " compliance items are overdue";
            case "BOUNCED_CHEQUES" -> count + " cheques have bounced";
            case "EXPIRED_VENDOR_LICENSES" -> count + " vendor licenses have expired";
            case "DOCUMENTS_EXPIRING_SOON" -> count + " documents expiring within 7 days";
            case "HIGH_VALUE_INVOICE_OVERDUE" -> count + " high-value invoices (>10K AED) are overdue";
            case "LOW_OCCUPANCY" -> count + " properties have <70% occupancy";
            case "HIGH_MAINTENANCE_COST" -> count + " properties have high maintenance costs";
            default -> count + " items require attention";
        };
    }

    private String getAlertActionUrl(String alertType) {
        return switch (alertType) {
            case "OVERDUE_COMPLIANCE" -> "/compliance?status=OVERDUE";
            case "BOUNCED_CHEQUES" -> "/finance/payments?status=BOUNCED";
            case "EXPIRED_VENDOR_LICENSES" -> "/vendors?documentsExpired=true";
            case "DOCUMENTS_EXPIRING_SOON" -> "/vendors?documentsExpiringSoon=true";
            case "HIGH_VALUE_INVOICE_OVERDUE" -> "/finance/invoices?status=OVERDUE&minAmount=10000";
            case "LOW_OCCUPANCY" -> "/properties?lowOccupancy=true";
            case "HIGH_MAINTENANCE_COST" -> "/finance/expenses?category=MAINTENANCE";
            default -> "/";
        };
    }

    // =================================================================
    // PROPERTY COMPARISON (AC-17)
    // =================================================================

    @Override
    @Cacheable(value = "propertyComparison", key = "#startDate + '_' + #endDate", unless = "#result == null")
    public List<PropertyComparisonDto> getPropertyComparison(LocalDate startDate, LocalDate endDate) {
        log.debug("Fetching property comparison for period={} to {}", startDate, endDate);

        List<Object[]> results = dashboardRepository.getPropertyComparison(startDate, endDate);

        // Convert to DTOs
        List<PropertyComparisonDto> properties = results.stream()
                .map(row -> PropertyComparisonDto.builder()
                        .propertyId((UUID) row[0])
                        .propertyName((String) row[1])
                        .occupancyRate(new BigDecimal(row[2].toString()).setScale(1, RoundingMode.HALF_UP))
                        .maintenanceCost(new BigDecimal(row[3].toString()))
                        .revenue(new BigDecimal(row[4].toString()))
                        .openWorkOrders(((Number) row[5]).intValue())
                        .rank(PerformanceRank.MIDDLE) // Will be set below
                        .build())
                .collect(Collectors.toList());

        // Calculate performance ranking based on revenue
        if (!properties.isEmpty()) {
            properties.sort(Comparator.comparing(PropertyComparisonDto::getRevenue).reversed());

            int size = properties.size();
            int topThreshold = Math.max(1, size / 3);
            int bottomThreshold = Math.max(1, size - size / 3);

            for (int i = 0; i < properties.size(); i++) {
                if (i < topThreshold) {
                    properties.get(i).setRank(PerformanceRank.TOP);
                } else if (i >= bottomThreshold) {
                    properties.get(i).setRank(PerformanceRank.BOTTOM);
                }
            }

            // Re-sort by property name for consistent display
            properties.sort(Comparator.comparing(PropertyComparisonDto::getPropertyName));
        }

        return properties;
    }

    // =================================================================
    // UTILITY METHODS
    // =================================================================

    private BigDecimal calculateChangePercent(BigDecimal current, BigDecimal previous) {
        if (previous == null || previous.compareTo(BigDecimal.ZERO) == 0) {
            return null;
        }
        return current.subtract(previous)
                .divide(previous.abs(), 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100));
    }

    private TrendDirection determineTrend(BigDecimal changePercent, boolean higherIsBetter) {
        if (changePercent == null) {
            return TrendDirection.NEUTRAL;
        }
        if (changePercent.compareTo(BigDecimal.ZERO) > 0) {
            return higherIsBetter ? TrendDirection.UP : TrendDirection.DOWN;
        } else if (changePercent.compareTo(BigDecimal.ZERO) < 0) {
            return higherIsBetter ? TrendDirection.DOWN : TrendDirection.UP;
        }
        return TrendDirection.NEUTRAL;
    }

    private String formatCurrency(BigDecimal amount) {
        if (amount == null) {
            return "AED 0.00";
        }
        return "AED " + String.format("%,.2f", amount);
    }
}
