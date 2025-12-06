/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

/**
 * Lead Detail Page
 * SCP-2025-12-06: Simplified design with single quotation workflow
 * - Removed stats cards row (Documents, Quotation, Days in Pipeline, Activities)
 * - Removed Documents tab (documents managed in quotation workflow)
 * - Removed Recent Activity section (History tab serves this purpose)
 * - Removed Identity Details (captured in quotation workflow)
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/auth-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import {
  getLeadById,
  getLeadHistory,
  deleteLead,
  calculateDaysInPipeline,
} from '@/services/leads.service';
import { getQuotationsByLeadId, convertToTenant } from '@/services/quotations.service';
import type { Lead, LeadHistory, Quotation } from '@/types';
import { cn } from '@/lib/utils';
import {
  Mail,
  Phone,
  Building,
  Calendar,
  ArrowLeft,
  Plus,
  Trash2,
  Pencil,
  MoreVertical,
  Target,
  Clock,
  Globe,
  Users,
  MessageSquare,
  Send,
  CheckCircle2,
  XCircle,
  UserCheck,
  Sparkles,
  ChevronRight,
  ExternalLink,
  History,
  Receipt,
  ArrowUpRight,
  User,
  StickyNote,
  TrendingUp,
  Eye,
  AlertCircle,
} from 'lucide-react';

const LEAD_STATUS_CONFIG: Record<string, {
  badge: string;
  dot: string;
  icon: React.ReactNode;
  label: string;
  step: number;
}> = {
  // SCP-2025-12-06: Simplified pipeline - 4 statuses
  NEW_LEAD: {
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400 border-blue-200',
    dot: 'bg-blue-500',
    icon: <Sparkles className="h-4 w-4" />,
    label: 'New Lead',
    step: 1,
  },
  QUOTATION_SENT: {
    badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-400 border-purple-200',
    dot: 'bg-purple-500',
    icon: <Send className="h-4 w-4" />,
    label: 'Quotation Sent',
    step: 2,
  },
  CONVERTED: {
    badge: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400 border-green-200',
    dot: 'bg-green-500',
    icon: <UserCheck className="h-4 w-4" />,
    label: 'Converted',
    step: 3,
  },
  LOST: {
    badge: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400 border-red-200',
    dot: 'bg-red-500',
    icon: <XCircle className="h-4 w-4" />,
    label: 'Lost',
    step: 0,
  },
};

const QUOTATION_STATUS_CONFIG: Record<string, {
  badge: string;
  icon: React.ReactNode;
  label: string;
}> = {
  DRAFT: {
    badge: 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-400',
    icon: <Receipt className="h-4 w-4" />,
    label: 'Draft',
  },
  SENT: {
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400',
    icon: <Send className="h-4 w-4" />,
    label: 'Sent',
  },
  ACCEPTED: {
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-400',
    icon: <CheckCircle2 className="h-4 w-4" />,
    label: 'Accepted',
  },
  REJECTED: {
    badge: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400',
    icon: <XCircle className="h-4 w-4" />,
    label: 'Rejected',
  },
  EXPIRED: {
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-400',
    icon: <AlertCircle className="h-4 w-4" />,
    label: 'Expired',
  },
};

const LEAD_SOURCE_CONFIG: Record<string, { icon: React.ReactNode; label: string }> = {
  WEBSITE: { icon: <Globe className="h-4 w-4" />, label: 'Website' },
  REFERRAL: { icon: <Users className="h-4 w-4" />, label: 'Referral' },
  WALK_IN: { icon: <User className="h-4 w-4" />, label: 'Walk-in' },
  PHONE_CALL: { icon: <Phone className="h-4 w-4" />, label: 'Phone Call' },
  SOCIAL_MEDIA: { icon: <MessageSquare className="h-4 w-4" />, label: 'Social Media' },
  OTHER: { icon: <Receipt className="h-4 w-4" />, label: 'Other' },
};

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const leadId = params.id as string;

  const [lead, setLead] = useState<Lead | null>(null);
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [history, setHistory] = useState<LeadHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConverting, setIsConverting] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchLeadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [leadData, quoteData, historyData] = await Promise.allSettled([
        getLeadById(leadId),
        getQuotationsByLeadId(leadId),
        getLeadHistory(leadId),
      ]);

      if (leadData.status === 'fulfilled') {
        setLead(leadData.value);
      } else {
        throw new Error('Failed to load lead details');
      }

      // Only one quotation per lead - get the first one if exists
      if (quoteData.status === 'fulfilled') {
        const quotations = quoteData.value || [];
        setQuotation(quotations.length > 0 ? quotations[0] : null);
      } else {
        setQuotation(null);
      }

      if (historyData.status === 'fulfilled') {
        setHistory(historyData.value || []);
      } else {
        setHistory([]);
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load lead details',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [leadId, toast]);

  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated) {
        fetchLeadData();
      } else {
        router.push('/login');
      }
    }
  }, [leadId, authLoading, isAuthenticated, router, fetchLeadData]);

  const handleDeleteLead = async () => {
    try {
      await deleteLead(leadId);
      toast({
        title: 'Success',
        description: 'Lead deleted successfully',
        variant: 'success',
      });
      router.push('/leads');
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to delete lead',
        variant: 'destructive',
      });
    }
  };

  const handleConvertToTenant = async () => {
    if (!quotation) return;
    try {
      setIsConverting(true);
      const response = await convertToTenant(quotation.id);
      toast({
        title: 'Success',
        description: response.message || 'Lead converted to tenant successfully',
        variant: 'success',
      });
      await fetchLeadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to convert lead to tenant',
        variant: 'destructive',
      });
    } finally {
      setIsConverting(false);
    }
  };

  // Helper functions
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const formatName = (name: string) => {
    return name
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (authLoading || isLoading || !lead) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-96" />
            <Skeleton className="h-96 lg:col-span-2" />
          </div>
        </div>
      </div>
    );
  }

  const statusConfig = LEAD_STATUS_CONFIG[lead.status] || LEAD_STATUS_CONFIG.NEW_LEAD;
  const sourceConfig = LEAD_SOURCE_CONFIG[lead.leadSource] || LEAD_SOURCE_CONFIG.OTHER;
  const daysInPipeline = calculateDaysInPipeline(lead.createdAt);
  // SCP-2025-12-06: Simplified to 3 steps (NEW_LEAD=1, QUOTATION_SENT=2, CONVERTED=3)
  const progressPercent = lead.status === 'LOST' ? 0 : (statusConfig.step / 3) * 100;
  const quotationStatusConfig = quotation ? QUOTATION_STATUS_CONFIG[quotation.status] || QUOTATION_STATUS_CONFIG.DRAFT : null;

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">

          {/* Hero Header */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border shadow-sm">
            <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
            <div className="relative px-8 py-8">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/leads')}
                  className="gap-1 h-8 px-2 -ml-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Leads
                </Button>
                <ChevronRight className="h-4 w-4" />
                <span className="font-medium text-foreground">{lead.leadNumber}</span>
              </div>

              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                {/* Left: Lead Info */}
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold text-2xl ring-4 ring-background shadow-lg">
                    {getInitials(lead.fullName)}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
                        {formatName(lead.fullName)}
                      </h1>
                      <Badge variant="secondary" className={cn("shadow-sm", statusConfig.badge)}>
                        <div className={cn("h-1.5 w-1.5 rounded-full mr-1.5", statusConfig.dot)} />
                        {statusConfig.label}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      <span className="font-mono">{lead.leadNumber}</span>
                      <span className="flex items-center gap-1.5">
                        {sourceConfig.icon}
                        {sourceConfig.label}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        {daysInPipeline} days in pipeline
                      </span>
                    </div>

                    {/* Pipeline Progress */}
                    {lead.status !== 'LOST' && lead.status !== 'CONVERTED' && (
                      <div className="pt-2">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Pipeline Progress</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Progress value={progressPercent} className="h-2 w-48" />
                          <span className="text-xs font-medium">{Math.round(progressPercent)}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/leads/${leadId}/edit`)}
                    className="gap-2"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit Lead
                  </Button>

                  {/* Conditional: Create Quotation or View Quotation */}
                  {!quotation ? (
                    <Button
                      onClick={() => router.push(`/quotations/create?leadId=${leadId}`)}
                      className="gap-2 shadow-lg shadow-primary/20"
                    >
                      <Plus className="h-4 w-4" />
                      Create Quotation
                    </Button>
                  ) : (
                    <Button
                      onClick={() => router.push(`/quotations/${quotation.id}`)}
                      className="gap-2"
                      variant="secondary"
                    >
                      <Eye className="h-4 w-4" />
                      View Quotation
                    </Button>
                  )}

                  <AlertDialog>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-10 w-10">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/leads/${leadId}/edit`)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit Lead
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onSelect={(e) => e.preventDefault()}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Lead
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Lead</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this lead? This action cannot be undone and will remove all associated documents and history.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-red-600 text-white hover:bg-red-700"
                          onClick={handleDeleteLead}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Sidebar */}
            <div className="space-y-6">
              {/* Contact Information */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="text-sm font-medium truncate">{lead.email}</p>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={() => window.open(`mailto:${lead.email}`)}
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Send Email</TooltipContent>
                      </Tooltip>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <p className="text-sm font-medium">{lead.contactNumber}</p>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={() => window.open(`tel:${lead.contactNumber}`)}
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Call</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Lead Information */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    Lead Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    {sourceConfig.icon}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">Lead Source</p>
                      <p className="text-sm font-medium">{sourceConfig.label}</p>
                    </div>
                  </div>

                  {lead.propertyInterest && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Building className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">Property Interest</p>
                        <p className="text-sm font-medium">{lead.propertyInterest}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">Created</p>
                      <p className="text-sm font-medium">
                        {format(new Date(lead.createdAt), 'dd MMM yyyy, HH:mm')}
                      </p>
                    </div>
                  </div>

                  {lead.notes && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 mb-2">
                        <StickyNote className="h-4 w-4 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Notes</p>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {lead.notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right: Main Content Tabs */}
            <div className="lg:col-span-2">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full justify-start h-12 p-1 bg-muted/50 rounded-lg mb-6">
                  <TabsTrigger value="overview" className="flex-1 sm:flex-none gap-2 px-4">
                    <Target className="h-4 w-4" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="history" className="flex-1 sm:flex-none gap-2 px-4">
                    <History className="h-4 w-4" />
                    History
                  </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                  {/* Pipeline Status */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Pipeline Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between gap-2">
                        {Object.entries(LEAD_STATUS_CONFIG)
                          .filter(([key]) => key !== 'LOST')
                          .map(([key, config], index) => {
                            const isActive = lead.status === key;
                            const isPast = config.step < statusConfig.step;
                            const isFuture = config.step > statusConfig.step;

                            return (
                              <div key={key} className="flex-1 relative">
                                <div className="flex flex-col items-center">
                                  <div
                                    className={cn(
                                      "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                                      isActive && "bg-primary border-primary text-primary-foreground",
                                      isPast && "bg-primary/20 border-primary/40 text-primary",
                                      isFuture && "bg-muted border-muted-foreground/20 text-muted-foreground"
                                    )}
                                  >
                                    {config.icon}
                                  </div>
                                  <span
                                    className={cn(
                                      "text-xs mt-2 text-center",
                                      isActive && "font-semibold text-foreground",
                                      (isPast || isFuture) && "text-muted-foreground"
                                    )}
                                  >
                                    {config.label}
                                  </span>
                                </div>
                                {index < 4 && (
                                  <div
                                    className={cn(
                                      "absolute top-5 left-[60%] w-[80%] h-0.5",
                                      isPast ? "bg-primary/40" : "bg-muted"
                                    )}
                                  />
                                )}
                              </div>
                            );
                          })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quotation Card - Single quotation inline display */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-primary" />
                        Quotation
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {!quotation ? (
                        <div className="text-center py-8">
                          <div className="p-4 rounded-full bg-muted inline-flex mb-4">
                            <Receipt className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <h3 className="text-lg font-semibold mb-2">No quotation yet</h3>
                          <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                            Create a quotation to send pricing details and collect identity documents from this lead.
                          </p>
                          <Button
                            onClick={() => router.push(`/quotations/create?leadId=${leadId}`)}
                            className="gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            Create Quotation
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Quotation Summary */}
                          <div
                            className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                            onClick={() => router.push(`/quotations/${quotation.id}`)}
                          >
                            <div className="p-3 rounded-lg bg-primary/10">
                              <Receipt className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold">{quotation.quotationNumber}</h4>
                                <Badge className={cn(quotationStatusConfig?.badge)}>
                                  {quotationStatusConfig?.label}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Building className="h-3.5 w-3.5" />
                                  {quotation.propertyName}
                                </span>
                                {quotation.unitNumber && (
                                  <span>Unit {quotation.unitNumber}</span>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold">
                                AED {quotation.totalFirstPayment?.toLocaleString() || '0'}
                              </p>
                              <p className="text-xs text-muted-foreground">Total Payment</p>
                            </div>
                            <Button variant="ghost" size="icon" className="shrink-0">
                              <ArrowUpRight className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Quotation Details */}
                          <div className="grid grid-cols-2 gap-4 pt-2">
                            <div className="p-3 rounded-lg bg-muted/50">
                              <p className="text-xs text-muted-foreground">Issue Date</p>
                              <p className="text-sm font-medium">
                                {quotation.issueDate
                                  ? format(new Date(quotation.issueDate), 'dd MMM yyyy')
                                  : '-'}
                              </p>
                            </div>
                            <div className="p-3 rounded-lg bg-muted/50">
                              <p className="text-xs text-muted-foreground">Valid Until</p>
                              <p className="text-sm font-medium">
                                {quotation.validityDate
                                  ? format(new Date(quotation.validityDate), 'dd MMM yyyy')
                                  : '-'}
                              </p>
                            </div>
                            <div className="p-3 rounded-lg bg-muted/50">
                              <p className="text-xs text-muted-foreground">Base Rent</p>
                              <p className="text-sm font-medium">
                                AED {quotation.baseRent?.toLocaleString() || '0'}
                              </p>
                            </div>
                            <div className="p-3 rounded-lg bg-muted/50">
                              <p className="text-xs text-muted-foreground">Security Deposit</p>
                              <p className="text-sm font-medium">
                                AED {quotation.securityDeposit?.toLocaleString() || '0'}
                              </p>
                            </div>
                          </div>

                          {/* Actions based on quotation status */}
                          <div className="flex items-center gap-3 pt-2">
                            <Button
                              variant="outline"
                              onClick={() => router.push(`/quotations/${quotation.id}`)}
                              className="gap-2 flex-1"
                            >
                              <Eye className="h-4 w-4" />
                              View Details
                            </Button>
                            {quotation.status === 'ACCEPTED' && (
                              <Button
                                onClick={handleConvertToTenant}
                                disabled={isConverting}
                                className="gap-2 flex-1"
                              >
                                <UserCheck className="h-4 w-4" />
                                {isConverting ? 'Converting...' : 'Convert to Tenant'}
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* History Tab */}
                <TabsContent value="history" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Activity Timeline</h3>
                  </div>

                  {history.length === 0 ? (
                    <Card className="border-dashed border-2">
                      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="p-4 rounded-full bg-muted mb-4">
                          <History className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No activity yet</h3>
                        <p className="text-muted-foreground max-w-sm">
                          Activity will appear here as you interact with this lead.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="p-6">
                        <div className="relative">
                          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-muted" />
                          <div className="space-y-6">
                            {history.map((item, index) => (
                              <div key={item.id} className="relative pl-10">
                                <div
                                  className={cn(
                                    "absolute left-0 w-8 h-8 rounded-full flex items-center justify-center border-2 bg-background",
                                    index === 0 ? "border-primary" : "border-muted"
                                  )}
                                >
                                  <Calendar
                                    className={cn(
                                      "h-4 w-4",
                                      index === 0 ? "text-primary" : "text-muted-foreground"
                                    )}
                                  />
                                </div>
                                <div className="p-4 rounded-lg border bg-card">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="font-semibold text-sm">
                                      {item.eventType.replace(/_/g, ' ')}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {format(new Date(item.createdAt), 'dd MMM yyyy, HH:mm')}
                                    </span>
                                  </div>
                                  {item.eventData && Object.keys(item.eventData).length > 0 && (
                                    <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded mt-2 font-mono">
                                      {Object.entries(item.eventData).map(([key, value]) => (
                                        <div key={key}>
                                          <span className="text-muted-foreground">{key}: </span>
                                          <span>{String(value)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
