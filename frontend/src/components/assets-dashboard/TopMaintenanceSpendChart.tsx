'use client';

/**
 * Top 5 Assets by Maintenance Spend Horizontal Bar Chart Component
 * Story 8.7: Assets Dashboard (AC-6, AC-12)
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useRouter } from 'next/navigation';
import type { TopMaintenanceSpend } from '@/types/assets-dashboard';
import { formatAssetDashboardCurrency, getCategoryChartColor } from '@/types/assets-dashboard';

interface TopMaintenanceSpendChartProps {
  data: TopMaintenanceSpend[] | undefined;
  isLoading?: boolean;
}

export function TopMaintenanceSpendChart({ data, isLoading }: TopMaintenanceSpendChartProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <Card data-testid="top-maintenance-spend-loading">
        <CardHeader>
          <CardTitle>Top 5 Assets by Maintenance Spend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-6 flex-1" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card data-testid="top-maintenance-spend-empty">
        <CardHeader>
          <CardTitle>Top 5 Assets by Maintenance Spend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            No maintenance spend data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((item) => ({
    name: item.assetName.length > 20 ? `${item.assetName.substring(0, 20)}...` : item.assetName,
    fullName: item.assetName,
    value: item.maintenanceCost,
    assetId: item.assetId,
    assetNumber: item.assetNumber,
    category: item.category,
    categoryDisplayName: item.categoryDisplayName,
    fill: getCategoryChartColor(item.category),
  }));

  const handleClick = (entry: typeof chartData[0]) => {
    // AC-12: Click bar navigates to asset details
    router.push(`/assets/${entry.assetId}`);
  };

  return (
    <Card data-testid="top-maintenance-spend-chart">
      <CardHeader>
        <CardTitle>Top 5 Assets by Maintenance Spend</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <XAxis
              type="number"
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={150}
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const data = payload[0].payload;
                return (
                  <div className="bg-background border rounded-lg shadow-lg p-3">
                    <p className="font-medium">{data.fullName}</p>
                    <p className="text-xs text-muted-foreground">{data.assetNumber}</p>
                    <p className="text-sm mt-1">
                      <span className="text-muted-foreground">Category: </span>
                      {data.categoryDisplayName}
                    </p>
                    <p className="text-sm font-medium mt-1">
                      {formatAssetDashboardCurrency(data.value)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Click to view details</p>
                  </div>
                );
              }}
            />
            <Bar
              dataKey="value"
              radius={[0, 4, 4, 0]}
              onClick={(_, index) => handleClick(chartData[index])}
              className="cursor-pointer"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.fill}
                  className="hover:opacity-80 transition-opacity"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export default TopMaintenanceSpendChart;
