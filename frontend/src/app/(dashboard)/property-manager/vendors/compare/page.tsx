'use client';

import { Suspense, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useVendorsComparison } from '@/hooks/useVendorRatings';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Scale,
  Star,
  Briefcase,
  Clock,
  CheckCircle2,
  DollarSign,
  Plus,
  X,
  ArrowUpRight,
  Trophy
} from 'lucide-react';
import { StarRatingDisplay } from '@/components/vendors/StarRatingInput';
import { VendorSearchSelect } from '@/components/vendors/VendorSearchSelect';
import type { VendorComparisonEntry } from '@/types/vendor-ratings';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/validations/quotations';
import { PageBackButton } from '@/components/common/PageBackButton';

/**
 * Vendor Comparison Page
 * Story 5.3: Vendor Performance Tracking and Rating
 *
 * Side-by-side comparison of 2-4 vendors (AC #13)
 */

function ComparisonSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

interface MetricRowProps {
  label: string;
  icon: React.ReactNode;
  values: (string | number | React.ReactNode)[];
  highlight?: 'highest' | 'lowest';
}

function MetricRow({ label, icon, values, highlight }: MetricRowProps) {
  // Find best value for highlighting
  const numericValues = values.map(v =>
    typeof v === 'number' ? v :
    typeof v === 'string' && !isNaN(parseFloat(v)) ? parseFloat(v) : null
  );

  const bestIndex = highlight === 'highest'
    ? numericValues.indexOf(Math.max(...numericValues.filter((v): v is number => v !== null)))
    : highlight === 'lowest'
    ? numericValues.indexOf(Math.min(...numericValues.filter((v): v is number => v !== null && v > 0)))
    : -1;

  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: `200px repeat(${values.length}, 1fr)` }}>
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        {icon}
        {label}
      </div>
      {values.map((value, idx) => (
        <div
          key={idx}
          className={cn(
            'flex items-center justify-center p-3 rounded-lg',
            bestIndex === idx ? 'bg-green-50 dark:bg-green-950 ring-1 ring-green-500' : 'bg-muted/30'
          )}
        >
          <span className={cn(
            'text-lg font-semibold',
            bestIndex === idx && 'text-green-600 dark:text-green-400'
          )}>
            {typeof value === 'object' ? value : value}
          </span>
          {bestIndex === idx && (
            <Trophy className="h-4 w-4 ml-2 text-yellow-500" />
          )}
        </div>
      ))}
    </div>
  );
}

interface VendorColumnProps {
  vendor: VendorComparisonEntry;
  onRemove: () => void;
  index: number;
}

function VendorColumn({ vendor, onRemove, index }: VendorColumnProps) {
  const rankColors = ['bg-yellow-100 text-yellow-800', 'bg-gray-100 text-gray-600', 'bg-amber-100 text-amber-700'];

  return (
    <Card className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-8 w-8"
        onClick={onRemove}
        data-testid={`btn-remove-vendor-${vendor.id}`}
      >
        <X className="h-4 w-4" />
      </Button>

      <CardHeader className="pb-2">
        <div className="flex items-start gap-2">
          {index < 3 && (
            <Badge className={cn('shrink-0', rankColors[index])}>
              #{index + 1}
            </Badge>
          )}
          <div className="min-w-0">
            <CardTitle className="text-base truncate">
              <Link
                href={`/property-manager/vendors/${vendor.id}`}
                className="hover:underline text-primary"
                data-testid={`vendor-link-${vendor.id}`}
              >
                {vendor.companyName}
              </Link>
            </CardTitle>
            <CardDescription className="text-xs">
              {vendor.vendorNumber}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Overall Rating */}
        <div className="text-center p-4 bg-muted/30 rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">Rating</p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl font-bold" data-testid={`rating-value-${vendor.id}`}>
              {vendor.overallRating.toFixed(1)}
            </span>
            <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
          </div>
          <StarRatingDisplay
            value={vendor.overallRating}
            size="sm"
            showValue={false}
            testIdPrefix={`rating-${vendor.id}`}
          />
        </div>

        {/* Service Categories */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">Services</p>
          <div className="flex flex-wrap gap-1">
            {vendor.serviceCategories.slice(0, 3).map((cat) => (
              <Badge key={cat} variant="outline" className="text-xs">
                {cat.replace(/_/g, ' ')}
              </Badge>
            ))}
            {vendor.serviceCategories.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{vendor.serviceCategories.length - 3}
              </Badge>
            )}
          </div>
        </div>

        {/* View Details Button */}
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link
            href={`/property-manager/vendors/${vendor.id}`}
            data-testid={`btn-view-${vendor.id}`}
          >
            View Details
            <ArrowUpRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function VendorComparePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get vendor IDs from URL
  const initialIds = useMemo(() => {
    const ids = searchParams.get('ids');
    return ids ? ids.split(',').filter(Boolean) : [];
  }, [searchParams]);

  const [selectedIds, setSelectedIds] = useState<string[]>(initialIds);

  const { data: comparison, isLoading, isFetching } = useVendorsComparison(
    selectedIds,
    selectedIds.length >= 2
  );

  const vendors = comparison?.vendors ?? [];

  const handleAddVendor = (vendorId: string) => {
    if (selectedIds.length < 4 && !selectedIds.includes(vendorId)) {
      const newIds = [...selectedIds, vendorId];
      setSelectedIds(newIds);
      // Update URL
      router.replace(`/property-manager/vendors/compare?ids=${newIds.join(',')}`);
    }
  };

  const handleRemoveVendor = (vendorId: string) => {
    const newIds = selectedIds.filter(id => id !== vendorId);
    setSelectedIds(newIds);
    // Update URL
    if (newIds.length > 0) {
      router.replace(`/property-manager/vendors/compare?ids=${newIds.join(',')}`);
    } else {
      router.replace('/property-manager/vendors/compare');
    }
  };

  const formatCompletionTime = (days: number | null): string => {
    if (days === null) return 'N/A';
    if (days < 1) return `${Math.round(days * 24)}h`;
    return `${days.toFixed(1)}d`;
  };

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <PageBackButton href="/property-manager/vendors" aria-label="Back to vendors" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Scale className="h-7 w-7 text-primary" />
              Compare Vendors
            </h1>
            <p className="text-muted-foreground mt-1">
              Side-by-side comparison of vendor performance
            </p>
          </div>
        </div>
      </div>

      {/* Vendor Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Select Vendors to Compare</CardTitle>
          <CardDescription>
            Choose 2-4 vendors to compare their performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            {selectedIds.map((id) => {
              const vendor = vendors.find(v => v.id === id);
              return (
                <Badge
                  key={id}
                  variant="secondary"
                  className="flex items-center gap-2 py-2 px-3"
                >
                  {vendor?.companyName || 'Loading...'}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => handleRemoveVendor(id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              );
            })}

            {selectedIds.length < 4 && (
              <VendorSearchSelect
                onSelect={handleAddVendor}
                excludeIds={selectedIds}
                placeholder="Add vendor..."
              />
            )}
          </div>

          {selectedIds.length < 2 && (
            <p className="text-sm text-muted-foreground mt-3">
              Select at least 2 vendors to start comparison
            </p>
          )}
        </CardContent>
      </Card>

      {/* Comparison View */}
      {isLoading && selectedIds.length >= 2 ? (
        <ComparisonSkeleton />
      ) : vendors.length >= 2 ? (
        <div className="space-y-6">
          {/* Vendor Cards */}
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: `repeat(${vendors.length}, 1fr)` }}
            data-testid="comparison-grid"
          >
            {vendors.map((vendor, index) => (
              <VendorColumn
                key={vendor.id}
                vendor={vendor}
                index={index}
                onRemove={() => handleRemoveVendor(vendor.id)}
              />
            ))}
          </div>

          {/* Metrics Comparison Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <MetricRow
                label="Overall Rating"
                icon={<Star className="h-4 w-4 text-yellow-500" />}
                values={vendors.map(v => v.overallRating.toFixed(1))}
                highlight="highest"
              />

              <MetricRow
                label="Jobs Completed"
                icon={<Briefcase className="h-4 w-4 text-blue-500" />}
                values={vendors.map(v => v.totalJobsCompleted)}
                highlight="highest"
              />

              <MetricRow
                label="On-Time Rate"
                icon={<CheckCircle2 className="h-4 w-4 text-green-500" />}
                values={vendors.map(v =>
                  v.onTimeCompletionRate !== null ? `${v.onTimeCompletionRate.toFixed(1)}%` : 'N/A'
                )}
                highlight="highest"
              />

              <MetricRow
                label="Avg. Completion"
                icon={<Clock className="h-4 w-4 text-orange-500" />}
                values={vendors.map(v => formatCompletionTime(v.averageCompletionTime))}
                highlight="lowest"
              />

              <MetricRow
                label="Hourly Rate"
                icon={<DollarSign className="h-4 w-4 text-emerald-500" />}
                values={vendors.map(v => formatCurrency(v.hourlyRate))}
                highlight="lowest"
              />
            </CardContent>
          </Card>
        </div>
      ) : selectedIds.length < 2 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Scale className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">
              Select at least 2 vendors to compare their performance
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push('/property-manager/vendors')}
            >
              Browse Vendors
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function CompareSkeleton() {
  return (
    <div className="container py-6 space-y-6">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-32 w-full" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-64 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export default function VendorComparePage() {
  return (
    <Suspense fallback={<CompareSkeleton />}>
      <VendorComparePageContent />
    </Suspense>
  );
}
