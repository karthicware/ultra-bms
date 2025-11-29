package com.ultrabms.service.impl;

import com.ultrabms.dto.reports.*;
import com.ultrabms.entity.Property;
import com.ultrabms.entity.enums.ExpenseCategory;
import com.ultrabms.repository.*;
import com.ultrabms.service.ExcelExportService;
import com.ultrabms.service.IEmailService;
import com.ultrabms.service.PdfGenerationService;
import com.ultrabms.service.ReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Implementation of ReportService for Financial Reporting and Analytics.
 *
 * Story 6.4: Financial Reporting and Analytics
 * AC #21: Backend service layer for report generation
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class ReportServiceImpl implements ReportService {

    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final ExpenseRepository expenseRepository;
    private final PropertyRepository propertyRepository;
    private final IEmailService emailService;
    private final PdfGenerationService pdfGenerationService;
    private final ExcelExportService excelExportService;

    private static final DateTimeFormatter MONTH_YEAR_FORMATTER = DateTimeFormatter.ofPattern("MMM yyyy");

    // =================================================================
    // INCOME STATEMENT / P&L REPORT
    // =================================================================

    @Override
    public IncomeStatementDto getIncomeStatement(LocalDate startDate, LocalDate endDate, UUID propertyId) {
        log.info("Generating income statement for period {} to {}, propertyId: {}", startDate, endDate, propertyId);

        String propertyName = getPropertyName(propertyId);

        // Get revenue breakdown by type
        Object[] revenueBreakdown = invoiceRepository.getRevenueBreakdownByType(startDate, endDate, propertyId);
        BigDecimal rentalIncome = toBigDecimal(revenueBreakdown[0]);
        BigDecimal camCharges = toBigDecimal(revenueBreakdown[1]);
        BigDecimal parkingFees = toBigDecimal(revenueBreakdown[2]);
        BigDecimal lateFees = toBigDecimal(revenueBreakdown[3]);
        BigDecimal otherIncome = toBigDecimal(revenueBreakdown[4]);

        // Calculate total revenue
        BigDecimal totalRevenue = rentalIncome.add(camCharges).add(parkingFees).add(lateFees).add(otherIncome);

        // Build revenue breakdown details
        List<IncomeStatementDto.RevenueBreakdownDetail> revenueDetails = Arrays.asList(
                new IncomeStatementDto.RevenueBreakdownDetail("Rental Income", rentalIncome, calculatePercentage(rentalIncome, totalRevenue)),
                new IncomeStatementDto.RevenueBreakdownDetail("CAM Charges", camCharges, calculatePercentage(camCharges, totalRevenue)),
                new IncomeStatementDto.RevenueBreakdownDetail("Parking Fees", parkingFees, calculatePercentage(parkingFees, totalRevenue)),
                new IncomeStatementDto.RevenueBreakdownDetail("Late Fees", lateFees, calculatePercentage(lateFees, totalRevenue)),
                new IncomeStatementDto.RevenueBreakdownDetail("Other Income", otherIncome, calculatePercentage(otherIncome, totalRevenue))
        );

        // Get expense breakdown by category
        List<Object[]> expenseByCategory = expenseRepository.getCategoryBreakdownByProperty(startDate, endDate, propertyId);
        BigDecimal totalExpenses = BigDecimal.ZERO;
        List<IncomeStatementDto.ExpenseBreakdownDetail> expenseDetails = new ArrayList<>();

        for (Object[] row : expenseByCategory) {
            ExpenseCategory category = (ExpenseCategory) row[0];
            BigDecimal amount = toBigDecimal(row[1]);
            totalExpenses = totalExpenses.add(amount);
            expenseDetails.add(new IncomeStatementDto.ExpenseBreakdownDetail(
                    category.name(),
                    category.getDisplayName(),
                    amount,
                    BigDecimal.ZERO // Will calculate percentage after total
            ));
        }

        // Calculate expense percentages
        for (int i = 0; i < expenseDetails.size(); i++) {
            IncomeStatementDto.ExpenseBreakdownDetail detail = expenseDetails.get(i);
            expenseDetails.set(i, new IncomeStatementDto.ExpenseBreakdownDetail(
                    detail.category(),
                    detail.categoryLabel(),
                    detail.amount(),
                    calculatePercentage(detail.amount(), totalExpenses)
            ));
        }

        // Calculate net income and margin
        BigDecimal netIncome = totalRevenue.subtract(totalExpenses);
        BigDecimal netMargin = totalRevenue.compareTo(BigDecimal.ZERO) > 0
                ? netIncome.multiply(BigDecimal.valueOf(100)).divide(totalRevenue, 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // Calculate MoM comparison
        LocalDate prevStartDate = startDate.minusMonths(1);
        LocalDate prevEndDate = endDate.minusMonths(1);
        Object[] prevRevenueBreakdown = invoiceRepository.getRevenueBreakdownByType(prevStartDate, prevEndDate, propertyId);
        BigDecimal prevTotalRevenue = toBigDecimal(prevRevenueBreakdown[0])
                .add(toBigDecimal(prevRevenueBreakdown[1]))
                .add(toBigDecimal(prevRevenueBreakdown[2]))
                .add(toBigDecimal(prevRevenueBreakdown[3]))
                .add(toBigDecimal(prevRevenueBreakdown[4]));

        BigDecimal prevTotalExpenses = expenseRepository.getTotalExpensesInPeriodByProperty(prevStartDate, prevEndDate, propertyId);
        BigDecimal prevNetIncome = prevTotalRevenue.subtract(prevTotalExpenses);

        BigDecimal revenueChange = calculatePercentageChange(prevTotalRevenue, totalRevenue);
        BigDecimal expenseChange = calculatePercentageChange(prevTotalExpenses, totalExpenses);
        BigDecimal netIncomeChange = calculatePercentageChange(prevNetIncome, netIncome);

        return IncomeStatementDto.builder()
                .startDate(startDate)
                .endDate(endDate)
                .propertyId(propertyId)
                .propertyName(propertyName)
                .totalRevenue(totalRevenue)
                .revenueBreakdown(revenueDetails)
                .totalExpenses(totalExpenses)
                .expenseBreakdown(expenseDetails)
                .netIncome(netIncome)
                .netMargin(netMargin)
                .previousPeriodRevenue(prevTotalRevenue)
                .previousPeriodExpenses(prevTotalExpenses)
                .previousPeriodNetIncome(prevNetIncome)
                .revenueChange(revenueChange)
                .expenseChange(expenseChange)
                .netIncomeChange(netIncomeChange)
                .generatedAt(LocalDateTime.now())
                .build();
    }

    // =================================================================
    // CASH FLOW REPORT
    // =================================================================

    @Override
    public CashFlowSummaryDto getCashFlowSummary(LocalDate startDate, LocalDate endDate, UUID propertyId) {
        log.info("Generating cash flow summary for period {} to {}, propertyId: {}", startDate, endDate, propertyId);

        String propertyName = getPropertyName(propertyId);

        // Get cash inflows (payments received)
        BigDecimal totalInflows = paymentRepository.getTotalCashInflowsInPeriodByProperty(startDate, endDate, propertyId);

        // Get cash outflows (expenses paid)
        BigDecimal totalOutflows = expenseRepository.getTotalExpensesInPeriodByProperty(startDate, endDate, propertyId);

        // Net cash flow
        BigDecimal netCashFlow = totalInflows.subtract(totalOutflows);

        // Get monthly breakdown
        List<Object[]> monthlyInflows = paymentRepository.getMonthlyCashInflows(startDate, endDate, propertyId);
        List<Object[]> monthlyOutflows = expenseRepository.getMonthlyExpenseTrend(startDate, endDate, propertyId);

        // Build monthly map for inflows
        Map<String, BigDecimal> inflowMap = new HashMap<>();
        for (Object[] row : monthlyInflows) {
            int year = ((Number) row[0]).intValue();
            int month = ((Number) row[1]).intValue();
            String key = YearMonth.of(year, month).format(MONTH_YEAR_FORMATTER);
            inflowMap.put(key, toBigDecimal(row[2]));
        }

        // Build monthly map for outflows
        Map<String, BigDecimal> outflowMap = new HashMap<>();
        for (Object[] row : monthlyOutflows) {
            int year = ((Number) row[0]).intValue();
            int month = ((Number) row[1]).intValue();
            String key = YearMonth.of(year, month).format(MONTH_YEAR_FORMATTER);
            outflowMap.put(key, toBigDecimal(row[2]));
        }

        // Combine into monthly cash flow list
        Set<String> allMonths = new TreeSet<>();
        allMonths.addAll(inflowMap.keySet());
        allMonths.addAll(outflowMap.keySet());

        List<CashFlowSummaryDto.MonthlyCashFlow> monthlyCashFlows = new ArrayList<>();
        for (String month : allMonths) {
            BigDecimal inflow = inflowMap.getOrDefault(month, BigDecimal.ZERO);
            BigDecimal outflow = outflowMap.getOrDefault(month, BigDecimal.ZERO);
            monthlyCashFlows.add(new CashFlowSummaryDto.MonthlyCashFlow(
                    month, inflow, outflow, inflow.subtract(outflow)
            ));
        }

        // MoM comparison
        LocalDate prevStartDate = startDate.minusMonths(1);
        LocalDate prevEndDate = endDate.minusMonths(1);
        BigDecimal prevInflows = paymentRepository.getTotalCashInflowsInPeriodByProperty(prevStartDate, prevEndDate, propertyId);
        BigDecimal prevOutflows = expenseRepository.getTotalExpensesInPeriodByProperty(prevStartDate, prevEndDate, propertyId);
        BigDecimal prevNetCashFlow = prevInflows.subtract(prevOutflows);

        BigDecimal inflowChange = calculatePercentageChange(prevInflows, totalInflows);
        BigDecimal outflowChange = calculatePercentageChange(prevOutflows, totalOutflows);
        BigDecimal netChange = calculatePercentageChange(prevNetCashFlow, netCashFlow);

        return CashFlowSummaryDto.builder()
                .startDate(startDate)
                .endDate(endDate)
                .propertyId(propertyId)
                .propertyName(propertyName)
                .totalInflows(totalInflows)
                .totalOutflows(totalOutflows)
                .netCashFlow(netCashFlow)
                .monthlyCashFlows(monthlyCashFlows)
                .previousPeriodInflows(prevInflows)
                .previousPeriodOutflows(prevOutflows)
                .previousPeriodNetCashFlow(prevNetCashFlow)
                .inflowChange(inflowChange)
                .outflowChange(outflowChange)
                .netChange(netChange)
                .generatedAt(LocalDateTime.now())
                .build();
    }

    // =================================================================
    // ACCOUNTS RECEIVABLE AGING REPORT
    // =================================================================

    @Override
    public ARAgingDto getARAgingReport(LocalDate asOfDate, UUID propertyId) {
        log.info("Generating AR aging report as of {}, propertyId: {}", asOfDate, propertyId);

        String propertyName = getPropertyName(propertyId);

        // Get aging buckets
        List<Object[]> agingData = invoiceRepository.getAgingBuckets(asOfDate, propertyId);

        BigDecimal currentAmount = BigDecimal.ZERO;
        BigDecimal days1to30 = BigDecimal.ZERO;
        BigDecimal days31to60 = BigDecimal.ZERO;
        BigDecimal days61to90 = BigDecimal.ZERO;
        BigDecimal over90Days = BigDecimal.ZERO;
        int currentCount = 0, count1to30 = 0, count31to60 = 0, count61to90 = 0, countOver90 = 0;

        for (Object[] row : agingData) {
            String bucket = (String) row[0];
            int count = ((Number) row[1]).intValue();
            BigDecimal amount = toBigDecimal(row[2]);

            switch (bucket) {
                case "CURRENT" -> { currentAmount = amount; currentCount = count; }
                case "DAYS_1_30" -> { days1to30 = amount; count1to30 = count; }
                case "DAYS_31_60" -> { days31to60 = amount; count31to60 = count; }
                case "DAYS_61_90" -> { days61to90 = amount; count61to90 = count; }
                case "DAYS_90_PLUS" -> { over90Days = amount; countOver90 = count; }
            }
        }

        BigDecimal totalOutstanding = currentAmount.add(days1to30).add(days31to60).add(days61to90).add(over90Days);
        int totalInvoices = currentCount + count1to30 + count31to60 + count61to90 + countOver90;

        List<ARAgingDto.AgingBucketData> buckets = Arrays.asList(
                new ARAgingDto.AgingBucketData(ARAgingDto.AgingBucket.CURRENT, currentAmount, currentCount, calculatePercentage(currentAmount, totalOutstanding)),
                new ARAgingDto.AgingBucketData(ARAgingDto.AgingBucket.DAYS_1_30, days1to30, count1to30, calculatePercentage(days1to30, totalOutstanding)),
                new ARAgingDto.AgingBucketData(ARAgingDto.AgingBucket.DAYS_31_60, days31to60, count31to60, calculatePercentage(days31to60, totalOutstanding)),
                new ARAgingDto.AgingBucketData(ARAgingDto.AgingBucket.DAYS_61_90, days61to90, count61to90, calculatePercentage(days61to90, totalOutstanding)),
                new ARAgingDto.AgingBucketData(ARAgingDto.AgingBucket.OVER_90, over90Days, countOver90, calculatePercentage(over90Days, totalOutstanding))
        );

        // Get tenant details for drill-down (AC #5)
        List<Object[]> tenantDetails = invoiceRepository.getAgingDetailsByTenant(asOfDate, propertyId);
        List<ARAgingDto.TenantAgingDetail> tenantAgingDetails = tenantDetails.stream()
                .map(row -> new ARAgingDto.TenantAgingDetail(
                        (UUID) row[0],  // tenantId
                        (String) row[1] + " " + (String) row[2],  // firstName + lastName
                        toBigDecimal(row[3]),  // totalOutstanding
                        toBigDecimal(row[4]),  // currentAmount
                        toBigDecimal(row[5]),  // days1to30
                        toBigDecimal(row[6]),  // days31to60
                        toBigDecimal(row[7]),  // days61to90
                        toBigDecimal(row[8]),  // over90Days
                        ((Number) row[9]).intValue()  // invoiceCount
                ))
                .collect(Collectors.toList());

        // Calculate average days outstanding
        BigDecimal avgDaysOutstanding = calculateAverageDaysOutstanding(
                currentAmount, days1to30, days31to60, days61to90, over90Days
        );

        return ARAgingDto.builder()
                .asOfDate(asOfDate)
                .propertyId(propertyId)
                .propertyName(propertyName)
                .totalOutstanding(totalOutstanding)
                .totalInvoiceCount(totalInvoices)
                .averageDaysOutstanding(avgDaysOutstanding)
                .agingBuckets(buckets)
                .tenantDetails(tenantAgingDetails)
                .generatedAt(LocalDateTime.now())
                .build();
    }

    // =================================================================
    // REVENUE BREAKDOWN REPORT
    // =================================================================

    @Override
    public RevenueBreakdownDto getRevenueBreakdown(LocalDate startDate, LocalDate endDate, UUID propertyId) {
        log.info("Generating revenue breakdown for period {} to {}, propertyId: {}", startDate, endDate, propertyId);

        String propertyName = getPropertyName(propertyId);

        // Get revenue by property
        List<Object[]> revenueByProperty = invoiceRepository.getRevenueByProperty(startDate, endDate);
        List<RevenueBreakdownDto.PropertyRevenue> propertyRevenues = revenueByProperty.stream()
                .map(row -> new RevenueBreakdownDto.PropertyRevenue(
                        (UUID) row[0],
                        (String) row[1],
                        toBigDecimal(row[2]),
                        BigDecimal.ZERO // Will calculate percentage after total
                ))
                .collect(Collectors.toList());

        // Calculate total and percentages
        BigDecimal totalRevenue = propertyRevenues.stream()
                .map(RevenueBreakdownDto.PropertyRevenue::amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        propertyRevenues = propertyRevenues.stream()
                .map(pr -> new RevenueBreakdownDto.PropertyRevenue(
                        pr.propertyId(),
                        pr.propertyName(),
                        pr.amount(),
                        calculatePercentage(pr.amount(), totalRevenue)
                ))
                .collect(Collectors.toList());

        // Get revenue by type
        Object[] revenueByType = invoiceRepository.getRevenueBreakdownByType(startDate, endDate, propertyId);
        List<RevenueBreakdownDto.TypeRevenue> typeRevenues = Arrays.asList(
                new RevenueBreakdownDto.TypeRevenue("RENTAL_INCOME", "Rental Income", toBigDecimal(revenueByType[0]), calculatePercentage(toBigDecimal(revenueByType[0]), totalRevenue)),
                new RevenueBreakdownDto.TypeRevenue("CAM_CHARGES", "CAM Charges", toBigDecimal(revenueByType[1]), calculatePercentage(toBigDecimal(revenueByType[1]), totalRevenue)),
                new RevenueBreakdownDto.TypeRevenue("PARKING_FEES", "Parking Fees", toBigDecimal(revenueByType[2]), calculatePercentage(toBigDecimal(revenueByType[2]), totalRevenue)),
                new RevenueBreakdownDto.TypeRevenue("LATE_FEES", "Late Fees", toBigDecimal(revenueByType[3]), calculatePercentage(toBigDecimal(revenueByType[3]), totalRevenue)),
                new RevenueBreakdownDto.TypeRevenue("OTHER_INCOME", "Other Income", toBigDecimal(revenueByType[4]), calculatePercentage(toBigDecimal(revenueByType[4]), totalRevenue))
        );

        // Get monthly trend
        List<Object[]> monthlyData = invoiceRepository.getMonthlyRevenueTrend(startDate, endDate, propertyId);
        List<RevenueBreakdownDto.MonthlyRevenueTrend> monthlyTrends = monthlyData.stream()
                .map(row -> new RevenueBreakdownDto.MonthlyRevenueTrend(
                        YearMonth.of(((Number) row[0]).intValue(), ((Number) row[1]).intValue()).format(MONTH_YEAR_FORMATTER),
                        toBigDecimal(row[2])
                ))
                .collect(Collectors.toList());

        // Get YoY comparison
        List<Object[]> yoyData = invoiceRepository.getYearOverYearRevenue(propertyId);
        List<RevenueBreakdownDto.YearOverYearRevenue> yoyRevenues = yoyData.stream()
                .map(row -> {
                    int year = ((Number) row[0]).intValue();
                    BigDecimal amount = toBigDecimal(row[1]);
                    return new RevenueBreakdownDto.YearOverYearRevenue(year, amount, BigDecimal.ZERO);
                })
                .collect(Collectors.toList());

        // Calculate YoY change percentages
        for (int i = 1; i < yoyRevenues.size(); i++) {
            RevenueBreakdownDto.YearOverYearRevenue prev = yoyRevenues.get(i - 1);
            RevenueBreakdownDto.YearOverYearRevenue curr = yoyRevenues.get(i);
            BigDecimal change = calculatePercentageChange(prev.amount(), curr.amount());
            yoyRevenues.set(i, new RevenueBreakdownDto.YearOverYearRevenue(curr.year(), curr.amount(), change));
        }

        return RevenueBreakdownDto.builder()
                .startDate(startDate)
                .endDate(endDate)
                .propertyId(propertyId)
                .propertyName(propertyName)
                .totalRevenue(totalRevenue)
                .revenueByProperty(propertyRevenues)
                .revenueByType(typeRevenues)
                .monthlyTrend(monthlyTrends)
                .yearOverYearComparison(yoyRevenues)
                .generatedAt(LocalDateTime.now())
                .build();
    }

    // =================================================================
    // EXPENSE BREAKDOWN REPORT
    // =================================================================

    @Override
    public ExpenseBreakdownDto getExpenseBreakdown(LocalDate startDate, LocalDate endDate, UUID propertyId) {
        log.info("Generating expense breakdown for period {} to {}, propertyId: {}", startDate, endDate, propertyId);

        String propertyName = getPropertyName(propertyId);

        // Get expense by category
        List<Object[]> categoryData = expenseRepository.getCategoryBreakdownByProperty(startDate, endDate, propertyId);
        BigDecimal totalExpenses = BigDecimal.ZERO;
        List<ExpenseBreakdownDto.CategoryExpense> categoryExpenses = new ArrayList<>();

        for (Object[] row : categoryData) {
            ExpenseCategory category = (ExpenseCategory) row[0];
            BigDecimal amount = toBigDecimal(row[1]);
            totalExpenses = totalExpenses.add(amount);
            categoryExpenses.add(new ExpenseBreakdownDto.CategoryExpense(
                    category.name(),
                    category.getDisplayName(),
                    amount,
                    BigDecimal.ZERO // Will calculate percentage after
            ));
        }

        // Calculate percentages
        BigDecimal finalTotalExpenses = totalExpenses;
        categoryExpenses = categoryExpenses.stream()
                .map(ce -> new ExpenseBreakdownDto.CategoryExpense(
                        ce.category(),
                        ce.categoryLabel(),
                        ce.amount(),
                        calculatePercentage(ce.amount(), finalTotalExpenses)
                ))
                .collect(Collectors.toList());

        // Get monthly trend
        List<Object[]> monthlyData = expenseRepository.getMonthlyExpenseTrend(startDate, endDate, propertyId);
        List<ExpenseBreakdownDto.MonthlyExpenseTrend> monthlyTrends = monthlyData.stream()
                .map(row -> new ExpenseBreakdownDto.MonthlyExpenseTrend(
                        YearMonth.of(((Number) row[0]).intValue(), ((Number) row[1]).intValue()).format(MONTH_YEAR_FORMATTER),
                        toBigDecimal(row[2])
                ))
                .collect(Collectors.toList());

        // Get top vendors
        List<Object[]> vendorData = expenseRepository.getTopVendorsByPayment(startDate, endDate, propertyId);
        List<ExpenseBreakdownDto.VendorPayment> topVendors = vendorData.stream()
                .map(row -> new ExpenseBreakdownDto.VendorPayment(
                        (UUID) row[0],
                        (String) row[1],
                        toBigDecimal(row[2]),
                        calculatePercentage(toBigDecimal(row[2]), finalTotalExpenses)
                ))
                .collect(Collectors.toList());

        // Get maintenance cost by property
        List<Object[]> maintenanceData = expenseRepository.getMaintenanceCostByProperty(startDate, endDate);
        List<ExpenseBreakdownDto.PropertyMaintenanceCost> maintenanceCosts = maintenanceData.stream()
                .map(row -> new ExpenseBreakdownDto.PropertyMaintenanceCost(
                        (UUID) row[0],
                        (String) row[1],
                        toBigDecimal(row[2])
                ))
                .collect(Collectors.toList());

        return ExpenseBreakdownDto.builder()
                .startDate(startDate)
                .endDate(endDate)
                .propertyId(propertyId)
                .propertyName(propertyName)
                .totalExpenses(totalExpenses)
                .expenseByCategory(categoryExpenses)
                .monthlyTrend(monthlyTrends)
                .topVendors(topVendors)
                .maintenanceCostByProperty(maintenanceCosts)
                .generatedAt(LocalDateTime.now())
                .build();
    }

    // =================================================================
    // FINANCIAL DASHBOARD
    // =================================================================

    @Override
    @Cacheable(value = "financialDashboard", key = "#propertyId != null ? #propertyId : 'all'")
    public FinancialDashboardDto getFinancialDashboard(UUID propertyId) {
        log.info("Generating financial dashboard, propertyId: {}", propertyId);
        return buildFinancialDashboard(propertyId);
    }

    @Override
    @CacheEvict(value = "financialDashboard", key = "#propertyId != null ? #propertyId : 'all'")
    public FinancialDashboardDto refreshFinancialDashboard(UUID propertyId) {
        log.info("Refreshing financial dashboard cache, propertyId: {}", propertyId);
        return buildFinancialDashboard(propertyId);
    }

    private FinancialDashboardDto buildFinancialDashboard(UUID propertyId) {
        String propertyName = getPropertyName(propertyId);
        LocalDate today = LocalDate.now();
        LocalDate startOfMonth = today.withDayOfMonth(1);
        LocalDate endOfMonth = today.withDayOfMonth(today.lengthOfMonth());
        LocalDate prevStartOfMonth = startOfMonth.minusMonths(1);
        LocalDate prevEndOfMonth = prevStartOfMonth.withDayOfMonth(prevStartOfMonth.lengthOfMonth());

        // Current month totals
        Object[] currentRevenue = invoiceRepository.getRevenueBreakdownByType(startOfMonth, endOfMonth, propertyId);
        BigDecimal totalRevenue = toBigDecimal(currentRevenue[0])
                .add(toBigDecimal(currentRevenue[1]))
                .add(toBigDecimal(currentRevenue[2]))
                .add(toBigDecimal(currentRevenue[3]))
                .add(toBigDecimal(currentRevenue[4]));

        BigDecimal totalExpenses = expenseRepository.getTotalExpensesInPeriodByProperty(startOfMonth, endOfMonth, propertyId);
        BigDecimal netProfitLoss = totalRevenue.subtract(totalExpenses);

        // Previous month totals for growth calculation
        Object[] prevRevenue = invoiceRepository.getRevenueBreakdownByType(prevStartOfMonth, prevEndOfMonth, propertyId);
        BigDecimal prevTotalRevenue = toBigDecimal(prevRevenue[0])
                .add(toBigDecimal(prevRevenue[1]))
                .add(toBigDecimal(prevRevenue[2]))
                .add(toBigDecimal(prevRevenue[3]))
                .add(toBigDecimal(prevRevenue[4]));
        BigDecimal prevTotalExpenses = expenseRepository.getTotalExpensesInPeriodByProperty(prevStartOfMonth, prevEndOfMonth, propertyId);

        BigDecimal revenueGrowth = calculatePercentageChange(prevTotalRevenue, totalRevenue);
        BigDecimal expenseGrowth = calculatePercentageChange(prevTotalExpenses, totalExpenses);

        // Collection rate
        BigDecimal totalInvoiced = invoiceRepository.getTotalInvoicedInPeriodByProperty(startOfMonth, endOfMonth, propertyId);
        BigDecimal totalCollected = paymentRepository.getTotalCashInflowsInPeriodByProperty(startOfMonth, endOfMonth, propertyId);
        BigDecimal collectionRate = totalInvoiced.compareTo(BigDecimal.ZERO) > 0
                ? totalCollected.multiply(BigDecimal.valueOf(100)).divide(totalInvoiced, 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // Outstanding receivables
        BigDecimal outstandingReceivables = invoiceRepository.getTotalOutstandingByProperty(propertyId);

        FinancialDashboardDto.FinancialKPIs kpis = FinancialDashboardDto.FinancialKPIs.builder()
                .totalRevenue(totalRevenue)
                .totalExpenses(totalExpenses)
                .netProfitLoss(netProfitLoss)
                .collectionRate(collectionRate)
                .outstandingReceivables(outstandingReceivables)
                .revenueGrowth(revenueGrowth)
                .expenseGrowth(expenseGrowth)
                .build();

        // Insights
        Object[] topProperty = invoiceRepository.getTopPerformingProperty(startOfMonth, endOfMonth);
        FinancialDashboardDto.TopPerformingProperty topPerformingProperty = topProperty != null && topProperty[0] != null
                ? new FinancialDashboardDto.TopPerformingProperty((UUID) topProperty[0], (String) topProperty[1], toBigDecimal(topProperty[2]))
                : null;

        Object[] topExpenseCategory = expenseRepository.getHighestExpenseCategory(startOfMonth, endOfMonth, propertyId);
        FinancialDashboardDto.HighestExpenseCategory highestExpenseCategory = topExpenseCategory != null && topExpenseCategory[0] != null
                ? new FinancialDashboardDto.HighestExpenseCategory(
                        (ExpenseCategory) topExpenseCategory[0],
                        ((ExpenseCategory) topExpenseCategory[0]).getDisplayName(),
                        toBigDecimal(topExpenseCategory[1]))
                : null;

        FinancialDashboardDto.FinancialInsights insights = new FinancialDashboardDto.FinancialInsights(
                topPerformingProperty, highestExpenseCategory
        );

        return FinancialDashboardDto.builder()
                .kpis(kpis)
                .insights(insights)
                .currentMonth(startOfMonth.format(MONTH_YEAR_FORMATTER))
                .previousMonth(prevStartOfMonth.format(MONTH_YEAR_FORMATTER))
                .propertyId(propertyId)
                .propertyName(propertyName)
                .cachedAt(LocalDateTime.now())
                .build();
    }

    // =================================================================
    // EXPORT OPERATIONS
    // =================================================================

    @Override
    public byte[] exportToPdf(String reportType, LocalDate startDate, LocalDate endDate, UUID propertyId) {
        log.info("Exporting {} report to PDF for period {} to {}", reportType, startDate, endDate);

        return switch (reportType.toLowerCase()) {
            case "income-statement" -> {
                IncomeStatementDto data = getIncomeStatement(startDate, endDate, propertyId);
                yield pdfGenerationService.generateIncomeStatementPdf(data);
            }
            case "cash-flow" -> {
                CashFlowSummaryDto data = getCashFlowSummary(startDate, endDate, propertyId);
                yield pdfGenerationService.generateCashFlowPdf(data);
            }
            case "receivables-aging" -> {
                ARAgingDto data = getARAgingReport(endDate, propertyId);
                yield pdfGenerationService.generateARAgingPdf(data);
            }
            case "revenue-breakdown" -> {
                RevenueBreakdownDto data = getRevenueBreakdown(startDate, endDate, propertyId);
                yield pdfGenerationService.generateRevenueBreakdownPdf(data);
            }
            case "expense-breakdown" -> {
                ExpenseBreakdownDto data = getExpenseBreakdown(startDate, endDate, propertyId);
                yield pdfGenerationService.generateExpenseBreakdownPdf(data);
            }
            case "financial-dashboard" -> {
                FinancialDashboardDto data = getFinancialDashboard(propertyId);
                yield pdfGenerationService.generateFinancialDashboardPdf(data);
            }
            default -> throw new IllegalArgumentException("Unknown report type: " + reportType);
        };
    }

    @Override
    public byte[] exportToExcel(String reportType, LocalDate startDate, LocalDate endDate, UUID propertyId) {
        log.info("Exporting {} report to Excel for period {} to {}", reportType, startDate, endDate);

        return switch (reportType.toLowerCase()) {
            case "income-statement" -> {
                IncomeStatementDto data = getIncomeStatement(startDate, endDate, propertyId);
                yield excelExportService.generateIncomeStatementExcel(data);
            }
            case "cash-flow" -> {
                CashFlowSummaryDto data = getCashFlowSummary(startDate, endDate, propertyId);
                yield excelExportService.generateCashFlowExcel(data);
            }
            case "receivables-aging" -> {
                ARAgingDto data = getARAgingReport(endDate, propertyId);
                yield excelExportService.generateARAgingExcel(data);
            }
            case "revenue-breakdown" -> {
                RevenueBreakdownDto data = getRevenueBreakdown(startDate, endDate, propertyId);
                yield excelExportService.generateRevenueBreakdownExcel(data);
            }
            case "expense-breakdown" -> {
                ExpenseBreakdownDto data = getExpenseBreakdown(startDate, endDate, propertyId);
                yield excelExportService.generateExpenseBreakdownExcel(data);
            }
            case "financial-dashboard" -> {
                FinancialDashboardDto data = getFinancialDashboard(propertyId);
                yield excelExportService.generateFinancialDashboardExcel(data);
            }
            default -> throw new IllegalArgumentException("Unknown report type: " + reportType);
        };
    }

    // =================================================================
    // EMAIL REPORTS
    // =================================================================

    @Override
    @Transactional
    public void emailReport(EmailReportDto emailReportDto) {
        log.info("Emailing {} report to {} recipients", emailReportDto.reportType(), emailReportDto.recipients().size());
        // Email report will be implemented in Tasks 7/8 after export is ready
        throw new UnsupportedOperationException("Email report will be implemented after export services");
    }

    // =================================================================
    // HELPER METHODS
    // =================================================================

    private String getPropertyName(UUID propertyId) {
        if (propertyId == null) {
            return "All Properties";
        }
        return propertyRepository.findById(propertyId)
                .map(Property::getName)
                .orElse("Unknown Property");
    }

    private BigDecimal toBigDecimal(Object value) {
        if (value == null) return BigDecimal.ZERO;
        if (value instanceof BigDecimal bd) return bd;
        if (value instanceof Number n) return BigDecimal.valueOf(n.doubleValue());
        return BigDecimal.ZERO;
    }

    private BigDecimal calculatePercentage(BigDecimal part, BigDecimal total) {
        if (total == null || total.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return part.multiply(BigDecimal.valueOf(100)).divide(total, 2, RoundingMode.HALF_UP);
    }

    private BigDecimal calculatePercentageChange(BigDecimal previous, BigDecimal current) {
        if (previous == null || previous.compareTo(BigDecimal.ZERO) == 0) {
            return current.compareTo(BigDecimal.ZERO) > 0 ? BigDecimal.valueOf(100) : BigDecimal.ZERO;
        }
        return current.subtract(previous)
                .multiply(BigDecimal.valueOf(100))
                .divide(previous, 2, RoundingMode.HALF_UP);
    }

    private BigDecimal calculateAverageDaysOutstanding(
            BigDecimal current, BigDecimal days1to30, BigDecimal days31to60,
            BigDecimal days61to90, BigDecimal over90) {
        BigDecimal total = current.add(days1to30).add(days31to60).add(days61to90).add(over90);
        if (total.compareTo(BigDecimal.ZERO) == 0) return BigDecimal.ZERO;

        // Weighted average: current=0, 1-30=15, 31-60=45, 61-90=75, over90=105
        BigDecimal weighted = current.multiply(BigDecimal.ZERO)
                .add(days1to30.multiply(BigDecimal.valueOf(15)))
                .add(days31to60.multiply(BigDecimal.valueOf(45)))
                .add(days61to90.multiply(BigDecimal.valueOf(75)))
                .add(over90.multiply(BigDecimal.valueOf(105)));

        return weighted.divide(total, 0, RoundingMode.HALF_UP);
    }
}
