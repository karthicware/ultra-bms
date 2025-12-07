'use client';

/**
 * Step 2: Lease Information
 * Select property, unit, and lease dates
 * Updated: shadcn-studio form styling (SCP-2025-11-30)
 * SCP-2025-12-07: Auto-close datepicker, auto-populate lease dates (today + 1 year)
 * SCP-2025-12-07: Support pre-populated property/unit from lead conversion
 */

import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, differenceInMonths, addYears } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CalendarIcon, Building2, DoorOpenIcon, AlertCircle } from 'lucide-react';

import { leaseInfoSchema, type LeaseInfoFormData } from '@/lib/validations/tenant';
import { getProperties, getAvailableUnits } from '@/services/tenant.service';
import { getUnitById } from '@/services/units.service';
import { LeaseType } from '@/types/tenant';
import type { Property, Unit } from '@/types';
import { cn } from '@/lib/utils';

interface LeaseInfoStepProps {
  data: LeaseInfoFormData;
  onComplete: (data: LeaseInfoFormData) => void;
  onBack: () => void;
  /** SCP-2025-12-07: Indicates if this is a lead conversion flow (pre-populated unit) */
  isLeadConversion?: boolean;
}

export function LeaseInfoStep({ data, onComplete, onBack, isLeadConversion = false }: LeaseInfoStepProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoadingProperties, setIsLoadingProperties] = useState(true);
  const [isLoadingUnits, setIsLoadingUnits] = useState(false);
  // SCP-2025-12-07: State for controlling datepicker popovers (auto-close after selection)
  const [startDatePickerOpen, setStartDatePickerOpen] = useState(false);
  const [endDatePickerOpen, setEndDatePickerOpen] = useState(false);
  // SCP-2025-12-07: Store preselected unit for lead conversion
  const [preselectedUnit, setPreselectedUnit] = useState<Unit | null>(null);
  // Track if we're waiting for a preselected unit to load
  const [isLoadingPreselectedUnit, setIsLoadingPreselectedUnit] = useState(!!data.unitId);

  // SCP-2025-12-07: Auto-populate lease dates - start=today, end=1 year after
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const oneYearFromToday = addYears(today, 1);

  const form = useForm<LeaseInfoFormData>({
    resolver: zodResolver(leaseInfoSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      ...data,
      // SCP-2025-12-07: Default lease dates to today and 1 year from today
      leaseStartDate: data.leaseStartDate || today,
      leaseEndDate: data.leaseEndDate || oneYearFromToday,
    },
  });

  const selectedPropertyId = form.watch('propertyId');
  const leaseStartDate = form.watch('leaseStartDate');
  const leaseEndDate = form.watch('leaseEndDate');

  // Calculate lease duration
  const leaseDuration =
    leaseStartDate && leaseEndDate
      ? differenceInMonths(leaseEndDate, leaseStartDate)
      : 0;

  // Load properties on mount
  useEffect(() => {
    async function loadProperties() {
      try {
        const data = await getProperties();
        setProperties(data);
      } catch (error) {
        console.error('Failed to load properties:', error);
      } finally {
        setIsLoadingProperties(false);
      }
    }
    loadProperties();
  }, []);

  // SCP-2025-12-07: Load preselected unit from quotation if it's a lead conversion
  // This effect loads the unit details so it can be shown in the dropdown even if not in AVAILABLE list
  useEffect(() => {
    async function loadPreselectedUnit() {
      // Only fetch if we have a preselected unitId from lead conversion data
      const preselectedUnitId = data.unitId;
      if (!preselectedUnitId) {
        setIsLoadingPreselectedUnit(false);
        return;
      }
      // Skip if already loaded the same unit
      if (preselectedUnit?.id === preselectedUnitId) {
        setIsLoadingPreselectedUnit(false);
        return;
      }

      console.log('[LeaseInfoStep] Loading preselected unit:', preselectedUnitId);
      setIsLoadingPreselectedUnit(true);

      try {
        const unitData = await getUnitById(preselectedUnitId);
        console.log('[LeaseInfoStep] Loaded unit data:', unitData);
        // Convert UnitResponse to Unit type for consistency
        const unit: Unit = {
          id: unitData.id,
          propertyId: unitData.propertyId || data.propertyId,
          unitNumber: unitData.unitNumber,
          floor: unitData.floor,
          bedroomCount: unitData.bedroomCount,
          bathroomCount: unitData.bathroomCount,
          monthlyRent: unitData.monthlyRent,
          status: unitData.status,
          squareFootage: unitData.squareFootage,
          amenities: unitData.amenities || [],
        };
        setPreselectedUnit(unit);
      } catch (error) {
        console.error('[LeaseInfoStep] Failed to load preselected unit:', error);
      } finally {
        setIsLoadingPreselectedUnit(false);
      }
    }
    loadPreselectedUnit();
  }, [data.unitId, data.propertyId, preselectedUnit?.id]);

  // Load units when property is selected
  useEffect(() => {
    async function loadUnits() {
      if (!selectedPropertyId) {
        setUnits([]);
        return;
      }

      setIsLoadingUnits(true);
      const currentUnitId = form.getValues('unitId');
      console.log('[LeaseInfoStep] Loading units for property:', selectedPropertyId, 'currentUnitId:', currentUnitId, 'preselectedUnit:', preselectedUnit?.id);

      try {
        const availableUnits = await getAvailableUnits(selectedPropertyId);
        console.log('[LeaseInfoStep] Available units loaded:', availableUnits.length, availableUnits.map(u => ({ id: u.id, number: u.unitNumber })));

        // SCP-2025-12-07: Include preselected unit if it's not in available units list
        let finalUnits = availableUnits;

        // Check if the preselected unit is already in the available list
        if (preselectedUnit) {
          const unitExists = availableUnits.some(u => u.id === preselectedUnit.id);
          console.log('[LeaseInfoStep] Preselected unit exists in available units:', unitExists);
          if (!unitExists) {
            // Add preselected unit to the list (it may be RESERVED from quotation)
            finalUnits = [preselectedUnit, ...availableUnits];
            console.log('[LeaseInfoStep] Added preselected unit to list');
          }
        } else if (data.unitId && currentUnitId === data.unitId) {
          // Unit data hasn't loaded yet, but we have the ID - check if it's in available units
          const unitExists = availableUnits.some(u => u.id === data.unitId);
          console.log('[LeaseInfoStep] Checking if data.unitId is in available units:', unitExists, 'data.unitId:', data.unitId);
          // If not in available units, keep the units list as is but don't reset the unitId
          // The preselectedUnit will be added when it loads
        }

        setUnits(finalUnits);
        console.log('[LeaseInfoStep] Final units set:', finalUnits.length);

        // SCP-2025-12-07: Don't reset unit if it's preselected from lead conversion
        // Check against data.unitId (the original preselected ID) OR preselectedUnit
        const isPreselectedUnit = currentUnitId === data.unitId || (preselectedUnit && currentUnitId === preselectedUnit.id);
        if (currentUnitId && !finalUnits.find((u) => u.id === currentUnitId)) {
          // Only reset if this isn't the preselected unit
          if (!isPreselectedUnit) {
            console.log('[LeaseInfoStep] Resetting unitId because unit not in list');
            form.setValue('unitId', '');
          } else {
            console.log('[LeaseInfoStep] Keeping unitId because it is preselected unit (waiting for unit data to load)');
          }
        }
      } catch (error: any) {
        console.error('[LeaseInfoStep] Failed to load units:', {
          error,
          message: error?.message,
          response: error?.response?.data,
          status: error?.response?.status,
          propertyId: selectedPropertyId,
        });
        setUnits([]);
      } finally {
        setIsLoadingUnits(false);
      }
    }
    loadUnits();
  }, [selectedPropertyId, form, preselectedUnit]);

  const onSubmit = (values: LeaseInfoFormData) => {
    // SCP-2025-12-07: Include property name and unit number for Lease Preview display
    const selectedProperty = properties.find(p => p.id === values.propertyId);
    const selectedUnit = units.find(u => u.id === values.unitId) || preselectedUnit;

    onComplete({
      ...values,
      propertyName: selectedProperty?.name,
      unitNumber: selectedUnit?.unitNumber,
    } as LeaseInfoFormData & { propertyName?: string; unitNumber?: string });
  };

  return (
    <Card data-testid="step-lease-info">
      <CardHeader>
        <CardTitle>Lease Information</CardTitle>
        <CardDescription>
          Select property, unit, and lease terms
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Property Selection */}
            <FormField
              control={form.control}
              name="propertyId"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <Label className="flex items-center gap-1">
                    Property <span className="text-destructive">*</span>
                  </Label>
                  {isLoadingProperties ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-property" className="w-full">
                          <div className="flex items-center gap-2">
                            <Building2 className="size-4 text-muted-foreground" />
                            <SelectValue placeholder="Select a property" />
                          </div>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {properties.map((property) => (
                          <SelectItem key={property.id} value={property.id}>
                            {property.name} - {property.address}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Unit Selection */}
            <FormField
              control={form.control}
              name="unitId"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <Label className="flex items-center gap-1">
                    Unit <span className="text-destructive">*</span>
                  </Label>
                  {isLoadingUnits || isLoadingPreselectedUnit ? (
                    <Skeleton className="h-10 w-full" />
                  ) : !selectedPropertyId ? (
                    <Alert>
                      <AlertDescription>
                        Please select a property first
                      </AlertDescription>
                    </Alert>
                  ) : units.length === 0 && !data.unitId ? (
                    <Alert>
                      <AlertDescription>
                        No available units in this property
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-unit" className="w-full">
                          <div className="flex items-center gap-2">
                            <DoorOpenIcon className="size-4 text-muted-foreground" />
                            <SelectValue placeholder="Select a unit" />
                          </div>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {units.map((unit) => (
                          <SelectItem key={unit.id} value={unit.id}>
                            <span>Unit {unit.unitNumber} - Floor {unit.floor} - {unit.bedroomCount}BR, {unit.bathroomCount}BA - AED {unit.monthlyRent}/mo</span>
                            {/* SCP-2025-12-07: Show badge for preselected unit from quotation */}
                            {preselectedUnit && unit.id === preselectedUnit.id && unit.status !== 'AVAILABLE' && (
                              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">From Quotation</span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <p className="text-muted-foreground text-xs">
                    {preselectedUnit ? 'Pre-selected unit from quotation is included' : 'Only AVAILABLE units are shown'}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Lease Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="leaseStartDate"
                render={({ field }) => (
                  <FormItem className="space-y-2 flex flex-col">
                    <Label className="flex items-center gap-1">
                      Lease Start Date <span className="text-destructive">*</span>
                    </Label>
                    {/* SCP-2025-12-07: Controlled popover with auto-close after date selection */}
                    <Popover open={startDatePickerOpen} onOpenChange={setStartDatePickerOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                            data-testid="btn-lease-start-date"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                            {field.value ? (
                              format(field.value, 'PPP')
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={(date) => {
                            field.onChange(date);
                            setStartDatePickerOpen(false); // Auto-close after selection
                            // SCP-2025-12-07: Auto-update end date to 1 year after start date
                            if (date) {
                              const newEndDate = addYears(date, 1);
                              form.setValue('leaseEndDate', newEndDate);
                            }
                          }}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <p className="text-muted-foreground text-xs">
                      Must be today or later
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="leaseEndDate"
                render={({ field }) => (
                  <FormItem className="space-y-2 flex flex-col">
                    <Label className="flex items-center gap-1">
                      Lease End Date <span className="text-destructive">*</span>
                    </Label>
                    {/* SCP-2025-12-07: Controlled popover with auto-close after date selection */}
                    <Popover open={endDatePickerOpen} onOpenChange={setEndDatePickerOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                            data-testid="btn-lease-end-date"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                            {field.value ? (
                              format(field.value, 'PPP')
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={(date) => {
                            field.onChange(date);
                            setEndDatePickerOpen(false); // Auto-close after selection
                          }}
                          disabled={(date) =>
                            leaseStartDate
                              ? date <= leaseStartDate
                              : date < new Date()
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {leaseDuration > 0 && (
                      <p className="text-muted-foreground text-xs">
                        Duration: {leaseDuration} months
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Lease Type */}
            <FormField
              control={form.control}
              name="leaseType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <Label className="flex items-center gap-1">
                    Lease Type <span className="text-destructive">*</span>
                  </Label>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value={LeaseType.FIXED_TERM} data-testid="radio-fixed-term" />
                        </FormControl>
                        <Label className="font-normal cursor-pointer">
                          Fixed Term - Set start and end dates
                        </Label>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value={LeaseType.MONTH_TO_MONTH} data-testid="radio-month-to-month" />
                        </FormControl>
                        <Label className="font-normal cursor-pointer">
                          Month to Month - Flexible monthly renewal
                        </Label>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value={LeaseType.YEARLY} data-testid="radio-yearly" />
                        </FormControl>
                        <Label className="font-normal cursor-pointer">
                          Yearly - 12-month renewable lease
                        </Label>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Renewal Option */}
            <FormField
              control={form.control}
              name="renewalOption"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="checkbox-renewal-option"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <Label>Auto-Renewal Option</Label>
                    <p className="text-muted-foreground text-xs">
                      Lease will automatically renew unless tenant or manager provides notice
                    </p>
                  </div>
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                data-testid="btn-back"
              >
                Back
              </Button>
              <Button type="submit" data-testid="btn-next">
                Next: Rent Breakdown
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
