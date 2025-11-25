'use client';

/**
 * Unassigned Work Orders Page
 * Story 4.3: Work Order Assignment and Vendor Coordination
 *
 * AC #12: Lists all work orders with status = OPEN and assignedTo = null
 * Features:
 * - Sortable by priority and creation date
 * - Filterable by property, category, priority
 * - Quick-assign actions
 * - Search functionality
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  Search,
  Filter,
  ArrowUpDown,
  UserPlus,
  ChevronRight,
  Calendar,
  Building2,
  AlertTriangle,
  Loader2,
  FileText,
  RefreshCw,
} from 'lucide-react';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

import { getUnassignedWorkOrdersFiltered, assignWorkOrderToAssignee, getWorkOrderById } from '@/services/work-orders.service';
import { AssignmentDialog } from '@/components/work-orders/AssignmentDialog';
import {
  WorkOrderPriority,
  WorkOrderCategory,
  type WorkOrderListItem,
} from '@/types/work-orders';
import type { AssignWorkOrderFormData } from '@/lib/validations/work-order-assignment';

// Priority badge colors
const PRIORITY_COLORS: Record<WorkOrderPriority, string> = {
  [WorkOrderPriority.HIGH]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  [WorkOrderPriority.MEDIUM]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  [WorkOrderPriority.LOW]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
};

// Sort options
type SortOption = 'priority' | 'createdAt' | 'scheduledDate';
type SortDirection = 'ASC' | 'DESC';

export default function UnassignedWorkOrdersPage() {
  const router = useRouter();
  const { toast } = useToast();

  // State
  const [workOrders, setWorkOrders] = useState<WorkOrderListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('priority');
  const [sortDirection, setSortDirection] = useState<SortDirection>('DESC');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Assignment dialog state
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrderListItem | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);

  // Load unassigned work orders
  const loadWorkOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const priorities = selectedPriority !== 'all' ? [selectedPriority as WorkOrderPriority] : undefined;
      const categories = selectedCategory !== 'all' ? [selectedCategory as WorkOrderCategory] : undefined;

      const response = await getUnassignedWorkOrdersFiltered({
        priority: priorities,
        category: categories,
        search: searchTerm || undefined,
        sortBy,
        sortDirection,
        page,
        size: 20,
      });

      setWorkOrders(response.data || []);
      setTotalPages(response.pagination?.totalPages || 0);
      setTotalElements(response.pagination?.totalElements || 0);
    } catch (error) {
      console.error('Failed to load unassigned work orders:', error);
      toast({
        title: 'Error',
        description: 'Failed to load unassigned work orders',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedPriority, selectedCategory, searchTerm, sortBy, sortDirection, page, toast]);

  useEffect(() => {
    loadWorkOrders();
  }, [loadWorkOrders]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Handlers
  const handleSort = (column: SortOption) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(column);
      setSortDirection('DESC');
    }
    setPage(0);
  };

  const handleQuickAssign = (workOrder: WorkOrderListItem) => {
    setSelectedWorkOrder(workOrder);
    setAssignDialogOpen(true);
  };

  const handleAssignSubmit = async (data: AssignWorkOrderFormData) => {
    if (!selectedWorkOrder) return;

    try {
      setIsAssigning(true);
      await assignWorkOrderToAssignee(selectedWorkOrder.id, {
        assigneeType: data.assigneeType,
        assigneeId: data.assigneeId,
        assignmentNotes: data.assignmentNotes || undefined,
      });

      setAssignDialogOpen(false);
      toast({
        title: 'Success',
        description: `Work Order #${selectedWorkOrder.workOrderNumber} has been assigned successfully`,
      });

      // Refresh the list
      loadWorkOrders();
    } catch (error: any) {
      toast({
        title: 'Assignment Failed',
        description: error.response?.data?.error?.message || 'Failed to assign work order',
        variant: 'destructive',
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRefresh = () => {
    loadWorkOrders();
  };

  return (
    <div className="container mx-auto py-6" data-testid="unassigned-work-orders-page">
      {/* Breadcrumb */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/property-manager/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/property-manager/work-orders">Work Orders</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Unassigned</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Unassigned Work Orders</h1>
          <p className="text-muted-foreground">
            {totalElements} work order{totalElements !== 1 ? 's' : ''} awaiting assignment
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search work orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
                data-testid="search-unassigned"
              />
            </div>

            {/* Priority Filter */}
            <Select value={selectedPriority} onValueChange={setSelectedPriority}>
              <SelectTrigger className="w-[180px]" data-testid="filter-priority">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value={WorkOrderPriority.HIGH}>High Priority</SelectItem>
                <SelectItem value={WorkOrderPriority.MEDIUM}>Medium Priority</SelectItem>
                <SelectItem value={WorkOrderPriority.LOW}>Low Priority</SelectItem>
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]" data-testid="filter-category">
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
          </div>
        </CardContent>
      </Card>

      {/* Work Orders Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : workOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mb-4" />
              <h3 className="text-lg font-semibold mb-1">No unassigned work orders</h3>
              <p className="text-sm">All work orders have been assigned</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[140px]">Work Order #</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 -ml-2"
                        onClick={() => handleSort('priority')}
                      >
                        Priority
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 -ml-2"
                        onClick={() => handleSort('createdAt')}
                      >
                        Created
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workOrders.map((workOrder) => (
                    <TableRow
                      key={workOrder.id}
                      className="cursor-pointer hover:bg-muted/50"
                      data-testid={`unassigned-row-${workOrder.id}`}
                    >
                      <TableCell className="font-mono text-sm">
                        <Link
                          href={`/property-manager/work-orders/${workOrder.id}`}
                          className="hover:underline text-primary"
                        >
                          {workOrder.workOrderNumber}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px] truncate font-medium">
                          {workOrder.title}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm">{workOrder.propertyName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={PRIORITY_COLORS[workOrder.priority]}>
                          {workOrder.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {workOrder.category.replace(/_/g, ' ')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          {format(new Date(workOrder.createdAt), 'dd MMM yyyy')}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickAssign(workOrder);
                          }}
                          data-testid={`quick-assign-${workOrder.id}`}
                        >
                          <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                          Assign
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Page {page + 1} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.max(0, page - 1))}
                      disabled={page === 0}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                      disabled={page >= totalPages - 1}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Assignment Dialog */}
      {selectedWorkOrder && (
        <AssignmentDialog
          open={assignDialogOpen}
          onOpenChange={setAssignDialogOpen}
          workOrder={{
            id: selectedWorkOrder.id,
            workOrderNumber: selectedWorkOrder.workOrderNumber,
            title: selectedWorkOrder.title,
            category: selectedWorkOrder.category,
          } as any}
          onAssign={handleAssignSubmit}
          isSubmitting={isAssigning}
        />
      )}
    </div>
  );
}
