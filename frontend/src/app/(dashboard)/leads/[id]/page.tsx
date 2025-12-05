/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

/**
 * Lead Detail Page
 * Shows complete lead information, documents, quotations, and history
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/auth-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  getLeadDocuments,
  downloadDocument,
  getLeadHistory,
  deleteLead,
} from '@/services/leads.service';
import { getQuotationsByLeadId, convertToTenant } from '@/services/quotations.service';
import type { Lead, LeadDocument, LeadHistory, Quotation } from '@/types';
import {
  Mail,
  Phone,
  MapPin,
  Building,
  Calendar,
  FileText,
  CreditCard,
  ArrowLeft,
  Plus,
  Trash2,
  PencilIcon,
  MoreVertical
} from 'lucide-react';
import DocumentList from '@/components/leads/document-list';

const LEAD_STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-800',
  CONTACTED: 'bg-yellow-100 text-yellow-800',
  QUOTATION_SENT: 'bg-purple-100 text-purple-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  CONVERTED: 'bg-emerald-100 text-emerald-800',
  LOST: 'bg-red-100 text-red-800',
};

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const leadId = params.id as string;

  const [lead, setLead] = useState<Lead | null>(null);
  const [documents, setDocuments] = useState<LeadDocument[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [history, setHistory] = useState<LeadHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [convertingQuotationId, setConvertingQuotationId] = useState<string | null>(null);

  const fetchLeadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [leadData, docsData, quoteData, historyData] = await Promise.allSettled([
        getLeadById(leadId),
        getLeadDocuments(leadId),
        getQuotationsByLeadId(leadId),
        getLeadHistory(leadId),
      ]);

      // Handle lead data
      if (leadData.status === 'fulfilled') {
        setLead(leadData.value);
      } else {
        console.error('Failed to fetch lead:', leadData.reason);
        throw new Error('Failed to load lead details');
      }

      // Handle documents (set empty array if failed)
      if (docsData.status === 'fulfilled') {
        setDocuments(docsData.value || []);
      } else {
        console.error('Failed to fetch documents:', docsData.reason);
        setDocuments([]);
        toast({
          title: 'Warning',
          description: 'Failed to load documents',
          variant: 'destructive',
        });
      }

      // Handle quotations (set empty array if failed)
      if (quoteData.status === 'fulfilled') {
        setQuotations(quoteData.value || []);
      } else {
        console.error('Failed to fetch quotations:', quoteData.reason);
        setQuotations([]);
      }

      // Handle history (set empty array if failed)
      if (historyData.status === 'fulfilled') {
        setHistory(historyData.value || []);
      } else {
        console.error('Failed to fetch history:', historyData.reason);
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
    // Wait for auth to finish loading before fetching data
    if (!authLoading) {
      if (isAuthenticated) {
        fetchLeadData();
      } else {
        // Auth loaded but user not authenticated - redirect to login
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

  const handleDownloadDocument = async (docId: string, fileName: string) => {
    try {
      console.log('[PAGE] Starting download:', { docId, fileName, leadId });
      const presignedUrl = await downloadDocument(leadId, docId);

      // Open presigned URL directly - bypasses CORS issues with S3/LocalStack
      window.open(presignedUrl, '_blank');

      toast({
        title: 'Success',
        description: `Opening ${fileName}`,
        variant: 'success',
      });
    } catch (error: any) {
      console.error('[PAGE] Download error:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || error.message || 'Failed to download document',
        variant: 'destructive',
      });
    }
  };

  const handleConvertToTenant = async (quotationId: string) => {
    try {
      setConvertingQuotationId(quotationId);
      const response = await convertToTenant(quotationId);
      toast({
        title: 'Success',
        description: response.message || 'Lead converted to tenant successfully',
        variant: 'success',
      });
      // Redirect to tenant onboarding page (Story 3.2 - future)
      // For now, just refresh the lead data
      await fetchLeadData();
      // TODO: When Story 3.2 is complete, redirect to tenant onboarding with pre-filled data
      // router.push(`/tenants/onboard?leadId=${response.leadId}&quotationId=${response.quotationId}`);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to convert lead to tenant',
        variant: 'destructive',
      });
    } finally {
      setConvertingQuotationId(null);
    }
  };

  if (authLoading || isLoading || !lead) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // Get initials for Avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="container mx-auto py-6 space-y-8 max-w-7xl">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{lead.fullName}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <span>{lead.leadNumber}</span>
              <span>•</span>
              <Badge variant="outline" className={LEAD_STATUS_COLORS[lead.status] + ' border-0'}>
                {lead.status.replace('_', ' ')}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Button 
            variant="outline"
            className="hidden md:flex"
            onClick={() => router.push(`/leads/${leadId}/edit`)}
          >
            <PencilIcon className="mr-2 h-4 w-4" />
            Edit Lead
          </Button>

          <Button 
            onClick={() => router.push(`/quotations/create?leadId=${leadId}`)} 
            className="flex-1 md:flex-none"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Quotation
          </Button>

          <AlertDialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push(`/leads/${leadId}/edit`)} className="md:hidden">
                  <PencilIcon className="mr-2 h-4 w-4" />
                  Edit Lead
                </DropdownMenuItem>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50" onSelect={(e) => e.preventDefault()}>
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
                <AlertDialogAction className="bg-red-600 text-white hover:bg-red-700" onClick={handleDeleteLead}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Sidebar: Customer Info */}
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-primary/10">
                  <AvatarFallback className="text-lg bg-primary/5 text-primary font-semibold">
                    {getInitials(lead.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg">{lead.fullName}</CardTitle>
                  <CardDescription>{lead.leadNumber}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate" title={lead.email}>{lead.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{lead.contactNumber}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{lead.homeCountry}</span>
                </div>
              </div>

              <Separator />
              
              <div className="space-y-3 pt-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary" /> Identity Details
                </h4>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground block text-xs">Emirates ID</span>
                    <span className="font-medium">{lead.emiratesId}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Passport Number</span>
                    <span className="font-medium">{lead.passportNumber}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Passport Expiry</span>
                    <span className="font-medium">{format(new Date(lead.passportExpiryDate), 'PPP')}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Lead Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <div>
                  <span className="text-muted-foreground block text-xs mb-1">Source</span>
                  <Badge variant="secondary">{lead.leadSource.replace('_', ' ')}</Badge>
               </div>
               {lead.propertyInterest && (
                <div>
                  <span className="text-muted-foreground block text-xs mb-1">Interested Property</span>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    {lead.propertyInterest}
                  </div>
                </div>
               )}
               {lead.notes && (
                <div>
                  <span className="text-muted-foreground block text-xs mb-1">Notes</span>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                    {lead.notes}
                  </p>
                </div>
               )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="quotations" className="w-full">
            <TabsList className="w-full justify-start h-12 p-1 bg-muted/50">
              <TabsTrigger value="quotations" className="flex-1 md:flex-none px-6">
                Quotations ({quotations?.length ?? 0})
              </TabsTrigger>
              <TabsTrigger value="documents" className="flex-1 md:flex-none px-6">
                Documents ({documents?.length ?? 0})
              </TabsTrigger>
              <TabsTrigger value="history" className="flex-1 md:flex-none px-6">
                History ({history?.length ?? 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="quotations" className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                 <h3 className="text-lg font-medium">Quotations</h3>
                 {/* Optional secondary action here if needed */}
              </div>
              <Card>
                <CardContent className="p-0">
                  {(quotations?.length ?? 0) === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <FileText className="h-12 w-12 mb-4 opacity-20" />
                      <p>No quotations created yet</p>
                      <Button 
                        variant="link" 
                        onClick={() => router.push(`/quotations/create?leadId=${leadId}`)}
                      >
                        Create your first quotation
                      </Button>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {quotations?.map((quote) => (
                        <div
                          key={quote.id}
                          className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 hover:bg-muted/50 transition-colors cursor-pointer gap-4"
                          onClick={() => router.push(`/quotations/${quote.id}`)}
                        >
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-primary">{quote.quotationNumber}</span>
                              <Badge variant={quote.status === 'ACCEPTED' ? 'default' : 'secondary'}>
                                {quote.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Building className="h-3 w-3" />
                              <span>{quote.propertyName}</span>
                              <span>•</span>
                              <span>AED {quote.totalFirstPayment.toLocaleString()}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 w-full md:w-auto">
                             {quote.status === 'ACCEPTED' && (
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleConvertToTenant(quote.id);
                                }}
                                disabled={convertingQuotationId === quote.id}
                                className="w-full md:w-auto"
                              >
                                {convertingQuotationId === quote.id ? 'Converting...' : 'Convert to Tenant'}
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                 <h3 className="text-lg font-medium">Documents</h3>
              </div>
                  <DocumentList
                    leadId={leadId}
                    documents={documents || []}
                    onDownload={handleDownloadDocument}
                    data-testid="list-documents"
                  />
            </TabsContent>

            <TabsContent value="history" className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                 <h3 className="text-lg font-medium">Timeline</h3>
              </div>
              <Card>
                <CardContent className="p-6">
                  {(history?.length ?? 0) === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">No history available</p>
                  ) : (
                    <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-muted before:to-transparent" data-testid="timeline-lead-history">
                      {history?.map((item) => (
                        <div key={item.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                          {/* Icon/Dot */}
                          <div className="flex items-center justify-center w-10 h-10 rounded-full border bg-background shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                             <Calendar className="h-4 w-4 text-muted-foreground" />
                          </div>
                          
                          {/* Content Card */}
                          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-card p-4 rounded border shadow-sm">
                            <div className="flex items-center justify-between space-x-2 mb-1">
                              <div className="font-bold text-sm text-primary">{item.eventType.replace('_', ' ')}</div>
                              <time className="font-mono text-xs text-muted-foreground">{format(new Date(item.createdAt), 'MMM d, yyyy p')}</time>
                            </div>
                             {item.eventData && Object.keys(item.eventData).length > 0 && (
                              <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded mt-2 overflow-x-auto">
                                <pre className="whitespace-pre-wrap font-mono">
                                  {JSON.stringify(item.eventData, null, 2).replace(/[{}"\[\]]/g, '')}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}