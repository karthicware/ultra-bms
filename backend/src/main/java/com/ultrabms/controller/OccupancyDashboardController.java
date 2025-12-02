package com.ultrabms.controller;

import com.ultrabms.dto.dashboard.occupancy.*;
import com.ultrabms.service.OccupancyDashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST Controller for Occupancy Dashboard APIs
 * Provides occupancy metrics, lease tracking, and activity data.
 *
 * Story 8.3: Occupancy Dashboard
 * AC-9 to AC-11: Dashboard REST endpoints
 * AC-14: Role-based access using @PreAuthorize
 */
@RestController
@RequestMapping("/api/v1/dashboard/occupancy")
@Tag(name = "Occupancy Dashboard", description = "Occupancy dashboard APIs for KPIs, charts, lease tracking, and activity feed")
@SecurityRequirement(name = "Bearer Authentication")
@Validated
public class OccupancyDashboardController {

    private static final Logger LOGGER = LoggerFactory.getLogger(OccupancyDashboardController.class);

    private final OccupancyDashboardService occupancyDashboardService;

    public OccupancyDashboardController(OccupancyDashboardService occupancyDashboardService) {
        this.occupancyDashboardService = occupancyDashboardService;
    }

    // =================================================================
    // COMPLETE DASHBOARD (AC-9)
    // =================================================================

    /**
     * Get complete occupancy dashboard data
     * GET /api/v1/dashboard/occupancy
     * AC-9: Single endpoint for all occupancy dashboard data
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Get occupancy dashboard",
            description = "Returns complete occupancy dashboard data including KPIs, occupancy chart, lease expiration chart, upcoming expirations, and recent activity"
    )
    public ResponseEntity<Map<String, Object>> getOccupancyDashboard(
            @Parameter(description = "Filter by property ID (optional)")
            @RequestParam(required = false) UUID propertyId
    ) {
        LOGGER.debug("GET /api/v1/dashboard/occupancy - propertyId={}", propertyId);

        OccupancyDashboardDto dashboard = occupancyDashboardService.getOccupancyDashboard(propertyId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Occupancy dashboard data retrieved successfully");
        response.put("data", dashboard);
        response.put("timestamp", LocalDateTime.now());

        return ResponseEntity.ok(response);
    }

    // =================================================================
    // LEASE EXPIRATIONS LIST (AC-10)
    // =================================================================

    /**
     * Get upcoming lease expirations with pagination
     * GET /api/v1/dashboard/occupancy/lease-expirations
     * AC-10: Configurable days parameter (default: 100 per AC-12)
     */
    @GetMapping("/lease-expirations")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Get upcoming lease expirations",
            description = "Returns paginated list of upcoming lease expirations with tenant/unit details"
    )
    public ResponseEntity<Map<String, Object>> getLeaseExpirations(
            @Parameter(description = "Filter by property ID (optional)")
            @RequestParam(required = false) UUID propertyId,
            @Parameter(description = "Days to look ahead (default: 100, max: 365)")
            @RequestParam(defaultValue = "100")
            @Min(value = 1, message = "Days must be at least 1")
            @Max(value = 365, message = "Days cannot exceed 365")
            int days,
            @Parameter(description = "Page number (0-based)")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size")
            @RequestParam(defaultValue = "10") int size
    ) {
        LOGGER.debug("GET /api/v1/dashboard/occupancy/lease-expirations - propertyId={}, days={}, page={}, size={}",
                propertyId, days, page, size);

        List<LeaseExpirationListDto> expirations = occupancyDashboardService.getLeaseExpirations(
                days, page, size, propertyId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Lease expirations retrieved successfully");
        response.put("data", expirations);
        response.put("page", page);
        response.put("size", size);
        response.put("timestamp", LocalDateTime.now());

        return ResponseEntity.ok(response);
    }

    // =================================================================
    // RECENT ACTIVITY (AC-11)
    // =================================================================

    /**
     * Get recent lease activity
     * GET /api/v1/dashboard/occupancy/recent-activity
     * AC-11: Returns last 10 lease activities
     */
    @GetMapping("/recent-activity")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Get recent lease activity",
            description = "Returns recent lease-related activities (new leases, renewals, terminations, notices)"
    )
    public ResponseEntity<Map<String, Object>> getRecentActivity(
            @Parameter(description = "Filter by property ID (optional)")
            @RequestParam(required = false) UUID propertyId,
            @Parameter(description = "Maximum items to return (default: 10)")
            @RequestParam(defaultValue = "10") int limit
    ) {
        LOGGER.debug("GET /api/v1/dashboard/occupancy/recent-activity - propertyId={}, limit={}", propertyId, limit);

        List<LeaseActivityDto> activities = occupancyDashboardService.getRecentActivity(limit, propertyId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Recent activity retrieved successfully");
        response.put("data", activities);
        response.put("timestamp", LocalDateTime.now());

        return ResponseEntity.ok(response);
    }
}
