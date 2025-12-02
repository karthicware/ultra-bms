'use client';

/**
 * KPI Card Component
 * Story 8.1: Executive Summary Dashboard
 * AC-1 to AC-4: Display KPI metrics with trend indicators
 */

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { KpiCard as KpiCardData, ReceivablesKpi, TrendDirection } from '@/types/dashboard';
import { formatDashboardCurrency, formatDashboardPercentage } from '@/types/dashboard';

// ============================================================================
// TYPES
// ============================================================================

interface KpiCardProps {
  title: string;
  data: KpiCardData | ReceivablesKpi;
  icon?: React.ReactNode;
  isLoading?: boolean;
  higherIsBetter?: boolean;
  showAging?: boolean;
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function TrendIndicator({
  trend,
  changePercent,
  higherIsBetter = true
}: {
  trend: TrendDirection;
  changePercent?: number | null;
  higherIsBetter?: boolean;
}) {
  if (!changePercent && changePercent !== 0) {
    return null;
  }

  const isPositive = trend === 'UP';
  const isGood = higherIsBetter ? isPositive : !isPositive;

  const Icon = trend === 'UP' ? ArrowUp : trend === 'DOWN' ? ArrowDown : Minus;
  const colorClass = isGood ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';

  return (
    <div className={cn('flex items-center gap-1 text-sm font-medium', colorClass)}>
      <Icon className="h-4 w-4" />
      <span>{formatDashboardPercentage(Math.abs(changePercent))}</span>
    </div>
  );
}

function AgingBreakdown({
  aging
}: {
  aging: ReceivablesKpi['aging'];
}) {
  const agingItems = [
    { label: 'Current', value: aging.current, color: 'bg-green-500' },
    { label: '30+', value: aging.thirtyPlus, color: 'bg-yellow-500' },
    { label: '60+', value: aging.sixtyPlus, color: 'bg-orange-500' },
    { label: '90+', value: aging.ninetyPlus, color: 'bg-red-500' }
  ];

  const total = aging.current + aging.thirtyPlus + aging.sixtyPlus + aging.ninetyPlus;

  return (
    <div className="mt-3 space-y-2">
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
        {agingItems.map((item, index) => {
          const width = total > 0 ? (item.value / total) * 100 : 0;
          return width > 0 ? (
            <div
              key={index}
              className={cn('h-full', item.color)}
              style={{ width: `${width}%` }}
            />
          ) : null;
        })}
      </div>
      <div className="grid grid-cols-4 gap-1 text-xs text-muted-foreground">
        {agingItems.map((item, index) => (
          <div key={index} className="text-center">
            <div className={cn('mx-auto mb-0.5 h-2 w-2 rounded-full', item.color)} />
            <div className="font-medium text-foreground">
              {formatDashboardCurrency(item.value)}
            </div>
            <div>{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function KpiCard({
  title,
  data,
  icon,
  isLoading = false,
  higherIsBetter = true,
  showAging = false
}: KpiCardProps) {
  if (isLoading) {
    return (
      <Card className="p-4">
        <CardContent className="p-0">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
          <Skeleton className="mt-2 h-8 w-32" />
          <Skeleton className="mt-2 h-4 w-16" />
        </CardContent>
      </Card>
    );
  }

  // Determine if this is a receivables KPI with aging
  const isReceivablesKpi = 'totalAmount' in data && 'aging' in data;
  const receivablesData = isReceivablesKpi ? (data as ReceivablesKpi) : null;
  const kpiData = !isReceivablesKpi ? (data as KpiCardData) : null;

  // Get the main value to display
  const mainValue = isReceivablesKpi
    ? formatDashboardCurrency(receivablesData!.totalAmount)
    : kpiData!.formattedValue;

  const trend = data.trend;
  const changePercent = data.changePercentage;

  return (
    <Card className="p-4 transition-shadow hover:shadow-md">
      <CardContent className="p-0">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          {icon && (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              {icon}
            </div>
          )}
        </div>

        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold">{mainValue}</span>
          <TrendIndicator
            trend={trend}
            changePercent={changePercent}
            higherIsBetter={higherIsBetter}
          />
        </div>

        {showAging && receivablesData && (
          <AgingBreakdown aging={receivablesData.aging} />
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// KPI CARDS GRID
// ============================================================================

interface KpiCardsGridProps {
  kpis: {
    netProfitLoss: KpiCardData;
    occupancyRate: KpiCardData;
    overdueMaintenance: KpiCardData;
    outstandingReceivables: ReceivablesKpi;
  } | null;
  isLoading?: boolean;
}

export function KpiCardsGrid({ kpis, isLoading }: KpiCardsGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        title="Net Profit/Loss"
        data={kpis?.netProfitLoss ?? {} as KpiCardData}
        isLoading={isLoading || !kpis}
        higherIsBetter={true}
      />
      <KpiCard
        title="Occupancy Rate"
        data={kpis?.occupancyRate ?? {} as KpiCardData}
        isLoading={isLoading || !kpis}
        higherIsBetter={true}
      />
      <KpiCard
        title="Overdue Maintenance"
        data={kpis?.overdueMaintenance ?? {} as KpiCardData}
        isLoading={isLoading || !kpis}
        higherIsBetter={false}
      />
      <KpiCard
        title="Outstanding Receivables"
        data={kpis?.outstandingReceivables ?? {} as ReceivablesKpi}
        isLoading={isLoading || !kpis}
        higherIsBetter={false}
        showAging={true}
      />
    </div>
  );
}
