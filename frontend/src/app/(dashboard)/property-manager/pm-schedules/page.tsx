/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

/**
 * PM Schedules List Page
 * Story 4.2: Preventive Maintenance Scheduling
 * Displays paginated list of PM schedules with filters
 */

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Play,
  Pause,
  CheckCircle,
  Clock,
  Building2,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getPMSchedules } from '@/services/pm-schedule.service';
import {
  PMScheduleStatus,
  RecurrenceType,
  PMScheduleListItem,
  getPMScheduleStatusInfo,
  getRecurrenceTypeInfo,
} from '@/types/pm-schedule';
import { WorkOrderCategory, WorkOrderPriority } from '@/types/work-orders';
import { cn } from '@/lib/utils';

function PMSchedulesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // State
  const [schedules, setSchedules] = useState<PMScheduleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 0,
    pageSize: 20,
    totalPages: 0,
    totalElements: 0,
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [frequencyFilter, setFrequencyFilter] = useState<string>('all');

  // Fetch schedules
  const fetchSchedules = useCallback(async (page = 0) => {
    try {
      setLoading(true);

      const filters: Parameters<typeof getPMSchedules>[0] = {
        page,
        size: 20,
        sortBy: 'nextGenerationDate',
        sortDirection: 'ASC',
      };

      if (searchTerm) {
        filters.search = searchTerm;
      }
      if (statusFilter !== 'all') {
        filters.status = [statusFilter as PMScheduleStatus];
      }
      if (categoryFilter !== 'all') {
        filters.category = [categoryFilter as WorkOrderCategory];
      }
      if (frequencyFilter !== 'all') {
        filters.recurrenceType = [frequencyFilter as RecurrenceType];
      }

      const response = await getPMSchedules(filters);

      setSchedules(response.data);
      setPagination({
        currentPage: response.pagination.currentPage,
        pageSize: response.pagination.pageSize,
        totalPages: response.pagination.totalPages,
        totalElements: response.pagination.totalElements,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load PM schedules',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, categoryFilter, frequencyFilter, toast]);

  // Initial load
  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  // Handle search with debounce
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchSchedules(0);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, statusFilter, categoryFilter, frequencyFilter]);

  // Get status badge styling
  const getStatusBadge = (status: PMScheduleStatus) => {
    const statusInfo = getPMScheduleStatusInfo(status);
    if (!statusInfo) return <Badge variant="outline">{status}</Badge>;

    return (
      <Badge className={statusInfo.badgeClass}>
        {status === PMScheduleStatus.ACTIVE && <Play className="mr-1 h-3 w-3" />}
        {status === PMScheduleStatus.PAUSED && <Pause className="mr-1 h-3 w-3" />}
        {status === PMScheduleStatus.COMPLETED && <CheckCircle className="mr-1 h-3 w-3" />}
        {statusInfo.label}
      </Badge>
    );
  };

  // Get frequency badge
  const getFrequencyBadge = (recurrenceType: RecurrenceType) => {
    const info = getRecurrenceTypeInfo(recurrenceType);
    return (
      <Badge variant="outline" className="font-normal">
        <Clock className="mr-1 h-3 w-3" />
        {info?.label || recurrenceType}
      </Badge>
    );
  };

  // Get priority badge
  const getPriorityBadge = (priority: WorkOrderPriority) => {
    switch (priority) {
      case WorkOrderPriority.HIGH:
        return <Badge variant="destructive">HIGH</Badge>;
      case WorkOrderPriority.MEDIUM:
        return <Badge className="bg-yellow-500">MEDIUM</Badge>;
      case WorkOrderPriority.LOW:
        return <Badge variant="secondary">LOW</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">PM Schedules</h1>
          <p className="text-muted-foreground">
            Manage preventive maintenance schedules for automatic work order generation
          </p>
        </div>
        <Button onClick={() => router.push('/property-manager/pm-schedules/new')} data-testid="btn-create-pm-schedule">
          <Plus className="mr-2 h-4 w-4" />
          Create Schedule
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search schedules..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[150px]" data-testid="filter-status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value={PMScheduleStatus.ACTIVE}>Active</SelectItem>
                <SelectItem value={PMScheduleStatus.PAUSED}>Paused</SelectItem>
                <SelectItem value={PMScheduleStatus.COMPLETED}>Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[150px]" data-testid="filter-category">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value={WorkOrderCategory.PLUMBING}>Plumbing</SelectItem>
                <SelectItem value={WorkOrderCategory.ELECTRICAL}>Electrical</SelectItem>
                <SelectItem value={WorkOrderCategory.HVAC}>HVAC</SelectItem>
                <SelectItem value={WorkOrderCategory.APPLIANCE}>Appliance</SelectItem>
                <SelectItem value={WorkOrderCategory.CLEANING}>Cleaning</SelectItem>
                <SelectItem value={WorkOrderCategory.LANDSCAPING}>Landscaping</SelectItem>
                <SelectItem value={WorkOrderCategory.OTHER}>Other</SelectItem>
              </SelectContent>
            </Select>
            <Select value={frequencyFilter} onValueChange={setFrequencyFilter}>
              <SelectTrigger className="w-full md:w-[150px]" data-testid="filter-frequency">
                <SelectValue placeholder="Frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Frequencies</SelectItem>
                <SelectItem value={RecurrenceType.MONTHLY}>Monthly</SelectItem>
                <SelectItem value={RecurrenceType.QUARTERLY}>Quarterly</SelectItem>
                <SelectItem value={RecurrenceType.SEMI_ANNUALLY}>Semi-Annual</SelectItem>
                <SelectItem value={RecurrenceType.ANNUALLY}>Annual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Schedules Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : schedules.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No PM schedules found</h3>
              <p className="mt-2 text-muted-foreground">
                {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' || frequencyFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Get started by creating your first preventive maintenance schedule'}
              </p>
              {!searchTerm && statusFilter === 'all' && categoryFilter === 'all' && frequencyFilter === 'all' && (
                <Button
                  onClick={() => router.push('/property-manager/pm-schedules/new')}
                  className="mt-4"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Schedule
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Schedule Name</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Next Generation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map((schedule) => (
                  <TableRow
                    key={schedule.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/property-manager/pm-schedules/${schedule.id}`)}
                    data-testid={`row-schedule-${schedule.id}`}
                  >
                    <TableCell className="font-medium">
                      {schedule.scheduleName}
                    </TableCell>
                    <TableCell>
                      {schedule.propertyName ? (
                        <span className="flex items-center gap-1">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {schedule.propertyName}
                        </span>
                      ) : (
                        <Badge variant="outline">All Properties</Badge>
                      )}
                    </TableCell>
                    <TableCell className="capitalize">{schedule.category.toLowerCase().replace('_', ' ')}</TableCell>
                    <TableCell>{getFrequencyBadge(schedule.recurrenceType)}</TableCell>
                    <TableCell>{getPriorityBadge(schedule.defaultPriority)}</TableCell>
                    <TableCell>{getStatusBadge(schedule.status)}</TableCell>
                    <TableCell>
                      {schedule.nextGenerationDate ? (
                        <span className="text-sm">
                          {format(new Date(schedule.nextGenerationDate), 'MMM d, yyyy')}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {pagination.currentPage * pagination.pageSize + 1} to{' '}
            {Math.min((pagination.currentPage + 1) * pagination.pageSize, pagination.totalElements)} of{' '}
            {pagination.totalElements} schedules
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchSchedules(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 0}
              data-testid="btn-prev-page"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm">
              Page {pagination.currentPage + 1} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchSchedules(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.totalPages - 1}
              data-testid="btn-next-page"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PMSchedulesListPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <PMSchedulesContent />
    </Suspense>
  );
}
