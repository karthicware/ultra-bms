'use client';

/**
 * Step 2: Lease Information
 * Select property, unit, and lease dates
 * Updated: shadcn-studio form styling (SCP-2025-11-30)
 */

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, differenceInMonths } from 'date-fns';

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
import { CalendarIcon, Building2, DoorOpenIcon } from 'lucide-react';

import { leaseInfoSchema, type LeaseInfoFormData } from '@/lib/validations/tenant';
import { getProperties, getAvailableUnits } from '@/services/tenant.service';
import { LeaseType } from '@/types/tenant';
import type { Property, Unit } from '@/types';
import { cn } from '@/lib/utils';

interface LeaseInfoStepProps {
  data: LeaseInfoFormData;
  onComplete: (data: LeaseInfoFormData) => void;
  onBack: () => void;
}

export function LeaseInfoStep({ data, onComplete, onBack }: LeaseInfoStepProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoadingProperties, setIsLoadingProperties] = useState(true);
  const [isLoadingUnits, setIsLoadingUnits] = useState(false);

  const form = useForm<LeaseInfoFormData>({
    resolver: zodResolver(leaseInfoSchema),
    defaultValues: data,
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

  // Load units when property is selected
  useEffect(() => {
    async function loadUnits() {
      if (!selectedPropertyId) {
        setUnits([]);
        return;
      }

      setIsLoadingUnits(true);
      try {
        const data = await getAvailableUnits(selectedPropertyId);
        setUnits(data);
        // Reset unit selection if current unit not in new list
        const currentUnitId = form.getValues('unitId');
        if (currentUnitId && !data.find((u) => u.id === currentUnitId)) {
          form.setValue('unitId', '');
        }
      } catch (error) {
        console.error('Failed to load units:', error);
        setUnits([]);
      } finally {
        setIsLoadingUnits(false);
      }
    }
    loadUnits();
  }, [selectedPropertyId, form]);

  const onSubmit = (values: LeaseInfoFormData) => {
    onComplete(values);
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
                      defaultValue={field.value}
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
                            <div className="flex items-center gap-2">
                              <Building2 className="size-4 text-muted-foreground" />
                              <span>{property.name} - {property.address}</span>
                            </div>
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
                  {isLoadingUnits ? (
                    <Skeleton className="h-10 w-full" />
                  ) : !selectedPropertyId ? (
                    <Alert>
                      <AlertDescription>
                        Please select a property first
                      </AlertDescription>
                    </Alert>
                  ) : units.length === 0 ? (
                    <Alert>
                      <AlertDescription>
                        No available units in this property
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
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
                            <div className="flex items-center gap-2">
                              <DoorOpenIcon className="size-4 text-muted-foreground" />
                              <span>Unit {unit.unitNumber} - Floor {unit.floor} - {unit.bedroomCount}BR, {unit.bathroomCount}BA - AED {unit.monthlyRent}/mo</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <p className="text-muted-foreground text-xs">
                    Only AVAILABLE units are shown
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
                    <Popover>
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
                          onSelect={field.onChange}
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
                    <Popover>
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
                          onSelect={field.onChange}
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
