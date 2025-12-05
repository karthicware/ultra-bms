'use client';

/**
 * Jobs by Specialization Bar Chart Component
 * Story 8.5: Vendor Dashboard (AC-5)
 */

import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useRouter } from 'next/navigation';
import type { JobsBySpecialization } from '@/types/vendor-dashboard';
import { SPECIALIZATION_COLORS, SPECIALIZATION_LABELS } from '@/types/vendor-dashboard';

interface JobsBySpecializationChartProps {
  data: JobsBySpecialization[] | undefined;
  isLoading?: boolean;
}

interface TooltipPayload {
  payload: JobsBySpecialization;
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) => {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload;
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <div className="grid gap-1">
          <p className="text-sm font-medium">{data.displayName}</p>
          <p className="text-sm text-muted-foreground">{data.jobCount} jobs completed</p>
          <p className="text-sm text-muted-foreground">{data.vendorCount} active vendors</p>
        </div>
      </div>
    );
  }
  return null;
};

export function JobsBySpecializationChart({ data, isLoading }: JobsBySpecializationChartProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="space-y-1 mb-6">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="h-[300px] flex items-center justify-center">
          <Skeleton className="h-full w-full" />
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="p-6">
        <div className="space-y-1 mb-6">
          <h3 className="font-semibold text-lg">Jobs by Specialization</h3>
          <p className="text-sm text-muted-foreground">Distribution of completed work across service categories</p>
        </div>
        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
          No job data available
        </div>
      </div>
    );
  }

  const chartData = data.map((item) => ({
    ...item,
    name: item.displayName || SPECIALIZATION_LABELS[item.specialization || 'OTHER'] || 'Other',
    fill: SPECIALIZATION_COLORS[item.specialization || 'OTHER'] || '#6b7280',
  }));

  const handleBarClick = (entry: (typeof chartData)[number]) => {
    if (entry.specialization) {
      router.push(`/vendors?category=${entry.specialization}`);
    }
  };

  return (
    <div className="p-6 h-full flex flex-col" data-testid="vendor-jobs-by-specialization-chart">
      <div className="space-y-1 mb-6">
        <h3 className="font-semibold text-lg">Jobs by Specialization</h3>
        <p className="text-sm text-muted-foreground">Distribution of completed work across service categories</p>
      </div>
      <div className="flex-1 min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
            <XAxis type="number" />
            <YAxis
              dataKey="name"
              type="category"
              width={100}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="jobCount"
              name="Jobs"
              radius={[0, 4, 4, 0]}
              cursor="pointer"
              onClick={(_data, index) => handleBarClick(chartData[index])}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.fill}
                  data-testid={`vendor-specialization-bar-${entry.specialization}`}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default JobsBySpecializationChart;
