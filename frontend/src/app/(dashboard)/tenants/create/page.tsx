/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

/**
 * Tenant Onboarding Wizard
 * 5-step multi-step form for complete tenant registration
 * SCP-2025-12-10: Reduced from 6 steps to 5 - Removed Parking step, replaced Rent with Financial Info + Cheque Upload
 * New Step 3: Financial Info with AWS Textract OCR for cheque processing
 * Redesigned with modern UX and visual feedback
 */

import { Suspense, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

import {
  ArrowLeft,
  User,
  FileText,
  DollarSign,
  CreditCard,
  Upload,
  CheckCircle2,
  Loader2,
  Sparkles,
  Calendar,
  MapPin,
  Banknote,
} from 'lucide-react';
import { format } from 'date-fns';
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
// SCP-2025-12-10: RentBreakdownStep replaced with FinancialInfoStep for cheque upload with OCR
import { FinancialInfoStep, type FinancialInfoFormData } from '@/components/tenants/FinancialInfoStep';
// SCP-2025-12-10: ParkingAllocationStep removed - parking is now handled in quotation
import { DocumentUploadStep } from '@/components/tenants/DocumentUploadStep';
import { ReviewSubmitStep } from '@/components/tenants/ReviewSubmitStep';
import { OnboardingStepsSidebar } from '@/components/tenants/OnboardingStepsSidebar';
import { PageBackButton } from '@/components/common/PageBackButton';

import { createTenant, getLeadConversionData } from '@/services/tenant.service';
import {
  calculateLeaseDuration,
  calculateTotalMonthlyRent,
} from '@/lib/validations/tenant';

import type {
  PersonalInfoFormData,
  LeaseInfoFormData,
  // SCP-2025-12-10: RentBreakdownFormData and ParkingAllocationFormData removed - replaced with FinancialInfoFormData
  TenantDocumentUploadFormData,
  LeaseType,
} from '@/types/tenant';
import { FirstMonthPaymentMethod } from '@/types/quotations';

// Combined form data for all steps
// SCP-2025-12-10: Replaced rentBreakdown and parkingAllocation with financialInfo
interface TenantOnboardingFormData {
  personalInfo: PersonalInfoFormData;
  leaseInfo: LeaseInfoFormData & {
    // SCP-2025-12-07: Store property/unit display names for Lease Preview
    propertyName?: string;
    unitNumber?: string;
  };
  // SCP-2025-12-10: Financial info includes cheque details from OCR processing
  financialInfo: FinancialInfoFormData & {
    // From quotation (read-only display)
    yearlyRentAmount?: number;
    numberOfCheques?: number;
    firstMonthPaymentMethod?: FirstMonthPaymentMethod;
    baseRent?: number;
    serviceCharge?: number;
    adminFee?: number;
    securityDeposit?: number;
    parkingFee?: number;
  };
  documentUpload: TenantDocumentUploadFormData;
}

// SCP-2025-12-06: Preloaded document paths from quotation
interface PreloadedDocuments {
  emiratesIdFrontPath?: string;
  emiratesIdBackPath?: string;
  passportFrontPath?: string;
  passportBackPath?: string;
}

// SCP-2025-12-10: Reduced from 6 to 5 steps - Removed Parking, replaced Rent with Financial Info + Cheque OCR
const WIZARD_STEPS = [
  { step: 1, title: 'Personal Info', description: 'Basic tenant details', icon: User },
  { step: 2, title: 'Lease Info', description: 'Property & lease terms', icon: FileText },
  { step: 3, title: 'Financial', description: 'Cheques & payment', icon: Banknote },
  { step: 4, title: 'Documents', description: 'Upload files', icon: Upload },
  { step: 5, title: 'Review', description: 'Final review', icon: CheckCircle2 },
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
  // SCP-2025-12-10: Updated for 5-step wizard with Financial Info
  // SCP-2025-12-12: Using fullName instead of firstName/lastName
  const [formData, setFormData] = useState<TenantOnboardingFormData>({
    personalInfo: {
      fullName: '',
      email: '',
      phone: '',
      dateOfBirth: undefined as unknown as Date, // Auto-populated from Emirates ID OCR
      nationalId: '',
      nationality: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
    },
    leaseInfo: {
      propertyId: '',
      unitId: '',
      leaseStartDate: undefined as unknown as Date,
      leaseEndDate: undefined as unknown as Date,
      leaseDuration: 0,
      leaseType: 'YEARLY' as LeaseType,
      renewalOption: false,
    },
    // SCP-2025-12-10: Financial info with cheque OCR details
    financialInfo: {
      chequeDetails: [],
      // From quotation (populated on load)
      yearlyRentAmount: 0,
      numberOfCheques: 1,
      firstMonthPaymentMethod: FirstMonthPaymentMethod.CHEQUE,
      baseRent: 0,
      serviceCharge: 0,
      adminFee: 0,
      securityDeposit: 0,
      parkingFee: 0,
    },
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
        // SCP-2025-12-10: Updated for 5-step wizard with Financial Info (replaces rentBreakdown/parkingAllocation)
        // SCP-2025-12-12: Using fullName and dateOfBirth from Emirates ID OCR
        setFormData((prev) => ({
          ...prev,
          personalInfo: {
            ...prev.personalInfo,
            fullName: conversionData.fullName,
            email: conversionData.email,
            phone: conversionData.phone || conversionData.contactNumber || '',
            dateOfBirth: conversionData.dateOfBirth ? new Date(conversionData.dateOfBirth) : (undefined as unknown as Date),
            nationalId: conversionData.nationalId || conversionData.emiratesId || '',
            nationality: conversionData.nationality,
          },
          leaseInfo: {
            ...prev.leaseInfo,
            propertyId: conversionData.propertyId,
            unitId: conversionData.unitId,
            // SCP-2025-12-07: Store property/unit display names for Lease Preview
            propertyName: conversionData.propertyName,
            unitNumber: conversionData.unitNumber,
            // SCP-2025-12-12: Lease dates from quotation
            leaseStartDate: conversionData.leaseStartDate ? new Date(conversionData.leaseStartDate) : (undefined as unknown as Date),
            leaseEndDate: conversionData.leaseEndDate ? new Date(conversionData.leaseEndDate) : (undefined as unknown as Date),
          },
          // SCP-2025-12-10: Financial info now holds all rent/cheque/parking data (read-only from quotation)
          financialInfo: {
            ...prev.financialInfo,
            chequeDetails: [], // Will be populated from OCR processing
            yearlyRentAmount: conversionData.yearlyRentAmount || (conversionData.baseRent * 12),
            numberOfCheques: conversionData.numberOfCheques || 1,
            firstMonthPaymentMethod: conversionData.firstMonthPaymentMethod === 'CASH'
              ? FirstMonthPaymentMethod.CASH
              : FirstMonthPaymentMethod.CHEQUE,
            baseRent: conversionData.baseRent,
            serviceCharge: conversionData.serviceCharge || conversionData.serviceCharges || 0,
            adminFee: conversionData.adminFee,
            securityDeposit: conversionData.securityDeposit,
            // SCP-2025-12-10: Store parking details for read-only display
            parkingSpots: conversionData.parkingSpots || 0,
            parkingFeePerSpot: conversionData.parkingFeePerSpot || 0,
            parkingFee: conversionData.parkingFee || (conversionData.parkingFeePerSpot * (conversionData.parkingSpots || 0)) || 0,
            // Bank account info will be populated in FinancialInfoStep from quotation
            bankAccountId: conversionData.bankAccountId,
            bankAccountName: conversionData.bankAccountName,
            bankName: conversionData.bankName,
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
  // SCP-2025-12-10: Updated for 5-step wizard (removed Parking step, added Financial Info)
  const handleBackWithSave = (stepData: any, step: number) => {
    // Update form data based on step - use single setFormData to avoid race conditions
    setFormData((prev) => {
      let newState = { ...prev };

      // Update the step-specific data
      // SCP-2025-12-10: New step mapping for 5-step wizard
      const stepKey = {
        1: 'personalInfo',
        2: 'leaseInfo',
        3: 'financialInfo',
        4: 'documentUpload',
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
      }

      return newState;
    });

    // Navigate to previous step
    goToPreviousStep();
  };

  // Handle step completion and navigation
  // SCP-2025-12-10: Updated for 5-step wizard (removed Parking, added Financial Info with OCR)
  const handleStepComplete = (stepData: any, step: number) => {
    // Update form data based on step
    // SCP-2025-12-10: New step mapping for 5-step wizard
    const stepKey = {
      1: 'personalInfo',
      2: 'leaseInfo',
      3: 'financialInfo',
      4: 'documentUpload',
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

    // Navigate to next step (except for last step - Review is step 5)
    if (step < 5) {
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
      // SCP-2025-12-12: Using fullName instead of firstName/lastName
      submitData.append('fullName', formData.personalInfo.fullName);
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

      // SCP-2025-12-10: Financial Info (replaces rent breakdown and parking)
      // Rent values from quotation
      submitData.append('baseRent', (formData.financialInfo.baseRent || 0).toString());
      submitData.append('adminFee', (formData.financialInfo.adminFee || 0).toString());
      submitData.append('serviceCharge', (formData.financialInfo.serviceCharge || 0).toString());
      submitData.append('securityDeposit', (formData.financialInfo.securityDeposit || 0).toString());
      submitData.append('parkingFee', (formData.financialInfo.parkingFee || 0).toString());

      // Cheque details from OCR processing
      if (formData.financialInfo.chequeDetails && formData.financialInfo.chequeDetails.length > 0) {
        submitData.append('chequeDetails', JSON.stringify(formData.financialInfo.chequeDetails));
      }

      // Bank account info
      if (formData.financialInfo.bankAccountId) {
        submitData.append('bankAccountId', formData.financialInfo.bankAccountId);
      }

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
      // SCP-2025-12-10: mulkiyaFile is now in additionalFiles (parking handled via quotation)
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
            <div className="lg:col-span-1 xl:col-span-3">
              <OnboardingStepsSidebar
                steps={WIZARD_STEPS}
                currentStep={parseInt(currentStep)}
                completedSteps={completedSteps}
                onStepClick={(step) => setCurrentStep(step.toString())}
              />
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-2 xl:col-span-6">
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
                        parkingInfo={isLeadConversion ? {
                          parkingSpots: (formData.financialInfo as any).parkingSpots || 0,
                          parkingFeePerSpot: (formData.financialInfo as any).parkingFeePerSpot || 0,
                          parkingFee: formData.financialInfo.parkingFee || 0,
                        } : undefined}
                      />
                    </TabsContent>

                    {/* Step 3: Financial Info - SCP-2025-12-10: NEW step with cheque OCR upload */}
                    <TabsContent value="3" className="mt-0">
                      <FinancialInfoStep
                        data={formData.financialInfo}
                        onComplete={(data) => handleStepComplete(data, 3)}
                        onBack={(data) => handleBackWithSave(data, 3)}
                        quotationId={fromQuotation || ''}
                        expectedChequeCount={formData.financialInfo.numberOfCheques || 1}
                        firstMonthPaymentMethod={formData.financialInfo.firstMonthPaymentMethod}
                      />
                    </TabsContent>

                    {/* Step 4: Document Upload */}
                    <TabsContent value="4" className="mt-0">
                      <DocumentUploadStep
                        data={formData.documentUpload}
                        onComplete={(data) => handleStepComplete(data, 4)}
                        onBack={(data) => handleBackWithSave(data, 4)}
                        preloadedDocuments={preloadedDocuments}
                      />
                    </TabsContent>

                    {/* Step 5: Review and Submit */}
                    <TabsContent value="5" className="mt-0">
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

                  {/* Lease Period Section */}
                  {(formData.leaseInfo.leaseStartDate || formData.leaseInfo.leaseEndDate) && (
                    <div className="rounded-2xl bg-muted/50 p-4 mb-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background shadow-sm">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-2">
                          {formData.leaseInfo.leaseStartDate && (
                            <div>
                              <p className="text-xs text-muted-foreground">Lease Start</p>
                              <p className="font-semibold text-sm">
                                {format(formData.leaseInfo.leaseStartDate, 'MMMM do, yyyy')}
                              </p>
                            </div>
                          )}
                          {formData.leaseInfo.leaseEndDate && (
                            <div>
                              <p className="text-xs text-muted-foreground">Lease End</p>
                              <p className="font-semibold text-sm">
                                {format(formData.leaseInfo.leaseEndDate, 'MMMM do, yyyy')}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SCP-2025-12-10: Annual Rent Section - Using financialInfo instead of rentBreakdown */}
                  {(formData.financialInfo.yearlyRentAmount || formData.financialInfo.numberOfCheques) && (formData.financialInfo.yearlyRentAmount ?? 0) > 0 && (
                    <div className="rounded-2xl bg-primary/5 border border-primary/10 p-4 mb-4">
                      {/* Annual Rent Header */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-primary">Annual Rent</span>
                        <span className="text-lg font-bold text-primary tabular-nums">
                          {formatCurrency(formData.financialInfo.yearlyRentAmount || 0)}
                        </span>
                      </div>

                      {/* Payment Schedule */}
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Payment Schedule</span>
                        <span className="font-medium">
                          {formData.financialInfo.numberOfCheques || 1} {(formData.financialInfo.numberOfCheques || 1) === 1 ? 'Cheque' : 'Cheques'}
                        </span>
                      </div>

                      {/* First Payment */}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          {formData.financialInfo.firstMonthPaymentMethod === FirstMonthPaymentMethod.CASH ? (
                            <>
                              <Banknote className="h-3.5 w-3.5 text-green-600" />
                              <span>First Payment (Cash)</span>
                            </>
                          ) : (
                            <>
                              <CreditCard className="h-3.5 w-3.5 text-blue-600" />
                              <span>First Payment (Cheque)</span>
                            </>
                          )}
                        </span>
                        <span className="font-medium tabular-nums">
                          {formatCurrency(
                            (formData.financialInfo.yearlyRentAmount || 0) /
                            (formData.financialInfo.numberOfCheques || 1)
                          )}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Fees Breakdown - SCP-2025-12-10: Using financialInfo */}
                  {(formData.financialInfo.securityDeposit ?? 0) > 0 && (
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Security Deposit</span>
                        <span className="font-medium tabular-nums">{formatCurrency(formData.financialInfo.securityDeposit || 0)}</span>
                      </div>
                      {(formData.financialInfo.adminFee ?? 0) > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Admin Fee</span>
                          <span className="font-medium tabular-nums">{formatCurrency(formData.financialInfo.adminFee || 0)}</span>
                        </div>
                      )}
                      {(formData.financialInfo.serviceCharge ?? 0) > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Service Charges</span>
                          <span className="font-medium tabular-nums">{formatCurrency(formData.financialInfo.serviceCharge || 0)}</span>
                        </div>
                      )}
                      {/* SCP-2025-12-10: Always show parking fee from quotation (even if zero) */}
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">
                          Parking {formData.leaseInfo.leaseType === 'YEARLY' ? '(Annual)' : '(Monthly)'}
                        </span>
                        <span className="font-medium tabular-nums">
                          {(formData.financialInfo.parkingFee ?? 0) > 0
                            ? `${formatCurrency(formData.financialInfo.parkingFee || 0)}${formData.leaseInfo.leaseType !== 'YEARLY' ? '/mo' : ''}`
                            : 'AED 0 (No Parking)'}
                        </span>
                      </div>
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
                  {/* SCP-2025-12-10: Updated to step 4 (Documents) in 5-step wizard */}
                  {parseInt(currentStep) >= 4 && (
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

                  {/* Empty State - SCP-2025-12-10: Using financialInfo */}
                  {!formData.leaseInfo.leaseEndDate && !formData.financialInfo.yearlyRentAmount && !formData.financialInfo.securityDeposit && (
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
            <div className="lg:col-span-1 xl:col-span-3">
              <Skeleton className="h-96 w-full rounded-xl" />
            </div>
            <div className="lg:col-span-2 xl:col-span-6">
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
