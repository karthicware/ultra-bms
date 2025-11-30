'use client';

/**
 * Invoice List Page
 * Story 6.1: Rent Invoicing and Payment Management
 * AC #15: Display all invoices with status, amounts, and due dates
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  FileText,
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

  // Summary cards
  const SummaryCards = () => (
    <div className="grid gap-4 md:grid-cols-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Invoiced</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {summary ? formatCurrency(summary.totalInvoiced) : <Skeleton className="h-8 w-24" />}
          </div>
          <p className="text-xs text-muted-foreground">This month</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Collected</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {summary ? formatCurrency(summary.totalCollected) : <Skeleton className="h-8 w-24" />}
          </div>
          <p className="text-xs text-muted-foreground">
            {summary ? `${summary.collectionRate.toFixed(1)}% collection rate` : ''}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
          <Clock className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-600">
            {summary ? formatCurrency(summary.totalOutstanding) : <Skeleton className="h-8 w-24" />}
          </div>
          <p className="text-xs text-muted-foreground">Pending payment</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          <AlertCircle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {summary ? formatCurrency(summary.overdueAmount) : <Skeleton className="h-8 w-24" />}
          </div>
          <p className="text-xs text-muted-foreground">
            {summary ? `${summary.overdueCount} invoices` : ''}
          </p>
        </CardContent>
      </Card>
    </div>
  );

  if (isLoading) {
    return (
      <div className="container mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
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
    <div className="container mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
            <p className="text-muted-foreground">
              Manage rent invoices and track payments
            </p>
          </div>
        </div>
        <Button onClick={handleCreateInvoice}>
          <Plus className="mr-2 h-4 w-4" />
          Create Invoice
        </Button>
      </div>

      {/* Summary Cards */}
      <SummaryCards />

      {/* Datatable */}
      <Card>
        <InvoicesDatatable data={invoices} />
      </Card>
    </div>
  );
}
