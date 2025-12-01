'use client';

/**
 * PDC List Page
 * Story 6.3: Post-Dated Cheque (PDC) Management
 * AC #13: PDC list with filtering, sorting, and pagination using shadcn-studio datatable
 */

import { useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { usePDCs } from '@/hooks/usePDCs';
import type { PDCStatus, PDCFilter } from '@/types/pdc';
import { Plus, Calendar } from 'lucide-react';
import PDCListDatatable from '@/components/pdc/PDCListDatatable';

function PDCListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize filters from URL params
  const initialStatus = searchParams.get('status') as PDCStatus | null;

  // Filter state - fetch all for client-side filtering
  const [filters] = useState<PDCFilter>({
    search: '',
    status: initialStatus || 'ALL',
    page: 0,
    size: 1000, // Fetch all for client-side filtering
    sortBy: 'chequeDate',
    sortDirection: 'ASC',
  });

  // Fetch PDCs
  const { data: response, isLoading } = usePDCs(filters);
  const pdcs = response?.data?.content || [];
  const totalElements = response?.data?.totalElements || 0;

  // Navigation handlers
  const handleDeposit = (id: string) => {
    router.push(`/pdc/${id}?action=deposit`);
  };

  const handleClear = (id: string) => {
    router.push(`/pdc/${id}?action=clear`);
  };

  const handleBounce = (id: string) => {
    router.push(`/pdc/${id}?action=bounce`);
  };

  const handleWithdraw = (id: string) => {
    router.push(`/pdc/${id}?action=withdraw`);
  };

  const handleCancel = (id: string) => {
    router.push(`/pdc/${id}?action=cancel`);
  };

  return (
    <div className="container mx-auto py-6 space-y-6" data-testid="page-pdc-list">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Post-Dated Cheques</h1>
          <p className="text-muted-foreground">
            {totalElements} PDC{totalElements !== 1 ? 's' : ''} registered
          </p>
        </div>
        <Button asChild>
          <Link href="/pdc/new">
            <Plus className="mr-2 h-4 w-4" />
            Register PDC
          </Link>
        </Button>
      </div>

      {/* Datatable */}
      <Card className="py-0">
        {isLoading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : pdcs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Calendar className="h-12 w-12 mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-1">No PDCs found</h3>
            <p className="text-sm mb-4">Register your first PDC to get started</p>
            <Button asChild>
              <Link href="/pdc/new">
                <Plus className="mr-2 h-4 w-4" />
                Register PDC
              </Link>
            </Button>
          </div>
        ) : (
          <PDCListDatatable
            data={pdcs}
            onDeposit={handleDeposit}
            onClear={handleClear}
            onBounce={handleBounce}
            onWithdraw={handleWithdraw}
            onCancel={handleCancel}
          />
        )}
      </Card>
    </div>
  );
}

export default function PDCListPage() {
  return (
    <Suspense fallback={<div className="container mx-auto py-6"><Skeleton className="h-96 w-full" /></div>}>
      <PDCListContent />
    </Suspense>
  );
}
