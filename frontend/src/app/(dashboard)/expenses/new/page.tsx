'use client';

/**
 * Expense Create Page
 * Story 6.2: Expense Management and Vendor Payments
 * AC #4: Manual expense creation with multipart form data
 * Updated: shadcn-studio form styling (SCP-2025-11-30)
 */

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
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
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { createExpense } from '@/services/expense.service';
import { getVendors } from '@/services/vendors.service';
import { getProperties } from '@/services/properties.service';
import {
  expenseCreateSchema,
  expenseCreateDefaults,
  type ExpenseCreateFormData,
} from '@/lib/validations/expense';
import {
  EXPENSE_CATEGORY_LABELS,
} from '@/types/expense';
import type { Property } from '@/types';
import type { VendorListItem } from '@/types/vendors';
import {
  ArrowLeft,
  Loader2,
  ReceiptIcon,
  DollarSignIcon,
  Building2,
  Upload,
  X,
  FileTextIcon,
  CalendarIcon,
  TagIcon,
  UserIcon,
  MessageSquareIcon,
} from 'lucide-react';

export default function CreateExpensePage() {
  return (
    <Suspense fallback={<CreateExpensePageSkeleton />}>
      <CreateExpensePageContent />
    </Suspense>
  );
}

function CreateExpensePageSkeleton() {
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
      <Skeleton className="h-48" />
    </div>
  );
}

function CreateExpensePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // Pre-selected vendor from query params (e.g., from work order)
  const preselectedVendorId = searchParams.get('vendorId');
  const preselectedPropertyId = searchParams.get('propertyId');

  // State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vendors, setVendors] = useState<VendorListItem[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoadingVendors, setIsLoadingVendors] = useState(true);
  const [isLoadingProperties, setIsLoadingProperties] = useState(true);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  // Form setup
  const form = useForm<ExpenseCreateFormData>({
    resolver: zodResolver(expenseCreateSchema),
    defaultValues: {
      ...expenseCreateDefaults,
      vendorId: preselectedVendorId || undefined,
      propertyId: preselectedPropertyId || undefined,
    },
  });

  // Load vendors
  useEffect(() => {
    const loadVendors = async () => {
      try {
        setIsLoadingVendors(true);
        const response = await getVendors({ page: 0, size: 200 });
        setVendors(response.data?.content || []);
      } catch (error) {
        console.error('Failed to load vendors:', error);
        toast({
          title: 'Error',
          description: 'Failed to load vendors',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingVendors(false);
      }
    };

    loadVendors();
  }, [toast]);

  // Load properties
  useEffect(() => {
    const loadProperties = async () => {
      try {
        setIsLoadingProperties(true);
        const response = await getProperties({ page: 0, size: 100 });
        setProperties(response.content || []);
      } catch (error) {
        console.error('Failed to load properties:', error);
        toast({
          title: 'Error',
          description: 'Failed to load properties',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingProperties(false);
      }
    };

    loadProperties();
  }, [toast]);

  // Handle receipt file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload a PDF, JPG, or PNG file',
          variant: 'destructive',
        });
        return;
      }
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Receipt file must be less than 5MB',
          variant: 'destructive',
        });
        return;
      }
      setReceiptFile(file);
    }
  };

  const handleRemoveFile = () => {
    setReceiptFile(null);
  };

  // Form submission
  const onSubmit = async (data: ExpenseCreateFormData) => {
    try {
      setIsSubmitting(true);

      const expense = await createExpense(
        {
          category: data.category,
          propertyId: data.propertyId || undefined,
          vendorId: data.vendorId || undefined,
          amount: data.amount,
          expenseDate: data.expenseDate,
          description: data.description,
        },
        receiptFile || undefined
      );

      toast({
        title: 'Success',
        description: `Expense ${expense.expenseNumber} created successfully`,
        variant: 'success',
      });

      router.push(`/expenses/${expense.id}`);
    } catch (error) {
      console.error('Failed to create expense:', error);
      toast({
        title: 'Error',
        description: 'Failed to create expense. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="form-expense-create">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/expenses')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <ReceiptIcon className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Create Expense</h1>
          </div>
          <p className="text-muted-foreground">Record a new expense or vendor payment</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Category and Amount */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSignIcon className="h-4 w-4" />
                  Expense Details
                </CardTitle>
                <CardDescription>Enter the expense category and amount</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <Label className="flex items-center gap-1">
                        Category <span className="text-destructive">*</span>
                      </Label>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(EXPENSE_CATEGORY_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              <div className="flex items-center gap-2">
                                <TagIcon className="size-4 text-blue-600" />
                                <span>{label}</span>
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
                  name="amount"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <Label htmlFor="amount" className="flex items-center gap-1">
                        Amount <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <DollarSignIcon className="size-4" />
                        </div>
                        <FormControl>
                          <Input
                            id="amount"
                            type="number"
                            className="pl-9 pr-14"
                            step="0.01"
                            min="0.01"
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
                  name="expenseDate"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <Label htmlFor="expenseDate" className="flex items-center gap-1">
                        Expense Date <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <CalendarIcon className="size-4" />
                        </div>
                        <FormControl>
                          <Input id="expenseDate" type="date" className="pl-9" {...field} />
                        </FormControl>
                      </div>
                      <p className="text-muted-foreground text-xs">Date the expense was incurred</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Related Entities */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Related Information
                </CardTitle>
                <CardDescription>Link expense to property or vendor</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="propertyId"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <Label className="flex items-center gap-1">
                        <Building2 className="size-4 mr-1 text-muted-foreground" />
                        Property
                      </Label>
                      {isLoadingProperties ? (
                        <Skeleton className="h-10 w-full" />
                      ) : (
                        <Select
                          onValueChange={(val) => field.onChange(val === '__none__' ? '' : val)}
                          value={field.value || '__none__'}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select property (optional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="__none__">
                              <div className="flex items-center gap-2">
                                <Building2 className="size-4 text-gray-400" />
                                <span>No property</span>
                              </div>
                            </SelectItem>
                            {properties.map((property) => (
                              <SelectItem key={property.id} value={property.id}>
                                <div className="flex items-center gap-2">
                                  <Building2 className="size-4 text-blue-600" />
                                  <span>{property.name}</span>
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

                <FormField
                  control={form.control}
                  name="vendorId"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <Label className="flex items-center gap-1">
                        <UserIcon className="size-4 mr-1 text-muted-foreground" />
                        Vendor
                      </Label>
                      {isLoadingVendors ? (
                        <Skeleton className="h-10 w-full" />
                      ) : (
                        <Select
                          onValueChange={(val) => field.onChange(val === '__none__' ? '' : val)}
                          value={field.value || '__none__'}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select vendor (optional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="__none__">
                              <div className="flex items-center gap-2">
                                <UserIcon className="size-4 text-gray-400" />
                                <span>No vendor</span>
                              </div>
                            </SelectItem>
                            {vendors.map((vendor) => (
                              <SelectItem key={vendor.id} value={vendor.id}>
                                <div className="flex items-center gap-2">
                                  <UserIcon className="size-4 text-green-600" />
                                  <span>{vendor.companyName}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <p className="text-muted-foreground text-xs">Select if this is a vendor payment</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquareIcon className="h-4 w-4" />
                Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <Label htmlFor="description" className="flex items-center gap-1">
                      Description <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <div className="text-muted-foreground pointer-events-none absolute top-3 left-0 flex items-start pl-3">
                        <MessageSquareIcon className="size-4" />
                      </div>
                      <FormControl>
                        <Textarea
                          id="description"
                          className="pl-9 resize-none min-h-[80px]"
                          placeholder="Describe the expense..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                    </div>
                    <p className="text-muted-foreground text-xs">Provide details about this expense</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Receipt Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileTextIcon className="h-4 w-4" />
                Receipt Upload
              </CardTitle>
              <CardDescription>Upload a receipt for this expense (optional)</CardDescription>
            </CardHeader>
            <CardContent>
              {receiptFile ? (
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <FileTextIcon className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="font-medium">{receiptFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(receiptFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleRemoveFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Upload a receipt (PDF, JPG, PNG - max 5MB)
                  </p>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="hidden"
                    id="receipt-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4"
                    onClick={() => document.getElementById('receipt-upload')?.click()}
                  >
                    Select File
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/expenses')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Creating...' : 'Create Expense'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
