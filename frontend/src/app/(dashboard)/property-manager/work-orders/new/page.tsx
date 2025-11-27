/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

/**
 * Create Work Order Page
 * Story 4.1: Work Order Creation and Management
 * Form for creating a new work order with photo uploads
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon, Loader2, Upload, X } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { createWorkOrder } from '@/services/work-orders.service';
import { getProperties } from '@/services/properties.service';
import { getUnits } from '@/services/units.service';
import { createWorkOrderSchema, type CreateWorkOrderFormData } from '@/schemas/workOrderSchemas';
import { WorkOrderCategory, WorkOrderPriority } from '@/types/work-orders';
import type { Property, Unit } from '@/types';

export default function CreateWorkOrderPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);

  const form = useForm<CreateWorkOrderFormData>({
    resolver: zodResolver(createWorkOrderSchema),
    defaultValues: {
      propertyId: '',
      unitId: '',
      category: '',
      priority: WorkOrderPriority.MEDIUM,
      title: '',
      description: '',
      scheduledDate: '',
      accessInstructions: '',
      maintenanceRequestId: '',
    },
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
  });

  const watchedPropertyId = form.watch('propertyId');
  const watchedPriority = form.watch('priority');
  const watchedDescription = form.watch('description');

  // Load properties on mount
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoadingProperties(true);
        const response = await getProperties({ page: 0, size: 100 });
        setProperties(response?.content || []);
      } catch (error) {
        console.error('Failed to load properties:', error);
        setProperties([]);
      } finally {
        setLoadingProperties(false);
      }
    };

    fetchProperties();
  }, []);

  // Load units when property changes
  useEffect(() => {
    const fetchUnits = async () => {
      if (!watchedPropertyId) {
        setUnits([]);
        form.setValue('unitId', '');
        return;
      }

      try {
        setLoadingUnits(true);
        const response = await getUnits({ propertyId: watchedPropertyId });
        setUnits(response?.units || []);
      } catch (error) {
        console.error('Failed to load units:', error);
        setUnits([]);
      } finally {
        setLoadingUnits(false);
      }
    };

    fetchUnits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedPropertyId]);

  // Handle photo selection
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Validate file count
    if (photoFiles.length + files.length > 5) {
      toast({
        title: 'Error',
        description: 'Maximum 5 photos allowed',
        variant: 'destructive',
      });
      return;
    }

    // Validate file types and sizes
    const validFiles = files.filter((file) => {
      if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
        toast({
          title: 'Error',
          description: `${file.name} is not a valid image type. Only JPG and PNG are allowed.`,
          variant: 'destructive',
        });
        return false;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Error',
          description: `${file.name} exceeds 5MB size limit`,
          variant: 'destructive',
        });
        return false;
      }

      return true;
    });

    setPhotoFiles([...photoFiles, ...validFiles]);
  };

  // Remove photo
  const removePhoto = (index: number) => {
    setPhotoFiles(photoFiles.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: CreateWorkOrderFormData) => {
    try {
      setIsSubmitting(true);

      // Prepare DTO
      const dto = {
        propertyId: data.propertyId,
        unitId: data.unitId || undefined,
        category: data.category,
        priority: data.priority,
        title: data.title,
        description: data.description,
        scheduledDate: data.scheduledDate || undefined,
        accessInstructions: data.accessInstructions || undefined,
        estimatedCost: data.estimatedCost || undefined,
        maintenanceRequestId: data.maintenanceRequestId || undefined,
      };

      const workOrder = await createWorkOrder(dto, photoFiles.length > 0 ? photoFiles : undefined);

      toast({
        title: 'Success',
        description: `Work Order #${workOrder.workOrderNumber} created successfully`,
      });

      // Redirect after short delay
      setTimeout(() => {
        router.push(`/property-manager/work-orders/${workOrder.id}`);
      }, 1500);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error?.message || 'Failed to create work order',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Create Work Order</h1>
        <p className="text-muted-foreground">Create a new maintenance work order for a property unit</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="form-work-order-create">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Property, unit, and work order details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="propertyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-property">
                          <SelectValue placeholder={loadingProperties ? 'Loading...' : 'Select property'} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {properties.map((property) => (
                          <SelectItem key={property.id} value={property.id}>
                            {property.name}
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
                name="unitId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!watchedPropertyId || loadingUnits}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-unit">
                          <SelectValue
                            placeholder={
                              !watchedPropertyId
                                ? 'Select property first'
                                : loadingUnits
                                ? 'Loading...'
                                : 'Select unit (optional)'
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {units.map((unit) => (
                          <SelectItem key={unit.id} value={unit.id}>
                            Unit {unit.unitNumber} - {unit.status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Leave empty for property-wide work orders</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger data-testid="select-category">
                            <SelectValue placeholder="Select category" />
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
                  name="priority"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Priority *</FormLabel>
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
                              Emergency repairs, safety issues
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value={WorkOrderPriority.MEDIUM} data-testid="radio-priority-medium" />
                            </FormControl>
                            <FormLabel className="font-normal flex items-center gap-2">
                              <Badge className="bg-yellow-500">MEDIUM</Badge>
                              Non-urgent repairs
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value={WorkOrderPriority.LOW} data-testid="radio-priority-low" />
                            </FormControl>
                            <FormLabel className="font-normal flex items-center gap-2">
                              <Badge variant="secondary">LOW</Badge>
                              General maintenance
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {watchedPriority === WorkOrderPriority.HIGH && (
                <Alert>
                  <AlertDescription>
                    ⚠️ High priority work orders should be scheduled immediately. Ensure tenant is notified of urgent access.
                  </AlertDescription>
                </Alert>
              )}

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Replace broken kitchen faucet"
                        {...field}
                        data-testid="input-title"
                        maxLength={100}
                      />
                    </FormControl>
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
                        placeholder="Describe the maintenance issue in detail..."
                        className="resize-none"
                        rows={6}
                        {...field}
                        data-testid="textarea-description"
                        maxLength={1000}
                      />
                    </FormControl>
                    <FormDescription>
                      {watchedDescription?.length || 0}/1000 characters
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Scheduling and Access */}
          <Card>
            <CardHeader>
              <CardTitle>Scheduling and Access</CardTitle>
              <CardDescription>When to perform the work and how to access the property</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="scheduledDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Scheduled Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                            data-testid="btn-scheduled-date"
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
                          onSelect={(date) => field.onChange(date?.toISOString())}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      When should this work be performed?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accessInstructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Access Instructions</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Provide any special access instructions, gate codes, or tenant contact details..."
                        className="resize-none"
                        rows={4}
                        {...field}
                        data-testid="textarea-access-instructions"
                        maxLength={500}
                      />
                    </FormControl>
                    <FormDescription>
                      {field.value?.length || 0}/500 characters
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estimatedCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Cost (AED)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        value={field.value ?? ''}
                        data-testid="input-estimated-cost"
                        step="0.01"
                        min="0"
                      />
                    </FormControl>
                    <FormDescription>Optional estimated cost for this work order</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Photo Attachments */}
          <Card>
            <CardHeader>
              <CardTitle>Photo Attachments</CardTitle>
              <CardDescription>
                📷 Add photos to document the issue. Up to 5 photos allowed.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="photo-upload"
                  className={cn(
                    'flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted',
                    photoFiles.length >= 5 && 'opacity-50 cursor-not-allowed'
                  )}
                  data-testid="upload-photo-zone"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">JPG or PNG (MAX. 5MB per file)</p>
                  </div>
                  <input
                    id="photo-upload"
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/jpg,image/png"
                    multiple
                    onChange={handlePhotoChange}
                    disabled={photoFiles.length >= 5}
                  />
                </label>
              </div>

              {photoFiles.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {photoFiles.map((file, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square rounded-lg border bg-muted overflow-hidden">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        data-testid={`btn-remove-photo-${index}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <p className="text-xs text-muted-foreground mt-1 truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ))}
                </div>
              )}
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
            <Button
              type="submit"
              disabled={isSubmitting}
              data-testid="btn-create-work-order"
              className="min-w-[150px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Work Order'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
