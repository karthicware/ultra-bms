'use client';

/**
 * Tenant List Page
 * Displays all tenants with search and pagination
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { debounce } from 'lodash';
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
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import { getAllTenants, searchTenants } from '@/services/tenant.service';
import type { TenantResponse, TenantStatus } from '@/types/tenant';
import { Plus, Search, Eye, Users, ArrowUpDown, ArrowUp, ArrowDown, Filter, X } from 'lucide-react';
import { format } from 'date-fns';

/**
 * Get status badge color based on tenant status
 */
const getStatusColor = (status: TenantStatus): string => {
  switch (status) {
    case 'ACTIVE':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case 'EXPIRED':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
    case 'TERMINATED':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
};

export default function TenantsPage() {
  const router = useRouter();

  // State
  const [tenants, setTenants] = useState<TenantResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingSearch, setPendingSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Fetch tenants
  const fetchTenants = useCallback(async () => {
    try {
      setIsLoading(true);

      const response = searchTerm
        ? await searchTenants(searchTerm, currentPage, pageSize)
        : await getAllTenants(currentPage, pageSize, `${sortField},${sortDirection}`);

      setTenants(response.data?.content || []);
      setTotalPages(response.data?.totalPages || 0);
      setTotalElements(response.data?.totalElements || 0);
    } catch (error) {
      console.error('Failed to fetch tenants:', error);
      setTenants([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, sortField, sortDirection]); // Removed toast from dependencies

  // Debounced search (300ms)
  const debouncedFetchTenants = useMemo(
    () => debounce(fetchTenants, 300),
    [fetchTenants]
  );

  useEffect(() => {
    debouncedFetchTenants();
    return () => debouncedFetchTenants.cancel();
  }, [debouncedFetchTenants]);

  // Handlers
  const handleCreateTenant = () => {
    router.push('/tenants/create');
  };

  const handleViewTenant = (id: string) => {
    router.push(`/tenants/${id}`);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (newSize: string) => {
    setPageSize(parseInt(newSize));
    setCurrentPage(0); // Reset to first page
  };

  const handleSearch = () => {
    setSearchTerm(pendingSearch);
    setCurrentPage(0);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClearSearch = () => {
    setPendingSearch('');
    setSearchTerm('');
    setCurrentPage(0);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1" />;
    }
    return sortDirection === 'asc' ?
      <ArrowUp className="h-4 w-4 ml-1" /> :
      <ArrowDown className="h-4 w-4 ml-1" />;
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd MMM yyyy');
    } catch {
      return '-';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tenants</h1>
            <p className="text-muted-foreground">
              Manage tenants and view lease information
            </p>
          </div>
        </div>
        <Button
          onClick={handleCreateTenant}
          data-testid="btn-create-tenant"
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Tenant
        </Button>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or tenant number..."
                value={pendingSearch}
                onChange={(e) => setPendingSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="pl-9"
                data-testid="input-search-tenant"
              />
            </div>
            <Button onClick={handleSearch} className="gap-2" data-testid="btn-search">
              <Search className="h-4 w-4" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tenants Table */}
      <Card>
        {/* Filters inside table card */}
        <CardContent className="py-4 border-b">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters</span>
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSearch}
                className="h-7 px-2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Page Size Selector */}
            <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
              <SelectTrigger data-testid="select-page-size">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 per page</SelectItem>
                <SelectItem value="20">20 per page</SelectItem>
                <SelectItem value="50">50 per page</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>

        {/* Table Content */}
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : tenants.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tenants found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm
                  ? 'Try adjusting your search'
                  : 'Get started by adding your first tenant'}
              </p>
              {!searchTerm && (
                <Button onClick={handleCreateTenant} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Tenant
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table data-testid="table-tenants">
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('tenantNumber')}
                        className="h-8 p-0 hover:bg-transparent"
                      >
                        Tenant #
                        {getSortIcon('tenantNumber')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('firstName')}
                        className="h-8 p-0 hover:bg-transparent"
                      >
                        Name
                        {getSortIcon('firstName')}
                      </Button>
                    </TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Property / Unit</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('leaseEndDate')}
                        className="h-8 p-0 hover:bg-transparent"
                      >
                        Lease End
                        {getSortIcon('leaseEndDate')}
                      </Button>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenants.map((tenant) => (
                    <TableRow key={tenant.id} className="hover:bg-muted/50" data-testid="tenant-row">
                      <TableCell className="font-mono text-sm">
                        {tenant.tenantNumber || '-'}
                      </TableCell>
                      <TableCell className="font-medium">
                        {tenant.firstName} {tenant.lastName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {tenant.email}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {tenant.phone || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{tenant.property?.name || '-'}</span>
                          <span className="text-sm text-muted-foreground">
                            Unit {tenant.unit?.unitNumber || '-'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatDate(tenant.leaseEndDate)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getStatusColor(tenant.status)}
                        >
                          {tenant.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewTenant(tenant.id)}
                          data-testid={`btn-view-tenant-${tenant.id}`}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>

        {/* Pagination Footer */}
        {!isLoading && tenants.length > 0 && (
          <CardContent className="py-4 border-t">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Results Count - Bottom Left */}
              <div className="text-sm text-muted-foreground">
                Showing {tenants.length} of {totalElements} tenants
              </div>

              {/* Pagination Controls - Center */}
              {totalPages > 1 && (
                <Pagination className="mx-0 w-auto">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => currentPage > 0 && handlePageChange(currentPage - 1)}
                        className={currentPage === 0 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        data-testid="btn-prev-page"
                      />
                    </PaginationItem>

                    {currentPage > 2 && (
                      <>
                        <PaginationItem>
                          <PaginationLink onClick={() => handlePageChange(0)} className="cursor-pointer">
                            1
                          </PaginationLink>
                        </PaginationItem>
                        {currentPage > 3 && (
                          <PaginationItem>
                            <PaginationEllipsis />
                          </PaginationItem>
                        )}
                      </>
                    )}

                    {Array.from({ length: totalPages }, (_, i) => i)
                      .filter(page => Math.abs(page - currentPage) <= 2)
                      .map(page => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => handlePageChange(page)}
                            isActive={page === currentPage}
                            className="cursor-pointer"
                          >
                            {page + 1}
                          </PaginationLink>
                        </PaginationItem>
                      ))}

                    {currentPage < totalPages - 3 && (
                      <>
                        {currentPage < totalPages - 4 && (
                          <PaginationItem>
                            <PaginationEllipsis />
                          </PaginationItem>
                        )}
                        <PaginationItem>
                          <PaginationLink onClick={() => handlePageChange(totalPages - 1)} className="cursor-pointer">
                            {totalPages}
                          </PaginationLink>
                        </PaginationItem>
                      </>
                    )}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => currentPage < totalPages - 1 && handlePageChange(currentPage + 1)}
                        className={currentPage >= totalPages - 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        data-testid="btn-next-page"
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}

              {/* Page Info - Bottom Right */}
              <div className="text-sm text-muted-foreground">
                Page {currentPage + 1} of {totalPages || 1}
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
