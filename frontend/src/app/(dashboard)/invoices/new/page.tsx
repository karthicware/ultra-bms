'use client';

/**
 * Invoice Create Page - Complete Redesign
 * Story 6.1: Rent Invoicing and Payment Management
 *
 * Features:
 * - Modern hero header with gradient styling
 * - Step-based visual flow
 * - Enhanced tenant search with card-based selection
 * - Live invoice preview with animated totals
 * - Visual charge breakdown with icons
 * - Improved mobile responsiveness
 */

import { useState, useEffect, Suspense, useMemo } from 'react';
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
  FormLabel,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { NumberInput } from '@/components/ui/number-input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
  Building2,
  CalendarDays,
  DollarSign,
  FileText,
  MessageSquare,
  Car,
  Wrench,
  Receipt,
  Search,
  CheckCircle2,
  ChevronRight,
  Home,
  Phone,
  Mail,
  Sparkles,
  CircleDot,
  Banknote,
  CreditCard,
  PlusCircle,
  X,
  AlertCircle,
  Clock,
  Send,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
        {/* Header Skeleton */}
        <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border p-8">
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
        </div>
        {/* Content Skeleton */}
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-80" />
            <Skeleton className="h-96" />
          </div>
          <div>
            <Skeleton className="h-[500px]" />
          </div>
        </div>
      </div>
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
  const [showTenantSearch, setShowTenantSearch] = useState(!preselectedTenantId);

  // Form setup
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const invoiceResolver: any = zodResolver(invoiceCreateSchema);
  const form = useForm<InvoiceCreateFormData>({
    resolver: invoiceResolver,
    mode: 'onBlur',
    reValidateMode: 'onChange',
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
  const watchedValues = form.watch(['baseRent', 'serviceCharges', 'parkingFees', 'additionalCharges', 'invoiceDate', 'dueDate']);
  const calculatedTotal = calculateInvoiceTotal({
    baseRent: watchedValues[0] || 0,
    serviceCharges: watchedValues[1] || 0,
    parkingFees: watchedValues[2] || 0,
    additionalCharges: watchedValues[3] || [],
  });

  // Calculate days until due
  const daysUntilDue = useMemo(() => {
    if (!watchedValues[5]) return 0;
    const today = new Date();
    const dueDate = new Date(watchedValues[5]);
    const diffTime = dueDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [watchedValues[5]]);

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
          toast({
            title: 'Error',
            description: 'Failed to load tenants',
            variant: 'destructive',
          });
        } finally {
          setIsLoadingTenants(false);
        }
      }, 300);

      return () => clearTimeout(timer);
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
          setShowTenantSearch(false);
          // Pre-populate rent amounts from tenant's lease
          if (tenant.baseRent) form.setValue('baseRent', tenant.baseRent);
          if (tenant.serviceCharge) form.setValue('serviceCharges', tenant.serviceCharge);
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
  const handleTenantSelect = async (tenant: TenantResponse) => {
    form.setValue('tenantId', tenant.id);
    setSelectedTenant(tenant);
    setShowTenantSearch(false);
    // Pre-populate rent amounts from tenant's lease
    if (tenant.baseRent) form.setValue('baseRent', tenant.baseRent);
    if (tenant.serviceCharge) form.setValue('serviceCharges', tenant.serviceCharge);
    if (tenant.parkingFeePerSpot && tenant.parkingSpots) {
      form.setValue('parkingFees', tenant.parkingFeePerSpot * tenant.parkingSpots);
    }
  };

  // Clear tenant selection
  const handleClearTenant = () => {
    form.setValue('tenantId', '');
    setSelectedTenant(null);
    setShowTenantSearch(true);
    setSearchQuery('');
    // Clear pre-populated amounts
    form.setValue('baseRent', 0);
    form.setValue('serviceCharges', 0);
    form.setValue('parkingFees', 0);
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
        title: 'Invoice Created',
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

  // Charge type icons
  const chargeIcons: Record<string, React.ReactNode> = {
    baseRent: <Home className="h-4 w-4" />,
    serviceCharges: <Wrench className="h-4 w-4" />,
    parkingFees: <Car className="h-4 w-4" />,
    additional: <PlusCircle className="h-4 w-4" />,
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">

          {/* Hero Header */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border shadow-sm">
            <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
            <div className="relative px-8 py-8">
              <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => router.push('/invoices')}
                  className="h-12 w-12 rounded-xl bg-background/80 backdrop-blur-sm shrink-0"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-primary/10 ring-1 ring-primary/20">
                    <Receipt className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">Create Invoice</h1>
                    <p className="text-muted-foreground">
                      Generate a new invoice for tenant billing
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 py-2">
            <div className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
              selectedTenant ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-primary text-primary-foreground"
            )}>
              {selectedTenant ? <CheckCircle2 className="h-4 w-4" /> : <CircleDot className="h-4 w-4" />}
              <span>1. Select Tenant</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <div className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
              selectedTenant && calculatedTotal > 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
              <CircleDot className="h-4 w-4" />
              <span>2. Add Charges</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-muted text-muted-foreground">
              <Send className="h-4 w-4" />
              <span>3. Create</span>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* Left Column - Main Content */}
              <div className="lg:col-span-2 space-y-6">

                {/* Tenant Selection Card */}
                <Card className="overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                          <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">Tenant Information</CardTitle>
                          <CardDescription>Select the tenant for this invoice</CardDescription>
                        </div>
                      </div>
                      {selectedTenant && (
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-400">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Selected
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    {/* Selected Tenant Display */}
                    {selectedTenant && !showTenantSearch ? (
                      <div className="space-y-4">
                        <div className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border border-emerald-200 dark:border-emerald-800">
                          <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-900/50">
                            <User className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-lg">
                                {selectedTenant.firstName} {selectedTenant.lastName}
                              </h3>
                              <Badge variant="outline" className="text-xs">
                                {selectedTenant.tenantNumber}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 text-sm">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Building2 className="h-4 w-4" />
                                <span className="truncate">{selectedTenant.property?.name || 'N/A'}</span>
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Home className="h-4 w-4" />
                                <span>Unit {selectedTenant.unit?.unitNumber || 'N/A'}</span>
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Mail className="h-4 w-4" />
                                <span className="truncate">{selectedTenant.email}</span>
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Phone className="h-4 w-4" />
                                <span>{selectedTenant.phone || 'N/A'}</span>
                              </div>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={handleClearTenant}
                            className="shrink-0 text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-5 w-5" />
                          </Button>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowTenantSearch(true)}
                          className="w-full"
                        >
                          Change Tenant
                        </Button>
                      </div>
                    ) : (
                      /* Tenant Search */
                      <div className="space-y-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search by name, unit number, or phone..."
                            className="pl-10 h-11"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoFocus
                          />
                        </div>

                        {isLoadingTenants ? (
                          <div className="space-y-3">
                            {Array.from({ length: 3 }).map((_, i) => (
                              <Skeleton key={i} className="h-20" />
                            ))}
                          </div>
                        ) : tenants.length === 0 ? (
                          <div className="text-center py-8 border-2 border-dashed rounded-xl">
                            <User className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                            <p className="text-muted-foreground">
                              {searchQuery ? 'No tenants found matching your search' : 'Start typing to search for tenants'}
                            </p>
                          </div>
                        ) : (
                          <ScrollArea className="h-[300px] pr-4">
                            <div className="space-y-2">
                              {tenants.map((tenant) => (
                                <button
                                  key={tenant.id}
                                  type="button"
                                  onClick={() => handleTenantSelect(tenant)}
                                  className={cn(
                                    "w-full p-4 rounded-xl border text-left transition-all",
                                    "hover:bg-muted/50 hover:border-primary/50",
                                    "focus:outline-none focus:ring-2 focus:ring-primary/20"
                                  )}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-full bg-muted">
                                      <User className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">
                                          {tenant.firstName} {tenant.lastName}
                                        </span>
                                        <Badge variant="outline" className="text-xs">
                                          {tenant.tenantNumber}
                                        </Badge>
                                      </div>
                                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                          <Building2 className="h-3 w-3" />
                                          {tenant.property?.name || 'N/A'}
                                        </span>
                                        <span className="flex items-center gap-1">
                                          <Home className="h-3 w-3" />
                                          Unit {tenant.unit?.unitNumber || 'N/A'}
                                        </span>
                                      </div>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                  </div>
                                </button>
                              ))}
                            </div>
                          </ScrollArea>
                        )}

                        {selectedTenant && (
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setShowTenantSearch(false)}
                            className="w-full"
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Hidden field for form validation */}
                    <FormField
                      control={form.control}
                      name="tenantId"
                      render={() => (
                        <FormItem className="hidden">
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Billing Details Card */}
                <Card className={cn(
                  "overflow-hidden transition-opacity duration-300",
                  !selectedTenant && "opacity-60 pointer-events-none"
                )}>
                  <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border-b">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
                        <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Billing Details</CardTitle>
                        <CardDescription>Enter rent amounts and additional charges</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    {/* Main Charges */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Base Rent */}
                      <FormField
                        control={form.control}
                        name="baseRent"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Home className="h-4 w-4 text-muted-foreground" />
                              Base Rent
                            </FormLabel>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                                AED
                              </span>
                              <FormControl>
                                <NumberInput
                                  className="pl-12 h-11"
                                  step={1}
                                  min={0}
                                  placeholder="0.00"
                                  value={field.value}
                                  onChange={field.onChange}
                                  onBlur={field.onBlur}
                                  name={field.name}
                                />
                              </FormControl>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Service Charges */}
                      <FormField
                        control={form.control}
                        name="serviceCharges"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Wrench className="h-4 w-4 text-muted-foreground" />
                              Service Charges
                            </FormLabel>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                                AED
                              </span>
                              <FormControl>
                                <NumberInput
                                  className="pl-12 h-11"
                                  step={1}
                                  min={0}
                                  placeholder="0.00"
                                  value={field.value}
                                  onChange={field.onChange}
                                  onBlur={field.onBlur}
                                  name={field.name}
                                />
                              </FormControl>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Parking Fees */}
                      <FormField
                        control={form.control}
                        name="parkingFees"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Car className="h-4 w-4 text-muted-foreground" />
                              Parking Fees
                            </FormLabel>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                                AED
                              </span>
                              <FormControl>
                                <NumberInput
                                  className="pl-12 h-11"
                                  step={1}
                                  min={0}
                                  placeholder="0.00"
                                  value={field.value}
                                  onChange={field.onChange}
                                  onBlur={field.onBlur}
                                  name={field.name}
                                />
                              </FormControl>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator />

                    {/* Additional Charges */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base font-semibold">Additional Charges</Label>
                          <p className="text-sm text-muted-foreground">Add any extra fees or charges</p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => append({ description: '', amount: 0 })}
                          className="gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Add Charge
                        </Button>
                      </div>

                      {fields.length === 0 ? (
                        <div className="text-center py-8 border-2 border-dashed rounded-xl bg-muted/20">
                          <PlusCircle className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                          <p className="text-sm text-muted-foreground">
                            No additional charges added yet
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {fields.map((field, index) => (
                            <div
                              key={field.id}
                              className="flex gap-3 items-start p-4 rounded-xl border bg-muted/20 animate-in fade-in slide-in-from-top-2"
                            >
                              <div className="p-2 rounded-lg bg-muted">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <FormField
                                control={form.control}
                                name={`additionalCharges.${index}.description`}
                                render={({ field }) => (
                                  <FormItem className="flex-1">
                                    <FormControl>
                                      <Input
                                        placeholder="Description (e.g., Maintenance Fee)"
                                        className="h-10"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`additionalCharges.${index}.amount`}
                                render={({ field }) => (
                                  <FormItem className="w-36">
                                    <div className="relative">
                                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                                        AED
                                      </span>
                                      <FormControl>
                                        <NumberInput
                                          className="pl-10 h-10"
                                          step={1}
                                          min={0}
                                          placeholder="0.00"
                                          value={field.value}
                                          onChange={field.onChange}
                                          onBlur={field.onBlur}
                                          name={field.name}
                                        />
                                      </FormControl>
                                    </div>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="text-muted-foreground hover:text-destructive shrink-0"
                                    onClick={() => remove(index)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Remove charge</TooltipContent>
                              </Tooltip>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Notes Card */}
                <Card className={cn(
                  "overflow-hidden transition-opacity duration-300",
                  !selectedTenant && "opacity-60 pointer-events-none"
                )}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Internal Notes</CardTitle>
                        <CardDescription className="text-sm">Private notes for internal reference</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                              className="resize-none min-h-[100px]"
                              placeholder="Add any notes regarding this invoice..."
                              {...field}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Invoice Preview Sidebar */}
              <div className="space-y-6">
                <Card className="shadow-lg border-2 lg:sticky lg:top-6 overflow-hidden">
                  {/* Preview Header */}
                  <CardHeader className="bg-gradient-to-br from-primary/10 to-primary/5 border-b pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 ring-1 ring-primary/20">
                        <Receipt className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Invoice Preview</CardTitle>
                        <CardDescription>Live calculation</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    {/* Dates Section */}
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="invoiceDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                              <CalendarDays className="h-3 w-3" />
                              Invoice Date
                            </FormLabel>
                            <FormControl>
                              <Input type="date" className="h-10" {...field} />
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
                            <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                              <Clock className="h-3 w-3" />
                              Due Date
                            </FormLabel>
                            <FormControl>
                              <Input type="date" className="h-10" {...field} />
                            </FormControl>
                            <FormMessage />
                            {daysUntilDue > 0 && (
                              <p className="text-xs text-muted-foreground">
                                {daysUntilDue} days from today
                              </p>
                            )}
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator />

                    {/* Charges Breakdown */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="flex items-center gap-2 text-muted-foreground">
                          {chargeIcons.baseRent}
                          Base Rent
                        </span>
                        <span className="font-medium">{formatCurrency(watchedValues[0] || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="flex items-center gap-2 text-muted-foreground">
                          {chargeIcons.serviceCharges}
                          Service Charges
                        </span>
                        <span className="font-medium">{formatCurrency(watchedValues[1] || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="flex items-center gap-2 text-muted-foreground">
                          {chargeIcons.parkingFees}
                          Parking Fees
                        </span>
                        <span className="font-medium">{formatCurrency(watchedValues[2] || 0)}</span>
                      </div>

                      {/* Additional charges summary */}
                      {(watchedValues[3]?.length ?? 0) > 0 && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="flex items-center gap-2 text-muted-foreground">
                            {chargeIcons.additional}
                            Additional ({watchedValues[3]?.length || 0} items)
                          </span>
                          <span className="font-medium">
                            {formatCurrency(watchedValues[3]?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0)}
                          </span>
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Total */}
                    <div className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 p-4 border border-primary/20">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-lg">Total</span>
                        <span className="font-bold text-2xl text-primary">
                          {formatCurrency(calculatedTotal)}
                        </span>
                      </div>
                    </div>

                    {/* Validation Warning */}
                    {!selectedTenant && (
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-sm">
                        <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                        <span className="text-amber-800 dark:text-amber-400">
                          Please select a tenant before creating the invoice
                        </span>
                      </div>
                    )}

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      className="w-full h-12 text-base gap-2 shadow-lg shadow-primary/20"
                      disabled={isSubmitting || !selectedTenant}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Creating Invoice...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-5 w-5" />
                          Create Invoice
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </TooltipProvider>
  );
}
