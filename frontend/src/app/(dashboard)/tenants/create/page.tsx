/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

/**
 * Tenant Onboarding Wizard
 * 6-step multi-step form for complete tenant registration
 * SCP-2025-12-07: Reduced from 7 steps to 6 - Payment Schedule (Step 5) merged into Rent Breakdown (Step 3)
 * Redesigned with modern UX and visual feedback
 */

import { Suspense, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

import {
  ArrowLeft,
  ArrowRight,
  User,
  FileText,
  DollarSign,
  Car,
  CreditCard,
  Upload,
  CheckCircle2,
  Loader2,
  Sparkles,
  Building2,
  Calendar,
  Mail,
  Phone,
  Home,
  Clock,
  Shield,
  ChevronRight,
  MapPin,
  Banknote,
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { PersonalInfoStep } from '@/components/tenants/PersonalInfoStep';
import { LeaseInfoStep } from '@/components/tenants/LeaseInfoStep';
import { RentBreakdownStep } from '@/components/tenants/RentBreakdownStep';
import { ParkingAllocationStep } from '@/components/tenants/ParkingAllocationStep';
// SCP-2025-12-07: PaymentScheduleStep removed - Payment Due Date moved to Step 3 (Rent Breakdown)
import { DocumentUploadStep } from '@/components/tenants/DocumentUploadStep';
import { ReviewSubmitStep } from '@/components/tenants/ReviewSubmitStep';
import { PageBackButton } from '@/components/common/PageBackButton';

import { createTenant, getLeadConversionData } from '@/services/tenant.service';
import {
  calculateLeaseDuration,
  calculateTotalMonthlyRent,
} from '@/lib/validations/tenant';

import type {
  PersonalInfoFormData,
  LeaseInfoFormData,
  RentBreakdownFormData,
  ParkingAllocationFormData,
  // SCP-2025-12-07: PaymentScheduleFormData removed - Payment Due Date moved to rentBreakdown
  TenantDocumentUploadFormData,
  LeaseType,
  PaymentMethod,
} from '@/types/tenant';
import { FirstMonthPaymentMethod, type ChequeBreakdownItem } from '@/types/quotations';

// Combined form data for all steps
// SCP-2025-12-07: Removed paymentSchedule - Payment Due Date moved to rentBreakdown
interface TenantOnboardingFormData {
  personalInfo: PersonalInfoFormData;
  leaseInfo: LeaseInfoFormData & {
    // SCP-2025-12-07: Store property/unit display names for Lease Preview
    propertyName?: string;
    unitNumber?: string;
  };
  // SCP-2025-12-07: Extended to include cheque breakdown fields and paymentDueDate (moved from Step 5)
  rentBreakdown: RentBreakdownFormData & {
    yearlyRentAmount?: number;
    numberOfCheques?: number;
    firstMonthPaymentMethod?: FirstMonthPaymentMethod;
    chequeBreakdown?: ChequeBreakdownItem[];
    firstMonthTotal?: number;
    paymentDueDate?: number; // Day of month (1-31), defaults to 5
  };
  parkingAllocation: ParkingAllocationFormData;
  documentUpload: TenantDocumentUploadFormData;
}

// SCP-2025-12-06: Preloaded document paths from quotation
interface PreloadedDocuments {
  emiratesIdFrontPath?: string;
  emiratesIdBackPath?: string;
  passportFrontPath?: string;
  passportBackPath?: string;
}

// SCP-2025-12-07: Reduced from 7 to 6 steps - Payment Schedule merged into Rent Breakdown
const WIZARD_STEPS = [
  { step: 1, title: 'Personal Info', description: 'Basic tenant details', icon: User },
  { step: 2, title: 'Lease Info', description: 'Property & lease terms', icon: FileText },
  { step: 3, title: 'Rent', description: 'Payment breakdown', icon: DollarSign },
  { step: 4, title: 'Parking', description: 'Parking allocation', icon: Car },
  { step: 5, title: 'Documents', description: 'Upload files', icon: Upload },
  { step: 6, title: 'Review', description: 'Final review', icon: CheckCircle2 },
];

function CreateTenantWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentStep, setCurrentStep] = useState('1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingConversionData, setIsLoadingConversionData] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  // SCP-2025-12-06: Preloaded document paths from quotation
  const [preloadedDocuments, setPreloadedDocuments] = useState<PreloadedDocuments>({});
  // Ref to prevent duplicate toast on React Strict Mode double-mount
  const dataLoadedRef = useRef(false);

  // Check for lead conversion query params
  const fromLead = searchParams?.get('fromLead');
  const fromQuotation = searchParams?.get('fromQuotation');
  const isLeadConversion = !!(fromLead && fromQuotation);

  // Form state for all steps
  // SCP-2025-12-07: DOB should be undefined/null initially so user must enter it
  const [formData, setFormData] = useState<TenantOnboardingFormData>({
    personalInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: undefined as unknown as Date, // User must enter DOB manually
      nationalId: '',
      nationality: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
    },
    leaseInfo: {
      propertyId: '',
      unitId: '',
      // SCP-2025-12-07: Leave dates undefined so LeaseInfoStep uses its own defaults (today + 1 year)
      leaseStartDate: undefined as unknown as Date,
      leaseEndDate: undefined as unknown as Date,
      leaseDuration: 0,
      // SCP-2025-12-07: Default to YEARLY lease type
      leaseType: 'YEARLY' as LeaseType,
      renewalOption: false,
    },
    rentBreakdown: {
      baseRent: 0,
      adminFee: 0,
      serviceCharge: 0,
      securityDeposit: 0,
      totalMonthlyRent: 0,
      // SCP-2025-12-07: paymentDueDate moved here from Step 5, default to 5th of month
      paymentDueDate: 5,
    },
    parkingAllocation: {
      parkingSpots: 0,
      parkingFeePerSpot: 0,
      spotNumbers: '',
      mulkiyaFile: null,
    },
    // SCP-2025-12-07: paymentSchedule removed - Payment Due Date moved to rentBreakdown
    documentUpload: {
      emiratesIdFile: null,
      passportFile: null,
      visaFile: null,
      signedLeaseFile: null,
      additionalFiles: [],
    },
  });

  // Load conversion data if coming from lead
  useEffect(() => {
    async function loadConversionData() {
      if (!fromLead || !fromQuotation) return;
      // Prevent duplicate toast on React Strict Mode double-mount
      if (dataLoadedRef.current) return;
      dataLoadedRef.current = true;

      setIsLoadingConversionData(true);
      try {
        const conversionData = await getLeadConversionData(fromLead, fromQuotation);

        // Pre-populate personal info from lead
        setFormData((prev) => ({
          ...prev,
          personalInfo: {
            ...prev.personalInfo,
            firstName: conversionData.firstName,
            lastName: conversionData.lastName,
            email: conversionData.email,
            phone: conversionData.phone || conversionData.contactNumber || '',
            nationalId: conversionData.nationalId || conversionData.emiratesId || '',
            nationality: conversionData.nationality,
          },
          leaseInfo: {
            ...prev.leaseInfo,
            propertyId: conversionData.propertyId,
            unitId: conversionData.unitId,
          },
          rentBreakdown: {
            ...prev.rentBreakdown,
            baseRent: conversionData.baseRent,
            serviceCharge: conversionData.serviceCharge || conversionData.serviceCharges || 0,
            adminFee: conversionData.adminFee,
            securityDeposit: conversionData.securityDeposit,
            totalMonthlyRent: conversionData.baseRent + (conversionData.serviceCharge || conversionData.serviceCharges || 0),
            // SCP-2025-12-07: Populate cheque breakdown fields from quotation
            yearlyRentAmount: conversionData.yearlyRentAmount || (conversionData.baseRent * 12),
            numberOfCheques: conversionData.numberOfCheques || 1,
            firstMonthPaymentMethod: conversionData.firstMonthPaymentMethod === 'CASH'
              ? FirstMonthPaymentMethod.CASH
              : FirstMonthPaymentMethod.CHEQUE,
            // SCP-2025-12-07: paymentDueDate moved here from paymentSchedule
            // Extract day from first cheque due date, default to 5
            paymentDueDate: (() => {
              if (conversionData.chequeBreakdown) {
                try {
                  const breakdown = JSON.parse(conversionData.chequeBreakdown);
                  if (breakdown.length > 0 && breakdown[0].dueDate) {
                    const dueDate = new Date(breakdown[0].dueDate);
                    return dueDate.getDate();
                  }
                } catch (e) {
                  console.error('Failed to parse cheque breakdown:', e);
                }
              }
              return 5;
            })(),
          },
          parkingAllocation: {
            ...prev.parkingAllocation,
            parkingSpots: conversionData.parkingSpots || (conversionData.parkingSpotId ? 1 : 0),
            parkingFeePerSpot: conversionData.parkingFeePerSpot || conversionData.parkingFee || 0,
            // SCP-2025-12-07: Pre-populate parkingSpotId from quotation for parking spot blocking
            parkingSpotId: conversionData.parkingSpotId || undefined,
          },
        }));

        // SCP-2025-12-06: Store preloaded document paths from quotation
        if (conversionData.emiratesIdFrontPath || conversionData.passportFrontPath) {
          setPreloadedDocuments({
            emiratesIdFrontPath: conversionData.emiratesIdFrontPath,
            emiratesIdBackPath: conversionData.emiratesIdBackPath,
            passportFrontPath: conversionData.passportFrontPath,
            passportBackPath: conversionData.passportBackPath,
          });
        }

        toast.success('Data Loaded', { description: 'Lead data and documents loaded successfully' });
      } catch (error) {
        console.error('Failed to load conversion data:', error);
        toast.error('Load Error', { description: 'Failed to load lead data' });
      } finally {
        setIsLoadingConversionData(false);
      }
    }

    loadConversionData();
  }, [fromLead, fromQuotation]);

  // Calculate progress percentage
  const progressPercent = ((parseInt(currentStep) - 1) / (WIZARD_STEPS.length - 1)) * 100;

  // Navigate to next step
  const goToNextStep = () => {
    const nextStepIndex = parseInt(currentStep);
    if (nextStepIndex < WIZARD_STEPS.length) {
      setCurrentStep((nextStepIndex + 1).toString());
    }
  };

  // Navigate to previous step
  const goToPreviousStep = () => {
    const prevStepIndex = parseInt(currentStep);
    if (prevStepIndex > 1) {
      setCurrentStep((prevStepIndex - 1).toString());
    }
  };

  // SCP-2025-12-08: Handle back navigation with data saving (same behavior as Next button)
  // This saves the current step's data before navigating back
  // SCP-2025-12-08: Fixed to use single setFormData call to avoid stale state issues
  const handleBackWithSave = (stepData: any, step: number) => {
    // Update form data based on step - use single setFormData to avoid race conditions
    setFormData((prev) => {
      let newState = { ...prev };

      // Update the step-specific data
      const stepKey = {
        1: 'personalInfo',
        2: 'leaseInfo',
        3: 'rentBreakdown',
        4: 'parkingAllocation',
        5: 'documentUpload',
      }[step] as keyof TenantOnboardingFormData;

      if (stepKey && stepData) {
        newState = {
          ...newState,
          [stepKey]: stepData,
        };

        // Calculate lease duration if lease info step
        if (step === 2 && stepData.leaseStartDate && stepData.leaseEndDate) {
          const duration = calculateLeaseDuration(stepData.leaseStartDate, stepData.leaseEndDate);
          newState = {
            ...newState,
            leaseInfo: {
              ...stepData,
              leaseDuration: duration,
            },
          };
        }

        // Calculate total monthly rent if rent breakdown or parking step
        if (step === 3 || step === 4) {
          // Use stepData for the current step, prev for the other step
          const baseRent = step === 3 ? stepData.baseRent : prev.rentBreakdown.baseRent;
          const serviceCharge = step === 3 ? stepData.serviceCharge : prev.rentBreakdown.serviceCharge;
          // For step 4 (parking), use the NEW parking data from stepData
          const parkingFee = step === 4
            ? (stepData.parkingFeePerSpot * stepData.parkingSpots)
            : (prev.parkingAllocation.parkingFeePerSpot * prev.parkingAllocation.parkingSpots);

          const totalMonthlyRent = calculateTotalMonthlyRent(
            baseRent,
            serviceCharge,
            parkingFee
          );

          newState = {
            ...newState,
            rentBreakdown: {
              ...newState.rentBreakdown,
              totalMonthlyRent,
            },
          };
        }
      }

      return newState;
    });

    // Navigate to previous step
    goToPreviousStep();
  };

  // Handle step completion and navigation
  // SCP-2025-12-07: Updated step mapping - removed step 5 (paymentSchedule), renumbered steps
  const handleStepComplete = (stepData: any, step: number) => {
    // Update form data based on step
    const stepKey = {
      1: 'personalInfo',
      2: 'leaseInfo',
      3: 'rentBreakdown',
      4: 'parkingAllocation',
      5: 'documentUpload', // Was step 6
    }[step] as keyof TenantOnboardingFormData;

    if (stepKey) {
      setFormData((prev) => ({
        ...prev,
        [stepKey]: stepData,
      }));
    }

    // Mark step as completed
    if (!completedSteps.includes(step)) {
      setCompletedSteps((prev) => [...prev, step]);
    }

    // Calculate lease duration if lease info step
    if (step === 2 && stepData.leaseStartDate && stepData.leaseEndDate) {
      const duration = calculateLeaseDuration(stepData.leaseStartDate, stepData.leaseEndDate);
      setFormData((prev) => ({
        ...prev,
        leaseInfo: {
          ...stepData,
          leaseDuration: duration,
        },
      }));
    }

    // Calculate total monthly rent if rent breakdown or parking step
    if (step === 3 || step === 4) {
      const baseRent = step === 3 ? stepData.baseRent : formData.rentBreakdown.baseRent;
      const serviceCharge = step === 3 ? stepData.serviceCharge : formData.rentBreakdown.serviceCharge;
      const parkingFee = step === 4 ? (stepData.parkingFeePerSpot * stepData.parkingSpots) : (formData.parkingAllocation.parkingFeePerSpot * formData.parkingAllocation.parkingSpots);

      const totalMonthlyRent = calculateTotalMonthlyRent(
        baseRent,
        serviceCharge,
        parkingFee
      );

      setFormData((prev) => ({
        ...prev,
        rentBreakdown: {
          ...prev.rentBreakdown,
          totalMonthlyRent,
        },
      }));
    }

    // SCP-2025-12-07: When parking step (4) completes, recalculate firstMonthTotal
    // to reflect the updated parking fee in the payment breakdown
    if (step === 4) {
      const currentParkingFee = stepData.parkingFeePerSpot * stepData.parkingSpots;
      const previousParkingFee = formData.parkingAllocation.parkingFeePerSpot * formData.parkingAllocation.parkingSpots;
      const parkingDifference = currentParkingFee - previousParkingFee;

      // Only update if firstMonthTotal exists and parking changed
      if (formData.rentBreakdown.firstMonthTotal && parkingDifference !== 0) {
        setFormData((prev) => ({
          ...prev,
          rentBreakdown: {
            ...prev.rentBreakdown,
            firstMonthTotal: (prev.rentBreakdown.firstMonthTotal || 0) + parkingDifference,
          },
        }));
      }
    }

    // Navigate to next step (except for last step)
    // SCP-2025-12-07: Updated to 6 steps
    if (step < 6) {
      goToNextStep();
    }
  };

  // Handle final submission
  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Prepare FormData for multipart/form-data request
      const submitData = new FormData();

      // Personal Info
      submitData.append('firstName', formData.personalInfo.firstName);
      submitData.append('lastName', formData.personalInfo.lastName);
      submitData.append('email', formData.personalInfo.email);
      submitData.append('phone', formData.personalInfo.phone);
      // SCP-2025-12-07: Only submit DOB if it's set
      // SCP-2025-12-08: Format as YYYY-MM-DD for backend LocalDate parsing
      if (formData.personalInfo.dateOfBirth) {
        submitData.append('dateOfBirth', formData.personalInfo.dateOfBirth.toISOString().split('T')[0]);
      }
      submitData.append('nationalId', formData.personalInfo.nationalId);
      submitData.append('nationality', formData.personalInfo.nationality);
      submitData.append('emergencyContactName', formData.personalInfo.emergencyContactName);
      submitData.append('emergencyContactPhone', formData.personalInfo.emergencyContactPhone);

      // Lease Info
      submitData.append('propertyId', formData.leaseInfo.propertyId);
      submitData.append('unitId', formData.leaseInfo.unitId);
      // SCP-2025-12-08: Format as YYYY-MM-DD for backend LocalDate parsing
      // SCP-2025-12-09: Ensure leaseStartDate is at least today (backend has @FutureOrPresent validation)
      // This handles edge case where quotation date becomes past date by the time user submits
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format

      // Get lease start date as string (YYYY-MM-DD)
      let leaseStartDateStr = formData.leaseInfo.leaseStartDate
        ? (formData.leaseInfo.leaseStartDate instanceof Date
            ? formData.leaseInfo.leaseStartDate.toISOString().split('T')[0]
            : String(formData.leaseInfo.leaseStartDate).split('T')[0])
        : '';

      // If lease start date is in the past, use today instead
      if (leaseStartDateStr && leaseStartDateStr < todayStr) {
        console.log('[TenantCreate] Adjusting past leaseStartDate:', leaseStartDateStr, '→', todayStr);
        leaseStartDateStr = todayStr;
      }

      submitData.append('leaseStartDate', leaseStartDateStr);
      submitData.append('leaseEndDate', formData.leaseInfo.leaseEndDate?.toISOString().split('T')[0] || '');
      submitData.append('leaseType', formData.leaseInfo.leaseType);
      submitData.append('renewalOption', formData.leaseInfo.renewalOption.toString());

      // Rent Breakdown
      submitData.append('baseRent', formData.rentBreakdown.baseRent.toString());
      submitData.append('adminFee', formData.rentBreakdown.adminFee.toString());
      submitData.append('serviceCharge', formData.rentBreakdown.serviceCharge.toString());
      submitData.append('securityDeposit', formData.rentBreakdown.securityDeposit.toString());

      // Parking Allocation
      submitData.append('parkingSpots', formData.parkingAllocation.parkingSpots.toString());
      submitData.append('parkingFeePerSpot', formData.parkingAllocation.parkingFeePerSpot.toString());
      if (formData.parkingAllocation.spotNumbers) {
        submitData.append('spotNumbers', formData.parkingAllocation.spotNumbers);
      }
      // SCP-2025-12-07: Include parkingSpotId for parking spot blocking (from quotation or selection)
      const parkingSpotId = (formData.parkingAllocation as any).parkingSpotId;
      if (parkingSpotId) {
        submitData.append('parkingSpotId', parkingSpotId);
      }
      // Include spot IDs for parking assignment (Story 3.8 integration)
      const spotIds = (formData.parkingAllocation as any).spotIds;
      if (spotIds && Array.isArray(spotIds) && spotIds.length > 0) {
        spotIds.forEach((spotId: string) => {
          submitData.append('parkingSpotIds', spotId);
        });
      }

      // Payment Schedule
      // SCP-2025-12-07: paymentDueDate moved from paymentSchedule to rentBreakdown (Step 3)
      // Default to 5 if not set
      submitData.append('paymentDueDate', (formData.rentBreakdown.paymentDueDate || 5).toString());

      // Documents
      // SCP-2025-12-07: Handle separate front/back uploads with preloaded document replacement
      // Emirates ID Front: Use new file if uploaded, else use preloaded path
      if (formData.documentUpload.emiratesIdFile) {
        submitData.append('emiratesIdFile', formData.documentUpload.emiratesIdFile);
      } else if (preloadedDocuments.emiratesIdFrontPath) {
        submitData.append('emiratesIdFrontPath', preloadedDocuments.emiratesIdFrontPath);
      }
      // Emirates ID Back: Use new file if uploaded, else use preloaded path
      if (formData.documentUpload.emiratesIdBackFile) {
        submitData.append('emiratesIdBackFile', formData.documentUpload.emiratesIdBackFile);
      } else if (preloadedDocuments.emiratesIdBackPath) {
        submitData.append('emiratesIdBackPath', preloadedDocuments.emiratesIdBackPath);
      }
      // Passport Front: Use new file if uploaded, else use preloaded path
      if (formData.documentUpload.passportFile) {
        submitData.append('passportFile', formData.documentUpload.passportFile);
      } else if (preloadedDocuments.passportFrontPath) {
        submitData.append('passportFrontPath', preloadedDocuments.passportFrontPath);
      }
      // Passport Back: Use new file if uploaded, else use preloaded path
      if (formData.documentUpload.passportBackFile) {
        submitData.append('passportBackFile', formData.documentUpload.passportBackFile);
      } else if (preloadedDocuments.passportBackPath) {
        submitData.append('passportBackPath', preloadedDocuments.passportBackPath);
      }
      if (formData.documentUpload.visaFile) {
        submitData.append('visaFile', formData.documentUpload.visaFile);
      }
      if (formData.documentUpload.signedLeaseFile) {
        submitData.append('signedLeaseFile', formData.documentUpload.signedLeaseFile);
      }
      if (formData.parkingAllocation.mulkiyaFile) {
        submitData.append('mulkiyaFile', formData.parkingAllocation.mulkiyaFile);
      }
      if (formData.documentUpload.additionalFiles && formData.documentUpload.additionalFiles.length > 0) {
        formData.documentUpload.additionalFiles.forEach((file) => {
          submitData.append(`additionalFiles`, file);
        });
      }

      // Lead conversion data
      if (fromLead) {
        submitData.append('leadId', fromLead);
      }
      if (fromQuotation) {
        submitData.append('quotationId', fromQuotation);
      }

      // Submit to API
      const result = await createTenant(submitData);

      toast.success('Tenant Registered', { description: `Welcome email sent to ${formData.personalInfo.email}` });

      // Redirect to tenant detail page
      router.push(`/tenants/${result.id}`);
    } catch (error: any) {
      console.error('Failed to create tenant:', error);
      toast.error('Registration Failed', { description: error.response?.data?.error?.message || 'Failed to create tenant. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoadingConversionData) {
    return (
      <TooltipProvider>
        <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-background">
          <div className="container mx-auto py-10 max-w-7xl">
            <Card className="border-none shadow-xl">
              <CardContent className="flex flex-col items-center justify-center py-20">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                  <div className="relative rounded-full bg-primary/10 p-6">
                    <Loader2 className="h-12 w-12 text-primary animate-spin" />
                  </div>
                </div>
                <h3 className="mt-6 text-xl font-semibold">Loading Lead Data</h3>
                <p className="mt-2 text-muted-foreground">
                  Preparing your pre-filled onboarding form...
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-background" data-testid="wizard-tenant-create">
        {/* Hero Header */}
        <div className="relative overflow-hidden border-b bg-gradient-to-br from-primary/10 via-primary/5 to-background">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
          <div className="absolute top-0 right-0 -mt-24 -mr-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 -mb-24 -ml-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

          <div className="relative container mx-auto max-w-7xl px-4 py-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <PageBackButton href="/tenants" aria-label="Back to tenants" />
                  <div>
                    <div className="flex items-center gap-3">
                      <h1 className="text-3xl font-bold tracking-tight">New Tenant Onboarding</h1>
                      {isLeadConversion && (
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20" data-testid="badge-prefilled-from-quotation">
                          <Sparkles className="h-3 w-3 mr-1" />
                          Pre-filled
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground mt-1">
                      Complete the wizard to register a new tenant and set up their lease
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress Overview */}
              <div className="flex items-center gap-6 bg-background/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">{parseInt(currentStep)}</div>
                  <div className="text-xs text-muted-foreground">of {WIZARD_STEPS.length}</div>
                </div>
                <Separator orientation="vertical" className="h-12" />
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{Math.round(progressPercent)}%</span>
                  </div>
                  <Progress value={progressPercent} className="w-32 h-2" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto max-w-7xl px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-12 gap-4 lg:gap-6">
            {/* Left Sidebar - Step Navigation */}
            <div className="lg:col-span-1 xl:col-span-2">
              <Card className="sticky top-8 shadow-lg border-0 overflow-hidden">
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-4 border-b">
                  <h3 className="font-semibold text-sm text-primary">Onboarding Steps</h3>
                </div>
                <CardContent className="p-0">
                  <nav className="divide-y">
                    {WIZARD_STEPS.map(({ step, title, description, icon: Icon }) => {
                      const isActive = parseInt(currentStep) === step;
                      const isCompleted = completedSteps.includes(step) || parseInt(currentStep) > step;
                      const isClickable = isCompleted || parseInt(currentStep) >= step;

                      return (
                        <button
                          key={step}
                          onClick={() => isClickable && setCurrentStep(step.toString())}
                          disabled={!isClickable}
                          className={`
                            w-full flex items-center gap-4 p-4 text-left transition-all
                            ${isActive
                              ? 'bg-primary/5 border-l-4 border-l-primary'
                              : 'hover:bg-muted/50 border-l-4 border-l-transparent'
                            }
                            ${!isClickable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                          `}
                        >
                          <div className={`
                            flex items-center justify-center h-10 w-10 rounded-full shrink-0 transition-all
                            ${isCompleted
                              ? 'bg-emerald-500 text-white'
                              : isActive
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground'
                            }
                          `}>
                            {isCompleted ? (
                              <CheckCircle2 className="h-5 w-5" />
                            ) : (
                              <Icon className="h-5 w-5" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`font-medium text-sm truncate ${isActive ? 'text-primary' : ''}`}>
                              {title}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {description}
                            </div>
                          </div>
                          {isActive && (
                            <ChevronRight className="h-4 w-4 text-primary shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </nav>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-2 xl:col-span-7">
              <div
                key={currentStep}
                className="animate-in fade-in-0 slide-in-from-right-4 duration-300"
              >
                <Tabs value={currentStep} className="w-full">
                    {/* Step 1: Personal Information */}
                    <TabsContent value="1" className="mt-0">
                      <PersonalInfoStep
                        data={formData.personalInfo}
                        onComplete={(data) => handleStepComplete(data, 1)}
                        onBack={() => router.push('/tenants')}
                      />
                    </TabsContent>

                    {/* Step 2: Lease Information */}
                    <TabsContent value="2" className="mt-0">
                      <LeaseInfoStep
                        data={formData.leaseInfo}
                        onComplete={(data) => handleStepComplete(data, 2)}
                        onBack={(data) => handleBackWithSave(data, 2)}
                        isLeadConversion={isLeadConversion}
                      />
                    </TabsContent>

                    {/* Step 3: Rent Breakdown - SCP-2025-12-07: Pass lease start date for cheque schedule */}
                    <TabsContent value="3" className="mt-0">
                      <RentBreakdownStep
                        data={formData.rentBreakdown}
                        onComplete={(data) => handleStepComplete(data, 3)}
                        onBack={(data) => handleBackWithSave(data, 3)}
                        leaseStartDate={formData.leaseInfo.leaseStartDate}
                        parkingFee={formData.parkingAllocation.parkingFeePerSpot * formData.parkingAllocation.parkingSpots}
                        leaseType={formData.leaseInfo.leaseType}
                      />
                    </TabsContent>

                    {/* Step 4: Parking Allocation */}
                    <TabsContent value="4" className="mt-0">
                      <ParkingAllocationStep
                        data={formData.parkingAllocation}
                        onComplete={(data) => handleStepComplete(data, 4)}
                        onBack={(data) => handleBackWithSave(data, 4)}
                        propertyId={formData.leaseInfo.propertyId}
                        leaseType={formData.leaseInfo.leaseType}
                      />
                    </TabsContent>

                    {/* SCP-2025-12-07: Step 5 (Payment Schedule) removed - merged into Step 3 */}

                    {/* Step 5: Document Upload (was Step 6) */}
                    <TabsContent value="5" className="mt-0">
                      <DocumentUploadStep
                        data={formData.documentUpload}
                        onComplete={(data) => handleStepComplete(data, 5)}
                        onBack={(data) => handleBackWithSave(data, 5)}
                        preloadedDocuments={preloadedDocuments}
                      />
                    </TabsContent>

                    {/* Step 6: Review and Submit (was Step 7) */}
                    <TabsContent value="6" className="mt-0">
                      <ReviewSubmitStep
                        formData={formData}
                        onSubmit={handleFinalSubmit}
                        onBack={goToPreviousStep}
                        onEdit={(step) => setCurrentStep(step.toString())}
                        isSubmitting={isSubmitting}
                        preloadedDocuments={preloadedDocuments}
                      />
                    </TabsContent>
                  </Tabs>
              </div>
            </div>

            {/* Right Sidebar - Financial Summary (SCP-2025-12-07: Redesigned to match quotation style) */}
            <div className="lg:col-span-1 xl:col-span-3">
              <div className="sticky top-8 relative overflow-hidden rounded-3xl border border-primary/10 bg-gradient-to-br from-card via-card to-primary/5 p-6 shadow-xl">
                {/* Decorative elements */}
                <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-primary/5 blur-3xl" />
                <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />

                <div className="relative">
                  {/* Header - Financial Summary */}
                  <div className="flex items-center gap-2 mb-6">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                      Financial Summary
                    </span>
                  </div>

                  {/* Valid Until / Lease End Date Section */}
                  {formData.leaseInfo.leaseEndDate && (
                    <div className="rounded-2xl bg-muted/50 p-4 mb-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background shadow-sm">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-muted-foreground">Valid Until</p>
                          <p className="font-semibold">
                            {format(formData.leaseInfo.leaseEndDate, 'MMMM do, yyyy')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Annual Rent Section - Main highlight like quotation screenshot */}
                  {(formData.rentBreakdown.yearlyRentAmount || formData.rentBreakdown.numberOfCheques) && (formData.rentBreakdown.yearlyRentAmount ?? 0) > 0 && (
                    <div className="rounded-2xl bg-primary/5 border border-primary/10 p-4 mb-4">
                      {/* Annual Rent Header */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-primary">Annual Rent</span>
                        <span className="text-lg font-bold text-primary tabular-nums">
                          {formatCurrency(formData.rentBreakdown.yearlyRentAmount || 0)}
                        </span>
                      </div>

                      {/* Payment Schedule */}
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Payment Schedule</span>
                        <span className="font-medium">
                          {formData.rentBreakdown.numberOfCheques || 1} {(formData.rentBreakdown.numberOfCheques || 1) === 1 ? 'Cheque' : 'Cheques'}
                        </span>
                      </div>

                      {/* First Payment Mode */}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">First Payment Mode</span>
                        <span className="font-medium flex items-center gap-1.5">
                          {formData.rentBreakdown.firstMonthPaymentMethod === FirstMonthPaymentMethod.CASH ? (
                            <>
                              <Banknote className="h-3.5 w-3.5 text-green-600" />
                              <span>Cash</span>
                            </>
                          ) : (
                            <>
                              <CreditCard className="h-3.5 w-3.5 text-blue-600" />
                              <span>Cheque</span>
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* First Payment Section - with icon */}
                  {/* SCP-2025-12-08: Compute first payment including parking based on lease type */}
                  {(() => {
                    const parkingFee = formData.parkingAllocation.parkingFeePerSpot * formData.parkingAllocation.parkingSpots;
                    const isAnnualLease = formData.leaseInfo.leaseType === 'YEARLY';
                    // For YEARLY: parking is already in firstMonthTotal (one-time annual)
                    // For MONTH_TO_MONTH/FIXED_TERM: add monthly parking to firstMonthTotal
                    const monthlyParkingToAdd = !isAnnualLease && parkingFee > 0 ? parkingFee : 0;
                    const firstPaymentWithParking = (formData.rentBreakdown.firstMonthTotal || 0) + monthlyParkingToAdd;

                    return firstPaymentWithParking > 0 && (
                      <div className="rounded-2xl bg-muted/30 p-4 mb-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 shadow-sm">
                            <Banknote className="h-5 w-5 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                              First Payment
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formData.rentBreakdown.firstMonthPaymentMethod === FirstMonthPaymentMethod.CASH ? 'Cash' : 'Cheque'} • Includes all fees & deposit
                              {monthlyParkingToAdd > 0 && ' + parking'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold tracking-tight text-primary tabular-nums">
                              {formatCurrency(firstPaymentWithParking)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Fees Breakdown - compact list */}
                  {formData.rentBreakdown.securityDeposit > 0 && (
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Security Deposit</span>
                        <span className="font-medium tabular-nums">{formatCurrency(formData.rentBreakdown.securityDeposit)}</span>
                      </div>
                      {formData.rentBreakdown.adminFee > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Admin Fee</span>
                          <span className="font-medium tabular-nums">{formatCurrency(formData.rentBreakdown.adminFee)}</span>
                        </div>
                      )}
                      {formData.rentBreakdown.serviceCharge > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Service Charges</span>
                          <span className="font-medium tabular-nums">{formatCurrency(formData.rentBreakdown.serviceCharge)}</span>
                        </div>
                      )}
                      {/* SCP-2025-12-08: Show parking with lease-type context */}
                      {formData.parkingAllocation.parkingFeePerSpot > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">
                            Parking {formData.leaseInfo.leaseType === 'YEARLY' ? '(Annual)' : '(Monthly)'}
                          </span>
                          <span className="font-medium tabular-nums">
                            {formatCurrency(formData.parkingAllocation.parkingFeePerSpot * formData.parkingAllocation.parkingSpots)}
                            {formData.leaseInfo.leaseType !== 'YEARLY' && '/mo'}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Property & Unit Info - bottom section */}
                  {formData.leaseInfo.propertyId && (
                    <>
                      <Separator className="my-4" />
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {formData.leaseInfo.propertyName || 'Property Selected'}
                          </p>
                          {formData.leaseInfo.unitNumber && (
                            <p className="text-xs text-muted-foreground">
                              Unit {formData.leaseInfo.unitNumber}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {formData.leaseInfo.leaseType && (
                              <Badge variant="outline" className="text-xs capitalize">
                                {formData.leaseInfo.leaseType.replace('_', ' ').toLowerCase()}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Documents Count */}
                  {/* SCP-2025-12-07: Updated to step 5 (Documents) which was previously step 6 */}
                  {parseInt(currentStep) >= 5 && (
                    <>
                      <Separator className="my-4" />
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Upload className="h-4 w-4" />
                          Documents
                        </span>
                        <Badge variant="secondary">
                          {[
                            formData.documentUpload.emiratesIdFile?.name,
                            formData.documentUpload.passportFile?.name,
                            formData.documentUpload.visaFile?.name,
                            formData.documentUpload.signedLeaseFile?.name,
                            ...formData.documentUpload.additionalFiles.map(f => f.name),
                          ].filter(Boolean).length} files
                        </Badge>
                      </div>
                    </>
                  )}

                  {/* Empty State */}
                  {!formData.leaseInfo.leaseEndDate && !formData.rentBreakdown.yearlyRentAmount && !formData.rentBreakdown.securityDeposit && (
                    <div className="text-center py-8 text-muted-foreground">
                      <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">
                        Complete each step to see the financial summary
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Navigation Bar (Mobile) */}
        <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t p-4 xl:hidden">
          <div className="container max-w-7xl mx-auto flex items-center justify-between">
            <Button
              variant="outline"
              onClick={goToPreviousStep}
              disabled={parseInt(currentStep) === 1}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              {WIZARD_STEPS.map(({ step }) => (
                <div
                  key={step}
                  className={`h-2 rounded-full transition-all ${
                    step === parseInt(currentStep)
                      ? 'w-8 bg-primary'
                      : completedSteps.includes(step)
                        ? 'w-2 bg-emerald-500'
                        : 'w-2 bg-muted'
                  }`}
                />
              ))}
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-sm text-muted-foreground">
                  Step {currentStep} of {WIZARD_STEPS.length}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {WIZARD_STEPS[parseInt(currentStep) - 1].title}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

export default function CreateTenantPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-background">
        <div className="container max-w-7xl mx-auto px-4 py-8">
          {/* Hero Skeleton */}
          <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background rounded-2xl p-8 mb-8">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          </div>

          {/* Content Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-12 gap-4 lg:gap-6">
            <div className="lg:col-span-1 xl:col-span-2">
              <Skeleton className="h-96 w-full rounded-xl" />
            </div>
            <div className="lg:col-span-2 xl:col-span-7">
              <Skeleton className="h-[600px] w-full rounded-xl" />
            </div>
            <div className="lg:col-span-1 xl:col-span-3">
              <Skeleton className="h-80 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    }>
      <CreateTenantWizard />
    </Suspense>
  );
}
