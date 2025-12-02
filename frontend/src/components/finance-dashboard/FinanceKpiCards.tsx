'use client';

/**
 * Finance KPI Cards Component
 * Story 8.6: Finance Dashboard
 * AC-1, AC-2, AC-3, AC-4: KPI cards for income, expenses, profit/loss, VAT
 * AC-17: Net profit/loss color-coded (green positive, red negative)
 * AC-21: All currency values formatted in AED
 * AC-22: All interactive elements have data-testid attributes
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  Receipt,
  PiggyBank,
  FileText,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  FinanceKpi,
  formatAedCurrency,
  formatCompactCurrency,
  getTrendDirection,
  getTrendColor,
  getProfitLossColor,
  TrendDirection,
} from '@/types/finance-dashboard';
import { cn } from '@/lib/utils';

interface FinanceKpiCardsProps {
  kpis: FinanceKpi | undefined;
  isLoading: boolean;
}

export function FinanceKpiCards({ kpis, isLoading }: FinanceKpiCardsProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} data-testid={`finance-kpi-card-skeleton-${i}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 mb-1" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!kpis) {
    return null;
  }

  const cards = [
    {
      id: 'income',
      title: 'Total Income YTD',
      value: kpis.totalIncomeYtd,
      trend: kpis.incomeTrendPercentage,
      previousValue: kpis.totalIncomeLastYear,
      icon: DollarSign,
      iconColor: 'text-green-500',
      onClick: () => router.push('/finance/income'),
      isExpense: false,
    },
    {
      id: 'expenses',
      title: 'Total Expenses YTD',
      value: kpis.totalExpensesYtd,
      trend: kpis.expensesTrendPercentage,
      previousValue: kpis.totalExpensesLastYear,
      icon: Receipt,
      iconColor: 'text-red-500',
      onClick: () => router.push('/finance/expenses'),
      isExpense: true,
    },
    {
      id: 'profit-loss',
      title: 'Net Profit/Loss YTD',
      value: kpis.netProfitLossYtd,
      margin: kpis.profitMarginPercentage,
      icon: PiggyBank,
      iconColor: kpis.netProfitLossYtd >= 0 ? 'text-green-500' : 'text-red-500',
      onClick: () => router.push('/finance/reports/income-statement'),
      isProfitLoss: true,
    },
    {
      id: 'vat',
      title: 'VAT Paid YTD',
      value: kpis.vatPaidYtd,
      trend: kpis.vatTrendPercentage,
      previousValue: kpis.vatPaidLastYear,
      icon: FileText,
      iconColor: 'text-blue-500',
      onClick: () => router.push('/finance/reports/vat'),
      isExpense: false,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card
          key={card.id}
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={card.onClick}
          data-testid={`finance-kpi-card-${card.id}`}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon
              className={cn('h-4 w-4', card.iconColor)}
              data-testid={`finance-kpi-icon-${card.id}`}
            />
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                'text-2xl font-bold',
                card.isProfitLoss && getProfitLossColor(card.value)
              )}
              data-testid={`finance-kpi-value-${card.id}`}
            >
              {formatCompactCurrency(card.value)}
            </div>
            {card.isProfitLoss && card.margin !== null && card.margin !== undefined && (
              <p
                className="text-xs text-muted-foreground mt-1"
                data-testid={`finance-kpi-margin-${card.id}`}
              >
                {card.margin >= 0 ? '+' : ''}{card.margin.toFixed(1)}% margin
              </p>
            )}
            {!card.isProfitLoss && card.trend !== undefined && (
              <TrendIndicator
                trend={card.trend}
                isExpense={card.isExpense}
                testId={`finance-kpi-trend-${card.id}`}
              />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

interface TrendIndicatorProps {
  trend: number | null;
  isExpense?: boolean;
  testId: string;
}

function TrendIndicator({ trend, isExpense = false, testId }: TrendIndicatorProps) {
  const direction = getTrendDirection(trend);
  const colorClass = getTrendColor(trend, isExpense);

  const TrendIcon =
    direction === TrendDirection.UP
      ? TrendingUp
      : direction === TrendDirection.DOWN
      ? TrendingDown
      : Minus;

  return (
    <div
      className={cn('flex items-center text-xs', colorClass)}
      data-testid={testId}
    >
      <TrendIcon className="h-3 w-3 mr-1" />
      <span>
        {trend !== null ? `${trend >= 0 ? '+' : ''}${trend.toFixed(1)}%` : 'N/A'}
      </span>
      <span className="text-muted-foreground ml-1">vs last year</span>
    </div>
  );
}

export default FinanceKpiCards;
