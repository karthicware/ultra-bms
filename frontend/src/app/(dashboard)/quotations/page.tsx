/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

/**
 * Quotations List Page
 * Displays all quotations with shadcn-studio datatable
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { debounce } from 'lodash';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  getQuotations,
  sendQuotation,
  downloadQuotationPDF,
} from '@/services/quotations.service';
import type { Quotation, QuotationStatus } from '@/types';
import { Plus, FileText } from 'lucide-react';
import QuotationsDatatable from '@/components/quotations/QuotationsDatatable';

export default function QuotationsPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [quotationToSend, setQuotationToSend] = useState<{ id: string; number: string } | null>(null);

  const fetchQuotations = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await getQuotations({
        page: 0,
        size: 1000, // Fetch all for client-side filtering
      });

      setQuotations(response.data.content);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load quotations',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const debouncedFetch = useMemo(() => debounce(fetchQuotations, 300), [fetchQuotations]);

  useEffect(() => {
    debouncedFetch();
    return () => debouncedFetch.cancel();
  }, [debouncedFetch]);

  const handleSendClick = (id: string, quotationNumber: string) => {
    setQuotationToSend({ id, number: quotationNumber });
    setSendDialogOpen(true);
  };

  const handleSendConfirm = async () => {
    if (!quotationToSend) return;

    try {
      setSendingId(quotationToSend.id);
      await sendQuotation(quotationToSend.id);
      toast({
        title: 'Success',
        description: `Quotation ${quotationToSend.number} sent successfully`,
        variant: 'success',
      });
      fetchQuotations();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error?.message || 'Failed to send quotation',
        variant: 'destructive',
      });
    } finally {
      setSendingId(null);
      setSendDialogOpen(false);
      setQuotationToSend(null);
    }
  };

  const handleDownloadPDF = async (id: string, quotationNumber: string) => {
    try {
      await downloadQuotationPDF(id, quotationNumber);
      toast({
        title: 'Success',
        description: 'PDF downloaded successfully',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download PDF',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quotations</h1>
          <p className="text-muted-foreground">Manage rental quotations and proposals</p>
        </div>
        <Button onClick={() => router.push('/quotations/create')} data-testid="btn-create-quotation">
          <Plus className="mr-2 h-4 w-4" />
          Create Quotation
        </Button>
      </div>

      {/* Datatable */}
      <Card className="py-0">
        {isLoading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : quotations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mb-4" />
            <h3 className="text-lg font-semibold mb-1">No quotations found</h3>
            <p className="text-sm mb-4">Create your first quotation to get started</p>
            <Button onClick={() => router.push('/quotations/create')}>
              <Plus className="mr-2 h-4 w-4" />
              Create Quotation
            </Button>
          </div>
        ) : (
          <QuotationsDatatable
            data={quotations}
            onSend={handleSendClick}
            onDownload={handleDownloadPDF}
          />
        )}
      </Card>

      {/* Send Confirmation Dialog */}
      <AlertDialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <AlertDialogContent data-testid="modal-confirm-send">
          <AlertDialogHeader>
            <AlertDialogTitle>Send Quotation</AlertDialogTitle>
            <AlertDialogDescription>
              This will send quotation {quotationToSend?.number} via email to the lead. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!sendingId}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSendConfirm}
              disabled={!!sendingId}
              data-testid="btn-confirm"
            >
              {sendingId ? 'Sending...' : 'Send'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
