 
'use client';

/**
 * Create PM Schedule Page
 * Story 4.2: Preventive Maintenance Scheduling
 * Form for creating a new preventive maintenance schedule
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon, Loader2, ArrowLeft } from 'lucide-react';
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
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { createPMSchedule, prepareCreatePMScheduleData } from '@/services/pm-schedule.service';
import { getProperties } from '@/services/properties.service';
import { createPMScheduleSchema } from '@/lib/validations/pm-schedule';
import { WorkOrderCategory, WorkOrderPriority } from '@/types/work-orders';
import { RecurrenceType, RECURRENCE_TYPE_OPTIONS } from '@/types/pm-schedule';
import type { Property } from '@/types';

export default function CreatePMSchedulePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(true);

  const form = useForm({
    resolver: zodResolver(createPMScheduleSchema),
    defaultValues: {
      scheduleName: '',
      propertyId: null as string | null,
      category: undefined as WorkOrderCategory | undefined,
      description: '',
      recurrenceType: undefined as RecurrenceType | undefined,
      startDate: undefined as Date | undefined,
      endDate: null as Date | null | undefined,
      defaultPriority: WorkOrderPriority.MEDIUM,
      defaultAssigneeId: null as string | null,
    },
  });

  const watchedRecurrenceType = form.watch('recurrenceType');
  const watchedDescription = form.watch('description');
  const watchedPropertyId = form.watch('propertyId');

  // Load properties on mount
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoadingProperties(true);
        const response = await getProperties({ page: 0, size: 100 });
        setProperties(response.content || []);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load properties',
          variant: 'destructive',
        });
        setProperties([]);
      } finally {
        setLoadingProperties(false);
      }
    };

    fetchProperties();
  }, [toast]);

  const onSubmit = async (data: Record<string, unknown>) => {
    try {
      setIsSubmitting(true);

      const dto = prepareCreatePMScheduleData({
        scheduleName: data.scheduleName as string,
        propertyId: data.propertyId as string | null,
        category: data.category as string,
        description: data.description as string,
        recurrenceType: data.recurrenceType as string,
        startDate: data.startDate as Date,
        endDate: data.endDate as Date | null | undefined,
        defaultPriority: data.defaultPriority as string,
        defaultAssigneeId: data.defaultAssigneeId as string | null,
      });

      const response = await createPMSchedule(dto);

      toast({
        title: 'Success',
        description: `PM Schedule "${response.scheduleName}" created successfully`,
      });

      // Redirect to list page after short delay
      setTimeout(() => {
        router.push('/property-manager/pm-schedules');
      }, 1500);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      toast({
        title: 'Error',
        description: err.response?.data?.error?.message || 'Failed to create PM schedule',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <h1 className="text-3xl font-bold tracking-tight">Create PM Schedule</h1>
        <p className="text-muted-foreground">
          Set up a new preventive maintenance schedule for automatic work order generation
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="form-pm-schedule-create">
          {/* Schedule Information */}
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
                name="propertyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === 'all' ? null : value)}
                      value={field.value || 'all'}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-property">
                          <SelectValue placeholder={loadingProperties ? 'Loading...' : 'Select property'} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">All Properties</SelectItem>
                        <Separator className="my-1" />
                        {properties.map((property) => (
                          <SelectItem key={property.id} value={property.id}>
                            {property.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select a specific property or leave as "All Properties" to apply to all
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchedPropertyId === null && (
                <Alert>
                  <AlertDescription>
                    This schedule will generate separate work orders for each property when triggered.
                  </AlertDescription>
                </Alert>
              )}

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

          {/* Recurrence Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Recurrence Settings</CardTitle>
              <CardDescription>How often should work orders be generated?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="recurrenceType"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Frequency *</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                        data-testid="radio-recurrence-type"
                      >
                        {RECURRENCE_TYPE_OPTIONS.map((option) => (
                          <FormItem
                            key={option.value}
                            className={cn(
                              'flex items-start space-x-3 space-y-0 rounded-md border p-4 cursor-pointer hover:bg-muted/50',
                              field.value === option.value && 'border-primary bg-muted/50'
                            )}
                          >
                            <FormControl>
                              <RadioGroupItem
                                value={option.value}
                                data-testid={`radio-recurrence-${option.value.toLowerCase()}`}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="font-medium cursor-pointer">
                                {option.label}
                              </FormLabel>
                              <p className="text-sm text-muted-foreground">
                                {option.description}
                              </p>
                            </div>
                          </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Date *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                              data-testid="btn-start-date"
                            >
                              {field.value ? (
                                format(field.value, 'PPP')
                              ) : (
                                <span>Pick start date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        First work order will be generated on this date
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>End Date (Optional)</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                              data-testid="btn-end-date"
                            >
                              {field.value ? (
                                format(field.value, 'PPP')
                              ) : (
                                <span>No end date</span>
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
                              const startDate = form.getValues('startDate');
                              return startDate ? date <= startDate : date < new Date();
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        Leave empty for indefinite scheduling
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {watchedRecurrenceType && (
                <Alert>
                  <AlertDescription>
                    Work orders will be automatically generated{' '}
                    {RECURRENCE_TYPE_OPTIONS.find((o) => o.value === watchedRecurrenceType)?.label.toLowerCase()}{' '}
                    starting from the selected start date.
                  </AlertDescription>
                </Alert>
              )}
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
                          <FormLabel className="font-normal flex items-center gap-2">
                            <Badge variant="destructive">HIGH</Badge>
                            Critical preventive maintenance
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value={WorkOrderPriority.MEDIUM} data-testid="radio-priority-medium" />
                          </FormControl>
                          <FormLabel className="font-normal flex items-center gap-2">
                            <Badge className="bg-yellow-500">MEDIUM</Badge>
                            Standard preventive maintenance
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value={WorkOrderPriority.LOW} data-testid="radio-priority-low" />
                          </FormControl>
                          <FormLabel className="font-normal flex items-center gap-2">
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

              {/* Note: defaultAssigneeId would require a vendor/staff dropdown which depends on other modules */}
              <Alert>
                <AlertDescription>
                  Generated work orders will be created as unassigned. You can assign vendors after creation.
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
              data-testid="btn-create-pm-schedule"
              className="min-w-[180px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create PM Schedule'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
