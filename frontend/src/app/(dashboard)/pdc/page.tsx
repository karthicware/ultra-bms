'use client';

/**
 * PDC Dashboard Page - Modern Redesign
 * Inspired by leads page with executive financial dashboard aesthetic
 * Story 6.3: Post-Dated Cheque (PDC) Management
 */

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { debounce } from 'lodash';
import { format, differenceInDays, isWithinInterval, addDays } from 'date-fns';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { usePDCDashboard } from '@/hooks/usePDCs';
import {
  formatPDCCurrency,
  PDCStatus,
  getPDCStatusColor,
  PDC_STATUS_LABELS,
  type PDCListItem
} from '@/types/pdc';
import { cn } from '@/lib/utils';
import {
  Plus,
  Search,
  Clock,
  Building2,
  AlertTriangle,
  Eye,
  CheckCircle2,
  XCircle,
  LayoutGrid,
  List,
  Filter,
  RefreshCw,
  Calendar,
  TrendingUp,
  Activity,
  ArrowUpRight,
  CreditCard,
  Wallet,
  MoreVertical,
  Banknote,
  FileText,
  ArrowRight,
  Inbox,
  Send,
  RotateCcw,
  Ban,
  Timer,
  CircleDollarSign,
  Receipt,
  Landmark,
} from 'lucide-react';

type ViewMode = 'grid' | 'list';

/**
 * PDC status styles matching the aesthetic of leads page
 */
const PDC_STATUS_STYLES: Record<PDCStatus, { badge: string; dot: string; icon: React.ReactNode; gradient: string }> = {
  [PDCStatus.RECEIVED]: {
    badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300 border-slate-200',
    dot: 'bg-slate-500',
    icon: <Inbox className="h-3.5 w-3.5" />,
    gradient: 'from-slate-500/10 to-slate-500/5',
  },
  [PDCStatus.DUE]: {
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-400 border-amber-200',
    dot: 'bg-amber-500',
    icon: <Timer className="h-3.5 w-3.5" />,
    gradient: 'from-amber-500/10 to-amber-500/5',
  },
  [PDCStatus.DEPOSITED]: {
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400 border-blue-200',
    dot: 'bg-blue-500',
    icon: <Building2 className="h-3.5 w-3.5" />,
    gradient: 'from-blue-500/10 to-blue-500/5',
  },
  [PDCStatus.CLEARED]: {
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-400 border-emerald-200',
    dot: 'bg-emerald-500',
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    gradient: 'from-emerald-500/10 to-emerald-500/5',
  },
  [PDCStatus.BOUNCED]: {
    badge: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400 border-red-200',
    dot: 'bg-red-500',
    icon: <XCircle className="h-3.5 w-3.5" />,
    gradient: 'from-red-500/10 to-red-500/5',
  },
  [PDCStatus.CANCELLED]: {
    badge: 'bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-400 border-gray-200',
    dot: 'bg-gray-500',
    icon: <Ban className="h-3.5 w-3.5" />,
    gradient: 'from-gray-500/10 to-gray-500/5',
  },
  [PDCStatus.REPLACED]: {
    badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-400 border-purple-200',
    dot: 'bg-purple-500',
    icon: <RotateCcw className="h-3.5 w-3.5" />,
    gradient: 'from-purple-500/10 to-purple-500/5',
  },
  [PDCStatus.WITHDRAWN]: {
    badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-400 border-orange-200',
    dot: 'bg-orange-500',
    icon: <ArrowUpRight className="h-3.5 w-3.5" />,
    gradient: 'from-orange-500/10 to-orange-500/5',
  },
};

export default function PDCDashboardPage() {
  const router = useRouter();
  const { data: dashboard, isLoading, error, refetch } = usePDCDashboard();

  // State
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Debounced search
  const debouncedSearch = useMemo(
    () => debounce((value: string) => {
      setSearchTerm(value);
    }, 300),
    []
  );

  // Navigation handlers
  const handleCreatePDC = () => router.push('/pdc/new');
  const handleViewAll = () => router.push('/pdc/list');
  const handleViewWithStatus = (status: PDCStatus) => router.push(`/pdc/list?status=${status}`);
  const handleDeposit = (id: string) => router.push(`/pdc/${id}?action=deposit`);
  const handleClear = (id: string) => router.push(`/pdc/${id}?action=clear`);
  const handleBounce = (id: string) => router.push(`/pdc/${id}?action=bounce`);
  const handleView = (id: string) => router.push(`/pdc/${id}`);

  // Combine upcoming and deposited PDCs for unified list
  const allPDCs = useMemo(() => {
    if (!dashboard) return [];
    const combined = [
      ...(dashboard.upcomingPDCs || []),
      ...(dashboard.recentlyDepositedPDCs || []),
    ];
    // Remove duplicates by id
    const unique = Array.from(new Map(combined.map(p => [p.id, p])).values());
    return unique;
  }, [dashboard]);

  // Filter PDCs
  const filteredPDCs = useMemo(() => {
    let result = allPDCs;

    if (statusFilter !== 'all') {
      result = result.filter(p => p.status === statusFilter);
    }

    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase().trim();
      result = result.filter(p =>
        p.chequeNumber?.toLowerCase().includes(query) ||
        p.tenantName?.toLowerCase().includes(query) ||
        p.bankName?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [allPDCs, statusFilter, searchTerm]);

  // Calculate stats from dashboard data
  const stats = useMemo(() => {
    if (!dashboard) {
      return {
        dueThisWeek: 0,
        dueThisWeekValue: 0,
        deposited: 0,
        depositedValue: 0,
        totalOutstanding: 0,
        recentlyBounced: 0,
        clearanceRate: 0,
      };
    }

    // Calculate clearance rate (cleared / total processed)
    const totalProcessed = (dashboard.pdcsDeposited?.count || 0) + (dashboard.recentlyBouncedCount || 0);
    const clearanceRate = totalProcessed > 0
      ? ((dashboard.pdcsDeposited?.count || 0) - (dashboard.recentlyBouncedCount || 0)) / totalProcessed * 100
      : 0;

    return {
      dueThisWeek: dashboard.pdcsDueThisWeek?.count || 0,
      dueThisWeekValue: dashboard.pdcsDueThisWeek?.totalValue || 0,
      deposited: dashboard.pdcsDeposited?.count || 0,
      depositedValue: dashboard.pdcsDeposited?.totalValue || 0,
      totalOutstanding: dashboard.totalOutstandingValue || 0,
      recentlyBounced: dashboard.recentlyBouncedCount || 0,
      clearanceRate: Math.max(0, clearanceRate),
    };
  }, [dashboard]);

  // Format date helper
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd MMM yyyy');
    } catch {
      return '-';
    }
  };

  // Calculate days until due
  const getDaysUntilDue = (chequeDate: string) => {
    try {
      const days = differenceInDays(new Date(chequeDate), new Date());
      return days;
    } catch {
      return 0;
    }
  };

  // Get urgency badge for days until due
  const getDueBadge = (daysUntilDue: number) => {
    if (daysUntilDue < 0) {
      return <Badge variant="destructive" className="text-xs">Overdue</Badge>;
    } else if (daysUntilDue === 0) {
      return <Badge className="bg-red-500 text-white text-xs">Today</Badge>;
    } else if (daysUntilDue <= 3) {
      return <Badge className="bg-amber-500 text-white text-xs">{daysUntilDue}d</Badge>;
    } else if (daysUntilDue <= 7) {
      return <Badge variant="secondary" className="text-xs">{daysUntilDue}d</Badge>;
    }
    return null;
  };

  if (error) {
    return (
      <TooltipProvider>
        <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
          <div className="container mx-auto px-4 py-8 max-w-7xl">
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="p-4 rounded-full bg-destructive/10 mb-4">
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Failed to load PDC dashboard</h3>
                <p className="text-muted-foreground max-w-sm mb-6">
                  There was an error loading the dashboard data. Please try again.
                </p>
                <Button onClick={() => refetch()} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Retry
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </TooltipProvider>
    );
  }

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
                      <CreditCard className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold tracking-tight">PDC Management</h1>
                      <p className="text-muted-foreground">
                        Track post-dated cheques and manage your payment pipeline
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={handleViewAll}
                    className="gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    View All
                  </Button>
                  <Button
                    onClick={handleCreatePDC}
                    size="lg"
                    className="gap-2 shadow-lg shadow-primary/20"
                  >
                    <Plus className="h-5 w-5" />
                    Register PDC
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* KPI Dashboard */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Due This Week */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -translate-y-6 translate-x-6" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Due This Week
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <>
                    <div className="text-3xl font-bold">{stats.dueThisWeek}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-400">
                        {formatPDCCurrency(stats.dueThisWeekValue)}
                      </Badge>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Deposited (Pending) */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full -translate-y-6 translate-x-6" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Deposited
                </CardTitle>
                <Building2 className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <>
                    <div className="text-3xl font-bold text-blue-600">{stats.deposited}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatPDCCurrency(stats.depositedValue)} pending
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Total Outstanding */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full -translate-y-6 translate-x-6" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Outstanding
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-28" />
                ) : (
                  <>
                    <div className="text-2xl font-bold text-emerald-600">
                      {formatPDCCurrency(stats.totalOutstanding)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Uncashed PDCs value
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Pipeline Status */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/5 rounded-full -translate-y-6 translate-x-6" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pipeline Status
                </CardTitle>
                <Activity className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-full" />
                ) : (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-50 dark:bg-amber-950/30">
                          <Timer className="h-3.5 w-3.5 text-amber-600" />
                          <span className="text-sm font-semibold text-amber-600">{stats.dueThisWeek}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>Due</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-950/30">
                          <Building2 className="h-3.5 w-3.5 text-blue-600" />
                          <span className="text-sm font-semibold text-blue-600">{stats.deposited}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>Deposited</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-50 dark:bg-red-950/30">
                          <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                          <span className="text-sm font-semibold text-red-600">{stats.recentlyBounced}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>Bounced (30d)</TooltipContent>
                    </Tooltip>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Pipeline Status Visual */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="h-5 w-5 text-muted-foreground" />
                  PDC Pipeline Status
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => refetch()} className="gap-2">
                  <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pb-6">
              {isLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => handleViewWithStatus(PDCStatus.RECEIVED)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors border border-slate-200 dark:border-slate-800"
                      >
                        <Inbox className="h-4 w-4 text-slate-600" />
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Received</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>PDCs received from tenants</TooltipContent>
                  </Tooltip>

                  <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => handleViewWithStatus(PDCStatus.DUE)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors border border-amber-200 dark:border-amber-800"
                      >
                        <Timer className="h-4 w-4 text-amber-600" />
                        <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">{stats.dueThisWeek} Due</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Ready to deposit</TooltipContent>
                  </Tooltip>

                  <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => handleViewWithStatus(PDCStatus.DEPOSITED)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors border border-blue-200 dark:border-blue-800"
                      >
                        <Building2 className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">{stats.deposited} Deposited</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Awaiting bank clearance</TooltipContent>
                  </Tooltip>

                  <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />

                  <div className="flex items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => handleViewWithStatus(PDCStatus.CLEARED)}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors border border-emerald-200 dark:border-emerald-800"
                        >
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Cleared</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Successfully cleared</TooltipContent>
                    </Tooltip>

                    <span className="text-muted-foreground text-sm">/</span>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => handleViewWithStatus(PDCStatus.BOUNCED)}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors border border-red-200 dark:border-red-800"
                        >
                          <XCircle className="h-4 w-4 text-red-600" />
                          <span className="text-sm font-semibold text-red-700 dark:text-red-400">{stats.recentlyBounced} Bounced</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Failed payments - action required</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

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
                  <TabsList className="grid w-full lg:w-auto grid-cols-4 lg:grid-cols-6 h-10">
                    <TabsTrigger value="all" className="gap-1.5 px-2 text-xs lg:text-sm">
                      <Filter className="h-3.5 w-3.5" />
                      All
                    </TabsTrigger>
                    <TabsTrigger value={PDCStatus.DUE} className="gap-1.5 px-2 text-xs lg:text-sm">
                      <Timer className="h-3.5 w-3.5" />
                      Due
                    </TabsTrigger>
                    <TabsTrigger value={PDCStatus.DEPOSITED} className="gap-1.5 px-2 text-xs lg:text-sm">
                      <Building2 className="h-3.5 w-3.5" />
                      Deposited
                    </TabsTrigger>
                    <TabsTrigger value={PDCStatus.CLEARED} className="gap-1.5 px-2 text-xs lg:text-sm">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Cleared
                    </TabsTrigger>
                    <TabsTrigger value={PDCStatus.BOUNCED} className="gap-1.5 px-2 text-xs lg:text-sm">
                      <XCircle className="h-3.5 w-3.5" />
                      Bounced
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="flex-1 flex flex-col sm:flex-row gap-3">
                  {/* Search */}
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by cheque no, tenant, bank..."
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
              {isLoading ? (
                <Skeleton className="h-4 w-32" />
              ) : (
                `${filteredPDCs.length} ${filteredPDCs.length === 1 ? 'PDC' : 'PDCs'} found`
              )}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewAll}
              className="gap-2"
            >
              View All PDCs
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Content Area */}
          {isLoading ? (
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
          ) : filteredPDCs.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="p-4 rounded-full bg-muted mb-4">
                  <CreditCard className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No PDCs found</h3>
                <p className="text-muted-foreground max-w-sm mb-6">
                  {searchTerm || statusFilter !== 'all'
                    ? "Try adjusting your search or filters."
                    : "Get started by registering your first PDC."}
                </p>
                {!searchTerm && statusFilter === 'all' && (
                  <Button onClick={handleCreatePDC} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Register PDC
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="transition-opacity duration-200">
              {/* Grid View */}
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredPDCs.map((pdc) => {
                    const statusStyles = PDC_STATUS_STYLES[pdc.status];
                    const daysUntilDue = getDaysUntilDue(pdc.chequeDate);

                    return (
                      <Card
                        key={pdc.id}
                        className="overflow-hidden group hover:shadow-lg transition-all duration-300 flex flex-col cursor-pointer"
                        onClick={() => handleView(pdc.id)}
                      >
                        {/* Header */}
                        <div className={cn("relative h-24 bg-gradient-to-br", statusStyles.gradient, "to-muted")}>
                          {/* Status Badge */}
                          <div className="absolute top-3 left-3">
                            <Badge variant="secondary" className={cn("shadow-sm", statusStyles.badge)}>
                              <div className={cn("h-1.5 w-1.5 rounded-full mr-1.5", statusStyles.dot)} />
                              {PDC_STATUS_LABELS[pdc.status]}
                            </Badge>
                          </div>

                          {/* Days Badge */}
                          {pdc.status === PDCStatus.DUE && (
                            <div className="absolute top-3 right-12">
                              {getDueBadge(daysUntilDue)}
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
                                <DropdownMenuItem onClick={() => handleView(pdc.id)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                {pdc.status === PDCStatus.DUE && (
                                  <DropdownMenuItem onClick={() => handleDeposit(pdc.id)}>
                                    <ArrowUpRight className="mr-2 h-4 w-4" />
                                    Deposit
                                  </DropdownMenuItem>
                                )}
                                {pdc.status === PDCStatus.DEPOSITED && (
                                  <>
                                    <DropdownMenuItem onClick={() => handleClear(pdc.id)}>
                                      <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-600" />
                                      Mark Cleared
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleBounce(pdc.id)} className="text-red-600">
                                      <XCircle className="mr-2 h-4 w-4" />
                                      Mark Bounced
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          {/* Icon */}
                          <div className="absolute -bottom-6 left-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-background text-foreground font-bold ring-4 ring-background shadow-lg">
                              <Receipt className="h-6 w-6 text-primary" />
                            </div>
                          </div>
                        </div>

                        {/* Content */}
                        <CardContent className="p-4 pt-8 flex-1 flex flex-col">
                          <div className="mb-1">
                            <h3 className="font-semibold text-lg truncate font-mono" title={pdc.chequeNumber}>
                              {pdc.chequeNumber}
                            </h3>
                            <p className="text-sm text-muted-foreground truncate">
                              {pdc.tenantName}
                            </p>
                          </div>

                          <div className="space-y-1.5 mt-3 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground flex items-center gap-1.5">
                                <Landmark className="h-3.5 w-3.5" />
                                {pdc.bankName}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" />
                                {formatDate(pdc.chequeDate)}
                              </span>
                            </div>
                          </div>

                          <div className="mt-auto pt-3 border-t">
                            <div className="flex items-center justify-between">
                              <span className="text-lg font-bold text-primary">
                                {formatPDCCurrency(pdc.amount)}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                /* List View */
                <div className="space-y-3">
                  {filteredPDCs.map((pdc) => {
                    const statusStyles = PDC_STATUS_STYLES[pdc.status];
                    const daysUntilDue = getDaysUntilDue(pdc.chequeDate);

                    return (
                      <Card
                        key={pdc.id}
                        className="overflow-hidden hover:shadow-md transition-all cursor-pointer"
                        onClick={() => handleView(pdc.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            {/* Icon */}
                            <div className={cn(
                              "flex h-12 w-12 items-center justify-center rounded-xl shrink-0",
                              pdc.status === PDCStatus.CLEARED && "bg-emerald-100 dark:bg-emerald-900/30",
                              pdc.status === PDCStatus.BOUNCED && "bg-red-100 dark:bg-red-900/30",
                              pdc.status === PDCStatus.DEPOSITED && "bg-blue-100 dark:bg-blue-900/30",
                              pdc.status === PDCStatus.DUE && "bg-amber-100 dark:bg-amber-900/30",
                              ![PDCStatus.CLEARED, PDCStatus.BOUNCED, PDCStatus.DEPOSITED, PDCStatus.DUE].includes(pdc.status) && "bg-muted"
                            )}>
                              {statusStyles.icon && (
                                <div className={cn(
                                  pdc.status === PDCStatus.CLEARED && "text-emerald-600",
                                  pdc.status === PDCStatus.BOUNCED && "text-red-600",
                                  pdc.status === PDCStatus.DEPOSITED && "text-blue-600",
                                  pdc.status === PDCStatus.DUE && "text-amber-600",
                                  ![PDCStatus.CLEARED, PDCStatus.BOUNCED, PDCStatus.DEPOSITED, PDCStatus.DUE].includes(pdc.status) && "text-muted-foreground"
                                )}>
                                  <Receipt className="h-5 w-5" />
                                </div>
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h3 className="font-semibold font-mono truncate">
                                  {pdc.chequeNumber}
                                </h3>
                                <Badge variant="secondary" className={cn("text-xs shrink-0", statusStyles.badge)}>
                                  {PDC_STATUS_LABELS[pdc.status]}
                                </Badge>
                                {pdc.status === PDCStatus.DUE && getDueBadge(daysUntilDue)}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {pdc.tenantName}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                                <span className="flex items-center gap-1">
                                  <Landmark className="h-3.5 w-3.5" />
                                  {pdc.bankName}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3.5 w-3.5" />
                                  {formatDate(pdc.chequeDate)}
                                </span>
                              </div>
                            </div>

                            {/* Amount & Actions */}
                            <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
                              <div className="text-right">
                                <div className="text-lg font-bold text-primary">
                                  {formatPDCCurrency(pdc.amount)}
                                </div>
                              </div>

                              <div className="flex items-center gap-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleView(pdc.id)}
                                      className="h-9 w-9"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>View Details</TooltipContent>
                                </Tooltip>

                                {pdc.status === PDCStatus.DUE && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDeposit(pdc.id)}
                                        className="h-9 w-9 hover:text-blue-600 hover:bg-blue-50"
                                      >
                                        <ArrowUpRight className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Deposit</TooltipContent>
                                  </Tooltip>
                                )}

                                {pdc.status === PDCStatus.DEPOSITED && (
                                  <>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => handleClear(pdc.id)}
                                          className="h-9 w-9 hover:text-emerald-600 hover:bg-emerald-50"
                                        >
                                          <CheckCircle2 className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Mark Cleared</TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => handleBounce(pdc.id)}
                                          className="h-9 w-9 hover:text-red-600 hover:bg-red-50"
                                        >
                                          <XCircle className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Mark Bounced</TooltipContent>
                                    </Tooltip>
                                  </>
                                )}
                              </div>
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

          {/* Quick Links */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Button
              variant="outline"
              className="h-auto py-4 justify-start px-4 gap-3 hover:border-primary/50 hover:bg-primary/5 dark:hover:bg-primary/10 transition-all"
              asChild
            >
              <Link href="/pdc/new">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Plus className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Register PDC</div>
                  <div className="text-xs text-muted-foreground">Add new cheques</div>
                </div>
              </Link>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-4 justify-start px-4 gap-3 hover:border-red-500/50 hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-all"
              asChild
            >
              <Link href="/pdc/list?status=BOUNCED">
                <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Bounced Cheques</div>
                  <div className="text-xs text-muted-foreground">Action required</div>
                </div>
              </Link>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-4 justify-start px-4 gap-3 hover:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all"
              asChild
            >
              <Link href="/pdc/withdrawals">
                <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <RotateCcw className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Withdrawal History</div>
                  <div className="text-xs text-muted-foreground">View past actions</div>
                </div>
              </Link>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-4 justify-start px-4 gap-3 hover:border-primary/50 hover:bg-muted/50 transition-all"
              asChild
            >
              <Link href="/pdc/list">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">All Records</div>
                  <div className="text-xs text-muted-foreground">Search and filter</div>
                </div>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
