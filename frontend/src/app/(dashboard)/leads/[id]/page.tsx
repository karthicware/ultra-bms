'use client';

/**
 * Lead Detail Page - Redesigned
 * Premium editorial design with refined visual hierarchy
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/auth-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
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
import { getQuotationsByLeadId } from '@/services/quotations.service';
import type { Lead, LeadHistory, Quotation } from '@/types';
import { cn } from '@/lib/utils';
import {
  Mail,
  Phone,
  Building,
  Calendar,
  Plus,
  Trash2,
  Pencil,
  MoreVertical,
  Clock,
  Globe,
  Users,
  MessageSquare,
  Send,
  CheckCircle2,
  XCircle,
  UserCheck,
  Sparkles,
  ExternalLink,
  Receipt,
  ArrowUpRight,
  User,
  StickyNote,
  Eye,
  AlertCircle,
  FileText,
  MapPin,
  ChevronRight,
} from 'lucide-react';
import { PageBackButton } from '@/components/common/PageBackButton';

const LEAD_STATUS_CONFIG: Record<string, {
  badge: string;
  dot: string;
  bg: string;
  icon: React.ReactNode;
  label: string;
  step: number;
}> = {
  NEW_LEAD: {
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400 border-blue-200',
    dot: 'bg-blue-500',
    bg: 'from-blue-500/20 to-blue-500/5',
    icon: <Sparkles className="h-4 w-4" />,
    label: 'New Lead',
    step: 1,
  },
  QUOTATION_SENT: {
    badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-400 border-purple-200',
    dot: 'bg-purple-500',
    bg: 'from-purple-500/20 to-purple-500/5',
    icon: <Send className="h-4 w-4" />,
    label: 'Quotation Sent',
    step: 2,
  },
  CONVERTED: {
    badge: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400 border-green-200',
    dot: 'bg-green-500',
    bg: 'from-green-500/20 to-green-500/5',
    icon: <UserCheck className="h-4 w-4" />,
    label: 'Converted',
    step: 3,
  },
  LOST: {
    badge: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400 border-red-200',
    dot: 'bg-red-500',
    bg: 'from-red-500/20 to-red-500/5',
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

// Pipeline Step Component
function PipelineStep({
  label,
  icon,
  isActive,
  isCompleted,
  isLast,
}: {
  step: number;
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  isCompleted: boolean;
  isLast: boolean;
}) {
  return (
    <div className="flex items-center">
      <div className="flex flex-col items-center">
        <div
          className={cn(
            'relative flex h-12 w-12 items-center justify-center rounded-2xl border-2 transition-all duration-500',
            isCompleted && 'border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20',
            isActive && 'border-primary bg-primary/10 text-primary scale-105',
            !isCompleted && !isActive && 'border-muted-foreground/20 bg-muted/30 text-muted-foreground/50'
          )}
        >
          {isCompleted ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            icon
          )}
          {isActive && (
            <span className="absolute -inset-1 rounded-2xl border-2 border-primary/30 animate-pulse" />
          )}
        </div>
        <span
          className={cn(
            'mt-2 text-xs font-medium text-center max-w-[80px]',
            isActive && 'text-primary font-semibold',
            isCompleted && 'text-foreground',
            !isActive && !isCompleted && 'text-muted-foreground'
          )}
        >
          {label}
        </span>
      </div>
      {!isLast && (
        <div
          className={cn(
            'mx-3 h-0.5 w-12 lg:w-20 rounded-full transition-all duration-500',
            isCompleted ? 'bg-primary' : 'bg-muted-foreground/20'
          )}
        />
      )}
    </div>
  );
}

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
  const [showHistory, setShowHistory] = useState(false);

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

  const handleConvertToTenant = () => {
    if (!quotation) return;
    router.push(`/tenants/create?fromLead=${leadId}&fromQuotation=${quotation.id}`);
  };

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
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
        <div className="relative border-b bg-gradient-to-br from-primary/[0.03] via-background to-primary/[0.05]">
          <div className="container mx-auto px-4 py-8 max-w-7xl">
            <div className="flex items-center gap-4 mb-6">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-6 w-32" />
            </div>
            <div className="flex items-start gap-6">
              <Skeleton className="h-20 w-20 rounded-2xl" />
              <div className="space-y-3 flex-1">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-5 w-48" />
              </div>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 space-y-6">
              <Skeleton className="h-64" />
              <Skeleton className="h-48" />
            </div>
            <div className="lg:col-span-8">
              <Skeleton className="h-96" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statusConfig = LEAD_STATUS_CONFIG[lead.status] || LEAD_STATUS_CONFIG.NEW_LEAD;
  const sourceConfig = LEAD_SOURCE_CONFIG[lead.leadSource] || LEAD_SOURCE_CONFIG.OTHER;
  const daysInPipeline = calculateDaysInPipeline(lead.createdAt);
  const quotationStatusConfig = quotation ? QUOTATION_STATUS_CONFIG[quotation.status] || QUOTATION_STATUS_CONFIG.DRAFT : null;

  const pipelineSteps = [
    { step: 1, label: 'New Lead', icon: <Sparkles className="h-5 w-5" />, status: 'NEW_LEAD' },
    { step: 2, label: 'Quotation Sent', icon: <Send className="h-5 w-5" />, status: 'QUOTATION_SENT' },
    { step: 3, label: 'Converted', icon: <UserCheck className="h-5 w-5" />, status: 'CONVERTED' },
  ];

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
        {/* Hero Header */}
        <div className="relative overflow-hidden border-b bg-gradient-to-br from-primary/[0.03] via-background to-primary/[0.05]">
          {/* Decorative elements */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+CjxyZWN0IHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0ibm9uZSIvPgo8Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIxIiBmaWxsPSJyZ2JhKDAsIDAsIDAsIDAuMDIpIi8+Cjwvc3ZnPg==')] opacity-60" />
          <div className="absolute -right-32 -top-32 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -left-20 bottom-0 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />

          <div className="relative container mx-auto px-4 py-6 max-w-7xl">
            {/* Top Row: Back + Breadcrumb */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3 text-sm">
                <PageBackButton href="/leads" aria-label="Back to leads" />
                <span className="text-muted-foreground">Leads</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-foreground">{lead.leadNumber}</span>
              </div>

              {/* Quick Actions Pill */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/leads/${leadId}/edit`)}
                  className="gap-2 rounded-full"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Edit</span>
                </Button>

                <AlertDialog>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
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
                        Are you sure you want to delete this lead? This action cannot be undone.
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

            {/* Main Header Content */}
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              {/* Left: Lead Identity */}
              <div className="flex items-start gap-5">
                {/* Avatar */}
                <div className={cn(
                  'relative flex h-20 w-20 items-center justify-center rounded-2xl font-bold text-2xl ring-4 ring-background shadow-xl',
                  'bg-gradient-to-br text-white',
                  statusConfig.bg
                )}>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary to-primary/80" />
                  <span className="relative z-10">{getInitials(lead.fullName)}</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
                      {formatName(lead.fullName)}
                    </h1>
                    <Badge variant="secondary" className={cn('shadow-sm font-medium', statusConfig.badge)}>
                      <div className={cn('h-1.5 w-1.5 rounded-full mr-1.5', statusConfig.dot)} />
                      {statusConfig.label}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                    <span className="font-mono bg-muted/50 px-2 py-0.5 rounded">{lead.leadNumber}</span>
                    <span className="flex items-center gap-1.5">
                      {sourceConfig.icon}
                      {sourceConfig.label}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      {daysInPipeline} days
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Primary Action */}
              <div className="flex items-center gap-3">
                {!quotation ? (
                  <Button
                    onClick={() => router.push(`/quotations/create?leadId=${leadId}`)}
                    size="lg"
                    className="gap-2 shadow-lg shadow-primary/20 rounded-xl"
                  >
                    <Plus className="h-4 w-4" />
                    Create Quotation
                  </Button>
                ) : quotation.status === 'SENT' ? (
                  <Button
                    onClick={handleConvertToTenant}
                    size="lg"
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 rounded-xl"
                  >
                    <UserCheck className="h-4 w-4" />
                    Convert to Tenant
                  </Button>
                ) : (
                  <Button
                    onClick={() => router.push(`/quotations/${quotation.id}`)}
                    size="lg"
                    variant="secondary"
                    className="gap-2 rounded-xl"
                  >
                    <Eye className="h-4 w-4" />
                    View Quotation
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Sidebar */}
            <div className="lg:col-span-4 space-y-6">
              {/* Contact Card */}
              <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b bg-muted/30">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    Contact Information
                  </h3>
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-4 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors group">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background shadow-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Email</p>
                      <p className="text-sm font-medium truncate">{lead.email}</p>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => window.open(`mailto:${lead.email}`)}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Send Email</TooltipContent>
                    </Tooltip>
                  </div>

                  <div className="flex items-center gap-4 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors group">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background shadow-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Phone</p>
                      <p className="text-sm font-medium">{lead.contactNumber}</p>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => window.open(`tel:${lead.contactNumber}`)}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Call</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>

              {/* Lead Details Card */}
              <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b bg-muted/30">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Lead Details
                  </h3>
                </div>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Source</p>
                      <div className="flex items-center gap-2">
                        {sourceConfig.icon}
                        <span className="text-sm font-medium">{sourceConfig.label}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Created</p>
                      <p className="text-sm font-medium">
                        {format(new Date(lead.createdAt), 'dd MMM yyyy')}
                      </p>
                    </div>
                  </div>

                  {lead.propertyInterest && (
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Property Interest</p>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{lead.propertyInterest}</span>
                      </div>
                    </div>
                  )}

                  {lead.notes && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2 flex items-center gap-1.5">
                          <StickyNote className="h-3.5 w-3.5" />
                          Notes
                        </p>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                          {lead.notes}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Activity Toggle */}
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="w-full rounded-2xl border bg-card p-4 hover:bg-muted/30 transition-colors text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Activity History</p>
                      <p className="text-xs text-muted-foreground">{history.length} events recorded</p>
                    </div>
                  </div>
                  <ChevronRight className={cn(
                    'h-5 w-5 text-muted-foreground transition-transform',
                    showHistory && 'rotate-90'
                  )} />
                </div>
              </button>
            </div>

            {/* Right: Main Content */}
            <div className="lg:col-span-8 space-y-6">
              {/* Pipeline Progress */}
              {lead.status !== 'LOST' && (
                <div className="rounded-2xl border bg-card p-6 shadow-sm">
                  <h3 className="font-semibold text-sm mb-6 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Pipeline Progress
                  </h3>
                  <div className="flex justify-center">
                    {pipelineSteps.map((step, index) => (
                      <PipelineStep
                        key={step.step}
                        step={step.step}
                        label={step.label}
                        icon={step.icon}
                        isActive={lead.status === step.status}
                        isCompleted={statusConfig.step > step.step}
                        isLast={index === pipelineSteps.length - 1}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Lost Status Banner */}
              {lead.status === 'LOST' && (
                <div className="rounded-2xl border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900 p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-900/50">
                      <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-red-900 dark:text-red-100">Lead Marked as Lost</h3>
                      <p className="text-sm text-red-700 dark:text-red-300">This lead has been closed and marked as lost.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Quotation Section */}
              <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b bg-muted/30 flex items-center justify-between">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-primary" />
                    Quotation
                  </h3>
                  {quotation && (
                    <Badge className={cn(quotationStatusConfig?.badge)}>
                      {quotationStatusConfig?.label}
                    </Badge>
                  )}
                </div>

                {!quotation ? (
                  <div className="p-8 text-center">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 mb-4">
                      <Receipt className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h4 className="font-semibold mb-2">No quotation yet</h4>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
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
                  <div className="p-6">
                    {/* Quotation Summary */}
                    <div
                      className="p-5 rounded-xl border bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer"
                      onClick={() => router.push(`/quotations/${quotation.id}`)}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                          <Receipt className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{quotation.quotationNumber}</h4>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5" />
                              {quotation.propertyName}
                            </span>
                            {quotation.unitNumber && (
                              <span className="flex items-center gap-1.5">
                                <Building className="h-3.5 w-3.5" />
                                Unit {quotation.unitNumber}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">
                            AED {quotation.totalFirstPayment?.toLocaleString() || '0'}
                          </p>
                          <p className="text-xs text-muted-foreground">Total First Payment</p>
                        </div>
                        <Button variant="ghost" size="icon" className="shrink-0 rounded-xl">
                          <ArrowUpRight className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Quick Stats */}
                      <div className="grid grid-cols-4 gap-4 mt-5 pt-5 border-t">
                        <div>
                          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Issue Date</p>
                          <p className="text-sm font-semibold mt-0.5">
                            {quotation.issueDate ? format(new Date(quotation.issueDate), 'dd MMM') : '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Valid Until</p>
                          <p className="text-sm font-semibold mt-0.5">
                            {quotation.validityDate ? format(new Date(quotation.validityDate), 'dd MMM') : '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Annual Rent</p>
                          <p className="text-sm font-semibold mt-0.5">
                            AED {quotation.yearlyRentAmount?.toLocaleString() || quotation.baseRent?.toLocaleString() || '0'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Deposit</p>
                          <p className="text-sm font-semibold mt-0.5">
                            AED {quotation.securityDeposit?.toLocaleString() || '0'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Convert CTA */}
                    {quotation.status === 'SENT' && (
                      <div className="mt-5 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/50">
                              <UserCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                              <p className="font-semibold text-emerald-900 dark:text-emerald-100">Ready to Convert</p>
                              <p className="text-sm text-emerald-700 dark:text-emerald-300">Quotation sent. Convert this lead to a tenant.</p>
                            </div>
                          </div>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConvertToTenant();
                            }}
                            className="gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20"
                          >
                            <UserCheck className="h-4 w-4" />
                            Convert
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Activity History (Collapsible) */}
              {showHistory && (
                <div className="rounded-2xl border bg-card overflow-hidden shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
                  {/* Header with gradient accent */}
                  <div className="relative px-6 py-4 border-b overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5" />
                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                          <Calendar className="h-4.5 w-4.5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm">Activity Timeline</h3>
                          <p className="text-[11px] text-muted-foreground">Track all lead interactions</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full">
                          {history.length} {history.length === 1 ? 'event' : 'events'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {history.length === 0 ? (
                    <div className="p-12 text-center">
                      <div className="relative inline-flex">
                        <div className="absolute inset-0 rounded-2xl bg-primary/10 blur-xl" />
                        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-muted/80 to-muted/40 border">
                          <Calendar className="h-7 w-7 text-muted-foreground" />
                        </div>
                      </div>
                      <h4 className="mt-4 font-semibold text-foreground">No activity yet</h4>
                      <p className="mt-1 text-sm text-muted-foreground max-w-[240px] mx-auto">
                        Activity will appear here as you interact with this lead
                      </p>
                    </div>
                  ) : (
                    <div className="p-6">
                      <div className="relative">
                        {/* Animated gradient timeline line */}
                        <div className="absolute left-[18px] top-2 bottom-2 w-0.5 rounded-full bg-gradient-to-b from-primary via-primary/50 to-muted" />

                        <div className="space-y-1">
                          {history.map((item, index) => {
                            // Event type specific styling
                            const eventConfig: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
                              CREATED: { icon: <Sparkles className="h-3.5 w-3.5" />, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/50' },
                              STATUS_CHANGED: { icon: <CheckCircle2 className="h-3.5 w-3.5" />, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/50' },
                              QUOTATION_CREATED: { icon: <Receipt className="h-3.5 w-3.5" />, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/50' },
                              QUOTATION_SENT: { icon: <Send className="h-3.5 w-3.5" />, color: 'text-indigo-600', bg: 'bg-indigo-100 dark:bg-indigo-900/50' },
                              NOTE_ADDED: { icon: <StickyNote className="h-3.5 w-3.5" />, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/50' },
                              UPDATED: { icon: <Pencil className="h-3.5 w-3.5" />, color: 'text-slate-600', bg: 'bg-slate-100 dark:bg-slate-900/50' },
                              CONVERTED: { icon: <UserCheck className="h-3.5 w-3.5" />, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/50' },
                              LOST: { icon: <XCircle className="h-3.5 w-3.5" />, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/50' },
                            };

                            const config = eventConfig[item.eventType] || {
                              icon: <Calendar className="h-3.5 w-3.5" />,
                              color: 'text-muted-foreground',
                              bg: 'bg-muted'
                            };

                            const isFirst = index === 0;
                            const eventDate = new Date(item.createdAt);
                            const isToday = new Date().toDateString() === eventDate.toDateString();

                            return (
                              <div
                                key={item.id}
                                className={cn(
                                  'group relative pl-12 py-3 rounded-xl transition-colors',
                                  'hover:bg-muted/30'
                                )}
                              >
                                {/* Timeline node */}
                                <div className={cn(
                                  'absolute left-0 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-xl border-2 bg-background transition-all duration-300',
                                  isFirst ? 'border-primary shadow-lg shadow-primary/20 scale-105' : 'border-muted group-hover:border-primary/50',
                                  config.bg
                                )}>
                                  <span className={config.color}>{config.icon}</span>
                                </div>

                                {/* Content */}
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className={cn(
                                        'font-semibold text-sm',
                                        isFirst ? 'text-foreground' : 'text-foreground/80'
                                      )}>
                                        {item.eventType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                                      </span>
                                      {isFirst && (
                                        <span className="text-[10px] font-medium uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                          Latest
                                        </span>
                                      )}
                                    </div>

                                    {item.eventData && Object.keys(item.eventData).length > 0 && (
                                      <div className="mt-2 flex flex-wrap gap-2">
                                        {Object.entries(item.eventData).map(([key, value]) => (
                                          <span
                                            key={key}
                                            className="inline-flex items-center gap-1 text-xs bg-muted/50 text-muted-foreground px-2 py-1 rounded-md"
                                          >
                                            <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span>
                                            <span className="text-foreground/70">{String(value)}</span>
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  {/* Timestamp */}
                                  <div className="text-right shrink-0">
                                    <p className={cn(
                                      'text-xs font-medium',
                                      isToday ? 'text-primary' : 'text-muted-foreground'
                                    )}>
                                      {isToday ? 'Today' : format(eventDate, 'dd MMM')}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground/70">
                                      {format(eventDate, 'HH:mm')}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
