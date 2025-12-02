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
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { createQuotation } from '@/services/quotations.service';
import { getLeadById } from '@/services/leads.service';
import {
  createQuotationSchema,
  type CreateQuotationFormData,
  calculateTotalFirstPayment,
  DEFAULT_QUOTATION_TERMS,
  getDefaultValidityDate,
} from '@/lib/validations/quotations';
import { StayType } from '@/types';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED', minimumFractionDigits: 0 }).format(amount);
};

function CreateQuotationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leadName, setLeadName] = useState('');

  const leadId = searchParams.get('leadId') || '';

  const form = useForm<CreateQuotationFormData>({
    resolver: zodResolver(createQuotationSchema),
    defaultValues: {
      leadId: leadId,
      issueDate: new Date(),
      validityDate: getDefaultValidityDate(new Date()),
      propertyId: '',
      unitId: '',
      stayType: StayType.ONE_BHK,
      baseRent: 0,
      serviceCharges: 0,
      parkingSpots: 0,
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

  // Fetch lead name
  useEffect(() => {
    if (leadId) {
      getLeadById(leadId).then((lead) => setLeadName(lead.fullName));
    }
  }, [leadId]);

  // Watch form values for real-time calculation
  const watchedValues = form.watch([
    'baseRent',
    'serviceCharges',
    'parkingSpots',
    'parkingFee',
    'securityDeposit',
    'adminFee',
  ]);

  const totalFirstPayment = calculateTotalFirstPayment({
    baseRent: watchedValues[0] || 0,
    serviceCharges: watchedValues[1] || 0,
    parkingSpots: watchedValues[2] || 0,
    parkingFee: watchedValues[3] || 0,
    securityDeposit: watchedValues[4] || 0,
    adminFee: watchedValues[5] || 0,
  });

  const onSubmit = async (data: CreateQuotationFormData) => {
    try {
      setIsSubmitting(true);

      const payload = {
        ...data,
        issueDate: data.issueDate.toISOString(),
        validityDate: data.validityDate.toISOString(),
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
    <div className="container max-w-5xl mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Create Quotation</h1>
        <p className="text-muted-foreground">
          {leadName && `For: ${leadName}`}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="form-quotation-create">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="issueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Issue Date *</FormLabel>
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
                      <FormLabel>Validity Date *</FormLabel>
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
                      <FormDescription>Must be after issue date</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="propertyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select property" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="prop-1">Building A</SelectItem>
                          <SelectItem value="prop-2">Building B</SelectItem>
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="unit-101">Unit 101</SelectItem>
                          <SelectItem value="unit-102">Unit 102</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stayType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stay Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-stay-type">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={StayType.STUDIO}>Studio</SelectItem>
                          <SelectItem value={StayType.ONE_BHK}>1 BHK</SelectItem>
                          <SelectItem value={StayType.TWO_BHK}>2 BHK</SelectItem>
                          <SelectItem value={StayType.THREE_BHK}>3 BHK</SelectItem>
                          <SelectItem value={StayType.VILLA}>Villa</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Rent Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Rent Breakdown</CardTitle>
              <CardDescription>Enter all cost details</CardDescription>
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
                          step={0.01}
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
                      <FormLabel>Service Charges (AED) *</FormLabel>
                      <FormControl>
                        <NumberInput
                          step={0.01}
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
                  name="parkingSpots"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parking Spots *</FormLabel>
                      <FormControl>
                        <NumberInput
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
                  name="parkingFee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parking Fee per Spot (AED) *</FormLabel>
                      <FormControl>
                        <NumberInput
                          step={0.01}
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
                          step={0.01}
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
                          step={0.01}
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

              {/* Total First Payment - Real-time calculation */}
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total First Payment:</span>
                  <span className="text-2xl font-bold text-primary" data-testid="display-total-first-payment">
                    {formatCurrency(totalFirstPayment)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Terms and Conditions */}
          <Card>
            <CardHeader>
              <CardTitle>Terms and Conditions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="paymentTerms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Terms *</FormLabel>
                    <FormControl>
                      <Textarea rows={5} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="moveinProcedures"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Move-in Procedures *</FormLabel>
                    <FormControl>
                      <Textarea rows={5} {...field} />
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
                    <FormLabel>Cancellation Policy *</FormLabel>
                    <FormControl>
                      <Textarea rows={5} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="specialTerms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Special Terms (Optional)</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} data-testid="btn-send-quotation">
              {isSubmitting ? 'Creating...' : 'Create Quotation'}
            </Button>
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
