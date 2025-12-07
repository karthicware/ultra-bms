'use client';

/**
 * Quotation Detail Page
 * SCP-2025-12-06: Clean, compact design with highlighted title only
 */

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Printer,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  Edit,
  Building2,
  MapPin,
  User,
  Mail,
  Phone,
  Globe,
  CreditCard,
  Shield,
  Calendar,
  Receipt,
  Banknote,
  Sparkles,
  UserCheck,
  ChevronRight,
  Home,
} from 'lucide-react';
import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { getQuotationById, sendQuotation, convertToTenant } from '@/services/quotations.service';
import type { Quotation } from '@/types/quotations';
import { QuotationStatus, FirstMonthPaymentMethod } from '@/types/quotations';
import { QuotationPrintView } from '@/components/quotations/QuotationPrintView';
import { formatChequeDueDate } from '@/lib/validations/quotations';

interface QuotationDetailPageProps {
  params: Promise<{ id: string }>;
}

const formatCurrency = (amount: number | undefined | null) => {
  if (amount === undefined || amount === null) return 'AED 0';
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const STATUS_CONFIG = {
  [QuotationStatus.DRAFT]: {
    label: 'Draft',
    variant: 'secondary' as const,
    icon: FileText,
    color: 'text-muted-foreground',
    bg: 'bg-muted',
  },
  [QuotationStatus.SENT]: {
    label: 'Sent',
    variant: 'default' as const,
    icon: Send,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  [QuotationStatus.ACCEPTED]: {
    label: 'Accepted',
    variant: 'success' as const,
    icon: CheckCircle,
    color: 'text-green-600',
    bg: 'bg-green-50',
  },
  [QuotationStatus.REJECTED]: {
    label: 'Rejected',
    variant: 'destructive' as const,
    icon: XCircle,
    color: 'text-red-600',
    bg: 'bg-red-50',
  },
  [QuotationStatus.EXPIRED]: {
    label: 'Expired',
    variant: 'outline' as const,
    icon: Clock,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  [QuotationStatus.CONVERTED]: {
    label: 'Converted',
    variant: 'success' as const,
    icon: CheckCircle,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
};

export default function QuotationDetailPage({ params }: QuotationDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);

  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  useEffect(() => {
    if (id) {
      setLoading(true);
      getQuotationById(id)
        .then((data) => {
          if (data.chequeBreakdown && typeof data.chequeBreakdown === 'string') {
            try {
              data.chequeBreakdown = JSON.parse(data.chequeBreakdown);
            } catch {
              data.chequeBreakdown = [];
            }
          }
          setQuotation(data);
        })
        .catch(() => {
          toast({
            title: 'Error',
            description: 'Failed to load quotation details',
            variant: 'destructive',
          });
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [id, toast]);

  const handlePrint = () => {
    setShowPrintDialog(true);
  };

  const executePrint = () => {
    if (printRef.current) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Quotation ${quotation?.quotationNumber}</title>
              <style>
                @page { size: A4; margin: 10mm; }
                body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
                * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              </style>
            </head>
            <body>${printRef.current.innerHTML}</body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      }
    }
    setShowPrintDialog(false);
  };

  const handleSend = async () => {
    if (!quotation) return;
    setIsSending(true);
    try {
      await sendQuotation(quotation.id);
      toast({ title: 'Success', description: 'Quotation has been sent successfully', variant: 'success' });
      const updated = await getQuotationById(quotation.id);
      if (updated.chequeBreakdown && typeof updated.chequeBreakdown === 'string') {
        try { updated.chequeBreakdown = JSON.parse(updated.chequeBreakdown); } catch { updated.chequeBreakdown = []; }
      }
      setQuotation(updated);
    } catch {
      toast({ title: 'Error', description: 'Failed to send quotation', variant: 'destructive' });
    } finally {
      setIsSending(false);
    }
  };

  const handleEdit = () => {
    router.push(`/quotations/${id}/edit`);
  };

  const handleConvertToTenant = async () => {
    if (!quotation) return;
    setIsConverting(true);
    try {
      const response = await convertToTenant(quotation.id);
      toast({
        title: 'Success',
        description: response.message || 'Lead converted to tenant successfully',
        variant: 'success'
      });
      // Refresh quotation data
      const updated = await getQuotationById(quotation.id);
      if (updated.chequeBreakdown && typeof updated.chequeBreakdown === 'string') {
        try { updated.chequeBreakdown = JSON.parse(updated.chequeBreakdown); } catch { updated.chequeBreakdown = []; }
      }
      setQuotation(updated);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to convert lead to tenant',
        variant: 'destructive'
      });
    } finally {
      setIsConverting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-6xl mx-auto px-4 py-6">
          <div className="animate-pulse space-y-3">
            <div className="h-8 w-32 bg-muted rounded" />
            <div className="h-12 w-64 bg-muted rounded" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              <div className="lg:col-span-2 space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-40 bg-muted rounded-xl" />
                ))}
              </div>
              <div className="h-80 bg-muted rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold mb-2">Quotation Not Found</h2>
          <p className="text-muted-foreground mb-4">The quotation doesn&apos;t exist or has been deleted.</p>
          <Button onClick={() => router.push('/leads')} size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Leads
          </Button>
        </div>
      </div>
    );
  }

  const issueDate = new Date(quotation.issueDate);
  const validityDate = new Date(quotation.validityDate);
  const isExpired = validityDate < new Date();
  const statusConfig = STATUS_CONFIG[quotation.status];
  const StatusIcon = statusConfig.icon;

  // Calculate financial values
  const yearlyRent = quotation.yearlyRentAmount || 0;
  const numberOfCheques = quotation.numberOfCheques || 1;
  const firstMonthRent = yearlyRent > 0 && numberOfCheques > 0 ? Math.round(yearlyRent / numberOfCheques) : 0;

  // Use firstMonthTotal from quotation if available, otherwise calculate
  const totalFirstPaymentDisplay = quotation.firstMonthTotal && quotation.firstMonthTotal > 0
    ? quotation.firstMonthTotal
    : quotation.totalFirstPayment || (firstMonthRent + (quotation.serviceCharges || 0) + (quotation.parkingFee || 0) + (quotation.securityDeposit || 0) + (quotation.adminFee || 0));

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto px-4 py-6">
        {/* Breadcrumb Navigation - Shows Lead context */}
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/leads" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                  <Home className="h-3.5 w-3.5" />
                  <span>Leads</span>
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link
                  href={`/leads/${quotation.leadId}`}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {quotation.leadName || 'Lead Details'}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage className="font-semibold text-foreground">
                Quotation
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header - Highlighted */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-4 border border-primary/20">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold tracking-tight text-primary">{quotation.quotationNumber}</h1>
              <Badge variant={statusConfig.variant} className={cn("gap-1 px-2 py-0.5 text-xs", statusConfig.bg, statusConfig.color)}>
                <StatusIcon className="h-3 w-3" />
                {statusConfig.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Created {format(new Date(quotation.createdAt), 'PPP')}
            </p>
          </div>
          <div className="flex gap-2">
            {quotation.status === QuotationStatus.DRAFT && (
              <Button variant="outline" size="sm" onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            {quotation.status === QuotationStatus.DRAFT && (
              <Button size="sm" onClick={handleSend} disabled={isSending}>
                <Send className="h-4 w-4 mr-2" />
                {isSending ? 'Sending...' : 'Send'}
              </Button>
            )}
            {quotation.status === QuotationStatus.SENT && (
              <Button size="sm" onClick={handleConvertToTenant} disabled={isConverting} className="bg-green-600 hover:bg-green-700">
                <UserCheck className="h-4 w-4 mr-2" />
                {isConverting ? 'Converting...' : 'Convert to Tenant'}
              </Button>
            )}
          </div>
        </div>

        {/* Expiry Warning */}
        {isExpired && quotation.status !== QuotationStatus.EXPIRED && (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <p className="text-sm text-destructive font-medium">
              This quotation expired on {format(validityDate, 'PPP')}
            </p>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-3">
            {/* Customer Information */}
            <Card className="shadow-sm">
              <CardHeader className="py-2 px-3 bg-muted/30">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Full Name</p>
                    <p className="text-sm font-medium">{quotation.leadName || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Email</p>
                    <p className="text-sm font-medium">{quotation.leadEmail || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Phone</p>
                    <p className="text-sm font-medium">{quotation.leadContactNumber || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Nationality</p>
                    <p className="text-sm font-medium">{quotation.nationality || '—'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Property Details */}
            <Card className="shadow-sm">
              <CardHeader className="py-2 px-3 bg-muted/30">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  Property Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Property</p>
                    <p className="text-sm font-medium">{quotation.propertyName || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Unit</p>
                    <p className="text-sm font-medium">{quotation.unitNumber || '—'}</p>
                  </div>
                  {quotation.parkingSpotNumber && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Parking</p>
                      <p className="text-sm font-medium">{quotation.parkingSpotNumber}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Identity Documents - No download links */}
            {(quotation.emiratesIdNumber || quotation.passportNumber) && (
              <Card className="shadow-sm">
                <CardHeader className="py-2 px-3 bg-muted/30">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    Identity Documents
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <div className="grid grid-cols-2 gap-2">
                    {quotation.emiratesIdNumber && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Emirates ID</p>
                        <p className="text-sm font-medium">{quotation.emiratesIdNumber}</p>
                        {quotation.emiratesIdExpiry && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Expires: {format(new Date(quotation.emiratesIdExpiry), 'PP')}
                          </p>
                        )}
                      </div>
                    )}
                    {quotation.passportNumber && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Passport</p>
                        <p className="text-sm font-medium">{quotation.passportNumber}</p>
                        {quotation.passportExpiry && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Expires: {format(new Date(quotation.passportExpiry), 'PP')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment Schedule */}
            {quotation.chequeBreakdown && quotation.chequeBreakdown.length > 0 && (
              <Card className="shadow-sm">
                <CardHeader className="py-2 px-3 bg-muted/30">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    <Receipt className="h-4 w-4 text-muted-foreground" />
                    Payment Schedule
                    {quotation.numberOfCheques && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {quotation.numberOfCheques} {quotation.numberOfCheques === 1 ? 'Payment' : 'Payments'}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left px-4 py-2 font-medium text-muted-foreground text-xs">#</th>
                          <th className="text-left px-4 py-2 font-medium text-muted-foreground text-xs">Payment Mode</th>
                          <th className="text-right px-4 py-2 font-medium text-muted-foreground text-xs">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {quotation.chequeBreakdown.map((item, index) => (
                          <tr key={item.chequeNumber} className={cn(index !== quotation.chequeBreakdown!.length - 1 && 'border-b')}>
                            <td className="px-4 py-2">
                              <span className="font-medium">{item.chequeNumber}</span>
                            </td>
                            <td className="px-4 py-2">
                              {index === 0 && quotation.firstMonthPaymentMethod === FirstMonthPaymentMethod.CASH ? (
                                <span className="flex items-center gap-1.5 text-green-700">
                                  <Banknote className="h-3.5 w-3.5" />
                                  Cash
                                </span>
                              ) : (
                                <span className="flex items-center gap-1.5 text-blue-600">
                                  <CreditCard className="h-3.5 w-3.5" />
                                  Cheque
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2 text-right font-medium tabular-nums">
                              {index === 0 ? formatCurrency(totalFirstPaymentDisplay) : formatCurrency(item.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Terms & Conditions */}
            {(quotation.paymentTerms || quotation.moveinProcedures || quotation.cancellationPolicy || quotation.specialTerms) && (
              <Card className="shadow-sm">
                <CardHeader className="py-2 px-3 bg-muted/30">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Terms & Conditions
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 space-y-2">
                  {quotation.paymentTerms && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Payment Terms</p>
                      <p className="text-sm whitespace-pre-wrap">{quotation.paymentTerms}</p>
                    </div>
                  )}
                  {quotation.moveinProcedures && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Move-in Procedures</p>
                      <p className="text-sm whitespace-pre-wrap">{quotation.moveinProcedures}</p>
                    </div>
                  )}
                  {quotation.cancellationPolicy && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Cancellation Policy</p>
                      <p className="text-sm whitespace-pre-wrap">{quotation.cancellationPolicy}</p>
                    </div>
                  )}
                  {quotation.specialTerms && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Special Terms</p>
                      <p className="text-sm whitespace-pre-wrap">{quotation.specialTerms}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Financial Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-3">
              {/* Financial Summary Card */}
              <div className="relative overflow-hidden rounded-2xl border border-primary/10 bg-gradient-to-br from-card via-card to-primary/5 p-5 shadow-lg">
                {/* Decorative elements */}
                <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-primary/5 blur-3xl" />
                <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />

                <div className="relative">
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                      Financial Summary
                    </span>
                  </div>

                  {/* Validity */}
                  <div className="rounded-xl bg-muted/50 p-3 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background shadow-sm">
                        <Calendar className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Valid Until</p>
                        <p className={cn('text-sm font-medium', isExpired && 'text-destructive')}>
                          {format(validityDate, 'PPP')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Annual Rent */}
                  {yearlyRent > 0 && (
                    <div className="rounded-xl bg-primary/5 border border-primary/10 p-3 mb-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-primary">Annual Rent</span>
                        <span className="text-base font-bold text-primary tabular-nums">
                          {formatCurrency(yearlyRent)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Payment Schedule</span>
                        <span>
                          {quotation.firstMonthPaymentMethod === FirstMonthPaymentMethod.CASH
                            ? `${numberOfCheques - 1} ${numberOfCheques - 1 === 1 ? 'Cheque' : 'Cheques'}`
                            : `${numberOfCheques} ${numberOfCheques === 1 ? 'Cheque' : 'Cheques'}`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                        <span>First Payment Mode</span>
                        <span className="flex items-center gap-1">
                          {quotation.firstMonthPaymentMethod === FirstMonthPaymentMethod.CASH ? (
                            <>
                              <Banknote className="h-3 w-3 text-green-600" />
                              Cash
                            </>
                          ) : (
                            <>
                              <CreditCard className="h-3 w-3 text-blue-600" />
                              Cheque
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* First Payment Total */}
                  <div className="flex items-center justify-between py-3 border-t border-primary/10">
                    <div className="flex items-center gap-2">
                      {quotation.firstMonthPaymentMethod === FirstMonthPaymentMethod.CASH ? (
                        <Banknote className="h-4 w-4 text-green-600" />
                      ) : (
                        <CreditCard className="h-4 w-4 text-blue-600" />
                      )}
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          First Payment
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {quotation.firstMonthPaymentMethod === FirstMonthPaymentMethod.CASH ? 'Cash' : 'Cheque'} • Includes all fees & deposit
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold tracking-tight text-primary">
                        {formatCurrency(totalFirstPaymentDisplay)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Info */}
              <div className="rounded-xl border bg-card/50 p-4">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Quotation Timeline
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Issue Date</span>
                    <span className="font-medium">{format(issueDate, 'PP')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valid Until</span>
                    <span className={cn('font-medium', isExpired && 'text-destructive')}>
                      {format(validityDate, 'PP')}
                    </span>
                  </div>
                  {quotation.sentAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sent On</span>
                      <span className="font-medium">{format(new Date(quotation.sentAt), 'PP')}</span>
                    </div>
                  )}
                  {quotation.acceptedAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Accepted On</span>
                      <span className="font-medium text-green-600">{format(new Date(quotation.acceptedAt), 'PP')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Dialog */}
      <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Print Preview</DialogTitle>
            <DialogDescription>Preview how the quotation will appear when printed</DialogDescription>
          </DialogHeader>
          <div className="border rounded-lg overflow-hidden bg-white">
            <div className="scale-75 origin-top-left" style={{ width: '133.33%' }}>
              <QuotationPrintView ref={printRef} quotation={quotation} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPrintDialog(false)}>Cancel</Button>
            <Button onClick={executePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
