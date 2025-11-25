'use client';

/**
 * Edit PM Schedule Page
 * Story 4.2: Preventive Maintenance Scheduling
 * Form for editing an existing preventive maintenance schedule
 *
 * Note: propertyId, recurrenceType, and startDate cannot be edited after creation
 */

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, parseISO } from 'date-fns';
import {
  CalendarIcon,
  Loader2,
  ArrowLeft,
  Info,
  Building2,
  Clock,
  Calendar as CalendarIconOutline,
} from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getPMScheduleById, updatePMSchedule, prepareUpdatePMScheduleData } from '@/services/pm-schedule.service';
import { updatePMScheduleSchema } from '@/lib/validations/pm-schedule';
import { WorkOrderCategory, WorkOrderPriority } from '@/types/work-orders';
import {
  PMSchedule,
  PMScheduleStatus,
  getRecurrenceTypeInfo,
  getPMScheduleStatusInfo,
} from '@/types/pm-schedule';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditPMSchedulePage({ params }: PageProps) {
  const { id: scheduleId } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState<PMSchedule | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Create a modified schema for edit (removing start date validation since we can't edit it)
  const form = useForm({
    resolver: zodResolver(updatePMScheduleSchema),
    defaultValues: {
      scheduleName: '',
      description: '',
      category: undefined as WorkOrderCategory | undefined,
      defaultPriority: undefined as WorkOrderPriority | undefined,
      defaultAssigneeId: null as string | null,
      endDate: null as Date | null,
    },
  });

  const watchedDescription = form.watch('description');

  // Load schedule data on mount
  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getPMScheduleById(scheduleId);

        // Check if schedule can be edited
        if (data.status === PMScheduleStatus.COMPLETED) {
          setError('Completed schedules cannot be edited');
          return;
        }
        if (data.status === PMScheduleStatus.DELETED) {
          setError('Deleted schedules cannot be edited');
          return;
        }

        setSchedule(data);

        // Populate form with existing values
        form.reset({
          scheduleName: data.scheduleName,
          description: data.description,
          category: data.category,
          defaultPriority: data.defaultPriority,
          defaultAssigneeId: data.defaultAssigneeId,
          endDate: data.endDate ? parseISO(data.endDate) : null,
        });
      } catch (err: unknown) {
        const apiError = err as { response?: { status?: number; data?: { error?: { message?: string } } } };
        if (apiError.response?.status === 404) {
          setError('PM Schedule not found');
        } else {
          setError(apiError.response?.data?.error?.message || 'Failed to load PM schedule');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [scheduleId, form]);

  const onSubmit = async (data: Record<string, unknown>) => {
    try {
      setIsSubmitting(true);

      const dto = prepareUpdatePMScheduleData({
        scheduleName: data.scheduleName as string | undefined,
        description: data.description as string | undefined,
        category: data.category as string | undefined,
        defaultPriority: data.defaultPriority as string | undefined,
        defaultAssigneeId: data.defaultAssigneeId as string | null | undefined,
        endDate: data.endDate as Date | null | undefined,
      });

      await updatePMSchedule(scheduleId, dto);

      toast({
        title: 'Success',
        description: 'PM Schedule updated successfully',
      });

      // Redirect to detail page
      router.push(`/property-manager/pm-schedules/${scheduleId}`);
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { error?: { message?: string } } } };
      toast({
        title: 'Error',
        description: apiError.response?.data?.error?.message || 'Failed to update PM schedule',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto py-6 space-y-6">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-6 w-96" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error || !schedule) {
    return (
      <div className="container max-w-4xl mx-auto py-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Alert variant="destructive">
          <AlertDescription>{error || 'Failed to load PM schedule'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const recurrenceInfo = getRecurrenceTypeInfo(schedule.recurrenceType);
  const statusInfo = getPMScheduleStatusInfo(schedule.status);

  return (
    <div className="container max-w-4xl mx-auto py-6">
      {/* Header with Back Button */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="mb-4"
          data-testid="btn-back"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">Edit PM Schedule</h1>
          <Badge className={statusInfo?.badgeClass}>
            {statusInfo?.label || schedule.status}
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Update the preventive maintenance schedule settings
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="form-pm-schedule-edit">
          {/* Read-only Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-muted-foreground" />
                Fixed Settings
              </CardTitle>
              <CardDescription>
                These settings were defined at creation and cannot be modified
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Property */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Property</label>
                  <div className="flex items-center gap-2 p-3 rounded-md bg-muted">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {schedule.propertyName || 'All Properties'}
                    </span>
                  </div>
                </div>

                {/* Recurrence Type */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Frequency</label>
                  <div className="flex items-center gap-2 p-3 rounded-md bg-muted">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{recurrenceInfo?.label || schedule.recurrenceType}</span>
                  </div>
                </div>

                {/* Start Date */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Start Date</label>
                  <div className="flex items-center gap-2 p-3 rounded-md bg-muted">
                    <CalendarIconOutline className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {format(parseISO(schedule.startDate), 'PPP')}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Editable Schedule Information */}
          <Card>
            <CardHeader>
              <CardTitle>Schedule Information</CardTitle>
              <CardDescription>Basic details about this preventive maintenance schedule</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="scheduleName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Schedule Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., HVAC Quarterly Inspection"
                        {...field}
                        data-testid="input-schedule-name"
                        maxLength={100}
                      />
                    </FormControl>
                    <FormDescription>
                      A descriptive name for this maintenance schedule
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-category">
                          <SelectValue placeholder="Select maintenance category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={WorkOrderCategory.PLUMBING}>Plumbing</SelectItem>
                        <SelectItem value={WorkOrderCategory.ELECTRICAL}>Electrical</SelectItem>
                        <SelectItem value={WorkOrderCategory.HVAC}>HVAC</SelectItem>
                        <SelectItem value={WorkOrderCategory.APPLIANCE}>Appliance</SelectItem>
                        <SelectItem value={WorkOrderCategory.CARPENTRY}>Carpentry</SelectItem>
                        <SelectItem value={WorkOrderCategory.PEST_CONTROL}>Pest Control</SelectItem>
                        <SelectItem value={WorkOrderCategory.CLEANING}>Cleaning</SelectItem>
                        <SelectItem value={WorkOrderCategory.PAINTING}>Painting</SelectItem>
                        <SelectItem value={WorkOrderCategory.LANDSCAPING}>Landscaping</SelectItem>
                        <SelectItem value={WorkOrderCategory.OTHER}>Other</SelectItem>
                      </SelectContent>
                    </Select>
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
                        placeholder="Describe the preventive maintenance work in detail. This will be included in each generated work order..."
                        className="resize-none"
                        rows={6}
                        {...field}
                        data-testid="textarea-description"
                        maxLength={1000}
                      />
                    </FormControl>
                    <FormDescription>
                      {watchedDescription?.length || 0}/1000 characters (minimum 20)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* End Date */}
          <Card>
            <CardHeader>
              <CardTitle>Schedule Duration</CardTitle>
              <CardDescription>Optionally set when this schedule should end</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date (Optional)</FormLabel>
                    <div className="flex items-center gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full md:w-[280px] pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                              data-testid="btn-end-date"
                            >
                              {field.value ? (
                                format(field.value, 'PPP')
                              ) : (
                                <span>No end date (indefinite)</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
                            onSelect={field.onChange}
                            disabled={(date) => {
                              // End date must be after start date
                              const startDate = parseISO(schedule.startDate);
                              return date <= startDate;
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      {field.value && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => field.onChange(null)}
                          data-testid="btn-clear-end-date"
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                    <FormDescription>
                      Leave empty to continue indefinitely. The schedule will be automatically marked as completed when this date is reached.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Default Work Order Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Default Work Order Settings</CardTitle>
              <CardDescription>Settings applied to each generated work order</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="defaultPriority"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Default Priority *</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex flex-col space-y-1"
                        data-testid="radio-priority"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value={WorkOrderPriority.HIGH} data-testid="radio-priority-high" />
                          </FormControl>
                          <FormLabel className="font-normal flex items-center gap-2 cursor-pointer">
                            <Badge variant="destructive">HIGH</Badge>
                            Critical preventive maintenance
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value={WorkOrderPriority.MEDIUM} data-testid="radio-priority-medium" />
                          </FormControl>
                          <FormLabel className="font-normal flex items-center gap-2 cursor-pointer">
                            <Badge className="bg-yellow-500">MEDIUM</Badge>
                            Standard preventive maintenance
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value={WorkOrderPriority.LOW} data-testid="radio-priority-low" />
                          </FormControl>
                          <FormLabel className="font-normal flex items-center gap-2 cursor-pointer">
                            <Badge variant="secondary">LOW</Badge>
                            Routine maintenance tasks
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Alert>
                <AlertDescription>
                  Changes to priority will apply to future work orders only. Existing work orders are not affected.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
              data-testid="btn-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              data-testid="btn-save-pm-schedule"
              className="min-w-[180px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
