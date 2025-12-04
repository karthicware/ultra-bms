'use client';

/**
 * Record New Violation Page
 * Story 7.3: Compliance and Inspection Tracking
 *
 * AC #32: Record and track violations
 * AC #33: Track fines and resolutions
 */

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon, Loader2, ChevronLeft, FileWarning } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';

import { complianceService } from '@/services/compliance.service';
import { createViolationSchema, type CreateViolationFormData } from '@/schemas/compliance.schema';
import { FineStatus, getFineStatusLabel } from '@/types/compliance';
import type { ComplianceScheduleListItem } from '@/types/compliance';

function NewViolationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const preselectedScheduleId = searchParams.get('scheduleId');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [schedules, setSchedules] = useState<ComplianceScheduleListItem[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(true);

  const form = useForm<CreateViolationFormData>({
    resolver: zodResolver(createViolationSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      complianceScheduleId: preselectedScheduleId || '',
      violationDate: new Date().toISOString().split('T')[0],
      description: '',
      fineAmount: undefined,
      fineStatus: FineStatus.NOT_APPLICABLE,
      fineDueDate: '',
      issuingAuthority: '',
      referenceNumber: '',
      notes: '',
    },
  });

  const watchedFineAmount = form.watch('fineAmount');

  // Load compliance schedules for dropdown
  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        setLoadingSchedules(true);
        const response = await complianceService.getSchedules({ page: 0, size: 100 });
        setSchedules(response.data?.content || []);
      } catch (error) {
        console.error('Failed to load schedules:', error);
        toast({
          title: 'Error',
          description: 'Failed to load compliance schedules',
          variant: 'destructive',
        });
      } finally {
        setLoadingSchedules(false);
      }
    };

    fetchSchedules();
  }, [toast]);

  // Auto-set fine status when fine amount changes
  useEffect(() => {
    if (watchedFineAmount && watchedFineAmount > 0) {
      const currentStatus = form.getValues('fineStatus');
      if (currentStatus === FineStatus.NOT_APPLICABLE) {
        form.setValue('fineStatus', FineStatus.PENDING);
      }
    }
  }, [watchedFineAmount, form]);

  const onSubmit = async (data: CreateViolationFormData) => {
    try {
      setIsSubmitting(true);

      const violation = await complianceService.createViolation({
        complianceScheduleId: data.complianceScheduleId,
        violationDate: data.violationDate,
        description: data.description,
        fineAmount: data.fineAmount || undefined,
        fineStatus: data.fineStatus as FineStatus,
      });

      toast({
        title: 'Violation Recorded',
        description: `Violation ${violation?.violationNumber} has been recorded.`,
        variant: 'success',
      });

      router.push(`/property-manager/compliance/violations/${violation?.id}`);
    } catch (error: unknown) {
      console.error('Failed to create violation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to record violation';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto py-6">      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Record Violation</h1>
        <p className="text-muted-foreground">
          Record a new compliance violation
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Compliance Schedule Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Compliance Schedule</CardTitle>
              <CardDescription>
                Select the compliance schedule this violation relates to
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="complianceScheduleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Compliance Schedule *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={loadingSchedules}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={loadingSchedules ? 'Loading...' : 'Select a schedule'}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {schedules.map((schedule) => (
                          <SelectItem key={schedule.id} value={schedule.id}>
                            {schedule.propertyName} - {schedule.requirementName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The compliance requirement that was violated
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Violation Details */}
          <Card>
            <CardHeader>
              <CardTitle>Violation Details</CardTitle>
              <CardDescription>
                Details about the violation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="violationDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Violation Date *</FormLabel>
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
                            {field.value ? (
                              format(new Date(field.value), 'PPP')
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) => field.onChange(date?.toISOString().split('T')[0])}
                          disabled={(date) => date > new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      The date when the violation occurred
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the violation..."
                        className="resize-none"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Detailed description of the violation
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="issuingAuthority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Issuing Authority</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Civil Defense"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="referenceNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reference Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., REF-2024-001"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Fine Information */}
          <Card>
            <CardHeader>
              <CardTitle>Fine Information</CardTitle>
              <CardDescription>
                Details about any fines associated with this violation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fineAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fine Amount (AED)</FormLabel>
                      <FormControl>
                        <NumberInput
                          placeholder="0.00"
                          step={1}
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
                  name="fineStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fine Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(FineStatus).map((status) => (
                            <SelectItem key={status} value={status}>
                              {getFineStatusLabel(status)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="fineDueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fine Due Date</FormLabel>
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
                            {field.value ? (
                              format(new Date(field.value), 'PPP')
                            ) : (
                              <span>Pick a date (optional)</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) => field.onChange(date?.toISOString().split('T')[0])}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Deadline for paying the fine
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional notes about the violation or fine..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Recording...
                </>
              ) : (
                <>
                  <FileWarning className="mr-2 h-4 w-4" />
                  Record Violation
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

export default function NewViolationPage() {
  return (
    <Suspense fallback={
      <div className="container max-w-2xl mx-auto py-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <NewViolationContent />
    </Suspense>
  );
}
