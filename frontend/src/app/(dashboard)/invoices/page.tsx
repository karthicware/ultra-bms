'use client';

/**
 * Invoice Dashboard Page - Modern Redesign
 * Inspired by PDC page with executive financial dashboard aesthetic
 * Story 6.1: Rent Invoicing and Payment Management
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { debounce } from 'lodash';
import { format, differenceInDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { useToast } from '@/hooks/use-toast';
import { getInvoices, getInvoiceSummary } from '@/services/invoice.service';
import {
  InvoiceListItem,
  InvoiceSummary,
  InvoiceStatus,
  formatCurrency,
  getInvoiceStatusLabel,
} from '@/types/invoice';
import { cn } from '@/lib/utils';
import {
  Plus,
  Search,
  Clock,
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
  ArrowRight,
  MoreVertical,
  FileText,
  Receipt,
  Send,
  Ban,
  DollarSign,
  CreditCard,
  Building2,
  Users,
  CircleDollarSign,
} from 'lucide-react';

type ViewMode = 'grid' | 'list';

/**
 * Invoice status styles matching the aesthetic of PDC page
 */
const INVOICE_STATUS_STYLES: Record<InvoiceStatus, { badge: string; dot: string; icon: React.ReactNode; gradient: string }> = {
  [InvoiceStatus.DRAFT]: {
    badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300 border-slate-200',
    dot: 'bg-slate-500',
    icon: <FileText className="h-3.5 w-3.5" />,
    gradient: 'from-slate-500/10 to-slate-500/5',
  },
  [InvoiceStatus.SENT]: {
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400 border-blue-200',
    dot: 'bg-blue-500',
    icon: <Send className="h-3.5 w-3.5" />,
    gradient: 'from-blue-500/10 to-blue-500/5',
  },
  [InvoiceStatus.PARTIALLY_PAID]: {
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-400 border-amber-200',
    dot: 'bg-amber-500',
    icon: <Clock className="h-3.5 w-3.5" />,
    gradient: 'from-amber-500/10 to-amber-500/5',
  },
  [InvoiceStatus.PAID]: {
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-400 border-emerald-200',
    dot: 'bg-emerald-500',
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    gradient: 'from-emerald-500/10 to-emerald-500/5',
  },
  [InvoiceStatus.OVERDUE]: {
    badge: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400 border-red-200',
    dot: 'bg-red-500',
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
    gradient: 'from-red-500/10 to-red-500/5',
  },
  [InvoiceStatus.CANCELLED]: {
    badge: 'bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-400 border-gray-200',
    dot: 'bg-gray-500',
    icon: <Ban className="h-3.5 w-3.5" />,
    gradient: 'from-gray-500/10 to-gray-500/5',
  },
};

export default function InvoicesPage() {
  const router = useRouter();
  const { toast } = useToast();

  // State
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [summary, setSummary] = useState<InvoiceSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch invoices
  const fetchInvoices = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getInvoices({
        page: 0,
        size: 1000,
      });
      setInvoices(response.data.content || []);
    } catch (err) {
      console.error('Failed to fetch invoices:', err);
      setError(err as Error);
      toast({
        title: 'Error',
        description: 'Failed to load invoices',
        variant: 'destructive',
      });
      setInvoices([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Fetch summary
  const fetchSummary = useCallback(async () => {
    try {
      const summaryData = await getInvoiceSummary();
      setSummary(summaryData);
    } catch (err) {
      console.error('Failed to fetch summary:', err);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
    fetchSummary();
  }, [fetchInvoices, fetchSummary]);

  const refetch = useCallback(() => {
    fetchInvoices();
    fetchSummary();
  }, [fetchInvoices, fetchSummary]);

  // Debounced search
  const debouncedSearch = useMemo(
    () => debounce((value: string) => {
      setSearchTerm(value);
    }, 300),
    []
  );

  // Navigation handlers
  const handleCreateInvoice = () => router.push('/invoices/new');
  const handleViewAll = () => router.push('/invoices');
  const handleView = (id: string) => router.push(`/invoices/${id}`);

  // Filter invoices
  const filteredInvoices = useMemo(() => {
    let result = invoices;

    if (statusFilter !== 'all') {
      result = result.filter(inv => inv.status === statusFilter);
    }

    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase().trim();
      result = result.filter(inv =>
        inv.invoiceNumber?.toLowerCase().includes(query) ||
        inv.tenantName?.toLowerCase().includes(query) ||
        inv.propertyName?.toLowerCase().includes(query) ||
        inv.unitNumber?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [invoices, statusFilter, searchTerm]);

  // Calculate stats from invoices and summary
  const stats = useMemo(() => {
    const draft = invoices.filter(i => i.status === InvoiceStatus.DRAFT).length;
    const sent = invoices.filter(i => i.status === InvoiceStatus.SENT).length;
    const partiallyPaid = invoices.filter(i => i.status === InvoiceStatus.PARTIALLY_PAID).length;
    const paid = invoices.filter(i => i.status === InvoiceStatus.PAID).length;
    const overdue = invoices.filter(i => i.status === InvoiceStatus.OVERDUE || i.isOverdue).length;
    const cancelled = invoices.filter(i => i.status === InvoiceStatus.CANCELLED).length;

    return {
      draft,
      sent,
      partiallyPaid,
      paid,
      overdue,
      cancelled,
      totalInvoiced: summary?.totalInvoiced || 0,
      totalCollected: summary?.totalCollected || 0,
      totalOutstanding: summary?.totalOutstanding || 0,
      overdueAmount: summary?.overdueAmount || 0,
      collectionRate: summary?.collectionRate || 0,
    };
  }, [invoices, summary]);

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
  const getDaysUntilDue = (dueDate: string) => {
    try {
      const days = differenceInDays(new Date(dueDate), new Date());
      return days;
    } catch {
      return 0;
    }
  };

  // Get urgency badge for days until due
  const getDueBadge = (daysUntilDue: number, status: InvoiceStatus) => {
    if (status === InvoiceStatus.PAID || status === InvoiceStatus.CANCELLED) return null;

    if (daysUntilDue < 0) {
      return <Badge variant="destructive" className="text-xs">Overdue</Badge>;
    } else if (daysUntilDue === 0) {
      return <Badge className="bg-red-500 text-white text-xs">Due Today</Badge>;
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
                <h3 className="text-lg font-semibold mb-2">Failed to load invoices</h3>
                <p className="text-muted-foreground max-w-sm mb-6">
                  There was an error loading the invoice data. Please try again.
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
                      <Receipt className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold tracking-tight">Invoice Management</h1>
                      <p className="text-muted-foreground">
                        Create, track, and manage rent invoices and payments
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => refetch()}
                    className="gap-2"
                    disabled={isLoading}
                  >
                    <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                    Refresh
                  </Button>
                  <Button
                    onClick={handleCreateInvoice}
                    size="lg"
                    className="gap-2 shadow-lg shadow-primary/20"
                  >
                    <Plus className="h-5 w-5" />
                    Create Invoice
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* KPI Dashboard */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Invoiced */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -translate-y-6 translate-x-6" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Invoiced
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-28" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      {formatCurrency(stats.totalInvoiced)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      This month
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Collected */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full -translate-y-6 translate-x-6" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Collected
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-28" />
                ) : (
                  <>
                    <div className="text-2xl font-bold text-emerald-600">
                      {formatCurrency(stats.totalCollected)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stats.collectionRate.toFixed(1)}% collection rate
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Outstanding */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full -translate-y-6 translate-x-6" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Outstanding
                </CardTitle>
                <Clock className="h-4 w-4 text-amber-600" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-28" />
                ) : (
                  <>
                    <div className="text-2xl font-bold text-amber-600">
                      {formatCurrency(stats.totalOutstanding)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Pending payment
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Overdue */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/5 rounded-full -translate-y-6 translate-x-6" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Overdue
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-28" />
                ) : (
                  <>
                    <div className="text-2xl font-bold text-red-600">
                      {formatCurrency(stats.overdueAmount)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stats.overdue} invoices overdue
                    </p>
                  </>
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
                  Invoice Pipeline Status
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
                        onClick={() => setStatusFilter(InvoiceStatus.DRAFT)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors border border-slate-200 dark:border-slate-800"
                      >
                        <FileText className="h-4 w-4 text-slate-600" />
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{stats.draft} Draft</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Invoices not yet sent</TooltipContent>
                  </Tooltip>

                  <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setStatusFilter(InvoiceStatus.SENT)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors border border-blue-200 dark:border-blue-800"
                      >
                        <Send className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">{stats.sent} Sent</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Awaiting payment</TooltipContent>
                  </Tooltip>

                  <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setStatusFilter(InvoiceStatus.PARTIALLY_PAID)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors border border-amber-200 dark:border-amber-800"
                      >
                        <Clock className="h-4 w-4 text-amber-600" />
                        <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">{stats.partiallyPaid} Partial</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Partially paid invoices</TooltipContent>
                  </Tooltip>

                  <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />

                  <div className="flex items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setStatusFilter(InvoiceStatus.PAID)}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors border border-emerald-200 dark:border-emerald-800"
                        >
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">{stats.paid} Paid</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Fully paid invoices</TooltipContent>
                    </Tooltip>

                    <span className="text-muted-foreground text-sm">/</span>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setStatusFilter(InvoiceStatus.OVERDUE)}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors border border-red-200 dark:border-red-800"
                        >
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          <span className="text-sm font-semibold text-red-700 dark:text-red-400">{stats.overdue} Overdue</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Payment past due date</TooltipContent>
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
                  <TabsList className="grid w-full lg:w-auto grid-cols-4 lg:grid-cols-7 h-10">
                    <TabsTrigger value="all" className="gap-1.5 px-2 text-xs lg:text-sm">
                      <Filter className="h-3.5 w-3.5" />
                      All
                    </TabsTrigger>
                    <TabsTrigger value={InvoiceStatus.DRAFT} className="gap-1.5 px-2 text-xs lg:text-sm">
                      <FileText className="h-3.5 w-3.5" />
                      Draft
                    </TabsTrigger>
                    <TabsTrigger value={InvoiceStatus.SENT} className="gap-1.5 px-2 text-xs lg:text-sm">
                      <Send className="h-3.5 w-3.5" />
                      Sent
                    </TabsTrigger>
                    <TabsTrigger value={InvoiceStatus.PARTIALLY_PAID} className="gap-1.5 px-2 text-xs lg:text-sm">
                      <Clock className="h-3.5 w-3.5" />
                      Partial
                    </TabsTrigger>
                    <TabsTrigger value={InvoiceStatus.PAID} className="gap-1.5 px-2 text-xs lg:text-sm">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Paid
                    </TabsTrigger>
                    <TabsTrigger value={InvoiceStatus.OVERDUE} className="gap-1.5 px-2 text-xs lg:text-sm">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Overdue
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="flex-1 flex flex-col sm:flex-row gap-3">
                  {/* Search */}
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by invoice #, tenant, property..."
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
                `${filteredInvoices.length} ${filteredInvoices.length === 1 ? 'invoice' : 'invoices'} found`
              )}
            </span>
            {statusFilter !== 'all' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStatusFilter('all')}
                className="gap-2"
              >
                Clear Filter
                <XCircle className="h-4 w-4" />
              </Button>
            )}
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
          ) : filteredInvoices.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="p-4 rounded-full bg-muted mb-4">
                  <Receipt className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No invoices found</h3>
                <p className="text-muted-foreground max-w-sm mb-6">
                  {searchTerm || statusFilter !== 'all'
                    ? "Try adjusting your search or filters."
                    : "Get started by creating your first invoice."}
                </p>
                {!searchTerm && statusFilter === 'all' && (
                  <Button onClick={handleCreateInvoice} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Invoice
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="transition-opacity duration-200">
              {/* Grid View */}
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredInvoices.map((invoice) => {
                    const statusStyles = INVOICE_STATUS_STYLES[invoice.status];
                    const daysUntilDue = getDaysUntilDue(invoice.dueDate);

                    return (
                      <Card
                        key={invoice.id}
                        className="overflow-hidden group hover:shadow-lg transition-all duration-300 flex flex-col cursor-pointer"
                        onClick={() => handleView(invoice.id)}
                      >
                        {/* Header */}
                        <div className={cn("relative h-24 bg-gradient-to-br", statusStyles.gradient, "to-muted")}>
                          {/* Status Badge */}
                          <div className="absolute top-3 left-3">
                            <Badge variant="secondary" className={cn("shadow-sm", statusStyles.badge)}>
                              <div className={cn("h-1.5 w-1.5 rounded-full mr-1.5", statusStyles.dot)} />
                              {getInvoiceStatusLabel(invoice.status)}
                            </Badge>
                          </div>

                          {/* Days Badge */}
                          <div className="absolute top-3 right-12">
                            {getDueBadge(daysUntilDue, invoice.status)}
                          </div>

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
                                <DropdownMenuItem onClick={() => handleView(invoice.id)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
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
                            <h3 className="font-semibold text-lg truncate font-mono" title={invoice.invoiceNumber}>
                              {invoice.invoiceNumber}
                            </h3>
                            <p className="text-sm text-muted-foreground truncate">
                              {invoice.tenantName}
                            </p>
                          </div>

                          <div className="space-y-1.5 mt-3 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground flex items-center gap-1.5">
                                <Building2 className="h-3.5 w-3.5" />
                                {invoice.propertyName}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" />
                                Due: {formatDate(invoice.dueDate)}
                              </span>
                            </div>
                          </div>

                          <div className="mt-auto pt-3 border-t">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-lg font-bold text-primary">
                                  {formatCurrency(invoice.totalAmount)}
                                </span>
                                {invoice.balanceAmount > 0 && invoice.balanceAmount !== invoice.totalAmount && (
                                  <p className="text-xs text-amber-600">
                                    Balance: {formatCurrency(invoice.balanceAmount)}
                                  </p>
                                )}
                              </div>
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
                  {filteredInvoices.map((invoice) => {
                    const statusStyles = INVOICE_STATUS_STYLES[invoice.status];
                    const daysUntilDue = getDaysUntilDue(invoice.dueDate);

                    return (
                      <Card
                        key={invoice.id}
                        className={cn(
                          "overflow-hidden hover:shadow-md transition-all cursor-pointer",
                          invoice.isOverdue && "border-red-200 dark:border-red-800 bg-red-50/30 dark:bg-red-950/20"
                        )}
                        onClick={() => handleView(invoice.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            {/* Icon */}
                            <div className={cn(
                              "flex h-12 w-12 items-center justify-center rounded-xl shrink-0",
                              invoice.status === InvoiceStatus.PAID && "bg-emerald-100 dark:bg-emerald-900/30",
                              invoice.status === InvoiceStatus.OVERDUE && "bg-red-100 dark:bg-red-900/30",
                              invoice.status === InvoiceStatus.PARTIALLY_PAID && "bg-amber-100 dark:bg-amber-900/30",
                              invoice.status === InvoiceStatus.SENT && "bg-blue-100 dark:bg-blue-900/30",
                              invoice.status === InvoiceStatus.DRAFT && "bg-slate-100 dark:bg-slate-900/30",
                              invoice.status === InvoiceStatus.CANCELLED && "bg-gray-100 dark:bg-gray-900/30"
                            )}>
                              <Receipt className={cn(
                                "h-5 w-5",
                                invoice.status === InvoiceStatus.PAID && "text-emerald-600",
                                invoice.status === InvoiceStatus.OVERDUE && "text-red-600",
                                invoice.status === InvoiceStatus.PARTIALLY_PAID && "text-amber-600",
                                invoice.status === InvoiceStatus.SENT && "text-blue-600",
                                invoice.status === InvoiceStatus.DRAFT && "text-slate-600",
                                invoice.status === InvoiceStatus.CANCELLED && "text-gray-600"
                              )} />
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h3 className="font-semibold font-mono truncate">
                                  {invoice.invoiceNumber}
                                </h3>
                                <Badge variant="secondary" className={cn("text-xs shrink-0", statusStyles.badge)}>
                                  {getInvoiceStatusLabel(invoice.status)}
                                </Badge>
                                {getDueBadge(daysUntilDue, invoice.status)}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {invoice.tenantName}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                                <span className="flex items-center gap-1">
                                  <Building2 className="h-3.5 w-3.5" />
                                  {invoice.propertyName} - Unit {invoice.unitNumber}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3.5 w-3.5" />
                                  Due: {formatDate(invoice.dueDate)}
                                </span>
                              </div>
                            </div>

                            {/* Amount & Actions */}
                            <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
                              <div className="text-right">
                                <div className="text-lg font-bold text-primary">
                                  {formatCurrency(invoice.totalAmount)}
                                </div>
                                {invoice.balanceAmount > 0 && invoice.balanceAmount !== invoice.totalAmount && (
                                  <p className="text-xs text-amber-600">
                                    Balance: {formatCurrency(invoice.balanceAmount)}
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center gap-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleView(invoice.id)}
                                      className="h-9 w-9"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>View Details</TooltipContent>
                                </Tooltip>
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
              <Link href="/invoices/new">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Plus className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Create Invoice</div>
                  <div className="text-xs text-muted-foreground">Generate new invoice</div>
                </div>
              </Link>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-4 justify-start px-4 gap-3 hover:border-red-500/50 hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-all"
              onClick={() => setStatusFilter(InvoiceStatus.OVERDUE)}
            >
              <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div className="text-left">
                <div className="font-semibold">Overdue Invoices</div>
                <div className="text-xs text-muted-foreground">{stats.overdue} need attention</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-4 justify-start px-4 gap-3 hover:border-amber-500/50 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-all"
              onClick={() => setStatusFilter(InvoiceStatus.PARTIALLY_PAID)}
            >
              <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div className="text-left">
                <div className="font-semibold">Partial Payments</div>
                <div className="text-xs text-muted-foreground">{stats.partiallyPaid} pending completion</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-4 justify-start px-4 gap-3 hover:border-emerald-500/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all"
              onClick={() => setStatusFilter(InvoiceStatus.PAID)}
            >
              <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="text-left">
                <div className="font-semibold">Paid Invoices</div>
                <div className="text-xs text-muted-foreground">{stats.paid} completed</div>
              </div>
            </Button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
