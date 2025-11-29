package com.ultrabms.controller;

import com.ultrabms.dto.reports.*;
import com.ultrabms.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * REST Controller for Financial Reporting and Analytics.
 * Handles report generation, export, and email functionality.
 *
 * Story 6.4: Financial Reporting and Analytics
 * AC #22: Backend API controller for reports
 */
@RestController
@RequestMapping("/api/v1/reports")
@Tag(name = "Reports", description = "Financial reporting and analytics APIs")
@SecurityRequirement(name = "Bearer Authentication")
public class ReportController {

    private static final Logger LOGGER = LoggerFactory.getLogger(ReportController.class);

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    // =================================================================
    // INCOME STATEMENT / P&L REPORT
    // =================================================================

    /**
     * Get Income Statement (P&L Report)
     * GET /api/v1/reports/income-statement
     * AC #1, #2: Income Statement with revenue/expense breakdown
     */
    @GetMapping("/income-statement")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'FINANCE')")
    @Operation(
            summary = "Get Income Statement",
            description = "Generate income statement (P&L) report for the specified period"
    )
    public ResponseEntity<Map<String, Object>> getIncomeStatement(
            @Parameter(description = "Start date (yyyy-MM-dd)")
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @Parameter(description = "End date (yyyy-MM-dd)")
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @Parameter(description = "Property ID filter (optional)")
            @RequestParam(required = false) UUID propertyId
    ) {
        LOGGER.info("Generating income statement for period {} to {}, propertyId: {}", startDate, endDate, propertyId);
        IncomeStatementDto report = reportService.getIncomeStatement(startDate, endDate, propertyId);
        return ResponseEntity.ok(buildSuccessResponse(report, "Income statement generated successfully"));
    }

    // =================================================================
    // CASH FLOW REPORT
    // =================================================================

    /**
     * Get Cash Flow Summary Report
     * GET /api/v1/reports/cash-flow
     * AC #3: Cash Flow Report showing inflows, outflows, net position
     */
    @GetMapping("/cash-flow")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'FINANCE')")
    @Operation(
            summary = "Get Cash Flow Summary",
            description = "Generate cash flow summary report for the specified period"
    )
    public ResponseEntity<Map<String, Object>> getCashFlowSummary(
            @Parameter(description = "Start date (yyyy-MM-dd)")
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @Parameter(description = "End date (yyyy-MM-dd)")
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @Parameter(description = "Property ID filter (optional)")
            @RequestParam(required = false) UUID propertyId
    ) {
        LOGGER.info("Generating cash flow summary for period {} to {}, propertyId: {}", startDate, endDate, propertyId);
        CashFlowSummaryDto report = reportService.getCashFlowSummary(startDate, endDate, propertyId);
        return ResponseEntity.ok(buildSuccessResponse(report, "Cash flow summary generated successfully"));
    }

    // =================================================================
    // ACCOUNTS RECEIVABLE AGING REPORT
    // =================================================================

    /**
     * Get AR Aging Report
     * GET /api/v1/reports/receivables-aging
     * AC #4, #5: AR Aging with aging buckets and tenant drill-down
     */
    @GetMapping("/receivables-aging")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'FINANCE')")
    @Operation(
            summary = "Get AR Aging Report",
            description = "Generate accounts receivable aging report as of a specific date"
    )
    public ResponseEntity<Map<String, Object>> getARAgingReport(
            @Parameter(description = "As of date (yyyy-MM-dd)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate asOfDate,
            @Parameter(description = "Property ID filter (optional)")
            @RequestParam(required = false) UUID propertyId
    ) {
        LocalDate effectiveDate = asOfDate != null ? asOfDate : LocalDate.now();
        LOGGER.info("Generating AR aging report as of {}, propertyId: {}", effectiveDate, propertyId);
        ARAgingDto report = reportService.getARAgingReport(effectiveDate, propertyId);
        return ResponseEntity.ok(buildSuccessResponse(report, "AR aging report generated successfully"));
    }

    // =================================================================
    // REVENUE BREAKDOWN REPORT
    // =================================================================

    /**
     * Get Revenue Breakdown Report
     * GET /api/v1/reports/revenue-breakdown
     * AC #7: Revenue by property and type
     */
    @GetMapping("/revenue-breakdown")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'FINANCE')")
    @Operation(
            summary = "Get Revenue Breakdown",
            description = "Generate revenue breakdown report by property and type"
    )
    public ResponseEntity<Map<String, Object>> getRevenueBreakdown(
            @Parameter(description = "Start date (yyyy-MM-dd)")
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @Parameter(description = "End date (yyyy-MM-dd)")
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @Parameter(description = "Property ID filter (optional)")
            @RequestParam(required = false) UUID propertyId
    ) {
        LOGGER.info("Generating revenue breakdown for period {} to {}, propertyId: {}", startDate, endDate, propertyId);
        RevenueBreakdownDto report = reportService.getRevenueBreakdown(startDate, endDate, propertyId);
        return ResponseEntity.ok(buildSuccessResponse(report, "Revenue breakdown generated successfully"));
    }

    // =================================================================
    // EXPENSE BREAKDOWN REPORT
    // =================================================================

    /**
     * Get Expense Breakdown Report
     * GET /api/v1/reports/expense-breakdown
     * AC #8: Expense by category, vendor, and property
     */
    @GetMapping("/expense-breakdown")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'FINANCE')")
    @Operation(
            summary = "Get Expense Breakdown",
            description = "Generate expense breakdown report by category and vendor"
    )
    public ResponseEntity<Map<String, Object>> getExpenseBreakdown(
            @Parameter(description = "Start date (yyyy-MM-dd)")
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @Parameter(description = "End date (yyyy-MM-dd)")
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @Parameter(description = "Property ID filter (optional)")
            @RequestParam(required = false) UUID propertyId
    ) {
        LOGGER.info("Generating expense breakdown for period {} to {}, propertyId: {}", startDate, endDate, propertyId);
        ExpenseBreakdownDto report = reportService.getExpenseBreakdown(startDate, endDate, propertyId);
        return ResponseEntity.ok(buildSuccessResponse(report, "Expense breakdown generated successfully"));
    }

    // =================================================================
    // FINANCIAL DASHBOARD
    // =================================================================

    /**
     * Get Financial Dashboard KPIs
     * GET /api/v1/reports/dashboard
     * AC #6, #15, #29: Dashboard with caching (1 hour TTL)
     */
    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'FINANCE')")
    @Operation(
            summary = "Get Financial Dashboard",
            description = "Get financial dashboard with KPIs and insights (cached for 1 hour)"
    )
    public ResponseEntity<Map<String, Object>> getFinancialDashboard(
            @Parameter(description = "Property ID filter (optional)")
            @RequestParam(required = false) UUID propertyId
    ) {
        LOGGER.info("Getting financial dashboard, propertyId: {}", propertyId);
        FinancialDashboardDto dashboard = reportService.getFinancialDashboard(propertyId);
        return ResponseEntity.ok(buildSuccessResponse(dashboard, "Financial dashboard retrieved successfully"));
    }

    /**
     * Refresh Financial Dashboard Cache
     * POST /api/v1/reports/dashboard/refresh
     * AC #29: Cache refresh functionality
     */
    @PostMapping("/dashboard/refresh")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(
            summary = "Refresh Financial Dashboard",
            description = "Force refresh the financial dashboard cache"
    )
    public ResponseEntity<Map<String, Object>> refreshFinancialDashboard(
            @Parameter(description = "Property ID filter (optional)")
            @RequestParam(required = false) UUID propertyId
    ) {
        LOGGER.info("Refreshing financial dashboard cache, propertyId: {}", propertyId);
        FinancialDashboardDto dashboard = reportService.refreshFinancialDashboard(propertyId);
        return ResponseEntity.ok(buildSuccessResponse(dashboard, "Financial dashboard refreshed successfully"));
    }

    // =================================================================
    // EXPORT OPERATIONS
    // =================================================================

    /**
     * Export Report to PDF
     * GET /api/v1/reports/export/pdf
     * AC #16, #30: PDF export with consistent formatting
     */
    @GetMapping("/export/pdf")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'FINANCE')")
    @Operation(
            summary = "Export Report to PDF",
            description = "Export the specified report to PDF format"
    )
    public ResponseEntity<byte[]> exportToPdf(
            @Parameter(description = "Report type (income-statement, cash-flow, receivables-aging, revenue-breakdown, expense-breakdown, financial-dashboard)")
            @RequestParam String reportType,
            @Parameter(description = "Start date (yyyy-MM-dd)")
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @Parameter(description = "End date (yyyy-MM-dd)")
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @Parameter(description = "Property ID filter (optional)")
            @RequestParam(required = false) UUID propertyId
    ) {
        LOGGER.info("Exporting {} report to PDF for period {} to {}", reportType, startDate, endDate);
        byte[] pdfContent = reportService.exportToPdf(reportType, startDate, endDate, propertyId);

        String filename = generateFilename(reportType, startDate, endDate, "pdf");
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", filename);

        return new ResponseEntity<>(pdfContent, headers, HttpStatus.OK);
    }

    /**
     * Export Report to Excel
     * GET /api/v1/reports/export/excel
     * AC #17, #30: Excel export with formatted spreadsheet
     */
    @GetMapping("/export/excel")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'FINANCE')")
    @Operation(
            summary = "Export Report to Excel",
            description = "Export the specified report to Excel format"
    )
    public ResponseEntity<byte[]> exportToExcel(
            @Parameter(description = "Report type (income-statement, cash-flow, receivables-aging, revenue-breakdown, expense-breakdown, financial-dashboard)")
            @RequestParam String reportType,
            @Parameter(description = "Start date (yyyy-MM-dd)")
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @Parameter(description = "End date (yyyy-MM-dd)")
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @Parameter(description = "Property ID filter (optional)")
            @RequestParam(required = false) UUID propertyId
    ) {
        LOGGER.info("Exporting {} report to Excel for period {} to {}", reportType, startDate, endDate);
        byte[] excelContent = reportService.exportToExcel(reportType, startDate, endDate, propertyId);

        String filename = generateFilename(reportType, startDate, endDate, "xlsx");
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        headers.setContentDispositionFormData("attachment", filename);

        return new ResponseEntity<>(excelContent, headers, HttpStatus.OK);
    }

    // =================================================================
    // EMAIL REPORTS
    // =================================================================

    /**
     * Email Report to Recipients
     * POST /api/v1/reports/email
     * AC #9: Email reports functionality
     */
    @PostMapping("/email")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'FINANCE')")
    @Operation(
            summary = "Email Report",
            description = "Send the specified report to email recipients"
    )
    public ResponseEntity<Map<String, Object>> emailReport(
            @Valid @RequestBody EmailReportDto emailReportDto
    ) {
        LOGGER.info("Emailing {} report to {} recipients", emailReportDto.reportType(), emailReportDto.recipients().size());
        reportService.emailReport(emailReportDto);
        return ResponseEntity.ok(buildSuccessResponse(null, "Report emailed successfully"));
    }

    // =================================================================
    // HELPER METHODS
    // =================================================================

    private Map<String, Object> buildSuccessResponse(Object data, String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", message);
        if (data != null) {
            response.put("data", data);
        }
        return response;
    }

    private String generateFilename(String reportType, LocalDate startDate, LocalDate endDate, String extension) {
        return String.format("%s_%s_to_%s.%s",
                reportType.replace("-", "_"),
                startDate.toString(),
                endDate.toString(),
                extension);
    }
}
