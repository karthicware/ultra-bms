'use client';

/**
 * Top Vendors Table Component
 * Story 8.5: Vendor Dashboard (AC-8)
 */

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Star, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { TopVendor } from '@/types/vendor-dashboard';

interface TopVendorsTableProps {
  data: TopVendor[] | undefined;
  isLoading?: boolean;
}

const RankBadge = ({ rank }: { rank: number }) => {
  const colors = {
    1: 'bg-amber-500 text-white',
    2: 'bg-gray-400 text-white',
    3: 'bg-amber-700 text-white',
  } as Record<number, string>;

  return (
    <Badge
      variant="outline"
      className={cn('w-8 h-8 flex items-center justify-center rounded-full', colors[rank])}
    >
      {rank <= 3 ? <Trophy className="h-4 w-4" /> : rank}
    </Badge>
  );
};

const StarRating = ({ rating }: { rating: number }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  return (
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={cn(
            'h-4 w-4',
            i < fullStars
              ? 'fill-amber-400 text-amber-400'
              : i === fullStars && hasHalfStar
                ? 'fill-amber-400/50 text-amber-400'
                : 'text-gray-300'
          )}
        />
      ))}
      <span className="ml-1 text-sm text-muted-foreground">({rating.toFixed(1)})</span>
    </div>
  );
};

export function TopVendorsTable({ data, isLoading }: TopVendorsTableProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="space-y-1 mb-6">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="p-6">
        <div className="space-y-1 mb-6">
          <h3 className="font-semibold text-lg">Top Vendors</h3>
          <p className="text-sm text-muted-foreground">Top 5 vendors by jobs completed this month</p>
        </div>
        <div className="flex h-32 items-center justify-center text-muted-foreground">
          No vendor activity this month
        </div>
      </div>
    );
  }

  const handleViewProfile = (vendorId: string) => {
    router.push(`/vendors/${vendorId}`);
  };

  return (
    <div className="p-6" data-testid="vendor-top-vendors-table">
      <div className="space-y-1 mb-6">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-lg">Top Vendors</h3>
          <Trophy className="h-5 w-5 text-amber-500" />
        </div>
        <p className="text-sm text-muted-foreground">Top 5 vendors by jobs completed this month</p>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Rank</TableHead>
              <TableHead>Vendor Name</TableHead>
              <TableHead className="text-center">Jobs This Month</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((vendor) => (
              <TableRow
                key={vendor.vendorId}
                className={cn(vendor.rank === 1 && 'bg-amber-50 dark:bg-amber-950/20')}
                data-testid={`vendor-top-vendor-row-${vendor.vendorId}`}
              >
                <TableCell>
                  <RankBadge rank={vendor.rank} />
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{vendor.vendorName}</p>
                    <p className="text-xs text-muted-foreground">
                      {vendor.totalJobsCompleted} total jobs
                    </p>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-lg font-semibold">{vendor.jobsCompletedThisMonth}</span>
                </TableCell>
                <TableCell>
                  <StarRating rating={vendor.avgRating} />
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewProfile(vendor.vendorId)}
                    data-testid={`vendor-top-vendor-view-${vendor.vendorId}`}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    View Profile
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default TopVendorsTable;
