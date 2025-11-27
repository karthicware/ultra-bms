'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  History,
  Star,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  User,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { StarRatingDisplay } from './StarRatingInput';
import { useVendorRatings } from '@/hooks/useVendorRatings';
import type { VendorRating } from '@/types/vendor-ratings';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';

/**
 * RatingHistoryList Component
 * Story 5.3: Vendor Performance Tracking and Rating
 *
 * Displays paginated list of vendor ratings with:
 * - Work order link
 * - Individual scores
 * - Comments
 * - Rated by user
 * - Date
 */

interface RatingHistoryListProps {
  /** Vendor ID */
  vendorId: string;
  /** Initial page size */
  pageSize?: number;
  /** Show as card or inline */
  variant?: 'card' | 'inline';
  /** Compact mode */
  compact?: boolean;
}

interface RatingItemProps {
  rating: VendorRating;
  compact?: boolean;
}

function RatingItem({ rating, compact }: RatingItemProps) {
  return (
    <div
      className={cn(
        'p-4 border rounded-lg',
        compact ? 'space-y-2' : 'space-y-3'
      )}
      data-testid={`rating-item-${rating.id}`}
    >
      {/* Header: Work Order + Date */}
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/property-manager/work-orders/${rating.workOrderId}`}
          className="group flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          data-testid={`rating-wo-link-${rating.id}`}
        >
          {rating.workOrderNumber}
          <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span data-testid={`rating-date-${rating.id}`}>
            {format(new Date(rating.ratedAt), 'MMM d, yyyy')}
          </span>
        </div>
      </div>

      {/* Overall Score */}
      <div className="flex items-center gap-3">
        <StarRatingDisplay
          value={Number(rating.overallScore)}
          size="sm"
          showValue
          testIdPrefix={`rating-stars-${rating.id}`}
        />
        {rating.canUpdate && (
          <Badge variant="outline" className="text-xs">
            Editable
          </Badge>
        )}
      </div>

      {/* Individual Scores (hidden in compact mode) */}
      {!compact && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          <ScoreBadge label="Quality" value={rating.qualityScore} />
          <ScoreBadge label="Timeliness" value={rating.timelinessScore} />
          <ScoreBadge label="Communication" value={rating.communicationScore} />
          <ScoreBadge label="Professionalism" value={rating.professionalismScore} />
        </div>
      )}

      {/* Comments */}
      {rating.comments && (
        <div className="flex gap-2 text-sm">
          <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <p
            className="text-muted-foreground line-clamp-2"
            data-testid={`rating-comments-${rating.id}`}
          >
            {rating.comments}
          </p>
        </div>
      )}

      {/* Rated By */}
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <User className="h-3 w-3" />
        <span data-testid={`rating-by-${rating.id}`}>
          Rated by {rating.ratedByName}
        </span>
      </div>
    </div>
  );
}

function ScoreBadge({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-1.5 p-1.5 bg-muted/50 rounded">
      <span className="text-muted-foreground">{label}:</span>
      <div className="flex items-center gap-0.5">
        <span className="font-medium">{value}</span>
        <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
      </div>
    </div>
  );
}

function RatingListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 border rounded-lg space-y-3">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-5 w-32" />
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((j) => (
              <Skeleton key={j} className="h-8 rounded" />
            ))}
          </div>
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  );
}

export function RatingHistoryList({
  vendorId,
  pageSize = 5,
  variant = 'card',
  compact = false
}: RatingHistoryListProps) {
  const [page, setPage] = useState(0);

  const { data, isLoading, isFetching } = useVendorRatings(
    vendorId,
    page,
    pageSize,
    true
  );

  const ratings = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;
  const totalElements = data?.totalElements ?? 0;

  const content = (
    <>
      {isLoading ? (
        <RatingListSkeleton count={pageSize} />
      ) : ratings.length === 0 ? (
        <div className="py-8 text-center">
          <History className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">No ratings yet</p>
        </div>
      ) : (
        <>
          <div className="space-y-3" data-testid="rating-history-list">
            {ratings.map((rating) => (
              <RatingItem key={rating.id} rating={rating} compact={compact} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t mt-4">
              <span className="text-sm text-muted-foreground">
                Showing {page * pageSize + 1}-{Math.min((page + 1) * pageSize, totalElements)} of {totalElements}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0 || isFetching}
                  data-testid="btn-prev-page"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Previous page</span>
                </Button>
                <span className="text-sm">
                  Page {page + 1} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= totalPages - 1 || isFetching}
                  data-testid="btn-next-page"
                >
                  <ChevronRight className="h-4 w-4" />
                  <span className="sr-only">Next page</span>
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );

  if (variant === 'inline') {
    return content;
  }

  return (
    <Card data-testid="rating-history-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="h-5 w-5 text-primary" />
          Rating History
          {totalElements > 0 && (
            <Badge variant="secondary" className="ml-2">
              {totalElements}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}

export default RatingHistoryList;
