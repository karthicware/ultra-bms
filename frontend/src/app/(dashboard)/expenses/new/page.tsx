'use client';

/**
 * Expense Create Page
 * Story 6.2: Expense Management and Vendor Payments
 * AC #4: Manual expense creation with multipart form data
 */

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
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
  ExpenseCategory,
  EXPENSE_CATEGORY_LABELS,
  formatExpenseCurrency,
} from '@/types/expense';
import type { Property } from '@/types';
import type { VendorListItem } from '@/types/vendors';
import {
  ArrowLeft,
  Loader2,
  Receipt,
  Calendar,
  DollarSign,
  Building2,
  Briefcase,
  Upload,
  X,
  FileText,
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
          <h1 className="text-3xl font-bold tracking-tight">Create Expense</h1>
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
                  <DollarSign className="h-4 w-4" />
                  Expense Details
                </CardTitle>
                <CardDescription>Enter the expense category and amount</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(EXPENSE_CATEGORY_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
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
                    <FormItem>
                      <FormLabel>Amount (AED) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0.01"
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
                  name="expenseDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expense Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormDescription>Date the expense was incurred</FormDescription>
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
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="propertyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property</FormLabel>
                      {isLoadingProperties ? (
                        <Skeleton className="h-10 w-full" />
                      ) : (
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select property (optional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">No property</SelectItem>
                            {properties.map((property) => (
                              <SelectItem key={property.id} value={property.id}>
                                {property.name}
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
                    <FormItem>
                      <FormLabel>Vendor</FormLabel>
                      {isLoadingVendors ? (
                        <Skeleton className="h-10 w-full" />
                      ) : (
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select vendor (optional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">No vendor</SelectItem>
                            {vendors.map((vendor) => (
                              <SelectItem key={vendor.id} value={vendor.id}>
                                {vendor.companyName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <FormDescription>
                        Select if this is a vendor payment
                      </FormDescription>
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
                <Receipt className="h-4 w-4" />
                Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the expense..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Provide details about this expense
                    </FormDescription>
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
                <FileText className="h-4 w-4" />
                Receipt Upload
              </CardTitle>
              <CardDescription>Upload a receipt for this expense (optional)</CardDescription>
            </CardHeader>
            <CardContent>
              {receiptFile ? (
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-blue-500" />
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
