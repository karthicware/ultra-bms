'use client';

/**
 * Invoice Create Page
 * Story 6.1: Rent Invoicing and Payment Management
 * AC #4: Manual invoice creation with tenant selection
 */

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { createInvoice } from '@/services/invoice.service';
import { searchTenants, getTenantById } from '@/services/tenant.service';
import {
  invoiceCreateSchema,
  invoiceCreateDefaults,
  calculateInvoiceTotal,
  type InvoiceCreateFormData,
} from '@/lib/validations/invoice';
import { formatCurrency } from '@/types/invoice';
import type { TenantResponse } from '@/types';
import {
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  User,
  Building,
  Calendar,
  DollarSign,
  FileText,
} from 'lucide-react';

// Wrapper component to handle Suspense boundary for useSearchParams
export default function CreateInvoicePage() {
  return (
    <Suspense fallback={<CreateInvoicePageSkeleton />}>
      <CreateInvoicePageContent />
    </Suspense>
  );
}

function CreateInvoicePageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}

function CreateInvoicePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // Pre-selected tenant from query params
  const preselectedTenantId = searchParams.get('tenantId');

  // State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tenants, setTenants] = useState<TenantResponse[]>([]);
  const [isLoadingTenants, setIsLoadingTenants] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState<TenantResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form setup
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const invoiceResolver: any = zodResolver(invoiceCreateSchema);
  const form = useForm<InvoiceCreateFormData>({
    resolver: invoiceResolver,
    defaultValues: {
      ...invoiceCreateDefaults,
      tenantId: preselectedTenantId || '',
    },
  });

  // Field array for additional charges
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'additionalCharges',
  });

  // Watch form values for live total calculation
  const watchedValues = form.watch(['baseRent', 'serviceCharges', 'parkingFees', 'additionalCharges']);
  const calculatedTotal = calculateInvoiceTotal({
    baseRent: watchedValues[0] || 0,
    serviceCharges: watchedValues[1] || 0,
    parkingFees: watchedValues[2] || 0,
    additionalCharges: watchedValues[3] || [],
  });

  // Load tenants on mount
  useEffect(() => {
    const loadTenants = async () => {
      try {
        setIsLoadingTenants(true);
        const response = await searchTenants(searchQuery, 0, 100);
        setTenants(response.content || []);
      } catch (error) {
        console.error('Failed to load tenants:', error);
        toast({
          title: 'Error',
          description: 'Failed to load tenants',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingTenants(false);
      }
    };

    loadTenants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Load preselected tenant details
  useEffect(() => {
    const loadPreselectedTenant = async () => {
      if (preselectedTenantId) {
        try {
          const tenant = await getTenantById(preselectedTenantId);
          setSelectedTenant(tenant);
          // Pre-populate rent amounts from tenant's lease
          if (tenant.baseRent) {
            form.setValue('baseRent', tenant.baseRent);
          }
          if (tenant.serviceCharge) {
            form.setValue('serviceCharges', tenant.serviceCharge);
          }
          if (tenant.parkingFeePerSpot && tenant.parkingSpots) {
            form.setValue('parkingFees', tenant.parkingFeePerSpot * tenant.parkingSpots);
          }
        } catch (error) {
          console.error('Failed to load tenant:', error);
        }
      }
    };

    loadPreselectedTenant();
  }, [preselectedTenantId, form]);

  // Handle tenant selection
  const handleTenantSelect = async (tenantId: string) => {
    form.setValue('tenantId', tenantId);
    const tenant = tenants.find((t) => t.id === tenantId);
    if (tenant) {
      setSelectedTenant(tenant);
      // Pre-populate rent amounts from tenant's lease
      if (tenant.baseRent) {
        form.setValue('baseRent', tenant.baseRent);
      }
      if (tenant.serviceCharge) {
        form.setValue('serviceCharges', tenant.serviceCharge);
      }
      if (tenant.parkingFeePerSpot && tenant.parkingSpots) {
        form.setValue('parkingFees', tenant.parkingFeePerSpot * tenant.parkingSpots);
      }
    }
  };

  // Form submission
  const onSubmit = async (data: InvoiceCreateFormData) => {
    try {
      setIsSubmitting(true);

      const invoice = await createInvoice({
        tenantId: data.tenantId,
        leaseId: data.leaseId || undefined,
        invoiceDate: data.invoiceDate,
        dueDate: data.dueDate,
        baseRent: data.baseRent,
        serviceCharges: data.serviceCharges || 0,
        parkingFees: data.parkingFees || 0,
        additionalCharges: data.additionalCharges?.map((charge) => ({
          description: charge.description,
          amount: charge.amount,
        })),
        notes: data.notes || undefined,
      });

      toast({
        title: 'Success',
        description: `Invoice ${invoice.invoiceNumber} created successfully`,
      });

      router.push(`/invoices/${invoice.id}`);
    } catch (error) {
      console.error('Failed to create invoice:', error);
      toast({
        title: 'Error',
        description: 'Failed to create invoice. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/invoices')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Invoice</h1>
          <p className="text-muted-foreground">Create a new invoice for a tenant</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Tenant Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Tenant Selection
                </CardTitle>
                <CardDescription>Select the tenant for this invoice</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="tenantId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tenant *</FormLabel>
                      {isLoadingTenants ? (
                        <Skeleton className="h-10 w-full" />
                      ) : (
                        <Select onValueChange={handleTenantSelect} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a tenant" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {tenants.map((tenant) => (
                              <SelectItem key={tenant.id} value={tenant.id}>
                                {tenant.firstName} {tenant.lastName} - {tenant.tenantNumber}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Selected Tenant Info */}
                {selectedTenant && (
                  <div className="rounded-lg border p-4 space-y-2 bg-muted/50">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Building className="h-4 w-4" />
                      Property Details
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Property:</span>
                        <div className="font-medium">{selectedTenant.property?.name || 'N/A'}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Unit:</span>
                        <div className="font-medium">{selectedTenant.unit?.unitNumber || 'N/A'}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Email:</span>
                        <div className="font-medium">{selectedTenant.email}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Phone:</span>
                        <div className="font-medium">{selectedTenant.phone || 'N/A'}</div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Invoice Dates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Invoice Dates
                </CardTitle>
                <CardDescription>Set invoice and due dates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="invoiceDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invoice Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormDescription>
                        Payment is expected by this date
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          {/* Amounts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Amount Details
              </CardTitle>
              <CardDescription>Enter the invoice amounts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="baseRent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base Rent (AED) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="parkingFees"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parking Fees (AED)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Additional Charges */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Additional Charges</h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ description: '', amount: 0 })}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Charge
                  </Button>
                </div>

                {fields.length > 0 && (
                  <div className="space-y-3">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex gap-3 items-start">
                        <FormField
                          control={form.control}
                          name={`additionalCharges.${index}.description`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              {index === 0 && <FormLabel>Description</FormLabel>}
                              <FormControl>
                                <Input placeholder="Description" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`additionalCharges.${index}.amount`}
                          render={({ field }) => (
                            <FormItem className="w-32">
                              {index === 0 && <FormLabel>Amount</FormLabel>}
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={index === 0 ? 'mt-8' : ''}
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Total Summary */}
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total Amount</span>
                  <span className="text-primary">{formatCurrency(calculatedTotal)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Additional Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Any additional notes or comments for this invoice..."
                        className="resize-none"
                        rows={3}
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>
                      These notes will be visible on the invoice
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/invoices')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Creating...' : 'Create Invoice'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
