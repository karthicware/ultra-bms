/**
 * Zod Validation Schemas for Finance Dashboard
 * Story 8.6: Finance Dashboard
 */

import { z } from 'zod';

// ============================================================================
// ENUM SCHEMAS
// ============================================================================

export const transactionTypeSchema = z.enum(['INCOME', 'EXPENSE']);

export const expenseCategorySchema = z.enum([
  'MAINTENANCE',
  'UTILITIES',
  'SALARIES',
  'SUPPLIES',
  'INSURANCE',
  'TAXES',
  'OTHER'
]);

// ============================================================================
// KPI SCHEMA (AC-1, AC-2, AC-3, AC-4)
// ============================================================================

export const financeKpiSchema = z.object({
  totalIncomeYtd: z.number().min(0, 'Total income must be non-negative'),
  totalIncomeLastYear: z.number().min(0).nullable(),
  incomeTrendPercentage: z.number().nullable(),
  totalExpensesYtd: z.number().min(0, 'Total expenses must be non-negative'),
  totalExpensesLastYear: z.number().min(0).nullable(),
  expensesTrendPercentage: z.number().nullable(),
  netProfitLossYtd: z.number(),
  profitMarginPercentage: z.number().nullable(),
  vatPaidYtd: z.number().min(0, 'VAT paid must be non-negative'),
  vatPaidLastYear: z.number().min(0).nullable(),
  vatTrendPercentage: z.number().nullable(),
});

// ============================================================================
// CHART DATA SCHEMAS (AC-5, AC-6)
// ============================================================================

export const incomeExpenseChartDataSchema = z.object({
  month: z.string().min(1, 'Month is required'),
  monthYear: z.string().regex(/^\d{4}-\d{2}$/, 'Month year must be in YYYY-MM format'),
  income: z.number().min(0, 'Income must be non-negative'),
  expenses: z.number().min(0, 'Expenses must be non-negative'),
  netProfitLoss: z.number(),
});

export const incomeExpenseChartDataArraySchema = z.array(incomeExpenseChartDataSchema);

export const expenseCategoryDataSchema = z.object({
  category: expenseCategorySchema,
  categoryName: z.string().min(1, 'Category name is required'),
  amount: z.number().min(0, 'Amount must be non-negative'),
  percentage: z.number().min(0).max(100).nullable(),
  count: z.number().int().min(0, 'Count must be non-negative'),
});

export const expenseCategoryDataArraySchema = z.array(expenseCategoryDataSchema);

// ============================================================================
// RECEIVABLES SCHEMA (AC-7)
// ============================================================================

export const outstandingReceivablesSchema = z.object({
  totalOutstanding: z.number().min(0, 'Total outstanding must be non-negative'),
  totalInvoiceCount: z.number().int().min(0, 'Invoice count must be non-negative'),
  currentAmount: z.number().min(0, 'Current amount must be non-negative'),
  currentCount: z.number().int().min(0),
  thirtyPlusAmount: z.number().min(0, '30+ amount must be non-negative'),
  thirtyPlusCount: z.number().int().min(0),
  sixtyPlusAmount: z.number().min(0, '60+ amount must be non-negative'),
  sixtyPlusCount: z.number().int().min(0),
  ninetyPlusAmount: z.number().min(0, '90+ amount must be non-negative'),
  ninetyPlusCount: z.number().int().min(0),
  currentPercentage: z.number().min(0).max(100).nullable(),
  thirtyPlusPercentage: z.number().min(0).max(100).nullable(),
  sixtyPlusPercentage: z.number().min(0).max(100).nullable(),
  ninetyPlusPercentage: z.number().min(0).max(100).nullable(),
});

// ============================================================================
// TRANSACTIONS SCHEMA (AC-8)
// ============================================================================

export const recentTransactionSchema = z.object({
  id: z.string().uuid('Transaction ID must be a valid UUID'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  type: transactionTypeSchema,
  description: z.string().min(1, 'Description is required'),
  amount: z.number().min(0, 'Amount must be non-negative'),
  category: z.string().min(1, 'Category is required'),
  referenceNumber: z.string().min(1, 'Reference number is required'),
});

export const recentTransactionsArraySchema = z.array(recentTransactionSchema);

// ============================================================================
// PDC STATUS SCHEMA (AC-9)
// ============================================================================

export const pdcStatusSummarySchema = z.object({
  dueThisWeekCount: z.number().int().min(0, 'Count must be non-negative'),
  dueThisWeekAmount: z.number().min(0, 'Amount must be non-negative'),
  dueThisMonthCount: z.number().int().min(0, 'Count must be non-negative'),
  dueThisMonthAmount: z.number().min(0, 'Amount must be non-negative'),
  awaitingClearanceCount: z.number().int().min(0, 'Count must be non-negative'),
  awaitingClearanceAmount: z.number().min(0, 'Amount must be non-negative'),
  totalPdcsCount: z.number().int().min(0, 'Count must be non-negative'),
  totalPdcsAmount: z.number().min(0, 'Amount must be non-negative'),
});

// ============================================================================
// COMPLETE DASHBOARD SCHEMA (AC-10)
// ============================================================================

export const financeDashboardSchema = z.object({
  kpis: financeKpiSchema,
  incomeVsExpense: incomeExpenseChartDataArraySchema,
  expenseCategories: expenseCategoryDataArraySchema,
  outstandingReceivables: outstandingReceivablesSchema,
  recentTransactions: recentTransactionsArraySchema,
  pdcStatus: pdcStatusSummarySchema,
});

// ============================================================================
// REQUEST SCHEMAS
// ============================================================================

export const financeDashboardRequestSchema = z.object({
  propertyId: z.string().uuid('Property ID must be a valid UUID').optional(),
});

export const recentTransactionsRequestSchema = z.object({
  threshold: z.number().min(0, 'Threshold must be non-negative').default(10000),
  propertyId: z.string().uuid('Property ID must be a valid UUID').optional(),
});

// ============================================================================
// TYPE EXPORTS (Inferred from schemas)
// ============================================================================

export type FinanceKpiSchemaType = z.infer<typeof financeKpiSchema>;
export type IncomeExpenseChartDataSchemaType = z.infer<typeof incomeExpenseChartDataSchema>;
export type ExpenseCategoryDataSchemaType = z.infer<typeof expenseCategoryDataSchema>;
export type OutstandingReceivablesSchemaType = z.infer<typeof outstandingReceivablesSchema>;
export type RecentTransactionSchemaType = z.infer<typeof recentTransactionSchema>;
export type PdcStatusSummarySchemaType = z.infer<typeof pdcStatusSummarySchema>;
export type FinanceDashboardSchemaType = z.infer<typeof financeDashboardSchema>;
export type FinanceDashboardRequestSchemaType = z.infer<typeof financeDashboardRequestSchema>;
export type RecentTransactionsRequestSchemaType = z.infer<typeof recentTransactionsRequestSchema>;

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate finance dashboard response
 */
export function validateFinanceDashboard(data: unknown): FinanceDashboardSchemaType {
  return financeDashboardSchema.parse(data);
}

/**
 * Validate finance KPIs response
 */
export function validateFinanceKpis(data: unknown): FinanceKpiSchemaType {
  return financeKpiSchema.parse(data);
}

/**
 * Validate income vs expense chart data
 */
export function validateIncomeVsExpense(data: unknown): IncomeExpenseChartDataSchemaType[] {
  return incomeExpenseChartDataArraySchema.parse(data);
}

/**
 * Validate expense categories data
 */
export function validateExpenseCategories(data: unknown): ExpenseCategoryDataSchemaType[] {
  return expenseCategoryDataArraySchema.parse(data);
}

/**
 * Validate outstanding receivables
 */
export function validateOutstandingReceivables(data: unknown): OutstandingReceivablesSchemaType {
  return outstandingReceivablesSchema.parse(data);
}

/**
 * Validate recent transactions
 */
export function validateRecentTransactions(data: unknown): RecentTransactionSchemaType[] {
  return recentTransactionsArraySchema.parse(data);
}

/**
 * Validate PDC status summary
 */
export function validatePdcStatusSummary(data: unknown): PdcStatusSummarySchemaType {
  return pdcStatusSummarySchema.parse(data);
}

/**
 * Safe parse finance dashboard (returns success/error result)
 */
export function safeParseFinanceDashboard(data: unknown) {
  return financeDashboardSchema.safeParse(data);
}
