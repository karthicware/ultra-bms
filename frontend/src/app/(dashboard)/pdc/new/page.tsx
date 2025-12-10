'use client';

/**
 * PDC Registration Page
 * Story 6.3: Post-Dated Cheque (PDC) Management
 * AC #4: PDC Registration Form
 * AC #5: Bulk PDC Registration
 * Updated: Redesigned with improved layout (2-column grid) and UX (dynamic cheque entry)
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import {
  CalendarIcon,
  Plus,
  Trash2,
  Loader2,
  UserIcon,
  FileTextIcon,
  HashIcon,
  Building2Icon,
  BanknoteIcon,
  CreditCardIcon,
  SearchIcon,
  CheckCircle2,
} from 'lucide-react';
import { PageBackButton } from '@/components/common/PageBackButton';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NumberInput } from '@/components/ui/number-input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormLabel,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useCreateBulkPDCs } from '@/hooks/usePDCs';
import { searchTenants } from '@/services/tenant.service'; // Assuming tenant service is available
import {
  pdcBulkCreateSchema,
  PDCBulkCreateFormData,
  getDefaultChequeEntry,
  formatAmount,
  calculateTotalChequeAmount,
  PDC_VALIDATION_CONSTANTS,
} from '@/lib/validations/pdc';
import type { TenantResponse } from '@/types';

// Mock lease data - in real app, fetch based on selected tenant
const MOCK_LEASES = [
  { id: 'lease-1', unitNumber: 'A101', property: 'Tower A' },
  { id: 'lease-2', unitNumber: 'B205', property: 'Tower B' },
];

export default function PDCRegistrationPage() {
  const router = useRouter();
  const { mutate: createBulkPDCs, isPending } = useCreateBulkPDCs();
  const [tenants, setTenants] = useState<TenantResponse[]>([]);
  const [isLoadingTenants, setIsLoadingTenants] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState<TenantResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const form = useForm<PDCBulkCreateFormData>({
    resolver: zodResolver(pdcBulkCreateSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      tenantId: '',
      leaseId: null,
      cheques: [getDefaultChequeEntry()],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'cheques',
  });

  // Load tenants
  useEffect(() => {
    const loadTenants = async () => {
      const timer = setTimeout(async () => {
        try {
          setIsLoadingTenants(true);
          const response = await searchTenants(searchQuery, 0, 100);
          setTenants(response.data?.content || []);
        } catch (error) {
          console.error('Failed to load tenants:', error);
          // toast({
          //   title: 'Error',
          //   description: 'Failed to load tenants',
          //   variant: 'destructive',
          // });
        } finally {
          setIsLoadingTenants(false);
        }
      }, 300);
      return () => clearTimeout(timer);
    };
    loadTenants();
  }, [searchQuery]);

  // Handle tenant selection
  const handleTenantSelect = async (tenantId: string) => {
    form.setValue('tenantId', tenantId);
    const tenant = tenants.find((t) => t.id === tenantId);
    if (tenant) {
      setSelectedTenant(tenant);
      // Lease selection is manual - tenant picks from available leases
      form.setValue('leaseId', null);
    } else {
      setSelectedTenant(null);
      form.setValue('leaseId', null);
    }
  };

  // Calculate total
  const cheques = form.watch('cheques');
  const totalAmount = calculateTotalChequeAmount(cheques || []);

  // Handle form submission
  const onSubmit = (data: PDCBulkCreateFormData) => {
    createBulkPDCs({
      tenantId: data.tenantId,
      leaseId: data.leaseId || undefined,
      cheques: data.cheques.map((c) => ({
        chequeNumber: c.chequeNumber,
        bankName: c.bankName,
        amount: c.amount,
        chequeDate: c.chequeDate,
      })),
    });
  };

  return (
    <div className="container mx-auto max-w-7xl p-6 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div className="flex items-center gap-4">
          <PageBackButton href="/pdc" aria-label="Back to PDC list" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <CreditCardIcon className="h-8 w-8 text-primary hidden sm:block" />
              Register PDC
            </h1>
            <p className="text-muted-foreground">Register post-dated cheques for a tenant</p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Main Details */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Tenant Information */}
            <Card>
              <CardHeader className="bg-muted/20">
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5" />
                  Tenant & Lease Information
                </CardTitle>
                <CardDescription>Select the tenant and optionally link to a lease</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Search Tenant</Label>
                        <div className="relative">
                            <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, unit, or phone..."
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <FormField
                    control={form.control}
                    name="tenantId"
                    render={({ field }) => (
                        <FormItem>
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Select Tenant</Label>
                        {isLoadingTenants ? (
                            <Skeleton className="h-10 w-full" />
                        ) : (
                            <Select onValueChange={handleTenantSelect} value={field.value}>
                            <FormControl>
                                <SelectTrigger className="h-11">
                                <SelectValue placeholder={tenants.length === 0 ? "No tenants found" : "Select a tenant from list"} />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {tenants.map((tenant) => (
                                <SelectItem key={tenant.id} value={tenant.id}>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                        <span className="font-medium">{tenant.firstName} {tenant.lastName}</span>
                                        <span className="hidden sm:inline text-muted-foreground">-</span>
                                        <span className="text-muted-foreground text-xs sm:text-sm">{tenant.tenantNumber}</span>
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
                </div>

                {/* Selected Tenant Info Preview */}
                {selectedTenant && (
                  <div className="mt-4 rounded-lg border bg-muted/50 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold mb-3">
                      <CheckCircle2 className="h-4 w-4" />
                      Selected Tenant Details
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-1">
                        <span className="text-muted-foreground text-xs uppercase">Property</span>
                        <div className="font-medium truncate">{selectedTenant.property?.name || 'N/A'}</div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground text-xs uppercase">Unit</span>
                        <div className="font-medium">{selectedTenant.unit?.unitNumber || 'N/A'}</div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground text-xs uppercase">Email</span>
                        <div className="font-medium truncate">{selectedTenant.email}</div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground text-xs uppercase">Phone</span>
                        <div className="font-medium">{selectedTenant.phone || 'N/A'}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Lease (Optional) */}
                <FormField
                  control={form.control}
                  name="leaseId"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Link to Lease (Optional)
                      </Label>
                      {/*
                        // In a real scenario, leases would be loaded based on the selected tenant.
                        // For now, we use mock data or an empty array if no tenant is selected.
                        // A more robust solution would involve a separate API call for leases
                        // or including lease info in the tenant response.
                      */}
                      <Select
                        onValueChange={(v) => field.onChange(v === '__none__' ? null : v)}
                        value={field.value || '__none__'}
                        disabled={!selectedTenant}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select lease" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="__none__">
                            <div className="flex items-center gap-2">
                              <FileTextIcon className="size-4 text-gray-400" />
                              <span>No lease link</span>
                            </div>
                          </SelectItem>
                           {/* Replace MOCK_LEASES with selectedTenant.leases if available */}
                          {MOCK_LEASES.map((lease) => ( 
                            <SelectItem key={lease.id} value={lease.id}>
                              <div className="flex items-center gap-2">
                                <Building2Icon className="size-4" />
                                <span>{lease.unitNumber} - {lease.property}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-muted-foreground text-xs">
                        Linking to a lease helps track PDCs by unit
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sidebar (Summary and Actions) */}
          <div className="space-y-8">
            {/* PDC Summary & Actions */}
            <Card className="shadow-md lg:sticky lg:top-6">
              <CardHeader className="bg-muted/20 pb-4">
                <CardTitle className="flex items-center gap-2">
                  <BanknoteIcon className="h-5 w-5" />
                  PDC Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground font-medium">Number of Cheques</span>
                        <span className="text-lg font-bold">{fields.length}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                        <span className="text-muted-foreground font-medium">Total PDC Amount</span>
                        <span className="text-2xl font-bold text-primary">{formatAmount(totalAmount)}</span>
                    </div>
                </div>
                
                <Button type="submit" className="w-full h-11 text-base" disabled={isPending}>
                    {isPending ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Registering...
                        </>
                    ) : (
                        `Register ${fields.length} PDC${fields.length !== 1 ? 's' : ''}`
                    )}
                </Button>

                <Button type="button" variant="outline" onClick={() => router.back()} className="w-full h-11 text-base">
                    Cancel
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Cheque Details Table (main content) */}
          <div className="lg:col-span-3 space-y-8"> {/* Full width for table */}
            <Card>
              <CardHeader className="bg-muted/20">
                <CardTitle className="flex items-center gap-2">
                  <CreditCardIcon className="h-5 w-5" />
                  PDC Details
                </CardTitle>
                <CardDescription>
                  Enter the details for each post-dated cheque
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead className="min-w-[150px]">
                          <span className="flex items-center gap-1">
                            Cheque Number <span className="text-destructive">*</span>
                          </span>
                        </TableHead>
                        <TableHead className="min-w-[150px]">
                          <span className="flex items-center gap-1">
                            Bank Name <span className="text-destructive">*</span>
                          </span>
                        </TableHead>
                        <TableHead className="min-w-[120px]">
                          <span className="flex items-center gap-1">
                            Amount (AED) <span className="text-destructive">*</span>
                          </span>
                        </TableHead>
                        <TableHead className="min-w-[150px]">
                          <span className="flex items-center gap-1">
                            Cheque Date <span className="text-destructive">*</span>
                          </span>
                        </TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fields.map((field, index) => (
                        <TableRow key={field.id}>
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`cheques.${index}.chequeNumber`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <div className="relative">
                                      <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <HashIcon className="size-4" />
                                      </div>
                                      <Input className="pl-9" placeholder="e.g., 123456" {...field} />
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`cheques.${index}.bankName`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <div className="relative">
                                      <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <Building2Icon className="size-4" />
                                      </div>
                                      <Input className="pl-9" placeholder="e.g., Emirates NBD" {...field} />
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`cheques.${index}.amount`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <div className="relative">
                                      <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <BanknoteIcon className="size-4" />
                                      </div>
                                      <NumberInput
                                        className="pl-9"
                                        step={1}
                                        min={0.01}
                                        placeholder="0.00"
                                        value={field.value}
                                        onChange={field.onChange}
                                        onBlur={field.onBlur}
                                        name={field.name}
                                      />
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`cheques.${index}.chequeDate`}
                              render={({ field }) => (
                                <FormItem>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <FormControl>
                                        <Button
                                          variant="outline"
                                          className={cn(
                                            'w-full pl-3 text-left font-normal h-10', // Increased height
                                            !field.value && 'text-muted-foreground'
                                          )}
                                        >
                                          <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                                          {field.value ? (
                                            format(new Date(field.value), 'MMM dd, yyyy')
                                          ) : (
                                            <span>Pick date</span>
                                          )}
                                        </Button>
                                      </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                      <Calendar
                                        mode="single"
                                        selected={field.value ? new Date(field.value) : undefined}
                                        onSelect={(date) =>
                                          field.onChange(date?.toISOString().split('T')[0] || '')
                                        }
                                        disabled={(date) => date < new Date()}
                                        initialFocus
                                      />
                                    </PopoverContent>
                                  </Popover>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            {fields.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  remove(index);
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {/* Add more button */}
                {fields.length < PDC_VALIDATION_CONSTANTS.MAX_CHEQUES_PER_BULK && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      append(getDefaultChequeEntry());
                    }}
                    className="mt-4"
                  >
                    <Plus className="mr-2 h-3.5 w-3.5" />
                    Add Another Cheque
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </form>
      </Form>
    </div>
  );
}