'use client';

/**
 * Lease Expiration Bar Chart Component
 * Story 8.3: Occupancy Dashboard
 * AC-6: Stacked bar chart showing lease expirations by month (renewed vs pending)
 *       Click bar navigates to lease list for that month
 */

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import type { LeaseExpirationChart, MonthlyExpiration } from '@/types';

// ============================================================================
// TYPES
// ============================================================================

interface LeaseExpirationBarChartProps {
  data: LeaseExpirationChart | null;
  isLoading?: boolean;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey: string;
  }>;
  label?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const COLORS = {
  renewed: '#22c55e',   // Green for renewed
  pending: '#f59e0b'    // Amber for pending
};

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function ChartSkeleton() {
  return (
    <div className="p-6">
      <Skeleton className="h-6 w-56 mb-6" />
      <div className="h-[300px]">
        <Skeleton className="h-full w-full" />
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const total = payload.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="rounded-lg border bg-background p-3 shadow-md">
      <p className="mb-2 font-medium">{label}</p>
      {payload.map((item, index) => (
        <div key={index} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-sm"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm capitalize">{item.name}</span>
          </div>
          <span className="text-sm font-medium">{item.value}</span>
        </div>
      ))}
      <div className="mt-2 border-t pt-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="text-sm font-semibold">{total}</span>
        </div>
      </div>
    </div>
  );
}

function CustomLegend() {
  return (
    <div className="flex justify-center gap-6 pt-4">
      <div className="flex items-center gap-2">
        <div
          className="h-3 w-3 rounded-sm"
          style={{ backgroundColor: COLORS.renewed }}
        />
        <span className="text-sm text-muted-foreground">Renewed</span>
      </div>
      <div className="flex items-center gap-2">
        <div
          className="h-3 w-3 rounded-sm"
          style={{ backgroundColor: COLORS.pending }}
        />
        <span className="text-sm text-muted-foreground">Pending</span>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function LeaseExpirationBarChart({
  data,
  isLoading = false
}: LeaseExpirationBarChartProps) {
  const router = useRouter();

  // AC-6: Click bar navigates to lease list for that month
  const handleBarClick = useCallback(
    (data: MonthlyExpiration) => {
      if (data?.yearMonth) {
        router.push(`/leases?expiringMonth=${data.yearMonth}`);
      }
    },
    [router]
  );

  if (isLoading || !data) {
    return <ChartSkeleton />;
  }

  const { monthlyData, totalExpiring } = data;

  return (
    <div className="flex flex-col h-full p-6" data-testid="lease-expiration-bar-chart">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-lg">Lease Expirations by Month</h3>
        <div className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{totalExpiring}</span>{' '}
          total expiring
        </div>
      </div>
      <div className="flex-1 min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={monthlyData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              className="stroke-muted"
            />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              className="text-muted-foreground"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              className="text-muted-foreground"
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
            <Bar
              dataKey="renewedCount"
              name="Renewed"
              stackId="a"
              fill={COLORS.renewed}
              radius={[0, 0, 0, 0]}
              className="cursor-pointer"
              onClick={(_, index) => handleBarClick(monthlyData[index])}
            >
              {monthlyData.map((_, index) => (
                <Cell
                  key={`renewed-${index}`}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  data-testid={`bar-renewed-${index}`}
                />
              ))}
            </Bar>
            <Bar
              dataKey="pendingCount"
              name="Pending"
              stackId="a"
              fill={COLORS.pending}
              radius={[4, 4, 0, 0]}
              className="cursor-pointer"
              onClick={(_, index) => handleBarClick(monthlyData[index])}
            >
              {monthlyData.map((_, index) => (
                <Cell
                  key={`pending-${index}`}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  data-testid={`bar-pending-${index}`}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary statistics */}
      <div className="mt-6 grid grid-cols-3 gap-4 border-t pt-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">
            {monthlyData.reduce((sum, m) => sum + m.renewedCount, 0)}
          </p>
          <p className="text-xs text-muted-foreground">Renewed</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-amber-600">
            {monthlyData.reduce((sum, m) => sum + m.pendingCount, 0)}
          </p>
          <p className="text-xs text-muted-foreground">Pending</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold">
            {totalExpiring > 0
              ? (
                  (monthlyData.reduce((sum, m) => sum + m.renewedCount, 0) /
                    totalExpiring) *
                  100
                ).toFixed(0)
              : 0}
            %
          </p>
          <p className="text-xs text-muted-foreground">Renewal Rate</p>
        </div>
      </div>
    </div>
  );
}
