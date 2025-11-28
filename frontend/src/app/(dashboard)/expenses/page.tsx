'use client';

/**
 * Expense List Page
 * Story 6.2: Expense Management and Vendor Payments
 * AC #6: Expense list with filtering by date range, category, property, vendor, payment status
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { debounce } from 'lodash';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getExpenses, getExpenseSummary } from '@/services/expense.service';
import {
  ExpenseListItem,
  ExpenseCategory,
  PaymentStatus,
  ExpenseSummary,
  EXPENSE_CATEGORY_LABELS,
  PAYMENT_STATUS_LABELS,
  formatExpenseCurrency,
} from '@/types/expense';
import {
  Plus,
  Search,
  Eye,
  Receipt,
  ArrowUpDown,
  DollarSign,
  Clock,
  CheckCircle,
  TrendingUp,
  FileText,
  CreditCard,
} from 'lucide-react';

export default function ExpensesPage() {
  const router = useRouter();
  const { toast } = useToast();

  // State
  const [expenses, setExpenses] = useState<ExpenseListItem[]>([]);
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [sortField, setSortField] = useState<string>('expenseDate');
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('DESC');

  // Fetch expenses
  const fetchExpenses = useCallback(async () => {
    try {
      setIsLoading(true);

      const response = await getExpenses({
        search: searchTerm || undefined,
        category: categoryFilter === 'ALL' ? undefined : categoryFilter as ExpenseCategory,
        paymentStatus: statusFilter === 'ALL' ? undefined : statusFilter as PaymentStatus,
        page: currentPage,
        size: pageSize,
        sortBy: sortField,
        sortDirection,
      });

      setExpenses(response.data.content || []);
      setTotalPages(response.data.totalPages || 0);
      setTotalElements(response.data.totalElements || 0);
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
  }, [currentPage, pageSize, searchTerm, categoryFilter, statusFilter, sortField, sortDirection, toast]);

  // Fetch summary
  const fetchSummary = useCallback(async () => {
    try {
      const summary = await getExpenseSummary();
      setSummary(summary);
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    }
  }, []);

  // Debounced search
  const debouncedFetchExpenses = useMemo(
    () => debounce(fetchExpenses, 300),
    [fetchExpenses]
  );

  useEffect(() => {
    debouncedFetchExpenses();
    return () => debouncedFetchExpenses.cancel();
  }, [debouncedFetchExpenses]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Handlers
  const handleCreateExpense = () => {
    router.push('/expenses/new');
  };

  const handleViewExpense = (id: string) => {
    router.push(`/expenses/${id}`);
  };

  const handleViewPendingPayments = () => {
    router.push('/expenses/pending-payments');
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortField(field);
      setSortDirection('DESC');
    }
    setCurrentPage(0);
  };

  const handleCategoryFilter = (value: string) => {
    setCategoryFilter(value);
    setCurrentPage(0);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(0);
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: PaymentStatus): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case PaymentStatus.PAID:
        return 'default';
      case PaymentStatus.PENDING:
        return 'secondary';
      default:
        return 'outline';
    }
  };

  // Get category badge color
  const getCategoryBadgeClass = (category: ExpenseCategory): string => {
    switch (category) {
      case ExpenseCategory.MAINTENANCE:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case ExpenseCategory.UTILITIES:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case ExpenseCategory.SALARIES:
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case ExpenseCategory.SUPPLIES:
        return 'bg-green-100 text-green-800 border-green-200';
      case ExpenseCategory.INSURANCE:
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case ExpenseCategory.TAXES:
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Summary cards
  const SummaryCards = () => (
    <div className="grid gap-4 md:grid-cols-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {summary ? formatExpenseCurrency(summary.totalExpenses) : <Skeleton className="h-8 w-24" />}
          </div>
          <p className="text-xs text-muted-foreground">Last 12 months</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Paid</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {summary ? formatExpenseCurrency(summary.totalPaidAmount) : <Skeleton className="h-8 w-24" />}
          </div>
          <p className="text-xs text-muted-foreground">
            Completed payments
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending</CardTitle>
          <Clock className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-600">
            {summary ? formatExpenseCurrency(summary.totalPendingAmount) : <Skeleton className="h-8 w-24" />}
          </div>
          <p className="text-xs text-muted-foreground">
            Awaiting payment
          </p>
        </CardContent>
      </Card>
      <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={handleViewPendingPayments}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Vendor Payments</CardTitle>
          <CreditCard className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {summary ? formatExpenseCurrency(summary.totalPendingAmount) : <Skeleton className="h-8 w-24" />}
          </div>
          <p className="text-xs text-muted-foreground">Click to process payments</p>
        </CardContent>
      </Card>
    </div>
  );

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-12 w-full" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground">
            Manage expenses and vendor payments
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleViewPendingPayments}>
            <CreditCard className="mr-2 h-4 w-4" />
            Pending Payments
          </Button>
          <Button onClick={handleCreateExpense}>
            <Plus className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <SummaryCards />

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Expense List</CardTitle>
          <CardDescription>
            {totalElements} total expenses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by expense number or description..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(0);
                }}
              />
            </div>
            <Select value={categoryFilter} onValueChange={handleCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Categories</SelectItem>
                {Object.entries(EXPENSE_CATEGORY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                {Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {isLoading ? (
            <LoadingSkeleton />
          ) : expenses.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No expenses found</h3>
              <p className="text-muted-foreground">
                {searchTerm || categoryFilter !== 'ALL' || statusFilter !== 'ALL'
                  ? 'Try adjusting your filters'
                  : 'Add your first expense to get started'}
              </p>
              {!searchTerm && categoryFilter === 'ALL' && statusFilter === 'ALL' && (
                <Button onClick={handleCreateExpense} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Expense
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort('expenseNumber')}
                          className="h-auto p-0 font-medium"
                        >
                          Expense #
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort('category')}
                          className="h-auto p-0 font-medium"
                        >
                          Category
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">
                        <Button
                          variant="ghost"
                          onClick={() => handleSort('amount')}
                          className="h-auto p-0 font-medium"
                        >
                          Amount
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort('expenseDate')}
                          className="h-auto p-0 font-medium"
                        >
                          Date
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort('paymentStatus')}
                          className="h-auto p-0 font-medium"
                        >
                          Status
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>Receipt</TableHead>
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((expense) => (
                      <TableRow
                        key={expense.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleViewExpense(expense.id)}
                      >
                        <TableCell className="font-medium">
                          {expense.expenseNumber}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getCategoryBadgeClass(expense.category)}>
                            {EXPENSE_CATEGORY_LABELS[expense.category]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {expense.vendorCompanyName || '-'}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {expense.description}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatExpenseCurrency(expense.amount)}
                        </TableCell>
                        <TableCell>
                          {format(new Date(expense.expenseDate), 'dd MMM yyyy')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(expense.paymentStatus)}>
                            {PAYMENT_STATUS_LABELS[expense.paymentStatus]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {expense.hasReceipt ? (
                            <FileText className="h-4 w-4 text-green-500" />
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewExpense(expense.id);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {currentPage * pageSize + 1} to{' '}
                    {Math.min((currentPage + 1) * pageSize, totalElements)} of {totalElements} expenses
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 0}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage >= totalPages - 1}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
