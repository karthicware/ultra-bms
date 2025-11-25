/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

/**
 * Maintenance Requests List Page
 * Story 3.5: Tenant Portal - Maintenance Request Submission
 *
 * Features:
 * - Paginated list of tenant's requests (newest first)
 * - Filters: status, category
 * - Search: by request number, title, description
 * - Status badges with color coding
 * - Click to view details
 * - New Request button
 */

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDebounce } from '@/hooks/useDebounce';
import { getMaintenanceRequests } from '@/services/maintenance.service';
import { MaintenanceStatus, MaintenanceCategory } from '@/types/maintenance';
import { StatusBadge } from '@/components/maintenance/StatusBadge';

export default function MaintenanceRequestsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [page, setPage] = useState(0);

  const debouncedSearch = useDebounce(searchTerm, 300);

  const { data, isLoading, error } = useQuery({
    queryKey: ['maintenance-requests', statusFilter, categoryFilter, debouncedSearch, page],
    queryFn: () => {
      const filters = {
        status: statusFilter !== 'all' ? [statusFilter as MaintenanceStatus] : undefined,
        category: categoryFilter !== 'all' ? [categoryFilter as MaintenanceCategory] : undefined,
        search: debouncedSearch || undefined,
      };
      return getMaintenanceRequests(filters, page, 10);
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Maintenance Requests</h1>
          <p className="text-gray-600 mt-1">View and track your submitted requests</p>
        </div>
        <Button asChild data-testid="btn-new-request">
          <Link href="/tenant/requests/new">
            <Plus className="mr-2 h-4 w-4" />
            New Request
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by request number, title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger data-testid="select-status-filter">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value={MaintenanceStatus.SUBMITTED}>Submitted</SelectItem>
                <SelectItem value={MaintenanceStatus.ASSIGNED}>Assigned</SelectItem>
                <SelectItem value={MaintenanceStatus.IN_PROGRESS}>In Progress</SelectItem>
                <SelectItem value={MaintenanceStatus.COMPLETED}>Completed</SelectItem>
                <SelectItem value={MaintenanceStatus.CLOSED}>Closed</SelectItem>
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger data-testid="select-category-filter">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value={MaintenanceCategory.PLUMBING}>Plumbing</SelectItem>
                <SelectItem value={MaintenanceCategory.ELECTRICAL}>Electrical</SelectItem>
                <SelectItem value={MaintenanceCategory.HVAC}>HVAC</SelectItem>
                <SelectItem value={MaintenanceCategory.APPLIANCE}>Appliance</SelectItem>
                <SelectItem value={MaintenanceCategory.CARPENTRY}>Carpentry</SelectItem>
                <SelectItem value={MaintenanceCategory.PEST_CONTROL}>Pest Control</SelectItem>
                <SelectItem value={MaintenanceCategory.CLEANING}>Cleaning</SelectItem>
                <SelectItem value={MaintenanceCategory.OTHER}>Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-red-600">Failed to load requests. Please try again.</p>
          </CardContent>
        </Card>
      ) : data?.content.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              {debouncedSearch || statusFilter !== 'all' || categoryFilter !== 'all'
                ? 'No requests match your filters'
                : 'No maintenance requests yet'}
            </p>
            <Button asChild>
              <Link href="/tenant/requests/new">Submit your first request</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {data?.content.map((request) => (
              <Link
                key={request.id}
                href={`/tenant/requests/${request.id}`}
                data-testid={`request-card-${request.requestNumber}`}
              >
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{request.title}</CardTitle>
                          <StatusBadge status={request.status} />
                        </div>
                        <CardDescription>
                          Request #{request.requestNumber} • {request.category}
                        </CardDescription>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <div>Submitted: {format(new Date(request.submittedAt), 'PP')}</div>
                        {request.updatedAt !== request.submittedAt && (
                          <div className="text-xs">
                            Updated: {format(new Date(request.updatedAt), 'PP')}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                Previous
              </Button>
              <span className="py-2 px-4">
                Page {page + 1} of {data.totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= data.totalPages - 1}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
