'use client';

/**
 * Property Comparison Table Component
 * Story 8.1: Executive Summary Dashboard
 * AC-9: Sortable table with visual highlighting for top/bottom performers
 */

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Building2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  TrendingDown,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PropertyComparison, PerformanceRank } from '@/types/dashboard';
import { formatDashboardCurrency, formatDashboardPercentage, getPerformanceRankInfo } from '@/types/dashboard';

// ============================================================================
// TYPES
// ============================================================================

interface PropertyComparisonTableProps {
  properties: PropertyComparison[] | null;
  isLoading?: boolean;
}

type SortField = 'propertyName' | 'occupancyRate' | 'maintenanceCost' | 'revenue' | 'openWorkOrders';
type SortDirection = 'asc' | 'desc';

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function RankBadge({ rank }: { rank: PerformanceRank }) {
  const info = getPerformanceRankInfo(rank);

  return (
    <Badge
      variant={rank === 'TOP' ? 'default' : rank === 'BOTTOM' ? 'destructive' : 'secondary'}
      className="text-xs"
    >
      {rank === 'TOP' && <TrendingUp className="mr-1 h-3 w-3" />}
      {rank === 'BOTTOM' && <TrendingDown className="mr-1 h-3 w-3" />}
      {info.label}
    </Badge>
  );
}

function SortIcon({ field, currentSort, direction }: {
  field: SortField;
  currentSort: SortField | null;
  direction: SortDirection;
}) {
  if (currentSort !== field) {
    return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
  }
  return direction === 'asc'
    ? <ArrowUp className="h-4 w-4" />
    : <ArrowDown className="h-4 w-4" />;
}

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-4 py-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-5 w-20" />
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PropertyComparisonTable({
  properties,
  isLoading = false
}: PropertyComparisonTableProps) {
  const [sortField, setSortField] = useState<SortField | null>('revenue');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const hasData = properties && properties.length > 0;

  // Sort properties
  const sortedProperties = [...(properties ?? [])].sort((a, b) => {
    if (!sortField) return 0;

    let comparison = 0;
    switch (sortField) {
      case 'propertyName':
        comparison = a.propertyName.localeCompare(b.propertyName);
        break;
      case 'occupancyRate':
        comparison = a.occupancyRate - b.occupancyRate;
        break;
      case 'maintenanceCost':
        comparison = a.maintenanceCost - b.maintenanceCost;
        break;
      case 'revenue':
        comparison = a.revenue - b.revenue;
        break;
      case 'openWorkOrders':
        comparison = a.openWorkOrders - b.openWorkOrders;
        break;
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Property Performance</CardTitle>
        </div>
        {hasData && (
          <Badge variant="secondary">
            {properties?.length} properties
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <TableSkeleton />
        ) : hasData ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                      onClick={() => handleSort('propertyName')}
                    >
                      Property
                      <SortIcon field="propertyName" currentSort={sortField} direction={sortDirection} />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                      onClick={() => handleSort('occupancyRate')}
                    >
                      Occupancy
                      <SortIcon field="occupancyRate" currentSort={sortField} direction={sortDirection} />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                      onClick={() => handleSort('revenue')}
                    >
                      Revenue
                      <SortIcon field="revenue" currentSort={sortField} direction={sortDirection} />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                      onClick={() => handleSort('maintenanceCost')}
                    >
                      Maintenance
                      <SortIcon field="maintenanceCost" currentSort={sortField} direction={sortDirection} />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                      onClick={() => handleSort('openWorkOrders')}
                    >
                      Open WO
                      <SortIcon field="openWorkOrders" currentSort={sortField} direction={sortDirection} />
                    </Button>
                  </TableHead>
                  <TableHead className="text-center">Rank</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedProperties.map((property) => (
                  <TableRow
                    key={property.propertyId}
                    className={cn(
                      property.rank === 'TOP' && 'bg-green-50/50 dark:bg-green-900/10',
                      property.rank === 'BOTTOM' && 'bg-red-50/50 dark:bg-red-900/10'
                    )}
                  >
                    <TableCell className="font-medium">
                      {property.propertyName}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={cn(
                        property.occupancyRate >= 90 && 'text-green-600',
                        property.occupancyRate < 70 && 'text-red-600'
                      )}>
                        {formatDashboardPercentage(property.occupancyRate)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatDashboardCurrency(property.revenue)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatDashboardCurrency(property.maintenanceCost)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={cn(
                        property.openWorkOrders > 10 && 'text-amber-600'
                      )}>
                        {property.openWorkOrders}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <RankBadge rank={property.rank} />
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/properties/${property.propertyId}`}>
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Building2 className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No property data available
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
