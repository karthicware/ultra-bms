'use client';

/**
 * Upcoming Lease Expirations Component
 * Story 8.3: Occupancy Dashboard
 * AC-7: Table showing upcoming lease expirations with renewal status
 *       Quick actions: View Lease, Initiate Renewal
 */

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { Calendar, ChevronRight, Building2, User, Eye, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LeaseExpirationItem } from '@/types';
import {
  formatDaysRemaining,
  getDaysRemainingUrgency,
  getUrgencyClasses,
  getRenewalStatusInfo
} from '@/types';

// ============================================================================
// TYPES
// ============================================================================

interface UpcomingLeaseExpirationsProps {
  items: LeaseExpirationItem[] | null;
  isLoading?: boolean;
  maxItems?: number;
  showViewAll?: boolean;
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="p-6">
      <Skeleton className="h-6 w-56 mb-6" />
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <Calendar className="h-12 w-12 text-muted-foreground/50" />
      <h3 className="mt-4 text-lg font-medium">No Upcoming Expirations</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        There are no leases expiring in the configured period.
      </p>
    </div>
  );
}

function DaysRemainingBadge({ days }: { days: number }) {
  const urgency = getDaysRemainingUrgency(days);
  const { bgClass, textClass } = getUrgencyClasses(urgency);

  return (
    <Badge
      variant="secondary"
      className={cn('font-medium', bgClass, textClass)}
      data-testid="days-remaining-badge"
    >
      {formatDaysRemaining(days)}
    </Badge>
  );
}

function RenewalStatusBadge({ status }: { status: string }) {
  const statusInfo = getRenewalStatusInfo(status);

  return (
    <Badge
      variant="secondary"
      className={cn('font-medium', statusInfo.bgClass, statusInfo.textClass)}
      data-testid="renewal-status-badge"
    >
      {statusInfo.label}
    </Badge>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function UpcomingLeaseExpirations({
  items,
  isLoading = false,
  maxItems = 10,
  showViewAll = true
}: UpcomingLeaseExpirationsProps) {
  const router = useRouter();

  // AC-7: Quick action - View Lease
  const handleViewLease = useCallback(
    (e: React.MouseEvent, tenantId: string) => {
      e.stopPropagation(); // Prevent row click
      router.push(`/tenants/${tenantId}?tab=lease`);
    },
    [router]
  );

  // AC-7: Quick action - Initiate Renewal
  const handleInitiateRenewal = useCallback(
    (e: React.MouseEvent, tenantId: string) => {
      e.stopPropagation(); // Prevent row click
      router.push(`/leases/extensions/${tenantId}`);
    },
    [router]
  );

  if (isLoading || !items) {
    return <TableSkeleton rows={maxItems} />;
  }

  const displayItems = items.slice(0, maxItems);
  const hasMoreItems = items.length > maxItems;

  const handleRowClick = (tenantId: string) => {
    router.push(`/tenants/${tenantId}`);
  };

  const handleViewAll = () => {
    router.push('/leases?expiring=true');
  };

  return (
    <div className="p-6" data-testid="upcoming-lease-expirations">
      <div className="flex flex-row items-center justify-between mb-6">
        <h3 className="font-semibold text-lg">Upcoming Lease Expirations</h3>
        {showViewAll && hasMoreItems && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleViewAll}
            className="gap-1"
            data-testid="view-all-expirations"
          >
            View all
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
        {displayItems.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto">
            <TooltipProvider>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead className="hidden md:table-cell">Property</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Time Remaining</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayItems.map((item) => (
                    <TableRow
                      key={`${item.tenantId}-${item.unitId}`}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleRowClick(item.tenantId)}
                      data-testid={`expiration-row-${item.tenantId}`}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{item.tenantName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">{item.unitNumber}</span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {item.propertyName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {new Date(item.expiryDate).toLocaleDateString('en-AE', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DaysRemainingBadge days={item.daysRemaining} />
                      </TableCell>
                      <TableCell>
                        <RenewalStatusBadge status={item.renewalStatus} />
                      </TableCell>
                      {/* AC-7: Quick actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => handleViewLease(e, item.tenantId)}
                                data-testid={`view-lease-${item.tenantId}`}
                              >
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">View Lease</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>View Lease</TooltipContent>
                          </Tooltip>
                          {!item.isRenewed && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-primary"
                                  onClick={(e) => handleInitiateRenewal(e, item.tenantId)}
                                  data-testid={`initiate-renewal-${item.tenantId}`}
                                >
                                  <RefreshCw className="h-4 w-4" />
                                  <span className="sr-only">Initiate Renewal</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Initiate Renewal</TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TooltipProvider>
          </div>
        )}

        {/* Summary footer */}
        {displayItems.length > 0 && (
          <div className="mt-4 flex items-center justify-between border-t pt-4 text-sm text-muted-foreground">
            <span>
              Showing {displayItems.length} of {items.length} expirations
            </span>
            <div className="flex gap-4">
              <span>
                <span className="font-medium text-green-600">
                  {items.filter((i) => i.renewalStatus === 'Renewed').length}
                </span>{' '}
                renewed
              </span>
              <span>
                <span className="font-medium text-amber-600">
                  {items.filter((i) => i.renewalStatus === 'Pending').length}
                </span>{' '}
                pending
              </span>
            </div>
          </div>
        )}
    </div>
  );
}
