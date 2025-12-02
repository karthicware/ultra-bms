'use client';

/**
 * PM Jobs Chart Component
 * Story 8.1: Executive Summary Dashboard
 * AC-6: Bar chart showing PM jobs by category for next 30 days
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, AlertCircle } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import type { PmJobChartData } from '@/types/dashboard';

// ============================================================================
// TYPES
// ============================================================================

interface PmJobsChartProps {
  data: PmJobChartData[] | null;
  isLoading?: boolean;
  days?: number;
}

// ============================================================================
// CHART CONFIGURATION
// ============================================================================

const CHART_COLORS = {
  scheduled: '#22c55e', // Green
  overdue: '#ef4444'    // Red
};

const CATEGORY_LABELS: Record<string, string> = {
  HVAC: 'HVAC',
  PLUMBING: 'Plumbing',
  ELECTRICAL: 'Electrical',
  GENERAL: 'General',
  CLEANING: 'Cleaning',
  SAFETY: 'Safety',
  LANDSCAPING: 'Landscaping',
  OTHER: 'Other'
};

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function ChartSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-[300px] w-full" />
    </div>
  );
}

// Custom tooltip component
function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload) return null;

  return (
    <div className="rounded-lg border bg-background p-3 shadow-lg">
      <p className="mb-2 font-medium">{CATEGORY_LABELS[label as string] ?? label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">
            {entry.name === 'scheduledCount' ? 'Scheduled' : 'Overdue'}:
          </span>
          <span className="font-medium">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PmJobsChart({
  data,
  isLoading = false,
  days = 30
}: PmJobsChartProps) {
  const hasData = data && data.length > 0;

  // Transform data for the chart
  const chartData = data?.map(item => ({
    ...item,
    category: CATEGORY_LABELS[item.category] ?? item.category
  })) ?? [];

  // Calculate totals
  const totalScheduled = data?.reduce((sum, item) => sum + item.scheduledCount, 0) ?? 0;
  const totalOverdue = data?.reduce((sum, item) => sum + item.overdueCount, 0) ?? 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Upcoming PM Jobs</CardTitle>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-green-500" />
            <span className="text-muted-foreground">Scheduled: {totalScheduled}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-500" />
            <span className="text-muted-foreground">Overdue: {totalOverdue}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <ChartSkeleton />
        ) : hasData ? (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="category"
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  formatter={(value) => (
                    <span className="text-sm">
                      {value === 'scheduledCount' ? 'Scheduled' : 'Overdue'}
                    </span>
                  )}
                />
                <Bar
                  dataKey="scheduledCount"
                  name="scheduledCount"
                  fill={CHART_COLORS.scheduled}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="overdueCount"
                  name="overdueCount"
                  fill={CHART_COLORS.overdue}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-[300px] flex-col items-center justify-center text-center">
            <AlertCircle className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No PM jobs scheduled for the next {days} days
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
