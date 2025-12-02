'use client';

/**
 * Vendor Registration/Edit Form Component
 * Story 5.1: Vendor Registration and Profile Management
 *
 * AC #5-11: Multi-section form for vendor registration
 * - Company Information (AC #5)
 * - Contact Information (AC #6)
 * - Service Information (AC #7)
 * - Payment Information (AC #8)
 * - Validation (AC #9, #10)
 * - Email uniqueness check (AC #11)
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Loader2,
  Building2,
  Phone,
  Briefcase,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  UserIcon,
  MailIcon,
  MapPinIcon,
  FileTextIcon,
  DollarSignIcon,
  ClockIcon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

import { vendorSchema, type VendorFormData } from '@/lib/validations/vendor';
import { checkEmailAvailability } from '@/services/vendors.service';
import {
  PaymentTerms,
  ServiceCategory,
  type VendorRequest,
  type VendorDetail,
} from '@/types/vendors';

// Payment terms options
const PAYMENT_TERMS_OPTIONS = [
  { value: PaymentTerms.NET_15, label: 'Net 15 Days' },
  { value: PaymentTerms.NET_30, label: 'Net 30 Days' },
  { value: PaymentTerms.NET_45, label: 'Net 45 Days' },
  { value: PaymentTerms.NET_60, label: 'Net 60 Days' },
];

// Service category options
const SERVICE_CATEGORY_OPTIONS = Object.values(ServiceCategory).map((category) => ({
  value: category,
  label: category.replace(/_/g, ' '),
}));

// Service areas in UAE
const SERVICE_AREA_OPTIONS = [
  'Dubai',
  'Abu Dhabi',
  'Sharjah',
  'Ajman',
  'Ras Al Khaimah',
  'Fujairah',
  'Umm Al Quwain',
];

interface VendorFormProps {
  /** Initial vendor data for editing */
  initialData?: VendorDetail;
  /** Form mode */
  mode: 'create' | 'edit';
  /** Submit handler */
  onSubmit: (data: VendorRequest) => Promise<void>;
  /** Whether submission is in progress */
  isSubmitting?: boolean;
}

export function VendorForm({ initialData, mode, onSubmit, isSubmitting = false }: VendorFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  // Email availability check state
  const [emailCheckStatus, setEmailCheckStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [emailCheckTimeout, setEmailCheckTimeout] = useState<NodeJS.Timeout | null>(null);

  // Build default values with explicit types to satisfy TypeScript
  const defaultValues: VendorFormData = {
    companyName: initialData?.companyName ?? '',
    contactPersonName: initialData?.contactPersonName ?? '',
    emiratesIdOrTradeLicense: initialData?.emiratesIdOrTradeLicense ?? '',
    trn: initialData?.trn ?? '',
    email: initialData?.email ?? '',
    phoneNumber: initialData?.phoneNumber ?? '',
    secondaryPhoneNumber: initialData?.secondaryPhoneNumber ?? '',
    address: initialData?.address ?? '',
    serviceCategories: initialData?.serviceCategories ?? [],
    serviceAreas: initialData?.serviceAreas ?? [],
    hourlyRate: initialData?.hourlyRate ?? 0,
    emergencyCalloutFee: initialData?.emergencyCalloutFee ?? null,
    paymentTerms: initialData?.paymentTerms ?? PaymentTerms.NET_30,
  };

  const form = useForm<VendorFormData>({
    resolver: zodResolver(vendorSchema) as Resolver<VendorFormData>,
    defaultValues,
  });

  const email = form.watch('email');
  const serviceCategories = form.watch('serviceCategories');
  const serviceAreas = form.watch('serviceAreas');

  // Debounced email availability check (AC #11)
  useEffect(() => {
    if (emailCheckTimeout) {
      clearTimeout(emailCheckTimeout);
    }

    if (!email || email.length < 5 || !email.includes('@')) {
      setEmailCheckStatus('idle');
      return;
    }

    // Skip check if email hasn't changed (for edit mode)
    if (mode === 'edit' && email === initialData?.email) {
      setEmailCheckStatus('available');
      return;
    }

    setEmailCheckStatus('checking');
    const timeout = setTimeout(async () => {
      try {
        const excludeId = mode === 'edit' ? initialData?.id : undefined;
        const available = await checkEmailAvailability(email, excludeId);
        setEmailCheckStatus(available ? 'available' : 'taken');
      } catch (error) {
        console.error('Email check failed:', error);
        setEmailCheckStatus('idle');
      }
    }, 500);

    setEmailCheckTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [email, mode, initialData?.email, initialData?.id]);

  // Handle service category toggle
  const handleServiceCategoryToggle = (category: ServiceCategory, checked: boolean) => {
    const current = form.getValues('serviceCategories');
    if (checked) {
      form.setValue('serviceCategories', [...current, category], { shouldValidate: true });
    } else {
      form.setValue('serviceCategories', current.filter((c) => c !== category), { shouldValidate: true });
    }
  };

  // Handle service area toggle
  const handleServiceAreaToggle = (area: string, checked: boolean) => {
    const current = form.getValues('serviceAreas') || [];
    if (checked) {
      form.setValue('serviceAreas', [...current, area], { shouldValidate: true });
    } else {
      form.setValue('serviceAreas', current.filter((a) => a !== area), { shouldValidate: true });
    }
  };

  // Form submission handler
  const handleSubmit = async (data: VendorFormData) => {

    // Check email availability before submission
    if (emailCheckStatus === 'taken') {
      toast({
        title: 'Email Already Registered',
        description: 'Please use a different email address',
        variant: 'destructive',
      });
      return;
    }

    const vendorRequest: VendorRequest = {
      companyName: data.companyName,
      contactPersonName: data.contactPersonName,
      emiratesIdOrTradeLicense: data.emiratesIdOrTradeLicense,
      trn: data.trn || undefined,
      email: data.email,
      phoneNumber: data.phoneNumber,
      secondaryPhoneNumber: data.secondaryPhoneNumber || undefined,
      address: data.address,
      serviceCategories: data.serviceCategories,
      serviceAreas: data.serviceAreas,
      hourlyRate: data.hourlyRate,
      emergencyCalloutFee: data.emergencyCalloutFee || undefined,
      paymentTerms: data.paymentTerms,
    };

    await onSubmit(vendorRequest);
  };

  // Email availability indicator
  const renderEmailStatus = () => {
    switch (emailCheckStatus) {
      case 'checking':
        return (
          <span className="flex items-center text-sm text-muted-foreground">
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            Checking...
          </span>
        );
      case 'available':
        return (
          <span className="flex items-center text-sm text-green-600">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Available
          </span>
        );
      case 'taken':
        return (
          <span className="flex items-center text-sm text-red-600">
            <AlertCircle className="mr-1 h-3 w-3" />
            Already registered
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        {/* Company Information Section (AC #5) */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <CardTitle>Company Information</CardTitle>
            </div>
            <CardDescription>Basic company details and identification</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Company Name */}
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <Label htmlFor="companyName" className="flex items-center gap-1">
                    Company Name <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Building2 className="size-4" />
                    </div>
                    <FormControl>
                      <Input
                        id="companyName"
                        className="pl-9"
                        {...field}
                        placeholder="Enter company name"
                        data-testid="vendor-company-name"
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Contact Person Name */}
            <FormField
              control={form.control}
              name="contactPersonName"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <Label htmlFor="contactPersonName" className="flex items-center gap-1">
                    Contact Person Name <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <UserIcon className="size-4" />
                    </div>
                    <FormControl>
                      <Input
                        id="contactPersonName"
                        className="pl-9"
                        {...field}
                        placeholder="Full name of primary contact"
                        data-testid="vendor-contact-person"
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Emirates ID or Trade License */}
              <FormField
                control={form.control}
                name="emiratesIdOrTradeLicense"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <Label htmlFor="emiratesIdOrTradeLicense" className="flex items-center gap-1">
                      Emirates ID / Trade License <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <FileTextIcon className="size-4" />
                      </div>
                      <FormControl>
                        <Input
                          id="emiratesIdOrTradeLicense"
                          className="pl-9"
                          {...field}
                          placeholder="Emirates ID or Trade License number"
                          data-testid="vendor-emirates-id"
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* TRN (Optional) */}
              <FormField
                control={form.control}
                name="trn"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <Label htmlFor="trn">Tax Registration Number (TRN)</Label>
                    <div className="relative">
                      <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <FileTextIcon className="size-4" />
                      </div>
                      <FormControl>
                        <Input
                          id="trn"
                          className="pl-9"
                          {...field}
                          placeholder="15-digit TRN (optional)"
                          maxLength={15}
                          data-testid="vendor-trn"
                        />
                      </FormControl>
                    </div>
                    <p className="text-muted-foreground text-xs">UAE TRN for VAT purposes</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Information Section (AC #6) */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" />
              <CardTitle>Contact Information</CardTitle>
            </div>
            <CardDescription>How to reach the vendor</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email" className="flex items-center gap-1">
                      Email Address <span className="text-destructive">*</span>
                    </Label>
                    {renderEmailStatus()}
                  </div>
                  <div className="relative">
                    <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <MailIcon className="size-4" />
                    </div>
                    <FormControl>
                      <Input
                        id="email"
                        className={cn(
                          'pl-9',
                          emailCheckStatus === 'taken' && 'border-red-500 focus-visible:ring-red-500'
                        )}
                        {...field}
                        type="email"
                        placeholder="vendor@company.com"
                        data-testid="vendor-email"
                      />
                    </FormControl>
                  </div>
                  <p className="text-muted-foreground text-xs">Must be unique across all vendors</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Phone Number */}
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <Label htmlFor="phoneNumber" className="flex items-center gap-1">
                      Phone Number <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Phone className="size-4" />
                      </div>
                      <FormControl>
                        <Input
                          id="phoneNumber"
                          className="pl-9"
                          {...field}
                          type="tel"
                          placeholder="+971501234567"
                          data-testid="vendor-phone"
                        />
                      </FormControl>
                    </div>
                    <p className="text-muted-foreground text-xs">E.164 format (e.g., +971501234567)</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Secondary Phone */}
              <FormField
                control={form.control}
                name="secondaryPhoneNumber"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <Label htmlFor="secondaryPhoneNumber">Secondary Phone</Label>
                    <div className="relative">
                      <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Phone className="size-4" />
                      </div>
                      <FormControl>
                        <Input
                          id="secondaryPhoneNumber"
                          className="pl-9"
                          {...field}
                          type="tel"
                          placeholder="+971501234567 (optional)"
                          data-testid="vendor-secondary-phone"
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Address */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <Label htmlFor="address" className="flex items-center gap-1">
                    Business Address <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <div className="text-muted-foreground pointer-events-none absolute top-3 left-0 flex items-start pl-3">
                      <MapPinIcon className="size-4" />
                    </div>
                    <FormControl>
                      <Textarea
                        id="address"
                        className="min-h-20 pl-9"
                        {...field}
                        placeholder="Full business address including building, street, area, and city"
                        data-testid="vendor-address"
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Service Information Section (AC #7) */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              <CardTitle>Service Information</CardTitle>
            </div>
            <CardDescription>Services offered and coverage areas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Service Categories */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                Service Categories <span className="text-destructive">*</span>
              </Label>
              <p className="text-muted-foreground text-xs mb-3">
                Select all service categories the vendor provides
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {SERVICE_CATEGORY_OPTIONS.map((option) => (
                  <div
                    key={option.value}
                    className={cn(
                      'flex items-center space-x-2 border rounded-lg p-3 cursor-pointer transition-colors',
                      serviceCategories.includes(option.value)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    )}
                    onClick={() =>
                      handleServiceCategoryToggle(
                        option.value,
                        !serviceCategories.includes(option.value)
                      )
                    }
                    data-testid={`service-category-${option.value}`}
                  >
                    <Checkbox
                      checked={serviceCategories.includes(option.value)}
                      onCheckedChange={(checked) =>
                        handleServiceCategoryToggle(option.value, checked as boolean)
                      }
                    />
                    <span className="text-sm font-medium">{option.label}</span>
                  </div>
                ))}
              </div>
              {form.formState.errors.serviceCategories && (
                <p className="text-sm font-medium text-destructive mt-2">
                  {form.formState.errors.serviceCategories.message}
                </p>
              )}
            </div>

            <Separator />

            {/* Service Areas */}
            <div className="space-y-2">
              <Label>Service Areas</Label>
              <p className="text-muted-foreground text-xs mb-3">
                Select the emirates where the vendor can provide services
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {SERVICE_AREA_OPTIONS.map((area) => (
                  <div
                    key={area}
                    className={cn(
                      'flex items-center space-x-2 border rounded-lg p-3 cursor-pointer transition-colors',
                      serviceAreas?.includes(area)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    )}
                    onClick={() =>
                      handleServiceAreaToggle(area, !serviceAreas?.includes(area))
                    }
                    data-testid={`service-area-${area.replace(/\s+/g, '-')}`}
                  >
                    <Checkbox
                      checked={serviceAreas?.includes(area) || false}
                      onCheckedChange={(checked) =>
                        handleServiceAreaToggle(area, checked as boolean)
                      }
                    />
                    <span className="text-sm font-medium">{area}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Information Section (AC #8) */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <CardTitle>Payment Information</CardTitle>
            </div>
            <CardDescription>Rates and payment terms</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Hourly Rate */}
              <FormField
                control={form.control}
                name="hourlyRate"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <Label htmlFor="hourlyRate" className="flex items-center gap-1">
                      Hourly Rate <span className="text-destructive">*</span>
                    </Label>
                    <FormControl>
                      <NumberInput
                        id="hourlyRate"
                        min={0}
                        step={0.01}
                        placeholder="0.00"
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        data-testid="vendor-hourly-rate"
                      />
                    </FormControl>
                    <p className="text-muted-foreground text-xs">Hourly rate in AED</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Emergency Callout Fee */}
              <FormField
                control={form.control}
                name="emergencyCalloutFee"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <Label htmlFor="emergencyCalloutFee">Emergency Callout Fee</Label>
                    <FormControl>
                      <NumberInput
                        id="emergencyCalloutFee"
                        min={0}
                        step={0.01}
                        placeholder="0.00 (optional)"
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        data-testid="vendor-emergency-fee"
                      />
                    </FormControl>
                    <p className="text-muted-foreground text-xs">Fee for emergency/after-hours service (AED)</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Payment Terms */}
              <FormField
                control={form.control}
                name="paymentTerms"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <Label className="flex items-center gap-1">
                      Payment Terms <span className="text-destructive">*</span>
                    </Label>
                    <Select onValueChange={field.onChange} value={field.value || PaymentTerms.NET_30}>
                      <FormControl>
                        <SelectTrigger data-testid="vendor-payment-terms" className="w-full">
                          <ClockIcon className="size-4 text-muted-foreground" />
                          <SelectValue placeholder="Select payment terms" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PAYMENT_TERMS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Email taken warning */}
        {emailCheckStatus === 'taken' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This email address is already registered with another vendor. Please use a different
              email address.
            </AlertDescription>
          </Alert>
        )}

        {/* Form Actions */}
        <div className="flex justify-end gap-4 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
            data-testid="vendor-form-cancel"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || emailCheckStatus === 'taken' || emailCheckStatus === 'checking'}
            data-testid="vendor-form-submit"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting
              ? mode === 'create'
                ? 'Registering...'
                : 'Saving...'
              : mode === 'create'
              ? 'Register Vendor'
              : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
