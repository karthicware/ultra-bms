'use client';

/**
 * Assets Dashboard KPI Cards Component
 * Story 8.7: Assets Dashboard (AC-1 to AC-4)
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, DollarSign, AlertTriangle, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AssetKpi } from '@/types/assets-dashboard';
import { formatCompactCurrency, formatAssetDashboardCurrency } from '@/types/assets-dashboard';
import { useRouter } from 'next/navigation';

interface AssetKpiCardsProps {
  kpis: AssetKpi | undefined;
  isLoading?: boolean;
}

export function AssetKpiCards({ kpis, isLoading }: AssetKpiCardsProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" data-testid="asset-kpi-loading">
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
      title: 'Total Assets',
      value: kpis.totalRegisteredAssets.toLocaleString(),
      icon: Package,
      testId: 'asset-kpi-total-assets',
      onClick: () => router.push('/assets'),
      description: 'Registered assets in the system',
    },
    {
      title: 'Total Value',
      value: formatCompactCurrency(kpis.totalAssetValue),
      icon: DollarSign,
      testId: 'asset-kpi-total-value',
      description: formatAssetDashboardCurrency(kpis.totalAssetValue),
    },
    {
      title: 'Overdue PM',
      value: kpis.assetsWithOverduePm.toLocaleString(),
      icon: AlertTriangle,
      testId: 'asset-kpi-overdue-pm',
      highlight: kpis.assetsWithOverduePm > 0,
      onClick: () => router.push('/assets?status=overdue-pm'),
      description: kpis.assetsWithOverduePm > 0
        ? 'Assets need preventive maintenance!'
        : 'All PM up to date',
    },
    {
      title: 'Highest TCO Asset',
      value: kpis.mostExpensiveAsset?.assetName ?? 'N/A',
      icon: TrendingUp,
      testId: 'asset-kpi-highest-tco',
      badge: kpis.mostExpensiveAsset?.tco
        ? formatCompactCurrency(kpis.mostExpensiveAsset.tco)
        : undefined,
      onClick: kpis.mostExpensiveAsset
        ? () => router.push(`/assets/${kpis.mostExpensiveAsset!.assetId}`)
        : undefined,
      description: kpis.mostExpensiveAsset
        ? `TCO: ${formatAssetDashboardCurrency(kpis.mostExpensiveAsset.tco)}`
        : 'No asset data available',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" data-testid="asset-kpi-cards">
      {cards.map((card) => (
        <Card
          key={card.testId}
          className={cn(
            'transition-colors',
            card.onClick && 'cursor-pointer hover:bg-muted/50',
            card.highlight && 'border-amber-500 bg-amber-50 dark:bg-amber-950/20'
          )}
          onClick={card.onClick}
          data-testid={card.testId}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon
              className={cn('h-4 w-4 text-muted-foreground', card.highlight && 'text-amber-500')}
            />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'text-2xl font-bold truncate',
                  card.highlight && 'text-amber-600 dark:text-amber-400'
                )}
              >
                {card.value}
              </div>
              {card.badge && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
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

export default AssetKpiCards;
