'use client';

/**
 * Checkouts Management Page
 * Story 3.7: Tenant Checkout and Deposit Refund Processing
 * AC: #12 - Admin view for managing all checkouts
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  Search,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Loader2,
  Eye,
  FileText,
  DollarSign,
  MoreHorizontal,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

import { checkoutService } from '@/services/checkout.service';
import type { CheckoutListItem } from '@/types/checkout';
import { CheckoutStatus } from '@/types/checkout';

// Status badge configuration
const STATUS_CONFIG: Record<CheckoutStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType }> = {
  [CheckoutStatus.PENDING]: { label: 'Pending', variant: 'secondary', icon: Clock },
  [CheckoutStatus.INSPECTION_SCHEDULED]: { label: 'Inspection Scheduled', variant: 'secondary', icon: Calendar },
  [CheckoutStatus.INSPECTION_COMPLETE]: { label: 'Inspection Complete', variant: 'default', icon: CheckCircle2 },
  [CheckoutStatus.DEPOSIT_CALCULATED]: { label: 'Deposit Calculated', variant: 'default', icon: DollarSign },
  [CheckoutStatus.PENDING_APPROVAL]: { label: 'Pending Approval', variant: 'outline', icon: AlertCircle },
  [CheckoutStatus.APPROVED]: { label: 'Approved', variant: 'default', icon: CheckCircle2 },
  [CheckoutStatus.REFUND_PROCESSING]: { label: 'Refund Processing', variant: 'secondary', icon: Loader2 },
  [CheckoutStatus.REFUND_PROCESSED]: { label: 'Refund Processed', variant: 'default', icon: CheckCircle2 },
  [CheckoutStatus.COMPLETED]: { label: 'Completed', variant: 'default', icon: CheckCircle2 },
  [CheckoutStatus.ON_HOLD]: { label: 'On Hold', variant: 'destructive', icon: XCircle },
};

export default function CheckoutsPage() {
  const router = useRouter();

  // State
  const [checkouts, setCheckouts] = useState<CheckoutListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(10);

  // Statistics
  const [stats, setStats] = useState({
    pending: 0,
    inProgress: 0,
    completed: 0,
    pendingRefunds: 0,
  });

  // Load data
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Build query params
      const params: Record<string, string | undefined> = {
        page: page.toString(),
        size: pageSize.toString(),
        search: searchTerm || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        fromDate: dateFrom ? format(dateFrom, 'yyyy-MM-dd') : undefined,
        toDate: dateTo ? format(dateTo, 'yyyy-MM-dd') : undefined,
      };

      // Fetch checkouts
      const response = await checkoutService.getCheckouts(params);
      setCheckouts(response.content ?? []);
      setTotalCount(response.totalElements ?? 0);

      // Fetch statistics
      const counts = await checkoutService.getCheckoutCounts();
      setStats({
        pending: (counts[CheckoutStatus.PENDING] ?? 0) + (counts[CheckoutStatus.INSPECTION_SCHEDULED] ?? 0),
        inProgress:
          (counts[CheckoutStatus.INSPECTION_COMPLETE] ?? 0) +
          (counts[CheckoutStatus.DEPOSIT_CALCULATED] ?? 0) +
          (counts[CheckoutStatus.PENDING_APPROVAL] ?? 0) +
          (counts[CheckoutStatus.APPROVED] ?? 0) +
          (counts[CheckoutStatus.REFUND_PROCESSING] ?? 0),
        completed: counts[CheckoutStatus.COMPLETED] ?? 0,
        pendingRefunds:
          (counts[CheckoutStatus.PENDING_APPROVAL] ?? 0) +
          (counts[CheckoutStatus.REFUND_PROCESSING] ?? 0),
      });
    } catch (error) {
      console.error('Failed to load checkouts:', error);
      toast.error('Failed to load checkouts');
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, searchTerm, statusFilter, dateFrom, dateTo]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle view checkout
  const handleViewCheckout = (checkout: CheckoutListItem) => {
    router.push(`/checkouts/${checkout.tenantId}`);
  };

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPage(0);
  };

  // Clear filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setDateFrom(undefined);
    setDateTo(undefined);
    setPage(0);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Checkouts</h1>
          <p className="text-muted-foreground">Manage tenant checkout and deposit refund processes</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Loader2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.inProgress}</p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pendingRefunds}</p>
                <p className="text-xs text-muted-foreground">Pending Refunds</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by tenant name, checkout #, property..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                  <SelectItem key={value} value={value}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date From */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full md:w-40 justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  {dateFrom ? format(dateFrom, 'dd MMM') : 'From Date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={dateFrom}
                  onSelect={setDateFrom}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {/* Date To */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full md:w-40 justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  {dateTo ? format(dateTo, 'dd MMM') : 'To Date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={dateTo}
                  onSelect={setDateTo}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {/* Clear Filters */}
            {(searchTerm || statusFilter !== 'ALL' || dateFrom || dateTo) && (
              <Button variant="ghost" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Checkouts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Checkouts</CardTitle>
          <CardDescription>
            {totalCount} checkout{totalCount !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : checkouts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No checkouts found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'ALL' || dateFrom || dateTo
                  ? 'Try adjusting your filters'
                  : 'No checkouts have been initiated yet'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Checkout #</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Property / Unit</TableHead>
                  <TableHead>Move-out Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Refund</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {checkouts.map((checkout) => {
                  const statusConfig = STATUS_CONFIG[checkout.status];
                  const StatusIcon = statusConfig?.icon ?? Clock;

                  return (
                    <TableRow
                      key={checkout.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleViewCheckout(checkout)}
                    >
                      <TableCell>
                        <span className="font-mono text-sm">{checkout.checkoutNumber}</span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{checkout.tenantName}</p>
                          <p className="text-xs text-muted-foreground">{checkout.tenantNumber}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{checkout.propertyName}</p>
                          <p className="text-xs text-muted-foreground">
                            Unit {checkout.unitNumber}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {checkout.expectedMoveOutDate
                          ? format(new Date(checkout.expectedMoveOutDate), 'dd MMM yyyy')
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusConfig?.variant ?? 'secondary'}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig?.label ?? checkout.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {checkout.netRefund !== undefined && checkout.netRefund !== null ? (
                          <span
                            className={cn(
                              'font-medium',
                              checkout.netRefund > 0 ? 'text-green-600' : 'text-muted-foreground'
                            )}
                          >
                            AED {checkout.netRefund.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewCheckout(checkout)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {/* Pagination Footer */}
          {checkouts.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {checkouts.length} of {totalCount} checkouts
            </div>

            {Math.ceil(totalCount / pageSize) > 1 && (
              <Pagination className="mx-0 w-auto">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => page > 0 && setPage(page - 1)}
                      className={page === 0 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>

                  {page > 2 && (
                    <>
                      <PaginationItem>
                        <PaginationLink onClick={() => setPage(0)} className="cursor-pointer">1</PaginationLink>
                      </PaginationItem>
                      {page > 3 && <PaginationItem><PaginationEllipsis /></PaginationItem>}
                    </>
                  )}

                  {Array.from({ length: Math.ceil(totalCount / pageSize) }, (_, i) => i)
                    .filter(p => Math.abs(p - page) <= 2)
                    .map(p => (
                      <PaginationItem key={p}>
                        <PaginationLink
                          onClick={() => setPage(p)}
                          isActive={p === page}
                          className="cursor-pointer"
                        >
                          {p + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}

                  {page < Math.ceil(totalCount / pageSize) - 3 && (
                    <>
                      {page < Math.ceil(totalCount / pageSize) - 4 && <PaginationItem><PaginationEllipsis /></PaginationItem>}
                      <PaginationItem>
                        <PaginationLink onClick={() => setPage(Math.ceil(totalCount / pageSize) - 1)} className="cursor-pointer">{Math.ceil(totalCount / pageSize)}</PaginationLink>
                      </PaginationItem>
                    </>
                  )}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => page < Math.ceil(totalCount / pageSize) - 1 && setPage(page + 1)}
                      className={page >= Math.ceil(totalCount / pageSize) - 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}

            <div className="text-sm text-muted-foreground">
              Page {page + 1} of {Math.ceil(totalCount / pageSize) || 1}
            </div>
          </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
