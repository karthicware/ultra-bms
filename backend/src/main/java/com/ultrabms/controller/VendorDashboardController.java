package com.ultrabms.controller;

import com.ultrabms.dto.dashboard.vendor.ExpiringDocumentDto;
import com.ultrabms.dto.dashboard.vendor.JobsBySpecializationDto;
import com.ultrabms.dto.dashboard.vendor.TopVendorDto;
import com.ultrabms.dto.dashboard.vendor.VendorDashboardDto;
import com.ultrabms.dto.dashboard.vendor.VendorKpiDto;
import com.ultrabms.dto.dashboard.vendor.VendorPerformanceSnapshotDto;
import com.ultrabms.service.VendorDashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REST Controller for Vendor Dashboard endpoints (AC-9 through AC-13).
 * Role-based access: ADMIN, PROPERTY_MANAGER, MAINTENANCE_SUPERVISOR (AC-18).
 *
 * Story 8.5: Vendor Dashboard
 */
@RestController
@RequestMapping("/api/v1/dashboard/vendor")
@RequiredArgsConstructor
@Slf4j
@Validated
@Tag(name = "Vendor Dashboard", description = "Vendor dashboard metrics and analytics endpoints")
public class VendorDashboardController {

    private final VendorDashboardService vendorDashboardService;

    /**
     * GET /api/v1/dashboard/vendor - Complete vendor dashboard (AC-9)
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'MAINTENANCE_SUPERVISOR')")
    @Operation(
            summary = "Get complete vendor dashboard",
            description = "Returns all vendor dashboard data including KPIs, charts, and tables. Cached for 5 minutes."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Dashboard data retrieved successfully",
                    content = @Content(schema = @Schema(implementation = VendorDashboardDto.class))),
            @ApiResponse(responseCode = "401", description = "Not authenticated"),
            @ApiResponse(responseCode = "403", description = "Not authorized")
    })
    public ResponseEntity<VendorDashboardDto> getVendorDashboard() {
        log.debug("GET /api/v1/dashboard/vendor - Fetching complete vendor dashboard");
        VendorDashboardDto dashboard = vendorDashboardService.getVendorDashboard();
        return ResponseEntity.ok(dashboard);
    }

    /**
     * GET /api/v1/dashboard/vendor/jobs-by-specialization - Jobs by specialization bar chart (AC-10)
     */
    @GetMapping("/jobs-by-specialization")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'MAINTENANCE_SUPERVISOR')")
    @Operation(
            summary = "Get jobs by specialization",
            description = "Returns job counts grouped by work order category/specialization for bar chart display."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Data retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Not authenticated"),
            @ApiResponse(responseCode = "403", description = "Not authorized")
    })
    public ResponseEntity<List<JobsBySpecializationDto>> getJobsBySpecialization() {
        log.debug("GET /api/v1/dashboard/vendor/jobs-by-specialization");
        List<JobsBySpecializationDto> data = vendorDashboardService.getJobsBySpecialization();
        return ResponseEntity.ok(data);
    }

    /**
     * GET /api/v1/dashboard/vendor/performance-snapshot - Vendor performance scatter plot (AC-11)
     */
    @GetMapping("/performance-snapshot")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'MAINTENANCE_SUPERVISOR')")
    @Operation(
            summary = "Get vendor performance snapshot",
            description = "Returns vendor performance data for scatter plot display. X: SLA%, Y: Rating, Size: Jobs."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Data retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Not authenticated"),
            @ApiResponse(responseCode = "403", description = "Not authorized")
    })
    public ResponseEntity<List<VendorPerformanceSnapshotDto>> getPerformanceSnapshot() {
        log.debug("GET /api/v1/dashboard/vendor/performance-snapshot");
        List<VendorPerformanceSnapshotDto> data = vendorDashboardService.getPerformanceSnapshot();
        return ResponseEntity.ok(data);
    }

    /**
     * GET /api/v1/dashboard/vendor/expiring-documents - Expiring documents list (AC-12)
     */
    @GetMapping("/expiring-documents")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'MAINTENANCE_SUPERVISOR')")
    @Operation(
            summary = "Get expiring documents",
            description = "Returns list of vendor documents expiring within specified days, sorted by expiry date."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Data retrieved successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid parameters"),
            @ApiResponse(responseCode = "401", description = "Not authenticated"),
            @ApiResponse(responseCode = "403", description = "Not authorized")
    })
    public ResponseEntity<List<ExpiringDocumentDto>> getExpiringDocuments(
            @Parameter(description = "Number of days to look ahead (default 30, max 365)")
            @RequestParam(defaultValue = "30")
            @Min(value = 1, message = "Days must be at least 1")
            @Max(value = 365, message = "Days cannot exceed 365")
            int days,

            @Parameter(description = "Maximum results to return (default 10, max 100)")
            @RequestParam(defaultValue = "10")
            @Min(value = 1, message = "Limit must be at least 1")
            @Max(value = 100, message = "Limit cannot exceed 100")
            int limit) {
        log.debug("GET /api/v1/dashboard/vendor/expiring-documents?days={}&limit={}", days, limit);
        List<ExpiringDocumentDto> data = vendorDashboardService.getExpiringDocuments(days, limit);
        return ResponseEntity.ok(data);
    }

    /**
     * GET /api/v1/dashboard/vendor/top-vendors - Top vendors by jobs (AC-13)
     */
    @GetMapping("/top-vendors")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'MAINTENANCE_SUPERVISOR')")
    @Operation(
            summary = "Get top vendors",
            description = "Returns top vendors ranked by jobs completed this month."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Data retrieved successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid parameters"),
            @ApiResponse(responseCode = "401", description = "Not authenticated"),
            @ApiResponse(responseCode = "403", description = "Not authorized")
    })
    public ResponseEntity<List<TopVendorDto>> getTopVendors(
            @Parameter(description = "Maximum results to return (default 5, max 20)")
            @RequestParam(defaultValue = "5")
            @Min(value = 1, message = "Limit must be at least 1")
            @Max(value = 20, message = "Limit cannot exceed 20")
            int limit) {
        log.debug("GET /api/v1/dashboard/vendor/top-vendors?limit={}", limit);
        List<TopVendorDto> data = vendorDashboardService.getTopVendors(limit);
        return ResponseEntity.ok(data);
    }

    /**
     * GET /api/v1/dashboard/vendor/kpis - KPI cards only
     */
    @GetMapping("/kpis")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'MAINTENANCE_SUPERVISOR')")
    @Operation(
            summary = "Get vendor KPIs",
            description = "Returns KPI card data only (active vendors, SLA, top vendor, expiring docs)."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "KPIs retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Not authenticated"),
            @ApiResponse(responseCode = "403", description = "Not authorized")
    })
    public ResponseEntity<VendorKpiDto> getKpis() {
        log.debug("GET /api/v1/dashboard/vendor/kpis");
        VendorKpiDto kpis = vendorDashboardService.getKpis();
        return ResponseEntity.ok(kpis);
    }
}
