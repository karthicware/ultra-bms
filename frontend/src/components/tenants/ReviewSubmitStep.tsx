'use client';

/**
 * Step 5: Review and Submit
 * Review all entered data and submit tenant registration
 * SCP-2025-12-10: Updated for 5-step flow (replaced rentBreakdown/parkingAllocation with financialInfo)
 * SCP-2025-12-07: Added preloadedDocuments prop to show "From Quotation" status
 */

import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, Edit, Loader2 } from 'lucide-react';

import { formatCurrency } from '@/lib/validations/tenant';
import type { TenantOnboardingFormData } from '@/types/tenant';

// Helper function to get payment frequency display label
const getPaymentFrequencyLabel = (numberOfCheques?: number): string => {
  if (!numberOfCheques || numberOfCheques <= 1) return 'Annual (1 Payment)';
  if (numberOfCheques === 2) return 'Semi-Annual (2 Payments)';
  if (numberOfCheques === 4) return 'Quarterly (4 Payments)';
  if (numberOfCheques === 12) return 'Monthly (12 Payments)';
  return `${numberOfCheques} Payments`;
};

// SCP-2025-12-07: Preloaded document paths from quotation
interface PreloadedDocuments {
  emiratesIdFrontPath?: string;
  emiratesIdBackPath?: string;
  passportFrontPath?: string;
  passportBackPath?: string;
}

interface ReviewSubmitStepProps {
  formData: TenantOnboardingFormData;
  onSubmit: () => void;
  onBack: () => void;
  onEdit: (step: number) => void;
  isSubmitting: boolean;
  preloadedDocuments?: PreloadedDocuments;
}

export function ReviewSubmitStep({
  formData,
  onSubmit,
  onBack,
  onEdit,
  isSubmitting,
  preloadedDocuments,
}: ReviewSubmitStepProps) {
  const { personalInfo, leaseInfo, financialInfo, documentUpload } = formData;

  // SCP-2025-12-07: Check document status including preloaded documents from quotation
  const hasEmiratesId = documentUpload.emiratesIdFile || preloadedDocuments?.emiratesIdFrontPath;
  const hasPassport = documentUpload.passportFile || preloadedDocuments?.passportFrontPath;
  const isEmiratesIdFromQuotation = !documentUpload.emiratesIdFile && !!preloadedDocuments?.emiratesIdFrontPath;
  const isPassportFromQuotation = !documentUpload.passportFile && !!preloadedDocuments?.passportFrontPath;

  return (
    <Card data-testid="step-review-submit">
      <CardHeader>
        <CardTitle>Review & Submit</CardTitle>
        <CardDescription>
          Review all information before submitting tenant registration
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Step 1: Personal Information */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold">Personal Information</h3>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onEdit(1)}
                data-testid="btn-edit-personal-info"
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
            {/* SCP-2025-12-12: Updated to use fullName instead of firstName/lastName */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Name</p>
                <p className="font-medium">{personalInfo.fullName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Email</p>
                <p className="font-medium">{personalInfo.email}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Phone</p>
                <p className="font-medium">{personalInfo.phone}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Date of Birth</p>
                <p className="font-medium">
                  {personalInfo.dateOfBirth ? format(personalInfo.dateOfBirth, 'PPP') : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">National ID</p>
                <p className="font-medium">{personalInfo.nationalId}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Nationality</p>
                <p className="font-medium">{personalInfo.nationality}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Emergency Contact</p>
                <p className="font-medium">{personalInfo.emergencyContactName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Emergency Phone</p>
                <p className="font-medium">{personalInfo.emergencyContactPhone}</p>
              </div>
            </div>
          </div>

          {/* Step 2: Lease Information */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold">Lease Information</h3>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onEdit(2)}
                data-testid="btn-edit-lease-info"
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Lease Start Date</p>
                <p className="font-medium">
                  {leaseInfo.leaseStartDate ? format(leaseInfo.leaseStartDate, 'PPP') : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Lease End Date</p>
                <p className="font-medium">
                  {leaseInfo.leaseEndDate ? format(leaseInfo.leaseEndDate, 'PPP') : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Lease Duration</p>
                <p className="font-medium">{leaseInfo.leaseDuration} months</p>
              </div>
              <div>
                <p className="text-muted-foreground">Lease Type</p>
                <p className="font-medium">{leaseInfo.leaseType?.replace(/_/g, ' ')}</p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground">Auto-Renewal</p>
                <Badge variant={leaseInfo.renewalOption ? 'default' : 'secondary'}>
                  {leaseInfo.renewalOption ? 'Yes' : 'No'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Step 3: Financial Info */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold">Financial Information</h3>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onEdit(3)}
                data-testid="btn-edit-financial"
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Base Rent (Monthly)</span>
                <span className="font-medium">{formatCurrency(financialInfo.baseRent || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service Charge (Monthly)</span>
                <span className="font-medium">{formatCurrency(financialInfo.serviceCharge || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Admin Fee (One-time)</span>
                <span className="font-medium">{formatCurrency(financialInfo.adminFee || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Security Deposit</span>
                <span className="font-medium">{formatCurrency(financialInfo.securityDeposit || 0)}</span>
              </div>
              {/* SCP-2025-12-10: Always show parking fee (even if zero) */}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Parking Fee</span>
                <span className="font-medium">
                  {(financialInfo.parkingFee ?? 0) > 0
                    ? formatCurrency(financialInfo.parkingFee || 0)
                    : 'AED 0 (Not Required)'}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Yearly Rent Amount</span>
                <span data-testid="text-review-yearly-rent">
                  {formatCurrency(financialInfo.yearlyRentAmount || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment & Cheques Summary */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold">Payment & Cheques</h3>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onEdit(3)}
                data-testid="btn-edit-payment"
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-muted-foreground">Payment Frequency</p>
                  <p className="font-medium">{getPaymentFrequencyLabel(financialInfo.numberOfCheques)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">First Month Payment</p>
                  <p className="font-medium">{financialInfo.firstMonthPaymentMethod?.replace(/_/g, ' ') || 'CASH'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Cheques Uploaded</p>
                  <p className="font-medium">{financialInfo.chequeDetails?.length || 0} cheque(s)</p>
                </div>
              </div>

              {/* Story 3.9: Bank Account Details */}
              {financialInfo.bankAccountId && financialInfo.bankName ? (
                <div>
                  <Separator className="mb-4" />
                  <p className="text-muted-foreground mb-3 font-medium">Selected Bank Account</p>
                  <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Bank Name</span>
                      <span className="font-medium">{financialInfo.bankName}</span>
                    </div>
                    {financialInfo.bankAccountName && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Account Name</span>
                        <span className="font-medium">{financialInfo.bankAccountName}</span>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      This account will appear on invoices for rent payment instructions
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <Separator className="mb-4" />
                  <p className="text-muted-foreground mb-2">Bank Account</p>
                  <p className="text-sm font-medium">Not selected (optional)</p>
                </div>
              )}
            </div>
          </div>

          {/* Step 4: Documents */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold">Documents</h3>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onEdit(4)}
                data-testid="btn-edit-documents"
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Emirates ID</span>
                <Badge variant={hasEmiratesId ? 'default' : 'destructive'}>
                  {hasEmiratesId
                    ? (isEmiratesIdFromQuotation ? 'From Quotation' : 'Uploaded')
                    : 'Missing'}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Passport</span>
                <Badge variant={hasPassport ? 'default' : 'destructive'}>
                  {hasPassport
                    ? (isPassportFromQuotation ? 'From Quotation' : 'Uploaded')
                    : 'Missing'}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Visa</span>
                <Badge variant={documentUpload.visaFile ? 'default' : 'secondary'}>
                  {documentUpload.visaFile ? 'Uploaded' : 'Optional'}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Signed Lease</span>
                <Badge variant={documentUpload.signedLeaseFile ? 'default' : 'destructive'}>
                  {documentUpload.signedLeaseFile ? 'Uploaded' : 'Missing'}
                </Badge>
              </div>
              {documentUpload.additionalFiles && documentUpload.additionalFiles.length > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Additional Files</span>
                  <Badge variant="secondary">
                    {documentUpload.additionalFiles.length} file(s)
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Final Confirmation */}
          <Alert>
            <AlertDescription>
              <p className="font-medium mb-2">Ready to submit?</p>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>A user account will be created with TENANT role</li>
                <li>Welcome email will be sent to {personalInfo.email}</li>
                <li>Unit status will be updated to OCCUPIED</li>
                <li>Tenant ID will be auto-generated</li>
                <li>Lease agreement will be attached to the email</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Actions */}
          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              disabled={isSubmitting}
              data-testid="btn-back"
            >
              Back
            </Button>
            <Button
              onClick={onSubmit}
              disabled={isSubmitting}
              data-testid="btn-submit"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Registering Tenant...' : 'Submit Registration'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
