'use client';

/**
 * Expense List Page
 * Story 6.2: Expense Management and Vendor Payments
 * AC #6: Expense list with filtering by date range, category, property, vendor, payment status
 * Updated: Redesigned with neutral styling and improved layout
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getExpenses, getExpenseSummary } from '@/services/expense.service';
import {
  ExpenseListItem,
  ExpenseSummary,
  formatExpenseCurrency,
} from '@/types/expense';
import {
  Plus,
  Clock,
  CheckCircle2,
  CreditCardIcon,
  ReceiptIcon,
  WalletIcon,
} from 'lucide-react';
import { ExpenseSummaryCharts } from '@/components/expenses/ExpenseSummaryCharts';
import ExpensesDatatable from '@/components/expenses/ExpensesDatatable';

export default function ExpensesPage() {
  const router = useRouter();
  const { toast } = useToast();

  // State
  const [expenses, setExpenses] = useState<ExpenseListItem[]>([]);
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all expenses for client-side filtering
  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        setIsLoading(true);
        const response = await getExpenses({
          page: 0,
          size: 1000, // Fetch all for client-side filtering
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
      const summary = await getExpenseSummary();
      setSummary(summary);
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Handlers
  const handleCreateExpense = () => {
    router.push('/expenses/new');
  };

  const handleViewPendingPayments = () => {
    router.push('/expenses/pending-payments');
  };

  // Summary cards
  const SummaryCards = () => (
    <div className="grid gap-4 md:grid-cols-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          <div className="h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center">
            <WalletIcon className="h-4 w-4 text-foreground" />
          </div>
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
          <div className="h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center">
             <CheckCircle2 className="h-4 w-4 text-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {summary ? formatExpenseCurrency(summary.totalPaid) : <Skeleton className="h-8 w-24" />}
          </div>
          <p className="text-xs text-muted-foreground">
            Completed payments
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending</CardTitle>
          <div className="h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center">
            <Clock className="h-4 w-4 text-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-600">
            {summary ? formatExpenseCurrency(summary.totalPending) : <Skeleton className="h-8 w-24" />}
          </div>
          <p className="text-xs text-muted-foreground">
            Awaiting payment
          </p>
        </CardContent>
      </Card>
      <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={handleViewPendingPayments}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Vendor Payments</CardTitle>
           <div className="h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center">
            <CreditCardIcon className="h-4 w-4 text-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {summary ? formatExpenseCurrency(summary.totalPending) : <Skeleton className="h-8 w-24" />}
          </div>
          <p className="text-xs text-muted-foreground">Click to process payments</p>
        </CardContent>
      </Card>
    </div>
  );

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-7xl p-6 space-y-8" data-testid="page-expenses">
        <div className="flex items-center justify-between">
          <div>
             <Skeleton className="h-10 w-48 mb-2" />
             <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl p-6 space-y-8" data-testid="page-expenses">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center hidden sm:flex">
            <ReceiptIcon className="h-5 w-5 text-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
            <p className="text-muted-foreground">
              Manage operational expenses and vendor payments
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleViewPendingPayments}>
            <CreditCardIcon className="mr-2 h-4 w-4" />
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

      {/* Charts */}
      <ExpenseSummaryCharts summary={summary} isLoading={isLoading} />

      {/* Datatable */}
      <Card className="py-0 border-none shadow-none">
        <ExpensesDatatable data={expenses} />
      </Card>
    </div>
  );
}