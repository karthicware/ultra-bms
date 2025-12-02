'use client';

/**
 * PDC Status Card Component
 * Story 8.6: Finance Dashboard
 * AC-9: PDC Status card with due dates and clearance status
 * AC-21: All currency values formatted in AED
 * AC-22: All interactive elements have data-testid attributes
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { CalendarDays, Calendar, Clock, CreditCard } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  PdcStatusSummary,
  formatAedCurrency,
  formatCompactCurrency,
} from '@/types/finance-dashboard';
import { cn } from '@/lib/utils';

interface PdcStatusCardProps {
  data: PdcStatusSummary | undefined;
  isLoading: boolean;
}

const pdcSections = [
  {
    key: 'thisWeek',
    title: 'Due This Week',
    icon: CalendarDays,
    countKey: 'dueThisWeekCount' as const,
    amountKey: 'dueThisWeekAmount' as const,
    filter: 'this-week',
    variant: 'warning' as const,
  },
  {
    key: 'thisMonth',
    title: 'Due This Month',
    icon: Calendar,
    countKey: 'dueThisMonthCount' as const,
    amountKey: 'dueThisMonthAmount' as const,
    filter: 'this-month',
    variant: 'default' as const,
  },
  {
    key: 'awaitingClearance',
    title: 'Awaiting Clearance',
    icon: Clock,
    countKey: 'awaitingClearanceCount' as const,
    amountKey: 'awaitingClearanceAmount' as const,
    filter: 'awaiting-clearance',
    variant: 'info' as const,
  },
];

const variantStyles = {
  warning: 'bg-amber-50 border-amber-200 hover:bg-amber-100',
  default: 'bg-slate-50 border-slate-200 hover:bg-slate-100',
  info: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
};

const iconStyles = {
  warning: 'text-amber-600',
  default: 'text-slate-600',
  info: 'text-blue-600',
};

export function PdcStatusCard({ data, isLoading }: PdcStatusCardProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <Card data-testid="pdc-status-skeleton">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card data-testid="pdc-status-empty">
        <CardHeader>
          <CardTitle>PDC Status</CardTitle>
          <CardDescription>Post-dated cheque overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-40 flex items-center justify-center text-muted-foreground">
            No PDC data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleSectionClick = (filter: string) => {
    router.push(`/finance/pdcs?status=${filter}`);
  };

  const handleViewAll = () => {
    router.push('/finance/pdcs');
  };

  return (
    <Card data-testid="pdc-status-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            PDC Status
          </CardTitle>
          <CardDescription>Post-dated cheque overview</CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleViewAll}
          data-testid="pdc-status-view-all"
        >
          View All
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Summary */}
        <div
          className="p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors"
          onClick={handleViewAll}
          data-testid="pdc-status-total"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total PDCs</p>
              <p className="text-xl font-bold">{data.totalPdcsCount} PDCs</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-xl font-bold">
                {formatCompactCurrency(data.totalPdcsAmount)}
              </p>
            </div>
          </div>
        </div>

        {/* Status Sections */}
        <div className="space-y-3">
          {pdcSections.map((section) => {
            const count = data[section.countKey];
            const amount = data[section.amountKey];
            const Icon = section.icon;

            return (
              <div
                key={section.key}
                className={cn(
                  'p-3 rounded-lg border cursor-pointer transition-colors',
                  variantStyles[section.variant]
                )}
                onClick={() => handleSectionClick(section.filter)}
                data-testid={`pdc-status-${section.key}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className={cn('h-5 w-5', iconStyles[section.variant])} />
                    <div>
                      <p className="text-sm font-medium">{section.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {count} {count === 1 ? 'cheque' : 'cheques'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatAedCurrency(amount)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default PdcStatusCard;
