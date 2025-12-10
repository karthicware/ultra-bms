'use client';

/**
 * Expiring Leases Page
 * Story 3.6: Tenant Lease Extension and Renewal (AC: #1, #2)
 *
 * Modern redesign with KPI dashboard, status tabs, grid/list views
 * Design patterns from /leads page
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { debounce } from 'lodash';
import { format, differenceInDays } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  CalendarClock,
  AlertTriangle,
  AlertCircle,
  Clock,
  FileText,
  Building2,
  Phone,
  Mail,
  ArrowRight,
  Search,
  LayoutGrid,
  List,
  Filter,
  RefreshCw,
  TrendingUp,
  Activity,
  MoreVertical,
  Eye,
  Hourglass,
  Timer,
  Flame,
  CheckCircle2,
  XCircle,
  Calendar,
  DollarSign,
  Home,
} from 'lucide-react';

import { getExpiringLeases } from '@/services/lease.service';
import { getProperties } from '@/services/tenant.service';
import type { ExpiringLease, ExpiringLeasesFilters } from '@/types/lease';
import type { Property } from '@/types';
import { getExpiryUrgencyLevel } from '@/lib/validations/lease';
import { cn } from '@/lib/utils';

type ViewMode = 'grid' | 'list';
type UrgencyLevel = 'critical' | 'urgent' | 'warning' | 'normal';

/**
 * Urgency level styles
 */
const URGENCY_STYLES: Record<UrgencyLevel, { badge: string; dot: string; icon: React.ReactNode; bg: string }> = {
  critical: {
    badge: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400 border-red-200',
    dot: 'bg-red-500',
    icon: <Flame className="h-3.5 w-3.5" />,
    bg: 'from-red-500/10 via-red-500/5',
  },
  urgent: {
    badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-400 border-orange-200',
    dot: 'bg-orange-500',
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
    bg: 'from-orange-500/10 via-orange-500/5',
  },
  warning: {
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-400 border-amber-200',
    dot: 'bg-amber-500',
    icon: <Clock className="h-3.5 w-3.5" />,
    bg: 'from-amber-500/10 via-amber-500/5',
  },
  normal: {
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-400 border-emerald-200',
    dot: 'bg-emerald-500',
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    bg: 'from-emerald-500/10 via-emerald-500/5',
  },
};

/**
 * Get urgency level from days remaining
 */
function getUrgencyLevel(daysRemaining: number): UrgencyLevel {
  const level = getExpiryUrgencyLevel(daysRemaining);
  return level as UrgencyLevel;
}

/**
 * Main Expiring Leases Page
 */
export default function ExpiringLeasesPage() {
  const router = useRouter();

  // State
  const [expiringLeases, setExpiringLeases] = useState<{
    expiring14Days: ExpiringLease[];
    expiring30Days: ExpiringLease[];
    expiring60Days: ExpiringLease[];
    counts: { expiring14Days: number; expiring30Days: number; expiring60Days: number };
  } | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // Debounced search
  const debouncedSearch = useMemo(
    () => debounce((value: string) => {
      setSearchTerm(value);
    }, 300),
    []
  );

  // Fetch data
  const fetchData = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) {
        setIsInitialLoading(true);
      } else {
        setIsFiltering(true);
      }

      const filters: ExpiringLeasesFilters = selectedPropertyId
        ? { propertyId: selectedPropertyId }
        : {};

      const [leasesData, propertiesData] = await Promise.all([
        getExpiringLeases(filters),
        getProperties(),
      ]);

      setExpiringLeases(leasesData);
      setProperties(propertiesData);
    } catch (error) {
      console.error('Failed to fetch expiring leases:', error);
    } finally {
      setIsInitialLoading(false);
      setIsFiltering(false);
    }
  }, [selectedPropertyId]);

  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  // Cleanup debounce
  useEffect(() => {
    return () => debouncedSearch.cancel();
  }, [debouncedSearch]);

  // Handlers
  const handleExtendLease = (tenantId: string) => {
    router.push(`/leases/extensions/${tenantId}`);
  };

  const handlePropertyFilter = (value: string) => {
    setSelectedPropertyId(value === 'all' ? '' : value);
  };

  // Get all leases combined
  const allLeases = useMemo(() => [
    ...(expiringLeases?.expiring14Days ?? []),
    ...(expiringLeases?.expiring30Days ?? []),
    ...(expiringLeases?.expiring60Days ?? []),
  ].sort((a, b) => a.daysRemaining - b.daysRemaining), [expiringLeases]);

  // Filter leases based on status and search
  const filteredLeases = useMemo(() => {
    let result = allLeases;

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(lease => {
        const level = getUrgencyLevel(lease.daysRemaining);
        return level === statusFilter;
      });
    }

    // Search filter
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase().trim();
      result = result.filter(lease =>
        lease.tenantName?.toLowerCase().includes(query) ||
        lease.email?.toLowerCase().includes(query) ||
        lease.phone?.includes(query) ||
        lease.tenantNumber?.toLowerCase().includes(query) ||
        lease.propertyName?.toLowerCase().includes(query) ||
        lease.unitNumber?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [allLeases, statusFilter, searchTerm]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = allLeases.length;
    const critical = expiringLeases?.counts.expiring14Days ?? 0;
    const urgent = expiringLeases?.counts.expiring30Days ?? 0;
    const warning = expiringLeases?.counts.expiring60Days ?? 0;

    const withRenewalRequest = allLeases.filter(l => l.pendingRenewalRequest).length;
    const renewalRate = total > 0 ? (withRenewalRequest / total) * 100 : 0;

    const totalMonthlyRent = allLeases.reduce((sum, l) => sum + (l.currentRent ?? 0), 0);

    return {
      total,
      critical,
      urgent,
      warning,
      withRenewalRequest,
      renewalRate,
      totalMonthlyRent,
    };
  }, [allLeases, expiringLeases]);

  // Format date helper
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd MMM yyyy');
    } catch {
      return '-';
    }
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">

          {/* Hero Header */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-background border shadow-sm">
            <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
            <div className="relative px-8 py-10">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-amber-500/10 ring-1 ring-amber-500/20">
                      <CalendarClock className="h-8 w-8 text-amber-600" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold tracking-tight">Lease Extensions</h1>
                      <p className="text-muted-foreground">
                        Monitor expiring leases and manage renewal processes
                      </p>
                    </div>
                  </div>
                </div>

                {/* Critical Alert Badge */}
                {!isInitialLoading && stats.critical > 0 && (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <div className="p-2 rounded-lg bg-red-500/20">
                      <Flame className="h-5 w-5 text-red-600 animate-pulse" />
                    </div>
                    <div>
                      <p className="font-semibold text-red-700 dark:text-red-400">
                        {stats.critical} Critical
                      </p>
                      <p className="text-xs text-red-600/80">
                        Expiring within 14 days
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* KPI Dashboard */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Expiring */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full -translate-y-6 translate-x-6" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Expiring
                </CardTitle>
                <Hourglass className="h-4 w-4 text-amber-600" />
              </CardHeader>
              <CardContent>
                {isInitialLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <>
                    <div className="text-3xl font-bold">{stats.total}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-400">
                        Next 60 days
                      </Badge>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Renewal Rate */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full -translate-y-6 translate-x-6" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Renewal Requests
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                {isInitialLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <>
                    <div className="text-3xl font-bold text-emerald-600">
                      {stats.renewalRate.toFixed(0)}%
                    </div>
                    <div className="mt-2">
                      <Progress value={stats.renewalRate} className="h-1.5" />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* At Risk Revenue */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full -translate-y-6 translate-x-6" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  At Risk Revenue
                </CardTitle>
                <DollarSign className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                {isInitialLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <>
                    <div className="text-3xl font-bold text-blue-600">
                      {stats.totalMonthlyRent.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      AED / month
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Urgency Breakdown */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/5 rounded-full -translate-y-6 translate-x-6" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Urgency Breakdown
                </CardTitle>
                <Activity className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                {isInitialLoading ? (
                  <Skeleton className="h-8 w-full" />
                ) : (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-50 dark:bg-red-950/30">
                          <Flame className="h-3.5 w-3.5 text-red-600" />
                          <span className="text-sm font-semibold text-red-600">{stats.critical}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>Critical (≤14 days)</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-orange-50 dark:bg-orange-950/30">
                          <AlertTriangle className="h-3.5 w-3.5 text-orange-600" />
                          <span className="text-sm font-semibold text-orange-600">{stats.urgent}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>Urgent (≤30 days)</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-50 dark:bg-amber-950/30">
                          <Clock className="h-3.5 w-3.5 text-amber-600" />
                          <span className="text-sm font-semibold text-amber-600">{stats.warning}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>Warning (≤60 days)</TooltipContent>
                    </Tooltip>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Filters & Controls */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Status Tabs */}
                <Tabs
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                  className="w-full lg:w-auto"
                >
                  <TabsList className="grid w-full lg:w-auto grid-cols-5 h-10">
                    <TabsTrigger value="all" className="gap-1.5 px-2 text-xs lg:text-sm">
                      <Filter className="h-3.5 w-3.5" />
                      All
                    </TabsTrigger>
                    <TabsTrigger value="critical" className="gap-1.5 px-2 text-xs lg:text-sm">
                      <Flame className="h-3.5 w-3.5" />
                      Critical
                    </TabsTrigger>
                    <TabsTrigger value="urgent" className="gap-1.5 px-2 text-xs lg:text-sm">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Urgent
                    </TabsTrigger>
                    <TabsTrigger value="warning" className="gap-1.5 px-2 text-xs lg:text-sm">
                      <Clock className="h-3.5 w-3.5" />
                      Warning
                    </TabsTrigger>
                    <TabsTrigger value="normal" className="gap-1.5 px-2 text-xs lg:text-sm">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Normal
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="flex-1 flex flex-col sm:flex-row gap-3">
                  {/* Property Filter */}
                  <Select value={selectedPropertyId || 'all'} onValueChange={handlePropertyFilter}>
                    <SelectTrigger className="w-full sm:w-[200px] h-10">
                      <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                      <SelectValue placeholder="All Properties" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Properties</SelectItem>
                      {properties.map((property) => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Search */}
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search tenants, properties..."
                      defaultValue={searchTerm}
                      onChange={(e) => debouncedSearch(e.target.value)}
                      className="pl-9 h-10"
                    />
                  </div>

                  {/* View Toggle */}
                  <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
                    <Button
                      variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="h-8 px-3"
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="h-8 px-3"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Header */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {isInitialLoading ? (
                <Skeleton className="h-4 w-32" />
              ) : (
                `${filteredLeases.length} ${filteredLeases.length === 1 ? 'lease' : 'leases'} found`
              )}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchData()}
              className="gap-2"
              disabled={isFiltering}
            >
              <RefreshCw className={cn("h-4 w-4", isFiltering && "animate-spin")} />
              Refresh
            </Button>
          </div>

          {/* Content Area */}
          {isInitialLoading ? (
            <div className={cn(
              "grid gap-6",
              viewMode === 'grid'
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                : "grid-cols-1"
            )}>
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className={viewMode === 'grid' ? "h-56" : "h-24"} />
              ))}
            </div>
          ) : filteredLeases.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="p-4 rounded-full bg-muted mb-4">
                  <CalendarClock className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No expiring leases found</h3>
                <p className="text-muted-foreground max-w-sm">
                  {searchTerm || statusFilter !== 'all' || selectedPropertyId
                    ? "Try adjusting your search or filters to find what you're looking for."
                    : "No leases are expiring within the next 60 days."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className={cn(
              "transition-opacity duration-200",
              isFiltering ? "opacity-60" : "opacity-100"
            )}>
              {/* Grid View */}
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredLeases.map((lease) => {
                    const urgencyLevel = getUrgencyLevel(lease.daysRemaining);
                    const urgencyStyles = URGENCY_STYLES[urgencyLevel];

                    return (
                      <Card
                        key={lease.tenantId}
                        className="overflow-hidden group hover:shadow-lg transition-all duration-300 flex flex-col cursor-pointer"
                        onClick={() => handleExtendLease(lease.tenantId)}
                      >
                        {/* Header */}
                        <div className={cn(
                          "relative h-24 bg-gradient-to-br to-muted",
                          urgencyStyles.bg
                        )}>
                          {/* Urgency Badge */}
                          <div className="absolute top-3 left-3">
                            <Badge variant="secondary" className={cn("shadow-sm", urgencyStyles.badge)}>
                              <div className={cn("h-1.5 w-1.5 rounded-full mr-1.5", urgencyStyles.dot)} />
                              {lease.daysRemaining} days
                            </Badge>
                          </div>

                          {/* Renewal Status */}
                          <div className="absolute top-3 right-3">
                            {lease.pendingRenewalRequest ? (
                              <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 shadow-sm">
                                <FileText className="h-3 w-3 mr-1" />
                                Requested
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-muted/80 backdrop-blur-sm shadow-sm">
                                <XCircle className="h-3 w-3 mr-1" />
                                No Request
                              </Badge>
                            )}
                          </div>

                          {/* Avatar */}
                          <div className="absolute -bottom-8 left-4">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xl ring-4 ring-background shadow-lg">
                              {lease.tenantName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </div>
                          </div>
                        </div>

                        {/* Content */}
                        <CardContent className="p-4 pt-10 flex-1 flex flex-col">
                          <div className="mb-1">
                            <h3 className="font-semibold text-lg truncate" title={lease.tenantName}>
                              {lease.tenantName}
                            </h3>
                            <p className="text-xs text-muted-foreground font-mono">
                              {lease.tenantNumber || '-'}
                            </p>
                          </div>

                          <div className="space-y-1.5 mt-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2 truncate">
                              <Home className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{lease.propertyName} - Unit {lease.unitNumber}</span>
                            </div>
                            <div className="flex items-center gap-2 truncate">
                              <Mail className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{lease.email || '-'}</span>
                            </div>
                            {lease.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-3.5 w-3.5 shrink-0" />
                                <span>{lease.phone}</span>
                              </div>
                            )}
                          </div>

                          <div className="mt-auto pt-3 border-t flex items-center justify-between text-sm">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <DollarSign className="h-3.5 w-3.5" />
                              <span className="font-medium">AED {lease.currentRent?.toLocaleString() ?? 'N/A'}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              Ends {formatDate(lease.leaseEndDate)}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                /* List View */
                <div className="space-y-3">
                  {filteredLeases.map((lease) => {
                    const urgencyLevel = getUrgencyLevel(lease.daysRemaining);
                    const urgencyStyles = URGENCY_STYLES[urgencyLevel];

                    return (
                      <Card
                        key={lease.tenantId}
                        className="overflow-hidden hover:shadow-md transition-all cursor-pointer"
                        onClick={() => handleExtendLease(lease.tenantId)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            {/* Avatar */}
                            <div className={cn(
                              "flex h-12 w-12 items-center justify-center rounded-full font-semibold text-lg shrink-0",
                              urgencyLevel === 'critical' ? 'bg-red-100 text-red-700' :
                              urgencyLevel === 'urgent' ? 'bg-orange-100 text-orange-700' :
                              urgencyLevel === 'warning' ? 'bg-amber-100 text-amber-700' :
                              'bg-emerald-100 text-emerald-700'
                            )}>
                              {lease.tenantName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h3 className="font-semibold truncate">
                                  {lease.tenantName}
                                </h3>
                                <Badge variant="secondary" className={cn("text-xs shrink-0", urgencyStyles.badge)}>
                                  {urgencyStyles.icon}
                                  <span className="ml-1">{lease.daysRemaining} days</span>
                                </Badge>
                                {lease.pendingRenewalRequest && (
                                  <Badge variant="secondary" className="text-xs shrink-0 bg-blue-50 text-blue-700 border-blue-200">
                                    <FileText className="h-3 w-3 mr-1" />
                                    Renewal Requested
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground font-mono mb-2">
                                {lease.tenantNumber || '-'}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                                <span className="flex items-center gap-1">
                                  <Home className="h-3.5 w-3.5 shrink-0" />
                                  {lease.propertyName} - Unit {lease.unitNumber}
                                </span>
                                <span className="flex items-center gap-1 truncate">
                                  <Mail className="h-3.5 w-3.5 shrink-0" />
                                  {lease.email || '-'}
                                </span>
                                {lease.phone && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="h-3.5 w-3.5" />
                                    {lease.phone}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <DollarSign className="h-3.5 w-3.5" />
                                  AED {lease.currentRent?.toLocaleString() ?? 'N/A'}/mo
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3.5 w-3.5" />
                                  Ends {formatDate(lease.leaseEndDate)}
                                </span>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <Button
                                size="sm"
                                onClick={() => handleExtendLease(lease.tenantId)}
                                className="gap-1"
                              >
                                <FileText className="h-4 w-4" />
                                Extend
                                <ArrowRight className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
