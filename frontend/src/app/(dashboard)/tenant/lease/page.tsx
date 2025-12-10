'use client';

/**
 * Tenant Lease Renewal Request Page
 * Story 3.6: Tenant Lease Extension and Renewal (AC: #10)
 *
 * Allows tenants to submit lease renewal requests from their portal
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, differenceInDays } from 'date-fns';
import {
  CalendarClock,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Send,
  Loader2,
  ArrowLeft,
  Home,
  Building2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PageBackButton } from '@/components/common/PageBackButton';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';

import { useAuth } from '@/contexts/auth-context';
import {
  renewalRequestSchema,
  type RenewalRequestFormData,
  renewalRequestFormDefaults,
  getExpiryUrgencyLevel,
} from '@/lib/validations/lease';
import { submitRenewalRequest, getTenantRenewalRequest } from '@/services/lease.service';
import type { RenewalRequest } from '@/types/lease';

/**
 * Renewal Term Option
 */
interface TermOption {
  value: string;
  label: string;
  description: string;
}

const TERM_OPTIONS: TermOption[] = [
  {
    value: '12_MONTHS',
    label: '12 Months',
    description: 'Standard annual renewal',
  },
  {
    value: '24_MONTHS',
    label: '24 Months',
    description: 'Two-year extended lease',
  },
  {
    value: 'OTHER',
    label: 'Other',
    description: 'Discuss custom terms with management',
  },
];

/**
 * Get status badge for renewal request
 */
function getStatusBadge(status: string) {
  switch (status) {
    case 'PENDING':
      return {
        variant: 'default' as const,
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        icon: Clock,
        label: 'Pending Review',
      };
    case 'APPROVED':
      return {
        variant: 'default' as const,
        className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        icon: CheckCircle2,
        label: 'Approved',
      };
    case 'REJECTED':
      return {
        variant: 'destructive' as const,
        className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        icon: AlertCircle,
        label: 'Rejected',
      };
    default:
      return {
        variant: 'secondary' as const,
        className: '',
        icon: FileText,
        label: status,
      };
  }
}

export default function TenantLeaseRenewalPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();

  // State
  const [existingRequest, setExistingRequest] = useState<RenewalRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [newRequestNumber, setNewRequestNumber] = useState<string | null>(null);

  // Form
  const form = useForm<RenewalRequestFormData>({
    resolver: zodResolver(renewalRequestSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: renewalRequestFormDefaults,
  });

  // Route protection: redirect non-tenants
  useEffect(() => {
    if (!isAuthLoading && (!user || user.role !== 'TENANT')) {
      router.push('/login');
    }
  }, [user, isAuthLoading, router]);

  // Load existing renewal request
  useEffect(() => {
    async function loadData() {
      if (!user || user.role !== 'TENANT') return;

      try {
        setIsLoading(true);
        const request = await getTenantRenewalRequest();
        setExistingRequest(request);
      } catch (error) {
        console.error('Failed to load renewal request:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (user) {
      loadData();
    }
  }, [user]);

  // Handle form submission
  const handleSubmit = async (data: RenewalRequestFormData) => {
    try {
      setIsSubmitting(true);
      const result = await submitRenewalRequest({
        preferredTerm: data.preferredTerm,
        comments: data.comments || undefined,
      });

      setNewRequestNumber(result.requestNumber);
      setSubmitSuccess(true);
      toast.success('Request Submitted', { description: 'Renewal request submitted successfully!' });
    } catch (error) {
      console.error('Failed to submit renewal request:', error);
      toast.error('Submission Failed', { description: 'Failed to submit renewal request. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isAuthLoading || isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-3xl space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!user || user.role !== 'TENANT') {
    return null;
  }

  // Mock lease data - in production, this would come from the API
  const leaseEndDate = new Date();
  leaseEndDate.setMonth(leaseEndDate.getMonth() + 2); // Mock: 2 months from now
  const daysRemaining = differenceInDays(leaseEndDate, new Date());
  const urgencyLevel = getExpiryUrgencyLevel(daysRemaining);

  // Success state after submission
  if (submitSuccess && newRequestNumber) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Request Submitted!</CardTitle>
            <CardDescription>
              Your lease renewal request has been submitted successfully.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted rounded-lg p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Request Number</span>
                <span className="font-mono font-medium">{newRequestNumber}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status</span>
                <Badge className="bg-yellow-100 text-yellow-800">
                  <Clock className="h-3 w-3 mr-1" />
                  Pending Review
                </Badge>
              </div>
            </div>

            <Alert>
              <FileText className="h-4 w-4" />
              <AlertTitle>What happens next?</AlertTitle>
              <AlertDescription>
                <ul className="list-disc pl-4 mt-2 space-y-1 text-sm">
                  <li>Our property management team will review your request</li>
                  <li>You'll receive an email notification when a decision is made</li>
                  <li>If approved, we'll contact you to finalize the renewal terms</li>
                </ul>
              </AlertDescription>
            </Alert>

            <Button className="w-full" onClick={() => router.push('/tenant/dashboard')}>
              <Home className="h-4 w-4 mr-2" />
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show existing request if one exists
  if (existingRequest && existingRequest.status === 'PENDING') {
    const statusBadge = getStatusBadge(existingRequest.status);
    const StatusIcon = statusBadge.icon;

    return (
      <div className="container mx-auto p-6 max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <PageBackButton href="/tenant/dashboard" aria-label="Back to dashboard" />
          <div>
            <h1 className="text-2xl font-bold">Lease Renewal</h1>
            <p className="text-muted-foreground">Your current renewal request status</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Existing Renewal Request
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Request Number</span>
                <span className="font-mono font-medium">{existingRequest.requestNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Submitted On</span>
                <span className="font-medium">
                  {format(new Date(existingRequest.requestedAt), 'dd MMM yyyy, hh:mm a')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Preferred Term</span>
                <span className="font-medium">
                  {existingRequest.preferredTerm.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={statusBadge.variant} className={statusBadge.className}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusBadge.label}
                </Badge>
              </div>
              {existingRequest.comments && (
                <>
                  <Separator />
                  <div>
                    <span className="text-sm text-muted-foreground">Your Comments:</span>
                    <p className="mt-1 text-sm">{existingRequest.comments}</p>
                  </div>
                </>
              )}
            </div>

            <Alert>
              <Clock className="h-4 w-4" />
              <AlertTitle>Request Under Review</AlertTitle>
              <AlertDescription>
                Your renewal request is currently being reviewed by our property management team.
                You will receive an email notification once a decision has been made.
              </AlertDescription>
            </Alert>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push('/tenant/dashboard')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show processed request status
  if (existingRequest && existingRequest.status !== 'PENDING') {
    const statusBadge = getStatusBadge(existingRequest.status);
    const StatusIcon = statusBadge.icon;

    return (
      <div className="container mx-auto p-6 max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <PageBackButton href="/tenant/dashboard" aria-label="Back to dashboard" />
          <div>
            <h1 className="text-2xl font-bold">Lease Renewal</h1>
            <p className="text-muted-foreground">Your renewal request has been processed</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div
              className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                existingRequest.status === 'APPROVED' ? 'bg-green-100' : 'bg-red-100'
              }`}
            >
              <StatusIcon
                className={`h-8 w-8 ${
                  existingRequest.status === 'APPROVED' ? 'text-green-600' : 'text-red-600'
                }`}
              />
            </div>
            <CardTitle className="text-center text-xl">
              {existingRequest.status === 'APPROVED'
                ? 'Renewal Request Approved!'
                : 'Renewal Request Not Approved'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Request Number</span>
                <span className="font-mono font-medium">{existingRequest.requestNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={statusBadge.variant} className={statusBadge.className}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusBadge.label}
                </Badge>
              </div>
              {existingRequest.processedAt && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Processed On</span>
                  <span className="font-medium">
                    {format(new Date(existingRequest.processedAt), 'dd MMM yyyy')}
                  </span>
                </div>
              )}
            </div>

            {existingRequest.status === 'APPROVED' ? (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Next Steps</AlertTitle>
                <AlertDescription className="text-green-700">
                  Our property management team will contact you shortly to finalize your lease
                  extension details and discuss any rent adjustments.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                {existingRequest.rejectedReason && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Reason</AlertTitle>
                    <AlertDescription>{existingRequest.rejectedReason}</AlertDescription>
                  </Alert>
                )}
                <p className="text-sm text-muted-foreground">
                  If you have questions about this decision or would like to discuss alternative
                  options, please contact our property management office.
                </p>
              </>
            )}

            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push('/tenant/dashboard')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // New request form
  return (
    <div className="container mx-auto p-6 max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <PageBackButton href="/tenant/dashboard" aria-label="Back to dashboard" />
        <div>
          <h1 className="text-2xl font-bold">Request Lease Renewal</h1>
          <p className="text-muted-foreground">Submit a request to renew your lease</p>
        </div>
      </div>

      {/* Urgency Alert */}
      {urgencyLevel === 'critical' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Lease Expiring Soon!</AlertTitle>
          <AlertDescription>
            Your lease expires in {daysRemaining} days. Please submit your renewal request
            immediately.
          </AlertDescription>
        </Alert>
      )}

      {urgencyLevel === 'urgent' && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-800">Lease Expiring</AlertTitle>
          <AlertDescription className="text-orange-700">
            Your lease expires in {daysRemaining} days. We recommend submitting your renewal
            request soon.
          </AlertDescription>
        </Alert>
      )}

      {/* Lease Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Current Lease Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-muted-foreground">Lease End Date</span>
              <p className="font-medium">{format(leaseEndDate, 'dd MMMM yyyy')}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Days Remaining</span>
              <div className="flex items-center gap-2">
                <Badge
                  variant={urgencyLevel === 'critical' ? 'destructive' : 'secondary'}
                  className={
                    urgencyLevel === 'urgent'
                      ? 'bg-orange-100 text-orange-800'
                      : urgencyLevel === 'warning'
                        ? 'bg-yellow-100 text-yellow-800'
                        : ''
                  }
                >
                  <CalendarClock className="h-3 w-3 mr-1" />
                  {daysRemaining} days
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Renewal Request Form */}
      <Card>
        <CardHeader>
          <CardTitle>Renewal Request</CardTitle>
          <CardDescription>
            Let us know your preferred renewal terms. Our team will review your request and get
            back to you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Preferred Term */}
              <FormField
                control={form.control}
                name="preferredTerm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Renewal Term *</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="space-y-3"
                      >
                        {TERM_OPTIONS.map((option) => (
                          <div
                            key={option.value}
                            className="flex items-start space-x-3 border rounded-lg p-4 hover:bg-muted/50 cursor-pointer"
                          >
                            <RadioGroupItem value={option.value} id={option.value} />
                            <label htmlFor={option.value} className="flex-1 cursor-pointer">
                              <div className="font-medium">{option.label}</div>
                              <div className="text-sm text-muted-foreground">
                                {option.description}
                              </div>
                            </label>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Comments */}
              <FormField
                control={form.control}
                name="comments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Comments (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any specific requests or questions about your renewal..."
                        className="resize-none"
                        rows={4}
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormDescription>Maximum 500 characters</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Renewal Request
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
