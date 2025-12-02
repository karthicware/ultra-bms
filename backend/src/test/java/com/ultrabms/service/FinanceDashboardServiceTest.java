package com.ultrabms.service;

import com.ultrabms.dto.dashboard.finance.*;
import com.ultrabms.entity.enums.ExpenseCategory;
import com.ultrabms.repository.FinanceDashboardRepository;
import com.ultrabms.service.impl.FinanceDashboardServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.sql.Date;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Unit tests for FinanceDashboardServiceImpl.
 * Tests all service methods with mocked repository.
 *
 * Story 8.6: Finance Dashboard
 */
@ExtendWith(MockitoExtension.class)
class FinanceDashboardServiceTest {

    @Mock
    private FinanceDashboardRepository repository;

    @InjectMocks
    private FinanceDashboardServiceImpl service;

    private UUID testPropertyId;
    private LocalDate ytdStart;
    private LocalDate today;

    @BeforeEach
    void setUp() {
        testPropertyId = UUID.randomUUID();
        today = LocalDate.now();
        ytdStart = LocalDate.of(today.getYear(), 1, 1);
    }

    // =================================================================
    // KPI TESTS (AC-1 to AC-4)
    // =================================================================

    @Nested
    @DisplayName("getFinanceKpis tests")
    class GetFinanceKpisTests {

        @Test
        @DisplayName("Should return YTD KPIs with correct calculations")
        void shouldReturnYtdKpisWithCorrectCalculations() {
            // Given
            BigDecimal totalIncomeYtd = new BigDecimal("500000.00");
            BigDecimal totalExpensesYtd = new BigDecimal("300000.00");
            BigDecimal vatPaidYtd = new BigDecimal("15000.00");
            BigDecimal totalIncomeLastYear = new BigDecimal("450000.00");
            BigDecimal totalExpensesLastYear = new BigDecimal("280000.00");
            BigDecimal vatPaidLastYear = new BigDecimal("14000.00");

            when(repository.getTotalIncomeInPeriod(any(), any(), eq(testPropertyId)))
                    .thenReturn(totalIncomeYtd)
                    .thenReturn(totalIncomeLastYear);
            when(repository.getTotalExpensesInPeriod(any(), any(), eq(testPropertyId)))
                    .thenReturn(totalExpensesYtd)
                    .thenReturn(totalExpensesLastYear);
            when(repository.getTotalVatInPeriod(any(), any(), eq(testPropertyId)))
                    .thenReturn(vatPaidYtd)
                    .thenReturn(vatPaidLastYear);

            // When
            FinanceKpiDto result = service.getFinanceKpis(testPropertyId);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getTotalIncomeYtd()).isEqualByComparingTo(totalIncomeYtd);
            assertThat(result.getTotalExpensesYtd()).isEqualByComparingTo(totalExpensesYtd);
            assertThat(result.getVatPaidYtd()).isEqualByComparingTo(vatPaidYtd);
            assertThat(result.getNetProfitLossYtd()).isEqualByComparingTo(new BigDecimal("200000.00"));
            assertThat(result.getProfitMarginPercentage()).isEqualTo(40.0);
        }

        @Test
        @DisplayName("Should calculate trend percentages correctly")
        void shouldCalculateTrendPercentagesCorrectly() {
            // Given
            when(repository.getTotalIncomeInPeriod(any(), any(), isNull()))
                    .thenReturn(new BigDecimal("110000.00"))
                    .thenReturn(new BigDecimal("100000.00"));
            when(repository.getTotalExpensesInPeriod(any(), any(), isNull()))
                    .thenReturn(new BigDecimal("50000.00"))
                    .thenReturn(new BigDecimal("50000.00"));
            when(repository.getTotalVatInPeriod(any(), any(), isNull()))
                    .thenReturn(new BigDecimal("2500.00"))
                    .thenReturn(new BigDecimal("2500.00"));

            // When
            FinanceKpiDto result = service.getFinanceKpis(null);

            // Then
            assertThat(result.getIncomeTrendPercentage()).isEqualTo(10.0); // 10% increase
            assertThat(result.getExpensesTrendPercentage()).isEqualTo(0.0); // no change
            assertThat(result.getVatTrendPercentage()).isEqualTo(0.0); // no change
        }

        @Test
        @DisplayName("Should handle zero previous year values")
        void shouldHandleZeroPreviousYearValues() {
            // Given
            when(repository.getTotalIncomeInPeriod(any(), any(), isNull()))
                    .thenReturn(new BigDecimal("50000.00"))
                    .thenReturn(BigDecimal.ZERO);
            when(repository.getTotalExpensesInPeriod(any(), any(), isNull()))
                    .thenReturn(new BigDecimal("30000.00"))
                    .thenReturn(BigDecimal.ZERO);
            when(repository.getTotalVatInPeriod(any(), any(), isNull()))
                    .thenReturn(new BigDecimal("1500.00"))
                    .thenReturn(BigDecimal.ZERO);

            // When
            FinanceKpiDto result = service.getFinanceKpis(null);

            // Then
            assertThat(result.getIncomeTrendPercentage()).isNull();
            assertThat(result.getExpensesTrendPercentage()).isNull();
            assertThat(result.getVatTrendPercentage()).isNull();
        }

        @Test
        @DisplayName("Should handle loss scenario correctly")
        void shouldHandleLossScenarioCorrectly() {
            // Given
            when(repository.getTotalIncomeInPeriod(any(), any(), isNull()))
                    .thenReturn(new BigDecimal("100000.00"))
                    .thenReturn(new BigDecimal("100000.00"));
            when(repository.getTotalExpensesInPeriod(any(), any(), isNull()))
                    .thenReturn(new BigDecimal("150000.00"))
                    .thenReturn(new BigDecimal("100000.00"));
            when(repository.getTotalVatInPeriod(any(), any(), isNull()))
                    .thenReturn(new BigDecimal("7500.00"))
                    .thenReturn(new BigDecimal("5000.00"));

            // When
            FinanceKpiDto result = service.getFinanceKpis(null);

            // Then
            assertThat(result.getNetProfitLossYtd()).isEqualByComparingTo(new BigDecimal("-50000.00"));
            assertThat(result.getProfitMarginPercentage()).isEqualTo(-50.0);
        }
    }

    // =================================================================
    // INCOME VS EXPENSE CHART TESTS (AC-5)
    // =================================================================

    @Nested
    @DisplayName("getIncomeVsExpense tests")
    class GetIncomeVsExpenseTests {

        @Test
        @DisplayName("Should return 12 months of data")
        void shouldReturn12MonthsOfData() {
            // Given
            List<Object[]> mockData = List.of(
                    new Object[]{"Jan", "2024-01", new BigDecimal("50000"), new BigDecimal("30000")},
                    new Object[]{"Feb", "2024-02", new BigDecimal("55000"), new BigDecimal("32000")},
                    new Object[]{"Mar", "2024-03", new BigDecimal("60000"), new BigDecimal("35000")}
            );
            when(repository.getIncomeVsExpenseByMonth(any(), any(), isNull()))
                    .thenReturn(mockData);

            // When
            List<IncomeExpenseChartDto> result = service.getIncomeVsExpense(null);

            // Then
            assertThat(result).hasSize(3);
            assertThat(result.get(0).getMonth()).isEqualTo("Jan");
            assertThat(result.get(0).getIncome()).isEqualByComparingTo(new BigDecimal("50000"));
            assertThat(result.get(0).getExpenses()).isEqualByComparingTo(new BigDecimal("30000"));
            assertThat(result.get(0).getNetProfitLoss()).isEqualByComparingTo(new BigDecimal("20000"));
        }

        @Test
        @DisplayName("Should calculate net profit/loss for each month")
        void shouldCalculateNetProfitLossForEachMonth() {
            // Given
            List<Object[]> mockData = List.of(
                    new Object[]{"Jan", "2024-01", new BigDecimal("100000"), new BigDecimal("80000")},
                    new Object[]{"Feb", "2024-02", new BigDecimal("50000"), new BigDecimal("70000")} // loss month
            );
            when(repository.getIncomeVsExpenseByMonth(any(), any(), eq(testPropertyId)))
                    .thenReturn(mockData);

            // When
            List<IncomeExpenseChartDto> result = service.getIncomeVsExpense(testPropertyId);

            // Then
            assertThat(result.get(0).getNetProfitLoss()).isEqualByComparingTo(new BigDecimal("20000")); // profit
            assertThat(result.get(1).getNetProfitLoss()).isEqualByComparingTo(new BigDecimal("-20000")); // loss
        }
    }

    // =================================================================
    // EXPENSE CATEGORIES TESTS (AC-6)
    // =================================================================

    @Nested
    @DisplayName("getExpenseCategories tests")
    class GetExpenseCategoriesTests {

        @Test
        @DisplayName("Should return expense categories with percentages")
        void shouldReturnExpenseCategoriesWithPercentages() {
            // Given
            List<Object[]> mockData = List.of(
                    new Object[]{"MAINTENANCE", new BigDecimal("50000"), 10L},
                    new Object[]{"UTILITIES", new BigDecimal("30000"), 5L},
                    new Object[]{"SALARIES", new BigDecimal("20000"), 3L}
            );
            when(repository.getExpensesByCategory(any(), any(), isNull()))
                    .thenReturn(mockData);

            // When
            List<ExpenseCategoryDto> result = service.getExpenseCategories(null);

            // Then
            assertThat(result).hasSize(3);
            assertThat(result.get(0).getCategory()).isEqualTo(ExpenseCategory.MAINTENANCE);
            assertThat(result.get(0).getCategoryName()).isEqualTo("Maintenance");
            assertThat(result.get(0).getAmount()).isEqualByComparingTo(new BigDecimal("50000"));
            assertThat(result.get(0).getPercentage()).isEqualTo(50.0); // 50000/100000 = 50%
            assertThat(result.get(0).getCount()).isEqualTo(10L);
        }

        @Test
        @DisplayName("Should handle all expense categories")
        void shouldHandleAllExpenseCategories() {
            // Given
            List<Object[]> mockData = List.of(
                    new Object[]{"MAINTENANCE", new BigDecimal("10000"), 5L},
                    new Object[]{"UTILITIES", new BigDecimal("10000"), 5L},
                    new Object[]{"SALARIES", new BigDecimal("10000"), 5L},
                    new Object[]{"SUPPLIES", new BigDecimal("10000"), 5L},
                    new Object[]{"INSURANCE", new BigDecimal("10000"), 5L},
                    new Object[]{"TAXES", new BigDecimal("10000"), 5L},
                    new Object[]{"OTHER", new BigDecimal("10000"), 5L}
            );
            when(repository.getExpensesByCategory(any(), any(), isNull()))
                    .thenReturn(mockData);

            // When
            List<ExpenseCategoryDto> result = service.getExpenseCategories(null);

            // Then
            assertThat(result).hasSize(7);
            result.forEach(dto -> assertThat(dto.getPercentage()).isCloseTo(14.28, org.assertj.core.data.Offset.offset(0.01)));
        }
    }

    // =================================================================
    // OUTSTANDING RECEIVABLES TESTS (AC-7)
    // =================================================================

    @Nested
    @DisplayName("getOutstandingReceivables tests")
    class GetOutstandingReceivablesTests {

        @Test
        @DisplayName("Should return aging breakdown correctly")
        void shouldReturnAgingBreakdownCorrectly() {
            // Given
            List<Object[]> agingData = List.of(
                    new Object[]{"CURRENT", new BigDecimal("40000"), 8L},
                    new Object[]{"THIRTY_PLUS", new BigDecimal("30000"), 5L},
                    new Object[]{"SIXTY_PLUS", new BigDecimal("20000"), 3L},
                    new Object[]{"NINETY_PLUS", new BigDecimal("10000"), 2L}
            );
            when(repository.getOutstandingReceivablesByAging(any(), isNull()))
                    .thenReturn(agingData);
            when(repository.getTotalOutstandingReceivables(any(), isNull()))
                    .thenReturn(new BigDecimal("100000"));

            // When
            OutstandingReceivablesDto result = service.getOutstandingReceivables(null);

            // Then
            assertThat(result.getTotalOutstanding()).isEqualByComparingTo(new BigDecimal("100000"));
            assertThat(result.getTotalInvoiceCount()).isEqualTo(18L);
            assertThat(result.getCurrentAmount()).isEqualByComparingTo(new BigDecimal("40000"));
            assertThat(result.getCurrentPercentage()).isEqualTo(40.0);
            assertThat(result.getThirtyPlusAmount()).isEqualByComparingTo(new BigDecimal("30000"));
            assertThat(result.getThirtyPlusPercentage()).isEqualTo(30.0);
            assertThat(result.getSixtyPlusAmount()).isEqualByComparingTo(new BigDecimal("20000"));
            assertThat(result.getSixtyPlusPercentage()).isEqualTo(20.0);
            assertThat(result.getNinetyPlusAmount()).isEqualByComparingTo(new BigDecimal("10000"));
            assertThat(result.getNinetyPlusPercentage()).isEqualTo(10.0);
        }

        @Test
        @DisplayName("Should handle empty receivables")
        void shouldHandleEmptyReceivables() {
            // Given
            when(repository.getOutstandingReceivablesByAging(any(), isNull()))
                    .thenReturn(List.of());
            when(repository.getTotalOutstandingReceivables(any(), isNull()))
                    .thenReturn(BigDecimal.ZERO);

            // When
            OutstandingReceivablesDto result = service.getOutstandingReceivables(null);

            // Then
            assertThat(result.getTotalOutstanding()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(result.getTotalInvoiceCount()).isEqualTo(0L);
            assertThat(result.getCurrentAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        }
    }

    // =================================================================
    // RECENT TRANSACTIONS TESTS (AC-8)
    // =================================================================

    @Nested
    @DisplayName("getRecentTransactions tests")
    class GetRecentTransactionsTests {

        @Test
        @DisplayName("Should return recent high-value transactions")
        void shouldReturnRecentHighValueTransactions() {
            // Given
            UUID txnId = UUID.randomUUID();
            List<Object[]> mockData = List.of(
                    new Object[]{txnId, Date.valueOf(LocalDate.now()), "INCOME", "ABC Company", new BigDecimal("50000"), "Rent Payment", "PMT-2024-0001"},
                    new Object[]{UUID.randomUUID(), Date.valueOf(LocalDate.now().minusDays(1)), "EXPENSE", "Repairs", new BigDecimal("25000"), "MAINTENANCE", "EXP-2024-0001"}
            );
            when(repository.getRecentHighValueTransactions(any(), eq(10), isNull()))
                    .thenReturn(mockData);

            // When
            List<RecentTransactionDto> result = service.getRecentTransactions(new BigDecimal("10000"), null);

            // Then
            assertThat(result).hasSize(2);
            assertThat(result.get(0).getId()).isEqualTo(txnId);
            assertThat(result.get(0).getType()).isEqualTo(RecentTransactionDto.TransactionType.INCOME);
            assertThat(result.get(0).getAmount()).isEqualByComparingTo(new BigDecimal("50000"));
            assertThat(result.get(1).getType()).isEqualTo(RecentTransactionDto.TransactionType.EXPENSE);
        }

        @Test
        @DisplayName("Should use default threshold when not provided")
        void shouldUseDefaultThresholdWhenNotProvided() {
            // Given
            when(repository.getRecentHighValueTransactions(eq(new BigDecimal("10000")), eq(10), isNull()))
                    .thenReturn(List.of());

            // When
            List<RecentTransactionDto> result = service.getRecentTransactions(null, null);

            // Then
            verify(repository).getRecentHighValueTransactions(eq(new BigDecimal("10000")), eq(10), isNull());
        }
    }

    // =================================================================
    // PDC STATUS TESTS (AC-9)
    // =================================================================

    @Nested
    @DisplayName("getPdcStatus tests")
    class GetPdcStatusTests {

        @Test
        @DisplayName("Should return PDC status summary")
        void shouldReturnPdcStatusSummary() {
            // Given
            when(repository.getPdcsDueInRange(any(), any(), isNull()))
                    .thenReturn(new Object[]{5L, new BigDecimal("50000")})
                    .thenReturn(new Object[]{10L, new BigDecimal("100000")});
            when(repository.getPdcsAwaitingClearance(isNull()))
                    .thenReturn(new Object[]{3L, new BigDecimal("30000")});

            // When
            PdcStatusSummaryDto result = service.getPdcStatus(null);

            // Then
            assertThat(result.getDueThisWeekCount()).isEqualTo(5L);
            assertThat(result.getDueThisWeekAmount()).isEqualByComparingTo(new BigDecimal("50000"));
            assertThat(result.getDueThisMonthCount()).isEqualTo(10L);
            assertThat(result.getDueThisMonthAmount()).isEqualByComparingTo(new BigDecimal("100000"));
            assertThat(result.getAwaitingClearanceCount()).isEqualTo(3L);
            assertThat(result.getAwaitingClearanceAmount()).isEqualByComparingTo(new BigDecimal("30000"));
            assertThat(result.getTotalPdcsCount()).isEqualTo(18L);
            assertThat(result.getTotalPdcsAmount()).isEqualByComparingTo(new BigDecimal("180000"));
        }

        @Test
        @DisplayName("Should handle null counts and amounts")
        void shouldHandleNullCountsAndAmounts() {
            // Given
            when(repository.getPdcsDueInRange(any(), any(), isNull()))
                    .thenReturn(new Object[]{null, null})
                    .thenReturn(new Object[]{null, null});
            when(repository.getPdcsAwaitingClearance(isNull()))
                    .thenReturn(new Object[]{null, null});

            // When
            PdcStatusSummaryDto result = service.getPdcStatus(null);

            // Then
            assertThat(result.getDueThisWeekCount()).isEqualTo(0L);
            assertThat(result.getDueThisWeekAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        }
    }

    // =================================================================
    // COMPLETE DASHBOARD TESTS (AC-10)
    // =================================================================

    @Nested
    @DisplayName("getFinanceDashboard tests")
    class GetFinanceDashboardTests {

        @Test
        @DisplayName("Should return complete dashboard data")
        void shouldReturnCompleteDashboardData() {
            // Given - mock all repository methods
            when(repository.getTotalIncomeInPeriod(any(), any(), isNull()))
                    .thenReturn(new BigDecimal("100000"));
            when(repository.getTotalExpensesInPeriod(any(), any(), isNull()))
                    .thenReturn(new BigDecimal("60000"));
            when(repository.getTotalVatInPeriod(any(), any(), isNull()))
                    .thenReturn(new BigDecimal("3000"));
            when(repository.getIncomeVsExpenseByMonth(any(), any(), isNull()))
                    .thenReturn(List.of());
            when(repository.getExpensesByCategory(any(), any(), isNull()))
                    .thenReturn(List.of());
            when(repository.getOutstandingReceivablesByAging(any(), isNull()))
                    .thenReturn(List.of());
            when(repository.getTotalOutstandingReceivables(any(), isNull()))
                    .thenReturn(BigDecimal.ZERO);
            when(repository.getRecentHighValueTransactions(any(), eq(10), isNull()))
                    .thenReturn(List.of());
            when(repository.getPdcsDueInRange(any(), any(), isNull()))
                    .thenReturn(new Object[]{0L, BigDecimal.ZERO});
            when(repository.getPdcsAwaitingClearance(isNull()))
                    .thenReturn(new Object[]{0L, BigDecimal.ZERO});

            // When
            FinanceDashboardDto result = service.getFinanceDashboard(null);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getKpis()).isNotNull();
            assertThat(result.getIncomeVsExpense()).isNotNull();
            assertThat(result.getExpenseCategories()).isNotNull();
            assertThat(result.getOutstandingReceivables()).isNotNull();
            assertThat(result.getRecentTransactions()).isNotNull();
            assertThat(result.getPdcStatus()).isNotNull();
        }

        @Test
        @DisplayName("Should filter by property ID when provided")
        void shouldFilterByPropertyIdWhenProvided() {
            // Given
            UUID propertyId = UUID.randomUUID();
            when(repository.getTotalIncomeInPeriod(any(), any(), eq(propertyId)))
                    .thenReturn(BigDecimal.ZERO);
            when(repository.getTotalExpensesInPeriod(any(), any(), eq(propertyId)))
                    .thenReturn(BigDecimal.ZERO);
            when(repository.getTotalVatInPeriod(any(), any(), eq(propertyId)))
                    .thenReturn(BigDecimal.ZERO);
            when(repository.getIncomeVsExpenseByMonth(any(), any(), eq(propertyId)))
                    .thenReturn(List.of());
            when(repository.getExpensesByCategory(any(), any(), eq(propertyId)))
                    .thenReturn(List.of());
            when(repository.getOutstandingReceivablesByAging(any(), eq(propertyId)))
                    .thenReturn(List.of());
            when(repository.getTotalOutstandingReceivables(any(), eq(propertyId)))
                    .thenReturn(BigDecimal.ZERO);
            when(repository.getRecentHighValueTransactions(any(), eq(10), eq(propertyId)))
                    .thenReturn(List.of());
            when(repository.getPdcsDueInRange(any(), any(), eq(propertyId)))
                    .thenReturn(new Object[]{0L, BigDecimal.ZERO});
            when(repository.getPdcsAwaitingClearance(eq(propertyId)))
                    .thenReturn(new Object[]{0L, BigDecimal.ZERO});

            // When
            service.getFinanceDashboard(propertyId);

            // Then - verify property ID was passed to repository
            verify(repository, atLeastOnce()).getTotalIncomeInPeriod(any(), any(), eq(propertyId));
            verify(repository, atLeastOnce()).getTotalExpensesInPeriod(any(), any(), eq(propertyId));
        }
    }
}
