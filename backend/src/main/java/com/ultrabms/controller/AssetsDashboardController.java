package com.ultrabms.controller;

import com.ultrabms.dto.dashboard.assets.AssetKpiDto;
import com.ultrabms.dto.dashboard.assets.AssetsByCategoryDto;
import com.ultrabms.dto.dashboard.assets.AssetsDashboardDto;
import com.ultrabms.dto.dashboard.assets.DepreciationSummaryDto;
import com.ultrabms.dto.dashboard.assets.OverduePmAssetDto;
import com.ultrabms.dto.dashboard.assets.RecentAssetDto;
import com.ultrabms.dto.dashboard.assets.TopMaintenanceSpendDto;
import com.ultrabms.service.AssetsDashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REST Controller for Assets Dashboard endpoints (AC-10 through AC-15).
 * Role-based access: ADMIN, PROPERTY_MANAGER, MAINTENANCE_SUPERVISOR (AC-20).
 *
 * Story 8.7: Assets Dashboard
 */
@RestController
@RequestMapping("/api/v1/dashboard/assets")
@RequiredArgsConstructor
@Slf4j
@Validated
@Tag(name = "Assets Dashboard", description = "Assets dashboard metrics and analytics endpoints")
public class AssetsDashboardController {

    private final AssetsDashboardService assetsDashboardService;

    /**
     * GET /api/v1/dashboard/assets - Complete assets dashboard (AC-10)
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'MAINTENANCE_SUPERVISOR')")
    @Operation(
            summary = "Get complete assets dashboard",
            description = "Returns all assets dashboard data including KPIs, charts, and tables. Cached for 5 minutes."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Dashboard data retrieved successfully",
                    content = @Content(schema = @Schema(implementation = AssetsDashboardDto.class))),
            @ApiResponse(responseCode = "401", description = "Not authenticated"),
            @ApiResponse(responseCode = "403", description = "Not authorized")
    })
    public ResponseEntity<AssetsDashboardDto> getAssetsDashboard() {
        log.debug("GET /api/v1/dashboard/assets - Fetching complete assets dashboard");
        AssetsDashboardDto dashboard = assetsDashboardService.getAssetsDashboard();
        return ResponseEntity.ok(dashboard);
    }

    /**
     * GET /api/v1/dashboard/assets/by-category - Assets by category donut chart (AC-11)
     */
    @GetMapping("/by-category")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'MAINTENANCE_SUPERVISOR')")
    @Operation(
            summary = "Get assets by category",
            description = "Returns asset counts grouped by category for donut chart display."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Data retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Not authenticated"),
            @ApiResponse(responseCode = "403", description = "Not authorized")
    })
    public ResponseEntity<List<AssetsByCategoryDto>> getAssetsByCategory() {
        log.debug("GET /api/v1/dashboard/assets/by-category");
        List<AssetsByCategoryDto> data = assetsDashboardService.getAssetsByCategory();
        return ResponseEntity.ok(data);
    }

    /**
     * GET /api/v1/dashboard/assets/top-maintenance-spend - Top 5 assets by maintenance spend (AC-12)
     */
    @GetMapping("/top-maintenance-spend")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'MAINTENANCE_SUPERVISOR')")
    @Operation(
            summary = "Get top 5 assets by maintenance spend",
            description = "Returns top 5 assets ranked by total maintenance costs for horizontal bar chart display."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Data retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Not authenticated"),
            @ApiResponse(responseCode = "403", description = "Not authorized")
    })
    public ResponseEntity<List<TopMaintenanceSpendDto>> getTopMaintenanceSpend() {
        log.debug("GET /api/v1/dashboard/assets/top-maintenance-spend");
        List<TopMaintenanceSpendDto> data = assetsDashboardService.getTopMaintenanceSpend();
        return ResponseEntity.ok(data);
    }

    /**
     * GET /api/v1/dashboard/assets/overdue-pm - Overdue PM assets list (AC-13)
     */
    @GetMapping("/overdue-pm")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'MAINTENANCE_SUPERVISOR')")
    @Operation(
            summary = "Get assets with overdue preventive maintenance",
            description = "Returns list of assets with overdue PM sorted by days overdue descending."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Data retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Not authenticated"),
            @ApiResponse(responseCode = "403", description = "Not authorized")
    })
    public ResponseEntity<List<OverduePmAssetDto>> getOverduePmAssets() {
        log.debug("GET /api/v1/dashboard/assets/overdue-pm");
        List<OverduePmAssetDto> data = assetsDashboardService.getOverduePmAssets();
        return ResponseEntity.ok(data);
    }

    /**
     * GET /api/v1/dashboard/assets/recently-added - Recently added assets list (AC-14)
     */
    @GetMapping("/recently-added")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'MAINTENANCE_SUPERVISOR')")
    @Operation(
            summary = "Get recently added assets",
            description = "Returns last 5 assets added to the system."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Data retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Not authenticated"),
            @ApiResponse(responseCode = "403", description = "Not authorized")
    })
    public ResponseEntity<List<RecentAssetDto>> getRecentlyAddedAssets() {
        log.debug("GET /api/v1/dashboard/assets/recently-added");
        List<RecentAssetDto> data = assetsDashboardService.getRecentlyAddedAssets();
        return ResponseEntity.ok(data);
    }

    /**
     * GET /api/v1/dashboard/assets/depreciation-summary - Depreciation summary card (AC-15)
     */
    @GetMapping("/depreciation-summary")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'MAINTENANCE_SUPERVISOR')")
    @Operation(
            summary = "Get depreciation summary",
            description = "Returns asset depreciation summary including original value, current value, and depreciation percentage."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Data retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Not authenticated"),
            @ApiResponse(responseCode = "403", description = "Not authorized")
    })
    public ResponseEntity<DepreciationSummaryDto> getDepreciationSummary() {
        log.debug("GET /api/v1/dashboard/assets/depreciation-summary");
        DepreciationSummaryDto data = assetsDashboardService.getDepreciationSummary();
        return ResponseEntity.ok(data);
    }
}
