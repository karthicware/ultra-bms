/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

/**
 * Create Work Order Page
 * Story 4.1: Work Order Creation and Management
 * Form for creating a new work order with photo uploads
 * Updated: shadcn-studio form styling (SCP-2025-11-30)
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import {
  ArrowLeft,
  CalendarIcon,
  Loader2,
  Upload,
  X,
  Building2,
  DoorOpenIcon,
  WrenchIcon,
  TagIcon,
  FileTextIcon,
  MessageSquareIcon,
  DollarSignIcon,
  BoxIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
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
import { getAssetsForDropdown } from '@/services/asset.service';
import { createWorkOrderSchema, type CreateWorkOrderFormData } from '@/schemas/workOrderSchemas';
import { WorkOrderCategory, WorkOrderPriority } from '@/types/work-orders';
import type { Property, Unit } from '@/types';
import type { AssetListItem } from '@/types/asset';

export default function CreateWorkOrderPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [assets, setAssets] = useState<AssetListItem[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);

  const form = useForm<CreateWorkOrderFormData>({
    resolver: zodResolver(createWorkOrderSchema),
    defaultValues: {
      propertyId: '',
      unitId: '',
      assetId: '',
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

  // Load assets when property changes (Story 7.1: Asset Registry and Tracking)
  useEffect(() => {
    const fetchAssets = async () => {
      if (!watchedPropertyId) {
        setAssets([]);
        form.setValue('assetId', '');
        return;
      }

      try {
        setLoadingAssets(true);
        const assetList = await getAssetsForDropdown(watchedPropertyId);
        setAssets(assetList || []);
      } catch (error) {
        console.error('Failed to load assets:', error);
        setAssets([]);
      } finally {
        setLoadingAssets(false);
      }
    };

    fetchAssets();
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

      // Prepare DTO - category is guaranteed non-empty by form validation
      const dto = {
        propertyId: data.propertyId,
        unitId: data.unitId || undefined,
        category: data.category as WorkOrderCategory,
        priority: data.priority,
        title: data.title,
        description: data.description,
        scheduledDate: data.scheduledDate || undefined,
        accessInstructions: data.accessInstructions || undefined,
        estimatedCost: data.estimatedCost || undefined,
        maintenanceRequestId: data.maintenanceRequestId || undefined,
        // Asset link (Story 7.1: Asset Registry and Tracking - AC #16)
        assetId: data.assetId || undefined,
      };

      const workOrder = await createWorkOrder(dto, photoFiles.length > 0 ? photoFiles : undefined);

      toast({
        title: 'Success',
        description: `Work Order #${workOrder.workOrderNumber} created successfully`,
        variant: 'success',
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
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/property-manager/work-orders')}
          data-testid="btn-back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <WrenchIcon className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Create Work Order</h1>
          </div>
          <p className="text-muted-foreground mt-2">Create a new maintenance work order for a property unit</p>
        </div>
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
                  <FormItem className="space-y-2">
                    <Label className="flex items-center gap-1">
                      Property <span className="text-destructive">*</span>
                    </Label>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-property" className="w-full">
                          <div className="flex items-center gap-2">
                            <Building2 className="size-4 text-muted-foreground" />
                            <SelectValue placeholder={loadingProperties ? 'Loading...' : 'Select property'} />
                          </div>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {properties.map((property) => (
                          <SelectItem key={property.id} value={property.id}>
                            <div className="flex items-center gap-2">
                              <Building2 className="size-4" />
                              {property.name}
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
                name="unitId"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <Label>Unit</Label>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!watchedPropertyId || loadingUnits}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-unit" className="w-full">
                          <div className="flex items-center gap-2">
                            <DoorOpenIcon className="size-4 text-muted-foreground" />
                            <SelectValue
                              placeholder={
                                !watchedPropertyId
                                  ? 'Select property first'
                                  : loadingUnits
                                  ? 'Loading...'
                                  : 'Select unit (optional)'
                              }
                            />
                          </div>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {units.map((unit) => (
                          <SelectItem key={unit.id} value={unit.id}>
                            <div className="flex items-center gap-2">
                              <DoorOpenIcon className="size-4" />
                              Unit {unit.unitNumber} - {unit.status}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-muted-foreground text-xs">Leave empty for property-wide work orders</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Asset Link - Story 7.1: Asset Registry and Tracking - AC #16 */}
              <FormField
                control={form.control}
                name="assetId"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <Label>Linked Asset</Label>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!watchedPropertyId || loadingAssets}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-asset" className="w-full">
                          <div className="flex items-center gap-2">
                            <BoxIcon className="size-4 text-muted-foreground" />
                            <SelectValue
                              placeholder={
                                !watchedPropertyId
                                  ? 'Select property first'
                                  : loadingAssets
                                  ? 'Loading...'
                                  : assets.length === 0
                                  ? 'No assets available'
                                  : 'Select asset (optional)'
                              }
                            />
                          </div>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {assets.map((asset) => (
                          <SelectItem key={asset.id} value={asset.id}>
                            <div className="flex items-center gap-2">
                              <BoxIcon className="size-4" />
                              {asset.assetNumber} - {asset.assetName}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-muted-foreground text-xs">
                      Link this work order to a property asset (e.g., HVAC unit, elevator)
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <Label className="flex items-center gap-1">
                        Category <span className="text-destructive">*</span>
                      </Label>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger data-testid="select-category" className="w-full">
                            <div className="flex items-center gap-2">
                              <WrenchIcon className="size-4 text-muted-foreground" />
                              <SelectValue placeholder="Select category" />
                            </div>
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
                      <Label className="flex items-center gap-1">
                        Priority <span className="text-destructive">*</span>
                      </Label>
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
                            <Label className="font-normal flex items-center gap-2 cursor-pointer">
                              <Badge variant="destructive">HIGH</Badge>
                              Emergency repairs, safety issues
                            </Label>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value={WorkOrderPriority.MEDIUM} data-testid="radio-priority-medium" />
                            </FormControl>
                            <Label className="font-normal flex items-center gap-2 cursor-pointer">
                              <Badge className="bg-yellow-500">MEDIUM</Badge>
                              Non-urgent repairs
                            </Label>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value={WorkOrderPriority.LOW} data-testid="radio-priority-low" />
                            </FormControl>
                            <Label className="font-normal flex items-center gap-2 cursor-pointer">
                              <Badge variant="secondary">LOW</Badge>
                              General maintenance
                            </Label>
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
                  <FormItem className="space-y-2">
                    <Label htmlFor="title" className="flex items-center gap-1">
                      Title <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <TagIcon className="size-4" />
                      </div>
                      <FormControl>
                        <Input
                          id="title"
                          className="pl-9"
                          placeholder="e.g., Replace broken kitchen faucet"
                          {...field}
                          data-testid="input-title"
                          maxLength={100}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                        <FileTextIcon className="size-4" />
                      </div>
                      <FormControl>
                        <Textarea
                          id="description"
                          placeholder="Describe the maintenance issue in detail..."
                          className="resize-none pl-9"
                          rows={6}
                          {...field}
                          data-testid="textarea-description"
                          maxLength={1000}
                        />
                      </FormControl>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      {watchedDescription?.length || 0}/1000 characters
                    </p>
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
                  <FormItem className="flex flex-col space-y-2">
                    <Label>Scheduled Date</Label>
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
                            <CalendarIcon className="mr-2 h-4 w-4" />
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
                    <p className="text-muted-foreground text-xs">
                      When should this work be performed?
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accessInstructions"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <Label htmlFor="accessInstructions">Access Instructions</Label>
                    <div className="relative">
                      <div className="text-muted-foreground pointer-events-none absolute top-3 left-0 flex items-start pl-3">
                        <MessageSquareIcon className="size-4" />
                      </div>
                      <FormControl>
                        <Textarea
                          id="accessInstructions"
                          placeholder="Provide any special access instructions, gate codes, or tenant contact details..."
                          className="resize-none pl-9"
                          rows={4}
                          {...field}
                          data-testid="textarea-access-instructions"
                          maxLength={500}
                        />
                      </FormControl>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      {field.value?.length || 0}/500 characters
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estimatedCost"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <Label htmlFor="estimatedCost">Estimated Cost</Label>
                    <div className="relative">
                      <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <DollarSignIcon className="size-4" />
                      </div>
                      <FormControl>
                        <Input
                          id="estimatedCost"
                          type="number"
                          placeholder="0.00"
                          className="pl-9 pr-14"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          value={field.value ?? ''}
                          data-testid="input-estimated-cost"
                          step="0.01"
                          min="0"
                        />
                      </FormControl>
                      <span className="text-muted-foreground pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-sm">
                        AED
                      </span>
                    </div>
                    <p className="text-muted-foreground text-xs">Optional estimated cost for this work order</p>
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
