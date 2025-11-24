'use client';

/**
 * Quotations List Page
 * Displays all quotations with filters, search, and actions
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  getQuotations,
  sendQuotation,
  downloadQuotationPDF,
} from '@/services/quotations.service';
import type { Quotation, QuotationStatus } from '@/types';
import { Plus, Search, Filter, Eye, Edit, Send, Download, FileText } from 'lucide-react';
import { formatCurrency } from '@/lib/validations/quotations';

const QUOTATION_STATUS_COLORS: Record<QuotationStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  SENT: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  ACCEPTED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  EXPIRED: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  CONVERTED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
};

export default function QuotationsPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const fetchQuotations = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await getQuotations({
        page: currentPage,
        size: pageSize,
        status: statusFilter !== 'all' ? [statusFilter as QuotationStatus] : undefined,
      });

      setQuotations(response.data.content);
      setTotalPages(response.data.totalPages);
      setTotalElements(response.data.totalElements);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load quotations',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, statusFilter]); // Removed toast from dependencies

  const debouncedFetch = useMemo(() => debounce(fetchQuotations, 300), [fetchQuotations]);

  useEffect(() => {
    debouncedFetch();
    return () => debouncedFetch.cancel();
  }, [debouncedFetch]);

  const handleSendQuotation = async (id: string, quotationNumber: string) => {
    try {
      setSendingId(id);
      await sendQuotation(id);
      toast({
        title: 'Success',
        description: `Quotation ${quotationNumber} sent successfully`,
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
    }
  };

  const handleDownloadPDF = async (id: string, quotationNumber: string) => {
    try {
      await downloadQuotationPDF(id, quotationNumber);
      toast({
        title: 'Success',
        description: 'PDF downloaded successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download PDF',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

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

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger data-testid="select-filter-status">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="SENT">Sent</SelectItem>
                <SelectItem value="ACCEPTED">Accepted</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
                <SelectItem value="CONVERTED">Converted</SelectItem>
              </SelectContent>
            </Select>

            <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
              <SelectTrigger>
                <SelectValue placeholder="Page size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 per page</SelectItem>
                <SelectItem value="20">20 per page</SelectItem>
                <SelectItem value="50">50 per page</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground">
        Showing {quotations.length} of {totalElements} quotations
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table data-testid="table-quotations">
            <TableHeader>
              <TableRow>
                <TableHead>Quotation #</TableHead>
                <TableHead>Lead Name</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Rent Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No quotations found
                  </TableCell>
                </TableRow>
              ) : (
                quotations.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell className="font-medium">{quote.quotationNumber}</TableCell>
                    <TableCell>{quote.leadName || 'N/A'}</TableCell>
                    <TableCell className="text-sm">
                      {quote.propertyName || 'N/A'}
                      {quote.unitNumber && ` - ${quote.unitNumber}`}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(quote.totalFirstPayment)}
                    </TableCell>
                    <TableCell>
                      <Badge className={QUOTATION_STATUS_COLORS[quote.status]}>
                        {quote.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(quote.issueDate), 'PP')}
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(quote.validityDate), 'PP')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/quotations/${quote.id}`)}
                          data-testid={`btn-view-quotation-${quote.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        {quote.status === 'DRAFT' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/quotations/${quote.id}/edit`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={sendingId === quote.id}
                                  data-testid={`btn-send-quotation-${quote.id}`}
                                >
                                  <Send className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent data-testid="modal-confirm-send">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Send Quotation</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will send quotation {quote.quotationNumber} via email to the
                                    lead. Are you sure?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleSendQuotation(quote.id, quote.quotationNumber)}
                                    data-testid="btn-confirm"
                                  >
                                    Send
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadPDF(quote.id, quote.quotationNumber)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage >= totalPages - 1}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
