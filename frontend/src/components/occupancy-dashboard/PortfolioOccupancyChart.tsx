'use client';

/**
 * Portfolio Occupancy Chart Component
 * Story 8.3: Occupancy Dashboard
 * AC-5: Donut chart showing occupancy breakdown by status
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import type { PortfolioOccupancyChart as ChartData, OccupancySegment } from '@/types';
import { getOccupancyStatusColor } from '@/types';

// ============================================================================
// TYPES
// ============================================================================

interface PortfolioOccupancyChartProps {
  data: ChartData | null;
  isLoading?: boolean;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: OccupancySegment;
  }>;
}

interface CustomLegendProps {
  payload?: Array<{
    value: string;
    color: string;
    payload: OccupancySegment;
  }>;
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent>
        <div className="flex h-[300px] items-center justify-center">
          <Skeleton className="h-48 w-48 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const segment = payload[0].payload;

  return (
    <div className="rounded-lg border bg-background p-3 shadow-md">
      <div className="flex items-center gap-2">
        <div
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: segment.color }}
        />
        <span className="font-medium">{segment.status}</span>
      </div>
      <div className="mt-1 text-sm text-muted-foreground">
        <p>{segment.count} units</p>
        <p>{segment.percentage.toFixed(1)}%</p>
      </div>
    </div>
  );
}

function CustomLegend({ payload }: CustomLegendProps) {
  if (!payload) return null;

  return (
    <div className="flex flex-wrap justify-center gap-4 pt-4">
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm text-muted-foreground">
            {entry.value} ({entry.payload.count})
          </span>
        </div>
      ))}
    </div>
  );
}

// Center label for donut chart
function CenterLabel({ totalUnits }: { totalUnits: number }) {
  return (
    <text
      x="50%"
      y="50%"
      textAnchor="middle"
      dominantBaseline="middle"
      className="fill-foreground"
    >
      <tspan x="50%" dy="-0.5em" className="text-2xl font-bold">
        {totalUnits}
      </tspan>
      <tspan x="50%" dy="1.5em" className="text-sm fill-muted-foreground">
        Total Units
      </tspan>
    </text>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PortfolioOccupancyChart({
  data,
  isLoading = false
}: PortfolioOccupancyChartProps) {
  if (isLoading || !data) {
    return <ChartSkeleton />;
  }

  // Ensure segments have colors (use helper function if not provided by backend)
  const chartData = data.segments.map((segment) => ({
    ...segment,
    color: segment.color || getOccupancyStatusColor(segment.status)
  }));

  return (
    <Card data-testid="portfolio-occupancy-chart">
      <CardHeader>
        <CardTitle className="text-lg">Portfolio Occupancy</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                label={({ percent }) => `${((percent ?? 0) * 100).toFixed(1)}%`}
                labelLine={false}
              >
                {chartData.map((segment, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={segment.color}
                    stroke="transparent"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
              {/* Center label showing total units */}
              <text
                x="50%"
                y="45%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-foreground text-2xl font-bold"
              >
                {data.totalUnits}
              </text>
              <text
                x="50%"
                y="55%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-muted-foreground text-sm"
              >
                Total Units
              </text>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Summary below chart */}
        <div className="mt-4 grid grid-cols-2 gap-4 border-t pt-4 sm:grid-cols-4">
          {chartData.map((segment) => (
            <div key={segment.status} className="text-center">
              <div
                className="mx-auto mb-1 h-2 w-8 rounded-full"
                style={{ backgroundColor: segment.color }}
              />
              <p className="text-lg font-semibold">{segment.count}</p>
              <p className="text-xs text-muted-foreground">{segment.status}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
