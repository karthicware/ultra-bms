/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

/**
 * Tenant Onboarding Wizard
 * 7-step multi-step form for complete tenant registration
 */

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { differenceInMonths } from 'date-fns';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

import { PersonalInfoStep } from '@/components/tenants/PersonalInfoStep';
import { LeaseInfoStep } from '@/components/tenants/LeaseInfoStep';
import { RentBreakdownStep } from '@/components/tenants/RentBreakdownStep';
import { ParkingAllocationStep } from '@/components/tenants/ParkingAllocationStep';
import { PaymentScheduleStep } from '@/components/tenants/PaymentScheduleStep';
import { DocumentUploadStep } from '@/components/tenants/DocumentUploadStep';
import { ReviewSubmitStep } from '@/components/tenants/ReviewSubmitStep';

import { createTenant, getLeadConversionData } from '@/services/tenant.service';
import {
  personalInfoSchema,
  leaseInfoSchema,
  rentBreakdownSchema,
  parkingAllocationSchema,
  paymentScheduleSchema,
  documentUploadSchema,
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
  { id: 'step-1', label: 'Personal Info', value: '1' },
  { id: 'step-2', label: 'Lease Info', value: '2' },
  { id: 'step-3', label: 'Rent Breakdown', value: '3' },
  { id: 'step-4', label: 'Parking', value: '4' },
  { id: 'step-5', label: 'Payment', value: '5' },
  { id: 'step-6', label: 'Documents', value: '6' },
  { id: 'step-7', label: 'Review', value: '7' },
];

function CreateTenantWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentStep, setCurrentStep] = useState('1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingConversionData, setIsLoadingConversionData] = useState(false);

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

        toast.success('Lead data loaded successfully');
      } catch (error) {
        console.error('Failed to load conversion data:', error);
        toast.error('Failed to load lead data');
      } finally {
        setIsLoadingConversionData(false);
      }
    }

    loadConversionData();
  }, [fromLead, fromQuotation]);

  // Calculate progress percentage
  const progressPercentage = (parseInt(currentStep) / WIZARD_STEPS.length) * 100;

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
      const parkingSpots = step === 4 ? stepData.parkingSpots : formData.parkingAllocation.parkingSpots;
      const parkingFeePerSpot = step === 4 ? stepData.parkingFeePerSpot : formData.parkingAllocation.parkingFeePerSpot;

      const totalMonthlyRent = calculateTotalMonthlyRent(
        baseRent,
        serviceCharge,
        parkingSpots,
        parkingFeePerSpot
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
        formData.documentUpload.additionalFiles.forEach((file, index) => {
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

      toast.success(`Tenant registered successfully! Welcome email sent to ${formData.personalInfo.email}`);

      // Redirect to tenant detail page
      router.push(`/tenants/${result.id}`);
    } catch (error: any) {
      console.error('Failed to create tenant:', error);
      toast.error(error.response?.data?.error?.message || 'Failed to create tenant. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingConversionData) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading lead data...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl" data-testid="wizard-tenant-create">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Tenant Onboarding</h1>
        <p className="text-muted-foreground mt-2">
          Complete the 7-step wizard to register a new tenant
        </p>
        {isLeadConversion && (
          <Badge variant="secondary" className="mt-2" data-testid="badge-prefilled-from-quotation">
            Pre-filled from Quotation #{fromQuotation}
          </Badge>
        )}
      </div>

      {/* Progress Indicator */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">
              Step {currentStep} of {WIZARD_STEPS.length}
            </span>
            <span className="text-sm text-muted-foreground">
              {Math.round(progressPercentage)}% Complete
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </CardContent>
      </Card>

      {/* Wizard Tabs */}
      <Tabs value={currentStep} onValueChange={setCurrentStep} className="w-full">
        <TabsList className="grid grid-cols-7 w-full mb-6 h-auto">
          {WIZARD_STEPS.map((step, index) => (
            <TabsTrigger
              key={step.id}
              value={step.value}
              className="flex flex-col items-center py-3"
              disabled={parseInt(currentStep) < index + 1}
              data-testid={`tab-${step.id}`}
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold mb-1">
                {step.value}
              </div>
              <span className="text-xs hidden md:block">{step.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Step 1: Personal Information */}
        <TabsContent value="1">
          <PersonalInfoStep
            data={formData.personalInfo}
            onComplete={(data) => handleStepComplete(data, 1)}
            onBack={() => router.push('/tenants')}
          />
        </TabsContent>

        {/* Step 2: Lease Information */}
        <TabsContent value="2">
          <LeaseInfoStep
            data={formData.leaseInfo}
            onComplete={(data) => handleStepComplete(data, 2)}
            onBack={goToPreviousStep}
          />
        </TabsContent>

        {/* Step 3: Rent Breakdown */}
        <TabsContent value="3">
          <RentBreakdownStep
            data={formData.rentBreakdown}
            onComplete={(data) => handleStepComplete(data, 3)}
            onBack={goToPreviousStep}
          />
        </TabsContent>

        {/* Step 4: Parking Allocation */}
        <TabsContent value="4">
          <ParkingAllocationStep
            data={formData.parkingAllocation}
            onComplete={(data) => handleStepComplete(data, 4)}
            onBack={goToPreviousStep}
          />
        </TabsContent>

        {/* Step 5: Payment Schedule */}
        <TabsContent value="5">
          <PaymentScheduleStep
            data={formData.paymentSchedule}
            totalMonthlyRent={formData.rentBreakdown.totalMonthlyRent}
            onComplete={(data) => handleStepComplete(data, 5)}
            onBack={goToPreviousStep}
          />
        </TabsContent>

        {/* Step 6: Document Upload */}
        <TabsContent value="6">
          <DocumentUploadStep
            data={formData.documentUpload}
            onComplete={(data) => handleStepComplete(data, 6)}
            onBack={goToPreviousStep}
          />
        </TabsContent>

        {/* Step 7: Review and Submit */}
        <TabsContent value="7">
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
  );
}

export default function CreateTenantPage() {
  return (
    <Suspense fallback={
      <div className="container max-w-6xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Create New Tenant</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <CreateTenantWizard />
    </Suspense>
  );
}
