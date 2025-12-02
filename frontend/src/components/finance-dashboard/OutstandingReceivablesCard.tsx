'use client';

/**
 * Outstanding Receivables Card Component
 * Story 8.6: Finance Dashboard
 * AC-7: Outstanding Receivables card with aging breakdown
 * AC-21: All currency values formatted in AED
 * AC-22: All interactive elements have data-testid attributes
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { useRouter } from 'next/navigation';
import {
  OutstandingReceivables,
  FINANCE_CHART_COLORS,
  formatAedCurrency,
  formatCompactCurrency,
} from '@/types/finance-dashboard';
import { cn } from '@/lib/utils';

interface OutstandingReceivablesCardProps {
  data: OutstandingReceivables | undefined;
  isLoading: boolean;
}

const agingBuckets = [
  {
    key: 'current',
    label: 'Current (0-30 days)',
    color: FINANCE_CHART_COLORS.current,
    amountKey: 'currentAmount' as const,
    countKey: 'currentCount' as const,
    percentageKey: 'currentPercentage' as const,
    filter: 'current',
  },
  {
    key: 'thirtyPlus',
    label: '30+ Days',
    color: FINANCE_CHART_COLORS.thirtyPlus,
    amountKey: 'thirtyPlusAmount' as const,
    countKey: 'thirtyPlusCount' as const,
    percentageKey: 'thirtyPlusPercentage' as const,
    filter: '30plus',
  },
  {
    key: 'sixtyPlus',
    label: '60+ Days',
    color: FINANCE_CHART_COLORS.sixtyPlus,
    amountKey: 'sixtyPlusAmount' as const,
    countKey: 'sixtyPlusCount' as const,
    percentageKey: 'sixtyPlusPercentage' as const,
    filter: '60plus',
  },
  {
    key: 'ninetyPlus',
    label: '90+ Days',
    color: FINANCE_CHART_COLORS.ninetyPlus,
    amountKey: 'ninetyPlusAmount' as const,
    countKey: 'ninetyPlusCount' as const,
    percentageKey: 'ninetyPlusPercentage' as const,
    filter: '90plus',
  },
];

export function OutstandingReceivablesCard({
  data,
  isLoading,
}: OutstandingReceivablesCardProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <Card data-testid="outstanding-receivables-skeleton">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-12 w-32 mb-4" />
          <Skeleton className="h-6 w-full mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card data-testid="outstanding-receivables-empty">
        <CardHeader>
          <CardTitle>Outstanding Receivables</CardTitle>
          <CardDescription>Aging breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-40 flex items-center justify-center text-muted-foreground">
            No receivables data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleAgingClick = (filter: string) => {
    router.push(`/finance/invoices?aging=${filter}`);
  };

  const handleTotalClick = () => {
    router.push('/finance/invoices?status=outstanding');
  };

  return (
    <Card data-testid="outstanding-receivables-card">
      <CardHeader>
        <CardTitle>Outstanding Receivables</CardTitle>
        <CardDescription>
          {data.totalInvoiceCount} unpaid invoices. Click to view details.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Total Outstanding */}
        <div
          className="mb-4 cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors -m-2"
          onClick={handleTotalClick}
          data-testid="outstanding-receivables-total"
        >
          <p className="text-sm text-muted-foreground">Total Outstanding</p>
          <p className="text-3xl font-bold">
            {formatCompactCurrency(data.totalOutstanding)}
          </p>
        </div>

        {/* Horizontal Stacked Bar */}
        <div
          className="flex h-4 rounded-full overflow-hidden mb-4"
          data-testid="outstanding-receivables-bar"
        >
          {agingBuckets.map((bucket) => {
            const percentage = data[bucket.percentageKey] || 0;
            if (percentage === 0) return null;
            return (
              <div
                key={bucket.key}
                className="h-full cursor-pointer hover:opacity-80 transition-opacity"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: bucket.color,
                }}
                onClick={() => handleAgingClick(bucket.filter)}
                data-testid={`outstanding-receivables-bar-${bucket.key}`}
              />
            );
          })}
        </div>

        {/* Aging Breakdown List */}
        <div className="space-y-3" data-testid="outstanding-receivables-breakdown">
          {agingBuckets.map((bucket) => {
            const amount = data[bucket.amountKey];
            const count = data[bucket.countKey];
            const percentage = data[bucket.percentageKey];

            return (
              <div
                key={bucket.key}
                className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors -mx-2"
                onClick={() => handleAgingClick(bucket.filter)}
                data-testid={`outstanding-receivables-row-${bucket.key}`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: bucket.color }}
                  />
                  <div>
                    <p className="text-sm font-medium">{bucket.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {count} invoice{count !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{formatAedCurrency(amount)}</p>
                  <p className="text-xs text-muted-foreground">
                    {percentage?.toFixed(1) || 0}%
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default OutstandingReceivablesCard;
