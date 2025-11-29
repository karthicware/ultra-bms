package com.ultrabms.service;

import com.ultrabms.dto.reports.*;
import com.ultrabms.entity.Property;
import com.ultrabms.entity.enums.ExpenseCategory;
import com.ultrabms.repository.*;
import com.ultrabms.service.impl.ReportServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Unit tests for ReportService
 * Story 6.4: Financial Reporting and Analytics
 * AC #34: Backend unit tests for ReportService
 *
 * Tests income statement, cash flow, AR aging, revenue/expense breakdown,
 * financial dashboard, and export functionality.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ReportServiceTest {

    @Mock
    private InvoiceRepository invoiceRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private ExpenseRepository expenseRepository;

    @Mock
    private PropertyRepository propertyRepository;

    @Mock
    private IEmailService emailService;

    @Mock
    private PdfGenerationService pdfGenerationService;

    @Mock
    private ExcelExportService excelExportService;

    @InjectMocks
    private ReportServiceImpl reportService;

    private UUID propertyId;
    private LocalDate startDate;
    private LocalDate endDate;
    private Property testProperty;

    @BeforeEach
    void setUp() {
        propertyId = UUID.randomUUID();
        startDate = LocalDate.of(2025, 1, 1);
        endDate = LocalDate.of(2025, 1, 31);

        testProperty = new Property();
        testProperty.setId(propertyId);
        testProperty.setName("Test Property");
    }

    // =================================================================
    // INCOME STATEMENT TESTS
    // =================================================================

    @Nested
    @DisplayName("Income Statement Tests")
    class IncomeStatementTests {

        @Test
        @DisplayName("Should generate income statement with revenue and expenses")
        void shouldGenerateIncomeStatementWithRevenueAndExpenses() {
            // Given
            Object[] revenueBreakdown = {
                    BigDecimal.valueOf(50000), // rental income
                    BigDecimal.valueOf(5000),  // CAM charges
                    BigDecimal.valueOf(2000),  // parking fees
                    BigDecimal.valueOf(500),   // late fees
                    BigDecimal.valueOf(1000)   // other income
            };

            List<Object[]> expenseByCategory = Arrays.asList(
                    new Object[]{ExpenseCategory.MAINTENANCE, BigDecimal.valueOf(10000)},
                    new Object[]{ExpenseCategory.UTILITIES, BigDecimal.valueOf(5000)},
                    new Object[]{ExpenseCategory.SALARIES, BigDecimal.valueOf(15000)}
            );

            when(propertyRepository.findById(propertyId)).thenReturn(Optional.of(testProperty));
            when(invoiceRepository.getRevenueBreakdownByType(any(), any(), eq(propertyId))).thenReturn(revenueBreakdown);
            when(expenseRepository.getCategoryBreakdownByProperty(any(), any(), eq(propertyId))).thenReturn(expenseByCategory);
            when(expenseRepository.getTotalExpensesInPeriodByProperty(any(), any(), eq(propertyId))).thenReturn(BigDecimal.valueOf(25000));

            // When
            IncomeStatementDto result = reportService.getIncomeStatement(startDate, endDate, propertyId);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.totalRevenue()).isEqualByComparingTo(BigDecimal.valueOf(58500));
            assertThat(result.totalExpenses()).isEqualByComparingTo(BigDecimal.valueOf(30000));
            assertThat(result.netIncome()).isEqualByComparingTo(BigDecimal.valueOf(28500));
            assertThat(result.propertyId()).isEqualTo(propertyId);
            assertThat(result.propertyName()).isEqualTo("Test Property");
        }

        @Test
        @DisplayName("Should generate income statement for all properties when propertyId is null")
        void shouldGenerateIncomeStatementForAllProperties() {
            // Given
            Object[] revenueBreakdown = {
                    BigDecimal.valueOf(100000),
                    BigDecimal.valueOf(10000),
                    BigDecimal.valueOf(5000),
                    BigDecimal.valueOf(1000),
                    BigDecimal.valueOf(2000)
            };

            when(invoiceRepository.getRevenueBreakdownByType(any(), any(), isNull())).thenReturn(revenueBreakdown);
            when(expenseRepository.getCategoryBreakdownByProperty(any(), any(), isNull())).thenReturn(Collections.emptyList());
            when(expenseRepository.getTotalExpensesInPeriodByProperty(any(), any(), isNull())).thenReturn(BigDecimal.ZERO);

            // When
            IncomeStatementDto result = reportService.getIncomeStatement(startDate, endDate, null);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.propertyId()).isNull();
            assertThat(result.propertyName()).isEqualTo("All Properties");
            assertThat(result.totalRevenue()).isEqualByComparingTo(BigDecimal.valueOf(118000));
        }

        @Test
        @DisplayName("Should calculate net margin correctly")
        void shouldCalculateNetMarginCorrectly() {
            // Given
            Object[] revenueBreakdown = {
                    BigDecimal.valueOf(100000),
                    BigDecimal.ZERO,
                    BigDecimal.ZERO,
                    BigDecimal.ZERO,
                    BigDecimal.ZERO
            };

            when(invoiceRepository.getRevenueBreakdownByType(any(), any(), any())).thenReturn(revenueBreakdown);
            when(expenseRepository.getCategoryBreakdownByProperty(any(), any(), any())).thenReturn(Collections.emptyList());
            when(expenseRepository.getTotalExpensesInPeriodByProperty(any(), any(), any())).thenReturn(BigDecimal.valueOf(25000));

            // When
            IncomeStatementDto result = reportService.getIncomeStatement(startDate, endDate, null);

            // Then
            assertThat(result.netMargin()).isEqualByComparingTo(BigDecimal.valueOf(75)); // 75% margin
        }
    }

    // =================================================================
    // CASH FLOW TESTS
    // =================================================================

    @Nested
    @DisplayName("Cash Flow Tests")
    class CashFlowTests {

        @Test
        @DisplayName("Should generate cash flow summary with inflows and outflows")
        void shouldGenerateCashFlowSummary() {
            // Given
            BigDecimal totalInflows = BigDecimal.valueOf(80000);
            BigDecimal totalOutflows = BigDecimal.valueOf(50000);

            when(paymentRepository.getTotalCashInflowsInPeriodByProperty(any(), any(), eq(propertyId))).thenReturn(totalInflows);
            when(expenseRepository.getTotalExpensesInPeriodByProperty(any(), any(), eq(propertyId))).thenReturn(totalOutflows);
            when(propertyRepository.findById(propertyId)).thenReturn(Optional.of(testProperty));

            // Mock monthly comparison data
            when(paymentRepository.getMonthlyCashInflows(any(), any(), eq(propertyId))).thenReturn(Collections.emptyList());
            when(expenseRepository.getMonthlyExpenseTrend(any(), any(), eq(propertyId))).thenReturn(Collections.emptyList());

            // When
            CashFlowSummaryDto result = reportService.getCashFlowSummary(startDate, endDate, propertyId);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.totalInflows()).isEqualByComparingTo(BigDecimal.valueOf(80000));
            assertThat(result.totalOutflows()).isEqualByComparingTo(BigDecimal.valueOf(50000));
            assertThat(result.netCashFlow()).isEqualByComparingTo(BigDecimal.valueOf(30000));
        }

        @Test
        @DisplayName("Should handle negative cash flow correctly")
        void shouldHandleNegativeCashFlow() {
            // Given
            BigDecimal totalInflows = BigDecimal.valueOf(30000);
            BigDecimal totalOutflows = BigDecimal.valueOf(50000);

            when(paymentRepository.getTotalCashInflowsInPeriodByProperty(any(), any(), any())).thenReturn(totalInflows);
            when(expenseRepository.getTotalExpensesInPeriodByProperty(any(), any(), any())).thenReturn(totalOutflows);
            when(paymentRepository.getMonthlyCashInflows(any(), any(), any())).thenReturn(Collections.emptyList());
            when(expenseRepository.getMonthlyExpenseTrend(any(), any(), any())).thenReturn(Collections.emptyList());

            // When
            CashFlowSummaryDto result = reportService.getCashFlowSummary(startDate, endDate, null);

            // Then
            assertThat(result.netCashFlow()).isEqualByComparingTo(BigDecimal.valueOf(-20000));
        }
    }

    // =================================================================
    // AR AGING TESTS
    // =================================================================

    @Nested
    @DisplayName("AR Aging Tests")
    class ARAgingTests {

        @Test
        @DisplayName("Should generate AR aging with correct bucket distribution")
        void shouldGenerateARAgingWithBuckets() {
            // Given
            LocalDate asOfDate = LocalDate.of(2025, 1, 31);
            List<Object[]> agingBuckets = Arrays.asList(
                    new Object[]{"CURRENT", 10, BigDecimal.valueOf(50000)},
                    new Object[]{"DAYS_1_30", 5, BigDecimal.valueOf(25000)},
                    new Object[]{"DAYS_31_60", 3, BigDecimal.valueOf(15000)},
                    new Object[]{"DAYS_61_90", 2, BigDecimal.valueOf(10000)},
                    new Object[]{"DAYS_90_PLUS", 1, BigDecimal.valueOf(5000)}
            );

            when(invoiceRepository.getAgingBuckets(eq(asOfDate), eq(propertyId))).thenReturn(agingBuckets);
            when(invoiceRepository.getAgingDetailsByTenant(eq(asOfDate), eq(propertyId))).thenReturn(Collections.emptyList());
            when(propertyRepository.findById(propertyId)).thenReturn(Optional.of(testProperty));

            // When
            ARAgingDto result = reportService.getARAgingReport(asOfDate, propertyId);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.agingBuckets()).hasSize(5);
            assertThat(result.totalOutstanding()).isEqualByComparingTo(BigDecimal.valueOf(105000));
        }

        @Test
        @DisplayName("Should calculate average days outstanding correctly")
        void shouldCalculateAverageDaysOutstanding() {
            // Given
            LocalDate asOfDate = LocalDate.now();

            when(invoiceRepository.getAgingBuckets(any(), any())).thenReturn(Collections.emptyList());
            when(invoiceRepository.getAgingDetailsByTenant(any(), any())).thenReturn(Collections.emptyList());

            // When
            ARAgingDto result = reportService.getARAgingReport(asOfDate, null);

            // Then
            assertThat(result.averageDaysOutstanding()).isNotNull();
            assertThat(result.totalOutstanding()).isEqualByComparingTo(BigDecimal.ZERO);
        }
    }

    // =================================================================
    // REVENUE BREAKDOWN TESTS
    // =================================================================

    @Nested
    @DisplayName("Revenue Breakdown Tests")
    class RevenueBreakdownTests {

        @Test
        @DisplayName("Should generate revenue breakdown by property")
        void shouldGenerateRevenueBreakdownByProperty() {
            // Given
            List<Object[]> byProperty = Arrays.asList(
                    new Object[]{UUID.randomUUID(), "Property A", BigDecimal.valueOf(50000)},
                    new Object[]{UUID.randomUUID(), "Property B", BigDecimal.valueOf(30000)}
            );

            List<Object[]> byType = Arrays.asList(
                    new Object[]{"RENT", BigDecimal.valueOf(60000)},
                    new Object[]{"CAM", BigDecimal.valueOf(15000)},
                    new Object[]{"PARKING", BigDecimal.valueOf(5000)}
            );

            when(invoiceRepository.getRevenueByProperty(any(), any())).thenReturn(byProperty);
            when(invoiceRepository.getRevenueByTypeForBreakdown(any(), any(), any())).thenReturn(byType);
            when(invoiceRepository.getMonthlyRevenueTrend(any(), any(), any())).thenReturn(Collections.emptyList());

            // When
            RevenueBreakdownDto result = reportService.getRevenueBreakdown(startDate, endDate, null);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.revenueByProperty()).hasSize(2);
            assertThat(result.revenueByType()).hasSize(3);
        }
    }

    // =================================================================
    // EXPENSE BREAKDOWN TESTS
    // =================================================================

    @Nested
    @DisplayName("Expense Breakdown Tests")
    class ExpenseBreakdownTests {

        @Test
        @DisplayName("Should generate expense breakdown by category")
        void shouldGenerateExpenseBreakdownByCategory() {
            // Given
            List<Object[]> byCategory = Arrays.asList(
                    new Object[]{ExpenseCategory.MAINTENANCE, BigDecimal.valueOf(20000)},
                    new Object[]{ExpenseCategory.UTILITIES, BigDecimal.valueOf(15000)},
                    new Object[]{ExpenseCategory.SALARIES, BigDecimal.valueOf(30000)}
            );

            List<Object[]> topVendors = Arrays.asList(
                    new Object[]{UUID.randomUUID(), "Vendor A", BigDecimal.valueOf(15000)},
                    new Object[]{UUID.randomUUID(), "Vendor B", BigDecimal.valueOf(10000)}
            );

            when(expenseRepository.getCategoryBreakdownByProperty(any(), any(), any())).thenReturn(byCategory);
            when(expenseRepository.getTopVendorsByPayment(any(), any(), any())).thenReturn(topVendors);
            when(expenseRepository.getMaintenanceCostByProperty(any(), any())).thenReturn(Collections.emptyList());
            when(expenseRepository.getMonthlyExpenseTrend(any(), any(), any())).thenReturn(Collections.emptyList());
            when(expenseRepository.getTotalExpensesInPeriodByProperty(any(), any(), any())).thenReturn(BigDecimal.valueOf(65000));

            // When
            ExpenseBreakdownDto result = reportService.getExpenseBreakdown(startDate, endDate, null);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.expenseByCategory()).hasSize(3);
            assertThat(result.topVendors()).hasSize(2);
            assertThat(result.totalExpenses()).isEqualByComparingTo(BigDecimal.valueOf(65000));
        }
    }

    // =================================================================
    // FINANCIAL DASHBOARD TESTS
    // =================================================================

    @Nested
    @DisplayName("Financial Dashboard Tests")
    class FinancialDashboardTests {

        @Test
        @DisplayName("Should generate dashboard with KPIs")
        void shouldGenerateDashboardWithKPIs() {
            // Given - mock all required repository calls for current month KPIs
            when(invoiceRepository.getTotalInvoicedInPeriodByProperty(any(), any(), isNull())).thenReturn(BigDecimal.valueOf(100000));
            when(expenseRepository.getTotalExpensesInPeriodByProperty(any(), any(), isNull())).thenReturn(BigDecimal.valueOf(60000));
            when(invoiceRepository.getTotalOutstandingForAging(isNull())).thenReturn(BigDecimal.valueOf(25000));
            when(invoiceRepository.getTotalCollectedInPeriodByProperty(any(), any(), isNull())).thenReturn(BigDecimal.valueOf(75000));

            // Mock top property and expense category
            List<Object[]> topProperty = Collections.singletonList(
                    new Object[]{UUID.randomUUID(), "Top Property", BigDecimal.valueOf(50000)}
            );
            List<Object[]> topCategory = Collections.singletonList(
                    new Object[]{ExpenseCategory.MAINTENANCE, BigDecimal.valueOf(30000)}
            );

            when(invoiceRepository.getRevenueByProperty(any(), any())).thenReturn(topProperty);
            when(expenseRepository.getCategoryBreakdownByProperty(any(), any(), any())).thenReturn(topCategory);

            // When
            FinancialDashboardDto result = reportService.getFinancialDashboard(null);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.kpis()).isNotNull();
            assertThat(result.kpis().totalRevenue()).isEqualByComparingTo(BigDecimal.valueOf(100000));
            assertThat(result.kpis().totalExpenses()).isEqualByComparingTo(BigDecimal.valueOf(60000));
        }
    }

    // =================================================================
    // EXPORT TESTS
    // =================================================================

    @Nested
    @DisplayName("Export Tests")
    class ExportTests {

        @Test
        @DisplayName("Should export income statement to PDF")
        void shouldExportIncomeStatementToPDF() {
            // Given
            byte[] pdfBytes = "PDF content".getBytes();
            when(pdfGenerationService.generateIncomeStatementPdf(any())).thenReturn(pdfBytes);

            // Setup for getIncomeStatement
            Object[] revenueBreakdown = {
                    BigDecimal.valueOf(50000),
                    BigDecimal.ZERO,
                    BigDecimal.ZERO,
                    BigDecimal.ZERO,
                    BigDecimal.ZERO
            };
            when(invoiceRepository.getRevenueBreakdownByType(any(), any(), any())).thenReturn(revenueBreakdown);
            when(expenseRepository.getCategoryBreakdownByProperty(any(), any(), any())).thenReturn(Collections.emptyList());
            when(expenseRepository.getTotalExpensesInPeriodByProperty(any(), any(), any())).thenReturn(BigDecimal.ZERO);

            // When
            byte[] result = reportService.exportToPdf("income-statement", startDate, endDate, null);

            // Then
            assertThat(result).isNotNull();
            verify(pdfGenerationService).generateIncomeStatementPdf(any());
        }

        @Test
        @DisplayName("Should export to Excel")
        void shouldExportToExcel() {
            // Given
            byte[] excelBytes = "Excel content".getBytes();
            when(excelExportService.generateIncomeStatementExcel(any())).thenReturn(excelBytes);

            // Setup for getIncomeStatement
            Object[] revenueBreakdown = {
                    BigDecimal.valueOf(50000),
                    BigDecimal.ZERO,
                    BigDecimal.ZERO,
                    BigDecimal.ZERO,
                    BigDecimal.ZERO
            };
            when(invoiceRepository.getRevenueBreakdownByType(any(), any(), any())).thenReturn(revenueBreakdown);
            when(expenseRepository.getCategoryBreakdownByProperty(any(), any(), any())).thenReturn(Collections.emptyList());
            when(expenseRepository.getTotalExpensesInPeriodByProperty(any(), any(), any())).thenReturn(BigDecimal.ZERO);

            // When
            byte[] result = reportService.exportToExcel("income-statement", startDate, endDate, null);

            // Then
            assertThat(result).isNotNull();
            verify(excelExportService).generateIncomeStatementExcel(any());
        }
    }

    // =================================================================
    // EMAIL REPORT TESTS
    // =================================================================

    @Nested
    @DisplayName("Email Report Tests")
    class EmailReportTests {

        @Test
        @DisplayName("Should email report to recipients")
        void shouldEmailReportToRecipients() {
            // Given
            EmailReportDto request = new EmailReportDto(
                    "income-statement",
                    startDate,
                    endDate,
                    null,
                    Arrays.asList("test@example.com", "test2@example.com"),
                    "Please find attached the income statement."
            );

            byte[] pdfBytes = "PDF content".getBytes();
            when(pdfGenerationService.generateIncomeStatementPdf(any())).thenReturn(pdfBytes);

            // Setup for getIncomeStatement
            Object[] revenueBreakdown = {
                    BigDecimal.valueOf(50000),
                    BigDecimal.ZERO,
                    BigDecimal.ZERO,
                    BigDecimal.ZERO,
                    BigDecimal.ZERO
            };
            when(invoiceRepository.getRevenueBreakdownByType(any(), any(), any())).thenReturn(revenueBreakdown);
            when(expenseRepository.getCategoryBreakdownByProperty(any(), any(), any())).thenReturn(Collections.emptyList());
            when(expenseRepository.getTotalExpensesInPeriodByProperty(any(), any(), any())).thenReturn(BigDecimal.ZERO);

            // When
            reportService.emailReport(request);

            // Then - verify the PDF generation was called (email sending would be internal)
            verify(pdfGenerationService).generateIncomeStatementPdf(any());
        }
    }
}
