/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

/**
 * Edit Quotation Page
 * SCP-2025-12-06: Edit existing quotation with same styling as create page
 */

import { Suspense, useState, useEffect, useCallback, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import {
  CalendarIcon,
  Car,
  Building2,
  FileText,
  ChevronRight,
  ChevronLeft,
  Check,
  Sparkles,
  ArrowRight,
  Receipt,
  Shield,
  User,
  MapPin,
  AlertTriangle,
  CreditCard,
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
import { getQuotationById, updateQuotation, uploadQuotationDocument, reuploadQuotationDocument } from '@/services/quotations.service';
import { getAvailableParkingSpots } from '@/services/parking.service';
import { getProperties } from '@/services/properties.service';
import { getAvailableUnits } from '@/services/units.service';
import { PropertyStatus, type Property } from '@/types/properties';
import type { Unit } from '@/types/units';
import {
  type CreateQuotationFormData,
  calculateTotalFirstPayment,
  DEFAULT_QUOTATION_TERMS,
} from '@/lib/validations/quotations';
import type { ParkingSpot } from '@/types/parking';
import { FirstMonthPaymentMethod, type ChequeBreakdownItem, QuotationStatus, type Quotation, type UpdateQuotationRequest } from '@/types/quotations';
import { ChequeBreakdownSection } from '@/components/quotations/ChequeBreakdownSection';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Banknote, Loader2, Upload, X, FileCheck } from 'lucide-react';
import { FileUploadProgress } from '@/components/ui/file-upload-progress';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED', minimumFractionDigits: 0 }).format(amount);
};

// Step configuration (4 steps for edit - same as create)
const STEPS = [
  { id: 1, title: 'Property', description: 'Select unit', icon: Building2 },
  { id: 2, title: 'Identity', description: 'Documents', icon: User },
  { id: 3, title: 'Financials', description: 'Pricing', icon: Receipt },
  { id: 4, title: 'Terms', description: 'Conditions', icon: FileText },
];

// Progress Step Component
function ProgressStep({
  step,
  currentStep,
  isLast
}: {
  step: typeof STEPS[0];
  currentStep: number;
  isLast: boolean;
}) {
  const isCompleted = currentStep > step.id;
  const isActive = currentStep === step.id;
  const Icon = step.icon;

  return (
    <div className="flex items-center">
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "relative flex h-12 w-12 items-center justify-center rounded-2xl border-2 transition-all duration-500",
            isCompleted && "border-primary bg-primary text-primary-foreground",
            isActive && "border-primary bg-primary/10 text-primary scale-110 shadow-lg shadow-primary/20",
            !isCompleted && !isActive && "border-muted-foreground/20 text-muted-foreground/40"
          )}
        >
          {isCompleted ? (
            <Check className="h-5 w-5 animate-in zoom-in-50 duration-300" />
          ) : (
            <Icon className={cn(
              "h-5 w-5 transition-transform duration-300",
              isActive && "scale-110"
            )} />
          )}
          {isActive && (
            <span className="absolute -inset-1 rounded-2xl border-2 border-primary/30 animate-pulse" />
          )}
        </div>
        <div className="mt-3 text-center">
          <p className={cn(
            "text-sm font-medium transition-colors duration-300",
            isActive ? "text-foreground" : "text-muted-foreground"
          )}>
            {step.title}
          </p>
          <p className="text-xs text-muted-foreground/60 hidden sm:block">
            {step.description}
          </p>
        </div>
      </div>
      {!isLast && (
        <div className={cn(
          "mx-4 h-[2px] w-12 sm:w-20 lg:w-28 rounded-full transition-all duration-700",
          isCompleted ? "bg-primary" : "bg-muted"
        )} />
      )}
    </div>
  );
}

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
  const firstMonthRent = yearlyRentAmount > 0 && numberOfCheques > 0
    ? Math.round(yearlyRentAmount / numberOfCheques)
    : 0;

  const oneTimeFees = (values[1] || 0) + (values[2] || 0) + (values[3] || 0) + (values[4] || 0);
  const defaultFirstMonthTotal = oneTimeFees + firstMonthRent;
  const adjustmentAmount = totalFirstPayment - defaultFirstMonthTotal;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-primary/10 bg-gradient-to-br from-card via-card to-primary/5 p-6 shadow-xl">
      <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />

      <div className="relative">
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
            <h3 className="mt-3 text-lg font-semibold">
              {leadName || 'Quotation'}
            </h3>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Editing</p>
            <p className="text-sm font-medium">{format(new Date(), 'dd MMM yyyy')}</p>
          </div>
        </div>

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

        {yearlyRentAmount > 0 && (
          <div className="mt-6 rounded-2xl bg-primary/5 border border-primary/10 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-primary">Annual Rent</span>
              <span className="text-lg font-bold text-primary tabular-nums">
                {formatCurrency(yearlyRentAmount)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Payment Schedule (Cheque)</span>
              <span>{firstMonthPaymentMethod === FirstMonthPaymentMethod.CASH ? numberOfCheques - 1 : numberOfCheques} {(firstMonthPaymentMethod === FirstMonthPaymentMethod.CASH ? numberOfCheques - 1 : numberOfCheques) === 1 ? 'Cheque' : 'Cheques'}</span>
            </div>
          </div>
        )}

        <div className="mt-6 space-y-3">
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
              <span className="text-muted-foreground">Parking Fee</span>
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
          {adjustmentAmount > 0 && (
            <div className="flex justify-between text-sm pt-2 border-t border-dashed border-muted-foreground/30 mt-2 text-amber-600">
              <span>Extra collected</span>
              <span className="font-medium tabular-nums">+{formatCurrency(adjustmentAmount)}</span>
            </div>
          )}
        </div>

        <Separator className="my-5" />

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
            <p className="text-3xl font-bold tracking-tight text-primary">
              {formatCurrency(totalFirstPayment)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface EditQuotationPageProps {
  params: Promise<{ id: string }>;
}

function EditQuotationForm({ quotationId }: { quotationId: string }) {
  const router = useRouter();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [leadName, setLeadName] = useState('');
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [availableUnits, setAvailableUnits] = useState<Unit[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [availableParkingSpots, setAvailableParkingSpots] = useState<ParkingSpot[]>([]);
  const [loadingParkingSpots, setLoadingParkingSpots] = useState(false);

  // Identity document state (editable in edit mode)
  const [emiratesIdNumber, setEmiratesIdNumber] = useState('');
  const [emiratesIdExpiry, setEmiratesIdExpiry] = useState<Date | null>(null);
  const [passportNumber, setPassportNumber] = useState('');
  const [passportExpiry, setPassportExpiry] = useState<Date | null>(null);
  const [nationality, setNationality] = useState('');

  // Identity document file upload state
  const [emiratesIdFront, setEmiratesIdFront] = useState<File | null>(null);
  const [emiratesIdBack, setEmiratesIdBack] = useState<File | null>(null);
  const [passportFront, setPassportFront] = useState<File | null>(null);
  const [passportBack, setPassportBack] = useState<File | null>(null);
  // Existing file paths from backend
  const [existingEmiratesIdFrontPath, setExistingEmiratesIdFrontPath] = useState<string | null>(null);
  const [existingEmiratesIdBackPath, setExistingEmiratesIdBackPath] = useState<string | null>(null);
  const [existingPassportFrontPath, setExistingPassportFrontPath] = useState<string | null>(null);
  const [existingPassportBackPath, setExistingPassportBackPath] = useState<string | null>(null);
  // Upload status tracking
  const [uploadingDocument, setUploadingDocument] = useState<string | null>(null);

  // Cheque breakdown state
  const [yearlyRentAmount, setYearlyRentAmount] = useState<number>(0);
  const [numberOfCheques, setNumberOfCheques] = useState<number>(5);
  const [firstMonthPaymentMethod, setFirstMonthPaymentMethod] = useState<FirstMonthPaymentMethod>(
    FirstMonthPaymentMethod.CASH
  );
  const [chequeBreakdown, setChequeBreakdown] = useState<ChequeBreakdownItem[]>([]);
  const [leaseStartDate, setLeaseStartDate] = useState<Date>(new Date());
  const [firstMonthTotal, setFirstMonthTotal] = useState<number | undefined>(undefined);
  // SCP-2025-12-10: Payment due date state (day of month for subsequent payments)
  const [paymentDueDate, setPaymentDueDate] = useState<number>(5);

  // Popover open states
  const [issueDateOpen, setIssueDateOpen] = useState(false);
  const [validityDateOpen, setValidityDateOpen] = useState(false);
  const [emiratesIdExpiryOpen, setEmiratesIdExpiryOpen] = useState(false);
  const [passportExpiryOpen, setPassportExpiryOpen] = useState(false);

  const form = useForm<CreateQuotationFormData>({
    // Skip resolver validation - we do manual validation in validateStep
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      leadId: '',
      issueDate: new Date(),
      validityDate: new Date(),
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

  // Ref to track if initial data has been loaded - prevents form.reset from being called multiple times
  const initialDataLoaded = useRef(false);

  // Load quotation data - only run once on mount
  useEffect(() => {
    // Skip if already loaded
    if (initialDataLoaded.current) {
      return;
    }

    if (quotationId) {
      setLoading(true);
      getQuotationById(quotationId)
        .then((data) => {
          // SCP-2025-12-10: Allow editing for DRAFT, SENT, and ACCEPTED. Block CONVERTED, REJECTED, EXPIRED
          const editableStatuses = [QuotationStatus.DRAFT, QuotationStatus.SENT, QuotationStatus.ACCEPTED];
          const blockedStatuses = [QuotationStatus.CONVERTED, QuotationStatus.REJECTED, QuotationStatus.EXPIRED];

          if (blockedStatuses.includes(data.status)) {
            const statusMessage = data.status === QuotationStatus.CONVERTED
              ? 'This quotation has been converted to a tenant and cannot be edited.'
              : `This quotation is ${data.status.toLowerCase()} and cannot be edited.`;
            toast({
              title: 'Cannot Edit',
              description: statusMessage,
              variant: 'destructive',
            });
            router.push(`/quotations/${quotationId}`);
            return;
          }

          setQuotation(data);
          setLeadName(data.leadName || '');

          // Set cheque breakdown state - values only, NOT the breakdown itself
          // SCP-2025-12-10: Don't set chequeBreakdown from backend - let component recalculate
          // with today's date for first payment (always auto-populated to today)
          setYearlyRentAmount(data.yearlyRentAmount || 0);
          setNumberOfCheques(data.numberOfCheques || 5);
          setFirstMonthPaymentMethod(data.firstMonthPaymentMethod || FirstMonthPaymentMethod.CASH);
          // chequeBreakdown will be recalculated by ChequeBreakdownSection with today's date
          setFirstMonthTotal(data.firstMonthTotal);
          // SCP-2025-12-10: Load payment due date from backend (don't reset to default)
          if (data.paymentDueDate !== undefined && data.paymentDueDate !== null) {
            setPaymentDueDate(data.paymentDueDate);
          }

          // Load identity document fields
          setEmiratesIdNumber(data.emiratesIdNumber || '');
          setPassportNumber(data.passportNumber || '');
          setNationality(data.nationality || '');
          // Parse expiry dates
          if (data.emiratesIdExpiry) {
            const parsed = new Date(data.emiratesIdExpiry + 'T00:00:00');
            if (!isNaN(parsed.getTime())) {
              setEmiratesIdExpiry(parsed);
            }
          }
          if (data.passportExpiry) {
            const parsed = new Date(data.passportExpiry + 'T00:00:00');
            if (!isNaN(parsed.getTime())) {
              setPassportExpiry(parsed);
            }
          }
          // Load existing document file paths
          setExistingEmiratesIdFrontPath(data.emiratesIdFrontPath || null);
          setExistingEmiratesIdBackPath(data.emiratesIdBackPath || null);
          setExistingPassportFrontPath(data.passportFrontPath || null);
          setExistingPassportBackPath(data.passportBackPath || null);

          // Helper to safely parse date strings from backend (YYYY-MM-DD format)
          const parseBackendDate = (dateStr: string | undefined | null): Date => {
            if (!dateStr) return new Date();
            // For YYYY-MM-DD format, append time to avoid timezone issues
            const parsed = new Date(dateStr + 'T00:00:00');
            return isNaN(parsed.getTime()) ? new Date() : parsed;
          };

          // Set form values
          form.reset({
            leadId: data.leadId,
            issueDate: parseBackendDate(data.issueDate),
            validityDate: parseBackendDate(data.validityDate),
            propertyId: data.propertyId,
            unitId: data.unitId,
            baseRent: data.baseRent || 0,
            serviceCharges: data.serviceCharges || 0,
            parkingSpotId: data.parkingSpotId || null,
            parkingFee: data.parkingFee || 0,
            securityDeposit: data.securityDeposit || 0,
            adminFee: data.adminFee || 0,
            documentRequirements: Array.isArray(data.documentRequirements)
              ? data.documentRequirements
              : typeof data.documentRequirements === 'string'
                ? (data.documentRequirements as string).split(', ')
                : ['Emirates ID', 'Passport', 'Visa'],
            paymentTerms: data.paymentTerms || DEFAULT_QUOTATION_TERMS.paymentTerms,
            moveinProcedures: data.moveinProcedures || DEFAULT_QUOTATION_TERMS.moveinProcedures,
            cancellationPolicy: data.cancellationPolicy || DEFAULT_QUOTATION_TERMS.cancellationPolicy,
            specialTerms: data.specialTerms || '',
          });

          // Mark as loaded to prevent re-fetching
          initialDataLoaded.current = true;
        })
        .catch(() => {
          toast({
            title: 'Error',
            description: 'Failed to load quotation details',
            variant: 'destructive',
          });
          router.push('/leads');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quotationId]);

  // Fetch properties - run only once on mount
  useEffect(() => {
    setLoadingProperties(true);
    getProperties({ size: 100, status: PropertyStatus.ACTIVE })
      .then((response) => {
        setProperties(response.content);
      })
      .catch(() => {
        console.error('Failed to load properties');
      })
      .finally(() => {
        setLoadingProperties(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const watchedPropertyId = form.watch('propertyId');
  const watchedUnitId = form.watch('unitId');
  const watchedParkingSpotId = form.watch('parkingSpotId');

  const selectedProperty = properties.find(p => p.id === watchedPropertyId) || null;
  const selectedUnit = availableUnits.find(u => u.id === watchedUnitId) || null;

  // Track the last fetched property to avoid unnecessary refetches
  const lastFetchedPropertyId = useRef<string | null>(null);

  // Fetch units when property changes
  useEffect(() => {
    // Skip if same property was already fetched
    if (watchedPropertyId && watchedPropertyId === lastFetchedPropertyId.current) {
      return;
    }

    if (watchedPropertyId) {
      lastFetchedPropertyId.current = watchedPropertyId;
      setLoadingUnits(true);
      getAvailableUnits(watchedPropertyId)
        .then((units) => {
          // Include current unit even if not available (reserved by this quotation)
          if (quotation?.unitId && quotation?.propertyId === watchedPropertyId) {
            const currentUnitExists = units.find(u => u.id === quotation.unitId);
            if (!currentUnitExists && quotation.unitNumber) {
              // Add the current unit as a placeholder
              units.unshift({
                id: quotation.unitId,
                unitNumber: quotation.unitNumber,
                bedroomCount: 0, // Will show as current selection
                monthlyRent: quotation.yearlyRentAmount || 0,
                propertyId: watchedPropertyId,
                status: 'RESERVED',
              } as Unit);
            }
          }
          setAvailableUnits(units);
        })
        .catch(() => {
          setAvailableUnits([]);
        })
        .finally(() => {
          setLoadingUnits(false);
        });
    } else {
      setAvailableUnits([]);
      lastFetchedPropertyId.current = null;
    }
  // Only depend on watchedPropertyId - quotation fields are only used for initial load
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedPropertyId]);

  // Fetch parking spots when property changes
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
    } else {
      setAvailableParkingSpots([]);
    }
  }, [watchedPropertyId]);

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

  const rawWatchedValues = form.watch([
    'baseRent',
    'serviceCharges',
    'parkingFee',
    'securityDeposit',
    'adminFee',
  ]);

  const watchedValues: number[] = [
    rawWatchedValues[0] || 0,
    rawWatchedValues[1] || 0,
    rawWatchedValues[2] || 0,
    rawWatchedValues[3] || 0,
    rawWatchedValues[4] || 0,
  ];

  const totalFirstPayment = firstMonthTotal !== undefined && firstMonthTotal > 0
    ? firstMonthTotal
    : calculateTotalFirstPayment({
        serviceCharges: watchedValues[1],
        parkingFee: watchedValues[2],
        securityDeposit: watchedValues[3],
        adminFee: watchedValues[4],
        yearlyRentAmount,
        numberOfCheques,
      });

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
        if (!emiratesIdNumber.trim()) {
          toast({
            title: 'Identity Documents Required',
            description: 'Emirates ID number is required',
            variant: 'destructive',
          });
          return false;
        }
        if (!emiratesIdExpiry) {
          toast({
            title: 'Identity Documents Required',
            description: 'Emirates ID expiry date is required',
            variant: 'destructive',
          });
          return false;
        }
        if (!passportNumber.trim()) {
          toast({
            title: 'Identity Documents Required',
            description: 'Passport number is required',
            variant: 'destructive',
          });
          return false;
        }
        if (!passportExpiry) {
          toast({
            title: 'Identity Documents Required',
            description: 'Passport expiry date is required',
            variant: 'destructive',
          });
          return false;
        }
        if (!nationality.trim()) {
          toast({
            title: 'Identity Documents Required',
            description: 'Nationality is required',
            variant: 'destructive',
          });
          return false;
        }
        return true;
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
        if (yearlyRentAmount <= 0) {
          toast({
            title: 'Required Fields',
            description: 'Please enter the yearly rent amount',
            variant: 'destructive',
          });
          return false;
        }
        // SCP-2025-12-10: Critical validation - First month total must cover the calculated default
        // Uses calculateTotalFirstPayment (same as sidebar) to ensure consistency
        const minimumFirstMonthTotal = calculateTotalFirstPayment({
          serviceCharges: watchedValues[1],
          parkingFee: watchedValues[2],
          securityDeposit: watchedValues[3],
          adminFee: watchedValues[4],
          yearlyRentAmount,
          numberOfCheques,
        });

        if ((firstMonthTotal ?? 0) < minimumFirstMonthTotal) {
          toast({
            title: 'Invalid First Month Payment',
            description: `First Month Total Payment (${formatCurrency(firstMonthTotal ?? 0)}) cannot be less than Total First Payment (${formatCurrency(minimumFirstMonthTotal)})`,
            variant: 'destructive',
          });
          return false;
        }
        return true;
      case 4: // Terms
        const paymentTerms = form.getValues('paymentTerms');
        const moveinProcedures = form.getValues('moveinProcedures');
        const cancellationPolicy = form.getValues('cancellationPolicy');

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
  }, [form, toast, yearlyRentAmount, numberOfCheques, firstMonthTotal, watchedValues, emiratesIdNumber, emiratesIdExpiry, passportNumber, passportExpiry, nationality]);

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    }
  };

  // SCP-2025-12-10: Validate current step before allowing navigation (both next and previous)
  const handlePrevious = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.max(prev - 1, 1));
    }
  };

  // Helper to safely convert date to YYYY-MM-DD format for backend (LocalDate)
  // IMPORTANT: Use local date components to avoid timezone shifts (toISOString converts to UTC)
  const formatDateForBackend = (date: Date | string | undefined | null): string => {
    const formatLocalDate = (d: Date): string => {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    if (!date) {
      return formatLocalDate(new Date());
    }
    if (date instanceof Date) {
      // Check if valid date
      if (isNaN(date.getTime())) {
        return formatLocalDate(new Date());
      }
      return formatLocalDate(date);
    }
    if (typeof date === 'string') {
      // If already in YYYY-MM-DD format, return as is
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return date;
      }
      // Try to parse and format using local date components
      const parsed = new Date(date);
      if (!isNaN(parsed.getTime())) {
        return formatLocalDate(parsed);
      }
    }
    return formatLocalDate(new Date()); // Fallback to today
  };

  const onSubmit = async (data: CreateQuotationFormData) => {
    try {
      setIsSubmitting(true);

      // Safely convert dates to YYYY-MM-DD format for LocalDate on backend
      const issueDateValue = formatDateForBackend(data.issueDate);
      const validityDateValue = formatDateForBackend(data.validityDate);

      // Note: UpdateQuotationRequest does not have issueDate - it's set on creation
      // Only include fields that are in UpdateQuotationRequest DTO
      // Send undefined instead of 0/empty for fields to support partial updates
      // Backend validates @DecimalMin only when value is non-null
      const payload: UpdateQuotationRequest = {
        validityDate: validityDateValue,
        propertyId: data.propertyId || undefined,
        unitId: data.unitId || undefined,
        baseRent: data.baseRent && data.baseRent > 0 ? data.baseRent : undefined,
        serviceCharges: data.serviceCharges && data.serviceCharges > 0 ? data.serviceCharges : undefined,
        parkingSpotId: data.parkingSpotId || undefined,
        parkingFee: data.parkingFee && data.parkingFee > 0 ? data.parkingFee : undefined,
        securityDeposit: data.securityDeposit && data.securityDeposit > 0 ? data.securityDeposit : undefined,
        adminFee: data.adminFee && data.adminFee > 0 ? data.adminFee : undefined,
        documentRequirements: Array.isArray(data.documentRequirements)
          ? data.documentRequirements
          : undefined,
        paymentTerms: data.paymentTerms,
        moveinProcedures: data.moveinProcedures,
        cancellationPolicy: data.cancellationPolicy,
        specialTerms: data.specialTerms,
        // Only send cheque fields if yearlyRentAmount is set
        yearlyRentAmount: yearlyRentAmount > 0 ? yearlyRentAmount : undefined,
        numberOfCheques: numberOfCheques > 0 ? numberOfCheques : undefined,
        firstMonthPaymentMethod: yearlyRentAmount > 0 ? firstMonthPaymentMethod : undefined,
        firstMonthTotal: (firstMonthTotal ?? 0) > 0 ? firstMonthTotal : undefined,
        // SCP-2025-12-10: Backend expects chequeBreakdown as JSON string, not array
        chequeBreakdown: chequeBreakdown.length > 0 ? JSON.stringify(chequeBreakdown) : undefined,
        // SCP-2025-12-10: Payment due date for subsequent payments
        paymentDueDate: paymentDueDate,
        // Identity document fields
        emiratesIdNumber: emiratesIdNumber.trim() || undefined,
        emiratesIdExpiry: emiratesIdExpiry ? formatDateForBackend(emiratesIdExpiry) : undefined,
        passportNumber: passportNumber.trim() || undefined,
        passportExpiry: passportExpiry ? formatDateForBackend(passportExpiry) : undefined,
        nationality: nationality.trim() || undefined,
      };

      await updateQuotation(quotationId, payload);

      toast({
        title: 'Success',
        description: 'Quotation updated successfully',
        variant: 'success',
      });

      router.push(`/quotations/${quotationId}`);
    } catch (error: any) {
      console.error('Update quotation error:', error);
      const errorMessage = error.response?.data?.error?.message
        || error.response?.data?.message
        || error.message
        || 'Failed to update quotation';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderPropertyStep = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
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
                      defaultMonth={field.value}
                      onSelect={(date) => {
                        if (date) {
                          // Use setValue with options to ensure form state is updated properly
                          form.setValue('issueDate', date, {
                            shouldDirty: true,
                            shouldTouch: true,
                            shouldValidate: false
                          });
                        }
                        setIssueDateOpen(false);
                      }}
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return date < today;
                      }}
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
                      defaultMonth={field.value}
                      onSelect={(date) => {
                        if (date) {
                          // Use setValue with options to ensure form state is updated properly
                          form.setValue('validityDate', date, {
                            shouldDirty: true,
                            shouldTouch: true,
                            shouldValidate: false
                          });
                        }
                        setValidityDateOpen(false);
                      }}
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return date < today;
                      }}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

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
                <Select onValueChange={field.onChange} value={field.value} disabled={loadingProperties}>
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
                    const unit = availableUnits.find(u => u.id === value);
                    if (unit) {
                      setYearlyRentAmount(unit.monthlyRent);
                    }
                  }}
                  value={field.value}
                  disabled={!watchedPropertyId || loadingUnits}
                >
                  <FormControl>
                    <SelectTrigger className="h-12 rounded-xl border-2 hover:border-primary/50 transition-colors">
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

  // Handler for document re-upload - uploads new file and deletes old one
  const handleDocumentReupload = async (
    file: File | null,
    documentType: 'emirates_id_front' | 'emirates_id_back' | 'passport_front' | 'passport_back',
    existingPath: string | null,
    setFile: (file: File | null) => void,
    setExistingPath: (path: string | null) => void
  ) => {
    if (!file) {
      setFile(null);
      return;
    }

    setUploadingDocument(documentType);
    try {
      let newPath: string;
      if (existingPath) {
        // Re-upload: delete old file and upload new one
        newPath = await reuploadQuotationDocument(file, documentType, existingPath);
      } else {
        // First upload
        newPath = await uploadQuotationDocument(file, documentType);
      }
      setFile(file);
      setExistingPath(newPath);
      toast({
        title: 'Success',
        description: 'Document uploaded successfully',
        variant: 'success',
      });
    } catch (error) {
      console.error('Document upload error:', error);
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload document. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploadingDocument(null);
    }
  };

  // Helper to get filename from path
  const getFilenameFromPath = (path: string | null): string => {
    if (!path) return '';
    const parts = path.split('/');
    return parts[parts.length - 1] || '';
  };

  const renderIdentityStep = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
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

        {/* File Upload Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <FileUploadProgress
            onFileSelect={(file) => handleDocumentReupload(
              file,
              'emirates_id_front',
              existingEmiratesIdFrontPath,
              setEmiratesIdFront,
              setExistingEmiratesIdFrontPath
            )}
            selectedFile={emiratesIdFront}
            existingFileName={existingEmiratesIdFrontPath ? getFilenameFromPath(existingEmiratesIdFrontPath) : undefined}
            accept={{ 'image/*': ['.png', '.jpg', '.jpeg'], 'application/pdf': ['.pdf'] }}
            maxSize={5 * 1024 * 1024}
            label="Front Side"
            testId="upload-emirates-id-front"
            uploadStatus={uploadingDocument === 'emirates_id_front' ? 'uploading' : (emiratesIdFront || existingEmiratesIdFrontPath ? 'success' : 'idle')}
          />
          <FileUploadProgress
            onFileSelect={(file) => handleDocumentReupload(
              file,
              'emirates_id_back',
              existingEmiratesIdBackPath,
              setEmiratesIdBack,
              setExistingEmiratesIdBackPath
            )}
            selectedFile={emiratesIdBack}
            existingFileName={existingEmiratesIdBackPath ? getFilenameFromPath(existingEmiratesIdBackPath) : undefined}
            accept={{ 'image/*': ['.png', '.jpg', '.jpeg'], 'application/pdf': ['.pdf'] }}
            maxSize={5 * 1024 * 1024}
            label="Back Side"
            testId="upload-emirates-id-back"
            uploadStatus={uploadingDocument === 'emirates_id_back' ? 'uploading' : (emiratesIdBack || existingEmiratesIdBackPath ? 'success' : 'idle')}
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
                  defaultMonth={emiratesIdExpiry || new Date()}
                  onSelect={(date) => {
                    setEmiratesIdExpiry(date || null);
                    setEmiratesIdExpiryOpen(false);
                  }}
                  disabled={(date) => date < new Date()}
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

        {/* File Upload Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <FileUploadProgress
            onFileSelect={(file) => handleDocumentReupload(
              file,
              'passport_front',
              existingPassportFrontPath,
              setPassportFront,
              setExistingPassportFrontPath
            )}
            selectedFile={passportFront}
            existingFileName={existingPassportFrontPath ? getFilenameFromPath(existingPassportFrontPath) : undefined}
            accept={{ 'image/*': ['.png', '.jpg', '.jpeg'], 'application/pdf': ['.pdf'] }}
            maxSize={5 * 1024 * 1024}
            label="Front Side"
            testId="upload-passport-front"
            uploadStatus={uploadingDocument === 'passport_front' ? 'uploading' : (passportFront || existingPassportFrontPath ? 'success' : 'idle')}
          />
          <FileUploadProgress
            onFileSelect={(file) => handleDocumentReupload(
              file,
              'passport_back',
              existingPassportBackPath,
              setPassportBack,
              setExistingPassportBackPath
            )}
            selectedFile={passportBack}
            existingFileName={existingPassportBackPath ? getFilenameFromPath(existingPassportBackPath) : undefined}
            accept={{ 'image/*': ['.png', '.jpg', '.jpeg'], 'application/pdf': ['.pdf'] }}
            maxSize={5 * 1024 * 1024}
            label="Back Side"
            testId="upload-passport-back"
            uploadStatus={uploadingDocument === 'passport_back' ? 'uploading' : (passportBack || existingPassportBackPath ? 'success' : 'idle')}
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
                  defaultMonth={passportExpiry || new Date()}
                  onSelect={(date) => {
                    setPassportExpiry(date || null);
                    setPassportExpiryOpen(false);
                  }}
                  disabled={(date) => date < new Date()}
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
        />
      </div>
    </div>
  );

  const renderFinancialsStep = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
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
                    <SelectTrigger className="h-12 rounded-xl border-2">
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
                  <FormLabel className="text-muted-foreground">Parking Fee</FormLabel>
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
          )}
        </div>
      </div>

      <ChequeBreakdownSection
        yearlyRentAmount={yearlyRentAmount}
        numberOfCheques={numberOfCheques}
        firstMonthPaymentMethod={firstMonthPaymentMethod}
        leaseStartDate={leaseStartDate}
        chequeBreakdown={chequeBreakdown}
        paymentDueDate={paymentDueDate}
        onPaymentDueDateChange={setPaymentDueDate}
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

  // Render all steps but only show the current one - this keeps form fields mounted
  // and prevents React from unmounting/remounting form fields when switching steps
  const renderAllSteps = () => (
    <>
      <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>
        {renderPropertyStep()}
      </div>
      <div style={{ display: currentStep === 2 ? 'block' : 'none' }}>
        {renderIdentityStep()}
      </div>
      <div style={{ display: currentStep === 3 ? 'block' : 'none' }}>
        {renderFinancialsStep()}
      </div>
      <div style={{ display: currentStep === 4 ? 'block' : 'none' }}>
        {renderTermsStep()}
      </div>
    </>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container max-w-7xl mx-auto px-4 py-8 lg:py-12">
          <div className="mb-10">
            <div className="h-10 w-48 bg-muted animate-pulse rounded-lg mb-4" />
            <div className="h-6 w-72 bg-muted animate-pulse rounded-lg" />
          </div>
          <div className="flex justify-center mb-10">
            <div className="flex items-center gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-muted animate-pulse rounded-2xl" />
                  {i < 4 && <div className="h-1 w-20 bg-muted animate-pulse rounded-full" />}
                </div>
              ))}
            </div>
          </div>
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
    );
  }

  if (!quotation) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mx-auto mb-6">
            <AlertTriangle className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Quotation Not Found</h2>
          <p className="text-muted-foreground mb-6">The quotation doesn&apos;t exist or has been deleted.</p>
          <Button onClick={() => router.push('/leads')} className="rounded-xl">
            Back to Leads
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container max-w-7xl mx-auto px-4 py-8 lg:py-12">
        <div className="mb-10">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <PageBackButton href={`/quotations/${quotation.id}`} aria-label="Back to quotation" />
                <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">
                  Edit Quotation
                </h1>
              </div>
              <p className="mt-2 text-lg text-muted-foreground ml-[52px]">
                {quotation.quotationNumber} for <span className="text-foreground font-medium">{leadName}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="mb-10 flex justify-center">
          <div className="flex items-center">
            {STEPS.map((step, index) => (
              <ProgressStep
                key={step.id}
                step={step}
                currentStep={currentStep}
                isLast={index === STEPS.length - 1}
              />
            ))}
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3">
              <div className="rounded-3xl border bg-card p-6 lg:p-8 shadow-sm">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold">
                    {STEPS[currentStep - 1].title}
                  </h2>
                  <p className="text-muted-foreground">
                    {currentStep === 1 && 'Update property and unit selection'}
                    {currentStep === 2 && 'Update identity document details'}
                    {currentStep === 3 && 'Adjust pricing and fees'}
                    {currentStep === 4 && 'Review and update terms'}
                  </p>
                </div>

                {renderAllSteps()}

                <div className="mt-8 pt-6 border-t flex items-center justify-between">
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

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => router.back()}
                      className="rounded-xl text-muted-foreground"
                    >
                      Cancel
                    </Button>
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
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => {
                          if (validateStep(currentStep)) {
                            // Call onSubmit directly with form values
                            const formValues = form.getValues();
                            onSubmit(formValues);
                          }
                        }}
                        className="rounded-xl bg-primary hover:bg-primary/90"
                      >
                        {isSubmitting ? (
                          <>Saving...</>
                        ) : (
                          <>
                            Save Changes
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

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

                <div className="rounded-2xl border bg-card/50 p-5">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Editing Tips
                  </h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      <span>Quotations can be edited until converted to tenant</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      <span>Cheque breakdown will be recalculated if rent changes</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                      <span>Editing a sent quotation will mark it as &quot;Modified&quot;</span>
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

export default function EditQuotationPage({ params }: EditQuotationPageProps) {
  const { id } = use(params);

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container max-w-7xl mx-auto px-4 py-8 lg:py-12">
          <div className="mb-10">
            <div className="h-10 w-48 bg-muted animate-pulse rounded-lg mb-4" />
            <div className="h-6 w-72 bg-muted animate-pulse rounded-lg" />
          </div>
        </div>
      </div>
    }>
      <EditQuotationForm quotationId={id} />
    </Suspense>
  );
}
