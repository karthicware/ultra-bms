'use client';

/**
 * Jobs by Status Pie Chart Component (AC-5, AC-17)
 * Displays pie/donut chart with click-to-filter functionality
 * Story 8.4: Maintenance Dashboard
 */

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { JobsByStatus } from '@/types/maintenance-dashboard';
import { WorkOrderStatus } from '@/types/work-orders';

interface JobsByStatusChartProps {
  data: JobsByStatus[] | undefined;
  isLoading: boolean;
  onStatusClick?: (status: WorkOrderStatus | undefined) => void;
  selectedStatus?: WorkOrderStatus;
}

/**
 * Custom tooltip for pie chart
 */
const CustomTooltip = ({
  active,
  payload
}: {
  active?: boolean;
  payload?: { payload: JobsByStatus }[];
}) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-background p-3 rounded-lg shadow-lg border">
        <p className="font-semibold">{data.label}</p>
        <p className="text-sm">
          {data.count} jobs ({data.percentage.toFixed(1)}%)
        </p>
      </div>
    );
  }
  return null;
};

export function JobsByStatusChart({
  data,
  isLoading,
  onStatusClick,
  selectedStatus
}: JobsByStatusChartProps) {
  const handleClick = useCallback(
    (entry: JobsByStatus) => {
      if (onStatusClick) {
        // Toggle filter: if same status clicked, clear filter
        if (selectedStatus === entry.status) {
          onStatusClick(undefined);
        } else {
          onStatusClick(entry.status);
        }
      }
    },
    [onStatusClick, selectedStatus]
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Jobs by Status</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <Skeleton className="h-48 w-48 rounded-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Jobs by Status</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">No data available</p>
        </CardContent>
      </Card>
    );
  }

  const totalJobs = data.reduce((sum, item) => sum + item.count, 0);

  // Prepare chart data with fills
  const chartData = data.map((item) => ({
    ...item,
    fill: item.color
  }));

  return (
    <Card data-testid="jobs-by-status-chart">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Jobs by Status</CardTitle>
        <p className="text-sm text-muted-foreground">
          Total: {totalJobs.toLocaleString()} jobs
          {selectedStatus && (
            <button
              onClick={() => onStatusClick?.(undefined)}
              className="ml-2 text-primary hover:underline"
              data-testid="clear-status-filter"
            >
              Clear filter
            </button>
          )}
        </p>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="count"
              nameKey="label"
              onClick={(_, index) => handleClick(data[index])}
              style={{ cursor: 'pointer' }}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  opacity={selectedStatus && selectedStatus !== entry.status ? 0.4 : 1}
                  stroke={selectedStatus === entry.status ? '#000' : undefined}
                  strokeWidth={selectedStatus === entry.status ? 2 : 0}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => {
                const item = data.find((d) => d.label === value);
                return (
                  <span className="text-sm">
                    {value} ({item?.count || 0})
                  </span>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export default JobsByStatusChart;
