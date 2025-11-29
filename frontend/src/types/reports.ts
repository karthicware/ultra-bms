/**
 * Financial Reporting and Analytics Types and Interfaces
 * Story 6.4: Financial Reporting and Analytics
 */

import { ExpenseCategory } from './expense';

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Export format enum
 * Supported export formats for reports
 */
export enum ExportFormat {
  PDF = 'PDF',
  EXCEL = 'EXCEL',
  CSV = 'CSV'
}

/**
 * Report type enum
 * Available report types in the system
 */
export enum ReportType {
  INCOME_STATEMENT = 'income-statement',
  CASH_FLOW = 'cash-flow',
  AR_AGING = 'receivables-aging',
  REVENUE_BREAKDOWN = 'revenue-breakdown',
  EXPENSE_BREAKDOWN = 'expense-breakdown',
  FINANCIAL_DASHBOARD = 'financial-dashboard'
}

/**
 * Revenue type enum
 * Categories of revenue in the system
 */
export enum RevenueType {
  RENT = 'RENT',
  SERVICE_CHARGE = 'SERVICE_CHARGE',
  PARKING = 'PARKING',
  LATE_FEE = 'LATE_FEE',
  OTHER = 'OTHER'
}

/**
 * AR Aging bucket enum
 * Standard aging bucket categories
 */
export enum AgingBucket {
  CURRENT = 'Current',
  DAYS_1_30 = '1-30',
  DAYS_31_60 = '31-60',
  DAYS_61_90 = '61-90',
  DAYS_90_PLUS = '90+'
}

// ============================================================================
// DATE RANGE PRESETS
// ============================================================================

/**
 * Date range preset enum
 * Standard presets for date range selection
 */
export enum DateRangePreset {
  THIS_MONTH = 'this-month',
  LAST_MONTH = 'last-month',
  THIS_QUARTER = 'this-quarter',
  LAST_QUARTER = 'last-quarter',
  THIS_YEAR = 'this-year',
  LAST_YEAR = 'last-year',
  CUSTOM = 'custom'
}

/**
 * Date range interface
 * For date range filter parameters
 */
export interface DateRange {
  startDate: string;
  endDate: string;
}

// ============================================================================
// INCOME STATEMENT TYPES (AC#1, AC#10)
// ============================================================================

/**
 * Revenue breakdown item by category
 * Part of income statement
 */
export interface RevenueBreakdownItem {
  category: string;
  amount: number;
  percentage: number;
}

/**
 * Expense breakdown item by category
 * Part of income statement
 */
export interface ExpenseBreakdownItem {
  category: string;
  categoryLabel: string;
  amount: number;
  percentage: number;
}

/**
 * Income statement (P&L) report
 * Complete profit and loss statement with MoM comparison
 */
export interface IncomeStatement {
  startDate: string;
  endDate: string;
  propertyId?: string;
  propertyName?: string;
  totalRevenue: number;
  revenueBreakdown: RevenueBreakdownItem[];
  totalExpenses: number;
  expenseBreakdown: ExpenseBreakdownItem[];
  netIncome: number;
  netMargin: number;
  previousPeriodRevenue: number;
  previousPeriodExpenses: number;
  previousPeriodNetIncome: number;
  revenueChange: number;
  expenseChange: number;
  netIncomeChange: number;
  generatedAt: string;
}

// ============================================================================
// CASH FLOW TYPES (AC#2, AC#11)
// ============================================================================

/**
 * Monthly cash flow data point
 * For month-over-month comparison chart
 */
export interface MonthlyCashFlow {
  month: string;
  inflows: number;
  outflows: number;
  net: number;
}

/**
 * Cash flow summary report
 * Shows cash inflows, outflows, and net with MoM comparison
 */
export interface CashFlowSummary {
  startDate: string;
  endDate: string;
  propertyId?: string;
  propertyName?: string;
  totalInflows: number;
  totalOutflows: number;
  netCashFlow: number;
  monthlyCashFlows: MonthlyCashFlow[];
  previousPeriodInflows: number;
  previousPeriodOutflows: number;
  previousPeriodNetCashFlow: number;
  inflowChange: number;
  outflowChange: number;
  netChange: number;
  generatedAt: string;
}

// ============================================================================
// AR AGING TYPES (AC#3, AC#12)
// ============================================================================

/**
 * Single aging bucket data
 * Count and amount for each aging period
 */
export interface AgingBucketData {
  bucket: AgingBucket;
  bucketLabel: string;
  count: number;
  amount: number;
  percentage: number;
}

/**
 * Tenant-level aging detail for drill-down
 */
export interface TenantAgingDetail {
  tenantId: string;
  tenantName: string;
  totalOutstanding: number;
  currentAmount: number;
  days1to30: number;
  days31to60: number;
  days61to90: number;
  over90Days: number;
  invoiceCount: number;
}

/**
 * Accounts receivable aging report
 * Shows outstanding invoices by age with tenant drill-down
 */
export interface ARAgingReport {
  asOfDate: string;
  propertyId?: string;
  propertyName?: string;
  totalOutstanding: number;
  totalInvoiceCount: number;
  averageDaysOutstanding: number;
  agingBuckets: AgingBucketData[];
  tenantDetails: TenantAgingDetail[];
  generatedAt: string;
}

// ============================================================================
// REVENUE BREAKDOWN TYPES (AC#4, AC#13)
// ============================================================================

/**
 * Revenue by property data point
 * For property-wise revenue chart
 */
export interface PropertyRevenue {
  propertyId: string;
  propertyName: string;
  amount: number;
  percentage: number;
}

/**
 * Revenue by type data point
 * For revenue type breakdown chart
 */
export interface TypeRevenue {
  type: string;
  typeLabel: string;
  amount: number;
  percentage: number;
}

/**
 * Monthly revenue trend data point
 * For 12-month trend chart
 */
export interface MonthlyRevenueTrend {
  month: string;
  amount: number;
}

/**
 * Year-over-year revenue comparison
 * For YoY bar chart
 */
export interface YearOverYearRevenue {
  year: number;
  amount: number;
  change: number;
}

/**
 * Complete revenue breakdown report
 * All revenue analytics data
 */
export interface RevenueBreakdown {
  startDate: string;
  endDate: string;
  propertyId?: string;
  propertyName?: string;
  totalRevenue: number;
  revenueByProperty: PropertyRevenue[];
  revenueByType: TypeRevenue[];
  monthlyTrend: MonthlyRevenueTrend[];
  yearOverYearComparison: YearOverYearRevenue[];
  generatedAt: string;
}

// ============================================================================
// EXPENSE BREAKDOWN TYPES (AC#5, AC#14)
// ============================================================================

/**
 * Expense by category data point
 * For category-wise expense chart
 */
export interface CategoryExpense {
  category: string;
  categoryLabel: string;
  amount: number;
  percentage: number;
}

/**
 * Monthly expense trend data point
 * For 12-month trend chart
 */
export interface MonthlyExpenseTrendData {
  month: string;
  amount: number;
}

/**
 * Top vendor by payment amount
 * For top vendors chart
 */
export interface VendorPayment {
  vendorId: string;
  vendorName: string;
  amount: number;
  percentage: number;
}

/**
 * Maintenance cost by property
 * For property-wise maintenance chart
 */
export interface PropertyMaintenanceCost {
  propertyId: string;
  propertyName: string;
  amount: number;
}

/**
 * Complete expense breakdown report
 * All expense analytics data
 */
export interface ExpenseBreakdownReport {
  startDate: string;
  endDate: string;
  propertyId?: string;
  propertyName?: string;
  totalExpenses: number;
  expenseByCategory: CategoryExpense[];
  monthlyTrend: MonthlyExpenseTrendData[];
  topVendors: VendorPayment[];
  maintenanceCostByProperty: PropertyMaintenanceCost[];
  generatedAt: string;
}

// ============================================================================
// FINANCIAL DASHBOARD TYPES (AC#6, AC#15)
// ============================================================================

/**
 * Top performing property insight
 */
export interface TopPerformingProperty {
  propertyId: string;
  propertyName: string;
  revenue: number;
}

/**
 * Highest expense category insight
 */
export interface HighestExpenseCategory {
  category: string;
  categoryLabel: string;
  amount: number;
}

/**
 * Financial KPIs for dashboard
 */
export interface FinancialKPIs {
  totalRevenue: number;
  totalExpenses: number;
  netProfitLoss: number;
  collectionRate: number;
  outstandingReceivables: number;
  revenueGrowth: number;
  expenseGrowth: number;
}

/**
 * Financial insights for dashboard
 */
export interface FinancialInsights {
  topPerformingProperty: TopPerformingProperty | null;
  highestExpenseCategory: HighestExpenseCategory | null;
}

/**
 * Complete financial dashboard data
 * Main dashboard KPIs and insights
 */
export interface FinancialDashboard {
  kpis: FinancialKPIs;
  insights: FinancialInsights;
  currentMonth: string;
  previousMonth: string;
  propertyId?: string;
  propertyName?: string;
  cachedAt?: string;
}

// ============================================================================
// COMPARATIVE REPORTING TYPES (AC#31)
// ============================================================================

/**
 * Variance data for comparative reporting
 */
export interface VarianceData {
  current: number;
  previous: number;
  variance: number;
  variancePercentage: number;
  isPositive: boolean;
}

/**
 * Comparative income statement
 * Current vs previous period
 */
export interface ComparativeIncomeStatement {
  current: IncomeStatement;
  previous: IncomeStatement;
  revenueVariance: VarianceData;
  expenseVariance: VarianceData;
  netProfitVariance: VarianceData;
}

/**
 * Comparative cash flow
 * Current vs previous period
 */
export interface ComparativeCashFlow {
  current: CashFlowSummary;
  previous: CashFlowSummary;
  inflowsVariance: VarianceData;
  outflowsVariance: VarianceData;
  netVariance: VarianceData;
}

// ============================================================================
// REQUEST/FILTER TYPES
// ============================================================================

/**
 * Common report filter parameters
 */
export interface ReportFilter {
  startDate: string;
  endDate: string;
  propertyId?: string;
}

/**
 * AR aging specific filter
 */
export interface ARAgingFilter {
  asOfDate?: string;
  propertyId?: string;
}

/**
 * Export request parameters
 */
export interface ExportRequest {
  reportType: ReportType;
  startDate: string;
  endDate: string;
  propertyId?: string;
  format?: ExportFormat;
}

/**
 * Email report request parameters
 */
export interface EmailReportRequest {
  reportType: ReportType;
  startDate: string;
  endDate: string;
  propertyId?: string;
  recipients: string[];
  message?: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Response from income statement endpoint
 */
export interface IncomeStatementResponse {
  success: boolean;
  message: string;
  data: IncomeStatement;
  timestamp: string;
}

/**
 * Response from cash flow endpoint
 */
export interface CashFlowResponse {
  success: boolean;
  message: string;
  data: CashFlowSummary;
  timestamp: string;
}

/**
 * Response from AR aging endpoint
 */
export interface ARAgingResponse {
  success: boolean;
  message: string;
  data: ARAgingReport;
  timestamp: string;
}

/**
 * Response from revenue breakdown endpoint
 */
export interface RevenueBreakdownResponse {
  success: boolean;
  message: string;
  data: RevenueBreakdown;
  timestamp: string;
}

/**
 * Response from expense breakdown endpoint
 */
export interface ExpenseBreakdownResponse {
  success: boolean;
  message: string;
  data: ExpenseBreakdownReport;
  timestamp: string;
}

/**
 * Response from financial dashboard endpoint
 */
export interface FinancialDashboardResponse {
  success: boolean;
  message: string;
  data: FinancialDashboard;
  timestamp: string;
}

/**
 * Response from email report endpoint
 */
export interface EmailReportResponse {
  success: boolean;
  message: string;
  timestamp: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format currency as AED for reports
 */
export function formatReportCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Format percentage for reports
 */
export function formatReportPercentage(value: number, decimals: number = 1): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}

/**
 * Format percentage without sign
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Get variance color class
 */
export function getVarianceColorClass(isPositive: boolean, isExpense: boolean = false): string {
  // For expenses, negative variance (decrease) is positive
  const effectivePositive = isExpense ? !isPositive : isPositive;
  return effectivePositive
    ? 'text-green-600 dark:text-green-400'
    : 'text-red-600 dark:text-red-400';
}

/**
 * Get aging bucket color class
 */
export function getAgingBucketColor(bucket: AgingBucket): string {
  switch (bucket) {
    case AgingBucket.CURRENT:
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case AgingBucket.DAYS_1_30:
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case AgingBucket.DAYS_31_60:
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
    case AgingBucket.DAYS_61_90:
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    case AgingBucket.DAYS_90_PLUS:
      return 'bg-red-200 text-red-900 dark:bg-red-950 dark:text-red-200';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Get revenue type label
 */
export function getRevenueTypeLabel(type: RevenueType): string {
  switch (type) {
    case RevenueType.RENT:
      return 'Rental Income';
    case RevenueType.SERVICE_CHARGE:
      return 'Service Charges';
    case RevenueType.PARKING:
      return 'Parking Fees';
    case RevenueType.LATE_FEE:
      return 'Late Fees';
    case RevenueType.OTHER:
      return 'Other Income';
    default:
      return type;
  }
}

/**
 * Get report type label
 */
export function getReportTypeLabel(type: ReportType): string {
  switch (type) {
    case ReportType.INCOME_STATEMENT:
      return 'Income Statement (P&L)';
    case ReportType.CASH_FLOW:
      return 'Cash Flow Summary';
    case ReportType.AR_AGING:
      return 'Accounts Receivable Aging';
    case ReportType.REVENUE_BREAKDOWN:
      return 'Revenue Breakdown';
    case ReportType.EXPENSE_BREAKDOWN:
      return 'Expense Breakdown';
    case ReportType.FINANCIAL_DASHBOARD:
      return 'Financial Dashboard';
    default:
      return type;
  }
}

/**
 * Get export format label
 */
export function getExportFormatLabel(format: ExportFormat): string {
  switch (format) {
    case ExportFormat.PDF:
      return 'PDF Document';
    case ExportFormat.EXCEL:
      return 'Excel Spreadsheet';
    case ExportFormat.CSV:
      return 'CSV File';
    default:
      return format;
  }
}

/**
 * Get date range preset label
 */
export function getDateRangePresetLabel(preset: DateRangePreset): string {
  switch (preset) {
    case DateRangePreset.THIS_MONTH:
      return 'This Month';
    case DateRangePreset.LAST_MONTH:
      return 'Last Month';
    case DateRangePreset.THIS_QUARTER:
      return 'This Quarter';
    case DateRangePreset.LAST_QUARTER:
      return 'Last Quarter';
    case DateRangePreset.THIS_YEAR:
      return 'This Year';
    case DateRangePreset.LAST_YEAR:
      return 'Last Year';
    case DateRangePreset.CUSTOM:
      return 'Custom Range';
    default:
      return preset;
  }
}

// ============================================================================
// CHART COLORS (Airbnb-inspired palette)
// ============================================================================

/**
 * Chart color palette for consistent styling
 */
export const CHART_COLORS = {
  primary: '#FF5A5F',    // Coral red
  secondary: '#00A699',  // Teal
  tertiary: '#FC642D',   // Orange
  quaternary: '#484848', // Dark gray
  quinary: '#767676',    // Medium gray
  success: '#008489',    // Green-teal
  warning: '#FFB400',    // Yellow
  error: '#C13515',      // Dark red
} as const;

/**
 * Extended color palette for charts with multiple segments
 */
export const CHART_COLOR_PALETTE = [
  '#FF5A5F', // Coral
  '#00A699', // Teal
  '#FC642D', // Orange
  '#FFB400', // Yellow
  '#008489', // Green-teal
  '#767676', // Gray
  '#484848', // Dark gray
  '#C13515', // Dark red
] as const;

/**
 * Revenue type colors for charts
 */
export const REVENUE_TYPE_COLORS: Record<RevenueType, string> = {
  [RevenueType.RENT]: '#00A699',
  [RevenueType.SERVICE_CHARGE]: '#FF5A5F',
  [RevenueType.PARKING]: '#FC642D',
  [RevenueType.LATE_FEE]: '#FFB400',
  [RevenueType.OTHER]: '#767676',
};

/**
 * Aging bucket colors for charts
 */
export const AGING_BUCKET_COLORS: Record<AgingBucket, string> = {
  [AgingBucket.CURRENT]: '#00A699',
  [AgingBucket.DAYS_1_30]: '#FFB400',
  [AgingBucket.DAYS_31_60]: '#FC642D',
  [AgingBucket.DAYS_61_90]: '#FF5A5F',
  [AgingBucket.DAYS_90_PLUS]: '#C13515',
};

// ============================================================================
// LABEL RECORDS FOR DISPLAY
// ============================================================================

/**
 * Report type labels for display
 */
export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  [ReportType.INCOME_STATEMENT]: 'Income Statement (P&L)',
  [ReportType.CASH_FLOW]: 'Cash Flow Summary',
  [ReportType.AR_AGING]: 'Accounts Receivable Aging',
  [ReportType.REVENUE_BREAKDOWN]: 'Revenue Breakdown',
  [ReportType.EXPENSE_BREAKDOWN]: 'Expense Breakdown',
  [ReportType.FINANCIAL_DASHBOARD]: 'Financial Dashboard',
};

/**
 * Export format labels for display
 */
export const EXPORT_FORMAT_LABELS: Record<ExportFormat, string> = {
  [ExportFormat.PDF]: 'PDF Document',
  [ExportFormat.EXCEL]: 'Excel Spreadsheet',
  [ExportFormat.CSV]: 'CSV File',
};

/**
 * Revenue type labels for display
 */
export const REVENUE_TYPE_LABELS: Record<RevenueType, string> = {
  [RevenueType.RENT]: 'Rental Income',
  [RevenueType.SERVICE_CHARGE]: 'Service Charges',
  [RevenueType.PARKING]: 'Parking Fees',
  [RevenueType.LATE_FEE]: 'Late Fees',
  [RevenueType.OTHER]: 'Other Income',
};

/**
 * Aging bucket labels for display
 */
export const AGING_BUCKET_LABELS: Record<AgingBucket, string> = {
  [AgingBucket.CURRENT]: 'Current (Not Yet Due)',
  [AgingBucket.DAYS_1_30]: '1-30 Days Overdue',
  [AgingBucket.DAYS_31_60]: '31-60 Days Overdue',
  [AgingBucket.DAYS_61_90]: '61-90 Days Overdue',
  [AgingBucket.DAYS_90_PLUS]: '90+ Days Overdue',
};

/**
 * Date range preset labels for display
 */
export const DATE_RANGE_PRESET_LABELS: Record<DateRangePreset, string> = {
  [DateRangePreset.THIS_MONTH]: 'This Month',
  [DateRangePreset.LAST_MONTH]: 'Last Month',
  [DateRangePreset.THIS_QUARTER]: 'This Quarter',
  [DateRangePreset.LAST_QUARTER]: 'Last Quarter',
  [DateRangePreset.THIS_YEAR]: 'This Year',
  [DateRangePreset.LAST_YEAR]: 'Last Year',
  [DateRangePreset.CUSTOM]: 'Custom Range',
};
