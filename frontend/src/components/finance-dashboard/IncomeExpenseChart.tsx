'use client';

/**
 * Income vs Expense Chart Component
 * Story 8.6: Finance Dashboard
 * AC-5: Income vs Expense chart with stacked bars and line overlay
 * AC-16: Frontend uses Recharts ComposedChart for income vs expense with line overlay
 * AC-22: All interactive elements have data-testid attributes
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  IncomeExpenseChartData,
  FINANCE_CHART_COLORS,
  formatCompactCurrency,
} from '@/types/finance-dashboard';

interface IncomeExpenseChartProps {
  data: IncomeExpenseChartData[] | undefined;
  isLoading: boolean;
}

export function IncomeExpenseChart({ data, isLoading }: IncomeExpenseChartProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <Card data-testid="income-expense-chart-skeleton">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card data-testid="income-expense-chart-empty">
        <CardHeader>
          <CardTitle>Income vs Expense</CardTitle>
          <CardDescription>Last 12 months</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center text-muted-foreground">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleBarClick = (data: IncomeExpenseChartData) => {
    if (data?.monthYear) {
      router.push(`/finance/transactions?month=${data.monthYear}`);
    }
  };

  return (
    <Card data-testid="income-expense-chart">
      <CardHeader>
        <CardTitle>Income vs Expense</CardTitle>
        <CardDescription>
          Last 12 months with net profit/loss trend. Click bar for monthly details.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80" data-testid="income-expense-chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tickFormatter={(value) => formatCompactCurrency(value)}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-background border rounded-lg shadow-lg p-3">
                        <p className="font-medium mb-2">{label}</p>
                        {payload.map((entry, index) => (
                          <p
                            key={index}
                            className="text-sm"
                            style={{ color: entry.color }}
                          >
                            {entry.name}: {formatCompactCurrency(entry.value as number)}
                          </p>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Bar
                dataKey="income"
                name="Income"
                fill={FINANCE_CHART_COLORS.income}
                stackId="a"
                radius={[0, 0, 0, 0]}
                onClick={(_, index) => handleBarClick(data[index])}
                cursor="pointer"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`income-${index}`}
                    data-testid={`income-bar-${entry.monthYear}`}
                  />
                ))}
              </Bar>
              <Bar
                dataKey="expenses"
                name="Expenses"
                fill={FINANCE_CHART_COLORS.expense}
                stackId="b"
                radius={[4, 4, 0, 0]}
                onClick={(_, index) => handleBarClick(data[index])}
                cursor="pointer"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`expense-${index}`}
                    data-testid={`expense-bar-${entry.monthYear}`}
                  />
                ))}
              </Bar>
              <Line
                type="monotone"
                dataKey="netProfitLoss"
                name="Net Profit/Loss"
                stroke={FINANCE_CHART_COLORS.netLine}
                strokeWidth={2}
                dot={{ fill: FINANCE_CHART_COLORS.netLine, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export default IncomeExpenseChart;
