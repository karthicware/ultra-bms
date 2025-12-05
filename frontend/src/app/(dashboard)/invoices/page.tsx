'use client';

/**
 * Invoice List Page
 * Story 6.1: Rent Invoicing and Payment Management
 * AC #15: Display all invoices with status, amounts, and due dates
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getInvoices, getInvoiceSummary } from '@/services/invoice.service';
import {
  InvoiceListItem,
  InvoiceSummary,
  formatCurrency,
} from '@/types/invoice';
import {
  Plus,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar
} from 'lucide-react';
import InvoicesDatatable from '@/components/invoices/InvoicesDatatable';

export default function InvoicesPage() {
  const router = useRouter();
  const { toast } = useToast();

  // State
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [summary, setSummary] = useState<InvoiceSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all invoices for client-side filtering
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setIsLoading(true);
        const response = await getInvoices({
          page: 0,
          size: 1000, // Fetch all for client-side filtering
        });
        setInvoices(response.data.content || []);
      } catch (error) {
        console.error('Failed to fetch invoices:', error);
        toast({
          title: 'Error',
          description: 'Failed to load invoices',
          variant: 'destructive',
        });
        setInvoices([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoices();
  }, [toast]);

  // Fetch summary
  const fetchSummary = useCallback(async () => {
    try {
      const summary = await getInvoiceSummary();
      setSummary(summary);
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Handlers
  const handleCreateInvoice = () => {
    router.push('/invoices/new');
  };

  // Date for header
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Summary cards
  const SummaryCards = () => (
    <div className="grid gap-4 md:grid-cols-4">
      <Card className="shadow-sm">
        <CardContent className="p-6 flex items-center gap-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <DollarSign className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">Total Invoiced</p>
            <h3 className="text-2xl font-bold">
              {summary ? formatCurrency(summary.totalInvoiced) : <Skeleton className="h-8 w-24" />}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardContent className="p-6 flex items-center gap-4">
          <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">Collected</p>
            <h3 className="text-2xl font-bold text-green-600">
              {summary ? formatCurrency(summary.totalCollected) : <Skeleton className="h-8 w-24" />}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {summary ? `${summary.collectionRate.toFixed(1)}% rate` : ''}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardContent className="p-6 flex items-center gap-4">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/20 rounded-lg">
            <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">Outstanding</p>
            <h3 className="text-2xl font-bold text-amber-600">
              {summary ? formatCurrency(summary.totalOutstanding) : <Skeleton className="h-8 w-24" />}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">Pending payment</p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardContent className="p-6 flex items-center gap-4">
          <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">Overdue</p>
            <h3 className="text-2xl font-bold text-red-600">
              {summary ? formatCurrency(summary.overdueAmount) : <Skeleton className="h-8 w-24" />}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {summary ? `${summary.overdueCount} invoices` : ''}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 space-y-8 max-w-7xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-card p-6 rounded-xl border shadow-sm">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
        <Card className="border-none shadow-sm">
          <div className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between bg-card p-6 rounded-xl border shadow-sm">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Invoices</h1>
          <div className="flex items-center text-muted-foreground text-sm gap-2">
            <Calendar className="h-4 w-4" />
            <span>{today}</span>
            <span className="text-border">|</span>
            <span>Manage rent invoices and track payments</span>
          </div>
        </div>
        <Button onClick={handleCreateInvoice} className="gap-2 shadow-sm">
          <Plus className="h-4 w-4" />
          Create Invoice
        </Button>
      </div>

      {/* Summary Cards */}
      <SummaryCards />

      {/* Datatable */}
      <Card className="shadow-sm border">
        <InvoicesDatatable data={invoices} />
      </Card>
    </div>
  );
}
