/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

/**
 * Create Quotation Page - Redesigned
 * A refined, step-by-step quotation creation experience
 */

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import {
  CalendarIcon,
  Car,
  Building2,
  FileText,
  CreditCard,
  ChevronRight,
  ChevronLeft,
  Check,
  Upload,
  Sparkles,
  ArrowRight,
  Receipt,
  Shield,
  User,
  MapPin,
  Loader2,
} from 'lucide-react';
import { PageBackButton } from '@/components/common/PageBackButton';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { CurrencyInput } from '@/components/ui/currency-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { createQuotation, uploadQuotationDocument } from '@/services/quotations.service';
import { getLeadById } from '@/services/leads.service';
import { getAvailableParkingSpots } from '@/services/parking.service';
import { getProperties } from '@/services/properties.service';
import { getAvailableUnits } from '@/services/units.service';
import { PropertyStatus, type Property } from '@/types/properties';
import type { Unit } from '@/types/units';
import {
  createQuotationSchema,
  type CreateQuotationFormData,
  calculateTotalFirstPayment,
  DEFAULT_QUOTATION_TERMS,
  getDefaultValidityDate,
  calculateChequeBreakdown,
} from '@/lib/validations/quotations';
import type { ParkingSpot } from '@/types/parking';
import { FirstMonthPaymentMethod, type ChequeBreakdownItem, type CreateQuotationRequest } from '@/types/quotations';
import { ChequeBreakdownSection } from '@/components/quotations/ChequeBreakdownSection';
import { FileUploadProgress, type FileUploadStatus } from '@/components/ui/file-upload-progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Banknote } from 'lucide-react';
import {
  processIdentityDocuments,
  IdentityOverallStatus,
} from '@/services/textract.service';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED', minimumFractionDigits: 0 }).format(amount);
};

// Step configuration
const STEPS = [
  { id: 1, title: 'Property', description: 'Select unit', icon: Building2 },
  { id: 2, title: 'Identity', description: 'Documents', icon: User },
  { id: 3, title: 'Financials', description: 'Pricing', icon: Receipt },
  { id: 4, title: 'Terms', description: 'Conditions', icon: FileText },
];


// Live Preview Component
function QuotationPreview({
  leadName,
  selectedUnit,
  selectedProperty,
  values,
  totalFirstPayment,
  yearlyRentAmount,
  numberOfCheques,
  firstMonthPaymentMethod,
}: {
  leadName: string;
  selectedUnit: Unit | null;
  selectedProperty: Property | null;
  values: number[];
  totalFirstPayment: number;
  yearlyRentAmount: number;
  numberOfCheques: number;
  firstMonthPaymentMethod: FirstMonthPaymentMethod;
}) {
  // Calculate first month rent payment (yearly / number of cheques) - rounded to whole number
  const firstMonthRent = yearlyRentAmount > 0 && numberOfCheques > 0
    ? Math.round(yearlyRentAmount / numberOfCheques)
    : 0;

  // Calculate one-time fees total
  const oneTimeFees = (values[1] || 0) + (values[2] || 0) + (values[3] || 0) + (values[4] || 0);

  // Calculate default first month total (fees + first rent)
  const defaultFirstMonthTotal = oneTimeFees + firstMonthRent;

  // Calculate adjustment amount (extra or less collected)
  const adjustmentAmount = totalFirstPayment - defaultFirstMonthTotal;
  return (
    <div className="relative overflow-hidden rounded-3xl border border-primary/10 bg-gradient-to-br from-card via-card to-primary/5 p-6 shadow-xl">
      {/* Decorative elements */}
      <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Quotation Preview
              </span>
            </div>
            {leadName ? (
              <>
                <p className="mt-3 text-xs text-muted-foreground">Tenant</p>
                <h3 className="text-lg font-semibold">{leadName}</h3>
              </>
            ) : (
              <h3 className="mt-3 text-lg font-semibold">New Quotation</h3>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Draft</p>
            <p className="text-sm font-medium">{format(new Date(), 'dd MMM yyyy')}</p>
          </div>
        </div>

        {/* Property Info */}
        {(selectedProperty || selectedUnit) && (
          <div className="mt-6 rounded-2xl bg-muted/50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background shadow-sm">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{selectedProperty?.name || 'Property'}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedUnit ? `Unit ${selectedUnit.unitNumber} • ${selectedUnit.bedroomCount}BR` : 'Select a unit'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Annual Rent Summary */}
        {yearlyRentAmount > 0 && (
          <div className="mt-6 rounded-2xl bg-primary/5 border border-primary/10 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-primary">Annual Rent</span>
              <span className="text-lg font-bold text-primary tabular-nums">
                {formatCurrency(yearlyRentAmount)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Payment Schedule</span>
              <span>
                {numberOfCheques} {numberOfCheques === 1 ? 'Payment' : 'Payments'}
                {firstMonthPaymentMethod === FirstMonthPaymentMethod.CASH && numberOfCheques > 1 && (
                  <> ({numberOfCheques - 1} {numberOfCheques - 1 === 1 ? 'Cheque' : 'Cheques'})</>
                )}
              </span>
            </div>
          </div>
        )}

        {/* Financial Breakdown */}
        <div className="mt-6 space-y-3">
          {/* First Payment with payment method indicator */}
          {firstMonthRent > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                {firstMonthPaymentMethod === FirstMonthPaymentMethod.CASH ? (
                  <Banknote className="h-4 w-4 text-green-600" />
                ) : (
                  <CreditCard className="h-4 w-4 text-blue-600" />
                )}
                First Rent Payment
                <span className="text-xs text-muted-foreground/70">
                  ({firstMonthPaymentMethod === FirstMonthPaymentMethod.CASH ? 'Cash' : 'Cheque'})
                </span>
              </span>
              <span className="font-medium tabular-nums">{formatCurrency(firstMonthRent)}</span>
            </div>
          )}
          {(values[1] || 0) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Service Charges</span>
              <span className="font-medium tabular-nums">{formatCurrency(values[1])}</span>
            </div>
          )}
          {(values[2] || 0) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Parking Fee (Annual)</span>
              <span className="font-medium tabular-nums">{formatCurrency(values[2])}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Security Deposit</span>
            <span className="font-medium tabular-nums">{formatCurrency(values[3] || 0)}</span>
          </div>
          {(values[4] || 0) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Admin Fee</span>
              <span className="font-medium tabular-nums">{formatCurrency(values[4])}</span>
            </div>
          )}
          {/* Show adjustment if first month total has been customized (extra collected only) */}
          {adjustmentAmount > 0 && (
            <div className="flex justify-between text-sm pt-2 border-t border-dashed border-muted-foreground/30 mt-2 text-amber-600">
              <span>Extra collected</span>
              <span className="font-medium tabular-nums">+{formatCurrency(adjustmentAmount)}</span>
            </div>
          )}
        </div>

        <Separator className="my-5" />

        {/* Total */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Total First Payment
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Includes all fees & deposit
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold tracking-tight text-primary" data-testid="display-total-first-payment">
              {formatCurrency(totalFirstPayment)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateQuotationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // Step state
  const [currentStep, setCurrentStep] = useState(1);

  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leadName, setLeadName] = useState('');
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [availableUnits, setAvailableUnits] = useState<Unit[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [availableParkingSpots, setAvailableParkingSpots] = useState<ParkingSpot[]>([]);
  const [loadingParkingSpots, setLoadingParkingSpots] = useState(false);

  // Identity document uploads
  const [emiratesIdFront, setEmiratesIdFront] = useState<File | null>(null);
  const [emiratesIdBack, setEmiratesIdBack] = useState<File | null>(null);
  const [passportFront, setPassportFront] = useState<File | null>(null);
  const [passportBack, setPassportBack] = useState<File | null>(null);
  const [emiratesIdNumber, setEmiratesIdNumber] = useState('');
  const [emiratesIdExpiry, setEmiratesIdExpiry] = useState<Date | null>(null);
  const [passportNumber, setPassportNumber] = useState('');
  const [passportExpiry, setPassportExpiry] = useState<Date | null>(null);
  const [nationality, setNationality] = useState('');
  const [documentErrors, setDocumentErrors] = useState<string[]>([]);

  // Story 3.10: OCR processing state
  const [isProcessingOcr, setIsProcessingOcr] = useState(false);
  const [ocrMessage, setOcrMessage] = useState<string | null>(null);
  const [ocrSuccess, setOcrSuccess] = useState<boolean | null>(null);

  // SCP-2025-12-12: DOB from Emirates ID OCR
  const [dateOfBirth, setDateOfBirth] = useState<string | null>(null);

  // SCP-2025-12-06: Cheque breakdown state
  // Default: 6 cheques and Cash as first payment method
  const [yearlyRentAmount, setYearlyRentAmount] = useState<number>(0);
  const [numberOfCheques, setNumberOfCheques] = useState<number>(6);
  const [firstMonthPaymentMethod, setFirstMonthPaymentMethod] = useState<FirstMonthPaymentMethod>(
    FirstMonthPaymentMethod.CASH
  );
  const [chequeBreakdown, setChequeBreakdown] = useState<ChequeBreakdownItem[]>([]);
  const [leaseStartDate, setLeaseStartDate] = useState<Date>(new Date());
  const [firstMonthTotal, setFirstMonthTotal] = useState<number | undefined>(undefined);

  // Popover open states for date pickers
  const [issueDateOpen, setIssueDateOpen] = useState(false);
  const [validityDateOpen, setValidityDateOpen] = useState(false);
  const [emiratesIdExpiryOpen, setEmiratesIdExpiryOpen] = useState(false);
  const [passportExpiryOpen, setPassportExpiryOpen] = useState(false);

  const leadId = searchParams.get('leadId') || '';

  const form = useForm<CreateQuotationFormData>({
    resolver: zodResolver(createQuotationSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      leadId: leadId,
      issueDate: new Date(),
      validityDate: getDefaultValidityDate(new Date()),
      propertyId: '',
      unitId: '',
      baseRent: 0,
      serviceCharges: 0,
      parkingSpotId: null,
      parkingFee: 0,
      securityDeposit: 0,
      adminFee: 0,
      documentRequirements: ['Emirates ID', 'Passport', 'Visa'],
      paymentTerms: DEFAULT_QUOTATION_TERMS.paymentTerms,
      moveinProcedures: DEFAULT_QUOTATION_TERMS.moveinProcedures,
      cancellationPolicy: DEFAULT_QUOTATION_TERMS.cancellationPolicy,
      specialTerms: '',
    },
  });

  // Fetch properties on mount - only ACTIVE properties with at least 1 AVAILABLE unit
  useEffect(() => {
    setLoadingProperties(true);
    getProperties({ size: 100, status: PropertyStatus.ACTIVE })
      .then((response) => {
        // Filter to only include properties with at least 1 AVAILABLE unit
        const propertiesWithAvailableUnits = response.content.filter(
          (property) => (property.availableUnits ?? 0) > 0
        );
        setProperties(propertiesWithAvailableUnits);
      })
      .catch(() => {
        toast({
          title: 'Error',
          description: 'Failed to load properties',
          variant: 'destructive',
        });
      })
      .finally(() => {
        setLoadingProperties(false);
      });
  }, [toast]);

  // Fetch lead name
  useEffect(() => {
    if (leadId) {
      getLeadById(leadId).then((lead) => setLeadName(lead.fullName));
    }
  }, [leadId]);

  // Watch propertyId to fetch available parking spots
  const watchedPropertyId = form.watch('propertyId');
  const watchedUnitId = form.watch('unitId');
  const watchedParkingSpotId = form.watch('parkingSpotId');

  // Get selected property and unit for preview
  const selectedProperty = properties.find(p => p.id === watchedPropertyId) || null;
  const selectedUnit = availableUnits.find(u => u.id === watchedUnitId) || null;

  // Fetch available units when property changes
  useEffect(() => {
    if (watchedPropertyId) {
      setLoadingUnits(true);
      getAvailableUnits(watchedPropertyId)
        .then((units) => {
          setAvailableUnits(units);
        })
        .catch(() => {
          setAvailableUnits([]);
        })
        .finally(() => {
          setLoadingUnits(false);
        });
      // Reset unit selection when property changes
      form.setValue('unitId', '');
    } else {
      setAvailableUnits([]);
    }
  }, [watchedPropertyId, form]);

  // Fetch available parking spots when property changes
  useEffect(() => {
    if (watchedPropertyId) {
      setLoadingParkingSpots(true);
      getAvailableParkingSpots(watchedPropertyId)
        .then((spots) => {
          setAvailableParkingSpots(spots);
        })
        .catch(() => {
          setAvailableParkingSpots([]);
        })
        .finally(() => {
          setLoadingParkingSpots(false);
        });
      // Reset parking selection when property changes
      form.setValue('parkingSpotId', null);
      form.setValue('parkingFee', 0);
    } else {
      setAvailableParkingSpots([]);
    }
  }, [watchedPropertyId, form]);

  // Handle parking spot selection - auto-populate fee
  const handleParkingSpotChange = (spotId: string | null) => {
    form.setValue('parkingSpotId', spotId);
    if (spotId && spotId !== 'none') {
      const selectedSpot = availableParkingSpots.find((s) => s.id === spotId);
      if (selectedSpot) {
        form.setValue('parkingFee', selectedSpot.defaultFee);
      }
    } else {
      form.setValue('parkingSpotId', null);
      form.setValue('parkingFee', 0);
    }
  };

  // Watch form values for real-time calculation
  const rawWatchedValues = form.watch([
    'baseRent',
    'serviceCharges',
    'parkingFee',
    'securityDeposit',
    'adminFee',
  ]);

  // Convert to number array with defaults for undefined values
  const watchedValues: number[] = [
    rawWatchedValues[0] || 0,
    rawWatchedValues[1] || 0,
    rawWatchedValues[2] || 0,
    rawWatchedValues[3] || 0,
    rawWatchedValues[4] || 0,
  ];

  // Calculate default first payment
  const calculatedFirstPayment = calculateTotalFirstPayment({
    serviceCharges: watchedValues[1],
    parkingFee: watchedValues[2],
    securityDeposit: watchedValues[3],
    adminFee: watchedValues[4],
    yearlyRentAmount,
    numberOfCheques,
  });

  // Use firstMonthTotal from ChequeBreakdownSection if available, otherwise use calculated
  const totalFirstPayment = firstMonthTotal !== undefined ? firstMonthTotal : calculatedFirstPayment;

  // Story 3.10: Process identity documents with OCR (auto-triggered on front-side upload)
  // Note: OCR only processes front-side documents - back sides are for storage only
  const processOcrForDocument = async (
    passportFrontFile?: File | null,
    emiratesIdFrontFile?: File | null
  ) => {
    // Only process if we have at least one front-side document
    if (!passportFrontFile && !emiratesIdFrontFile) {
      return;
    }

    setIsProcessingOcr(true);
    setOcrMessage(null);
    setOcrSuccess(null);

    try {
      // Only send front-side documents for OCR processing
      const result = await processIdentityDocuments(
        passportFrontFile || undefined,
        undefined, // passportBack - not used for OCR
        emiratesIdFrontFile || undefined,
        undefined  // emiratesIdBack - not used for OCR
      );

      // Auto-fill passport fields if extracted (number and expiry only)
      if (result.passportDetails) {
        const passport = result.passportDetails;
        if (passport.documentNumber && !passportNumber) {
          setPassportNumber(passport.documentNumber);
        }
        if (passport.expiryDate && !passportExpiry) {
          setPassportExpiry(new Date(passport.expiryDate));
        }
      }

      // Auto-fill Emirates ID fields if extracted (including nationality and name)
      if (result.emiratesIdDetails) {
        const emiratesId = result.emiratesIdDetails;
        if (emiratesId.documentNumber && !emiratesIdNumber) {
          setEmiratesIdNumber(emiratesId.documentNumber);
        }
        if (emiratesId.expiryDate && !emiratesIdExpiry) {
          setEmiratesIdExpiry(new Date(emiratesId.expiryDate));
        }
        // SCP-2025-12-12: ALWAYS override tenant name from Emirates ID (even if pre-populated from lead)
        if (emiratesId.fullName) {
          setLeadName(emiratesId.fullName);
        }
        // SCP-2025-12-12: Extract DOB from Emirates ID OCR
        if (emiratesId.dateOfBirth) {
          setDateOfBirth(emiratesId.dateOfBirth);
        }
        // Auto-fill nationality from Emirates ID directly
        if (emiratesId.nationality && !nationality) {
          setNationality(emiratesId.nationality.trim());
        }
      }

      // Set message based on result
      if (result.overallStatus === IdentityOverallStatus.SUCCESS) {
        setOcrSuccess(true);
        setOcrMessage('Documents scanned successfully! Fields have been auto-filled.');
        toast({
          title: 'OCR Complete',
          description: 'Identity documents scanned successfully. Please verify the extracted data.',
        });
      } else if (result.overallStatus === IdentityOverallStatus.PARTIAL_SUCCESS) {
        setOcrSuccess(true);
        setOcrMessage('Some fields extracted. Please complete missing information manually.');
        toast({
          title: 'Partial OCR',
          description: 'Some fields could not be extracted. Please fill in missing data.',
          variant: 'default',
        });
      } else {
        setOcrSuccess(false);
        setOcrMessage('Could not extract data. Please enter details manually.');
        toast({
          title: 'OCR Failed',
          description: 'Could not extract data from documents. Please enter details manually.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('OCR processing error:', error);
      setOcrSuccess(false);
      setOcrMessage('An error occurred during scanning. Please enter details manually.');
      toast({
        title: 'OCR Error',
        description: 'Failed to process documents. Please enter details manually.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessingOcr(false);
    }
  };

  // Story 3.10: Handler for Emirates ID front upload - auto-triggers OCR
  const handleEmiratesIdFrontUpload = (file: File | null) => {
    setEmiratesIdFront(file);
    if (file) {
      // Auto-trigger OCR with the new Emirates ID front (include existing passport front if any)
      processOcrForDocument(passportFront, file);
    }
  };

  // Story 3.10: Handler for Passport front upload - auto-triggers OCR
  const handlePassportFrontUpload = (file: File | null) => {
    setPassportFront(file);
    if (file) {
      // Auto-trigger OCR with the new passport front (include existing Emirates ID front if any)
      processOcrForDocument(file, emiratesIdFront);
    }
  };

  // Validate document uploads before form submission
  const validateDocuments = (): boolean => {
    const errors: string[] = [];

    if (!emiratesIdFront) {
      errors.push('Emirates ID front side is required');
    }
    if (!emiratesIdBack) {
      errors.push('Emirates ID back side is required');
    }
    if (!emiratesIdNumber.trim()) {
      errors.push('Emirates ID number is required');
    }
    if (!emiratesIdExpiry) {
      errors.push('Emirates ID expiry date is required');
    }
    if (!passportFront) {
      errors.push('Passport front side is required');
    }
    if (!passportBack) {
      errors.push('Passport back side is required');
    }
    if (!passportNumber.trim()) {
      errors.push('Passport number is required');
    }
    if (!passportExpiry) {
      errors.push('Passport expiry date is required');
    }
    if (!nationality.trim()) {
      errors.push('Nationality is required');
    }

    setDocumentErrors(errors);
    return errors.length === 0;
  };

  // Step validation
  const validateStep = useCallback((step: number): boolean => {
    switch (step) {
      case 1: // Property
        const propertyId = form.getValues('propertyId');
        const unitId = form.getValues('unitId');
        if (!propertyId || !unitId) {
          toast({
            title: 'Required Fields',
            description: 'Please select a property and unit to continue',
            variant: 'destructive',
          });
          return false;
        }
        return true;
      case 2: // Identity
        const isValid = validateDocuments();
        if (!isValid) {
          // Show toast with first error
          const errors: string[] = [];
          if (!emiratesIdFront) errors.push('Emirates ID front side is required');
          else if (!emiratesIdBack) errors.push('Emirates ID back side is required');
          else if (!emiratesIdNumber.trim()) errors.push('Emirates ID number is required');
          else if (!emiratesIdExpiry) errors.push('Emirates ID expiry date is required');
          else if (!passportFront) errors.push('Passport front side is required');
          else if (!passportBack) errors.push('Passport back side is required');
          else if (!passportNumber.trim()) errors.push('Passport number is required');
          else if (!passportExpiry) errors.push('Passport expiry date is required');
          else if (!nationality.trim()) errors.push('Nationality is required');

          if (errors.length > 0) {
            toast({
              title: 'Identity Documents Required',
              description: errors[0],
              variant: 'destructive',
            });
          }
        }
        return isValid;
      case 3: // Financials
        const securityDeposit = form.getValues('securityDeposit');
        if (!securityDeposit || securityDeposit <= 0) {
          toast({
            title: 'Required Fields',
            description: 'Please enter the security deposit',
            variant: 'destructive',
          });
          return false;
        }
        // Validate yearly rent amount is entered
        if (yearlyRentAmount <= 0) {
          toast({
            title: 'Required Fields',
            description: 'Please enter the yearly rent amount',
            variant: 'destructive',
          });
          return false;
        }
        return true;
      case 4: // Terms - validate all required form fields
        const paymentTerms = form.getValues('paymentTerms');
        const moveinProcedures = form.getValues('moveinProcedures');
        const cancellationPolicy = form.getValues('cancellationPolicy');
        const documentRequirements = form.getValues('documentRequirements');

        if (!documentRequirements || documentRequirements.length === 0) {
          toast({
            title: 'Required Fields',
            description: 'Please select at least one document requirement',
            variant: 'destructive',
          });
          return false;
        }
        if (!paymentTerms || paymentTerms.length < 10) {
          toast({
            title: 'Required Fields',
            description: 'Payment terms must be at least 10 characters',
            variant: 'destructive',
          });
          return false;
        }
        if (!moveinProcedures || moveinProcedures.length < 10) {
          toast({
            title: 'Required Fields',
            description: 'Move-in procedures must be at least 10 characters',
            variant: 'destructive',
          });
          return false;
        }
        if (!cancellationPolicy || cancellationPolicy.length < 10) {
          toast({
            title: 'Required Fields',
            description: 'Cancellation policy must be at least 10 characters',
            variant: 'destructive',
          });
          return false;
        }
        return true;
      default:
        return true;
    }
  }, [form, toast, validateDocuments, emiratesIdFront, emiratesIdBack, emiratesIdNumber, emiratesIdExpiry, passportFront, passportBack, passportNumber, passportExpiry, nationality, yearlyRentAmount]);

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
      // Scroll to top of content area when moving to next step
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    // Scroll to top of content area when moving to previous step
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Helper to convert date to YYYY-MM-DD format for backend (LocalDate)
  // IMPORTANT: Use local date components to avoid timezone shifts (toISOString converts to UTC)
  const formatDateForBackend = (date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const onSubmit = async (data: CreateQuotationFormData) => {
    // Validate document uploads first
    if (!validateDocuments()) {
      toast({
        title: 'Document Validation Error',
        description: 'Please upload all required identity documents',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Upload documents to S3 first
      toast({
        title: 'Uploading documents...',
        description: 'Please wait while we upload your identity documents',
      });

      // Upload all four documents in parallel
      const [emiratesIdFrontPath, emiratesIdBackPath, passportFrontPath, passportBackPath] = await Promise.all([
        uploadQuotationDocument(emiratesIdFront!, 'emirates_id_front'),
        uploadQuotationDocument(emiratesIdBack!, 'emirates_id_back'),
        uploadQuotationDocument(passportFront!, 'passport_front'),
        uploadQuotationDocument(passportBack!, 'passport_back'),
      ]);

      // Build payload with document paths from S3
      const payload: CreateQuotationRequest = {
        leadId: data.leadId,
        issueDate: formatDateForBackend(data.issueDate),
        validityDate: formatDateForBackend(data.validityDate),
        propertyId: data.propertyId,
        unitId: data.unitId,
        baseRent: data.baseRent || 0,
        serviceCharges: data.serviceCharges,
        parkingSpotId: data.parkingSpotId || undefined,
        parkingFee: data.parkingFee,
        securityDeposit: data.securityDeposit,
        adminFee: data.adminFee,
        // Convert documentRequirements array to string array (backend expects String[])
        documentRequirements: Array.isArray(data.documentRequirements)
          ? data.documentRequirements
          : [data.documentRequirements],
        paymentTerms: data.paymentTerms,
        moveinProcedures: data.moveinProcedures,
        cancellationPolicy: data.cancellationPolicy,
        specialTerms: data.specialTerms,
        // Document metadata
        emiratesIdNumber,
        emiratesIdExpiry: formatDateForBackend(emiratesIdExpiry!),
        passportNumber,
        passportExpiry: formatDateForBackend(passportExpiry!),
        nationality,
        // SCP-2025-12-12: Full name and DOB from Emirates ID OCR
        fullName: leadName || undefined,
        dateOfBirth: dateOfBirth || undefined,
        // Document file paths from S3 upload
        emiratesIdFrontPath,
        emiratesIdBackPath,
        passportFrontPath,
        passportBackPath,
        // SCP-2025-12-06: Cheque breakdown data
        yearlyRentAmount: yearlyRentAmount > 0 ? yearlyRentAmount : undefined,
        numberOfCheques: numberOfCheques > 0 ? numberOfCheques : undefined,
        firstMonthPaymentMethod: yearlyRentAmount > 0 ? firstMonthPaymentMethod : undefined,
        firstMonthTotal: firstMonthTotal, // Custom first month total (includes one-time fees + first rent)
        chequeBreakdown: chequeBreakdown.length > 0 ? chequeBreakdown : undefined,
      };

      const quotation = await createQuotation(payload);

      toast({
        title: 'Success',
        description: `Quotation ${quotation.quotationNumber} created successfully`,
        variant: 'success',
      });

      router.push(`/quotations/${quotation.id}`);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error?.message || 'Failed to create quotation',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step content renderers
  const renderPropertyStep = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Dates Row */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-primary" />
          Quotation Dates
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="issueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="text-muted-foreground">Issue Date</FormLabel>
                <Popover open={issueDateOpen} onOpenChange={setIssueDateOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'h-12 justify-start text-left font-normal rounded-xl border-2 hover:border-primary/50 transition-colors',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-3 h-4 w-4 text-muted-foreground" />
                        {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        field.onChange(date);
                        // Auto-calculate Valid Until when Issue Date changes
                        if (date) {
                          form.setValue('validityDate', getDefaultValidityDate(date));
                        }
                        setIssueDateOpen(false);
                      }}
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return date < today;
                      }}
                      defaultMonth={field.value}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="validityDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="text-muted-foreground">Valid Until</FormLabel>
                <Popover open={validityDateOpen} onOpenChange={setValidityDateOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'h-12 justify-start text-left font-normal rounded-xl border-2 hover:border-primary/50 transition-colors',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-3 h-4 w-4 text-muted-foreground" />
                        {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        field.onChange(date);
                        setValidityDateOpen(false);
                      }}
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return date < today;
                      }}
                      defaultMonth={field.value}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Property & Unit Selection */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Select Property & Unit
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="propertyId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-muted-foreground">Property *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loadingProperties}>
                  <FormControl>
                    <SelectTrigger className="h-12 rounded-xl border-2 hover:border-primary/50 transition-colors">
                      <SelectValue placeholder={loadingProperties ? "Loading..." : "Choose a property"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {properties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span>{property.name}</span>
                          <span className="text-xs text-muted-foreground ml-auto">
                            ({property.availableUnits ?? 0} available)
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unitId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-muted-foreground">Unit *</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    // Auto-populate yearly rent from selected unit (unit price is YEARLY)
                    const unit = availableUnits.find(u => u.id === value);
                    if (unit) {
                      // Set yearly rent amount for cheque breakdown
                      setYearlyRentAmount(unit.monthlyRent);
                    }
                  }}
                  value={field.value}
                  disabled={!watchedPropertyId || loadingUnits}
                >
                  <FormControl>
                    <SelectTrigger className="h-12 rounded-xl border-2 hover:border-primary/50 transition-colors" data-testid="select-unit">
                      <SelectValue placeholder={loadingUnits ? "Loading..." : "Choose a unit"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableUnits.length === 0 && !loadingUnits && watchedPropertyId && (
                      <SelectItem value="no-units" disabled>No available units</SelectItem>
                    )}
                    {availableUnits.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        <div className="flex items-center justify-between w-full gap-4">
                          <span>Unit {unit.unitNumber} • {unit.bedroomCount}BR</span>
                          <span className="text-muted-foreground">{formatCurrency(unit.monthlyRent)}/yr</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );

  const renderIdentityStep = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      {documentErrors.length > 0 && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {documentErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Story 3.10: OCR Status Indicator (auto-triggered on front-side document upload) */}
      {(isProcessingOcr || ocrMessage) && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
          {isProcessingOcr ? (
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm font-medium">Scanning document and extracting details...</span>
            </div>
          ) : ocrMessage && (
            <div className={cn(
              "flex items-center gap-3 text-sm",
              ocrSuccess ? "text-green-700 dark:text-green-400" : "text-amber-700 dark:text-amber-400"
            )}>
              <Sparkles className="h-5 w-5" />
              <span>{ocrMessage}</span>
            </div>
          )}
        </div>
      )}

      {/* Emirates ID Section */}
      <div className="rounded-2xl border border-muted bg-muted/20 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <CreditCard className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Emirates ID</h3>
            <p className="text-sm text-muted-foreground">Upload front and back sides</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <FileUploadProgress
            onFileSelect={handleEmiratesIdFrontUpload}
            selectedFile={emiratesIdFront}
            accept={{ 'image/*': ['.png', '.jpg', '.jpeg'], 'application/pdf': ['.pdf'] }}
            maxSize={5 * 1024 * 1024}
            label="Front Side (OCR enabled)"
            required
            testId="upload-emirates-id-front"
            uploadStatus={isProcessingOcr && emiratesIdFront ? 'uploading' : (emiratesIdFront ? 'success' : 'idle')}
          />
          <FileUploadProgress
            onFileSelect={(file) => setEmiratesIdBack(file)}
            selectedFile={emiratesIdBack}
            accept={{ 'image/*': ['.png', '.jpg', '.jpeg'], 'application/pdf': ['.pdf'] }}
            maxSize={5 * 1024 * 1024}
            label="Back Side"
            required
            testId="upload-emirates-id-back"
            uploadStatus={emiratesIdBack ? 'success' : 'idle'}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="emiratesIdNumber" className="text-muted-foreground">ID Number *</Label>
            <Input
              id="emiratesIdNumber"
              placeholder="784-XXXX-XXXXXXX-X"
              value={emiratesIdNumber}
              onChange={(e) => setEmiratesIdNumber(e.target.value)}
              className="h-12 rounded-xl border-2"
              data-testid="input-emirates-id"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">Expiry Date *</Label>
            <Popover open={emiratesIdExpiryOpen} onOpenChange={setEmiratesIdExpiryOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full h-12 justify-start text-left font-normal rounded-xl border-2',
                    !emiratesIdExpiry && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-3 h-4 w-4 text-muted-foreground" />
                  {emiratesIdExpiry ? format(emiratesIdExpiry, 'PPP') : <span>Select date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={emiratesIdExpiry || undefined}
                  onSelect={(date) => {
                    setEmiratesIdExpiry(date || null);
                    setEmiratesIdExpiryOpen(false);
                  }}
                  disabled={(date) => date < new Date()}
                  defaultMonth={emiratesIdExpiry || new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Passport Section */}
      <div className="rounded-2xl border border-muted bg-muted/20 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Passport</h3>
            <p className="text-sm text-muted-foreground">Upload front and back sides</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <FileUploadProgress
            onFileSelect={handlePassportFrontUpload}
            selectedFile={passportFront}
            accept={{ 'image/*': ['.png', '.jpg', '.jpeg'], 'application/pdf': ['.pdf'] }}
            maxSize={5 * 1024 * 1024}
            label="Front Side (OCR enabled)"
            required
            testId="upload-passport-front"
            uploadStatus={isProcessingOcr && passportFront ? 'uploading' : (passportFront ? 'success' : 'idle')}
          />
          <FileUploadProgress
            onFileSelect={(file) => setPassportBack(file)}
            selectedFile={passportBack}
            accept={{ 'image/*': ['.png', '.jpg', '.jpeg'], 'application/pdf': ['.pdf'] }}
            maxSize={5 * 1024 * 1024}
            label="Back Side"
            required
            testId="upload-passport-back"
            uploadStatus={passportBack ? 'success' : 'idle'}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="passportNumber" className="text-muted-foreground">Passport Number *</Label>
            <Input
              id="passportNumber"
              placeholder="Enter passport number"
              value={passportNumber}
              onChange={(e) => setPassportNumber(e.target.value)}
              className="h-12 rounded-xl border-2"
              data-testid="input-passport-number"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">Expiry Date *</Label>
            <Popover open={passportExpiryOpen} onOpenChange={setPassportExpiryOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full h-12 justify-start text-left font-normal rounded-xl border-2',
                    !passportExpiry && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-3 h-4 w-4 text-muted-foreground" />
                  {passportExpiry ? format(passportExpiry, 'PPP') : <span>Select date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={passportExpiry || undefined}
                  onSelect={(date) => {
                    setPassportExpiry(date || null);
                    setPassportExpiryOpen(false);
                  }}
                  disabled={(date) => date < new Date()}
                  defaultMonth={passportExpiry || new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Nationality */}
      <div className="space-y-2">
        <Label htmlFor="nationality" className="text-muted-foreground">Nationality *</Label>
        <Input
          id="nationality"
          placeholder="Enter nationality"
          value={nationality}
          onChange={(e) => setNationality(e.target.value)}
          className="h-12 rounded-xl border-2"
          data-testid="input-nationality"
        />
      </div>
    </div>
  );

  const renderFinancialsStep = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Fees & Deposits */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Fees & Deposits
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="securityDeposit"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-muted-foreground">Security Deposit *</FormLabel>
                <FormControl>
                  <CurrencyInput
                    min={0}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    className="h-12 rounded-xl border-2"
                    data-testid="input-quotation-deposit"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="adminFee"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-muted-foreground">Admin Fee</FormLabel>
                <FormControl>
                  <CurrencyInput
                    min={0}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    className="h-12 rounded-xl border-2"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="serviceCharges"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-muted-foreground">Service Charges</FormLabel>
                <FormControl>
                  <CurrencyInput
                    min={0}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    className="h-12 rounded-xl border-2"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Parking */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Car className="h-5 w-5 text-primary" />
          Parking (Optional)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="parkingSpotId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-muted-foreground">Parking Spot</FormLabel>
                <Select
                  onValueChange={(value) => handleParkingSpotChange(value === 'none' ? null : value)}
                  value={field.value || 'none'}
                  disabled={!watchedPropertyId || loadingParkingSpots}
                >
                  <FormControl>
                    <SelectTrigger className="h-12 rounded-xl border-2" data-testid="select-parking-spot">
                      <SelectValue placeholder={loadingParkingSpots ? 'Loading...' : 'Select spot'} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">No parking needed</SelectItem>
                    {availableParkingSpots.map((spot) => (
                      <SelectItem key={spot.id} value={spot.id}>
                        {spot.spotNumber} - {formatCurrency(spot.defaultFee)}/mo
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {watchedParkingSpotId && (
            <FormField
              control={form.control}
              name="parkingFee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-muted-foreground">Parking Fee (Annual)</FormLabel>
                  <FormControl>
                    <CurrencyInput
                      min={0}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      className="h-12 rounded-xl border-2"
                      data-testid="input-parking-fee"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
      </div>

      {/* SCP-2025-12-06: Cheque Breakdown Section */}
      <ChequeBreakdownSection
        yearlyRentAmount={yearlyRentAmount}
        numberOfCheques={numberOfCheques}
        firstMonthPaymentMethod={firstMonthPaymentMethod}
        leaseStartDate={leaseStartDate}
        chequeBreakdown={chequeBreakdown}
        securityDeposit={watchedValues[3] || 0}
        adminFee={watchedValues[4] || 0}
        serviceCharges={watchedValues[1] || 0}
        parkingFee={watchedValues[2] || 0}
        onYearlyRentAmountChange={setYearlyRentAmount}
        onNumberOfChequesChange={setNumberOfCheques}
        onFirstMonthPaymentMethodChange={setFirstMonthPaymentMethod}
        onChequeBreakdownChange={setChequeBreakdown}
        onFirstMonthTotalChange={setFirstMonthTotal}
      />
    </div>
  );

  const renderTermsStep = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <FormField
        control={form.control}
        name="paymentTerms"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base font-semibold">Payment Terms</FormLabel>
            <FormControl>
              <Textarea
                rows={4}
                {...field}
                className="resize-none rounded-xl border-2 focus:border-primary/50"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="moveinProcedures"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold">Move-in Procedures</FormLabel>
              <FormControl>
                <Textarea
                  rows={4}
                  {...field}
                  className="resize-none rounded-xl border-2 focus:border-primary/50"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cancellationPolicy"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold">Cancellation Policy</FormLabel>
              <FormControl>
                <Textarea
                  rows={4}
                  {...field}
                  className="resize-none rounded-xl border-2 focus:border-primary/50"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="specialTerms"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base font-semibold">Special Terms (Optional)</FormLabel>
            <FormControl>
              <Textarea
                rows={3}
                {...field}
                placeholder="Any additional terms specific to this quotation..."
                className="resize-none rounded-xl border-2 focus:border-primary/50"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderPropertyStep();
      case 2:
        return renderIdentityStep();
      case 3:
        return renderFinancialsStep();
      case 4:
        return renderTermsStep();
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Hero Header */}
      <div className="relative overflow-hidden border-b bg-gradient-to-br from-primary/[0.03] via-background to-primary/[0.05]">
        {/* Decorative background elements */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+CjxyZWN0IHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0ibm9uZSIvPgo8Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIxIiBmaWxsPSJyZ2JhKDAsIDAsIDAsIDAuMDIpIi8+Cjwvc3ZnPg==')] opacity-60" />
        <div className="absolute -right-32 -top-32 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -left-20 bottom-0 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative container max-w-7xl mx-auto px-4 py-8">
          {/* Top Row: Back button + Step indicator */}
          <div className="flex items-center justify-between mb-6">
            <PageBackButton href="/quotations" aria-label="Back to quotations" />
            <div className="flex items-center gap-3 rounded-full bg-card/80 backdrop-blur-sm border border-primary/10 px-4 py-2 shadow-sm">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                {currentStep}
              </div>
              <span className="text-sm font-medium text-foreground">
                of {STEPS.length} steps
              </span>
              <div className="h-4 w-px bg-border" />
              <span className="text-sm text-muted-foreground">
                {STEPS[currentStep - 1].title}
              </span>
            </div>
          </div>

          {/* Main Header Content */}
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-widest text-primary">
                    New Quotation
                  </p>
                  <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
                    {leadName ? leadName : 'Create Quotation'}
                  </h1>
                </div>
              </div>
              {leadName && (
                <p className="text-muted-foreground pl-[60px]">
                  Preparing rental quotation with property details, pricing, and terms
                </p>
              )}
            </div>

            {/* Progress Pills */}
            <div className="flex items-center gap-2 lg:gap-3">
              {STEPS.map((step, index) => {
                const isCompleted = currentStep > step.id;
                const isActive = currentStep === step.id;
                const Icon = step.icon;

                return (
                  <div key={step.id} className="flex items-center gap-2 lg:gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (isCompleted) setCurrentStep(step.id);
                      }}
                      disabled={!isCompleted}
                      className={cn(
                        'group relative flex items-center gap-2 rounded-full px-3 py-2 lg:px-4 lg:py-2.5 transition-all duration-300',
                        isCompleted && 'bg-primary/10 hover:bg-primary/20 cursor-pointer',
                        isActive && 'bg-primary text-primary-foreground shadow-lg shadow-primary/25',
                        !isCompleted && !isActive && 'bg-muted/50 text-muted-foreground/50'
                      )}
                    >
                      <div className={cn(
                        'flex h-6 w-6 items-center justify-center rounded-full transition-all',
                        isCompleted && 'bg-primary text-primary-foreground',
                        isActive && 'bg-primary-foreground/20',
                        !isCompleted && !isActive && 'bg-muted-foreground/20'
                      )}>
                        {isCompleted ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <Icon className="h-3.5 w-3.5" />
                        )}
                      </div>
                      <span className={cn(
                        'text-sm font-medium hidden lg:block',
                        isActive && 'text-primary-foreground',
                        isCompleted && 'text-primary'
                      )}>
                        {step.title}
                      </span>
                    </button>
                    {index < STEPS.length - 1 && (
                      <div className={cn(
                        'h-px w-4 lg:w-6 rounded-full transition-all duration-500',
                        isCompleted ? 'bg-primary' : 'bg-muted-foreground/20'
                      )} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto px-4 py-8">

        {/* Main Content */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
            console.log('Form validation errors:', errors);
            // Show first validation error to user
            const firstError = Object.entries(errors)[0];
            if (firstError) {
              const [field, error] = firstError;
              toast({
                title: 'Validation Error',
                description: `${field}: ${(error as any)?.message || 'Invalid value'}`,
                variant: 'destructive',
              });
            }
          })} className="grid grid-cols-1 lg:grid-cols-5 gap-8" data-testid="form-quotation-create">
            {/* Left Column - Form Content */}
            <div className="lg:col-span-3">
              <div className="rounded-3xl border bg-card p-6 lg:p-8 shadow-sm">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold">
                    {STEPS[currentStep - 1].title}
                  </h2>
                  <p className="text-muted-foreground">
                    {currentStep === 1 && 'Select the property and unit for this quotation'}
                    {currentStep === 2 && 'Upload required identity documents'}
                    {currentStep === 3 && 'Set the pricing and fees'}
                    {currentStep === 4 && 'Review and customize terms'}
                  </p>
                </div>

                {renderStepContent()}

                {/* Navigation */}
                <div className="mt-8 pt-6 border-t flex items-center justify-between">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePrevious}
                      disabled={currentStep === 1}
                      className="rounded-xl"
                    >
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => router.back()}
                      className="rounded-xl"
                    >
                      Cancel
                    </Button>
                  </div>

                  {currentStep < STEPS.length ? (
                    <Button
                      type="button"
                      onClick={handleNext}
                      className="rounded-xl"
                    >
                      Continue
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="rounded-xl bg-primary hover:bg-primary/90"
                      data-testid="btn-send-quotation"
                    >
                      {isSubmitting ? (
                        <>Creating...</>
                      ) : (
                        <>
                          Create Quotation
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Live Preview */}
            <div className="lg:col-span-2">
              <div className="sticky top-8 space-y-6">
                <QuotationPreview
                  leadName={leadName}
                  selectedUnit={selectedUnit}
                  selectedProperty={selectedProperty}
                  values={watchedValues}
                  totalFirstPayment={totalFirstPayment}
                  yearlyRentAmount={yearlyRentAmount}
                  numberOfCheques={numberOfCheques}
                  firstMonthPaymentMethod={firstMonthPaymentMethod}
                />

                {/* Helper Tips */}
                <div className="rounded-2xl border bg-card/50 p-5">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Quick Tips
                  </h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      <span>Quotation validity defaults to 7 days from issue date</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      <span>Security deposit is refundable upon lease end</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      <span>All documents must be valid for at least 6 months</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}

export default function CreateQuotationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
        {/* Header Skeleton */}
        <div className="relative border-b bg-gradient-to-br from-primary/[0.03] via-background to-primary/[0.05]">
          <div className="container max-w-7xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-6">
              <div className="h-9 w-24 bg-muted animate-pulse rounded-lg" />
              <div className="h-10 w-48 bg-muted animate-pulse rounded-full" />
            </div>
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-muted animate-pulse rounded-2xl" />
                <div className="space-y-2">
                  <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                  <div className="h-8 w-48 bg-muted animate-pulse rounded-lg" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-10 w-24 bg-muted animate-pulse rounded-full" />
                    {i < 4 && <div className="h-px w-6 bg-muted animate-pulse rounded-full" />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* Content Skeleton */}
        <div className="container max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3">
              <div className="h-96 bg-muted animate-pulse rounded-3xl" />
            </div>
            <div className="lg:col-span-2">
              <div className="h-80 bg-muted animate-pulse rounded-3xl" />
            </div>
          </div>
        </div>
      </div>
    }>
      <CreateQuotationForm />
    </Suspense>
  );
}
