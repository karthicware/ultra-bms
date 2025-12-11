'use client';

/**
 * Quotation Detail Page
 * SCP-2025-12-10: Bold redesign with modern aesthetic
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
  User,
  Globe,
  CreditCard,
  Calendar,
  Receipt,
  Banknote,
  Sparkles,
  UserCheck,
  BadgeCheck,
  Wallet,
  CalendarClock,
  ShieldCheck,
  ScrollText,
} from 'lucide-react';
import Link from 'next/link';
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
    color: 'text-slate-600',
    bg: 'bg-slate-100',
    gradient: 'from-slate-500 to-slate-600',
    ringColor: 'ring-slate-200',
  },
  [QuotationStatus.SENT]: {
    label: 'Sent',
    variant: 'default' as const,
    icon: Send,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    gradient: 'from-blue-500 to-blue-600',
    ringColor: 'ring-blue-200',
  },
  [QuotationStatus.ACCEPTED]: {
    label: 'Accepted',
    variant: 'success' as const,
    icon: CheckCircle,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    gradient: 'from-emerald-500 to-emerald-600',
    ringColor: 'ring-emerald-200',
  },
  [QuotationStatus.REJECTED]: {
    label: 'Rejected',
    variant: 'destructive' as const,
    icon: XCircle,
    color: 'text-red-600',
    bg: 'bg-red-50',
    gradient: 'from-red-500 to-red-600',
    ringColor: 'ring-red-200',
  },
  [QuotationStatus.EXPIRED]: {
    label: 'Expired',
    variant: 'outline' as const,
    icon: Clock,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    gradient: 'from-amber-500 to-amber-600',
    ringColor: 'ring-amber-200',
  },
  [QuotationStatus.CONVERTED]: {
    label: 'Converted',
    variant: 'success' as const,
    icon: BadgeCheck,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    gradient: 'from-violet-500 to-violet-600',
    ringColor: 'ring-violet-200',
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="container max-w-7xl mx-auto px-6 py-8">
          {/* Loading skeleton with shimmer effect */}
          <div className="animate-pulse space-y-6">
            <div className="h-6 w-48 bg-slate-200 rounded-lg" />
            <div className="h-48 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 rounded-3xl" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-44 bg-slate-100 rounded-2xl" />
                ))}
              </div>
              <div className="h-96 bg-slate-100 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="relative">
            <div className="absolute inset-0 bg-red-500/20 blur-3xl rounded-full" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-red-500 to-rose-600 mx-auto mb-6 shadow-xl shadow-red-500/25">
              <AlertTriangle className="h-12 w-12 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-3 text-slate-900">Quotation Not Found</h2>
          <p className="text-slate-500 mb-6">The quotation you're looking for doesn't exist or may have been deleted.</p>
          <Button
            onClick={() => router.push('/leads')}
            className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-6 py-3 h-auto"
          >
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="container max-w-7xl mx-auto px-6 py-6">
        {/* Hero Header Section */}
        <div className="relative mb-8">
          {/* Background gradient decoration */}
          <div className={cn(
            "absolute inset-0 bg-gradient-to-r opacity-10 rounded-3xl blur-xl",
            statusConfig.gradient
          )} />

          <div className="relative bg-white rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-200/50 overflow-hidden">
            {/* Top accent bar */}
            <div className={cn("h-1.5 bg-gradient-to-r", statusConfig.gradient)} />

            <div className="p-6 md:p-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                {/* Left side - Quotation info */}
                <div className="flex items-start gap-5">
                  {/* Status icon */}
                  <div className={cn(
                    "flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg",
                    statusConfig.gradient,
                    `shadow-${statusConfig.color.split('-')[1]}-500/25`
                  )}>
                    <StatusIcon className="h-8 w-8 text-white" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                        {quotation.quotationNumber}
                      </h1>
                      <Badge
                        className={cn(
                          "px-3 py-1 text-sm font-medium rounded-full ring-2",
                          statusConfig.bg,
                          statusConfig.color,
                          statusConfig.ringColor
                        )}
                      >
                        {statusConfig.label}
                      </Badge>
                      {quotation.isModified && (
                        <Badge className="px-3 py-1 text-sm font-medium rounded-full bg-amber-50 text-amber-600 ring-2 ring-amber-200">
                          <Edit className="h-3 w-3 mr-1" />
                          Modified
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        Created {format(new Date(quotation.createdAt), 'PPP')}
                      </span>
                      {quotation.sentAt && (
                        <span className="flex items-center gap-1.5">
                          <Send className="h-4 w-4" />
                          Sent {format(new Date(quotation.sentAt), 'PPP')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right side - Actions */}
                <div className="flex flex-wrap items-center gap-3">
                  {(quotation.status === QuotationStatus.DRAFT ||
                    quotation.status === QuotationStatus.SENT ||
                    quotation.status === QuotationStatus.ACCEPTED) && (
                    <Button
                      variant="outline"
                      onClick={handleEdit}
                      className="rounded-xl border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={handlePrint}
                    className="rounded-xl border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                  {quotation.status === QuotationStatus.DRAFT && (
                    <Button
                      onClick={handleSend}
                      disabled={isSending}
                      className="rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/25"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {isSending ? 'Sending...' : 'Send Quotation'}
                    </Button>
                  )}
                  {(quotation.status === QuotationStatus.SENT ||
                    quotation.status === QuotationStatus.ACCEPTED) && (
                    <Button
                      onClick={handleConvertToTenant}
                      disabled={isConverting}
                      className="rounded-xl bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/25"
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      {isConverting ? 'Converting...' : 'Convert to Tenant'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Expiry Warning */}
        {isExpired && quotation.status !== QuotationStatus.EXPIRED && (
          <div className="flex items-center gap-3 p-4 mb-6 rounded-2xl bg-red-50 border border-red-200">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-red-700">Quotation Expired</p>
              <p className="text-sm text-red-600">
                This quotation expired on {format(validityDate, 'PPP')}
              </p>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-5">
            {/* Customer & Property - Combined Card */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                {/* Customer Information */}
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-slate-900">Customer</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Full Name</p>
                      <p className="text-sm font-semibold text-slate-900">{quotation.leadName || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Email</p>
                      <p className="text-sm text-slate-700">{quotation.leadEmail || '—'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Phone</p>
                        <p className="text-sm text-slate-700">{quotation.leadContactNumber || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Nationality</p>
                        <p className="text-sm text-slate-700">{quotation.nationality || '—'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Property Details */}
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
                      <Building2 className="h-5 w-5 text-violet-600" />
                    </div>
                    <h3 className="font-semibold text-slate-900">Property</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Property Name</p>
                      <p className="text-sm font-semibold text-slate-900">{quotation.propertyName || '—'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Unit Number</p>
                        <p className="text-sm text-slate-700">{quotation.unitNumber || '—'}</p>
                      </div>
                      {quotation.parkingSpotNumber && (
                        <div>
                          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Parking</p>
                          <p className="text-sm text-slate-700">{quotation.parkingSpotNumber}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Identity Documents */}
            {(quotation.emiratesIdNumber || quotation.passportNumber) && (
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                    <ShieldCheck className="h-5 w-5 text-amber-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900">Identity Documents</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quotation.emiratesIdNumber && (
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
                      <CreditCard className="h-5 w-5 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Emirates ID</p>
                        <p className="text-sm font-semibold text-slate-900">{quotation.emiratesIdNumber}</p>
                        {quotation.emiratesIdExpiry && (
                          <p className="text-xs text-slate-500 mt-1">
                            Expires: {format(new Date(quotation.emiratesIdExpiry), 'PP')}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  {quotation.passportNumber && (
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
                      <Globe className="h-5 w-5 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Passport</p>
                        <p className="text-sm font-semibold text-slate-900">{quotation.passportNumber}</p>
                        {quotation.passportExpiry && (
                          <p className="text-xs text-slate-500 mt-1">
                            Expires: {format(new Date(quotation.passportExpiry), 'PP')}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Payment Schedule */}
            {quotation.chequeBreakdown && quotation.chequeBreakdown.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                        <Receipt className="h-5 w-5 text-emerald-600" />
                      </div>
                      <h3 className="font-semibold text-slate-900">Payment Schedule</h3>
                    </div>
                    {quotation.numberOfCheques && (
                      <Badge className="px-3 py-1 text-sm font-medium rounded-full bg-emerald-50 text-emerald-700">
                        {quotation.numberOfCheques} {quotation.numberOfCheques === 1 ? 'Payment' : 'Payments'}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50/80">
                        <th className="text-left px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">#</th>
                        <th className="text-left px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Payment Mode</th>
                        <th className="text-right px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {quotation.chequeBreakdown.map((item, index) => (
                        <tr key={item.chequeNumber} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-4">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-sm font-semibold text-slate-600">
                              {item.chequeNumber}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            {index === 0 && quotation.firstMonthPaymentMethod === FirstMonthPaymentMethod.CASH ? (
                              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-sm font-medium">
                                <Banknote className="h-4 w-4" />
                                Cash
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-sm font-medium">
                                <CreditCard className="h-4 w-4" />
                                Cheque
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <span className="text-lg font-bold text-slate-900 tabular-nums">
                              {index === 0 ? formatCurrency(totalFirstPaymentDisplay) : formatCurrency(item.amount)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Terms & Conditions */}
            {(quotation.paymentTerms || quotation.moveinProcedures || quotation.cancellationPolicy || quotation.specialTerms) && (
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                    <ScrollText className="h-5 w-5 text-slate-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900">Terms & Conditions</h3>
                </div>
                <div className="space-y-4">
                  {quotation.paymentTerms && (
                    <div className="p-4 rounded-xl bg-slate-50">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Payment Terms</p>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{quotation.paymentTerms}</p>
                    </div>
                  )}
                  {quotation.moveinProcedures && (
                    <div className="p-4 rounded-xl bg-slate-50">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Move-in Procedures</p>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{quotation.moveinProcedures}</p>
                    </div>
                  )}
                  {quotation.cancellationPolicy && (
                    <div className="p-4 rounded-xl bg-slate-50">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Cancellation Policy</p>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{quotation.cancellationPolicy}</p>
                    </div>
                  )}
                  {quotation.specialTerms && (
                    <div className="p-4 rounded-xl bg-slate-50">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Special Terms</p>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{quotation.specialTerms}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Financial Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-5">
              {/* Financial Summary Card */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 shadow-2xl">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/20 to-violet-500/20 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 blur-3xl rounded-full translate-y-1/2 -translate-x-1/2" />

                <div className="relative">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-white/80 uppercase tracking-widest">
                      Financial Summary
                    </span>
                  </div>

                  {/* Annual Rent - Hero number */}
                  {yearlyRent > 0 && (
                    <div className="mb-6">
                      <p className="text-xs font-medium text-white/60 uppercase tracking-wider mb-2">Annual Rent</p>
                      <p className="text-4xl font-bold text-white tracking-tight">
                        {formatCurrency(yearlyRent)}
                      </p>
                      <p className="text-sm text-white/60 mt-1">
                        {quotation.firstMonthPaymentMethod === FirstMonthPaymentMethod.CASH
                          ? `${numberOfCheques - 1} ${numberOfCheques - 1 === 1 ? 'Cheque' : 'Cheques'} + Cash`
                          : `${numberOfCheques} ${numberOfCheques === 1 ? 'Cheque' : 'Cheques'}`}
                      </p>
                    </div>
                  )}

                  {/* Validity */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-3">
                      <CalendarClock className="h-5 w-5 text-white/70" />
                      <div>
                        <p className="text-xs text-white/60 uppercase tracking-wider">Valid Until</p>
                        <p className={cn(
                          'text-sm font-semibold',
                          isExpired ? 'text-red-400' : 'text-white'
                        )}>
                          {format(validityDate, 'PPP')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* First Payment */}
                  <div className="border-t border-white/10 pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {quotation.firstMonthPaymentMethod === FirstMonthPaymentMethod.CASH ? (
                          <Banknote className="h-5 w-5 text-emerald-400" />
                        ) : (
                          <Wallet className="h-5 w-5 text-blue-400" />
                        )}
                        <span className="text-sm font-medium text-white/80">First Payment</span>
                      </div>
                      <Badge className={cn(
                        "text-xs font-medium",
                        quotation.firstMonthPaymentMethod === FirstMonthPaymentMethod.CASH
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-blue-500/20 text-blue-300"
                      )}>
                        {quotation.firstMonthPaymentMethod === FirstMonthPaymentMethod.CASH ? 'Cash' : 'Cheque'}
                      </Badge>
                    </div>
                    <p className="text-xs text-white/50 mb-3">Includes rent + all fees & deposit</p>
                    <p className="text-3xl font-bold text-white tracking-tight">
                      {formatCurrency(totalFirstPaymentDisplay)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Timeline Card */}
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                    <Calendar className="h-5 w-5 text-slate-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900">Timeline</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                    <span className="text-sm text-slate-600">Issue Date</span>
                    <span className="text-sm font-semibold text-slate-900">{format(issueDate, 'PP')}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                    <span className="text-sm text-slate-600">Valid Until</span>
                    <span className={cn(
                      'text-sm font-semibold',
                      isExpired ? 'text-red-600' : 'text-slate-900'
                    )}>
                      {format(validityDate, 'PP')}
                    </span>
                  </div>
                  {quotation.sentAt && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50">
                      <span className="text-sm text-blue-600">Sent On</span>
                      <span className="text-sm font-semibold text-blue-700">{format(new Date(quotation.sentAt), 'PP')}</span>
                    </div>
                  )}
                  {quotation.acceptedAt && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50">
                      <span className="text-sm text-emerald-600">Accepted On</span>
                      <span className="text-sm font-semibold text-emerald-700">{format(new Date(quotation.acceptedAt), 'PP')}</span>
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
