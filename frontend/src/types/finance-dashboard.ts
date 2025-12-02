/**
 * Finance Dashboard Types and Interfaces
 * Story 8.6: Finance Dashboard
 */

import { ExpenseCategory } from './expense';

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Transaction type for recent transactions table
 */
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

/**
 * Trend direction for KPI indicators
 */
export enum TrendDirection {
  UP = 'UP',
  DOWN = 'DOWN',
  NEUTRAL = 'NEUTRAL'
}

// ============================================================================
// KPI INTERFACES (AC-1, AC-2, AC-3, AC-4)
// ============================================================================

/**
 * Finance Dashboard KPI data
 * Represents YTD financial metrics
 */
export interface FinanceKpi {
  /** Total Income YTD in AED */
  totalIncomeYtd: number;
  /** Total Income for same period last year */
  totalIncomeLastYear: number | null;
  /** Income trend percentage vs same period last year */
  incomeTrendPercentage: number | null;
  /** Total Expenses YTD in AED */
  totalExpensesYtd: number;
  /** Total Expenses for same period last year */
  totalExpensesLastYear: number | null;
  /** Expenses trend percentage vs same period last year */
  expensesTrendPercentage: number | null;
  /** Net Profit/Loss YTD in AED (income - expenses) */
  netProfitLossYtd: number;
  /** Profit margin percentage */
  profitMarginPercentage: number | null;
  /** VAT Paid YTD in AED */
  vatPaidYtd: number;
  /** VAT Paid for same period last year */
  vatPaidLastYear: number | null;
  /** VAT trend percentage vs same period last year */
  vatTrendPercentage: number | null;
}

// ============================================================================
// CHART DATA INTERFACES (AC-5, AC-6)
// ============================================================================

/**
 * Monthly income vs expense data for stacked bar chart (AC-5)
 */
export interface IncomeExpenseChartData {
  /** Month name (e.g., "Jan", "Feb") */
  month: string;
  /** Full month-year for navigation (e.g., "2024-01") */
  monthYear: string;
  /** Total income for the month in AED */
  income: number;
  /** Total expenses for the month in AED */
  expenses: number;
  /** Net profit/loss for the month (income - expenses) */
  netProfitLoss: number;
}

/**
 * Expense category breakdown for donut chart (AC-6)
 */
export interface ExpenseCategoryData {
  /** Expense category enum value */
  category: ExpenseCategory;
  /** Display name for the category */
  categoryName: string;
  /** Total amount spent in this category YTD in AED */
  amount: number;
  /** Percentage of total expenses */
  percentage: number | null;
  /** Number of expense records in this category */
  count: number;
}

// ============================================================================
// RECEIVABLES INTERFACE (AC-7)
// ============================================================================

/**
 * Outstanding receivables with aging breakdown
 */
export interface OutstandingReceivables {
  /** Total amount outstanding in AED */
  totalOutstanding: number;
  /** Count of unpaid invoices */
  totalInvoiceCount: number;
  /** Current (0-30 days) outstanding amount */
  currentAmount: number;
  /** Count of invoices in current bucket */
  currentCount: number;
  /** 31-60 days outstanding amount */
  thirtyPlusAmount: number;
  /** Count of invoices in 30+ bucket */
  thirtyPlusCount: number;
  /** 61-90 days outstanding amount */
  sixtyPlusAmount: number;
  /** Count of invoices in 60+ bucket */
  sixtyPlusCount: number;
  /** Over 90 days outstanding amount */
  ninetyPlusAmount: number;
  /** Count of invoices in 90+ bucket */
  ninetyPlusCount: number;
  /** Current bucket percentage of total */
  currentPercentage: number | null;
  /** 30+ bucket percentage of total */
  thirtyPlusPercentage: number | null;
  /** 60+ bucket percentage of total */
  sixtyPlusPercentage: number | null;
  /** 90+ bucket percentage of total */
  ninetyPlusPercentage: number | null;
}

/**
 * Aging bucket for receivables breakdown
 */
export interface AgingBucket {
  label: string;
  amount: number;
  count: number;
  percentage: number;
  color: string;
}

// ============================================================================
// TRANSACTIONS INTERFACE (AC-8)
// ============================================================================

/**
 * Recent high-value transaction
 */
export interface RecentTransaction {
  /** Transaction ID */
  id: string;
  /** Transaction date */
  date: string;
  /** Transaction type (INCOME or EXPENSE) */
  type: TransactionType;
  /** Transaction description */
  description: string;
  /** Transaction amount in AED */
  amount: number;
  /** Category of the transaction */
  category: string;
  /** Reference number (invoice or expense number) */
  referenceNumber: string;
}

// ============================================================================
// PDC STATUS INTERFACE (AC-9)
// ============================================================================

/**
 * PDC Status Summary
 */
export interface PdcStatusSummary {
  /** PDCs due within the current week - count */
  dueThisWeekCount: number;
  /** PDCs due this week - total amount in AED */
  dueThisWeekAmount: number;
  /** PDCs due within the current month - count */
  dueThisMonthCount: number;
  /** PDCs due this month - total amount in AED */
  dueThisMonthAmount: number;
  /** PDCs awaiting clearance - count */
  awaitingClearanceCount: number;
  /** PDCs awaiting clearance - total amount in AED */
  awaitingClearanceAmount: number;
  /** Total PDCs count */
  totalPdcsCount: number;
  /** Total PDCs amount in AED */
  totalPdcsAmount: number;
}

// ============================================================================
// COMPLETE DASHBOARD INTERFACE (AC-10)
// ============================================================================

/**
 * Complete Finance Dashboard response
 */
export interface FinanceDashboard {
  /** KPI cards data */
  kpis: FinanceKpi;
  /** Income vs expense chart data (last 12 months) */
  incomeVsExpense: IncomeExpenseChartData[];
  /** Expense categories for donut chart */
  expenseCategories: ExpenseCategoryData[];
  /** Outstanding receivables summary */
  outstandingReceivables: OutstandingReceivables;
  /** Recent high-value transactions */
  recentTransactions: RecentTransaction[];
  /** PDC status summary */
  pdcStatus: PdcStatusSummary;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Props for finance KPI cards
 */
export interface FinanceKpiCardProps {
  title: string;
  value: number;
  trend: number | null;
  previousValue: number | null;
  format?: 'currency' | 'percentage';
  isProfitLoss?: boolean;
  onClick?: () => void;
}

/**
 * Chart colors for finance dashboard
 */
export const FINANCE_CHART_COLORS = {
  income: '#22c55e',      // Green
  expense: '#ef4444',     // Red
  profit: '#22c55e',      // Green
  loss: '#ef4444',        // Red
  netLine: '#3b82f6',     // Blue
  current: '#22c55e',     // Green
  thirtyPlus: '#f59e0b',  // Amber
  sixtyPlus: '#f97316',   // Orange
  ninetyPlus: '#ef4444',  // Red
} as const;

/**
 * Expense category colors
 */
export const EXPENSE_CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  [ExpenseCategory.MAINTENANCE]: '#3b82f6',    // Blue
  [ExpenseCategory.UTILITIES]: '#f59e0b',      // Amber
  [ExpenseCategory.SALARIES]: '#8b5cf6',       // Purple
  [ExpenseCategory.SUPPLIES]: '#ec4899',       // Pink
  [ExpenseCategory.INSURANCE]: '#10b981',      // Emerald
  [ExpenseCategory.TAXES]: '#6366f1',          // Indigo
  [ExpenseCategory.OTHER]: '#6b7280',          // Gray
};

// ============================================================================
// FORMATTING HELPERS
// ============================================================================

/**
 * Format currency in AED
 */
export function formatAedCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format large currency amounts with K/M suffix
 */
export function formatCompactCurrency(amount: number): string {
  if (Math.abs(amount) >= 1000000) {
    return `AED ${(amount / 1000000).toFixed(1)}M`;
  }
  if (Math.abs(amount) >= 1000) {
    return `AED ${(amount / 1000).toFixed(1)}K`;
  }
  return formatAedCurrency(amount);
}

/**
 * Get trend direction from percentage
 */
export function getTrendDirection(percentage: number | null): TrendDirection {
  if (percentage === null) return TrendDirection.NEUTRAL;
  if (percentage > 0) return TrendDirection.UP;
  if (percentage < 0) return TrendDirection.DOWN;
  return TrendDirection.NEUTRAL;
}

/**
 * Get color for trend indicator
 * Note: For expenses, UP is bad (red) and DOWN is good (green)
 */
export function getTrendColor(percentage: number | null, isExpense: boolean = false): string {
  if (percentage === null) return 'text-muted-foreground';
  if (isExpense) {
    return percentage > 0 ? 'text-red-500' : percentage < 0 ? 'text-green-500' : 'text-muted-foreground';
  }
  return percentage > 0 ? 'text-green-500' : percentage < 0 ? 'text-red-500' : 'text-muted-foreground';
}

/**
 * Get profit/loss color
 */
export function getProfitLossColor(amount: number): string {
  if (amount > 0) return 'text-green-500';
  if (amount < 0) return 'text-red-500';
  return 'text-muted-foreground';
}
