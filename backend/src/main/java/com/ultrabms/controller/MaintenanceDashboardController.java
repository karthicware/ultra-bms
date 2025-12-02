package com.ultrabms.controller;

import com.ultrabms.dto.dashboard.maintenance.*;
import com.ultrabms.service.MaintenanceDashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST Controller for Maintenance Dashboard endpoints.
 * Provides KPIs, chart data, and job lists for the maintenance dashboard.
 * Role-based access: MAINTENANCE_SUPERVISOR or higher (AC-20)
 *
 * Story 8.4: Maintenance Dashboard
 */
@RestController
@RequestMapping("/api/v1/dashboard/maintenance")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Maintenance Dashboard", description = "Maintenance Dashboard APIs")
public class MaintenanceDashboardController {

    private final MaintenanceDashboardService maintenanceDashboardService;

    // =================================================================
    // COMPLETE DASHBOARD (AC-10)
    // =================================================================

    /**
     * Get complete maintenance dashboard data
     * AC-10: GET /api/v1/dashboard/maintenance
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'MAINTENANCE_SUPERVISOR')")
    @Operation(summary = "Get complete maintenance dashboard", description = "Returns all maintenance dashboard data including KPIs, charts, and job lists")
    public ResponseEntity<MaintenanceDashboardDto> getMaintenanceDashboard(
            @Parameter(description = "Optional property ID filter")
            @RequestParam(required = false) UUID propertyId) {
        log.info("GET /api/v1/dashboard/maintenance - propertyId: {}", propertyId);
        MaintenanceDashboardDto dashboard = maintenanceDashboardService.getMaintenanceDashboard(propertyId);
        return ResponseEntity.ok(dashboard);
    }

    // =================================================================
    // CHART DATA ENDPOINTS (AC-11, AC-12, AC-13)
    // =================================================================

    /**
     * Get jobs grouped by status for pie chart
     * AC-11: GET /api/v1/dashboard/maintenance/jobs-by-status
     */
    @GetMapping("/jobs-by-status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'MAINTENANCE_SUPERVISOR')")
    @Operation(summary = "Get jobs by status", description = "Returns job counts grouped by status for pie chart")
    public ResponseEntity<List<JobsByStatusDto>> getJobsByStatus(
            @Parameter(description = "Optional property ID filter")
            @RequestParam(required = false) UUID propertyId) {
        log.info("GET /api/v1/dashboard/maintenance/jobs-by-status - propertyId: {}", propertyId);
        List<JobsByStatusDto> data = maintenanceDashboardService.getJobsByStatus(propertyId);
        return ResponseEntity.ok(data);
    }

    /**
     * Get jobs grouped by priority for bar chart
     * AC-12: GET /api/v1/dashboard/maintenance/jobs-by-priority
     */
    @GetMapping("/jobs-by-priority")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'MAINTENANCE_SUPERVISOR')")
    @Operation(summary = "Get jobs by priority", description = "Returns job counts grouped by priority for bar chart")
    public ResponseEntity<List<JobsByPriorityDto>> getJobsByPriority(
            @Parameter(description = "Optional property ID filter")
            @RequestParam(required = false) UUID propertyId) {
        log.info("GET /api/v1/dashboard/maintenance/jobs-by-priority - propertyId: {}", propertyId);
        List<JobsByPriorityDto> data = maintenanceDashboardService.getJobsByPriority(propertyId);
        return ResponseEntity.ok(data);
    }

    /**
     * Get jobs grouped by category for horizontal bar chart
     * AC-13: GET /api/v1/dashboard/maintenance/jobs-by-category
     */
    @GetMapping("/jobs-by-category")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'MAINTENANCE_SUPERVISOR')")
    @Operation(summary = "Get jobs by category", description = "Returns job counts grouped by category for horizontal bar chart (sorted by count desc)")
    public ResponseEntity<List<JobsByCategoryDto>> getJobsByCategory(
            @Parameter(description = "Optional property ID filter")
            @RequestParam(required = false) UUID propertyId) {
        log.info("GET /api/v1/dashboard/maintenance/jobs-by-category - propertyId: {}", propertyId);
        List<JobsByCategoryDto> data = maintenanceDashboardService.getJobsByCategory(propertyId);
        return ResponseEntity.ok(data);
    }

    // =================================================================
    // LIST DATA ENDPOINTS (AC-14, AC-15)
    // =================================================================

    /**
     * Get high priority and overdue jobs with pagination
     * AC-14: GET /api/v1/dashboard/maintenance/high-priority-overdue
     */
    @GetMapping("/high-priority-overdue")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'MAINTENANCE_SUPERVISOR')")
    @Operation(summary = "Get high priority and overdue jobs", description = "Returns paginated list of high priority (HIGH/URGENT) and overdue jobs")
    public ResponseEntity<Page<HighPriorityJobDto>> getHighPriorityAndOverdueJobs(
            @Parameter(description = "Optional property ID filter")
            @RequestParam(required = false) UUID propertyId,
            @Parameter(description = "Optional status filter for click-to-filter (e.g., OPEN, ASSIGNED)")
            @RequestParam(required = false) String status,
            @Parameter(description = "Page number (0-based)")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size")
            @RequestParam(defaultValue = "10") int size) {
        log.info("GET /api/v1/dashboard/maintenance/high-priority-overdue - propertyId: {}, status: {}, page: {}, size: {}",
                propertyId, status, page, size);
        Pageable pageable = PageRequest.of(page, size);
        Page<HighPriorityJobDto> data = maintenanceDashboardService.getHighPriorityAndOverdueJobs(propertyId, status, pageable);
        return ResponseEntity.ok(data);
    }

    /**
     * Get recently completed jobs
     * AC-15: GET /api/v1/dashboard/maintenance/recently-completed
     */
    @GetMapping("/recently-completed")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'MAINTENANCE_SUPERVISOR')")
    @Operation(summary = "Get recently completed jobs", description = "Returns list of recently completed jobs (default limit: 5)")
    public ResponseEntity<List<RecentlyCompletedJobDto>> getRecentlyCompletedJobs(
            @Parameter(description = "Optional property ID filter")
            @RequestParam(required = false) UUID propertyId,
            @Parameter(description = "Maximum number of items to return")
            @RequestParam(defaultValue = "5") int limit) {
        log.info("GET /api/v1/dashboard/maintenance/recently-completed - propertyId: {}, limit: {}", propertyId, limit);
        List<RecentlyCompletedJobDto> data = maintenanceDashboardService.getRecentlyCompletedJobs(propertyId, limit);
        return ResponseEntity.ok(data);
    }
}
