'use client';

/**
 * Vendor Dashboard KPI Cards Component
 * Story 8.5: Vendor Dashboard (AC-1 to AC-4)
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, TrendingUp, Star, FileWarning } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VendorKpi } from '@/types/vendor-dashboard';
import { useRouter } from 'next/navigation';

interface VendorKpiCardsProps {
  kpis: VendorKpi | undefined;
  isLoading?: boolean;
}

export function VendorKpiCards({ kpis, isLoading }: VendorKpiCardsProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
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

  if (!kpis) return null;

  const cards = [
    {
      title: 'Active Vendors',
      value: kpis.totalActiveVendors,
      icon: Users,
      testId: 'vendor-kpi-active-vendors',
      onClick: () => router.push('/vendors?status=ACTIVE'),
      description: 'Total vendors currently active',
    },
    {
      title: 'Avg SLA Compliance',
      value: `${kpis.avgSlaCompliance.toFixed(1)}%`,
      icon: TrendingUp,
      testId: 'vendor-kpi-sla-compliance',
      description: 'Average on-time completion rate',
    },
    {
      title: 'Top Performer',
      value: kpis.topPerformingVendor?.vendorName ?? 'N/A',
      icon: Star,
      testId: 'vendor-kpi-top-performer',
      badge: kpis.topPerformingVendor?.rating
        ? `★ ${kpis.topPerformingVendor.rating.toFixed(1)}`
        : undefined,
      onClick: kpis.topPerformingVendor
        ? () => router.push(`/vendors/${kpis.topPerformingVendor!.vendorId}`)
        : undefined,
      description: kpis.topPerformingVendor
        ? `${kpis.topPerformingVendor.totalJobsCompleted} jobs completed`
        : 'No vendors rated yet',
    },
    {
      title: 'Expiring Documents',
      value: kpis.expiringDocuments.count,
      icon: FileWarning,
      testId: 'vendor-kpi-expiring-docs',
      highlight: kpis.expiringDocuments.hasCriticalExpiring,
      onClick: () => router.push('/vendors/documents?expiring=true'),
      description: kpis.expiringDocuments.hasCriticalExpiring
        ? 'Critical documents expiring!'
        : 'Documents expiring in 30 days',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card
          key={card.testId}
          className={cn(
            'transition-colors',
            card.onClick && 'cursor-pointer hover:bg-muted/50',
            card.highlight && 'border-red-500 bg-red-50 dark:bg-red-950/20'
          )}
          onClick={card.onClick}
          data-testid={card.testId}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon
              className={cn('h-4 w-4 text-muted-foreground', card.highlight && 'text-red-500')}
            />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'text-2xl font-bold truncate',
                  card.highlight && 'text-red-600 dark:text-red-400'
                )}
              >
                {card.value}
              </div>
              {card.badge && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                  {card.badge}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default VendorKpiCards;
