package com.ultrabms.service.impl;

import com.ultrabms.dto.dashboard.maintenance.*;
import com.ultrabms.entity.enums.WorkOrderCategory;
import com.ultrabms.entity.enums.WorkOrderPriority;
import com.ultrabms.entity.enums.WorkOrderStatus;
import com.ultrabms.repository.MaintenanceDashboardRepository;
import com.ultrabms.service.MaintenanceDashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Implementation of MaintenanceDashboardService.
 * Provides maintenance dashboard data with 5-minute Ehcache caching (AC-18).
 *
 * Story 8.4: Maintenance Dashboard
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class MaintenanceDashboardServiceImpl implements MaintenanceDashboardService {

    private final MaintenanceDashboardRepository repository;

    // Color mappings for charts
    private static final Map<WorkOrderStatus, String> STATUS_COLORS = Map.of(
            WorkOrderStatus.OPEN, "#3b82f6",        // Blue
            WorkOrderStatus.ASSIGNED, "#f59e0b",    // Amber
            WorkOrderStatus.IN_PROGRESS, "#8b5cf6", // Purple
            WorkOrderStatus.COMPLETED, "#22c55e",   // Green
            WorkOrderStatus.CLOSED, "#6b7280"       // Gray
    );

    private static final Map<WorkOrderPriority, String> PRIORITY_COLORS = Map.of(
            WorkOrderPriority.LOW, "#22c55e",      // Green
            WorkOrderPriority.MEDIUM, "#f59e0b",   // Amber
            WorkOrderPriority.HIGH, "#f97316",     // Orange
            WorkOrderPriority.URGENT, "#ef4444"    // Red
    );

    private static final Map<WorkOrderCategory, String> CATEGORY_COLORS = Map.ofEntries(
            Map.entry(WorkOrderCategory.PLUMBING, "#3b82f6"),
            Map.entry(WorkOrderCategory.ELECTRICAL, "#f59e0b"),
            Map.entry(WorkOrderCategory.HVAC, "#8b5cf6"),
            Map.entry(WorkOrderCategory.APPLIANCE, "#ec4899"),
            Map.entry(WorkOrderCategory.CARPENTRY, "#10b981"),
            Map.entry(WorkOrderCategory.PEST_CONTROL, "#6366f1"),
            Map.entry(WorkOrderCategory.CLEANING, "#14b8a6"),
            Map.entry(WorkOrderCategory.PAINTING, "#f43f5e"),
            Map.entry(WorkOrderCategory.LANDSCAPING, "#84cc16"),
            Map.entry(WorkOrderCategory.INSPECTION, "#0ea5e9"),
            Map.entry(WorkOrderCategory.OTHER, "#6b7280")
    );

    // =================================================================
    // COMPLETE DASHBOARD (AC-10)
    // =================================================================

    @Override
    @Cacheable(value = "maintenanceDashboard", key = "#propertyId != null ? #propertyId.toString() : 'all'")
    public MaintenanceDashboardDto getMaintenanceDashboard(UUID propertyId) {
        log.debug("Fetching maintenance dashboard data for propertyId: {}", propertyId);

        LocalDateTime now = LocalDateTime.now();

        // Get KPIs
        MaintenanceKpiDto kpis = buildKpis(propertyId, now);

        // Get chart data
        List<JobsByStatusDto> jobsByStatus = buildJobsByStatus(propertyId);
        List<JobsByPriorityDto> jobsByPriority = buildJobsByPriority(propertyId);
        List<JobsByCategoryDto> jobsByCategory = buildJobsByCategory(propertyId);

        // Get list data (first page of high priority, all recently completed)
        List<Object[]> highPriorityResults = repository.getHighPriorityAndOverdueJobs(now, 0, 10, propertyId, null);
        Long highPriorityTotal = repository.countHighPriorityAndOverdueJobs(now, propertyId, null);
        List<HighPriorityJobDto> highPriorityJobs = mapHighPriorityJobs(highPriorityResults);

        List<Object[]> recentlyCompletedResults = repository.getRecentlyCompletedJobs(5, propertyId);
        List<RecentlyCompletedJobDto> recentlyCompletedJobs = mapRecentlyCompletedJobs(recentlyCompletedResults);

        return MaintenanceDashboardDto.builder()
                .kpis(kpis)
                .jobsByStatus(jobsByStatus)
                .jobsByPriority(jobsByPriority)
                .jobsByCategory(jobsByCategory)
                .highPriorityOverdueJobs(highPriorityJobs)
                .highPriorityOverdueTotal(highPriorityTotal)
                .recentlyCompletedJobs(recentlyCompletedJobs)
                .build();
    }

    // =================================================================
    // CHART DATA ENDPOINTS (AC-11, AC-12, AC-13)
    // =================================================================

    @Override
    @Cacheable(value = "jobsByStatus", key = "#propertyId != null ? #propertyId.toString() : 'all'")
    public List<JobsByStatusDto> getJobsByStatus(UUID propertyId) {
        log.debug("Fetching jobs by status for propertyId: {}", propertyId);
        return buildJobsByStatus(propertyId);
    }

    @Override
    @Cacheable(value = "jobsByPriority", key = "#propertyId != null ? #propertyId.toString() : 'all'")
    public List<JobsByPriorityDto> getJobsByPriority(UUID propertyId) {
        log.debug("Fetching jobs by priority for propertyId: {}", propertyId);
        return buildJobsByPriority(propertyId);
    }

    @Override
    @Cacheable(value = "jobsByCategory", key = "#propertyId != null ? #propertyId.toString() : 'all'")
    public List<JobsByCategoryDto> getJobsByCategory(UUID propertyId) {
        log.debug("Fetching jobs by category for propertyId: {}", propertyId);
        return buildJobsByCategory(propertyId);
    }

    // =================================================================
    // LIST DATA ENDPOINTS (AC-14, AC-15)
    // =================================================================

    @Override
    public Page<HighPriorityJobDto> getHighPriorityAndOverdueJobs(UUID propertyId, String statusFilter, Pageable pageable) {
        log.debug("Fetching high priority and overdue jobs for propertyId: {}, statusFilter: {}, page: {}",
                propertyId, statusFilter, pageable.getPageNumber());

        LocalDateTime now = LocalDateTime.now();
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();

        List<Object[]> results = repository.getHighPriorityAndOverdueJobs(now, offset, limit, propertyId, statusFilter);
        Long total = repository.countHighPriorityAndOverdueJobs(now, propertyId, statusFilter);

        List<HighPriorityJobDto> jobs = mapHighPriorityJobs(results);
        return new PageImpl<>(jobs, pageable, total);
    }

    @Override
    @Cacheable(value = "recentlyCompletedJobs", key = "#propertyId != null ? #propertyId.toString() + '_' + #limit : 'all_' + #limit")
    public List<RecentlyCompletedJobDto> getRecentlyCompletedJobs(UUID propertyId, int limit) {
        log.debug("Fetching recently completed jobs for propertyId: {}, limit: {}", propertyId, limit);

        List<Object[]> results = repository.getRecentlyCompletedJobs(limit, propertyId);
        return mapRecentlyCompletedJobs(results);
    }

    // =================================================================
    // PRIVATE HELPER METHODS
    // =================================================================

    private MaintenanceKpiDto buildKpis(UUID propertyId, LocalDateTime now) {
        Long activeJobs = repository.countActiveJobs(propertyId);
        Long overdueJobs = repository.countOverdueJobs(now, propertyId);
        Long pendingJobs = repository.countPendingJobs(propertyId);

        // Calculate completed this month
        YearMonth currentMonth = YearMonth.now();
        LocalDateTime currentMonthStart = currentMonth.atDay(1).atStartOfDay();
        LocalDateTime currentMonthEnd = currentMonth.atEndOfMonth().atTime(23, 59, 59);
        Long completedThisMonth = repository.countCompletedJobsInPeriod(currentMonthStart, currentMonthEnd, propertyId);

        // Calculate completed previous month
        YearMonth previousMonth = currentMonth.minusMonths(1);
        LocalDateTime previousMonthStart = previousMonth.atDay(1).atStartOfDay();
        LocalDateTime previousMonthEnd = previousMonth.atEndOfMonth().atTime(23, 59, 59);
        Long completedPreviousMonth = repository.countCompletedJobsInPeriod(previousMonthStart, previousMonthEnd, propertyId);

        // Calculate month-over-month change percentage
        Double monthOverMonthChange = null;
        if (completedPreviousMonth != null && completedPreviousMonth > 0) {
            monthOverMonthChange = ((completedThisMonth.doubleValue() - completedPreviousMonth.doubleValue())
                    / completedPreviousMonth.doubleValue()) * 100;
        }

        return MaintenanceKpiDto.builder()
                .activeJobs(activeJobs)
                .overdueJobs(overdueJobs)
                .pendingJobs(pendingJobs)
                .completedThisMonth(completedThisMonth)
                .completedPreviousMonth(completedPreviousMonth)
                .monthOverMonthChange(monthOverMonthChange)
                .build();
    }

    private List<JobsByStatusDto> buildJobsByStatus(UUID propertyId) {
        List<Object[]> results = repository.getJobsByStatus(propertyId);

        // Calculate total for percentages
        long total = results.stream()
                .mapToLong(row -> ((Number) row[1]).longValue())
                .sum();

        return results.stream()
                .map(row -> {
                    String statusStr = (String) row[0];
                    WorkOrderStatus status = WorkOrderStatus.valueOf(statusStr);
                    Long count = ((Number) row[1]).longValue();

                    return JobsByStatusDto.builder()
                            .status(status)
                            .label(formatStatusLabel(status))
                            .count(count)
                            .percentage(total > 0 ? (count.doubleValue() / total) * 100 : 0.0)
                            .color(STATUS_COLORS.getOrDefault(status, "#6b7280"))
                            .build();
                })
                .collect(Collectors.toList());
    }

    private List<JobsByPriorityDto> buildJobsByPriority(UUID propertyId) {
        List<Object[]> results = repository.getJobsByPriority(propertyId);

        return results.stream()
                .map(row -> {
                    String priorityStr = (String) row[0];
                    WorkOrderPriority priority = WorkOrderPriority.valueOf(priorityStr);
                    Long count = ((Number) row[1]).longValue();

                    return JobsByPriorityDto.builder()
                            .priority(priority)
                            .label(formatPriorityLabel(priority))
                            .count(count)
                            .color(PRIORITY_COLORS.getOrDefault(priority, "#6b7280"))
                            .build();
                })
                .collect(Collectors.toList());
    }

    private List<JobsByCategoryDto> buildJobsByCategory(UUID propertyId) {
        List<Object[]> results = repository.getJobsByCategory(propertyId);

        return results.stream()
                .map(row -> {
                    String categoryStr = (String) row[0];
                    WorkOrderCategory category = WorkOrderCategory.valueOf(categoryStr);
                    Long count = ((Number) row[1]).longValue();

                    return JobsByCategoryDto.builder()
                            .category(category)
                            .label(formatCategoryLabel(category))
                            .count(count)
                            .color(CATEGORY_COLORS.getOrDefault(category, "#6b7280"))
                            .build();
                })
                .collect(Collectors.toList());
    }

    private List<HighPriorityJobDto> mapHighPriorityJobs(List<Object[]> results) {
        return results.stream()
                .map(row -> HighPriorityJobDto.builder()
                        .id((UUID) row[0])
                        .workOrderNumber((String) row[1])
                        .propertyName((String) row[2])
                        .unitNumber((String) row[3])
                        .title((String) row[4])
                        .priority(WorkOrderPriority.valueOf((String) row[5]))
                        .status(WorkOrderStatus.valueOf((String) row[6]))
                        .assignedToName((String) row[7])
                        .scheduledDate(row[8] != null ? ((java.sql.Timestamp) row[8]).toLocalDateTime() : null)
                        .daysOverdue(row[9] != null ? ((Number) row[9]).intValue() : 0)
                        .isOverdue(row[10] != null && (Boolean) row[10])
                        .build())
                .collect(Collectors.toList());
    }

    private List<RecentlyCompletedJobDto> mapRecentlyCompletedJobs(List<Object[]> results) {
        return results.stream()
                .map(row -> RecentlyCompletedJobDto.builder()
                        .id((UUID) row[0])
                        .workOrderNumber((String) row[1])
                        .title((String) row[2])
                        .propertyName((String) row[3])
                        .completedAt(row[4] != null ? ((java.sql.Timestamp) row[4]).toLocalDateTime() : null)
                        .completedByName((String) row[5])
                        .build())
                .collect(Collectors.toList());
    }

    // =================================================================
    // LABEL FORMATTERS
    // =================================================================

    private String formatStatusLabel(WorkOrderStatus status) {
        return switch (status) {
            case OPEN -> "Open";
            case ASSIGNED -> "Assigned";
            case IN_PROGRESS -> "In Progress";
            case COMPLETED -> "Completed";
            case CLOSED -> "Closed";
        };
    }

    private String formatPriorityLabel(WorkOrderPriority priority) {
        return switch (priority) {
            case LOW -> "Low";
            case MEDIUM -> "Medium";
            case HIGH -> "High";
            case URGENT -> "Urgent";
        };
    }

    private String formatCategoryLabel(WorkOrderCategory category) {
        return switch (category) {
            case PLUMBING -> "Plumbing";
            case ELECTRICAL -> "Electrical";
            case HVAC -> "HVAC";
            case APPLIANCE -> "Appliance";
            case CARPENTRY -> "Carpentry";
            case PEST_CONTROL -> "Pest Control";
            case CLEANING -> "Cleaning";
            case PAINTING -> "Painting";
            case LANDSCAPING -> "Landscaping";
            case INSPECTION -> "Inspection";
            case OTHER -> "Other";
        };
    }
}
