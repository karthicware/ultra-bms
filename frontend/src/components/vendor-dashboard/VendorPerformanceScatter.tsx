'use client';

/**
 * Vendor Performance Scatter Plot Component
 * Story 8.5: Vendor Dashboard (AC-6, AC-14, AC-15, AC-17)
 */

import { Skeleton } from '@/components/ui/skeleton';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
  Cell,
} from 'recharts';
import { useRouter } from 'next/navigation';
import type { VendorPerformanceSnapshot } from '@/types/vendor-dashboard';
import {
  PERFORMANCE_TIER_COLORS,
  PERFORMANCE_TIER_LABELS,
  calculateBubbleSize,
  BUBBLE_SIZE,
} from '@/types/vendor-dashboard';

interface VendorPerformanceScatterProps {
  data: VendorPerformanceSnapshot[] | undefined;
  isLoading?: boolean;
}

interface TooltipPayload {
  payload: VendorPerformanceSnapshot;
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) => {
  if (active && payload && payload.length > 0) {
    const vendor = payload[0].payload;
    return (
      <div
        className="rounded-lg border bg-background p-3 shadow-sm"
        data-testid="vendor-scatter-tooltip"
      >
        <div className="grid gap-1">
          <p className="text-sm font-semibold">{vendor.vendorName}</p>
          <p className="text-sm text-muted-foreground">
            SLA Compliance: {vendor.slaCompliance.toFixed(1)}%
          </p>
          <p className="text-sm text-muted-foreground">
            Rating: ★ {vendor.rating.toFixed(1)}
          </p>
          <p className="text-sm text-muted-foreground">Jobs Completed: {vendor.jobCount}</p>
          <div className="mt-1 flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: PERFORMANCE_TIER_COLORS[vendor.performanceTier] }}
            />
            <span className="text-xs text-muted-foreground">
              {PERFORMANCE_TIER_LABELS[vendor.performanceTier]}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function VendorPerformanceScatter({ data, isLoading }: VendorPerformanceScatterProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="space-y-1 mb-6">
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-full max-w-sm" />
        </div>
        <div className="h-[350px] flex items-center justify-center">
          <Skeleton className="h-full w-full" />
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="p-6">
        <div className="space-y-1 mb-6">
          <h3 className="font-semibold text-lg">Vendor Performance Snapshot</h3>
          <p className="text-sm text-muted-foreground">
            SLA compliance vs customer rating (bubble size = jobs completed)
          </p>
        </div>
        <div className="h-[350px] flex items-center justify-center text-muted-foreground">
          No vendor performance data available
        </div>
      </div>
    );
  }

  // Calculate max jobs for bubble size scaling
  const maxJobs = Math.max(...data.map((v) => v.jobCount), BUBBLE_SIZE.DEFAULT_MAX_JOBS);

  // Add bubble size to each data point
  const chartData = data.map((vendor) => ({
    ...vendor,
    z: calculateBubbleSize(vendor.jobCount, maxJobs),
  }));

  const handlePointClick = (vendor: VendorPerformanceSnapshot) => {
    router.push(`/vendors/${vendor.vendorId}`);
  };

  return (
    <div className="p-6 h-full flex flex-col" data-testid="vendor-performance-scatter-chart">
      <div className="space-y-1 mb-6">
        <h3 className="font-semibold text-lg">Vendor Performance Snapshot</h3>
        <p className="text-sm text-muted-foreground">
          SLA compliance vs customer rating (bubble size = jobs completed)
        </p>
      </div>
      <div className="flex-1 min-h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="slaCompliance"
              name="SLA Compliance"
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
              label={{
                value: 'SLA Compliance %',
                position: 'insideBottom',
                offset: -10,
              }}
            />
            <YAxis
              type="number"
              dataKey="rating"
              name="Rating"
              domain={[0, 5]}
              label={{
                value: 'Rating',
                angle: -90,
                position: 'insideLeft',
                offset: 0,
              }}
            />
            <ZAxis type="number" dataKey="z" range={[BUBBLE_SIZE.MIN, BUBBLE_SIZE.MAX]} />
            <Tooltip content={<CustomTooltip />} />
            <Scatter
              name="Vendors"
              data={chartData}
              cursor="pointer"
              onClick={(props) => handlePointClick(props.payload as VendorPerformanceSnapshot)}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={PERFORMANCE_TIER_COLORS[entry.performanceTier]}
                  fillOpacity={0.7}
                  stroke={PERFORMANCE_TIER_COLORS[entry.performanceTier]}
                  strokeWidth={1}
                  data-testid={`vendor-scatter-point-${entry.vendorId}`}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap justify-center gap-4">
        {(['GREEN', 'YELLOW', 'RED'] as const).map((tier) => (
          <div key={tier} className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: PERFORMANCE_TIER_COLORS[tier] }}
            />
            <span className="text-sm text-muted-foreground">
              {PERFORMANCE_TIER_LABELS[tier]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default VendorPerformanceScatter;
