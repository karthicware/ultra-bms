'use client';

/**
 * Schedule New Inspection Page
 * Story 7.3: Compliance and Inspection Tracking
 *
 * AC #31: Schedule new inspections for compliance schedules
 */

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon, Loader2, ClipboardCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

import { PageBackButton } from '@/components/common/PageBackButton';
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
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

import { complianceService } from '@/services/compliance.service';
import { createInspectionSchema, type CreateInspectionFormData } from '@/schemas/compliance.schema';
import type { ComplianceScheduleListItem } from '@/types/compliance';

function NewInspectionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const preselectedScheduleId = searchParams.get('scheduleId');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [schedules, setSchedules] = useState<ComplianceScheduleListItem[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(true);

  const form = useForm<CreateInspectionFormData>({
    resolver: zodResolver(createInspectionSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      complianceScheduleId: preselectedScheduleId || '',
      scheduledDate: '',
      inspectorName: '',
      inspectorCompany: '',
      inspectorContact: '',
      notes: '',
    },
  });

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

  const onSubmit = async (data: CreateInspectionFormData) => {
    try {
      setIsSubmitting(true);

      // Get property ID from selected schedule
      const selectedSchedule = schedules.find(s => s.id === data.complianceScheduleId);

      const inspection = await complianceService.createInspection({
        complianceScheduleId: data.complianceScheduleId,
        propertyId: selectedSchedule?.propertyId || '',
        scheduledDate: data.scheduledDate,
        inspectorName: data.inspectorName,
      });

      toast({
        title: 'Inspection Scheduled',
        description: 'The inspection has been scheduled successfully.',
        variant: 'success',
      });

      router.push(`/property-manager/compliance/inspections/${inspection?.id}`);
    } catch (error: unknown) {
      console.error('Failed to create inspection:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to schedule inspection';
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
        <PageBackButton href="/property-manager/compliance/inspections" aria-label="Back to inspections" className="mb-4" />
        <h1 className="text-3xl font-bold tracking-tight">Schedule Inspection</h1>
        <p className="text-muted-foreground">
          Schedule a new inspection for a compliance requirement
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Compliance Schedule Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Compliance Schedule</CardTitle>
              <CardDescription>
                Select the compliance schedule this inspection is for
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
                      The compliance requirement being inspected
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Inspection Details */}
          <Card>
            <CardHeader>
              <CardTitle>Inspection Details</CardTitle>
              <CardDescription>
                When the inspection will take place and who will conduct it
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="scheduledDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Scheduled Date *</FormLabel>
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
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      The scheduled date for the inspection
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="inspectorName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inspector Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., John Smith"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Name of the person conducting the inspection
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="inspectorCompany"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inspector Company</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., ABC Inspection Services"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Company or organization the inspector represents
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="inspectorContact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inspector Contact</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., +971 50 123 4567"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Phone number or email of the inspector
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
                        placeholder="Any special instructions or notes for the inspection..."
                        className="resize-none"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional notes about the inspection
                    </FormDescription>
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
                  Scheduling...
                </>
              ) : (
                <>
                  <ClipboardCheck className="mr-2 h-4 w-4" />
                  Schedule Inspection
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

export default function NewInspectionPage() {
  return (
    <Suspense fallback={
      <div className="container max-w-2xl mx-auto py-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <NewInspectionContent />
    </Suspense>
  );
}
