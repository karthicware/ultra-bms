'use client';

/**
 * Expense Summary Charts Component
 * Story 6.2: Expense Management and Vendor Payments
 * AC #17: Summary dashboard with category breakdown (pie chart) and expense trend (line chart)
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  ExpenseSummary,
  ExpenseCategory,
  EXPENSE_CATEGORY_LABELS,
  formatExpenseCurrency,
} from '@/types/expense';

interface ExpenseSummaryChartsProps {
  summary: ExpenseSummary | null;
  isLoading?: boolean;
}

// Colors for pie chart segments - matching category colors
const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  [ExpenseCategory.MAINTENANCE]: '#9333ea', // purple-600
  [ExpenseCategory.UTILITIES]: '#2563eb', // blue-600
  [ExpenseCategory.SALARIES]: '#16a34a', // green-600
  [ExpenseCategory.SUPPLIES]: '#ea580c', // orange-600
  [ExpenseCategory.INSURANCE]: '#dc2626', // red-600
  [ExpenseCategory.TAXES]: '#0891b2', // cyan-600
  [ExpenseCategory.OTHER]: '#6b7280', // gray-500
};

// Line chart colors
const LINE_COLORS = {
  total: '#3b82f6', // blue-500
  paid: '#22c55e', // green-500
  pending: '#f59e0b', // amber-500
};

/**
 * Custom tooltip for pie chart
 */
const PieChartTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: { categoryLabel: string; amount: number; percentage: number; count: number } }[] }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="font-semibold text-gray-900 dark:text-gray-100">{data.categoryLabel}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Amount: {formatExpenseCurrency(data.amount)}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {data.percentage.toFixed(1)}% of total
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {data.count} expense{data.count !== 1 ? 's' : ''}
        </p>
      </div>
    );
  }
  return null;
};

/**
 * Custom tooltip for line chart
 */
const LineChartTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {formatExpenseCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

/**
 * Expense Summary Charts Component
 * Displays category breakdown pie chart and monthly trend line chart
 */
export function ExpenseSummaryCharts({ summary, isLoading }: ExpenseSummaryChartsProps) {
  // Loading state
  if (isLoading || !summary) {
    return (
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
            <CardDescription>Expenses by category</CardDescription>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Expense Trend</CardTitle>
            <CardDescription>Monthly expense trend</CardDescription>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Prepare pie chart data with colors
  const pieChartData = summary.expensesByCategory.map((item) => ({
    ...item,
    fill: CATEGORY_COLORS[item.category] || CATEGORY_COLORS[ExpenseCategory.OTHER],
  }));

  // Prepare line chart data
  const lineChartData = summary.monthlyTrend.map((item) => ({
    name: item.monthLabel,
    'Total': item.totalAmount,
    'Paid': item.paidAmount,
    'Pending': item.pendingAmount,
  }));

  return (
    <div className="grid gap-6 md:grid-cols-2 mb-6">
      {/* Category Breakdown Pie Chart */}
      <Card data-testid="chart-expense-category">
        <CardHeader>
          <CardTitle>Category Breakdown</CardTitle>
          <CardDescription>Expenses by category (last 12 months)</CardDescription>
        </CardHeader>
        <CardContent>
          {pieChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ percent, name }) =>
                    percent && percent > 0.05 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="amount"
                  nameKey="categoryLabel"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<PieChartTooltip />} />
                <Legend
                  formatter={(value) => (
                    <span className="text-sm text-gray-600 dark:text-gray-400">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No expense data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Trend Line Chart */}
      <Card data-testid="chart-expense-trend">
        <CardHeader>
          <CardTitle>Expense Trend</CardTitle>
          <CardDescription>Monthly expense breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          {lineChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={lineChartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: 'currentColor', fontSize: 12 }}
                  tickLine={{ stroke: 'currentColor' }}
                  axisLine={{ stroke: 'currentColor' }}
                />
                <YAxis
                  tick={{ fill: 'currentColor', fontSize: 12 }}
                  tickLine={{ stroke: 'currentColor' }}
                  axisLine={{ stroke: 'currentColor' }}
                  tickFormatter={(value) => {
                    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                    return value.toString();
                  }}
                />
                <Tooltip content={<LineChartTooltip />} />
                <Legend
                  formatter={(value) => (
                    <span className="text-sm text-gray-600 dark:text-gray-400">{value}</span>
                  )}
                />
                <Line
                  type="monotone"
                  dataKey="Total"
                  stroke={LINE_COLORS.total}
                  strokeWidth={2}
                  dot={{ fill: LINE_COLORS.total, strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="Paid"
                  stroke={LINE_COLORS.paid}
                  strokeWidth={2}
                  dot={{ fill: LINE_COLORS.paid, strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="Pending"
                  stroke={LINE_COLORS.pending}
                  strokeWidth={2}
                  dot={{ fill: LINE_COLORS.pending, strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No trend data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ExpenseSummaryCharts;
