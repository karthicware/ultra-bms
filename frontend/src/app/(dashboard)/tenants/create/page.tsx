/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

/**
 * Tenant Onboarding Wizard
 * 7-step multi-step form for complete tenant registration
 * Redesigned with modern UX and visual feedback
 */

import { Suspense, useState, useEffect } from 'react';
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
} from 'lucide-react';
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
import { PaymentScheduleStep } from '@/components/tenants/PaymentScheduleStep';
import { DocumentUploadStep } from '@/components/tenants/DocumentUploadStep';
import { ReviewSubmitStep } from '@/components/tenants/ReviewSubmitStep';

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
  PaymentScheduleFormData,
  TenantDocumentUploadFormData,
  LeaseType,
  PaymentFrequency,
  PaymentMethod,
} from '@/types/tenant';

// Combined form data for all steps
interface TenantOnboardingFormData {
  personalInfo: PersonalInfoFormData;
  leaseInfo: LeaseInfoFormData;
  rentBreakdown: RentBreakdownFormData;
  parkingAllocation: ParkingAllocationFormData;
  paymentSchedule: PaymentScheduleFormData;
  documentUpload: TenantDocumentUploadFormData;
}

const WIZARD_STEPS = [
  { step: 1, title: 'Personal Info', description: 'Basic tenant details', icon: User },
  { step: 2, title: 'Lease Info', description: 'Property & lease terms', icon: FileText },
  { step: 3, title: 'Rent', description: 'Payment breakdown', icon: DollarSign },
  { step: 4, title: 'Parking', description: 'Parking allocation', icon: Car },
  { step: 5, title: 'Payment', description: 'Schedule setup', icon: CreditCard },
  { step: 6, title: 'Documents', description: 'Upload files', icon: Upload },
  { step: 7, title: 'Review', description: 'Final review', icon: CheckCircle2 },
];

function CreateTenantWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentStep, setCurrentStep] = useState('1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingConversionData, setIsLoadingConversionData] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Check for lead conversion query params
  const fromLead = searchParams?.get('fromLead');
  const fromQuotation = searchParams?.get('fromQuotation');
  const isLeadConversion = !!(fromLead && fromQuotation);

  // Form state for all steps
  const [formData, setFormData] = useState<TenantOnboardingFormData>({
    personalInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: new Date(),
      nationalId: '',
      nationality: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
    },
    leaseInfo: {
      propertyId: '',
      unitId: '',
      leaseStartDate: new Date(),
      leaseEndDate: new Date(),
      leaseDuration: 0,
      leaseType: 'FIXED_TERM' as LeaseType,
      renewalOption: false,
    },
    rentBreakdown: {
      baseRent: 0,
      adminFee: 0,
      serviceCharge: 0,
      securityDeposit: 0,
      totalMonthlyRent: 0,
    },
    parkingAllocation: {
      parkingSpots: 0,
      parkingFeePerSpot: 0,
      spotNumbers: '',
      mulkiyaFile: null,
    },
    paymentSchedule: {
      paymentFrequency: 'MONTHLY' as PaymentFrequency,
      paymentDueDate: 1,
      paymentMethod: 'BANK_TRANSFER' as PaymentMethod,
      pdcChequeCount: 0,
    },
    documentUpload: {
      emiratesIdFile: new File([], ''),
      passportFile: new File([], ''),
      visaFile: null,
      signedLeaseFile: new File([], ''),
      additionalFiles: [],
    },
  });

  // Load conversion data if coming from lead
  useEffect(() => {
    async function loadConversionData() {
      if (!fromLead || !fromQuotation) return;

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
            phone: conversionData.phone,
            nationalId: conversionData.nationalId,
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
            serviceCharge: conversionData.serviceCharge,
            adminFee: conversionData.adminFee,
            securityDeposit: conversionData.securityDeposit,
            totalMonthlyRent: conversionData.baseRent + conversionData.serviceCharge,
          },
          parkingAllocation: {
            ...prev.parkingAllocation,
            parkingSpots: conversionData.parkingSpots,
            parkingFeePerSpot: conversionData.parkingFeePerSpot,
          },
        }));

        toast.success('Data Loaded', { description: 'Lead data loaded successfully' });
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

  // Handle step completion and navigation
  const handleStepComplete = (stepData: any, step: number) => {
    // Update form data based on step
    const stepKey = {
      1: 'personalInfo',
      2: 'leaseInfo',
      3: 'rentBreakdown',
      4: 'parkingAllocation',
      5: 'paymentSchedule',
      6: 'documentUpload',
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
      const parkingFee = step === 4 ? stepData.parkingFeePerSpot : formData.parkingAllocation.parkingFeePerSpot;

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

    // Navigate to next step (except for last step)
    if (step < 7) {
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
      submitData.append('dateOfBirth', formData.personalInfo.dateOfBirth?.toISOString() || '');
      submitData.append('nationalId', formData.personalInfo.nationalId);
      submitData.append('nationality', formData.personalInfo.nationality);
      submitData.append('emergencyContactName', formData.personalInfo.emergencyContactName);
      submitData.append('emergencyContactPhone', formData.personalInfo.emergencyContactPhone);

      // Lease Info
      submitData.append('propertyId', formData.leaseInfo.propertyId);
      submitData.append('unitId', formData.leaseInfo.unitId);
      submitData.append('leaseStartDate', formData.leaseInfo.leaseStartDate?.toISOString() || '');
      submitData.append('leaseEndDate', formData.leaseInfo.leaseEndDate?.toISOString() || '');
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
      // Include spot IDs for parking assignment (Story 3.8 integration)
      const spotIds = (formData.parkingAllocation as any).spotIds;
      if (spotIds && Array.isArray(spotIds) && spotIds.length > 0) {
        spotIds.forEach((spotId: string) => {
          submitData.append('parkingSpotIds', spotId);
        });
      }

      // Payment Schedule
      submitData.append('paymentFrequency', formData.paymentSchedule.paymentFrequency);
      submitData.append('paymentDueDate', formData.paymentSchedule.paymentDueDate.toString());
      submitData.append('paymentMethod', formData.paymentSchedule.paymentMethod);
      if (formData.paymentSchedule.pdcChequeCount) {
        submitData.append('pdcChequeCount', formData.paymentSchedule.pdcChequeCount.toString());
      }

      // Documents
      if (formData.documentUpload.emiratesIdFile) {
        submitData.append('emiratesIdFile', formData.documentUpload.emiratesIdFile);
      }
      if (formData.documentUpload.passportFile) {
        submitData.append('passportFile', formData.documentUpload.passportFile);
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
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push('/tenants')}
                    className="h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background shadow-sm"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
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
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            {/* Left Sidebar - Step Navigation */}
            <div className="xl:col-span-1">
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
            <div className="xl:col-span-2">
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
                        onBack={goToPreviousStep}
                      />
                    </TabsContent>

                    {/* Step 3: Rent Breakdown */}
                    <TabsContent value="3" className="mt-0">
                      <RentBreakdownStep
                        data={formData.rentBreakdown}
                        onComplete={(data) => handleStepComplete(data, 3)}
                        onBack={goToPreviousStep}
                      />
                    </TabsContent>

                    {/* Step 4: Parking Allocation */}
                    <TabsContent value="4" className="mt-0">
                      <ParkingAllocationStep
                        data={formData.parkingAllocation}
                        onComplete={(data) => handleStepComplete(data, 4)}
                        onBack={goToPreviousStep}
                        propertyId={formData.leaseInfo.propertyId}
                      />
                    </TabsContent>

                    {/* Step 5: Payment Schedule */}
                    <TabsContent value="5" className="mt-0">
                      <PaymentScheduleStep
                        data={formData.paymentSchedule}
                        totalMonthlyRent={formData.rentBreakdown.totalMonthlyRent}
                        onComplete={(data) => handleStepComplete(data, 5)}
                        onBack={goToPreviousStep}
                      />
                    </TabsContent>

                    {/* Step 6: Document Upload */}
                    <TabsContent value="6" className="mt-0">
                      <DocumentUploadStep
                        data={formData.documentUpload}
                        onComplete={(data) => handleStepComplete(data, 6)}
                        onBack={goToPreviousStep}
                      />
                    </TabsContent>

                    {/* Step 7: Review and Submit */}
                    <TabsContent value="7" className="mt-0">
                      <ReviewSubmitStep
                        formData={formData}
                        onSubmit={handleFinalSubmit}
                        onBack={goToPreviousStep}
                        onEdit={(step) => setCurrentStep(step.toString())}
                        isSubmitting={isSubmitting}
                      />
                    </TabsContent>
                  </Tabs>
              </div>
            </div>

            {/* Right Sidebar - Live Summary */}
            <div className="xl:col-span-1">
              <Card className="sticky top-8 shadow-lg border-0 overflow-hidden">
                <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 p-4 border-b">
                  <h3 className="font-semibold text-sm text-blue-600">Live Summary</h3>
                </div>
                <CardContent className="p-4 space-y-4">
                  {/* Tenant Info */}
                  {formData.personalInfo.firstName && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        <User className="h-3 w-3" />
                        Tenant
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                        <div className="font-medium">
                          {formData.personalInfo.firstName} {formData.personalInfo.lastName}
                        </div>
                        {formData.personalInfo.email && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {formData.personalInfo.email}
                          </div>
                        )}
                        {formData.personalInfo.phone && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {formData.personalInfo.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Property Info */}
                  {formData.leaseInfo.propertyId && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        <Building2 className="h-3 w-3" />
                        Property
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Home className="h-4 w-4 text-muted-foreground" />
                          <span>Unit Selected</span>
                        </div>
                        {formData.leaseInfo.leaseStartDate && formData.leaseInfo.leaseEndDate && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {formData.leaseInfo.leaseDuration > 0
                                ? `${formData.leaseInfo.leaseDuration} months`
                                : 'Dates set'
                              }
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Financial Summary */}
                  {formData.rentBreakdown.baseRent > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        <DollarSign className="h-3 w-3" />
                        Financial
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Base Rent</span>
                          <span className="font-medium">{formatCurrency(formData.rentBreakdown.baseRent)}</span>
                        </div>
                        {formData.rentBreakdown.serviceCharge > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Service Charge</span>
                            <span>{formatCurrency(formData.rentBreakdown.serviceCharge)}</span>
                          </div>
                        )}
                        {formData.parkingAllocation.parkingFeePerSpot > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Parking</span>
                            <span>{formatCurrency(formData.parkingAllocation.parkingFeePerSpot)}</span>
                          </div>
                        )}
                        <Separator />
                        <div className="flex justify-between">
                          <span className="font-medium">Monthly Total</span>
                          <span className="font-bold text-primary">
                            {formatCurrency(formData.rentBreakdown.totalMonthlyRent)}
                          </span>
                        </div>
                        {formData.rentBreakdown.securityDeposit > 0 && (
                          <div className="flex justify-between text-xs text-muted-foreground pt-1">
                            <span className="flex items-center gap-1">
                              <Shield className="h-3 w-3" />
                              Security Deposit
                            </span>
                            <span>{formatCurrency(formData.rentBreakdown.securityDeposit)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Payment Info */}
                  {formData.paymentSchedule.paymentMethod && parseInt(currentStep) >= 5 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        <CreditCard className="h-3 w-3" />
                        Payment
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="capitalize">
                            {formData.paymentSchedule.paymentFrequency.toLowerCase().replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Due on day {formData.paymentSchedule.paymentDueDate} of each period
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Documents Count */}
                  {parseInt(currentStep) >= 6 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        <Upload className="h-3 w-3" />
                        Documents
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Files uploaded</span>
                          <Badge variant="secondary">
                            {[
                              formData.documentUpload.emiratesIdFile?.name,
                              formData.documentUpload.passportFile?.name,
                              formData.documentUpload.visaFile?.name,
                              formData.documentUpload.signedLeaseFile?.name,
                              ...formData.documentUpload.additionalFiles.map(f => f.name),
                            ].filter(Boolean).length}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Empty State */}
                  {!formData.personalInfo.firstName && (
                    <div className="text-center py-8 text-muted-foreground">
                      <User className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">
                        Complete each step to see the summary here
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
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
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            <div className="xl:col-span-1">
              <Skeleton className="h-96 w-full rounded-xl" />
            </div>
            <div className="xl:col-span-2">
              <Skeleton className="h-[600px] w-full rounded-xl" />
            </div>
            <div className="xl:col-span-1">
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
