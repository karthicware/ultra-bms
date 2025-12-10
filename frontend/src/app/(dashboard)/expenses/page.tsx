'use client';

/**
 * Expense Dashboard Page - Modern Redesign
 * Inspired by leads page with executive financial dashboard aesthetic
 * Story 6.2: Expense Management and Vendor Payments
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { debounce } from 'lodash';
import { format } from 'date-fns';
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
import { getExpenses, getExpenseSummary } from '@/services/expense.service';
import {
  ExpenseListItem,
  ExpenseSummary,
  ExpenseCategory,
  PaymentStatus,
  formatExpenseCurrency,
  getExpenseCategoryColor,
  getPaymentStatusColor,
  EXPENSE_CATEGORY_LABELS,
  PAYMENT_STATUS_LABELS,
} from '@/types/expense';
import { cn } from '@/lib/utils';
import { ExpenseSummaryCharts } from '@/components/expenses/ExpenseSummaryCharts';
import ExpensesDatatable from '@/components/expenses/ExpensesDatatable';
import {
  Plus,
  Search,
  Clock,
  CheckCircle2,
  Receipt,
  Wallet,
  CreditCard,
  TrendingUp,
  Activity,
  ArrowRight,
  RefreshCw,
  Filter,
  LayoutGrid,
  List,
  Eye,
  Pencil,
  MoreVertical,
  Building2,
  Wrench,
  Zap,
  Users,
  Package,
  Shield,
  FileText,
  MoreHorizontal,
  AlertTriangle,
  ArrowUpRight,
  PieChart,
  DollarSign,
} from 'lucide-react';

type ViewMode = 'grid' | 'list';

/**
 * Payment status styles matching the aesthetic of leads page
 */
const PAYMENT_STATUS_STYLES: Record<PaymentStatus, { badge: string; dot: string; icon: React.ReactNode; gradient: string }> = {
  [PaymentStatus.PENDING]: {
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-400 border-amber-200',
    dot: 'bg-amber-500',
    icon: <Clock className="h-3.5 w-3.5" />,
    gradient: 'from-amber-500/10 to-amber-500/5',
  },
  [PaymentStatus.PAID]: {
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-400 border-emerald-200',
    dot: 'bg-emerald-500',
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    gradient: 'from-emerald-500/10 to-emerald-500/5',
  },
};

/**
 * Category icons and styles
 */
const CATEGORY_STYLES: Record<ExpenseCategory, { icon: React.ReactNode; color: string; bg: string }> = {
  [ExpenseCategory.MAINTENANCE]: {
    icon: <Wrench className="h-4 w-4" />,
    color: 'text-purple-600',
    bg: 'bg-purple-100 dark:bg-purple-900/30',
  },
  [ExpenseCategory.UTILITIES]: {
    icon: <Zap className="h-4 w-4" />,
    color: 'text-blue-600',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
  },
  [ExpenseCategory.SALARIES]: {
    icon: <Users className="h-4 w-4" />,
    color: 'text-green-600',
    bg: 'bg-green-100 dark:bg-green-900/30',
  },
  [ExpenseCategory.SUPPLIES]: {
    icon: <Package className="h-4 w-4" />,
    color: 'text-orange-600',
    bg: 'bg-orange-100 dark:bg-orange-900/30',
  },
  [ExpenseCategory.INSURANCE]: {
    icon: <Shield className="h-4 w-4" />,
    color: 'text-red-600',
    bg: 'bg-red-100 dark:bg-red-900/30',
  },
  [ExpenseCategory.TAXES]: {
    icon: <FileText className="h-4 w-4" />,
    color: 'text-cyan-600',
    bg: 'bg-cyan-100 dark:bg-cyan-900/30',
  },
  [ExpenseCategory.OTHER]: {
    icon: <MoreHorizontal className="h-4 w-4" />,
    color: 'text-gray-600',
    bg: 'bg-gray-100 dark:bg-gray-800/30',
  },
};

export default function ExpensesPage() {
  const router = useRouter();
  const { toast } = useToast();

  // State
  const [expenses, setExpenses] = useState<ExpenseListItem[]>([]);
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Debounced search
  const debouncedSearch = useMemo(
    () => debounce((value: string) => {
      setSearchTerm(value);
    }, 300),
    []
  );

  // Fetch all expenses for client-side filtering
  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        setIsLoading(true);
        const response = await getExpenses({
          page: 0,
          size: 1000,
        });
        setExpenses(response.data.content || []);
      } catch (error) {
        console.error('Failed to fetch expenses:', error);
        toast({
          title: 'Error',
          description: 'Failed to load expenses',
          variant: 'destructive',
        });
        setExpenses([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExpenses();
  }, [toast]);

  // Fetch summary
  const fetchSummary = useCallback(async () => {
    try {
      const summaryData = await getExpenseSummary();
      setSummary(summaryData);
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Filter expenses
  const filteredExpenses = useMemo(() => {
    let result = expenses;

    if (statusFilter !== 'all') {
      result = result.filter(e => e.paymentStatus === statusFilter);
    }

    if (categoryFilter !== 'all') {
      result = result.filter(e => e.category === categoryFilter);
    }

    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase().trim();
      result = result.filter(e =>
        e.expenseNumber?.toLowerCase().includes(query) ||
        e.description?.toLowerCase().includes(query) ||
        e.vendorCompanyName?.toLowerCase().includes(query) ||
        e.propertyName?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [expenses, statusFilter, categoryFilter, searchTerm]);

  // Calculate stats from summary
  const stats = useMemo(() => {
    if (!summary) {
      return {
        totalExpenses: 0,
        totalPaid: 0,
        totalPending: 0,
        expenseCount: 0,
        pendingCount: 0,
        paidCount: 0,
      };
    }

    return {
      totalExpenses: summary.totalExpenses || 0,
      totalPaid: summary.totalPaid || 0,
      totalPending: summary.totalPending || 0,
      expenseCount: summary.expenseCount || 0,
      pendingCount: summary.pendingCount || 0,
      paidCount: summary.paidCount || 0,
    };
  }, [summary]);

  // Handlers
  const handleCreateExpense = () => router.push('/expenses/new');
  const handleViewPendingPayments = () => router.push('/expenses/pending-payments');
  const handleViewExpense = (id: string) => router.push(`/expenses/${id}`);
  const handleEditExpense = (id: string) => router.push(`/expenses/${id}/edit`);
  const handleRefresh = () => {
    setIsLoading(true);
    Promise.all([
      getExpenses({ page: 0, size: 1000 }).then(res => setExpenses(res.data.content || [])),
      fetchSummary(),
    ]).finally(() => setIsLoading(false));
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

  if (isLoading) {
    return (
      <TooltipProvider>
        <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
          <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
            <Skeleton className="h-40 w-full rounded-2xl" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-96 w-full" />
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
                      <h1 className="text-3xl font-bold tracking-tight">Expense Management</h1>
                      <p className="text-muted-foreground">
                        Track operational expenses and vendor payments
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={handleViewPendingPayments}
                    className="gap-2"
                  >
                    <CreditCard className="h-4 w-4" />
                    Pending Payments
                  </Button>
                  <Button
                    onClick={handleCreateExpense}
                    size="lg"
                    className="gap-2 shadow-lg shadow-primary/20"
                  >
                    <Plus className="h-5 w-5" />
                    Add Expense
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* KPI Dashboard */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Expenses */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -translate-y-6 translate-x-6" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Expenses
                </CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatExpenseCurrency(stats.totalExpenses)}</div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {stats.expenseCount} records
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Paid */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full -translate-y-6 translate-x-6" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Paid
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">{formatExpenseCurrency(stats.totalPaid)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.paidCount} completed
                </p>
              </CardContent>
            </Card>

            {/* Pending */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full -translate-y-6 translate-x-6" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pending
                </CardTitle>
                <Clock className="h-4 w-4 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">{formatExpenseCurrency(stats.totalPending)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.pendingCount} awaiting
                </p>
              </CardContent>
            </Card>

            {/* Quick Action */}
            <Card
              className="relative overflow-hidden cursor-pointer hover:shadow-md transition-all group"
              onClick={handleViewPendingPayments}
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full -translate-y-6 translate-x-6" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Vendor Payments
                </CardTitle>
                <CreditCard className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{formatExpenseCurrency(stats.totalPending)}</div>
                <p className="text-xs text-muted-foreground mt-1 group-hover:text-primary transition-colors">
                  Click to process
                  <ArrowUpRight className="inline h-3 w-3 ml-1" />
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Payment Pipeline Status */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="h-5 w-5 text-muted-foreground" />
                  Payment Pipeline
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={handleRefresh} className="gap-2">
                  <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pb-6">
              <div className="flex items-center gap-2 flex-wrap">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setStatusFilter(PaymentStatus.PENDING)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors border border-amber-200 dark:border-amber-800"
                    >
                      <Clock className="h-4 w-4 text-amber-600" />
                      <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">{stats.pendingCount} Pending</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Awaiting payment</TooltipContent>
                </Tooltip>

                <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setStatusFilter(PaymentStatus.PAID)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors border border-emerald-200 dark:border-emerald-800"
                    >
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">{stats.paidCount} Paid</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Completed payments</TooltipContent>
                </Tooltip>
              </div>
            </CardContent>
          </Card>

          {/* Charts Section */}
          <ExpenseSummaryCharts summary={summary} isLoading={isLoading} />

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
                  <TabsList className="grid w-full lg:w-auto grid-cols-3 h-10">
                    <TabsTrigger value="all" className="gap-1.5 px-3 text-xs lg:text-sm">
                      <Filter className="h-3.5 w-3.5" />
                      All
                    </TabsTrigger>
                    <TabsTrigger value={PaymentStatus.PENDING} className="gap-1.5 px-3 text-xs lg:text-sm">
                      <Clock className="h-3.5 w-3.5" />
                      Pending
                    </TabsTrigger>
                    <TabsTrigger value={PaymentStatus.PAID} className="gap-1.5 px-3 text-xs lg:text-sm">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Paid
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="flex-1 flex flex-col sm:flex-row gap-3">
                  {/* Search */}
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search expenses..."
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
              {filteredExpenses.length} {filteredExpenses.length === 1 ? 'expense' : 'expenses'} found
            </span>
          </div>

          {/* Content Area */}
          {filteredExpenses.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="p-4 rounded-full bg-muted mb-4">
                  <Receipt className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No expenses found</h3>
                <p className="text-muted-foreground max-w-sm mb-6">
                  {searchTerm || statusFilter !== 'all'
                    ? "Try adjusting your search or filters."
                    : "Get started by recording your first expense."}
                </p>
                {!searchTerm && statusFilter === 'all' && (
                  <Button onClick={handleCreateExpense} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Expense
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredExpenses.map((expense) => {
                const statusStyles = PAYMENT_STATUS_STYLES[expense.paymentStatus];
                const categoryStyle = CATEGORY_STYLES[expense.category];

                return (
                  <Card
                    key={expense.id}
                    className="overflow-hidden group hover:shadow-lg transition-all duration-300 flex flex-col cursor-pointer"
                    onClick={() => handleViewExpense(expense.id)}
                  >
                    {/* Header */}
                    <div className={cn("relative h-24 bg-gradient-to-br", statusStyles.gradient, "to-muted")}>
                      {/* Status Badge */}
                      <div className="absolute top-3 left-3">
                        <Badge variant="secondary" className={cn("shadow-sm", statusStyles.badge)}>
                          <div className={cn("h-1.5 w-1.5 rounded-full mr-1.5", statusStyles.dot)} />
                          {PAYMENT_STATUS_LABELS[expense.paymentStatus]}
                        </Badge>
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
                            <DropdownMenuItem onClick={() => handleViewExpense(expense.id)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            {expense.paymentStatus === PaymentStatus.PENDING && (
                              <DropdownMenuItem onClick={() => handleEditExpense(expense.id)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Category Icon */}
                      <div className="absolute -bottom-6 left-4">
                        <div className={cn(
                          "flex h-12 w-12 items-center justify-center rounded-xl ring-4 ring-background shadow-lg",
                          categoryStyle.bg
                        )}>
                          <div className={categoryStyle.color}>
                            {categoryStyle.icon}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <CardContent className="p-4 pt-8 flex-1 flex flex-col">
                      <div className="mb-1">
                        <h3 className="font-semibold text-base truncate" title={expense.description}>
                          {expense.description || 'No description'}
                        </h3>
                        <p className="text-xs text-muted-foreground font-mono">
                          {expense.expenseNumber}
                        </p>
                      </div>

                      <div className="space-y-1.5 mt-3 text-sm">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Badge variant="outline" className="text-xs">
                            {EXPENSE_CATEGORY_LABELS[expense.category]}
                          </Badge>
                        </div>
                        {expense.vendorCompanyName && (
                          <div className="flex items-center gap-1.5 text-muted-foreground text-xs truncate">
                            <Building2 className="h-3.5 w-3.5 shrink-0" />
                            {expense.vendorCompanyName}
                          </div>
                        )}
                        {expense.propertyName && (
                          <div className="flex items-center gap-1.5 text-muted-foreground text-xs truncate">
                            <Building2 className="h-3.5 w-3.5 shrink-0" />
                            {expense.propertyName}
                          </div>
                        )}
                      </div>

                      <div className="mt-auto pt-3 border-t">
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-primary">
                            {formatExpenseCurrency(expense.amount)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(expense.expenseDate)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            /* List View - Use Datatable */
            <Card className="py-0 border-none shadow-none">
              <ExpensesDatatable data={filteredExpenses} />
            </Card>
          )}

          {/* Quick Links */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Button
              variant="outline"
              className="h-auto py-4 justify-start px-4 gap-3 hover:border-primary/50 hover:bg-primary/5 dark:hover:bg-primary/10 transition-all"
              asChild
            >
              <Link href="/expenses/new">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Plus className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Add Expense</div>
                  <div className="text-xs text-muted-foreground">Record new expense</div>
                </div>
              </Link>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-4 justify-start px-4 gap-3 hover:border-amber-500/50 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-all"
              asChild
            >
              <Link href="/expenses/pending-payments">
                <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-amber-600" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Pending Payments</div>
                  <div className="text-xs text-muted-foreground">Process vendor payments</div>
                </div>
              </Link>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-4 justify-start px-4 gap-3 hover:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all"
              asChild
            >
              <Link href="/finance/reports/expenses">
                <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <PieChart className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Expense Reports</div>
                  <div className="text-xs text-muted-foreground">Analytics & insights</div>
                </div>
              </Link>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-4 justify-start px-4 gap-3 hover:border-primary/50 hover:bg-muted/50 transition-all"
              asChild
            >
              <Link href="/vendors">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Vendors</div>
                  <div className="text-xs text-muted-foreground">Manage vendor list</div>
                </div>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
