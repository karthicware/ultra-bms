'use client';

/**
 * Alerts Panel Component
 * Story 8.1: Executive Summary Dashboard
 * AC-8: Color-coded alerts (Red/Yellow/Blue)
 */

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  Info,
  ChevronRight,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Alert, AlertSeverity } from '@/types/dashboard';
import { getAlertSeverityInfo } from '@/types/dashboard';

// ============================================================================
// TYPES
// ============================================================================

interface AlertsPanelProps {
  alerts: Alert[] | null;
  isLoading?: boolean;
  maxItems?: number;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const SEVERITY_CONFIG: Record<AlertSeverity, {
  icon: typeof AlertTriangle;
  bgClass: string;
  borderClass: string;
  textClass: string;
}> = {
  URGENT: {
    icon: AlertTriangle,
    bgClass: 'bg-red-50 dark:bg-red-900/20',
    borderClass: 'border-red-200 dark:border-red-800',
    textClass: 'text-red-600 dark:text-red-400'
  },
  WARNING: {
    icon: AlertCircle,
    bgClass: 'bg-amber-50 dark:bg-amber-900/20',
    borderClass: 'border-amber-200 dark:border-amber-800',
    textClass: 'text-amber-600 dark:text-amber-400'
  },
  INFO: {
    icon: Info,
    bgClass: 'bg-blue-50 dark:bg-blue-900/20',
    borderClass: 'border-blue-200 dark:border-blue-800',
    textClass: 'text-blue-600 dark:text-blue-400'
  }
};

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function AlertItem({ alert }: { alert: Alert }) {
  const config = SEVERITY_CONFIG[alert.severity];
  const Icon = config.icon;

  return (
    <Link
      href={alert.actionUrl}
      className={cn(
        'flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50',
        config.bgClass,
        config.borderClass
      )}
    >
      <div className={cn('flex-shrink-0', config.textClass)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{alert.title}</span>
          <Badge variant="secondary" className="text-xs">
            {alert.count}
          </Badge>
        </div>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">
          {alert.description}
        </p>
      </div>
      <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
    </Link>
  );
}

function AlertsSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
          <Skeleton className="h-5 w-5 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-4 w-4" />
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AlertsPanel({
  alerts,
  isLoading = false,
  maxItems = 5
}: AlertsPanelProps) {
  const displayAlerts = alerts?.slice(0, maxItems) ?? [];
  const hasAlerts = displayAlerts.length > 0;

  // Count by severity
  const urgentCount = alerts?.filter(a => a.severity === 'URGENT').length ?? 0;
  const warningCount = alerts?.filter(a => a.severity === 'WARNING').length ?? 0;
  const infoCount = alerts?.filter(a => a.severity === 'INFO').length ?? 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Critical Alerts</CardTitle>
        </div>
        {hasAlerts && (
          <div className="flex items-center gap-2">
            {urgentCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {urgentCount} urgent
              </Badge>
            )}
            {warningCount > 0 && (
              <Badge variant="outline" className="border-amber-500 text-amber-600 text-xs">
                {warningCount} warning
              </Badge>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <AlertsSkeleton />
        ) : hasAlerts ? (
          <div className="space-y-3">
            {displayAlerts.map((alert) => (
              <AlertItem key={alert.id} alert={alert} />
            ))}
            {alerts && alerts.length > maxItems && (
              <Button variant="ghost" className="w-full" asChild>
                <Link href="/alerts">
                  View all {alerts.length} alerts
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle className="mb-2 h-8 w-8 text-green-500" />
            <p className="font-medium text-green-600">All Clear!</p>
            <p className="text-sm text-muted-foreground">
              No critical alerts at this time
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
