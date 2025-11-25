'use client';

/**
 * Work Orders List Page
 * Story 4.1: Work Order Creation and Management
 * Displays all work orders with filters, search, and pagination
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
import { useToast } from '@/hooks/use-toast';
import { getWorkOrders } from '@/services/work-orders.service';
import { getProperties } from '@/services/properties.service';
import {
  WorkOrderCategory,
  WorkOrderPriority,
  WorkOrderStatus,
  type WorkOrderListItem
} from '@/types/work-orders';
import type { Property } from '@/types';
import {
  Plus,
  Search,
  Eye,
  Pencil,
  UserPlus,
  Droplet,
  Zap,
  Wind,
  Tv,
  Hammer,
  Bug,
  Sparkles,
  Paintbrush,
  Sprout,
  Wrench,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';

// Category icons mapping
const CATEGORY_ICONS: Record<WorkOrderCategory, any> = {
  [WorkOrderCategory.PLUMBING]: Droplet,
  [WorkOrderCategory.ELECTRICAL]: Zap,
  [WorkOrderCategory.HVAC]: Wind,
  [WorkOrderCategory.APPLIANCE]: Tv,
  [WorkOrderCategory.CARPENTRY]: Hammer,
  [WorkOrderCategory.PEST_CONTROL]: Bug,
  [WorkOrderCategory.CLEANING]: Sparkles,
  [WorkOrderCategory.PAINTING]: Paintbrush,
  [WorkOrderCategory.LANDSCAPING]: Sprout,
  [WorkOrderCategory.OTHER]: Wrench,
};

// Status badge colors
const STATUS_COLORS: Record<WorkOrderStatus, string> = {
  [WorkOrderStatus.OPEN]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  [WorkOrderStatus.ASSIGNED]: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  [WorkOrderStatus.IN_PROGRESS]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  [WorkOrderStatus.COMPLETED]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  [WorkOrderStatus.CLOSED]: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
};

// Priority badge colors
const PRIORITY_COLORS: Record<WorkOrderPriority, string> = {
  [WorkOrderPriority.HIGH]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  [WorkOrderPriority.MEDIUM]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  [WorkOrderPriority.LOW]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
};

export default function WorkOrdersPage() {
  const router = useRouter();
  const { toast } = useToast();

  // State
  const [workOrders, setWorkOrders] = useState<WorkOrderListItem[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('active'); // Default to active work orders
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [propertyFilter, setPropertyFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [sortField, setSortField] = useState<string>('scheduledDate');
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('DESC');

  // Fetch properties on mount for filter dropdown
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await getProperties({ page: 0, size: 100 });
        setProperties(response.content);
      } catch (error) {
        console.error('Failed to load properties:', error);
      }
    };
    fetchProperties();
  }, []);

  // Fetch work orders
  const fetchWorkOrders = useCallback(async () => {
    try {
      setIsLoading(true);

      // Convert status filter to array
      let statusArray: WorkOrderStatus[] | undefined;
      if (statusFilter === 'active') {
        statusArray = [WorkOrderStatus.OPEN, WorkOrderStatus.ASSIGNED, WorkOrderStatus.IN_PROGRESS];
      } else if (statusFilter !== 'all') {
        statusArray = [statusFilter as WorkOrderStatus];
      }

      const response = await getWorkOrders({
        page: currentPage,
        size: pageSize,
        search: searchTerm || undefined,
        status: statusArray,
        priority: priorityFilter !== 'all' ? [priorityFilter as WorkOrderPriority] : undefined,
        category: categoryFilter !== 'all' ? [categoryFilter as WorkOrderCategory] : undefined,
        propertyId: propertyFilter !== 'all' ? propertyFilter : undefined,
        sortBy: sortField,
        sortDirection: sortDirection,
      });

      setWorkOrders(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalElements(response.pagination.totalElements);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load work orders. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    currentPage,
    pageSize,
    searchTerm,
    statusFilter,
    priorityFilter,
    categoryFilter,
    propertyFilter,
    sortField,
    sortDirection,
    toast,
  ]);

  // Debounced search
  const debouncedFetchWorkOrders = useMemo(
    () => debounce(fetchWorkOrders, 300),
    [fetchWorkOrders]
  );

  useEffect(() => {
    debouncedFetchWorkOrders();
    return () => debouncedFetchWorkOrders.cancel();
  }, [debouncedFetchWorkOrders]);

  // Handlers
  const handleCreateWorkOrder = () => {
    router.push('/property-manager/work-orders/new');
  };

  const handleViewWorkOrder = (id: string) => {
    router.push(`/property-manager/work-orders/${id}`);
  };

  const handleEditWorkOrder = (id: string) => {
    router.push(`/property-manager/work-orders/${id}/edit`);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortField(field);
      setSortDirection('ASC');
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return <ArrowUpDown className="ml-2 h-4 w-4" />;
    return sortDirection === 'ASC' ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    );
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('active');
    setPriorityFilter('all');
    setCategoryFilter('all');
    setPropertyFilter('all');
    setCurrentPage(0);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Work Orders</h1>
          <p className="text-muted-foreground">Manage maintenance work orders for your properties</p>
        </div>
        <Button onClick={handleCreateWorkOrder} data-testid="btn-create-work-order">
          <Plus className="mr-2 h-4 w-4" />
          Create Work Order
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="col-span-1 md:col-span-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by work order number, title, unit..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                  data-testid="input-search"
                />
              </div>
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger data-testid="select-status-filter">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active (Open/Assigned/In Progress)</SelectItem>
                <SelectItem value={WorkOrderStatus.OPEN}>Open</SelectItem>
                <SelectItem value={WorkOrderStatus.ASSIGNED}>Assigned</SelectItem>
                <SelectItem value={WorkOrderStatus.IN_PROGRESS}>In Progress</SelectItem>
                <SelectItem value={WorkOrderStatus.COMPLETED}>Completed</SelectItem>
                <SelectItem value={WorkOrderStatus.CLOSED}>Closed</SelectItem>
              </SelectContent>
            </Select>

            {/* Priority Filter */}
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger data-testid="select-priority-filter">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value={WorkOrderPriority.HIGH}>High</SelectItem>
                <SelectItem value={WorkOrderPriority.MEDIUM}>Medium</SelectItem>
                <SelectItem value={WorkOrderPriority.LOW}>Low</SelectItem>
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger data-testid="select-category-filter">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.values(WorkOrderCategory).map((category) => (
                  <SelectItem key={category} value={category}>
                    {category.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Property Filter */}
            <Select value={propertyFilter} onValueChange={setPropertyFilter}>
              <SelectTrigger data-testid="select-property-filter">
                <SelectValue placeholder="Property" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Properties</SelectItem>
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            <Button variant="outline" onClick={clearFilters} className="col-span-1 md:col-span-2 lg:col-span-1">
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : workOrders.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-muted-foreground mb-4">No work orders found. Create your first work order to get started.</p>
              <Button onClick={handleCreateWorkOrder}>
                <Plus className="mr-2 h-4 w-4" />
                Create Work Order
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table data-testid="table-work-orders">
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort('workOrderNumber')}
                          className="font-semibold"
                        >
                          Work Order #
                          {getSortIcon('workOrderNumber')}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort('propertyName')}
                          className="font-semibold"
                        >
                          Property / Unit
                          {getSortIcon('propertyName')}
                        </Button>
                      </TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort('scheduledDate')}
                          className="font-semibold"
                        >
                          Scheduled
                          {getSortIcon('scheduledDate')}
                        </Button>
                      </TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workOrders.map((workOrder) => {
                      const CategoryIcon = CATEGORY_ICONS[workOrder.category];
                      return (
                        <TableRow key={workOrder.id}>
                          <TableCell className="font-medium">
                            <Button
                              variant="link"
                              onClick={() => handleViewWorkOrder(workOrder.id)}
                              className="p-0 h-auto font-mono text-sm"
                            >
                              {workOrder.workOrderNumber}
                            </Button>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{workOrder.propertyName}</div>
                              {workOrder.unitNumber && (
                                <div className="text-sm text-muted-foreground">Unit {workOrder.unitNumber}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{workOrder.title}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{workOrder.category.replace(/_/g, ' ')}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={PRIORITY_COLORS[workOrder.priority]}>
                              {workOrder.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={STATUS_COLORS[workOrder.status]}>
                              {workOrder.status.replace(/_/g, ' ')}
                            </Badge>
                            {workOrder.isOverdue && (
                              <Badge variant="destructive" className="ml-2">
                                Overdue
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {workOrder.scheduledDate ? format(new Date(workOrder.scheduledDate), 'dd MMM yyyy') : '-'}
                          </TableCell>
                          <TableCell>{workOrder.assigneeName || 'Unassigned'}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewWorkOrder(workOrder.id)}
                                data-testid={`btn-view-${workOrder.id}`}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {(workOrder.status === WorkOrderStatus.OPEN || workOrder.status === WorkOrderStatus.ASSIGNED) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditWorkOrder(workOrder.id)}
                                  data-testid={`btn-edit-${workOrder.id}`}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t px-6 py-4">
                <div className="text-sm text-muted-foreground">
                  Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, totalElements)} of{' '}
                  {totalElements} work orders
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <div className="text-sm">
                    Page {currentPage + 1} of {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage >= totalPages - 1}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
