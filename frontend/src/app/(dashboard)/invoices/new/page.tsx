'use client';

/**
 * Invoice Create Page
 * Story 6.1: Rent Invoicing and Payment Management
 * AC #4: Manual invoice creation with tenant selection
 * Updated: shadcn-studio form styling (SCP-2025-11-30)
 */

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  UserIcon,
  Building,
  CalendarIcon,
  DollarSignIcon,
  FileTextIcon,
  MessageSquareIcon,
  CarIcon,
  WrenchIcon,
  ReceiptIcon,
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
        setTenants(response.data?.content || []);
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
        variant: 'success',
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
          <div className="flex items-center gap-3">
            <ReceiptIcon className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Create Invoice</h1>
          </div>
          <p className="text-muted-foreground">Create a new invoice for a tenant</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Tenant Selection */}
          <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <UserIcon className="h-4 w-4" />
                  Tenant Selection
                </CardTitle>
                <CardDescription>Select the tenant for this invoice</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="tenantId"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <Label className="flex items-center gap-1">
                        Tenant <span className="text-destructive">*</span>
                      </Label>
                      {isLoadingTenants ? (
                        <Skeleton className="h-10 w-full" />
                      ) : (
                        <Select onValueChange={handleTenantSelect} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a tenant" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {tenants.map((tenant) => (
                              <SelectItem key={tenant.id} value={tenant.id}>
                                <div className="flex items-center gap-2">
                                  <UserIcon className="size-4 text-blue-600" />
                                  <span>{tenant.firstName} {tenant.lastName} - {tenant.tenantNumber}</span>
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
                  <CalendarIcon className="h-4 w-4" />
                  Invoice Dates
                </CardTitle>
                <CardDescription>Set invoice and due dates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="invoiceDate"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <Label htmlFor="invoiceDate" className="flex items-center gap-1">
                        Invoice Date <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <CalendarIcon className="size-4" />
                        </div>
                        <FormControl>
                          <Input id="invoiceDate" type="date" className="pl-9" {...field} />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <Label htmlFor="dueDate" className="flex items-center gap-1">
                        Due Date <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <CalendarIcon className="size-4" />
                        </div>
                        <FormControl>
                          <Input id="dueDate" type="date" className="pl-9" {...field} />
                        </FormControl>
                      </div>
                      <p className="text-muted-foreground text-xs">Payment is expected by this date</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

          {/* Amounts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSignIcon className="h-4 w-4" />
                Amount Details
              </CardTitle>
              <CardDescription>Enter the invoice amounts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="baseRent"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <Label htmlFor="baseRent" className="flex items-center gap-1">
                      Base Rent <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <DollarSignIcon className="size-4" />
                      </div>
                      <FormControl>
                        <Input
                          id="baseRent"
                          type="number"
                          className="pl-9 pr-14"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <span className="text-muted-foreground pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-sm">
                        AED
                      </span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="serviceCharges"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <Label htmlFor="serviceCharges" className="flex items-center gap-1">
                      <WrenchIcon className="size-4 mr-1 text-muted-foreground" />
                      Service Charges
                    </Label>
                    <div className="relative">
                      <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <WrenchIcon className="size-4" />
                      </div>
                      <FormControl>
                        <Input
                          id="serviceCharges"
                          type="number"
                          className="pl-9 pr-14"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <span className="text-muted-foreground pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-sm">
                        AED
                      </span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="parkingFees"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <Label htmlFor="parkingFees" className="flex items-center gap-1">
                      <CarIcon className="size-4 mr-1 text-muted-foreground" />
                      Parking Fees
                    </Label>
                    <div className="relative">
                      <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <CarIcon className="size-4" />
                      </div>
                      <FormControl>
                        <Input
                          id="parkingFees"
                          type="number"
                          className="pl-9 pr-14"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <span className="text-muted-foreground pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-sm">
                        AED
                      </span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Additional Charges */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-1">
                    <Plus className="size-4 mr-1 text-muted-foreground" />
                    Additional Charges
                  </Label>
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
                            <FormItem className="flex-1 space-y-2">
                              {index === 0 && <Label>Description</Label>}
                              <div className="relative">
                                <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                  <FileTextIcon className="size-4" />
                                </div>
                                <FormControl>
                                  <Input className="pl-9" placeholder="Description" {...field} />
                                </FormControl>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`additionalCharges.${index}.amount`}
                          render={({ field }) => (
                            <FormItem className="w-36 space-y-2">
                              {index === 0 && <Label>Amount</Label>}
                              <div className="relative">
                                <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                  <DollarSignIcon className="size-4" />
                                </div>
                                <FormControl>
                                  <Input
                                    type="number"
                                    className="pl-9"
                                    step="0.01"
                                    placeholder="0.00"
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
                              </div>
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
                <MessageSquareIcon className="h-4 w-4" />
                Additional Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <Label htmlFor="notes" className="flex items-center gap-1">
                      <MessageSquareIcon className="size-4 mr-1 text-muted-foreground" />
                      Notes
                    </Label>
                    <div className="relative">
                      <div className="text-muted-foreground pointer-events-none absolute top-3 left-0 flex items-start pl-3">
                        <MessageSquareIcon className="size-4" />
                      </div>
                      <FormControl>
                        <Textarea
                          id="notes"
                          className="pl-9 resize-none min-h-[80px]"
                          placeholder="Any additional notes or comments for this invoice..."
                          rows={3}
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                    </div>
                    <p className="text-muted-foreground text-xs">These notes will be visible on the invoice</p>
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
