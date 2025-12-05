/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

/**
 * Create Quotation Page
 * Form for creating quotations with real-time total calculation
 */

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon, Car, Building2, DollarSign, FileText, CreditCard } from 'lucide-react';
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
import { NumberInput } from '@/components/ui/number-input';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { createQuotation, uploadQuotationDocument } from '@/services/quotations.service';
import { getLeadById } from '@/services/leads.service';
import { getAvailableParkingSpots } from '@/services/parking.service';
import { getProperties } from '@/services/properties.service';
import { getAvailableUnits } from '@/services/units.service';
import type { Property } from '@/types/properties';
import type { Unit } from '@/types/units';
import {
  createQuotationSchema,
  type CreateQuotationFormData,
  calculateTotalFirstPayment,
  DEFAULT_QUOTATION_TERMS,
  getDefaultValidityDate,
} from '@/lib/validations/quotations';
import type { ParkingSpot } from '@/types/parking';
import { FileUploadZone } from '@/components/tenants/FileUploadZone';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED', minimumFractionDigits: 0 }).format(amount);
};

function CreateQuotationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
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
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [emiratesIdNumber, setEmiratesIdNumber] = useState('');
  const [emiratesIdExpiry, setEmiratesIdExpiry] = useState<Date | null>(null);
  const [passportNumber, setPassportNumber] = useState('');
  const [passportExpiry, setPassportExpiry] = useState<Date | null>(null);
  const [nationality, setNationality] = useState('');
  const [documentErrors, setDocumentErrors] = useState<string[]>([]);

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

  // Fetch properties on mount
  useEffect(() => {
    setLoadingProperties(true);
    getProperties({ size: 100 })
      .then((response) => {
        setProperties(response.content);
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
  const watchedParkingSpotId = form.watch('parkingSpotId');

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
  const watchedValues = form.watch([
    'baseRent',
    'serviceCharges',
    'parkingFee',
    'securityDeposit',
    'adminFee',
  ]);

  const totalFirstPayment = calculateTotalFirstPayment({
    baseRent: watchedValues[0] || 0,
    serviceCharges: watchedValues[1] || 0,
    parkingFee: watchedValues[2] || 0,
    securityDeposit: watchedValues[3] || 0,
    adminFee: watchedValues[4] || 0,
  });

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
    if (!passportFile) {
      errors.push('Passport copy is required');
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

      // Upload all three documents in parallel
      const [emiratesIdFrontPath, emiratesIdBackPath, passportFilePath] = await Promise.all([
        uploadQuotationDocument(emiratesIdFront!, 'emirates_id_front'),
        uploadQuotationDocument(emiratesIdBack!, 'emirates_id_back'),
        uploadQuotationDocument(passportFile!, 'passport'),
      ]);

      // Build payload with document paths from S3
      const payload = {
        ...data,
        issueDate: data.issueDate.toISOString(),
        validityDate: data.validityDate.toISOString(),
        // Document metadata
        emiratesIdNumber,
        emiratesIdExpiry: emiratesIdExpiry!.toISOString(),
        passportNumber,
        passportExpiry: passportExpiry!.toISOString(),
        nationality,
        // Document file paths from S3 upload
        emiratesIdFrontPath,
        emiratesIdBackPath,
        passportPath: passportFilePath,
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

  return (
    <div className="container max-w-7xl mx-auto py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Quotation</h1>
          <p className="text-muted-foreground mt-1">
            Generate a new quotation for {leadName ? <span className="font-medium text-foreground">{leadName}</span> : 'lead'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting} data-testid="btn-send-quotation">
            {isSubmitting ? 'Creating...' : 'Create Quotation'}
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8" data-testid="form-quotation-create">
          {/* Left Column - Main Form */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Property Details Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <CardTitle>Property Details</CardTitle>
                </div>
                <CardDescription>Select the unit and stay duration details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="issueDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Issue Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  'w-full pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} />
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
                        <FormLabel>Validity Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  'w-full pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < form.getValues('issueDate')}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="propertyId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Property *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loadingProperties}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={loadingProperties ? "Loading..." : "Select property"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {properties.map((property) => (
                              <SelectItem key={property.id} value={property.id}>
                                {property.name}
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
                        <FormLabel>Unit *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={!watchedPropertyId || loadingUnits}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-unit">
                              <SelectValue placeholder={loadingUnits ? "Loading..." : "Select unit"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableUnits.length === 0 && !loadingUnits && watchedPropertyId && (
                              <SelectItem value="" disabled>No available units</SelectItem>
                            )}
                            {availableUnits.map((unit) => (
                              <SelectItem key={unit.id} value={unit.id}>
                                {unit.unitNumber} - {unit.bedroomCount}BR ({formatCurrency(unit.monthlyRent)}/mo)
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

            {/* Identity Documents Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <CardTitle>Identity Documents</CardTitle>
                </div>
                <CardDescription>Upload mandatory identity documents for the lead</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {documentErrors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <ul className="list-disc list-inside">
                        {documentErrors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Emirates ID */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm">Emirates ID *</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <FileUploadZone
                        onFileSelect={(file) => setEmiratesIdFront(file)}
                        selectedFile={emiratesIdFront}
                        accept={{ 'image/*': ['.png', '.jpg', '.jpeg'], 'application/pdf': ['.pdf'] }}
                        maxSize={5 * 1024 * 1024}
                        label="Front Side"
                        required
                        testId="upload-emirates-id-front"
                      />
                    </div>
                    <div className="space-y-2">
                      <FileUploadZone
                        onFileSelect={(file) => setEmiratesIdBack(file)}
                        selectedFile={emiratesIdBack}
                        accept={{ 'image/*': ['.png', '.jpg', '.jpeg'], 'application/pdf': ['.pdf'] }}
                        maxSize={5 * 1024 * 1024}
                        label="Back Side"
                        required
                        testId="upload-emirates-id-back"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="emiratesIdNumber">Emirates ID Number *</Label>
                      <Input
                        id="emiratesIdNumber"
                        placeholder="784-XXXX-XXXXXXX-X"
                        value={emiratesIdNumber}
                        onChange={(e) => setEmiratesIdNumber(e.target.value)}
                        data-testid="input-emirates-id"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Emirates ID Expiry *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !emiratesIdExpiry && 'text-muted-foreground'
                            )}
                          >
                            {emiratesIdExpiry ? format(emiratesIdExpiry, 'PPP') : <span>Select expiry date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={emiratesIdExpiry || undefined}
                            onSelect={(date) => setEmiratesIdExpiry(date || null)}
                            disabled={(date) => date < new Date()}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Passport */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm">Passport *</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <FileUploadZone
                        onFileSelect={(file) => setPassportFile(file)}
                        selectedFile={passportFile}
                        accept={{ 'image/*': ['.png', '.jpg', '.jpeg'], 'application/pdf': ['.pdf'] }}
                        maxSize={5 * 1024 * 1024}
                        label="Passport Copy"
                        required
                        testId="upload-passport"
                      />
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="passportNumber">Passport Number *</Label>
                        <Input
                          id="passportNumber"
                          placeholder="Enter passport number"
                          value={passportNumber}
                          onChange={(e) => setPassportNumber(e.target.value)}
                          data-testid="input-passport-number"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Passport Expiry *</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !passportExpiry && 'text-muted-foreground'
                              )}
                            >
                              {passportExpiry ? format(passportExpiry, 'PPP') : <span>Select expiry date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={passportExpiry || undefined}
                              onSelect={(date) => setPassportExpiry(date || null)}
                              disabled={(date) => date < new Date()}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Nationality */}
                <div className="space-y-2">
                  <Label htmlFor="nationality">Nationality *</Label>
                  <Input
                    id="nationality"
                    placeholder="Enter nationality"
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    data-testid="input-nationality"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Financials Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <CardTitle>Financial Details</CardTitle>
                </div>
                <CardDescription>Define rent, fees, and security deposits</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="baseRent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly Rent (AED) *</FormLabel>
                        <FormControl>
                          <NumberInput
                            step={1}
                            min={0}
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            name={field.name}
                            data-testid="input-quotation-rent"
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
                        <FormLabel>Service Charges (AED)</FormLabel>
                        <FormControl>
                          <NumberInput
                            step={1}
                            min={0}
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            name={field.name}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="securityDeposit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Security Deposit (AED) *</FormLabel>
                        <FormControl>
                          <NumberInput
                            step={1}
                            min={0}
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            name={field.name}
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
                        <FormLabel>Admin Fee (AED) *</FormLabel>
                        <FormControl>
                          <NumberInput
                            step={1}
                            min={0}
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            name={field.name}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator className="my-4" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="parkingSpotId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parking Spot</FormLabel>
                        <Select
                          onValueChange={(value) => handleParkingSpotChange(value === 'none' ? null : value)}
                          value={field.value || 'none'}
                          disabled={!watchedPropertyId || loadingParkingSpots}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-parking-spot">
                              <div className="flex items-center gap-2">
                                <Car className="h-4 w-4 text-muted-foreground" />
                                <SelectValue placeholder={loadingParkingSpots ? 'Loading...' : 'Select spot'} />
                              </div>
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

                  {/* Only show parking fee field when a parking spot is selected */}
                  {watchedParkingSpotId && (
                    <FormField
                      control={form.control}
                      name="parkingFee"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Parking Fee (AED)</FormLabel>
                          <FormControl>
                            <NumberInput
                              step={1}
                              min={0}
                              value={field.value}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              name={field.name}
                              data-testid="input-parking-fee"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Terms Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <CardTitle>Terms & Conditions</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="paymentTerms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Terms</FormLabel>
                      <FormControl>
                        <Textarea rows={4} {...field} className="resize-none" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="moveinProcedures"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Move-in Procedures</FormLabel>
                        <FormControl>
                          <Textarea rows={4} {...field} className="resize-none" />
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
                        <FormLabel>Cancellation Policy</FormLabel>
                        <FormControl>
                          <Textarea rows={4} {...field} className="resize-none" />
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
                      <FormLabel>Special Terms (Optional)</FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} className="resize-none" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sticky Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-4">
              <Card className="bg-muted/20 border-muted-foreground/20 shadow-md">
                <CardHeader className="pb-4">
                  <CardTitle>Quotation Summary</CardTitle>
                  <CardDescription>Estimated Initial Payment</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Monthly Rent</span>
                      <span>{formatCurrency(watchedValues[0] || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Service Charges</span>
                      <span>{formatCurrency(watchedValues[1] || 0)}</span>
                    </div>
                    {(watchedValues[2] ?? 0) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Parking Fee</span>
                        <span>{formatCurrency(watchedValues[2] || 0)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Security Deposit</span>
                      <span>{formatCurrency(watchedValues[3] || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Admin Fee</span>
                      <span>{formatCurrency(watchedValues[4] || 0)}</span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-1">
                    <div className="flex justify-between items-end">
                      <span className="font-semibold">Total First Payment</span>
                      <span className="text-2xl font-bold text-primary" data-testid="display-total-first-payment">
                        {formatCurrency(totalFirstPayment)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground text-right">
                      Includes rent, deposit & fees
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="bg-background/50 border-t p-4">
                  <Button 
                    className="w-full" 
                    onClick={form.handleSubmit(onSubmit)} 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Creating Quotation...' : 'Create Quotation'}
                  </Button>
                </CardFooter>
              </Card>

              {/* Helper Info Card */}
              <Card>
                <CardContent className="p-4 text-sm text-muted-foreground space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    <p>Quotation validity defaults to 7 days from issue date.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    <p>Security deposit is refundable upon lease end.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}

export default function CreateQuotationPage() {
  return (
    <Suspense fallback={
      <div className="container max-w-5xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Create Quotation</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <CreateQuotationForm />
    </Suspense>
  );
}
