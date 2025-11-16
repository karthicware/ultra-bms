'use client';

/**
 * Step 7: Review and Submit
 * Review all entered data and submit tenant registration
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

interface ReviewSubmitStepProps {
  formData: TenantOnboardingFormData;
  onSubmit: () => void;
  onBack: () => void;
  onEdit: (step: number) => void;
  isSubmitting: boolean;
}

export function ReviewSubmitStep({
  formData,
  onSubmit,
  onBack,
  onEdit,
  isSubmitting,
}: ReviewSubmitStepProps) {
  const { personalInfo, leaseInfo, rentBreakdown, parkingAllocation, paymentSchedule, documentUpload } = formData;

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
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Name</p>
                <p className="font-medium">{personalInfo.firstName} {personalInfo.lastName}</p>
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

          {/* Step 3: Rent Breakdown */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold">Rent Breakdown</h3>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onEdit(3)}
                data-testid="btn-edit-rent-breakdown"
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Base Rent (Monthly)</span>
                <span className="font-medium">{formatCurrency(rentBreakdown.baseRent)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service Charge (Monthly)</span>
                <span className="font-medium">{formatCurrency(rentBreakdown.serviceCharge)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Admin Fee (One-time)</span>
                <span className="font-medium">{formatCurrency(rentBreakdown.adminFee)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Security Deposit</span>
                <span className="font-medium">{formatCurrency(rentBreakdown.securityDeposit)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total Monthly Rent</span>
                <span data-testid="text-review-total-monthly-rent">
                  {formatCurrency(rentBreakdown.totalMonthlyRent)}
                </span>
              </div>
            </div>
          </div>

          {/* Step 4: Parking Allocation */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold">Parking Allocation</h3>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onEdit(4)}
                data-testid="btn-edit-parking"
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
            {parkingAllocation.parkingSpots > 0 ? (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Parking Spots</p>
                  <p className="font-medium">{parkingAllocation.parkingSpots}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Fee Per Spot</p>
                  <p className="font-medium">{formatCurrency(parkingAllocation.parkingFeePerSpot)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Spot Numbers</p>
                  <p className="font-medium">{parkingAllocation.spotNumbers || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Mulkiya Document</p>
                  <p className="font-medium">
                    {parkingAllocation.mulkiyaFile
                      ? parkingAllocation.mulkiyaFile.name
                      : 'Not uploaded'}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No parking allocated</p>
            )}
          </div>

          {/* Step 5: Payment Schedule */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold">Payment Schedule</h3>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onEdit(5)}
                data-testid="btn-edit-payment"
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Payment Frequency</p>
                <p className="font-medium">{paymentSchedule.paymentFrequency}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Due Date</p>
                <p className="font-medium">
                  Day {paymentSchedule.paymentDueDate} of each month
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Payment Method</p>
                <p className="font-medium">{paymentSchedule.paymentMethod?.replace(/_/g, ' ')}</p>
              </div>
              {paymentSchedule.pdcChequeCount && paymentSchedule.pdcChequeCount > 0 && (
                <div>
                  <p className="text-muted-foreground">PDC Cheques</p>
                  <p className="font-medium">{paymentSchedule.pdcChequeCount} cheques</p>
                </div>
              )}
            </div>
          </div>

          {/* Step 6: Documents */}
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
                onClick={() => onEdit(6)}
                data-testid="btn-edit-documents"
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Emirates ID</span>
                <Badge variant={documentUpload.emiratesIdFile ? 'default' : 'destructive'}>
                  {documentUpload.emiratesIdFile ? 'Uploaded' : 'Missing'}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Passport</span>
                <Badge variant={documentUpload.passportFile ? 'default' : 'destructive'}>
                  {documentUpload.passportFile ? 'Uploaded' : 'Missing'}
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
