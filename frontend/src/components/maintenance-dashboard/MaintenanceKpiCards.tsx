'use client';

/**
 * Maintenance KPI Cards Component (AC-1, AC-2, AC-3, AC-4)
 * Displays 4 KPI cards: Active Jobs, Overdue Jobs, Pending Jobs, Completed This Month
 * Story 8.4: Maintenance Dashboard
 */

import { useRouter } from 'next/navigation';
import { Wrench, AlertTriangle, Clock, CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { MaintenanceKpi } from '@/types/maintenance-dashboard';

interface MaintenanceKpiCardsProps {
  kpis: MaintenanceKpi | undefined;
  isLoading: boolean;
  onKpiClick?: (kpiType: 'active' | 'overdue' | 'pending' | 'completed') => void;
}

export function MaintenanceKpiCards({ kpis, isLoading, onKpiClick }: MaintenanceKpiCardsProps) {
  const router = useRouter();

  const handleClick = (kpiType: 'active' | 'overdue' | 'pending' | 'completed') => {
    if (onKpiClick) {
      onKpiClick(kpiType);
    } else {
      // Default navigation to work orders list with filter
      const filterMap: Record<string, string> = {
        active: 'status=OPEN,ASSIGNED,IN_PROGRESS',
        overdue: 'overdue=true',
        pending: 'status=OPEN',
        completed: 'status=COMPLETED,CLOSED'
      };
      router.push(`/maintenance/work-orders?${filterMap[kpiType]}`);
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      id: 'active',
      title: 'Active Jobs',
      value: kpis?.activeJobs ?? 0,
      icon: Wrench,
      iconColor: 'text-blue-500',
      bgColor: 'bg-blue-50',
      description: 'Non-completed work orders',
      testId: 'kpi-card-active-jobs'
    },
    {
      id: 'overdue',
      title: 'Overdue Jobs',
      value: kpis?.overdueJobs ?? 0,
      icon: AlertTriangle,
      iconColor: 'text-red-500',
      bgColor: 'bg-red-50',
      highlight: (kpis?.overdueJobs ?? 0) > 0,
      description: 'Past scheduled date',
      testId: 'kpi-card-overdue-jobs'
    },
    {
      id: 'pending',
      title: 'Pending Jobs',
      value: kpis?.pendingJobs ?? 0,
      icon: Clock,
      iconColor: 'text-amber-500',
      bgColor: 'bg-amber-50',
      description: 'Awaiting assignment',
      testId: 'kpi-card-pending-jobs'
    },
    {
      id: 'completed',
      title: 'Completed (This Month)',
      value: kpis?.completedThisMonth ?? 0,
      icon: CheckCircle2,
      iconColor: 'text-green-500',
      bgColor: 'bg-green-50',
      trend: kpis?.monthOverMonthChange,
      previousValue: kpis?.completedPreviousMonth,
      description: 'Jobs finished this month',
      testId: 'kpi-card-completed-jobs'
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const hasPositiveTrend = card.trend !== undefined && card.trend !== null && card.trend > 0;
        const hasNegativeTrend = card.trend !== undefined && card.trend !== null && card.trend < 0;

        return (
          <Card
            key={card.id}
            className={cn(
              'cursor-pointer transition-all hover:shadow-md',
              card.highlight && 'border-red-300 bg-red-50/50'
            )}
            onClick={() => handleClick(card.id as 'active' | 'overdue' | 'pending' | 'completed')}
            data-testid={card.testId}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={cn('p-2 rounded-lg', card.bgColor)}>
                <Icon className={cn('h-4 w-4', card.iconColor)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className={cn(
                  'text-2xl font-bold',
                  card.highlight && 'text-red-600'
                )}>
                  {card.value.toLocaleString()}
                </div>
                {card.trend !== undefined && card.trend !== null && (
                  <div className={cn(
                    'flex items-center text-xs font-medium',
                    hasPositiveTrend && 'text-green-600',
                    hasNegativeTrend && 'text-red-600'
                  )}>
                    {hasPositiveTrend ? (
                      <TrendingUp className="h-3 w-3 mr-0.5" />
                    ) : hasNegativeTrend ? (
                      <TrendingDown className="h-3 w-3 mr-0.5" />
                    ) : null}
                    {Math.abs(card.trend).toFixed(1)}%
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {card.description}
                {card.previousValue !== undefined && (
                  <span className="ml-1">
                    (prev: {card.previousValue})
                  </span>
                )}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default MaintenanceKpiCards;
