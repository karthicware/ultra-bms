package com.ultrabms.service.impl;

import com.ultrabms.dto.reports.*;
import com.ultrabms.service.ExcelExportService;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;

/**
 * Implementation of ExcelExportService for generating Excel reports.
 *
 * Story 6.4: Financial Reporting and Analytics
 * AC #17: Excel export for reports
 */
@Service
@Slf4j
public class ExcelExportServiceImpl implements ExcelExportService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd MMM yyyy");
    private static final DateTimeFormatter DATETIME_FORMATTER = DateTimeFormatter.ofPattern("dd MMM yyyy HH:mm");

    @Override
    public byte[] generateIncomeStatementExcel(IncomeStatementDto incomeStatement) {
        log.info("Generating Income Statement Excel for period {} to {}", incomeStatement.startDate(), incomeStatement.endDate());

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Income Statement");

            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle currencyStyle = createCurrencyStyle(workbook);
            CellStyle percentStyle = createPercentStyle(workbook);
            CellStyle titleStyle = createTitleStyle(workbook);

            int rowNum = 0;

            // Title
            rowNum = addTitle(sheet, rowNum, "Income Statement (P&L)", titleStyle);
            rowNum = addSubtitle(sheet, rowNum, incomeStatement.propertyName());
            rowNum = addSubtitle(sheet, rowNum, incomeStatement.startDate().format(DATE_FORMATTER) + " - " + incomeStatement.endDate().format(DATE_FORMATTER));
            rowNum++;

            // Revenue Section
            rowNum = addSectionHeader(sheet, rowNum, "Revenue", headerStyle);
            String[] revenueHeaders = {"Category", "Amount", "% of Total"};
            rowNum = addTableHeader(sheet, rowNum, revenueHeaders, headerStyle);

            for (var revenue : incomeStatement.revenueBreakdown()) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(revenue.category());
                Cell amountCell = row.createCell(1);
                amountCell.setCellValue(revenue.amount().doubleValue());
                amountCell.setCellStyle(currencyStyle);
                Cell percentCell = row.createCell(2);
                percentCell.setCellValue(revenue.percentage().doubleValue() / 100);
                percentCell.setCellStyle(percentStyle);
            }

            // Revenue Total
            Row revTotalRow = sheet.createRow(rowNum++);
            revTotalRow.createCell(0).setCellValue("Total Revenue");
            Cell revTotalCell = revTotalRow.createCell(1);
            revTotalCell.setCellValue(incomeStatement.totalRevenue().doubleValue());
            revTotalCell.setCellStyle(currencyStyle);
            rowNum++;

            // Expense Section
            rowNum = addSectionHeader(sheet, rowNum, "Expenses", headerStyle);
            String[] expenseHeaders = {"Category", "Amount", "% of Total"};
            rowNum = addTableHeader(sheet, rowNum, expenseHeaders, headerStyle);

            for (var expense : incomeStatement.expenseBreakdown()) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(expense.categoryLabel());
                Cell amountCell = row.createCell(1);
                amountCell.setCellValue(expense.amount().doubleValue());
                amountCell.setCellStyle(currencyStyle);
                Cell percentCell = row.createCell(2);
                percentCell.setCellValue(expense.percentage().doubleValue() / 100);
                percentCell.setCellStyle(percentStyle);
            }

            // Expense Total
            Row expTotalRow = sheet.createRow(rowNum++);
            expTotalRow.createCell(0).setCellValue("Total Expenses");
            Cell expTotalCell = expTotalRow.createCell(1);
            expTotalCell.setCellValue(incomeStatement.totalExpenses().doubleValue());
            expTotalCell.setCellStyle(currencyStyle);
            rowNum++;

            // Summary Section
            rowNum = addSectionHeader(sheet, rowNum, "Summary", headerStyle);
            Row netIncomeRow = sheet.createRow(rowNum++);
            netIncomeRow.createCell(0).setCellValue("Net Income");
            Cell netIncomeCell = netIncomeRow.createCell(1);
            netIncomeCell.setCellValue(incomeStatement.netIncome().doubleValue());
            netIncomeCell.setCellStyle(currencyStyle);

            Row marginRow = sheet.createRow(rowNum++);
            marginRow.createCell(0).setCellValue("Net Margin");
            Cell marginCell = marginRow.createCell(1);
            marginCell.setCellValue(incomeStatement.netMargin().doubleValue() / 100);
            marginCell.setCellStyle(percentStyle);

            // Auto-size columns
            for (int i = 0; i < 3; i++) {
                sheet.autoSizeColumn(i);
            }

            // Footer
            rowNum += 2;
            Row footerRow = sheet.createRow(rowNum);
            footerRow.createCell(0).setCellValue("Generated: " + incomeStatement.generatedAt().format(DATETIME_FORMATTER));

            workbook.write(baos);
            log.info("Successfully generated Income Statement Excel");
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Error generating Income Statement Excel", e);
            throw new RuntimeException("Failed to generate Income Statement Excel", e);
        }
    }

    @Override
    public byte[] generateCashFlowExcel(CashFlowSummaryDto cashFlow) {
        log.info("Generating Cash Flow Excel for period {} to {}", cashFlow.startDate(), cashFlow.endDate());

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Cash Flow");

            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle currencyStyle = createCurrencyStyle(workbook);
            CellStyle titleStyle = createTitleStyle(workbook);

            int rowNum = 0;

            // Title
            rowNum = addTitle(sheet, rowNum, "Cash Flow Summary", titleStyle);
            rowNum = addSubtitle(sheet, rowNum, cashFlow.propertyName());
            rowNum = addSubtitle(sheet, rowNum, cashFlow.startDate().format(DATE_FORMATTER) + " - " + cashFlow.endDate().format(DATE_FORMATTER));
            rowNum++;

            // Summary Section
            rowNum = addSectionHeader(sheet, rowNum, "Cash Flow Overview", headerStyle);

            Row inflowRow = sheet.createRow(rowNum++);
            inflowRow.createCell(0).setCellValue("Total Cash Inflows");
            Cell inflowCell = inflowRow.createCell(1);
            inflowCell.setCellValue(cashFlow.totalInflows().doubleValue());
            inflowCell.setCellStyle(currencyStyle);

            Row outflowRow = sheet.createRow(rowNum++);
            outflowRow.createCell(0).setCellValue("Total Cash Outflows");
            Cell outflowCell = outflowRow.createCell(1);
            outflowCell.setCellValue(cashFlow.totalOutflows().doubleValue());
            outflowCell.setCellStyle(currencyStyle);

            Row netRow = sheet.createRow(rowNum++);
            netRow.createCell(0).setCellValue("Net Cash Flow");
            Cell netCell = netRow.createCell(1);
            netCell.setCellValue(cashFlow.netCashFlow().doubleValue());
            netCell.setCellStyle(currencyStyle);
            rowNum++;

            // Monthly Breakdown
            if (cashFlow.monthlyCashFlows() != null && !cashFlow.monthlyCashFlows().isEmpty()) {
                rowNum = addSectionHeader(sheet, rowNum, "Monthly Breakdown", headerStyle);
                String[] headers = {"Month", "Inflows", "Outflows", "Net"};
                rowNum = addTableHeader(sheet, rowNum, headers, headerStyle);

                for (var monthly : cashFlow.monthlyCashFlows()) {
                    Row row = sheet.createRow(rowNum++);
                    row.createCell(0).setCellValue(monthly.month());
                    Cell inCell = row.createCell(1);
                    inCell.setCellValue(monthly.inflows().doubleValue());
                    inCell.setCellStyle(currencyStyle);
                    Cell outCell = row.createCell(2);
                    outCell.setCellValue(monthly.outflows().doubleValue());
                    outCell.setCellStyle(currencyStyle);
                    Cell netMonthCell = row.createCell(3);
                    netMonthCell.setCellValue(monthly.net().doubleValue());
                    netMonthCell.setCellStyle(currencyStyle);
                }
            }

            // Auto-size columns
            for (int i = 0; i < 4; i++) {
                sheet.autoSizeColumn(i);
            }

            // Footer
            rowNum += 2;
            Row footerRow = sheet.createRow(rowNum);
            footerRow.createCell(0).setCellValue("Generated: " + cashFlow.generatedAt().format(DATETIME_FORMATTER));

            workbook.write(baos);
            log.info("Successfully generated Cash Flow Excel");
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Error generating Cash Flow Excel", e);
            throw new RuntimeException("Failed to generate Cash Flow Excel", e);
        }
    }

    @Override
    public byte[] generateARAgingExcel(ARAgingDto arAging) {
        log.info("Generating AR Aging Excel as of {}", arAging.asOfDate());

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("AR Aging");

            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle currencyStyle = createCurrencyStyle(workbook);
            CellStyle percentStyle = createPercentStyle(workbook);
            CellStyle titleStyle = createTitleStyle(workbook);

            int rowNum = 0;

            // Title
            rowNum = addTitle(sheet, rowNum, "Accounts Receivable Aging Report", titleStyle);
            rowNum = addSubtitle(sheet, rowNum, arAging.propertyName());
            rowNum = addSubtitle(sheet, rowNum, "As of " + arAging.asOfDate().format(DATE_FORMATTER));
            rowNum++;

            // Summary Section
            rowNum = addSectionHeader(sheet, rowNum, "Summary", headerStyle);

            Row totalRow = sheet.createRow(rowNum++);
            totalRow.createCell(0).setCellValue("Total Outstanding");
            Cell totalCell = totalRow.createCell(1);
            totalCell.setCellValue(arAging.totalOutstanding().doubleValue());
            totalCell.setCellStyle(currencyStyle);

            Row countRow = sheet.createRow(rowNum++);
            countRow.createCell(0).setCellValue("Total Invoices");
            countRow.createCell(1).setCellValue(arAging.totalInvoiceCount());

            Row avgRow = sheet.createRow(rowNum++);
            avgRow.createCell(0).setCellValue("Average Days Outstanding");
            avgRow.createCell(1).setCellValue(arAging.averageDaysOutstanding().doubleValue() + " days");
            rowNum++;

            // Aging Buckets
            rowNum = addSectionHeader(sheet, rowNum, "Aging Buckets", headerStyle);
            String[] bucketHeaders = {"Bucket", "Amount", "Count", "% of Total"};
            rowNum = addTableHeader(sheet, rowNum, bucketHeaders, headerStyle);

            for (var bucket : arAging.agingBuckets()) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(bucket.getBucketLabel());
                Cell amountCell = row.createCell(1);
                amountCell.setCellValue(bucket.amount().doubleValue());
                amountCell.setCellStyle(currencyStyle);
                row.createCell(2).setCellValue(bucket.count());
                Cell percentCell = row.createCell(3);
                percentCell.setCellValue(bucket.percentage().doubleValue() / 100);
                percentCell.setCellStyle(percentStyle);
            }
            rowNum++;

            // Tenant Details
            if (arAging.tenantDetails() != null && !arAging.tenantDetails().isEmpty()) {
                rowNum = addSectionHeader(sheet, rowNum, "Tenant Details", headerStyle);
                String[] tenantHeaders = {"Tenant", "Total", "Current", "1-30", "31-60", "61-90", "90+", "Count"};
                rowNum = addTableHeader(sheet, rowNum, tenantHeaders, headerStyle);

                for (var tenant : arAging.tenantDetails()) {
                    Row row = sheet.createRow(rowNum++);
                    row.createCell(0).setCellValue(tenant.tenantName());
                    setCurrencyCell(row.createCell(1), tenant.totalOutstanding(), currencyStyle);
                    setCurrencyCell(row.createCell(2), tenant.currentAmount(), currencyStyle);
                    setCurrencyCell(row.createCell(3), tenant.days1to30(), currencyStyle);
                    setCurrencyCell(row.createCell(4), tenant.days31to60(), currencyStyle);
                    setCurrencyCell(row.createCell(5), tenant.days61to90(), currencyStyle);
                    setCurrencyCell(row.createCell(6), tenant.over90Days(), currencyStyle);
                    row.createCell(7).setCellValue(tenant.invoiceCount());
                }
            }

            // Auto-size columns
            for (int i = 0; i < 8; i++) {
                sheet.autoSizeColumn(i);
            }

            // Footer
            rowNum += 2;
            Row footerRow = sheet.createRow(rowNum);
            footerRow.createCell(0).setCellValue("Generated: " + arAging.generatedAt().format(DATETIME_FORMATTER));

            workbook.write(baos);
            log.info("Successfully generated AR Aging Excel");
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Error generating AR Aging Excel", e);
            throw new RuntimeException("Failed to generate AR Aging Excel", e);
        }
    }

    @Override
    public byte[] generateRevenueBreakdownExcel(RevenueBreakdownDto revenueBreakdown) {
        log.info("Generating Revenue Breakdown Excel for period {} to {}", revenueBreakdown.startDate(), revenueBreakdown.endDate());

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Revenue Breakdown");

            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle currencyStyle = createCurrencyStyle(workbook);
            CellStyle percentStyle = createPercentStyle(workbook);
            CellStyle titleStyle = createTitleStyle(workbook);

            int rowNum = 0;

            // Title
            rowNum = addTitle(sheet, rowNum, "Revenue Breakdown Report", titleStyle);
            rowNum = addSubtitle(sheet, rowNum, revenueBreakdown.propertyName());
            rowNum = addSubtitle(sheet, rowNum, revenueBreakdown.startDate().format(DATE_FORMATTER) + " - " + revenueBreakdown.endDate().format(DATE_FORMATTER));
            rowNum++;

            // Total Revenue
            Row totalRow = sheet.createRow(rowNum++);
            totalRow.createCell(0).setCellValue("Total Revenue");
            Cell totalCell = totalRow.createCell(1);
            totalCell.setCellValue(revenueBreakdown.totalRevenue().doubleValue());
            totalCell.setCellStyle(currencyStyle);
            rowNum++;

            // Revenue by Property
            if (revenueBreakdown.revenueByProperty() != null && !revenueBreakdown.revenueByProperty().isEmpty()) {
                rowNum = addSectionHeader(sheet, rowNum, "Revenue by Property", headerStyle);
                String[] headers = {"Property", "Amount", "% of Total"};
                rowNum = addTableHeader(sheet, rowNum, headers, headerStyle);

                for (var property : revenueBreakdown.revenueByProperty()) {
                    Row row = sheet.createRow(rowNum++);
                    row.createCell(0).setCellValue(property.propertyName());
                    Cell amountCell = row.createCell(1);
                    amountCell.setCellValue(property.amount().doubleValue());
                    amountCell.setCellStyle(currencyStyle);
                    Cell percentCell = row.createCell(2);
                    percentCell.setCellValue(property.percentage().doubleValue() / 100);
                    percentCell.setCellStyle(percentStyle);
                }
                rowNum++;
            }

            // Revenue by Type
            if (revenueBreakdown.revenueByType() != null && !revenueBreakdown.revenueByType().isEmpty()) {
                rowNum = addSectionHeader(sheet, rowNum, "Revenue by Type", headerStyle);
                String[] headers = {"Revenue Type", "Amount", "% of Total"};
                rowNum = addTableHeader(sheet, rowNum, headers, headerStyle);

                for (var type : revenueBreakdown.revenueByType()) {
                    Row row = sheet.createRow(rowNum++);
                    row.createCell(0).setCellValue(type.typeLabel());
                    Cell amountCell = row.createCell(1);
                    amountCell.setCellValue(type.amount().doubleValue());
                    amountCell.setCellStyle(currencyStyle);
                    Cell percentCell = row.createCell(2);
                    percentCell.setCellValue(type.percentage().doubleValue() / 100);
                    percentCell.setCellStyle(percentStyle);
                }
                rowNum++;
            }

            // Monthly Trend
            if (revenueBreakdown.monthlyTrend() != null && !revenueBreakdown.monthlyTrend().isEmpty()) {
                rowNum = addSectionHeader(sheet, rowNum, "Monthly Trend", headerStyle);
                String[] headers = {"Month", "Revenue"};
                rowNum = addTableHeader(sheet, rowNum, headers, headerStyle);

                for (var trend : revenueBreakdown.monthlyTrend()) {
                    Row row = sheet.createRow(rowNum++);
                    row.createCell(0).setCellValue(trend.month());
                    Cell amountCell = row.createCell(1);
                    amountCell.setCellValue(trend.amount().doubleValue());
                    amountCell.setCellStyle(currencyStyle);
                }
            }

            // Auto-size columns
            for (int i = 0; i < 3; i++) {
                sheet.autoSizeColumn(i);
            }

            // Footer
            rowNum += 2;
            Row footerRow = sheet.createRow(rowNum);
            footerRow.createCell(0).setCellValue("Generated: " + revenueBreakdown.generatedAt().format(DATETIME_FORMATTER));

            workbook.write(baos);
            log.info("Successfully generated Revenue Breakdown Excel");
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Error generating Revenue Breakdown Excel", e);
            throw new RuntimeException("Failed to generate Revenue Breakdown Excel", e);
        }
    }

    @Override
    public byte[] generateExpenseBreakdownExcel(ExpenseBreakdownDto expenseBreakdown) {
        log.info("Generating Expense Breakdown Excel for period {} to {}", expenseBreakdown.startDate(), expenseBreakdown.endDate());

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Expense Breakdown");

            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle currencyStyle = createCurrencyStyle(workbook);
            CellStyle percentStyle = createPercentStyle(workbook);
            CellStyle titleStyle = createTitleStyle(workbook);

            int rowNum = 0;

            // Title
            rowNum = addTitle(sheet, rowNum, "Expense Breakdown Report", titleStyle);
            rowNum = addSubtitle(sheet, rowNum, expenseBreakdown.propertyName());
            rowNum = addSubtitle(sheet, rowNum, expenseBreakdown.startDate().format(DATE_FORMATTER) + " - " + expenseBreakdown.endDate().format(DATE_FORMATTER));
            rowNum++;

            // Total Expenses
            Row totalRow = sheet.createRow(rowNum++);
            totalRow.createCell(0).setCellValue("Total Expenses");
            Cell totalCell = totalRow.createCell(1);
            totalCell.setCellValue(expenseBreakdown.totalExpenses().doubleValue());
            totalCell.setCellStyle(currencyStyle);
            rowNum++;

            // Expense by Category
            if (expenseBreakdown.expenseByCategory() != null && !expenseBreakdown.expenseByCategory().isEmpty()) {
                rowNum = addSectionHeader(sheet, rowNum, "Expenses by Category", headerStyle);
                String[] headers = {"Category", "Amount", "% of Total"};
                rowNum = addTableHeader(sheet, rowNum, headers, headerStyle);

                for (var category : expenseBreakdown.expenseByCategory()) {
                    Row row = sheet.createRow(rowNum++);
                    row.createCell(0).setCellValue(category.categoryLabel());
                    Cell amountCell = row.createCell(1);
                    amountCell.setCellValue(category.amount().doubleValue());
                    amountCell.setCellStyle(currencyStyle);
                    Cell percentCell = row.createCell(2);
                    percentCell.setCellValue(category.percentage().doubleValue() / 100);
                    percentCell.setCellStyle(percentStyle);
                }
                rowNum++;
            }

            // Top Vendors
            if (expenseBreakdown.topVendors() != null && !expenseBreakdown.topVendors().isEmpty()) {
                rowNum = addSectionHeader(sheet, rowNum, "Top Vendors", headerStyle);
                String[] headers = {"Vendor", "Amount", "% of Total"};
                rowNum = addTableHeader(sheet, rowNum, headers, headerStyle);

                for (var vendor : expenseBreakdown.topVendors()) {
                    Row row = sheet.createRow(rowNum++);
                    row.createCell(0).setCellValue(vendor.vendorName());
                    Cell amountCell = row.createCell(1);
                    amountCell.setCellValue(vendor.amount().doubleValue());
                    amountCell.setCellStyle(currencyStyle);
                    Cell percentCell = row.createCell(2);
                    percentCell.setCellValue(vendor.percentage().doubleValue() / 100);
                    percentCell.setCellStyle(percentStyle);
                }
                rowNum++;
            }

            // Monthly Trend
            if (expenseBreakdown.monthlyTrend() != null && !expenseBreakdown.monthlyTrend().isEmpty()) {
                rowNum = addSectionHeader(sheet, rowNum, "Monthly Trend", headerStyle);
                String[] headers = {"Month", "Expenses"};
                rowNum = addTableHeader(sheet, rowNum, headers, headerStyle);

                for (var trend : expenseBreakdown.monthlyTrend()) {
                    Row row = sheet.createRow(rowNum++);
                    row.createCell(0).setCellValue(trend.month());
                    Cell amountCell = row.createCell(1);
                    amountCell.setCellValue(trend.amount().doubleValue());
                    amountCell.setCellStyle(currencyStyle);
                }
            }

            // Auto-size columns
            for (int i = 0; i < 3; i++) {
                sheet.autoSizeColumn(i);
            }

            // Footer
            rowNum += 2;
            Row footerRow = sheet.createRow(rowNum);
            footerRow.createCell(0).setCellValue("Generated: " + expenseBreakdown.generatedAt().format(DATETIME_FORMATTER));

            workbook.write(baos);
            log.info("Successfully generated Expense Breakdown Excel");
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Error generating Expense Breakdown Excel", e);
            throw new RuntimeException("Failed to generate Expense Breakdown Excel", e);
        }
    }

    @Override
    public byte[] generateFinancialDashboardExcel(FinancialDashboardDto dashboard) {
        log.info("Generating Financial Dashboard Excel");

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Financial Dashboard");

            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle currencyStyle = createCurrencyStyle(workbook);
            CellStyle percentStyle = createPercentStyle(workbook);
            CellStyle titleStyle = createTitleStyle(workbook);

            int rowNum = 0;

            // Title
            rowNum = addTitle(sheet, rowNum, "Financial Dashboard", titleStyle);
            rowNum = addSubtitle(sheet, rowNum, dashboard.propertyName());
            rowNum = addSubtitle(sheet, rowNum, dashboard.currentMonth());
            rowNum++;

            // KPIs Section
            rowNum = addSectionHeader(sheet, rowNum, "Key Performance Indicators", headerStyle);
            String[] kpiHeaders = {"Metric", "Value", "Growth"};
            rowNum = addTableHeader(sheet, rowNum, kpiHeaders, headerStyle);

            var kpis = dashboard.kpis();

            Row revenueRow = sheet.createRow(rowNum++);
            revenueRow.createCell(0).setCellValue("Total Revenue");
            Cell revCell = revenueRow.createCell(1);
            revCell.setCellValue(kpis.totalRevenue().doubleValue());
            revCell.setCellStyle(currencyStyle);
            Cell revGrowthCell = revenueRow.createCell(2);
            revGrowthCell.setCellValue(kpis.revenueGrowth().doubleValue() / 100);
            revGrowthCell.setCellStyle(percentStyle);

            Row expenseRow = sheet.createRow(rowNum++);
            expenseRow.createCell(0).setCellValue("Total Expenses");
            Cell expCell = expenseRow.createCell(1);
            expCell.setCellValue(kpis.totalExpenses().doubleValue());
            expCell.setCellStyle(currencyStyle);
            Cell expGrowthCell = expenseRow.createCell(2);
            expGrowthCell.setCellValue(kpis.expenseGrowth().doubleValue() / 100);
            expGrowthCell.setCellStyle(percentStyle);

            Row netRow = sheet.createRow(rowNum++);
            netRow.createCell(0).setCellValue("Net Profit/Loss");
            Cell netCell = netRow.createCell(1);
            netCell.setCellValue(kpis.netProfitLoss().doubleValue());
            netCell.setCellStyle(currencyStyle);

            Row collectionRow = sheet.createRow(rowNum++);
            collectionRow.createCell(0).setCellValue("Collection Rate");
            Cell collCell = collectionRow.createCell(1);
            collCell.setCellValue(kpis.collectionRate().doubleValue() / 100);
            collCell.setCellStyle(percentStyle);

            Row arRow = sheet.createRow(rowNum++);
            arRow.createCell(0).setCellValue("Outstanding Receivables");
            Cell arCell = arRow.createCell(1);
            arCell.setCellValue(kpis.outstandingReceivables().doubleValue());
            arCell.setCellStyle(currencyStyle);
            rowNum++;

            // Insights Section
            if (dashboard.insights() != null) {
                rowNum = addSectionHeader(sheet, rowNum, "Insights", headerStyle);

                if (dashboard.insights().topPerformingProperty() != null) {
                    var topProperty = dashboard.insights().topPerformingProperty();
                    Row topRow = sheet.createRow(rowNum++);
                    topRow.createCell(0).setCellValue("Top Performing Property");
                    topRow.createCell(1).setCellValue(topProperty.propertyName());
                    Cell topRevCell = topRow.createCell(2);
                    topRevCell.setCellValue(topProperty.revenue().doubleValue());
                    topRevCell.setCellStyle(currencyStyle);
                }

                if (dashboard.insights().highestExpenseCategory() != null) {
                    var highestExpense = dashboard.insights().highestExpenseCategory();
                    Row highRow = sheet.createRow(rowNum++);
                    highRow.createCell(0).setCellValue("Highest Expense Category");
                    highRow.createCell(1).setCellValue(highestExpense.categoryLabel());
                    Cell highExpCell = highRow.createCell(2);
                    highExpCell.setCellValue(highestExpense.amount().doubleValue());
                    highExpCell.setCellStyle(currencyStyle);
                }
            }

            // Auto-size columns
            for (int i = 0; i < 3; i++) {
                sheet.autoSizeColumn(i);
            }

            // Footer
            rowNum += 2;
            Row footerRow = sheet.createRow(rowNum);
            footerRow.createCell(0).setCellValue("Generated: " + dashboard.cachedAt().format(DATETIME_FORMATTER));

            workbook.write(baos);
            log.info("Successfully generated Financial Dashboard Excel");
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Error generating Financial Dashboard Excel", e);
            throw new RuntimeException("Failed to generate Financial Dashboard Excel", e);
        }
    }

    // =================================================================
    // HELPER METHODS
    // =================================================================

    private CellStyle createHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.CENTER);
        return style;
    }

    private CellStyle createCurrencyStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        DataFormat format = workbook.createDataFormat();
        style.setDataFormat(format.getFormat("#,##0.00"));
        style.setAlignment(HorizontalAlignment.RIGHT);
        return style;
    }

    private CellStyle createPercentStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        DataFormat format = workbook.createDataFormat();
        style.setDataFormat(format.getFormat("0.00%"));
        style.setAlignment(HorizontalAlignment.RIGHT);
        return style;
    }

    private CellStyle createTitleStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 16);
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.CENTER);
        return style;
    }

    private int addTitle(Sheet sheet, int rowNum, String title, CellStyle style) {
        Row row = sheet.createRow(rowNum);
        Cell cell = row.createCell(0);
        cell.setCellValue(title);
        cell.setCellStyle(style);
        sheet.addMergedRegion(new CellRangeAddress(rowNum, rowNum, 0, 2));
        return rowNum + 1;
    }

    private int addSubtitle(Sheet sheet, int rowNum, String subtitle) {
        Row row = sheet.createRow(rowNum);
        Cell cell = row.createCell(0);
        cell.setCellValue(subtitle);
        sheet.addMergedRegion(new CellRangeAddress(rowNum, rowNum, 0, 2));
        return rowNum + 1;
    }

    private int addSectionHeader(Sheet sheet, int rowNum, String sectionName, CellStyle style) {
        Row row = sheet.createRow(rowNum);
        Cell cell = row.createCell(0);
        cell.setCellValue(sectionName);
        cell.setCellStyle(style);
        return rowNum + 1;
    }

    private int addTableHeader(Sheet sheet, int rowNum, String[] headers, CellStyle style) {
        Row row = sheet.createRow(rowNum);
        for (int i = 0; i < headers.length; i++) {
            Cell cell = row.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(style);
        }
        return rowNum + 1;
    }

    private void setCurrencyCell(Cell cell, BigDecimal value, CellStyle style) {
        cell.setCellValue(value != null ? value.doubleValue() : 0);
        cell.setCellStyle(style);
    }
}
