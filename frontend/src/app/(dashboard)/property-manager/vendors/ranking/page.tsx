'use client';

import { useState } from 'react';
import { useTopRatedVendors } from '@/hooks/useVendorRatings';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Trophy,
  Star,
  Briefcase,
  Clock,
  CheckCircle2,
  Filter,
  RefreshCw,
  ArrowUpRight
} from 'lucide-react';
import { StarRatingDisplay } from '@/components/vendors/StarRatingInput';
import { ServiceCategory } from '@/types/vendors';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * Vendor Ranking Page
 * Story 5.3: Vendor Performance Tracking and Rating
 *
 * Displays top-rated vendors with filtering by service category.
 */

const serviceCategoryOptions = [
  { value: '', label: 'All Categories' },
  { value: 'PLUMBING', label: 'Plumbing' },
  { value: 'ELECTRICAL', label: 'Electrical' },
  { value: 'HVAC', label: 'HVAC' },
  { value: 'APPLIANCE', label: 'Appliance' },
  { value: 'CARPENTRY', label: 'Carpentry' },
  { value: 'PEST_CONTROL', label: 'Pest Control' },
  { value: 'CLEANING', label: 'Cleaning' },
  { value: 'PAINTING', label: 'Painting' },
  { value: 'LANDSCAPING', label: 'Landscaping' },
  { value: 'OTHER', label: 'Other' }
];

function RankingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-5 w-24" />
        </div>
      ))}
    </div>
  );
}

function getRankBadge(rank: number) {
  if (rank === 1) {
    return (
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
        <Trophy className="h-5 w-5 text-yellow-600" />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800">
        <span className="text-lg font-bold text-gray-500">2</span>
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30">
        <span className="text-lg font-bold text-amber-700">3</span>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
      <span className="text-lg font-semibold text-muted-foreground">{rank}</span>
    </div>
  );
}

export default function VendorRankingPage() {
  const [category, setCategory] = useState<ServiceCategory | undefined>();
  const [limit, setLimit] = useState(20);

  const { data: vendors, isLoading, refetch, isFetching } = useTopRatedVendors(
    category,
    limit,
    true
  );

  const handleCategoryChange = (value: string) => {
    setCategory(value === '' ? undefined : value as ServiceCategory);
  };

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Trophy className="h-7 w-7 text-yellow-500" />
            Vendor Rankings
          </h1>
          <p className="text-muted-foreground mt-1">
            Top-rated vendors based on performance and customer feedback
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            data-testid="btn-refresh-ranking"
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', isFetching && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Category:</span>
              <Select
                value={category || ''}
                onValueChange={handleCategoryChange}
              >
                <SelectTrigger className="w-[180px]" data-testid="filter-category">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  {serviceCategoryOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Show:</span>
              <Select
                value={limit.toString()}
                onValueChange={(v) => setLimit(parseInt(v))}
              >
                <SelectTrigger className="w-[100px]" data-testid="filter-limit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">Top 10</SelectItem>
                  <SelectItem value="20">Top 20</SelectItem>
                  <SelectItem value="50">Top 50</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {category && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCategory(undefined)}
                data-testid="btn-clear-filters"
              >
                Clear filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Rankings Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <RankingSkeleton />
            </div>
          ) : !vendors || vendors.length === 0 ? (
            <div className="py-12 text-center">
              <Trophy className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No vendors found</p>
              {category && (
                <Button
                  variant="link"
                  onClick={() => setCategory(undefined)}
                  className="mt-2"
                >
                  Clear category filter
                </Button>
              )}
            </div>
          ) : (
            <Table data-testid="ranking-table">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Rank</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead className="text-center">Rating</TableHead>
                  <TableHead className="text-center hidden md:table-cell">Jobs</TableHead>
                  <TableHead className="text-center hidden lg:table-cell">On-Time</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendors.map((vendor, index) => (
                  <TableRow
                    key={vendor.vendorId}
                    className={cn(
                      index < 3 && 'bg-muted/30'
                    )}
                    data-testid={`ranking-row-${index + 1}`}
                  >
                    <TableCell>
                      {getRankBadge(index + 1)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <Link
                          href={`/property-manager/vendors/${vendor.vendorId}`}
                          className="font-medium hover:underline text-primary"
                          data-testid={`vendor-link-${vendor.vendorId}`}
                        >
                          {vendor.vendorName}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          {vendor.vendorNumber}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <StarRatingDisplay
                          value={Number(vendor.overallRating)}
                          size="sm"
                          showValue
                          totalRatings={vendor.ratingDistribution?.totalCount}
                          testIdPrefix={`rating-${vendor.vendorId}`}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-center hidden md:table-cell">
                      <div className="flex items-center justify-center gap-1">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <span>{vendor.totalJobsCompleted}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center hidden lg:table-cell">
                      {vendor.onTimeCompletionRate !== null ? (
                        <div className="flex items-center justify-center gap-1">
                          <CheckCircle2 className={cn(
                            'h-4 w-4',
                            vendor.onTimeCompletionRate >= 90 ? 'text-green-500' :
                            vendor.onTimeCompletionRate >= 70 ? 'text-yellow-500' :
                            'text-red-500'
                          )} />
                          <span>{vendor.onTimeCompletionRate.toFixed(1)}%</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <Link
                          href={`/property-manager/vendors/${vendor.vendorId}`}
                          data-testid={`btn-view-${vendor.vendorId}`}
                        >
                          View
                          <ArrowUpRight className="h-4 w-4 ml-1" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
