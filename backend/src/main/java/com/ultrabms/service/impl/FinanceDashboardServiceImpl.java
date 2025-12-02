package com.ultrabms.service.impl;

import com.ultrabms.dto.dashboard.finance.*;
import com.ultrabms.entity.enums.ExpenseCategory;
import com.ultrabms.repository.FinanceDashboardRepository;
import com.ultrabms.service.FinanceDashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.TemporalAdjusters;
import java.util.*;

/**
 * Implementation of FinanceDashboardService.
 * Provides finance dashboard data with 5-minute Ehcache caching (AC-18).
 *
 * Story 8.6: Finance Dashboard
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class FinanceDashboardServiceImpl implements FinanceDashboardService {

    private final FinanceDashboardRepository repository;

    private static final BigDecimal DEFAULT_TRANSACTION_THRESHOLD = new BigDecimal("10000");
    private static final int DEFAULT_TRANSACTION_LIMIT = 10;

    // Category colors for donut chart
    private static final Map<ExpenseCategory, String> CATEGORY_COLORS = Map.of(
            ExpenseCategory.MAINTENANCE, "#3b82f6",   // Blue
            ExpenseCategory.UTILITIES, "#f59e0b",     // Amber
            ExpenseCategory.SALARIES, "#8b5cf6",      // Purple
            ExpenseCategory.SUPPLIES, "#ec4899",      // Pink
            ExpenseCategory.INSURANCE, "#10b981",     // Emerald
            ExpenseCategory.TAXES, "#6366f1",         // Indigo
            ExpenseCategory.OTHER, "#6b7280"          // Gray
    );

    // =================================================================
    // COMPLETE DASHBOARD (AC-10)
    // =================================================================

    @Override
    @Cacheable(value = "financeDashboard", key = "#propertyId != null ? #propertyId.toString() : 'all'")
    public FinanceDashboardDto getFinanceDashboard(UUID propertyId) {
        log.debug("Fetching finance dashboard data for propertyId: {}", propertyId);

        return FinanceDashboardDto.builder()
                .kpis(getFinanceKpis(propertyId))
                .incomeVsExpense(getIncomeVsExpense(propertyId))
                .expenseCategories(getExpenseCategories(propertyId))
                .outstandingReceivables(getOutstandingReceivables(propertyId))
                .recentTransactions(getRecentTransactions(DEFAULT_TRANSACTION_THRESHOLD, propertyId))
                .pdcStatus(getPdcStatus(propertyId))
                .build();
    }

    // =================================================================
    // KPIs (AC-1, AC-2, AC-3, AC-4)
    // =================================================================

    @Override
    @Cacheable(value = "financeKpis", key = "#propertyId != null ? #propertyId.toString() : 'all'")
    public FinanceKpiDto getFinanceKpis(UUID propertyId) {
        log.debug("Fetching finance KPIs for propertyId: {}", propertyId);

        LocalDate now = LocalDate.now();
        LocalDate ytdStart = LocalDate.of(now.getYear(), 1, 1);
        LocalDate lastYearStart = ytdStart.minusYears(1);
        LocalDate lastYearSameDate = now.minusYears(1);

        // Get YTD metrics
        BigDecimal totalIncomeYtd = repository.getTotalIncomeInPeriod(ytdStart, now, propertyId);
        BigDecimal totalExpensesYtd = repository.getTotalExpensesInPeriod(ytdStart, now, propertyId);
        BigDecimal vatPaidYtd = repository.getTotalVatInPeriod(ytdStart, now, propertyId);

        // Get last year same period metrics
        BigDecimal totalIncomeLastYear = repository.getTotalIncomeInPeriod(lastYearStart, lastYearSameDate, propertyId);
        BigDecimal totalExpensesLastYear = repository.getTotalExpensesInPeriod(lastYearStart, lastYearSameDate, propertyId);
        BigDecimal vatPaidLastYear = repository.getTotalVatInPeriod(lastYearStart, lastYearSameDate, propertyId);

        // Calculate net profit/loss
        BigDecimal netProfitLossYtd = totalIncomeYtd.subtract(totalExpensesYtd);

        // Calculate profit margin percentage
        Double profitMarginPercentage = null;
        if (totalIncomeYtd.compareTo(BigDecimal.ZERO) > 0) {
            profitMarginPercentage = netProfitLossYtd
                    .divide(totalIncomeYtd, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .doubleValue();
        }

        return FinanceKpiDto.builder()
                .totalIncomeYtd(totalIncomeYtd)
                .totalIncomeLastYear(totalIncomeLastYear)
                .incomeTrendPercentage(calculateTrendPercentage(totalIncomeYtd, totalIncomeLastYear))
                .totalExpensesYtd(totalExpensesYtd)
                .totalExpensesLastYear(totalExpensesLastYear)
                .expensesTrendPercentage(calculateTrendPercentage(totalExpensesYtd, totalExpensesLastYear))
                .netProfitLossYtd(netProfitLossYtd)
                .profitMarginPercentage(profitMarginPercentage)
                .vatPaidYtd(vatPaidYtd)
                .vatPaidLastYear(vatPaidLastYear)
                .vatTrendPercentage(calculateTrendPercentage(vatPaidYtd, vatPaidLastYear))
                .build();
    }

    // =================================================================
    // INCOME VS EXPENSE CHART (AC-5, AC-11)
    // =================================================================

    @Override
    @Cacheable(value = "financeIncomeVsExpense", key = "#propertyId != null ? #propertyId.toString() : 'all'")
    public List<IncomeExpenseChartDto> getIncomeVsExpense(UUID propertyId) {
        log.debug("Fetching income vs expense data for propertyId: {}", propertyId);

        LocalDate now = LocalDate.now();
        LocalDate startDate = now.minusMonths(11).withDayOfMonth(1);
        LocalDate endDate = YearMonth.from(now).atEndOfMonth();

        List<Object[]> results = repository.getIncomeVsExpenseByMonth(startDate, endDate, propertyId);

        return results.stream()
                .map(row -> {
                    BigDecimal income = toBigDecimal(row[2]);
                    BigDecimal expenses = toBigDecimal(row[3]);
                    return IncomeExpenseChartDto.builder()
                            .month((String) row[0])
                            .monthYear((String) row[1])
                            .income(income)
                            .expenses(expenses)
                            .netProfitLoss(income.subtract(expenses))
                            .build();
                })
                .toList();
    }

    // =================================================================
    // EXPENSE CATEGORIES (AC-6, AC-12)
    // =================================================================

    @Override
    @Cacheable(value = "financeExpenseCategories", key = "#propertyId != null ? #propertyId.toString() : 'all'")
    public List<ExpenseCategoryDto> getExpenseCategories(UUID propertyId) {
        log.debug("Fetching expense categories for propertyId: {}", propertyId);

        LocalDate now = LocalDate.now();
        LocalDate ytdStart = LocalDate.of(now.getYear(), 1, 1);

        List<Object[]> results = repository.getExpensesByCategory(ytdStart, now, propertyId);

        // Calculate total for percentage
        BigDecimal total = results.stream()
                .map(row -> toBigDecimal(row[1]))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return results.stream()
                .map(row -> {
                    String categoryStr = (String) row[0];
                    ExpenseCategory category = ExpenseCategory.valueOf(categoryStr);
                    BigDecimal amount = toBigDecimal(row[1]);
                    Long count = ((Number) row[2]).longValue();

                    Double percentage = null;
                    if (total.compareTo(BigDecimal.ZERO) > 0) {
                        percentage = amount
                                .divide(total, 4, RoundingMode.HALF_UP)
                                .multiply(BigDecimal.valueOf(100))
                                .doubleValue();
                    }

                    return ExpenseCategoryDto.builder()
                            .category(category)
                            .categoryName(category.getDisplayName())
                            .amount(amount)
                            .percentage(percentage)
                            .count(count)
                            .build();
                })
                .toList();
    }

    // =================================================================
    // OUTSTANDING RECEIVABLES (AC-7, AC-13)
    // =================================================================

    @Override
    @Cacheable(value = "financeReceivables", key = "#propertyId != null ? #propertyId.toString() : 'all'")
    public OutstandingReceivablesDto getOutstandingReceivables(UUID propertyId) {
        log.debug("Fetching outstanding receivables for propertyId: {}", propertyId);

        LocalDate today = LocalDate.now();

        List<Object[]> agingResults = repository.getOutstandingReceivablesByAging(today, propertyId);
        BigDecimal totalOutstanding = repository.getTotalOutstandingReceivables(today, propertyId);

        // Initialize aging buckets
        BigDecimal currentAmount = BigDecimal.ZERO;
        Long currentCount = 0L;
        BigDecimal thirtyPlusAmount = BigDecimal.ZERO;
        Long thirtyPlusCount = 0L;
        BigDecimal sixtyPlusAmount = BigDecimal.ZERO;
        Long sixtyPlusCount = 0L;
        BigDecimal ninetyPlusAmount = BigDecimal.ZERO;
        Long ninetyPlusCount = 0L;
        Long totalInvoiceCount = 0L;

        // Process aging results
        for (Object[] row : agingResults) {
            String bucket = (String) row[0];
            BigDecimal amount = toBigDecimal(row[1]);
            Long count = ((Number) row[2]).longValue();
            totalInvoiceCount += count;

            switch (bucket) {
                case "CURRENT" -> {
                    currentAmount = amount;
                    currentCount = count;
                }
                case "THIRTY_PLUS" -> {
                    thirtyPlusAmount = amount;
                    thirtyPlusCount = count;
                }
                case "SIXTY_PLUS" -> {
                    sixtyPlusAmount = amount;
                    sixtyPlusCount = count;
                }
                case "NINETY_PLUS" -> {
                    ninetyPlusAmount = amount;
                    ninetyPlusCount = count;
                }
            }
        }

        // Calculate percentages
        Double currentPercentage = calculatePercentage(currentAmount, totalOutstanding);
        Double thirtyPlusPercentage = calculatePercentage(thirtyPlusAmount, totalOutstanding);
        Double sixtyPlusPercentage = calculatePercentage(sixtyPlusAmount, totalOutstanding);
        Double ninetyPlusPercentage = calculatePercentage(ninetyPlusAmount, totalOutstanding);

        return OutstandingReceivablesDto.builder()
                .totalOutstanding(totalOutstanding)
                .totalInvoiceCount(totalInvoiceCount)
                .currentAmount(currentAmount)
                .currentCount(currentCount)
                .thirtyPlusAmount(thirtyPlusAmount)
                .thirtyPlusCount(thirtyPlusCount)
                .sixtyPlusAmount(sixtyPlusAmount)
                .sixtyPlusCount(sixtyPlusCount)
                .ninetyPlusAmount(ninetyPlusAmount)
                .ninetyPlusCount(ninetyPlusCount)
                .currentPercentage(currentPercentage)
                .thirtyPlusPercentage(thirtyPlusPercentage)
                .sixtyPlusPercentage(sixtyPlusPercentage)
                .ninetyPlusPercentage(ninetyPlusPercentage)
                .build();
    }

    // =================================================================
    // RECENT TRANSACTIONS (AC-8, AC-14)
    // =================================================================

    @Override
    @Cacheable(value = "financeRecentTransactions", key = "(#threshold != null ? #threshold.toString() : '10000') + '-' + (#propertyId != null ? #propertyId.toString() : 'all')")
    public List<RecentTransactionDto> getRecentTransactions(BigDecimal threshold, UUID propertyId) {
        log.debug("Fetching recent transactions with threshold {} for propertyId: {}", threshold, propertyId);

        BigDecimal effectiveThreshold = threshold != null ? threshold : DEFAULT_TRANSACTION_THRESHOLD;

        List<Object[]> results = repository.getRecentHighValueTransactions(
                effectiveThreshold, DEFAULT_TRANSACTION_LIMIT, propertyId);

        return results.stream()
                .map(row -> RecentTransactionDto.builder()
                        .id((UUID) row[0])
                        .date(((java.sql.Date) row[1]).toLocalDate())
                        .type(RecentTransactionDto.TransactionType.valueOf((String) row[2]))
                        .description((String) row[3])
                        .amount(toBigDecimal(row[4]))
                        .category((String) row[5])
                        .referenceNumber((String) row[6])
                        .build())
                .toList();
    }

    // =================================================================
    // PDC STATUS (AC-9, AC-15)
    // =================================================================

    @Override
    @Cacheable(value = "financePdcStatus", key = "#propertyId != null ? #propertyId.toString() : 'all'")
    public PdcStatusSummaryDto getPdcStatus(UUID propertyId) {
        log.debug("Fetching PDC status for propertyId: {}", propertyId);

        LocalDate today = LocalDate.now();
        LocalDate weekEnd = today.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY));
        LocalDate monthEnd = YearMonth.from(today).atEndOfMonth();

        // Get PDCs due this week
        Object[] weeklyResult = repository.getPdcsDueInRange(today, weekEnd, propertyId);
        Long dueThisWeekCount = weeklyResult[0] != null ? ((Number) weeklyResult[0]).longValue() : 0L;
        BigDecimal dueThisWeekAmount = toBigDecimal(weeklyResult[1]);

        // Get PDCs due this month (after this week)
        Object[] monthlyResult = repository.getPdcsDueInRange(weekEnd.plusDays(1), monthEnd, propertyId);
        Long dueThisMonthCount = monthlyResult[0] != null ? ((Number) monthlyResult[0]).longValue() : 0L;
        BigDecimal dueThisMonthAmount = toBigDecimal(monthlyResult[1]);

        // Get PDCs awaiting clearance
        Object[] clearanceResult = repository.getPdcsAwaitingClearance(propertyId);
        Long awaitingClearanceCount = clearanceResult[0] != null ? ((Number) clearanceResult[0]).longValue() : 0L;
        BigDecimal awaitingClearanceAmount = toBigDecimal(clearanceResult[1]);

        // Calculate totals
        Long totalPdcsCount = dueThisWeekCount + dueThisMonthCount + awaitingClearanceCount;
        BigDecimal totalPdcsAmount = dueThisWeekAmount.add(dueThisMonthAmount).add(awaitingClearanceAmount);

        return PdcStatusSummaryDto.builder()
                .dueThisWeekCount(dueThisWeekCount)
                .dueThisWeekAmount(dueThisWeekAmount)
                .dueThisMonthCount(dueThisMonthCount)
                .dueThisMonthAmount(dueThisMonthAmount)
                .awaitingClearanceCount(awaitingClearanceCount)
                .awaitingClearanceAmount(awaitingClearanceAmount)
                .totalPdcsCount(totalPdcsCount)
                .totalPdcsAmount(totalPdcsAmount)
                .build();
    }

    // =================================================================
    // UTILITY METHODS
    // =================================================================

    private Double calculateTrendPercentage(BigDecimal current, BigDecimal previous) {
        if (previous == null || previous.compareTo(BigDecimal.ZERO) == 0) {
            return null;
        }
        return current.subtract(previous)
                .divide(previous, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .doubleValue();
    }

    private Double calculatePercentage(BigDecimal part, BigDecimal total) {
        if (total == null || total.compareTo(BigDecimal.ZERO) == 0) {
            return 0.0;
        }
        return part.divide(total, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .doubleValue();
    }

    private BigDecimal toBigDecimal(Object value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        if (value instanceof BigDecimal bd) {
            return bd;
        }
        return new BigDecimal(value.toString());
    }
}
