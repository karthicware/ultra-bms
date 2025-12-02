'use client';

/**
 * Jobs by Priority Bar Chart Component (AC-6)
 * Displays bar chart with color gradient from green (LOW) to red (URGENT)
 * Story 8.4: Maintenance Dashboard
 */

import { useRouter } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { JobsByPriority } from '@/types/maintenance-dashboard';
import { MaintenanceJobPriority } from '@/types/maintenance-dashboard';

interface JobsByPriorityChartProps {
  data: JobsByPriority[] | undefined;
  isLoading: boolean;
  onPriorityClick?: (priority: MaintenanceJobPriority) => void;
}

export function JobsByPriorityChart({
  data,
  isLoading,
  onPriorityClick
}: JobsByPriorityChartProps) {
  const router = useRouter();

  const handleBarClick = (entry: JobsByPriority) => {
    if (onPriorityClick) {
      onPriorityClick(entry.priority);
    } else {
      // Default navigation to work orders list filtered by priority
      router.push(`/maintenance/work-orders?priority=${entry.priority}`);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Jobs by Priority</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <div className="flex items-end justify-around h-full gap-4 pb-8">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="w-16" style={{ height: `${(i + 1) * 25}%` }} />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Jobs by Priority</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">No data available</p>
        </CardContent>
      </Card>
    );
  }

  const totalJobs = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card data-testid="jobs-by-priority-chart">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Jobs by Priority</CardTitle>
        <p className="text-sm text-muted-foreground">
          Total: {totalJobs.toLocaleString()} jobs
        </p>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              formatter={(value: number) => [value, 'Jobs']}
              cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
            />
            <Bar
              dataKey="count"
              radius={[4, 4, 0, 0]}
              onClick={(data) => handleBarClick(data as unknown as JobsByPriority)}
              style={{ cursor: 'pointer' }}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export default JobsByPriorityChart;
