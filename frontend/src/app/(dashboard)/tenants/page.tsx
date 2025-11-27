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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getAllTenants, searchTenants } from '@/services/tenant.service';
import type { TenantResponse, TenantStatus } from '@/types/tenant';
import { Plus, Search, Eye, Users, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
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
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
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

      setTenants(response.content || []);
      setTotalPages(response.totalPages || 0);
      setTotalElements(response.totalElements || 0);
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

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or tenant number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-search-tenant"
              />
            </div>

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

          {/* Results Count */}
          <div className="text-sm text-muted-foreground">
            Showing {tenants.length} of {totalElements} tenants
          </div>
        </CardContent>
      </Card>

      {/* Tenants Table */}
      <Card>
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
                <TableHeader>
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
                          <span className="font-medium">{tenant.propertyName || '-'}</span>
                          <span className="text-sm text-muted-foreground">
                            Unit {tenant.unitNumber || '-'}
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
      </Card>

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {currentPage + 1} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 0}
              data-testid="btn-prev-page"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages - 1}
              data-testid="btn-next-page"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
