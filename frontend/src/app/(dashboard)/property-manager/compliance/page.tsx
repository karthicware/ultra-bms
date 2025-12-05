'use client';

/**
 * Compliance Dashboard Page
 * Story 7.3: Compliance and Inspection Tracking
 *
 * AC #28: Compliance schedules list view with filters
 * AC #29: Dashboard shows compliance KPIs
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  RefreshCw,
  MoreHorizontal,
  Eye,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  ShieldCheck,
  ClipboardList,
  FileWarning,
  Building2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

import { complianceService } from '@/services/compliance.service';
import {
  ComplianceScheduleStatus,
  ComplianceCategory,
  type ComplianceScheduleListItem,
  type ComplianceDashboard,
  getScheduleStatusColor,
  getScheduleStatusLabel,
  getCategoryLabel,
} from '@/types/compliance';

export default function CompliancePage() {
  const router = useRouter();
  const { toast } = useToast();

  // Dashboard state
  const [dashboard, setDashboard] = useState<ComplianceDashboard | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  // Schedules state
  const [schedules, setSchedules] = useState<ComplianceScheduleListItem[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Load dashboard data
  const loadDashboard = useCallback(async () => {
    setDashboardLoading(true);
    try {
      const dashboard = await complianceService.getDashboard();
      setDashboard(dashboard);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      toast({
        title: 'Error',
        description: 'Failed to load compliance dashboard',
        variant: 'destructive',
      });
    } finally {
      setDashboardLoading(false);
    }
  }, [toast]);

  // Load schedules
  const loadSchedules = useCallback(async () => {
    setSchedulesLoading(true);
    try {
      const response = await complianceService.getSchedules({
        status: selectedStatus !== 'all' ? (selectedStatus as ComplianceScheduleStatus) : undefined,
        category: selectedCategory !== 'all' ? (selectedCategory as ComplianceCategory) : undefined,
        page,
        size: 20,
      });

      setSchedules(response.data?.content || []);
      setTotalPages(response.data?.totalPages || 0);
    } catch (error) {
      console.error('Failed to load schedules:', error);
      toast({
        title: 'Error',
        description: 'Failed to load compliance schedules',
        variant: 'destructive',
      });
    } finally {
      setSchedulesLoading(false);
    }
  }, [selectedStatus, selectedCategory, page, toast]);

  useEffect(() => {
    loadDashboard();
    loadSchedules();
  }, [loadDashboard, loadSchedules]);

  // Handle refresh
  const handleRefresh = () => {
    loadDashboard();
    loadSchedules();
  };

  // Get status badge
  const getStatusBadge = (status: ComplianceScheduleStatus) => {
    const colorClass = getScheduleStatusColor(status);
    return (
      <Badge className={colorClass}>
        {getScheduleStatusLabel(status)}
      </Badge>
    );
  };

  // Format date
  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-AE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Date for header
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="container mx-auto py-8 space-y-8 max-w-7xl" data-testid="compliance-page">
      {/* Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between bg-card p-6 rounded-xl border shadow-sm">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground" data-testid="compliance-page-title">
            Compliance & Inspections
          </h1>
          <div className="flex items-center text-muted-foreground text-sm gap-2">
            <Calendar className="h-4 w-4" />
            <span>{today}</span>
            <span className="text-border">|</span>
            <span>Track compliance requirements, inspections, and violations</span>
          </div>
        </div>
        <Button 
          variant="outline" 
          onClick={handleRefresh} 
          disabled={dashboardLoading || schedulesLoading}
          className="shadow-sm"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${(dashboardLoading || schedulesLoading) ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {/* Dashboard KPIs */}
      {dashboardLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Compliance Rate */}
          <Card className="shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <ShieldCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="space-y-1 w-full">
                <p className="text-sm text-muted-foreground font-medium">Compliance Rate</p>
                <h3 className="text-2xl font-bold">{dashboard.complianceRatePercentage?.toFixed(1)}%</h3>
                <Progress value={dashboard.complianceRatePercentage || 0} className="h-1.5 w-full" />
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Inspections */}
          <Card className="shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Upcoming Inspections</p>
                <h3 className="text-2xl font-bold">{dashboard.upcomingInspections}</h3>
                <p className="text-xs text-muted-foreground mt-1">Next 30 days</p>
              </div>
            </CardContent>
          </Card>

          {/* Overdue Items */}
          <Card className="shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Overdue Items</p>
                <h3 className="text-2xl font-bold text-red-600">{dashboard.overdueComplianceItems}</h3>
                <p className="text-xs text-muted-foreground mt-1">Requires attention</p>
              </div>
            </CardContent>
          </Card>

          {/* Recent Violations */}
          <Card className="shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <FileWarning className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Recent Violations</p>
                <h3 className="text-2xl font-bold">{dashboard.recentViolationsCount}</h3>
                <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Navigation Tabs */}
      <Tabs defaultValue="schedules" className="space-y-6">
        <div className="bg-card p-1 rounded-lg border shadow-sm inline-flex">
          <TabsList className="bg-transparent h-9">
            <TabsTrigger value="schedules" className="data-[state=active]:bg-muted data-[state=active]:shadow-sm">
              <ClipboardList className="h-4 w-4 mr-2" />
              Schedules
            </TabsTrigger>
            <TabsTrigger value="inspections" onClick={() => router.push('/property-manager/compliance/inspections')} className="data-[state=active]:bg-muted">
              <Calendar className="h-4 w-4 mr-2" />
              Inspections
            </TabsTrigger>
            <TabsTrigger value="violations" onClick={() => router.push('/property-manager/compliance/violations')} className="data-[state=active]:bg-muted">
              <FileWarning className="h-4 w-4 mr-2" />
              Violations
            </TabsTrigger>
            <TabsTrigger value="requirements" onClick={() => router.push('/property-manager/compliance/requirements')} className="data-[state=active]:bg-muted">
              <ShieldCheck className="h-4 w-4 mr-2" />
              Requirements
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="schedules" className="space-y-4 mt-0">
          <Card className="shadow-sm border">
            <div className="p-6 border-b flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <h3 className="font-semibold text-lg">Compliance Schedules</h3>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                {/* Status Filter */}
                <Select value={selectedStatus} onValueChange={(value) => { setSelectedStatus(value); setPage(0); }}>
                  <SelectTrigger className="w-full sm:w-[180px]" data-testid="schedule-status-filter">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {Object.values(ComplianceScheduleStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        {getScheduleStatusLabel(status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Category Filter */}
                <Select value={selectedCategory} onValueChange={(value) => { setSelectedCategory(value); setPage(0); }}>
                  <SelectTrigger className="w-full sm:w-[200px]" data-testid="schedule-category-filter">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {Object.values(ComplianceCategory).map((category) => (
                      <SelectItem key={category} value={category}>
                        {getCategoryLabel(category)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <CardContent className="p-0">
              {schedulesLoading ? (
                <div className="p-6 space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : schedules.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <ClipboardList className="h-12 w-12 mb-4 opacity-20" />
                  <h3 className="text-lg font-semibold mb-1">No schedules found</h3>
                  <p className="text-sm">
                    {selectedStatus !== 'all' || selectedCategory !== 'all'
                      ? 'Try adjusting your filters'
                      : 'No compliance schedules available'}
                  </p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="w-[140px] pl-6">Schedule #</TableHead>
                        <TableHead>Property</TableHead>
                        <TableHead>Requirement</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right pr-6">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {schedules.map((schedule) => (
                        <TableRow
                          key={schedule.id}
                          className="cursor-pointer hover:bg-muted/50"
                          data-testid={`schedule-row-${schedule.id}`}
                          onClick={() => router.push(`/property-manager/compliance/schedules/${schedule.id}`)}
                        >
                          <TableCell className="font-mono text-sm pl-6">
                            <span className="text-primary hover:underline font-medium">
                              {schedule.requirementNumber || schedule.id.substring(0, 8)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <span>{schedule.propertyName}</span>
                            </div>
                          </TableCell>
                          <TableCell>{schedule.requirementName}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-normal">
                              {getCategoryLabel(schedule.category)}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(schedule.dueDate)}</TableCell>
                          <TableCell>{getStatusBadge(schedule.status)}</TableCell>
                          <TableCell className="text-right pr-6">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Actions</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/property-manager/compliance/schedules/${schedule.id}`);
                                  }}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                {schedule.status !== ComplianceScheduleStatus.COMPLETED && (
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      router.push(`/property-manager/compliance/schedules/${schedule.id}/complete`);
                                    }}
                                  >
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Mark Complete
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/5">
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
