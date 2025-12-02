package com.ultrabms.controller;

import com.ultrabms.dto.dashboard.*;
import com.ultrabms.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST Controller for Executive Dashboard APIs
 * Provides KPI data, charts, alerts, and property comparison data.
 *
 * Story 8.1: Executive Summary Dashboard
 * AC-11 to AC-17: Dashboard REST endpoints
 */
@RestController
@RequestMapping("/api/v1/dashboard")
@Tag(name = "Dashboard", description = "Executive dashboard APIs for KPIs, charts, and alerts")
@SecurityRequirement(name = "Bearer Authentication")
public class DashboardController {

    private static final Logger LOGGER = LoggerFactory.getLogger(DashboardController.class);

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    // =================================================================
    // COMPLETE DASHBOARD (AC-11)
    // =================================================================

    /**
     * Get complete executive dashboard data
     * GET /api/v1/dashboard/executive
     * AC-11: Single endpoint for all dashboard data
     */
    @GetMapping("/executive")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Get executive dashboard",
            description = "Returns complete executive dashboard data including KPIs, maintenance queue, PM jobs, lease expirations, alerts, and property comparison"
    )
    public ResponseEntity<Map<String, Object>> getExecutiveDashboard(
            @Parameter(description = "Filter by property ID (optional)")
            @RequestParam(required = false) UUID propertyId,
            @Parameter(description = "Period start date (default: Jan 1 of current year)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @Parameter(description = "Period end date (default: today)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        LOGGER.debug("GET /api/v1/dashboard/executive - propertyId={}, startDate={}, endDate={}",
                propertyId, startDate, endDate);

        ExecutiveDashboardDto dashboard = dashboardService.getExecutiveDashboard(propertyId, startDate, endDate);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Executive dashboard data retrieved successfully");
        response.put("data", dashboard);
        response.put("timestamp", LocalDateTime.now());

        return ResponseEntity.ok(response);
    }

    // =================================================================
    // KPI DATA (AC-12)
    // =================================================================

    /**
     * Get KPI cards data
     * GET /api/v1/dashboard/kpis
     * AC-12: Net Profit/Loss, Occupancy Rate, Overdue Maintenance, Outstanding Receivables
     */
    @GetMapping("/kpis")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Get KPI cards",
            description = "Returns KPI card data with trend indicators"
    )
    public ResponseEntity<Map<String, Object>> getKpiCards(
            @Parameter(description = "Filter by property ID (optional)")
            @RequestParam(required = false) UUID propertyId,
            @Parameter(description = "Period start date (default: Jan 1 of current year)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @Parameter(description = "Period end date (default: today)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        LOGGER.debug("GET /api/v1/dashboard/kpis - propertyId={}, startDate={}, endDate={}",
                propertyId, startDate, endDate);

        LocalDate effectiveStartDate = startDate != null ? startDate : LocalDate.of(LocalDate.now().getYear(), 1, 1);
        LocalDate effectiveEndDate = endDate != null ? endDate : LocalDate.now();

        KpiCardsDto kpis = dashboardService.getKpiCards(propertyId, effectiveStartDate, effectiveEndDate);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "KPI data retrieved successfully");
        response.put("data", kpis);
        response.put("timestamp", LocalDateTime.now());

        return ResponseEntity.ok(response);
    }

    // =================================================================
    // PRIORITY MAINTENANCE QUEUE (AC-13)
    // =================================================================

    /**
     * Get priority maintenance queue
     * GET /api/v1/dashboard/maintenance-queue
     * AC-13: HIGH priority work orders with OPEN/ASSIGNED status
     */
    @GetMapping("/maintenance-queue")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Get priority maintenance queue",
            description = "Returns high priority work orders requiring immediate attention"
    )
    public ResponseEntity<Map<String, Object>> getMaintenanceQueue(
            @Parameter(description = "Filter by property ID (optional)")
            @RequestParam(required = false) UUID propertyId,
            @Parameter(description = "Maximum items to return (default: 5)")
            @RequestParam(defaultValue = "5") int limit
    ) {
        LOGGER.debug("GET /api/v1/dashboard/maintenance-queue - propertyId={}, limit={}", propertyId, limit);

        List<MaintenanceQueueItemDto> queue = dashboardService.getPriorityMaintenanceQueue(propertyId, limit);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Maintenance queue retrieved successfully");
        response.put("data", queue);
        response.put("timestamp", LocalDateTime.now());

        return ResponseEntity.ok(response);
    }

    // =================================================================
    // PM JOBS CHART DATA (AC-14)
    // =================================================================

    /**
     * Get upcoming PM jobs by category
     * GET /api/v1/dashboard/pm-jobs
     * AC-14: Bar chart data showing PM jobs by category
     */
    @GetMapping("/pm-jobs")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Get upcoming PM jobs",
            description = "Returns PM job counts by category for bar chart visualization"
    )
    public ResponseEntity<Map<String, Object>> getUpcomingPmJobs(
            @Parameter(description = "Filter by property ID (optional)")
            @RequestParam(required = false) UUID propertyId,
            @Parameter(description = "Days to look ahead (default: 30)")
            @RequestParam(defaultValue = "30") int days
    ) {
        LOGGER.debug("GET /api/v1/dashboard/pm-jobs - propertyId={}, days={}", propertyId, days);

        List<PmJobChartDataDto> pmJobs = dashboardService.getUpcomingPmJobs(propertyId, days);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "PM jobs data retrieved successfully");
        response.put("data", pmJobs);
        response.put("timestamp", LocalDateTime.now());

        return ResponseEntity.ok(response);
    }

    // =================================================================
    // LEASE EXPIRATIONS TIMELINE (AC-15)
    // =================================================================

    /**
     * Get lease expiration timeline
     * GET /api/v1/dashboard/lease-expirations
     * AC-15: Timeline showing lease expirations by month
     */
    @GetMapping("/lease-expirations")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Get lease expiration timeline",
            description = "Returns lease expiration counts by month for timeline visualization"
    )
    public ResponseEntity<Map<String, Object>> getLeaseExpirations(
            @Parameter(description = "Filter by property ID (optional)")
            @RequestParam(required = false) UUID propertyId,
            @Parameter(description = "Months to forecast (default: 12)")
            @RequestParam(defaultValue = "12") int months
    ) {
        LOGGER.debug("GET /api/v1/dashboard/lease-expirations - propertyId={}, months={}", propertyId, months);

        List<LeaseExpirationTimelineDto> expirations = dashboardService.getLeaseExpirationTimeline(propertyId, months);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Lease expirations retrieved successfully");
        response.put("data", expirations);
        response.put("timestamp", LocalDateTime.now());

        return ResponseEntity.ok(response);
    }

    // =================================================================
    // CRITICAL ALERTS (AC-16)
    // =================================================================

    /**
     * Get critical alerts
     * GET /api/v1/dashboard/alerts
     * AC-16: Color-coded alerts (Red/Yellow/Blue)
     */
    @GetMapping("/alerts")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Get critical alerts",
            description = "Returns critical alerts requiring attention, sorted by severity"
    )
    public ResponseEntity<Map<String, Object>> getCriticalAlerts(
            @Parameter(description = "Filter by property ID (optional)")
            @RequestParam(required = false) UUID propertyId
    ) {
        LOGGER.debug("GET /api/v1/dashboard/alerts - propertyId={}", propertyId);

        List<AlertDto> alerts = dashboardService.getCriticalAlerts(propertyId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Critical alerts retrieved successfully");
        response.put("data", alerts);
        response.put("timestamp", LocalDateTime.now());

        return ResponseEntity.ok(response);
    }

    // =================================================================
    // PROPERTY COMPARISON (AC-17)
    // =================================================================

    /**
     * Get property performance comparison
     * GET /api/v1/dashboard/property-comparison
     * AC-17: Sortable table with performance ranking
     */
    @GetMapping("/property-comparison")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Get property comparison",
            description = "Returns property performance data for comparison table"
    )
    public ResponseEntity<Map<String, Object>> getPropertyComparison(
            @Parameter(description = "Period start date (default: Jan 1 of current year)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @Parameter(description = "Period end date (default: today)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        LocalDate effectiveStartDate = startDate != null ? startDate : LocalDate.of(LocalDate.now().getYear(), 1, 1);
        LocalDate effectiveEndDate = endDate != null ? endDate : LocalDate.now();

        LOGGER.debug("GET /api/v1/dashboard/property-comparison - startDate={}, endDate={}",
                effectiveStartDate, effectiveEndDate);

        List<PropertyComparisonDto> comparison = dashboardService.getPropertyComparison(
                effectiveStartDate, effectiveEndDate);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Property comparison data retrieved successfully");
        response.put("data", comparison);
        response.put("timestamp", LocalDateTime.now());

        return ResponseEntity.ok(response);
    }
}
