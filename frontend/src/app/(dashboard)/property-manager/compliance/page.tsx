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
import Link from 'next/link';
import {
  Search,
  ArrowUpDown,
  Loader2,
  RefreshCw,
  MoreHorizontal,
  Eye,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Clock,
  ShieldCheck,
  ClipboardList,
  FileWarning,
  Building2,
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
  const [totalElements, setTotalElements] = useState(0);

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
      setTotalElements(response.data?.totalElements || 0);
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

  return (
    <div className="container mx-auto py-6" data-testid="compliance-page">
      {/* Breadcrumb */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/property-manager/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Compliance</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="compliance-page-title">
            Compliance & Inspections
          </h1>
          <p className="text-muted-foreground">
            Track compliance requirements, inspections, and violations
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={dashboardLoading || schedulesLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${(dashboardLoading || schedulesLoading) ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Dashboard KPIs */}
      {dashboardLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center justify-center h-24">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Compliance Rate */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
              <ShieldCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard.complianceRatePercentage?.toFixed(1)}%</div>
              <Progress value={dashboard.complianceRatePercentage || 0} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">Overall compliance status</p>
            </CardContent>
          </Card>

          {/* Upcoming Inspections */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Inspections</CardTitle>
              <Calendar className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard.upcomingInspections}</div>
              <p className="text-xs text-muted-foreground mt-2">Next 30 days</p>
            </CardContent>
          </Card>

          {/* Overdue Items */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Overdue Items</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{dashboard.overdueComplianceItems}</div>
              <p className="text-xs text-muted-foreground mt-2">Requires attention</p>
            </CardContent>
          </Card>

          {/* Recent Violations */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Recent Violations</CardTitle>
              <FileWarning className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard.recentViolationsCount}</div>
              <p className="text-xs text-muted-foreground mt-2">Last 30 days</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Navigation Tabs */}
      <Tabs defaultValue="schedules" className="space-y-4">
        <TabsList>
          <TabsTrigger value="schedules">
            <ClipboardList className="h-4 w-4 mr-2" />
            Schedules
          </TabsTrigger>
          <TabsTrigger value="inspections" onClick={() => router.push('/property-manager/compliance/inspections')}>
            <Calendar className="h-4 w-4 mr-2" />
            Inspections
          </TabsTrigger>
          <TabsTrigger value="violations" onClick={() => router.push('/property-manager/compliance/violations')}>
            <FileWarning className="h-4 w-4 mr-2" />
            Violations
          </TabsTrigger>
          <TabsTrigger value="requirements" onClick={() => router.push('/property-manager/compliance/requirements')}>
            <ShieldCheck className="h-4 w-4 mr-2" />
            Requirements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="schedules" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Status Filter */}
                <Select value={selectedStatus} onValueChange={(value) => { setSelectedStatus(value); setPage(0); }}>
                  <SelectTrigger className="w-[180px]" data-testid="schedule-status-filter">
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
                  <SelectTrigger className="w-[200px]" data-testid="schedule-category-filter">
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
            </CardContent>
          </Card>

          {/* Schedules Table */}
          <Card>
            <CardContent className="p-0">
              {schedulesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : schedules.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <ClipboardList className="h-12 w-12 mb-4" />
                  <h3 className="text-lg font-semibold mb-1">No schedules found</h3>
                  <p className="text-sm">
                    {selectedStatus !== 'all' || selectedCategory !== 'all'
                      ? 'Try adjusting your filters'
                      : 'No compliance schedules have been created yet'}
                  </p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[140px]">Schedule #</TableHead>
                        <TableHead>Property</TableHead>
                        <TableHead>Requirement</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
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
                          <TableCell className="font-mono text-sm">
                            <Link
                              href={`/property-manager/compliance/schedules/${schedule.id}`}
                              className="hover:underline text-primary"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {schedule.requirementNumber || schedule.id.substring(0, 8)}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <span>{schedule.propertyName}</span>
                            </div>
                          </TableCell>
                          <TableCell>{schedule.requirementName}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {getCategoryLabel(schedule.category)}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(schedule.dueDate)}</TableCell>
                          <TableCell>{getStatusBadge(schedule.status)}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon">
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
