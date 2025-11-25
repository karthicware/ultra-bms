'use client';

/**
 * Lead Detail Page
 * Shows complete lead information, documents, quotations, and history
 */

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/auth-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  getLeadById,
  getLeadDocuments,
  uploadDocument,
  deleteDocument,
  downloadDocument,
  getLeadHistory,
} from '@/services/leads.service';
import { getQuotationsByLeadId, convertToTenant } from '@/services/quotations.service';
import type { Lead, LeadDocument, LeadHistory, Quotation, LeadDocumentType, QuotationStatus } from '@/types';
import {
  FileText,
  Download,
  Trash2,
  Upload,
  Mail,
  Phone,
  MapPin,
  Calendar,
  User,
  Building,
} from 'lucide-react';

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
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedDocType, setSelectedDocType] = useState<LeadDocumentType>('EMIRATES_ID' as LeadDocumentType);
  const [isUploading, setIsUploading] = useState(false);
  const [convertingQuotationId, setConvertingQuotationId] = useState<string | null>(null);

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
  }, [leadId, authLoading, isAuthenticated, router]);

  const fetchLeadData = async () => {
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
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load lead details',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadDocument = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      await uploadDocument(leadId, selectedFile, selectedDocType);
      toast({
        title: 'Success',
        description: 'Document uploaded successfully',
      });
      setIsUploadDialogOpen(false);
      setSelectedFile(null);
      fetchLeadData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to upload document',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    try {
      await deleteDocument(leadId, docId);
      toast({
        title: 'Success',
        description: 'Document deleted successfully',
      });
      fetchLeadData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete document',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadDocument = async (docId: string, fileName: string) => {
    try {
      console.log('[PAGE] Starting download:', { docId, fileName, leadId });
      const blob = await downloadDocument(leadId, docId);
      console.log('[PAGE] Blob received:', { size: blob.size, type: blob.type });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: `Downloaded ${fileName}`,
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

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{lead.fullName}</h1>
            <Badge className={LEAD_STATUS_COLORS[lead.status]}>
              {lead.status.replace('_', ' ')}
            </Badge>
          </div>
          <p className="text-muted-foreground">Lead Number: {lead.leadNumber}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => router.push(`/quotations/create?leadId=${leadId}`)}>
            Create Quotation
          </Button>
        </div>
      </div>

      {/* Lead Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card data-testid="card-lead-details">
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{lead.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{lead.contactNumber}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{lead.homeCountry}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>Emirates ID: {lead.emiratesId}</span>
            </div>
            {lead.propertyInterest && (
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span>Interested in: {lead.propertyInterest}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Identity Documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium">Passport Number</label>
              <p className="text-sm">{lead.passportNumber}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Passport Expiry</label>
              <p className="text-sm">{format(new Date(lead.passportExpiryDate), 'PPP')}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Lead Source</label>
              <p className="text-sm">{lead.leadSource.replace('_', ' ')}</p>
            </div>
            {lead.notes && (
              <div>
                <label className="text-sm font-medium">Notes</label>
                <p className="text-sm text-muted-foreground">{lead.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Documents, Quotations, History */}
      <Tabs defaultValue="documents" className="w-full">
        <TabsList>
          <TabsTrigger value="documents">Documents ({documents?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="quotations">Quotations ({quotations?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="history">History ({history?.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Uploaded Documents</CardTitle>
              <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="btn-upload-document">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Document
                  </Button>
                </DialogTrigger>
                <DialogContent data-testid="modal-upload-document">
                  <DialogHeader>
                    <DialogTitle>Upload Document</DialogTitle>
                    <DialogDescription>
                      Upload Emirates ID, passport, or other documents (PDF, JPG, PNG, max 5MB)
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Document Type</Label>
                      <Select
                        value={selectedDocType}
                        onValueChange={(v) => setSelectedDocType(v as LeadDocumentType)}
                      >
                        <SelectTrigger data-testid="select-document-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EMIRATES_ID">Emirates ID</SelectItem>
                          <SelectItem value="PASSPORT">Passport</SelectItem>
                          <SelectItem value="MARRIAGE_CERTIFICATE">Marriage Certificate</SelectItem>
                          <SelectItem value="VISA">Visa</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>File</Label>
                      <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      />
                    </div>
                    <Button
                      onClick={handleUploadDocument}
                      disabled={!selectedFile || isUploading}
                      className="w-full"
                      data-testid="btn-upload"
                    >
                      {isUploading ? 'Uploading...' : 'Upload'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {(documents?.length ?? 0) === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  No documents uploaded yet
                </p>
              ) : (
                <div className="space-y-2" data-testid="list-documents">
                  {documents?.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{doc.fileName}</p>
                          <p className="text-sm text-muted-foreground">
                            {doc.documentType.replace('_', ' ')} • {(doc.fileSize / 1024).toFixed(0)} KB
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadDocument(doc.id, doc.fileName)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteDocument(doc.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quotations" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Quotations Issued</CardTitle>
            </CardHeader>
            <CardContent>
              {(quotations?.length ?? 0) === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  No quotations created yet
                </p>
              ) : (
                <div className="space-y-2">
                  {quotations?.map((quote) => (
                    <div
                      key={quote.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => router.push(`/quotations/${quote.id}`)}
                        role="button"
                        tabIndex={0}
                      >
                        <p className="font-medium">{quote.quotationNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {quote.propertyName} • AED {quote.totalFirstPayment.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge>{quote.status}</Badge>
                        {quote.status === 'ACCEPTED' && (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConvertToTenant(quote.id);
                            }}
                            disabled={convertingQuotationId === quote.id}
                            data-testid="btn-convert-to-tenant"
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

        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Communication History</CardTitle>
            </CardHeader>
            <CardContent>
              {(history?.length ?? 0) === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No history available</p>
              ) : (
                <div className="space-y-4" data-testid="timeline-lead-history">
                  {history?.map((item, index) => (
                    <div key={item.id} className="flex gap-4" data-testid={`timeline-item-${index}`}>
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-primary" />
                        {index < (history?.length ?? 0) - 1 && (
                          <div className="w-0.5 h-full bg-border mt-2" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="font-medium">{item.eventType.replace('_', ' ')}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(item.createdAt), 'PPP p')}
                        </p>
                        {item.eventData && Object.keys(item.eventData).length > 0 && (
                          <pre className="text-xs mt-2 p-2 bg-muted rounded">
                            {JSON.stringify(item.eventData, null, 2)}
                          </pre>
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
  );
}
