'use client';

/**
 * Lease Extension Form Page
 * Story 3.6: Tenant Lease Extension and Renewal (AC: #2-5)
 *
 * Form for extending a tenant's lease with rent adjustment options
 */

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, addYears, addMonths } from 'date-fns';
import {
  CalendarIcon,
  ArrowLeft,
  Building2,
  User,
  CalendarClock,
  DollarSign,
  FileText,
  CheckCircle2,
  AlertCircle,
  Download,
  Loader2,
  Info,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import {
  leaseExtensionSchema,
  type LeaseExtensionFormData,
  leaseExtensionFormDefaults,
  calculateNewRent,
  getDefaultNewEndDate,
  getDaysUntilExpiry,
  getExpiryUrgencyLevel,
} from '@/lib/validations/lease';
import { getRenewalOffer, extendLease, getExtensionHistory } from '@/services/lease.service';
import type { CurrentLeaseSummary, LeaseExtension, LeaseExtensionRequest } from '@/types/lease';
import { RentAdjustmentType } from '@/types/lease';

interface PageProps {
  params: Promise<{ tenantId: string }>;
}

/**
 * Extension confirmation success state
 */
interface ExtensionResult {
  extensionId: string;
  newEndDate: string;
  newRent: number;
  amendmentPdfUrl?: string;
}

export default function LeaseExtensionPage({ params }: PageProps) {
  const { tenantId } = use(params);
  const router = useRouter();

  // State
  const [leaseSummary, setLeaseSummary] = useState<CurrentLeaseSummary | null>(null);
  const [extensionHistory, setExtensionHistory] = useState<LeaseExtension[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [extensionResult, setExtensionResult] = useState<ExtensionResult | null>(null);
  const [_showPreview, setShowPreview] = useState(false);

  // Form
  const form = useForm<LeaseExtensionFormData>({
    resolver: zodResolver(leaseExtensionSchema),
    defaultValues: leaseExtensionFormDefaults,
  });

  const watchedAdjustmentType = form.watch('rentAdjustmentType');
  const watchedNewEndDate = form.watch('newEndDate');
  const watchedPercentage = form.watch('percentageIncrease');
  const watchedFlat = form.watch('flatIncrease');
  const watchedCustom = form.watch('customRent');

  // Load tenant data
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [summary, history] = await Promise.all([
          getRenewalOffer(tenantId),
          getExtensionHistory(tenantId),
        ]);

        setLeaseSummary(summary);
        setExtensionHistory(history);

        // Set default new end date (current end + 12 months)
        if (summary?.leaseEndDate) {
          const defaultEndDate = getDefaultNewEndDate(summary.leaseEndDate);
          form.setValue('newEndDate', defaultEndDate);
        }
      } catch (error) {
        console.error('Failed to load tenant data:', error);
        toast.error('Load Error', { description: 'Failed to load tenant information' });
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [tenantId, form]);

  // Calculate preview rent
  const getPreviewRent = (): number => {
    if (!leaseSummary) return 0;

    const currentRent = leaseSummary.baseRent;
    let adjustmentValue = 0;

    switch (watchedAdjustmentType) {
      case RentAdjustmentType.PERCENTAGE:
        adjustmentValue = watchedPercentage ?? 0;
        break;
      case RentAdjustmentType.FLAT:
        adjustmentValue = watchedFlat ?? 0;
        break;
      case RentAdjustmentType.CUSTOM:
        return watchedCustom ?? currentRent;
      case RentAdjustmentType.NO_CHANGE:
      default:
        return currentRent;
    }

    return calculateNewRent(currentRent, watchedAdjustmentType, adjustmentValue);
  };

  const previewRent = getPreviewRent();
  const rentDifference = leaseSummary ? previewRent - leaseSummary.baseRent : 0;
  const rentPercentChange = leaseSummary?.baseRent
    ? ((rentDifference / leaseSummary.baseRent) * 100).toFixed(1)
    : '0';

  // Handlers
  const handleBack = () => {
    router.push('/leases/extensions');
  };

  const handlePreview = () => {
    form.trigger().then((isValid) => {
      if (isValid) {
        setShowPreview(true);
      }
    });
  };

  const handleSubmit = async (data: LeaseExtensionFormData) => {
    if (!leaseSummary) return;

    try {
      setIsSubmitting(true);

      // Prepare request payload
      const request: LeaseExtensionRequest = {
        newEndDate: format(data.newEndDate, 'yyyy-MM-dd'),
        rentAdjustmentType: data.rentAdjustmentType,
        renewalType: data.renewalType ?? undefined,
        autoRenewal: data.autoRenewal,
        specialTerms: data.specialTerms ?? undefined,
        paymentDueDate: data.paymentDueDate ?? undefined,
      };

      // Add adjustment value based on type
      switch (data.rentAdjustmentType) {
        case RentAdjustmentType.PERCENTAGE:
          request.adjustmentValue = data.percentageIncrease ?? undefined;
          break;
        case RentAdjustmentType.FLAT:
          request.adjustmentValue = data.flatIncrease ?? undefined;
          break;
        case RentAdjustmentType.CUSTOM:
          request.customRent = data.customRent ?? undefined;
          break;
      }

      const result = await extendLease(tenantId, request);

      setExtensionResult({
        extensionId: result.data.extensionId,
        newEndDate: result.data.newEndDate,
        newRent: result.data.newRent,
        amendmentPdfUrl: result.data.amendmentPdfUrl,
      });

      toast.success('Lease Extended', { description: 'Lease extended successfully!' });
    } catch (error) {
      console.error('Failed to extend lease:', error);
      toast.error('Extension Failed', { description: 'Failed to extend lease. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
          <div>
            <Skeleton className="h-80 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Not found state
  if (!leaseSummary) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Tenant Not Found</AlertTitle>
          <AlertDescription>
            The requested tenant could not be found or you don't have permission to view this
            tenant.
          </AlertDescription>
        </Alert>
        <Button onClick={handleBack} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Expiring Leases
        </Button>
      </div>
    );
  }

  // Success state
  if (extensionResult) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Lease Extended Successfully!</CardTitle>
            <CardDescription>
              The lease has been extended and the tenant will be notified via email.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted rounded-lg p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Extension ID</span>
                <span className="font-mono font-medium">{extensionResult.extensionId}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Tenant</span>
                <span className="font-medium">{leaseSummary.tenantName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Property</span>
                <span className="font-medium">
                  {leaseSummary.propertyName} - Unit {leaseSummary.unitNumber}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">New End Date</span>
                <span className="font-medium">
                  {format(new Date(extensionResult.newEndDate), 'dd MMMM yyyy')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">New Monthly Rent</span>
                <span className="font-medium text-lg">
                  AED {extensionResult.newRent.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {extensionResult.amendmentPdfUrl && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.open(extensionResult.amendmentPdfUrl, '_blank')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Amendment PDF
                </Button>
              )}
              <Button className="flex-1" onClick={() => router.push('/leases/extensions')}>
                View Expiring Leases
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get urgency info
  const daysRemaining = getDaysUntilExpiry(leaseSummary.leaseEndDate);
  const urgencyLevel = getExpiryUrgencyLevel(daysRemaining);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Extend Lease</h1>
          <p className="text-muted-foreground">
            {leaseSummary.tenantName} ({leaseSummary.tenantNumber})
          </p>
        </div>
      </div>

      {/* Urgency Alert */}
      {urgencyLevel === 'critical' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Critical: Lease Expiring Soon!</AlertTitle>
          <AlertDescription>
            This lease expires in {daysRemaining} days. Please process the extension urgently.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Lease Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Current Lease Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    Property
                  </span>
                  <p className="font-medium">{leaseSummary.propertyName}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">Unit</span>
                  <p className="font-medium">
                    Unit {leaseSummary.unitNumber}, Floor {leaseSummary.floor}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" />
                    Tenant
                  </span>
                  <p className="font-medium">{leaseSummary.tenantName}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">Lease Start</span>
                  <p className="font-medium">
                    {format(new Date(leaseSummary.leaseStartDate), 'dd MMM yyyy')}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <CalendarClock className="h-3 w-3" />
                    Lease End
                  </span>
                  <p className="font-medium">
                    {format(new Date(leaseSummary.leaseEndDate), 'dd MMM yyyy')}
                  </p>
                  <Badge
                    variant={urgencyLevel === 'critical' ? 'destructive' : 'secondary'}
                    className="mt-1"
                  >
                    {daysRemaining} days remaining
                  </Badge>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    Current Rent
                  </span>
                  <p className="font-medium text-lg">
                    AED {leaseSummary.baseRent.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Extension Form */}
          <Card>
            <CardHeader>
              <CardTitle>Extension Parameters</CardTitle>
              <CardDescription>Configure the new lease terms</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                  {/* New End Date */}
                  <FormField
                    control={form.control}
                    name="newEndDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>New Lease End Date *</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  'w-full pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value ? (
                                  format(field.value, 'PPP')
                                ) : (
                                  <span>Select new end date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date < new Date() ||
                                date < new Date(leaseSummary.leaseEndDate)
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          Must be after the current lease end date
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Quick Duration Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newDate = addMonths(new Date(leaseSummary.leaseEndDate), 6);
                        form.setValue('newEndDate', newDate);
                      }}
                    >
                      +6 months
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newDate = addYears(new Date(leaseSummary.leaseEndDate), 1);
                        form.setValue('newEndDate', newDate);
                      }}
                    >
                      +1 year
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newDate = addYears(new Date(leaseSummary.leaseEndDate), 2);
                        form.setValue('newEndDate', newDate);
                      }}
                    >
                      +2 years
                    </Button>
                  </div>

                  <Separator />

                  {/* Rent Adjustment Type */}
                  <FormField
                    control={form.control}
                    name="rentAdjustmentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rent Adjustment *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select adjustment type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={RentAdjustmentType.NO_CHANGE}>
                              No Change
                            </SelectItem>
                            <SelectItem value={RentAdjustmentType.PERCENTAGE}>
                              Percentage Increase
                            </SelectItem>
                            <SelectItem value={RentAdjustmentType.FLAT}>
                              Flat Amount Increase
                            </SelectItem>
                            <SelectItem value={RentAdjustmentType.CUSTOM}>
                              Custom Amount
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Conditional Adjustment Value Fields */}
                  {watchedAdjustmentType === RentAdjustmentType.PERCENTAGE && (
                    <FormField
                      control={form.control}
                      name="percentageIncrease"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Percentage Increase (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              placeholder="e.g., 5"
                              {...field}
                              value={field.value ?? ''}
                              onChange={(e) =>
                                field.onChange(e.target.value ? parseFloat(e.target.value) : null)
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            Current: AED {leaseSummary.baseRent.toLocaleString()} → New: AED{' '}
                            {previewRent.toLocaleString()}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {watchedAdjustmentType === RentAdjustmentType.FLAT && (
                    <FormField
                      control={form.control}
                      name="flatIncrease"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Flat Increase (AED)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              placeholder="e.g., 500"
                              {...field}
                              value={field.value ?? ''}
                              onChange={(e) =>
                                field.onChange(e.target.value ? parseFloat(e.target.value) : null)
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            Current: AED {leaseSummary.baseRent.toLocaleString()} → New: AED{' '}
                            {previewRent.toLocaleString()}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {watchedAdjustmentType === RentAdjustmentType.CUSTOM && (
                    <FormField
                      control={form.control}
                      name="customRent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Custom Monthly Rent (AED)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              placeholder="e.g., 5500"
                              {...field}
                              value={field.value ?? ''}
                              onChange={(e) =>
                                field.onChange(e.target.value ? parseFloat(e.target.value) : null)
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            Current: AED {leaseSummary.baseRent.toLocaleString()}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <Separator />

                  {/* Renewal Type */}
                  <FormField
                    control={form.control}
                    name="renewalType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Renewal Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value ?? undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select renewal type (optional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="FIXED_TERM">Fixed Term</SelectItem>
                            <SelectItem value="MONTH_TO_MONTH">Month to Month</SelectItem>
                            <SelectItem value="YEARLY">Yearly</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Auto Renewal */}
                  <FormField
                    control={form.control}
                    name="autoRenewal"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Auto-Renewal</FormLabel>
                          <FormDescription>
                            Automatically renew when the new lease period ends
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Special Terms */}
                  <FormField
                    control={form.control}
                    name="specialTerms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Special Terms (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter any special terms or conditions for this extension..."
                            className="resize-none"
                            rows={3}
                            {...field}
                            value={field.value ?? ''}
                          />
                        </FormControl>
                        <FormDescription>
                          Maximum 2000 characters
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Payment Due Date */}
                  <FormField
                    control={form.control}
                    name="paymentDueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Due Date (Day of Month)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="28"
                            placeholder="e.g., 1"
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) =>
                              field.onChange(e.target.value ? parseInt(e.target.value) : null)
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          Day of month when rent is due (1-28). Leave empty to keep current.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBack}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Extend Lease
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Preview & History */}
        <div className="space-y-6">
          {/* Preview Card */}
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Extension Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current End Date</span>
                  <span className="font-medium">
                    {format(new Date(leaseSummary.leaseEndDate), 'dd MMM yyyy')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">New End Date</span>
                  <span className="font-medium text-primary">
                    {watchedNewEndDate
                      ? format(watchedNewEndDate, 'dd MMM yyyy')
                      : '—'}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Rent</span>
                  <span className="font-medium">
                    AED {leaseSummary.baseRent.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">New Rent</span>
                  <div className="text-right">
                    <span className="font-medium text-lg text-primary">
                      AED {previewRent.toLocaleString()}
                    </span>
                    {rentDifference !== 0 && (
                      <div
                        className={cn(
                          'text-xs',
                          rentDifference > 0 ? 'text-green-600' : 'text-red-600'
                        )}
                      >
                        {rentDifference > 0 ? '+' : ''}
                        {rentPercentChange}% ({rentDifference > 0 ? '+' : ''}AED{' '}
                        {Math.abs(rentDifference).toLocaleString()})
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Extension History */}
          {extensionHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Extension History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {extensionHistory.slice(0, 3).map((ext) => (
                    <div
                      key={ext.id}
                      className="text-sm border-l-2 border-muted pl-3 py-1"
                    >
                      <div className="font-medium">{ext.extensionNumber}</div>
                      <div className="text-muted-foreground">
                        {format(new Date(ext.previousEndDate), 'MMM yyyy')} →{' '}
                        {format(new Date(ext.newEndDate), 'MMM yyyy')}
                      </div>
                      <div className="text-muted-foreground">
                        AED {ext.previousRent.toLocaleString()} → AED{' '}
                        {ext.newRent.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
