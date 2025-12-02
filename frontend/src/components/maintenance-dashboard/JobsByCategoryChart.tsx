'use client';

/**
 * Jobs by Category Horizontal Bar Chart Component (AC-7)
 * Displays horizontal bar chart sorted by count descending
 * Story 8.4: Maintenance Dashboard
 */

import { useRouter } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { JobsByCategory } from '@/types/maintenance-dashboard';
import { MaintenanceJobCategory } from '@/types/maintenance-dashboard';

interface JobsByCategoryChartProps {
  data: JobsByCategory[] | undefined;
  isLoading: boolean;
  onCategoryClick?: (category: MaintenanceJobCategory) => void;
}

export function JobsByCategoryChart({
  data,
  isLoading,
  onCategoryClick
}: JobsByCategoryChartProps) {
  const router = useRouter();

  const handleBarClick = (entry: JobsByCategory) => {
    if (onCategoryClick) {
      onCategoryClick(entry.category);
    } else {
      // Default navigation to work orders list filtered by category
      router.push(`/maintenance/work-orders?category=${entry.category}`);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Jobs by Category</CardTitle>
        </CardHeader>
        <CardContent className="h-[350px]">
          <div className="flex flex-col justify-around h-full gap-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="w-20 h-4" />
                <Skeleton className="h-6" style={{ width: `${(6 - i) * 15}%` }} />
              </div>
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
          <CardTitle className="text-base font-semibold">Jobs by Category</CardTitle>
        </CardHeader>
        <CardContent className="h-[350px] flex items-center justify-center">
          <p className="text-muted-foreground">No data available</p>
        </CardContent>
      </Card>
    );
  }

  // Data comes sorted from backend, but ensure it's sorted by count desc
  const sortedData = [...data].sort((a, b) => b.count - a.count);
  const totalJobs = sortedData.reduce((sum, item) => sum + item.count, 0);

  // Calculate dynamic height based on number of categories
  const chartHeight = Math.max(300, sortedData.length * 40 + 50);

  return (
    <Card data-testid="jobs-by-category-chart">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Jobs by Category</CardTitle>
        <p className="text-sm text-muted-foreground">
          Total: {totalJobs.toLocaleString()} jobs across {sortedData.length} categories
        </p>
      </CardHeader>
      <CardContent style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={sortedData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <YAxis
              type="category"
              dataKey="label"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={90}
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
              radius={[0, 4, 4, 0]}
              onClick={(data) => handleBarClick(data as unknown as JobsByCategory)}
              style={{ cursor: 'pointer' }}
            >
              {sortedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export default JobsByCategoryChart;
