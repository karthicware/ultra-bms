'use client';

/**
 * Tenant Checkout Wizard Page
 * Story 3.7: Tenant Checkout and Deposit Refund Processing
 * AC: #1, #2, #3, #8
 *
 * Multi-step wizard for processing tenant checkout with:
 * - Notice details and move-out date selection
 * - Inspection scheduling and checklist
 * - Deposit calculation with deductions
 * - Final settlement and completion
 */

import { useState, useEffect, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Calculator,
  FileCheck,
  AlertCircle,
  User,
  DollarSign,
  Download,
  Check,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import { checkoutService } from '@/services/checkout.service';
import type {
  TenantCheckoutSummary,
  TenantCheckout,
  OutstandingAmounts,
  DepositRefund,
} from '@/types/checkout';
import { CheckoutStatus } from '@/types/checkout';

// Import step components
import { NoticeDetailsStep } from '@/components/checkout/NoticeDetailsStep';
import { InspectionStep } from '@/components/checkout/InspectionStep';
import { DepositCalculationStep } from '@/components/checkout/DepositCalculationStep';
import { FinalSettlementStep } from '@/components/checkout/FinalSettlementStep';

interface PageProps {
  params: Promise<{ tenantId: string }>;
}

// Wizard steps configuration
const WIZARD_STEPS = [
  {
    id: 'notice',
    title: 'Notice Details',
    description: 'Enter checkout notice information',
    icon: Calendar,
  },
  {
    id: 'inspection',
    title: 'Inspection',
    description: 'Schedule and complete unit inspection',
    icon: ClipboardList,
  },
  {
    id: 'deposit',
    title: 'Deposit Calculation',
    description: 'Calculate deposit deductions and refund',
    icon: Calculator,
  },
  {
    id: 'settlement',
    title: 'Final Settlement',
    description: 'Complete checkout and generate documents',
    icon: FileCheck,
  },
];

// Map checkout status to wizard step
function getStepFromStatus(status: CheckoutStatus): number {
  switch (status) {
    case CheckoutStatus.PENDING:
      return 0;
    case CheckoutStatus.INSPECTION_SCHEDULED:
    case CheckoutStatus.INSPECTION_COMPLETE:
      return 1;
    case CheckoutStatus.DEPOSIT_CALCULATED:
    case CheckoutStatus.PENDING_APPROVAL:
    case CheckoutStatus.APPROVED:
    case CheckoutStatus.REFUND_PROCESSING:
    case CheckoutStatus.REFUND_PROCESSED:
      return 2;
    case CheckoutStatus.COMPLETED:
      return 3;
    case CheckoutStatus.ON_HOLD:
      return 0; // Can be any step
    default:
      return 0;
  }
}

export default function CheckoutWizardPage({ params }: PageProps) {
  const { tenantId } = use(params);
  const router = useRouter();

  // State
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [tenantSummary, setTenantSummary] = useState<TenantCheckoutSummary | null>(null);
  const [checkout, setCheckout] = useState<TenantCheckout | null>(null);
  const [outstandingAmounts, setOutstandingAmounts] = useState<OutstandingAmounts | null>(null);
  const [depositRefund, setDepositRefund] = useState<DepositRefund | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  // Load initial data
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Load tenant summary and outstanding amounts
      const [summary, outstanding] = await Promise.all([
        checkoutService.getTenantCheckoutSummary(tenantId),
        checkoutService.getTenantOutstanding(tenantId),
      ]);

      setTenantSummary(summary);
      setOutstandingAmounts(outstanding);

      // Check for existing checkout
      try {
        const existingCheckout = await checkoutService.getCheckoutByTenant(tenantId);
        if (existingCheckout) {
          setCheckout(existingCheckout);

          // Set step based on checkout status
          const stepIndex = getStepFromStatus(existingCheckout.status);
          setCurrentStep(stepIndex);

          // Load deposit refund if available
          if (existingCheckout.depositRefundId) {
            const refund = await checkoutService.getDepositRefund(existingCheckout.id);
            setDepositRefund(refund);
          }

          // Check if completed
          if (existingCheckout.status === CheckoutStatus.COMPLETED) {
            setIsCompleted(true);
          }
        }
      } catch {
        // No existing checkout - start fresh
      }
    } catch (error) {
      console.error('Failed to load checkout data:', error);
      toast.error('Failed to load tenant information');
    } finally {
      setIsLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Refresh checkout data
  const refreshCheckout = async () => {
    if (!checkout?.id) return;

    try {
      const updated = await checkoutService.getCheckout(checkout.id);
      setCheckout(updated);

      if (updated.depositRefundId) {
        const refund = await checkoutService.getDepositRefund(updated.id);
        setDepositRefund(refund);
      }
    } catch (error) {
      console.error('Failed to refresh checkout:', error);
    }
  };

  // Handle checkout initiation
  const handleCheckoutInitiated = (newCheckout: TenantCheckout) => {
    setCheckout(newCheckout);
    setCurrentStep(1);
    toast.success('Checkout initiated successfully!');
  };

  // Handle inspection saved
  const handleInspectionSaved = async () => {
    await refreshCheckout();
    setCurrentStep(2);
    toast.success('Inspection saved successfully!');
  };

  // Handle deposit calculation saved
  const handleDepositSaved = async (refund: DepositRefund) => {
    setDepositRefund(refund);
    await refreshCheckout();
    setCurrentStep(3);
    toast.success('Deposit calculation saved!');
  };

  // Handle checkout completed
  const handleCheckoutCompleted = async () => {
    await refreshCheckout();
    setIsCompleted(true);
    toast.success('Checkout completed successfully!');
  };

  // Navigation
  const canGoBack = currentStep > 0;
  const canGoForward = currentStep < 3 && checkout !== null;

  const handleBack = () => {
    if (canGoBack) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleBackToList = () => {
    router.push('/checkouts');
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
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Skeleton className="h-[600px] w-full" />
          </div>
          <div>
            <Skeleton className="h-80 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Not found state
  if (!tenantSummary) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Tenant Not Found</AlertTitle>
          <AlertDescription>
            The requested tenant could not be found or is not eligible for checkout.
          </AlertDescription>
        </Alert>
        <Button onClick={handleBackToList} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Checkouts
        </Button>
      </div>
    );
  }

  // Completed state
  if (isCompleted && checkout) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-3xl mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Checkout Completed!</CardTitle>
            <CardDescription>
              The tenant checkout has been successfully processed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted rounded-lg p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Checkout Number</span>
                <span className="font-mono font-medium">{checkout.checkoutNumber}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Tenant</span>
                <span className="font-medium">{checkout.tenantName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Property</span>
                <span className="font-medium">
                  {checkout.propertyName} - Unit {checkout.unitNumber}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Move-out Date</span>
                <span className="font-medium">
                  {checkout.actualMoveOutDate
                    ? format(new Date(checkout.actualMoveOutDate), 'dd MMM yyyy')
                    : checkout.expectedMoveOutDate
                      ? format(new Date(checkout.expectedMoveOutDate), 'dd MMM yyyy')
                      : 'N/A'}
                </span>
              </div>
              {depositRefund && (
                <>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Deposit Refund</span>
                    <span className="font-medium text-lg text-green-600">
                      AED {depositRefund.netRefund?.toLocaleString() ?? '0.00'}
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {checkout.hasInspectionReport && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={async () => {
                    try {
                      const url = await checkoutService.getCheckoutDocument(checkout.id, 'inspection-report');
                      window.open(url, '_blank');
                    } catch (error) {
                      console.error('Failed to open inspection report:', error);
                      toast.error('Failed to open inspection report');
                    }
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Inspection Report
                </Button>
              )}
              {checkout.hasDepositStatement && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={async () => {
                    try {
                      const url = await checkoutService.getCheckoutDocument(checkout.id, 'deposit-statement');
                      window.open(url, '_blank');
                    } catch (error) {
                      console.error('Failed to open deposit statement:', error);
                      toast.error('Failed to open deposit statement');
                    }
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Deposit Statement
                </Button>
              )}
              <Button className="flex-1" onClick={handleBackToList}>
                View All Checkouts
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate progress
  const progress = ((currentStep + 1) / WIZARD_STEPS.length) * 100;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleBackToList}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Tenant Checkout</h1>
          <p className="text-muted-foreground">
            {tenantSummary.tenantName} ({tenantSummary.tenantNumber})
          </p>
        </div>
        {checkout && (
          <Badge
            variant={
              checkout.status === CheckoutStatus.ON_HOLD
                ? 'destructive'
                : checkout.status === CheckoutStatus.COMPLETED
                  ? 'default'
                  : 'secondary'
            }
          >
            {checkout.status.replace(/_/g, ' ')}
          </Badge>
        )}
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                Step {currentStep + 1} of {WIZARD_STEPS.length}
              </span>
              <span className="text-muted-foreground">{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />

            {/* Step Indicators */}
            <div className="flex items-center justify-between">
              {WIZARD_STEPS.map((step, index) => {
                const StepIcon = step.icon;
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;
                const isAccessible = checkout !== null || index === 0;

                return (
                  <div
                    key={step.id}
                    className={cn(
                      'flex flex-col items-center gap-2 flex-1',
                      isAccessible ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                    )}
                    onClick={() => isAccessible && setCurrentStep(index)}
                  >
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : isCompleted
                            ? 'bg-green-500 text-white'
                            : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {isCompleted ? <Check className="h-5 w-5" /> : <StepIcon className="h-5 w-5" />}
                    </div>
                    <div className="text-center hidden md:block">
                      <p
                        className={cn(
                          'text-sm font-medium',
                          isActive ? 'text-foreground' : 'text-muted-foreground'
                        )}
                      >
                        {step.title}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Step Content */}
        <div className="lg:col-span-3">
          {currentStep === 0 && (
            <NoticeDetailsStep
              tenantId={tenantId}
              tenantSummary={tenantSummary}
              checkout={checkout}
              outstandingAmounts={outstandingAmounts}
              onCheckoutInitiated={handleCheckoutInitiated}
            />
          )}
          {currentStep === 1 && checkout && (
            <InspectionStep
              checkout={checkout}
              onInspectionSaved={handleInspectionSaved}
              onBack={handleBack}
            />
          )}
          {currentStep === 2 && checkout && (
            <DepositCalculationStep
              checkout={checkout}
              depositRefund={depositRefund}
              outstandingAmounts={outstandingAmounts}
              onDepositSaved={handleDepositSaved}
              onBack={handleBack}
            />
          )}
          {currentStep === 3 && checkout && depositRefund && (
            <FinalSettlementStep
              checkout={checkout}
              depositRefund={depositRefund}
              outstandingAmounts={outstandingAmounts}
              onCompleted={handleCheckoutCompleted}
              onBack={handleBack}
            />
          )}
        </div>

        {/* Sidebar - Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Tenant Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">{tenantSummary.tenantName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID</span>
                <span className="font-mono text-xs">{tenantSummary.tenantNumber}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Property
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Property</span>
                <span className="font-medium">{tenantSummary.propertyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Unit</span>
                <span className="font-medium">{tenantSummary.unitNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Floor</span>
                <span>{tenantSummary.floor ?? 'N/A'}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Lease Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Start Date</span>
                <span>
                  {tenantSummary.leaseStartDate
                    ? format(new Date(tenantSummary.leaseStartDate), 'dd MMM yyyy')
                    : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">End Date</span>
                <span>
                  {tenantSummary.leaseEndDate
                    ? format(new Date(tenantSummary.leaseEndDate), 'dd MMM yyyy')
                    : 'N/A'}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monthly Rent</span>
                <span className="font-medium">
                  AED {tenantSummary.monthlyRent?.toLocaleString() ?? '0'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Security Deposit</span>
                <span className="font-medium">
                  AED {tenantSummary.securityDeposit?.toLocaleString() ?? '0'}
                </span>
              </div>
            </CardContent>
          </Card>

          {outstandingAmounts && outstandingAmounts.totalOutstanding > 0 && (
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-amber-800">
                  <DollarSign className="h-4 w-4" />
                  Outstanding
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between text-amber-900">
                  <span>Total Outstanding</span>
                  <span className="font-bold">
                    AED {outstandingAmounts.totalOutstanding.toLocaleString()}
                  </span>
                </div>
                {outstandingAmounts.unpaidRent > 0 && (
                  <div className="flex justify-between text-amber-800">
                    <span>Unpaid Rent</span>
                    <span>AED {outstandingAmounts.unpaidRent.toLocaleString()}</span>
                  </div>
                )}
                {outstandingAmounts.unpaidUtilities > 0 && (
                  <div className="flex justify-between text-amber-800">
                    <span>Utilities</span>
                    <span>AED {outstandingAmounts.unpaidUtilities.toLocaleString()}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
