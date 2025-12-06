'use client';

/**
 * Tenant List Page - Property-based with selection in header
 * Displays all tenants filtered by property with modern UI
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { debounce } from 'lodash';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getAllTenants } from '@/services/tenant.service';
import { getProperties } from '@/services/properties.service';
import type { TenantResponse, TenantStatus } from '@/types/tenant';
import type { Property } from '@/types/properties';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  Search,
  Users,
  UserCheck,
  UserX,
  Clock,
  AlertTriangle,
  MoreVertical,
  Eye,
  LayoutGrid,
  List,
  Filter,
  RefreshCw,
  Building2,
  Mail,
  Phone,
  Calendar,
  TrendingUp,
  Activity,
  MapPin,
  ChevronRight,
  X,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

type ViewMode = 'grid' | 'list';

export default function TenantsPage() {
  const router = useRouter();

  // Property selection state
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertiesLoading, setPropertiesLoading] = useState(true);

  // Tenants state
  const [tenants, setTenants] = useState<TenantResponse[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Get selected property details
  const selectedProperty = useMemo(() =>
    properties.find(p => p.id === selectedPropertyId),
    [properties, selectedPropertyId]
  );

  // Debounced search
  const debouncedSearch = useMemo(
    () => debounce((value: string) => {
      setSearchTerm(value);
    }, 300),
    []
  );

  // Fetch properties on mount
  useEffect(() => {
    const fetchProperties = async () => {
      setPropertiesLoading(true);
      try {
        const response = await getProperties({ size: 100 });
        setProperties(response.content || []);
      } catch (error) {
        console.error('Failed to load properties:', error);
        setProperties([]);
      } finally {
        setPropertiesLoading(false);
      }
    };
    fetchProperties();
  }, []);

  // Fetch tenants when property is selected
  const fetchTenants = useCallback(async (isInitial = false) => {
    if (!selectedPropertyId) return;

    try {
      if (isInitial) {
        setIsInitialLoading(true);
      } else {
        setIsFiltering(true);
      }

      const response = await getAllTenants(0, 1000);
      // Filter by property on client side
      const allTenants = response.data?.content || [];
      const propertyTenants = allTenants.filter(t => t.property?.id === selectedPropertyId);
      setTenants(propertyTenants);
    } catch {
      console.error('Failed to fetch tenants');
      setTenants([]);
    } finally {
      setIsInitialLoading(false);
      setIsFiltering(false);
    }
  }, [selectedPropertyId]);

  // Fetch tenants when property changes
  useEffect(() => {
    if (selectedPropertyId) {
      setSearchTerm('');
      setStatusFilter('all');
      fetchTenants(true);
    } else {
      setTenants([]);
    }
  }, [selectedPropertyId, fetchTenants]);

  // Cleanup debounce
  useEffect(() => {
    return () => debouncedSearch.cancel();
  }, [debouncedSearch]);

  // Filter tenants
  const filteredTenants = useMemo(() => {
    let result = tenants;

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(t => t.status === statusFilter);
    }

    // Search filter
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase().trim();
      result = result.filter(t =>
        t.firstName?.toLowerCase().includes(query) ||
        t.lastName?.toLowerCase().includes(query) ||
        t.email?.toLowerCase().includes(query) ||
        t.phone?.includes(query) ||
        t.tenantNumber?.toLowerCase().includes(query) ||
        t.unit?.unitNumber?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [tenants, statusFilter, searchTerm]);

  // Note: Tenant creation removed - use Lead conversion instead

  // Calculate stats
  const stats = useMemo(() => {
    const total = tenants.length;
    const active = tenants.filter(t => t.status === 'ACTIVE').length;
    const pending = tenants.filter(t => t.status === 'PENDING').length;
    const expired = tenants.filter(t => t.status === 'EXPIRED').length;
    const terminated = tenants.filter(t => t.status === 'TERMINATED').length;

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const expiringThisMonth = tenants.filter(t => {
      if (t.status !== 'ACTIVE' || !t.leaseEndDate) return false;
      const leaseEnd = new Date(t.leaseEndDate);
      return leaseEnd >= now && leaseEnd <= thirtyDaysFromNow;
    }).length;

    const activeRate = total > 0 ? (active / total) * 100 : 0;

    return { total, active, pending, expired, terminated, expiringThisMonth, activeRate };
  }, [tenants]);

  // Status styling helper
  const getStatusStyles = (status: TenantStatus) => {
    switch (status) {
      case 'ACTIVE':
        return {
          badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-400 border-emerald-200',
          dot: 'bg-emerald-500',
        };
      case 'PENDING':
        return {
          badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400 border-yellow-200',
          dot: 'bg-yellow-500',
        };
      case 'EXPIRED':
        return {
          badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-400 border-orange-200',
          dot: 'bg-orange-500',
        };
      case 'TERMINATED':
        return {
          badge: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400 border-red-200',
          dot: 'bg-red-500',
        };
      default:
        return {
          badge: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 border-gray-200',
          dot: 'bg-gray-400',
        };
    }
  };

  // Format date helper
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd MMM yyyy');
    } catch {
      return '-';
    }
  };

  // Days until lease end
  const getDaysUntilExpiry = (dateString: string | null | undefined) => {
    if (!dateString) return null;
    try {
      const leaseEnd = new Date(dateString);
      const today = new Date();
      const diffTime = leaseEnd.getTime() - today.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch {
      return null;
    }
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">

          {/* Hero Header */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border shadow-sm">
            <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
            <div className="relative px-8 py-10">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-primary/10 ring-1 ring-primary/20">
                      <Users className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold tracking-tight">Tenants</h1>
                      <p className="text-muted-foreground">
                        Manage your tenants and lease agreements
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  {/* Property Selector */}
                  <Select
                    value={selectedPropertyId}
                    onValueChange={setSelectedPropertyId}
                    disabled={propertiesLoading}
                  >
                    <SelectTrigger className="w-full sm:w-[280px] h-11 bg-background/80 backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-colors">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        <SelectValue placeholder={propertiesLoading ? "Loading..." : "Select property"} />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {properties.map((property) => (
                        <SelectItem key={property.id} value={property.id}>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            {property.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {/* Note: Tenant creation is done via Lead conversion only */}
                </div>
              </div>
            </div>
          </div>

          {/* No Property Selected State */}
          {!selectedPropertyId ? (
            <Card className="border-dashed border-2">
              <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
                  <div className="relative p-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/10">
                    <Building2 className="h-12 w-12 text-primary" />
                  </div>
                </div>
                <h3 className="text-2xl font-semibold mb-2">Select a Property</h3>
                <p className="text-muted-foreground max-w-md mb-6">
                  Choose a property from the dropdown above to view and manage its tenants.
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="h-4 w-4" />
                  <span>{properties.length} properties available</span>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Property Context Bar */}
              {selectedProperty && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted/50 border">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{selectedProperty.name}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Tenants</span>
                  <div className="ml-auto">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedPropertyId('')}
                      className="h-8 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Change Property
                    </Button>
                  </div>
                </div>
              )}

              {/* KPI Dashboard */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Tenants */}
                <Card className="relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -translate-y-6 translate-x-6" />
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Tenants
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    {isInitialLoading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <>
                        <div className="text-3xl font-bold">{stats.total}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-400">
                            {stats.active} Active
                          </Badge>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Active Rate */}
                <Card className="relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full -translate-y-6 translate-x-6" />
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Active Rate
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                  </CardHeader>
                  <CardContent>
                    {isInitialLoading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <>
                        <div className="text-3xl font-bold text-emerald-600">
                          {stats.activeRate.toFixed(1)}%
                        </div>
                        <div className="mt-2">
                          <Progress value={stats.activeRate} className="h-1.5" />
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Expiring Soon */}
                <Card className="relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full -translate-y-6 translate-x-6" />
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Expiring Soon
                    </CardTitle>
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                  </CardHeader>
                  <CardContent>
                    {isInitialLoading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <>
                        <div className="text-3xl font-bold text-amber-600">{stats.expiringThisMonth}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Within 30 days
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* By Status */}
                <Card className="relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full -translate-y-6 translate-x-6" />
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      By Status
                    </CardTitle>
                    <Activity className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    {isInitialLoading ? (
                      <Skeleton className="h-8 w-full" />
                    ) : (
                      <div className="flex items-center gap-2 flex-wrap">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/30">
                              <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                              <span className="text-sm font-semibold text-emerald-600">{stats.active}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>Active</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-yellow-50 dark:bg-yellow-950/30">
                              <Clock className="h-3.5 w-3.5 text-yellow-600" />
                              <span className="text-sm font-semibold text-yellow-600">{stats.pending}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>Pending</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-orange-50 dark:bg-orange-950/30">
                              <AlertTriangle className="h-3.5 w-3.5 text-orange-600" />
                              <span className="text-sm font-semibold text-orange-600">{stats.expired}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>Expired</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-50 dark:bg-red-950/30">
                              <UserX className="h-3.5 w-3.5 text-red-600" />
                              <span className="text-sm font-semibold text-red-600">{stats.terminated}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>Terminated</TooltipContent>
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
                        <TabsTrigger value="all" className="gap-1.5 px-3">
                          <Filter className="h-3.5 w-3.5" />
                          All
                        </TabsTrigger>
                        <TabsTrigger value="ACTIVE" className="gap-1.5 px-3">
                          <UserCheck className="h-3.5 w-3.5" />
                          Active
                        </TabsTrigger>
                        <TabsTrigger value="PENDING" className="gap-1.5 px-3">
                          <Clock className="h-3.5 w-3.5" />
                          Pending
                        </TabsTrigger>
                        <TabsTrigger value="EXPIRED" className="gap-1.5 px-3">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Expired
                        </TabsTrigger>
                        <TabsTrigger value="TERMINATED" className="gap-1.5 px-3">
                          <UserX className="h-3.5 w-3.5" />
                          Terminated
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>

                    <div className="flex-1 flex flex-col sm:flex-row gap-3">
                      {/* Search */}
                      <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search tenants..."
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
                    `${filteredTenants.length} ${filteredTenants.length === 1 ? 'tenant' : 'tenants'} found`
                  )}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchTenants()}
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
              ) : filteredTenants.length === 0 ? (
                <Card className="border-dashed border-2">
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="p-4 rounded-full bg-muted mb-4">
                      <Users className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No tenants found</h3>
                    <p className="text-muted-foreground max-w-sm mb-6">
                      {searchTerm || statusFilter !== 'all'
                        ? "Try adjusting your search or filters to find what you're looking for."
                        : `Convert leads to tenants from the Leads page.`}
                    </p>
                    {!searchTerm && statusFilter === 'all' && (
                      <Button onClick={() => router.push('/leads')} className="gap-2">
                        Go to Leads
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    )}
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
                      {filteredTenants.map((tenant) => {
                        const statusStyles = getStatusStyles(tenant.status);
                        const daysLeft = getDaysUntilExpiry(tenant.leaseEndDate);
                        const isUrgent = tenant.status === 'ACTIVE' && daysLeft !== null && daysLeft <= 30;

                        return (
                          <Card
                            key={tenant.id}
                            className="overflow-hidden group hover:shadow-lg transition-all duration-300 flex flex-col cursor-pointer"
                            onClick={() => router.push(`/tenants/${tenant.id}`)}
                          >
                            {/* Header with Avatar */}
                            <div className="relative h-24 bg-gradient-to-br from-primary/10 via-primary/5 to-muted">
                              {/* Status Badge */}
                              <div className="absolute top-3 left-3">
                                <Badge variant="secondary" className={cn("shadow-sm", statusStyles.badge)}>
                                  <div className={cn("h-1.5 w-1.5 rounded-full mr-1.5", statusStyles.dot)} />
                                  {tenant.status}
                                </Badge>
                              </div>

                              {/* Urgent Badge */}
                              {isUrgent && (
                                <div className="absolute top-3 right-12">
                                  <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-400 shadow-sm">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    {daysLeft}d left
                                  </Badge>
                                </div>
                              )}

                              {/* Actions Menu */}
                              <div className="absolute top-3 right-3" onClick={(e) => e.stopPropagation()}>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="secondary"
                                      size="icon"
                                      className="h-8 w-8 bg-background/90 backdrop-blur-sm shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => router.push(`/tenants/${tenant.id}`)}>
                                      <Eye className="mr-2 h-4 w-4" />
                                      View Details
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>

                              {/* Avatar */}
                              <div className="absolute -bottom-8 left-4">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xl ring-4 ring-background shadow-lg">
                                  {tenant.firstName?.[0]?.toUpperCase()}{tenant.lastName?.[0]?.toUpperCase()}
                                </div>
                              </div>
                            </div>

                            {/* Content */}
                            <CardContent className="p-4 pt-10 flex-1 flex flex-col">
                              <div className="mb-1">
                                <h3 className="font-semibold text-lg truncate" title={`${tenant.firstName} ${tenant.lastName}`}>
                                  {tenant.firstName} {tenant.lastName}
                                </h3>
                                <p className="text-xs text-muted-foreground font-mono">
                                  {tenant.tenantNumber || '-'}
                                </p>
                              </div>

                              <div className="space-y-1.5 mt-2 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2 truncate">
                                  <Mail className="h-3.5 w-3.5 shrink-0" />
                                  <span className="truncate">{tenant.email || '-'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Phone className="h-3.5 w-3.5 shrink-0" />
                                  <span>{tenant.phone || '-'}</span>
                                </div>
                              </div>

                              <div className="mt-auto pt-3 border-t flex items-center justify-between text-sm">
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                  <Calendar className="h-4 w-4 shrink-0" />
                                  <span>{formatDate(tenant.leaseEndDate)}</span>
                                </div>
                                <span className="text-xs text-muted-foreground shrink-0">
                                  Unit {tenant.unit?.unitNumber || '-'}
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
                      {filteredTenants.map((tenant) => {
                        const statusStyles = getStatusStyles(tenant.status);
                        const daysLeft = getDaysUntilExpiry(tenant.leaseEndDate);
                        const isUrgent = tenant.status === 'ACTIVE' && daysLeft !== null && daysLeft <= 30;
                        const isWarning = tenant.status === 'ACTIVE' && daysLeft !== null && daysLeft > 30 && daysLeft <= 60;

                        return (
                          <Card
                            key={tenant.id}
                            className="overflow-hidden hover:shadow-md transition-all cursor-pointer"
                            onClick={() => router.push(`/tenants/${tenant.id}`)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center gap-4">
                                {/* Avatar */}
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-lg shrink-0">
                                  {tenant.firstName?.[0]?.toUpperCase()}{tenant.lastName?.[0]?.toUpperCase()}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-semibold truncate">
                                      {tenant.firstName} {tenant.lastName}
                                    </h3>
                                    <Badge variant="secondary" className={cn("text-xs shrink-0", statusStyles.badge)}>
                                      {tenant.status}
                                    </Badge>
                                    {isUrgent && (
                                      <Badge variant="secondary" className="text-xs shrink-0 bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-400">
                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                        {daysLeft}d left
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground truncate mb-2 font-mono">
                                    {tenant.tenantNumber || '-'}
                                  </p>
                                  <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                                    <span className="flex items-center gap-1 truncate">
                                      <Mail className="h-3.5 w-3.5 shrink-0" />
                                      {tenant.email || '-'}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Phone className="h-3.5 w-3.5" />
                                      {tenant.phone || '-'}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Building2 className="h-3.5 w-3.5" />
                                      Unit {tenant.unit?.unitNumber || '-'}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Calendar className="h-3.5 w-3.5" />
                                      {formatDate(tenant.leaseEndDate)}
                                      {isWarning && daysLeft && (
                                        <span className="text-amber-600 font-medium ml-1">({daysLeft}d)</span>
                                      )}
                                    </span>
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => router.push(`/tenants/${tenant.id}`)}
                                    className="h-9 w-9"
                                  >
                                    <Eye className="h-4 w-4" />
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
            </>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
