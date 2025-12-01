'use client';

/**
 * PDC Registration Page
 * Story 6.3: Post-Dated Cheque (PDC) Management
 * AC #4: PDC Registration Form
 * AC #5: Bulk PDC Registration
 * Updated: shadcn-studio form styling (SCP-2025-11-30)
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import {
  CalendarIcon,
  Plus,
  Trash2,
  ArrowLeft,
  Loader2,
  UserIcon,
  FileTextIcon,
  HashIcon,
  Building2Icon,
  BanknoteIcon,
  CreditCardIcon,
} from 'lucide-react';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
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
import { cn } from '@/lib/utils';
import { useCreateBulkPDCs } from '@/hooks/usePDCs';
import {
  pdcBulkCreateSchema,
  PDCBulkCreateFormData,
  getDefaultChequeEntry,
  formatAmount,
  calculateTotalChequeAmount,
  PDC_VALIDATION_CONSTANTS,
} from '@/lib/validations/pdc';

// Mock tenant data - in real app, fetch from API
const MOCK_TENANTS = [
  { id: '1', name: 'John Doe', email: 'john@example.com' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
  { id: '3', name: 'Bob Wilson', email: 'bob@example.com' },
];

// Mock lease data - in real app, fetch based on selected tenant
const MOCK_LEASES = [
  { id: 'lease-1', unitNumber: 'A101', property: 'Tower A' },
  { id: 'lease-2', unitNumber: 'B205', property: 'Tower B' },
];

export default function PDCRegistrationPage() {
  const router = useRouter();
  const { mutate: createBulkPDCs, isPending } = useCreateBulkPDCs();
  const [numberOfCheques, setNumberOfCheques] = useState(1);

  const form = useForm<PDCBulkCreateFormData>({
    resolver: zodResolver(pdcBulkCreateSchema),
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

  // Handle number of cheques change
  const handleNumberOfChequesChange = (count: number) => {
    const clampedCount = Math.max(1, Math.min(24, count));
    setNumberOfCheques(clampedCount);

    const currentCount = fields.length;
    if (clampedCount > currentCount) {
      // Add more entries
      for (let i = 0; i < clampedCount - currentCount; i++) {
        append(getDefaultChequeEntry());
      }
    } else if (clampedCount < currentCount) {
      // Remove entries from the end
      for (let i = currentCount - 1; i >= clampedCount; i--) {
        remove(i);
      }
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
    <div className="container mx-auto py-6 space-y-6" data-testid="form-pdc-register">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <CreditCardIcon className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Register PDC</h1>
          </div>
          <p className="text-muted-foreground">
            Register post-dated cheques for a tenant
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Tenant Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                Tenant Information
              </CardTitle>
              <CardDescription>
                Select the tenant and optionally link to a lease
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                {/* Tenant */}
                <FormField
                  control={form.control}
                  name="tenantId"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <Label className="flex items-center gap-1">
                        Tenant <span className="text-destructive">*</span>
                      </Label>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select tenant" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {MOCK_TENANTS.map((tenant) => (
                            <SelectItem key={tenant.id} value={tenant.id}>
                              <div className="flex items-center gap-2">
                                <UserIcon className="size-4 text-blue-600" />
                                <span>{tenant.name} ({tenant.email})</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Lease (Optional) */}
                <FormField
                  control={form.control}
                  name="leaseId"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <Label className="flex items-center gap-1">
                        <FileTextIcon className="size-4 mr-1 text-muted-foreground" />
                        Link to Lease
                      </Label>
                      <Select
                        onValueChange={(v) => field.onChange(v === '__none__' ? null : v)}
                        value={field.value || '__none__'}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
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
                          {MOCK_LEASES.map((lease) => (
                            <SelectItem key={lease.id} value={lease.id}>
                              <div className="flex items-center gap-2">
                                <Building2Icon className="size-4 text-green-600" />
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
              </div>
            </CardContent>
          </Card>

          {/* Number of Cheques */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BanknoteIcon className="h-4 w-4" />
                Cheque Details
              </CardTitle>
              <CardDescription>
                Enter the number of cheques and fill in details for each
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Number of cheques selector */}
              <div className="flex items-end gap-4">
                <div className="w-40 space-y-2">
                  <Label htmlFor="numCheques" className="flex items-center gap-1">
                    <HashIcon className="size-4 mr-1 text-muted-foreground" />
                    Number of Cheques
                  </Label>
                  <div className="relative">
                    <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <HashIcon className="size-4" />
                    </div>
                    <Input
                      id="numCheques"
                      type="number"
                      className="pl-9"
                      min={1}
                      max={24}
                      value={numberOfCheques}
                      onChange={(e) => handleNumberOfChequesChange(parseInt(e.target.value) || 1)}
                    />
                  </div>
                </div>
                <p className="text-muted-foreground text-xs pb-2">
                  Enter 1-{PDC_VALIDATION_CONSTANTS.MAX_CHEQUES_PER_BULK} cheques
                </p>
              </div>

              {/* Cheques Table */}
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
                                    <Input
                                      type="number"
                                      className="pl-9"
                                      step="0.01"
                                      min="0.01"
                                      placeholder="0.00"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                                          'w-full pl-3 text-left font-normal',
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
                                setNumberOfCheques(fields.length - 1);
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
              {fields.length < 24 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    append(getDefaultChequeEntry());
                    setNumberOfCheques(fields.length + 1);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Another Cheque
                </Button>
              )}

              {/* Total */}
              <div className="flex justify-end pt-4 border-t">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-2xl font-bold text-primary">{formatAmount(totalAmount)}</p>
                  <p className="text-muted-foreground text-xs">
                    {fields.length} cheque{fields.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Register {fields.length} PDC{fields.length !== 1 ? 's' : ''}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
