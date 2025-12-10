'use client';

/**
 * Expense Edit Page
 * Story 6.2: Expense Management and Vendor Payments
 * AC #5: Edit PENDING expenses
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  getExpenseById,
  updateExpense,
  getReceiptDownloadUrl,
} from '@/services/expense.service';
import { getVendors } from '@/services/vendors.service';
import { getProperties } from '@/services/properties.service';
import {
  expenseUpdateSchema,
  type ExpenseUpdateFormData,
} from '@/lib/validations/expense';
import {
  PaymentStatus,
  EXPENSE_CATEGORY_LABELS,
} from '@/types/expense';
import type { Property } from '@/types';
import type { ExpenseDetail } from '@/types/expense';
import type { VendorListItem } from '@/types/vendors';
import {
  Loader2,
  Receipt,
  DollarSign,
  Building2,
  Upload,
  X,
  FileText,
  Download,
  AlertCircle,
} from 'lucide-react';
import { PageBackButton } from '@/components/common/PageBackButton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function EditExpensePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const expenseId = params.id as string;

  // State
  const [expense, setExpense] = useState<ExpenseDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vendors, setVendors] = useState<VendorListItem[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoadingVendors, setIsLoadingVendors] = useState(true);
  const [isLoadingProperties, setIsLoadingProperties] = useState(true);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [keepExistingReceipt, setKeepExistingReceipt] = useState(true);

  // Form setup
  const form = useForm<ExpenseUpdateFormData>({
    resolver: zodResolver(expenseUpdateSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      category: undefined,
      propertyId: undefined,
      vendorId: undefined,
      amount: 0,
      expenseDate: '',
      description: '',
    },
  });

  // Fetch expense
  const fetchExpense = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getExpenseById(expenseId);
      setExpense(data);

      // Check if expense is editable
      if (!data.editable) {
        toast({
          title: 'Cannot Edit',
          description: 'Only PENDING expenses can be edited',
          variant: 'destructive',
        });
        router.push(`/expenses/${expenseId}`);
        return;
      }

      // Populate form with existing data
      form.reset({
        category: data.category,
        propertyId: data.propertyId || undefined,
        vendorId: data.vendorId || undefined,
        amount: data.amount,
        expenseDate: data.expenseDate,
        description: data.description,
      });
    } catch (error) {
      console.error('Failed to fetch expense:', error);
      toast({
        title: 'Error',
        description: 'Failed to load expense details',
        variant: 'destructive',
      });
      router.push('/expenses');
    } finally {
      setIsLoading(false);
    }
  }, [expenseId, form, toast, router]);

  useEffect(() => {
    fetchExpense();
  }, [fetchExpense]);

  // Load vendors
  useEffect(() => {
    const loadVendors = async () => {
      try {
        setIsLoadingVendors(true);
        const response = await getVendors({ page: 0, size: 200 });
        setVendors(response.data?.content || []);
      } catch (error) {
        console.error('Failed to load vendors:', error);
      } finally {
        setIsLoadingVendors(false);
      }
    };

    loadVendors();
  }, []);

  // Load properties
  useEffect(() => {
    const loadProperties = async () => {
      try {
        setIsLoadingProperties(true);
        const response = await getProperties({ page: 0, size: 100 });
        setProperties(response.content || []);
      } catch (error) {
        console.error('Failed to load properties:', error);
      } finally {
        setIsLoadingProperties(false);
      }
    };

    loadProperties();
  }, []);

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
      setKeepExistingReceipt(false);
    }
  };

  const handleRemoveFile = () => {
    setReceiptFile(null);
    setKeepExistingReceipt(false);
  };

  const handleDownloadExistingReceipt = async () => {
    if (!expense?.receiptFilePath) return;

    try {
      const downloadUrl = await getReceiptDownloadUrl(expenseId);
      if (downloadUrl) {
        window.open(downloadUrl, '_blank');
      }
    } catch (error) {
      console.error('Failed to get receipt URL:', error);
      toast({
        title: 'Error',
        description: 'Failed to download receipt',
        variant: 'destructive',
      });
    }
  };

  // Form submission
  const onSubmit = async (data: ExpenseUpdateFormData) => {
    try {
      setIsSubmitting(true);

      await updateExpense(
        expenseId,
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
        description: 'Expense updated successfully',
        variant: 'success',
      });

      router.push(`/expenses/${expenseId}`);
    } catch (error) {
      console.error('Failed to update expense:', error);
      toast({
        title: 'Error',
        description: 'Failed to update expense. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto space-y-6">
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

  if (!expense) {
    return null;
  }

  return (
    <div className="container mx-auto space-y-6" data-testid="form-expense-edit">
      {/* Header */}
      <div className="flex items-center gap-4">
        <PageBackButton href={`/expenses/${expenseId}`} aria-label="Back to expense details" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Expense</h1>
          <p className="text-muted-foreground">{expense.expenseNumber}</p>
        </div>
      </div>

      {/* Only PENDING alert */}
      {expense.paymentStatus !== PaymentStatus.PENDING && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Cannot Edit</AlertTitle>
          <AlertDescription>
            Only expenses with PENDING status can be edited. This expense is {expense.paymentStatus}.
          </AlertDescription>
        </Alert>
      )}

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
                <CardDescription>Update the expense category and amount</CardDescription>
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
                        <NumberInput
                          step={1}
                          min={0.01}
                          placeholder="0.00"
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
                <CardDescription>Update linked property or vendor</CardDescription>
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
                Receipt
              </CardTitle>
              <CardDescription>Update or replace the receipt</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Existing Receipt */}
              {expense.receiptFilePath && keepExistingReceipt && !receiptFile && (
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50 mb-4">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="font-medium">{expense.receiptFileName || 'Current Receipt'}</p>
                      <p className="text-sm text-muted-foreground">Currently attached</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadExistingReceipt}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setKeepExistingReceipt(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* New Receipt or Upload Area */}
              {receiptFile ? (
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-green-500" />
                    <div>
                      <p className="font-medium">{receiptFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(receiptFile.size / 1024).toFixed(1)} KB - New file
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
              ) : !keepExistingReceipt && (
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Upload a new receipt (PDF, JPG, PNG - max 5MB)
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
              onClick={() => router.push(`/expenses/${expenseId}`)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
