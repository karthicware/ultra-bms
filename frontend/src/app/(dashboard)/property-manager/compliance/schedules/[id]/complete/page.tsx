'use client';

/**
 * Complete Compliance Schedule Page
 * Story 7.3: Compliance and Inspection Tracking
 *
 * AC #28: Mark compliance schedule as completed with certificate info
 */

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon, Loader2, ChevronLeft, CheckCircle2 } from 'lucide-react';
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
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

import { complianceService } from '@/services/compliance.service';
import { completeScheduleSchema, type CompleteScheduleFormData } from '@/schemas/compliance.schema';
import { type ComplianceScheduleDetail, ComplianceScheduleStatus } from '@/types/compliance';

export default function CompleteSchedulePage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const scheduleId = params.id as string;

  const [schedule, setSchedule] = useState<ComplianceScheduleDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CompleteScheduleFormData>({
    resolver: zodResolver(completeScheduleSchema),
    defaultValues: {
      completionDate: new Date().toISOString().split('T')[0],
      certificateNumber: '',
      certificateUrl: '',
      notes: '',
    },
  });

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setIsLoading(true);
        const schedule = await complianceService.getScheduleById(scheduleId);
        setSchedule(schedule);

        // Check if already completed
        if (schedule?.status === ComplianceScheduleStatus.COMPLETED) {
          toast({
            title: 'Already Completed',
            description: 'This compliance schedule has already been marked as complete.',
          });
          router.push(`/property-manager/compliance/schedules/${scheduleId}`);
        }
      } catch (error) {
        console.error('Failed to load schedule:', error);
        toast({
          title: 'Error',
          description: 'Failed to load compliance schedule',
          variant: 'destructive',
        });
        router.push('/property-manager/compliance');
      } finally {
        setIsLoading(false);
      }
    };

    if (scheduleId) {
      fetchSchedule();
    }
  }, [scheduleId, toast, router]);

  const onSubmit = async (data: CompleteScheduleFormData) => {
    try {
      setIsSubmitting(true);

      await complianceService.completeSchedule(scheduleId, {
        completedDate: data.completionDate,
        notes: data.notes || undefined,
      });

      toast({
        title: 'Schedule Completed',
        description: 'The compliance schedule has been marked as complete.',
      });

      router.push(`/property-manager/compliance/schedules/${scheduleId}`);
    } catch (error: unknown) {
      console.error('Failed to complete schedule:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to complete schedule';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container max-w-2xl mx-auto py-6 space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!schedule) {
    return null;
  }

  return (
    <div className="container max-w-2xl mx-auto py-6">      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Mark Schedule Complete</h1>
        <p className="text-muted-foreground">
          Complete the compliance schedule for {schedule.propertyName}
        </p>
      </div>

      {/* Schedule Info */}
      <Alert className="mb-6">
        <CheckCircle2 className="h-4 w-4" />
        <AlertDescription>
          <strong>{schedule.requirementName}</strong> for <strong>{schedule.propertyName}</strong>
          <br />
          <span className="text-sm text-muted-foreground">
            Due: {new Date(schedule.dueDate).toLocaleDateString()}
          </span>
        </AlertDescription>
      </Alert>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Completion Details</CardTitle>
              <CardDescription>
                Record the completion date and any certificate information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="completionDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Completion Date *</FormLabel>
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
                      The date the compliance requirement was fulfilled
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="certificateNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Certificate Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., CERT-2024-001"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      If a certificate was issued, enter the number
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="certificateUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Certificate URL</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://..."
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Link to the digital certificate or document
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
                        placeholder="Any additional notes about the completion..."
                        className="resize-none"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional notes about how the requirement was fulfilled
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
                  Completing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Mark Complete
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
