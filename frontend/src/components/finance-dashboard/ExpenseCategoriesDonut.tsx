'use client';

/**
 * Expense Categories Donut Chart Component
 * Story 8.6: Finance Dashboard
 * AC-6: Top Expense Categories donut chart with drill-down
 * AC-19: Drill-down from donut chart to expense list implemented
 * AC-22: All interactive elements have data-testid attributes
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import {
  ExpenseCategoryData,
  EXPENSE_CATEGORY_COLORS,
  formatAedCurrency,
} from '@/types/finance-dashboard';
import { ExpenseCategory } from '@/types/expense';

interface ExpenseCategoriesDonutProps {
  data: ExpenseCategoryData[] | undefined;
  isLoading: boolean;
}

export function ExpenseCategoriesDonut({ data, isLoading }: ExpenseCategoriesDonutProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <Card data-testid="expense-categories-donut-skeleton">
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
      <Card data-testid="expense-categories-donut-empty">
        <CardHeader>
          <CardTitle>Expense Categories</CardTitle>
          <CardDescription>YTD breakdown by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center text-muted-foreground">
            No expense data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleCategoryClick = (category: ExpenseCategory) => {
    router.push(`/finance/expenses?category=${category}`);
  };

  // Transform data to have index signature for Recharts compatibility
  const chartData = data.map((item) => ({
    ...item,
    fill: EXPENSE_CATEGORY_COLORS[item.category] || '#6b7280',
  }));

  return (
    <Card data-testid="expense-categories-donut">
      <CardHeader>
        <CardTitle>Expense Categories</CardTitle>
        <CardDescription>
          YTD breakdown by category. Click segment to view expenses.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80" data-testid="expense-categories-chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="amount"
                nameKey="categoryName"
                onClick={(_, index) => handleCategoryClick(data[index].category)}
                cursor="pointer"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={EXPENSE_CATEGORY_COLORS[entry.category] || '#6b7280'}
                    data-testid={`expense-category-${entry.category}`}
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as ExpenseCategoryData;
                    return (
                      <div className="bg-background border rounded-lg shadow-lg p-3">
                        <p className="font-medium mb-1">{data.categoryName}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatAedCurrency(data.amount)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {data.percentage?.toFixed(1)}% of total
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {data.count} transactions
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                formatter={(value, entry) => {
                  const data = entry.payload as ExpenseCategoryData;
                  return (
                    <span className="text-sm">
                      {value} ({data.percentage?.toFixed(0)}%)
                    </span>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend with amounts */}
        <div className="mt-4 space-y-2" data-testid="expense-categories-legend">
          {data.map((category) => (
            <div
              key={category.category}
              className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors"
              onClick={() => handleCategoryClick(category.category)}
              data-testid={`expense-category-legend-${category.category}`}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: EXPENSE_CATEGORY_COLORS[category.category] }}
                />
                <span className="text-sm">{category.categoryName}</span>
              </div>
              <span className="text-sm font-medium">
                {formatAedCurrency(category.amount)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default ExpenseCategoriesDonut;
