package com.ultrabms.controller;

import com.ultrabms.dto.dashboard.finance.*;
import com.ultrabms.service.FinanceDashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.constraints.Min;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * REST Controller for Finance Dashboard endpoints.
 * Provides financial KPIs, charts, and summaries for authorized users.
 *
 * Story 8.6: Finance Dashboard
 * AC-10 to AC-15: API endpoints
 * AC-20: Role-based access for FINANCE_MANAGER or ADMIN
 */
@RestController
@RequestMapping("/api/v1/dashboard/finance")
@RequiredArgsConstructor
@Slf4j
@Validated
@Tag(name = "Finance Dashboard", description = "Finance dashboard data and metrics")
public class FinanceDashboardController {

    private final FinanceDashboardService financeDashboardService;

    /**
     * Get complete finance dashboard data (AC-10)
     * Returns all dashboard components in a single response
     *
     * @param propertyId Optional property filter
     * @return Complete finance dashboard DTO
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'FINANCE_MANAGER')")
    @Operation(
            summary = "Get complete finance dashboard",
            description = "Returns all finance dashboard data including KPIs, charts, receivables, transactions, and PDC status"
    )
    public ResponseEntity<FinanceDashboardDto> getFinanceDashboard(
            @Parameter(description = "Optional property ID filter")
            @RequestParam(required = false) UUID propertyId) {
        log.debug("GET /api/v1/dashboard/finance - propertyId: {}", propertyId);
        return ResponseEntity.ok(financeDashboardService.getFinanceDashboard(propertyId));
    }

    /**
     * Get income vs expense chart data (AC-11)
     * Returns last 12 months of income and expense data for stacked bar chart
     *
     * @param propertyId Optional property filter
     * @return List of monthly income vs expense data
     */
    @GetMapping("/income-vs-expense")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'FINANCE_MANAGER')")
    @Operation(
            summary = "Get income vs expense chart data",
            description = "Returns monthly income and expense data for the last 12 months"
    )
    public ResponseEntity<List<IncomeExpenseChartDto>> getIncomeVsExpense(
            @Parameter(description = "Optional property ID filter")
            @RequestParam(required = false) UUID propertyId) {
        log.debug("GET /api/v1/dashboard/finance/income-vs-expense - propertyId: {}", propertyId);
        return ResponseEntity.ok(financeDashboardService.getIncomeVsExpense(propertyId));
    }

    /**
     * Get expense categories breakdown (AC-12)
     * Returns expense breakdown by category for donut chart
     *
     * @param propertyId Optional property filter
     * @return List of expense categories with amounts
     */
    @GetMapping("/expense-categories")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'FINANCE_MANAGER')")
    @Operation(
            summary = "Get expense categories breakdown",
            description = "Returns expense breakdown by category (Maintenance, Utilities, Salaries, etc.)"
    )
    public ResponseEntity<List<ExpenseCategoryDto>> getExpenseCategories(
            @Parameter(description = "Optional property ID filter")
            @RequestParam(required = false) UUID propertyId) {
        log.debug("GET /api/v1/dashboard/finance/expense-categories - propertyId: {}", propertyId);
        return ResponseEntity.ok(financeDashboardService.getExpenseCategories(propertyId));
    }

    /**
     * Get outstanding receivables summary (AC-13)
     * Returns total outstanding with aging breakdown
     *
     * @param propertyId Optional property filter
     * @return Outstanding receivables DTO with aging buckets
     */
    @GetMapping("/outstanding-receivables")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'FINANCE_MANAGER')")
    @Operation(
            summary = "Get outstanding receivables summary",
            description = "Returns total outstanding receivables with aging breakdown (Current, 30+, 60+, 90+ days)"
    )
    public ResponseEntity<OutstandingReceivablesDto> getOutstandingReceivables(
            @Parameter(description = "Optional property ID filter")
            @RequestParam(required = false) UUID propertyId) {
        log.debug("GET /api/v1/dashboard/finance/outstanding-receivables - propertyId: {}", propertyId);
        return ResponseEntity.ok(financeDashboardService.getOutstandingReceivables(propertyId));
    }

    /**
     * Get recent high-value transactions (AC-14)
     * Returns last 10 transactions above the specified threshold
     *
     * @param threshold Minimum amount threshold (default 10,000 AED)
     * @param propertyId Optional property filter
     * @return List of recent high-value transactions
     */
    @GetMapping("/recent-transactions")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'FINANCE_MANAGER')")
    @Operation(
            summary = "Get recent high-value transactions",
            description = "Returns recent transactions above the specified threshold (default 10,000 AED)"
    )
    public ResponseEntity<List<RecentTransactionDto>> getRecentTransactions(
            @Parameter(description = "Minimum amount threshold in AED (default: 10000)")
            @RequestParam(required = false, defaultValue = "10000") @Min(0) BigDecimal threshold,
            @Parameter(description = "Optional property ID filter")
            @RequestParam(required = false) UUID propertyId) {
        log.debug("GET /api/v1/dashboard/finance/recent-transactions - threshold: {}, propertyId: {}",
                threshold, propertyId);
        return ResponseEntity.ok(financeDashboardService.getRecentTransactions(threshold, propertyId));
    }

    /**
     * Get PDC status summary (AC-15)
     * Returns PDC counts and amounts by category
     *
     * @param propertyId Optional property filter
     * @return PDC status summary DTO
     */
    @GetMapping("/pdc-status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'FINANCE_MANAGER')")
    @Operation(
            summary = "Get PDC status summary",
            description = "Returns PDC summary: due this week, due this month, awaiting clearance"
    )
    public ResponseEntity<PdcStatusSummaryDto> getPdcStatus(
            @Parameter(description = "Optional property ID filter")
            @RequestParam(required = false) UUID propertyId) {
        log.debug("GET /api/v1/dashboard/finance/pdc-status - propertyId: {}", propertyId);
        return ResponseEntity.ok(financeDashboardService.getPdcStatus(propertyId));
    }
}
