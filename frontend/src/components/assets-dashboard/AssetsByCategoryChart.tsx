'use client';

/**
 * Assets by Category Donut Chart Component
 * Story 8.7: Assets Dashboard (AC-5, AC-11)
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, type PieLabelRenderProps } from 'recharts';
import { useRouter } from 'next/navigation';
import type { AssetsByCategory } from '@/types/assets-dashboard';
import { getCategoryChartColor, formatPercentage } from '@/types/assets-dashboard';

interface AssetsByCategoryChartProps {
  data: AssetsByCategory[] | undefined;
  isLoading?: boolean;
}

export function AssetsByCategoryChart({ data, isLoading }: AssetsByCategoryChartProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <Card data-testid="assets-by-category-loading">
        <CardHeader>
          <CardTitle>Assets by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            <Skeleton className="h-64 w-64 rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card data-testid="assets-by-category-empty">
        <CardHeader>
          <CardTitle>Assets by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No asset data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((item) => ({
    name: item.categoryDisplayName,
    value: item.count,
    percentage: item.percentage,
    category: item.category,
    fill: getCategoryChartColor(item.category),
  }));

  const handleClick = (entry: typeof chartData[0]) => {
    // AC-11: Click segment navigates to asset list filtered by category
    router.push(`/assets?category=${entry.category}`);
  };

  const renderCustomLabel = (props: PieLabelRenderProps) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;

    // Guard against undefined values
    if (
      typeof cx !== 'number' ||
      typeof cy !== 'number' ||
      typeof midAngle !== 'number' ||
      typeof innerRadius !== 'number' ||
      typeof outerRadius !== 'number' ||
      typeof percent !== 'number'
    ) {
      return null;
    }

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // Don't show label for small segments

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Card data-testid="assets-by-category-chart">
      <CardHeader>
        <CardTitle>Assets by Category</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={100}
              innerRadius={60}
              paddingAngle={2}
              dataKey="value"
              onClick={(_, index) => handleClick(chartData[index])}
              className="cursor-pointer"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.fill}
                  className="outline-none focus:outline-none hover:opacity-80 transition-opacity"
                />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const data = payload[0].payload;
                return (
                  <div className="bg-background border rounded-lg shadow-lg p-3">
                    <p className="font-medium">{data.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {data.value} assets ({formatPercentage(data.percentage)})
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Click to view</p>
                  </div>
                );
              }}
            />
            <Legend
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value) => <span className="text-sm">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export default AssetsByCategoryChart;
