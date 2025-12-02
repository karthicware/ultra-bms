'use client';

/**
 * Lease Expiration Timeline Component
 * Story 8.1: Executive Summary Dashboard
 * AC-7: Timeline showing lease expirations by month for next 12 months
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, AlertTriangle, Users } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { cn } from '@/lib/utils';
import type { LeaseExpirationTimeline as LeaseExpirationTimelineData } from '@/types/dashboard';

// ============================================================================
// TYPES
// ============================================================================

interface LeaseExpirationTimelineProps {
  data: LeaseExpirationTimelineData[] | null;
  isLoading?: boolean;
  months?: number;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const RENEWAL_THRESHOLD = 5; // Highlight months with > 5 expirations

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function TimelineSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-[250px] w-full" />
    </div>
  );
}

// Custom tooltip component
function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number; payload: LeaseExpirationTimelineData }>;
  label?: string;
}) {
  if (!active || !payload || !payload[0]) return null;

  const data = payload[0].payload;

  return (
    <div className="rounded-lg border bg-background p-3 shadow-lg">
      <p className="font-medium">{data.monthName} {data.year}</p>
      <div className="mt-2 flex items-center gap-2 text-sm">
        <Users className="h-4 w-4 text-primary" />
        <span>{data.expirationCount} lease{data.expirationCount !== 1 ? 's' : ''} expiring</span>
      </div>
      {data.needsRenewalPlanning && (
        <div className="mt-2 flex items-center gap-2 text-sm text-amber-600">
          <AlertTriangle className="h-4 w-4" />
          <span>High volume - plan renewals</span>
        </div>
      )}
    </div>
  );
}

// Custom dot component for highlighting high-volume months
function CustomDot(props: {
  cx?: number;
  cy?: number;
  payload?: LeaseExpirationTimelineData;
}) {
  const { cx, cy, payload } = props;

  if (!cx || !cy || !payload) return null;

  if (payload.needsRenewalPlanning) {
    return (
      <circle
        cx={cx}
        cy={cy}
        r={6}
        fill="#f59e0b"
        stroke="#fff"
        strokeWidth={2}
      />
    );
  }

  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill="#3b82f6"
      stroke="#fff"
      strokeWidth={2}
    />
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function LeaseExpirationTimeline({
  data,
  isLoading = false,
  months = 12
}: LeaseExpirationTimelineProps) {
  const hasData = data && data.length > 0;

  // Calculate totals
  const totalExpirations = data?.reduce((sum, item) => sum + item.expirationCount, 0) ?? 0;
  const highVolumeMonths = data?.filter(item => item.needsRenewalPlanning).length ?? 0;

  // Transform data for display
  const chartData = data?.map(item => ({
    ...item,
    label: `${item.monthName} ${item.year.toString().slice(-2)}`
  })) ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Lease Expirations</CardTitle>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="font-medium">
            {totalExpirations} total
          </Badge>
          {highVolumeMonths > 0 && (
            <Badge variant="outline" className="border-amber-500 text-amber-600">
              <AlertTriangle className="mr-1 h-3 w-3" />
              {highVolumeMonths} high volume
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <TimelineSkeleton />
        ) : hasData ? (
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorExpirations" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine
                  y={RENEWAL_THRESHOLD}
                  stroke="#f59e0b"
                  strokeDasharray="5 5"
                  label={{
                    value: 'High Volume',
                    position: 'right',
                    fill: '#f59e0b',
                    fontSize: 11
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="expirationCount"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#colorExpirations)"
                  dot={<CustomDot />}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-[250px] flex-col items-center justify-center text-center">
            <FileText className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No lease expirations in the next {months} months
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
