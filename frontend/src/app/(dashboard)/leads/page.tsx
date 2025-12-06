'use client';

/**
 * Leads Management Page
 * Modern design with KPI dashboard, status tabs, and grid/list views
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { debounce } from 'lodash';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
import { useToast } from '@/hooks/use-toast';
import { getLeads, deleteLead, calculateDaysInPipeline } from '@/services/leads.service';
import type { Lead, LeadStatus, LeadSource } from '@/types/leads';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  Plus,
  Search,
  Users,
  UserPlus,
  UserCheck,
  UserX,
  Clock,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  LayoutGrid,
  List,
  Filter,
  RefreshCw,
  Mail,
  Phone,
  Calendar,
  TrendingUp,
  Activity,
  Globe,
  MessageSquare,
  Target,
  Zap,
  ArrowUpRight,
  Sparkles,
  CheckCircle2,
  XCircle,
  Send,
  FileText,
} from 'lucide-react';

type ViewMode = 'grid' | 'list';

/**
 * Lead status styles
 * SCP-2025-12-06: Simplified from 6 statuses to 4 statuses
 * NEW_LEAD → QUOTATION_SENT → CONVERTED → LOST
 */
const LEAD_STATUS_STYLES: Record<LeadStatus, { badge: string; dot: string; icon: React.ReactNode }> = {
  NEW_LEAD: {
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400 border-blue-200',
    dot: 'bg-blue-500',
    icon: <Sparkles className="h-3.5 w-3.5" />,
  },
  QUOTATION_SENT: {
    badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-400 border-purple-200',
    dot: 'bg-purple-500',
    icon: <Send className="h-3.5 w-3.5" />,
  },
  CONVERTED: {
    badge: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400 border-green-200',
    dot: 'bg-green-500',
    icon: <UserCheck className="h-3.5 w-3.5" />,
  },
  LOST: {
    badge: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400 border-red-200',
    dot: 'bg-red-500',
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
};

const LEAD_SOURCE_ICONS: Record<LeadSource, React.ReactNode> = {
  WEBSITE: <Globe className="h-3.5 w-3.5" />,
  REFERRAL: <Users className="h-3.5 w-3.5" />,
  WALK_IN: <UserPlus className="h-3.5 w-3.5" />,
  PHONE_CALL: <Phone className="h-3.5 w-3.5" />,
  SOCIAL_MEDIA: <MessageSquare className="h-3.5 w-3.5" />,
  OTHER: <FileText className="h-3.5 w-3.5" />,
};

export default function LeadsPage() {
  const router = useRouter();
  const { toast } = useToast();

  // State
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  // Debounced search
  const debouncedSearch = useMemo(
    () => debounce((value: string) => {
      setSearchTerm(value);
    }, 300),
    []
  );

  // Fetch leads
  const fetchLeads = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) {
        setIsInitialLoading(true);
      } else {
        setIsFiltering(true);
      }

      const response = await getLeads({ page: 0, size: 1000 });
      setLeads(response.data.content);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load leads. Please try again.',
        variant: 'destructive',
      });
      setLeads([]);
    } finally {
      setIsInitialLoading(false);
      setIsFiltering(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchLeads(true);
  }, [fetchLeads]);

  // Cleanup debounce
  useEffect(() => {
    return () => debouncedSearch.cancel();
  }, [debouncedSearch]);

  // Filter leads
  const filteredLeads = useMemo(() => {
    let result = leads;

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(l => l.status === statusFilter);
    }

    // Source filter
    if (sourceFilter !== 'all') {
      result = result.filter(l => l.leadSource === sourceFilter);
    }

    // Search filter
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase().trim();
      result = result.filter(l =>
        l.fullName?.toLowerCase().includes(query) ||
        l.email?.toLowerCase().includes(query) ||
        l.contactNumber?.includes(query) ||
        l.leadNumber?.toLowerCase().includes(query) ||
        l.emiratesId?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [leads, statusFilter, sourceFilter, searchTerm]);

  // Handlers
  const handleCreateLead = () => {
    router.push('/leads/create');
  };

  const handleDeleteLead = async (leadId: string) => {
    try {
      await deleteLead(leadId);
      toast({
        title: 'Success',
        description: 'Lead deleted successfully',
        variant: 'success',
      });
      fetchLeads();
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to delete lead',
        variant: 'destructive',
      });
    }
  };

  // Calculate stats
  const stats = useMemo(() => {
    const total = leads.length;
    // SCP-2025-12-06: Simplified pipeline - 4 statuses
    const newLeads = leads.filter(l => l.status === 'NEW_LEAD').length;
    const quotationSent = leads.filter(l => l.status === 'QUOTATION_SENT').length;
    const converted = leads.filter(l => l.status === 'CONVERTED').length;
    const lost = leads.filter(l => l.status === 'LOST').length;

    const conversionRate = total > 0 ? (converted / total) * 100 : 0;
    const inPipeline = newLeads + quotationSent;

    // Average days in pipeline for active leads
    const activeLeads = leads.filter(l => !['CONVERTED', 'LOST'].includes(l.status));
    const avgDaysInPipeline = activeLeads.length > 0
      ? activeLeads.reduce((sum, l) => sum + calculateDaysInPipeline(l.createdAt), 0) / activeLeads.length
      : 0;

    return {
      total,
      newLeads,
      quotationSent,
      converted,
      lost,
      conversionRate,
      inPipeline,
      avgDaysInPipeline,
    };
  }, [leads]);

  // Format date helper
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd MMM yyyy');
    } catch {
      return '-';
    }
  };

  // Format name helper
  const formatName = (name: string) => {
    return name
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">

          {/* Hero Header */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border shadow-sm">
            <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
            <div className="relative px-8 py-10">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-primary/10 ring-1 ring-primary/20">
                      <Target className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold tracking-tight">Leads Pipeline</h1>
                      <p className="text-muted-foreground">
                        Track potential tenants and manage your sales funnel
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <Button
                    onClick={handleCreateLead}
                    size="lg"
                    className="gap-2 shadow-lg shadow-primary/20"
                    data-testid="btn-create-lead"
                  >
                    <Plus className="h-5 w-5" />
                    Add Lead
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* KPI Dashboard */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Leads */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -translate-y-6 translate-x-6" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Leads
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isInitialLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <>
                    <div className="text-3xl font-bold">{stats.total}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400">
                        {stats.inPipeline} in pipeline
                      </Badge>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Conversion Rate */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full -translate-y-6 translate-x-6" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Conversion Rate
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                {isInitialLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <>
                    <div className="text-3xl font-bold text-emerald-600">
                      {stats.conversionRate.toFixed(1)}%
                    </div>
                    <div className="mt-2">
                      <Progress value={stats.conversionRate} className="h-1.5" />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* New Leads */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full -translate-y-6 translate-x-6" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  New Leads
                </CardTitle>
                <Zap className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                {isInitialLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <>
                    <div className="text-3xl font-bold text-blue-600">{stats.newLeads}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Awaiting first contact
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Pipeline Status */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/5 rounded-full -translate-y-6 translate-x-6" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pipeline Status
                </CardTitle>
                <Activity className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                {isInitialLoading ? (
                  <Skeleton className="h-8 w-full" />
                ) : (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-950/30">
                          <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                          <span className="text-sm font-semibold text-blue-600">{stats.newLeads}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>New</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-yellow-50 dark:bg-yellow-950/30">
                          <MessageSquare className="h-3.5 w-3.5 text-yellow-600" />
                          <span className="text-sm font-semibold text-yellow-600">{stats.contacted}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>Contacted</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-purple-50 dark:bg-purple-950/30">
                          <Send className="h-3.5 w-3.5 text-purple-600" />
                          <span className="text-sm font-semibold text-purple-600">{stats.quotationSent}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>Quotation Sent</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-green-50 dark:bg-green-950/30">
                          <UserCheck className="h-3.5 w-3.5 text-green-600" />
                          <span className="text-sm font-semibold text-green-600">{stats.converted}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>Converted</TooltipContent>
                    </Tooltip>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Filters & Controls */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Status Tabs */}
                <Tabs
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                  className="w-full lg:w-auto"
                >
                  <TabsList className="grid w-full lg:w-auto grid-cols-4 lg:grid-cols-7 h-10">
                    <TabsTrigger value="all" className="gap-1.5 px-2 text-xs lg:text-sm">
                      <Filter className="h-3.5 w-3.5" />
                      All
                    </TabsTrigger>
                    {/* SCP-2025-12-06: Simplified pipeline - 4 statuses */}
                    <TabsTrigger value="NEW_LEAD" className="gap-1.5 px-2 text-xs lg:text-sm">
                      <Sparkles className="h-3.5 w-3.5" />
                      New
                    </TabsTrigger>
                    <TabsTrigger value="QUOTATION_SENT" className="gap-1.5 px-2 text-xs lg:text-sm">
                      <Send className="h-3.5 w-3.5" />
                      Quoted
                    </TabsTrigger>
                    <TabsTrigger value="CONVERTED" className="gap-1.5 px-2 text-xs lg:text-sm">
                      <UserCheck className="h-3.5 w-3.5" />
                      Converted
                    </TabsTrigger>
                    <TabsTrigger value="LOST" className="gap-1.5 px-2 text-xs lg:text-sm">
                      <XCircle className="h-3.5 w-3.5" />
                      Lost
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="flex-1 flex flex-col sm:flex-row gap-3">
                  {/* Source Filter */}
                  <Select value={sourceFilter} onValueChange={setSourceFilter}>
                    <SelectTrigger className="w-full sm:w-[180px] h-10">
                      <SelectValue placeholder="All Sources" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sources</SelectItem>
                      <SelectItem value="WEBSITE">Website</SelectItem>
                      <SelectItem value="REFERRAL">Referral</SelectItem>
                      <SelectItem value="WALK_IN">Walk-in</SelectItem>
                      <SelectItem value="PHONE_CALL">Phone Call</SelectItem>
                      <SelectItem value="SOCIAL_MEDIA">Social Media</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Search */}
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search leads..."
                      defaultValue={searchTerm}
                      onChange={(e) => debouncedSearch(e.target.value)}
                      className="pl-9 h-10"
                    />
                  </div>

                  {/* View Toggle */}
                  <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
                    <Button
                      variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="h-8 px-3"
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="h-8 px-3"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Header */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {isInitialLoading ? (
                <Skeleton className="h-4 w-32" />
              ) : (
                `${filteredLeads.length} ${filteredLeads.length === 1 ? 'lead' : 'leads'} found`
              )}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchLeads()}
              className="gap-2"
              disabled={isFiltering}
            >
              <RefreshCw className={cn("h-4 w-4", isFiltering && "animate-spin")} />
              Refresh
            </Button>
          </div>

          {/* Content Area */}
          {isInitialLoading ? (
            <div className={cn(
              "grid gap-6",
              viewMode === 'grid'
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                : "grid-cols-1"
            )}>
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className={viewMode === 'grid' ? "h-56" : "h-24"} />
              ))}
            </div>
          ) : filteredLeads.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="p-4 rounded-full bg-muted mb-4">
                  <Target className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No leads found</h3>
                <p className="text-muted-foreground max-w-sm mb-6">
                  {searchTerm || statusFilter !== 'all' || sourceFilter !== 'all'
                    ? "Try adjusting your search or filters to find what you're looking for."
                    : "Get started by adding your first lead to the pipeline."}
                </p>
                {!searchTerm && statusFilter === 'all' && sourceFilter === 'all' && (
                  <Button onClick={handleCreateLead} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add First Lead
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className={cn(
              "transition-opacity duration-200",
              isFiltering ? "opacity-60" : "opacity-100"
            )}>
              {/* Grid View */}
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredLeads.map((lead) => {
                    const statusStyles = LEAD_STATUS_STYLES[lead.status];
                    const daysInPipeline = calculateDaysInPipeline(lead.createdAt);

                    return (
                      <Card
                        key={lead.id}
                        className="overflow-hidden group hover:shadow-lg transition-all duration-300 flex flex-col cursor-pointer"
                        onClick={() => router.push(`/leads/${lead.id}`)}
                      >
                        {/* Header */}
                        <div className="relative h-24 bg-gradient-to-br from-primary/10 via-primary/5 to-muted">
                          {/* Status Badge */}
                          <div className="absolute top-3 left-3">
                            <Badge variant="secondary" className={cn("shadow-sm", statusStyles.badge)}>
                              <div className={cn("h-1.5 w-1.5 rounded-full mr-1.5", statusStyles.dot)} />
                              {lead.status.replace('_', ' ')}
                            </Badge>
                          </div>

                          {/* Days in Pipeline */}
                          <div className="absolute top-3 right-12">
                            <Badge variant="secondary" className="bg-muted/80 backdrop-blur-sm shadow-sm">
                              <Clock className="h-3 w-3 mr-1" />
                              {daysInPipeline}d
                            </Badge>
                          </div>

                          {/* Actions Menu */}
                          <div className="absolute top-3 right-3" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="secondary"
                                  size="icon"
                                  className="h-8 w-8 bg-background/90 backdrop-blur-sm shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => router.push(`/leads/${lead.id}`)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push(`/leads/${lead.id}/edit`)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit Lead
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem
                                      className="text-red-600 focus:text-red-600"
                                      onSelect={(e) => e.preventDefault()}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete Lead
                                    </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Lead</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete this lead? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        className="bg-red-600 text-white hover:bg-red-700"
                                        onClick={() => handleDeleteLead(lead.id)}
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          {/* Avatar */}
                          <div className="absolute -bottom-8 left-4">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xl ring-4 ring-background shadow-lg">
                              {lead.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </div>
                          </div>
                        </div>

                        {/* Content */}
                        <CardContent className="p-4 pt-10 flex-1 flex flex-col">
                          <div className="mb-1">
                            <h3 className="font-semibold text-lg truncate" title={lead.fullName}>
                              {formatName(lead.fullName)}
                            </h3>
                            <p className="text-xs text-muted-foreground font-mono">
                              {lead.leadNumber || '-'}
                            </p>
                          </div>

                          <div className="space-y-1.5 mt-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2 truncate">
                              <Mail className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{lead.email || '-'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="h-3.5 w-3.5 shrink-0" />
                              <span>{lead.contactNumber || '-'}</span>
                            </div>
                          </div>

                          <div className="mt-auto pt-3 border-t flex items-center justify-between text-sm">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              {LEAD_SOURCE_ICONS[lead.leadSource]}
                              <span className="capitalize">{lead.leadSource?.replace('_', ' ').toLowerCase()}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(lead.createdAt)}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                /* List View */
                <div className="space-y-3">
                  {filteredLeads.map((lead) => {
                    const statusStyles = LEAD_STATUS_STYLES[lead.status];
                    const daysInPipeline = calculateDaysInPipeline(lead.createdAt);

                    return (
                      <Card
                        key={lead.id}
                        className="overflow-hidden hover:shadow-md transition-all cursor-pointer"
                        onClick={() => router.push(`/leads/${lead.id}`)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            {/* Avatar */}
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-lg shrink-0">
                              {lead.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h3 className="font-semibold truncate">
                                  {formatName(lead.fullName)}
                                </h3>
                                <Badge variant="secondary" className={cn("text-xs shrink-0", statusStyles.badge)}>
                                  {lead.status.replace('_', ' ')}
                                </Badge>
                                <Badge variant="secondary" className="text-xs shrink-0 bg-muted">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {daysInPipeline}d in pipeline
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground font-mono mb-2">
                                {lead.leadNumber || '-'}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                                <span className="flex items-center gap-1 truncate">
                                  <Mail className="h-3.5 w-3.5 shrink-0" />
                                  {lead.email || '-'}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3.5 w-3.5" />
                                  {lead.contactNumber || '-'}
                                </span>
                                <span className="flex items-center gap-1.5">
                                  {LEAD_SOURCE_ICONS[lead.leadSource]}
                                  <span className="capitalize">{lead.leadSource?.replace('_', ' ').toLowerCase()}</span>
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3.5 w-3.5" />
                                  {formatDate(lead.createdAt)}
                                </span>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => router.push(`/leads/${lead.id}`)}
                                className="h-9 w-9"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => router.push(`/leads/${lead.id}/edit`)}
                                className="h-9 w-9"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Lead</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this lead? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-red-600 text-white hover:bg-red-700"
                                      onClick={() => handleDeleteLead(lead.id)}
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
