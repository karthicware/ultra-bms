/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

/**
 * Maintenance Request Submission Form
 * Story 3.5: Tenant Portal - Maintenance Request Submission
 *
 * Features:
 * - Category selection with priority auto-suggestion
 * - Photo upload with compression (max 5, JPG/PNG, max 5MB)
 * - Form validation with Zod
 * - Character counter for description
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import imageCompression from 'browser-image-compression';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  createMaintenanceRequestSchema,
  type CreateMaintenanceRequestFormData,
} from '@/lib/validations/maintenance';
import {
  createMaintenanceRequest,
  getSuggestedPriority,
} from '@/services/maintenance.service';
import { MaintenanceCategory, MaintenancePriority, PreferredAccessTime } from '@/types/maintenance';
import { PhotoUploadZone } from './PhotoUploadZone';

// Category options with labels and icons
const CATEGORY_OPTIONS = [
  { value: MaintenanceCategory.PLUMBING, label: 'Plumbing', icon: '🔧' },
  { value: MaintenanceCategory.ELECTRICAL, label: 'Electrical', icon: '⚡' },
  { value: MaintenanceCategory.HVAC, label: 'HVAC', icon: '❄️' },
  { value: MaintenanceCategory.APPLIANCE, label: 'Appliance', icon: '🔌' },
  { value: MaintenanceCategory.CARPENTRY, label: 'Carpentry', icon: '🔨' },
  { value: MaintenanceCategory.PEST_CONTROL, label: 'Pest Control', icon: '🐛' },
  { value: MaintenanceCategory.CLEANING, label: 'Cleaning', icon: '🧹' },
  { value: MaintenanceCategory.OTHER, label: 'Other', icon: '📝' },
];

const PRIORITY_OPTIONS = [
  { value: MaintenancePriority.HIGH, label: 'High', description: 'Safety/emergency issues' },
  { value: MaintenancePriority.MEDIUM, label: 'Medium', description: 'Important but not urgent' },
  { value: MaintenancePriority.LOW, label: 'Low', description: 'Non-critical maintenance' },
];

const ACCESS_TIME_OPTIONS = [
  { value: PreferredAccessTime.IMMEDIATE, label: 'Immediate' },
  { value: PreferredAccessTime.MORNING, label: 'Morning (8 AM - 12 PM)' },
  { value: PreferredAccessTime.AFTERNOON, label: 'Afternoon (12 PM - 5 PM)' },
  { value: PreferredAccessTime.EVENING, label: 'Evening (5 PM - 8 PM)' },
  { value: PreferredAccessTime.ANY_TIME, label: 'Any time' },
];

export function MaintenanceRequestForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [photos, setPhotos] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateMaintenanceRequestFormData>({
    resolver: zodResolver(createMaintenanceRequestSchema),
    defaultValues: {
      priority: MaintenancePriority.MEDIUM,
      preferredAccessTime: PreferredAccessTime.ANY_TIME,
      preferredAccessDate: new Date(),
    },
  });

  const description = form.watch('description') || '';
  const category = form.watch('category');

  // Auto-suggest priority when category changes
  const handleCategoryChange = (newCategory: MaintenanceCategory) => {
    const suggestedPriority = getSuggestedPriority(newCategory);
    form.setValue('priority', suggestedPriority as MaintenancePriority);
  };

  const onSubmit = async (data: CreateMaintenanceRequestFormData) => {
    setIsSubmitting(true);

    try {
      // Compress photos before upload
      const compressedPhotos = await compressPhotos(photos);

      // Convert Date to ISO string for DTO
      const requestData = {
        ...data,
        preferredAccessDate: data.preferredAccessDate.toISOString(),
      };

      // Submit request
      const response = await createMaintenanceRequest(requestData, compressedPhotos);

      toast({
        title: 'Request submitted successfully',
        description: `Request ${response.requestNumber} has been created`,
      });

      // Redirect to request details
      router.push(`/tenant/requests/${response.id}`);
    } catch (error: any) {
      toast({
        title: 'Failed to submit request',
        description: error.response?.data?.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const compressPhotos = async (files: File[]): Promise<File[]> => {
    const options = {
      maxSizeMB: 0.5, // 500KB
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    };

    const compressed = await Promise.all(
      files.map(async (file) => {
        try {
          return await imageCompression(file, options);
        } catch (error) {
          console.error('Failed to compress photo:', error);
          return file; // Return original if compression fails
        }
      })
    );

    return compressed;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Category */}
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Category <span className="text-red-500">*</span>
              </FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  handleCategoryChange(value as MaintenanceCategory);
                }}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger data-testid="select-category">
                    <SelectValue placeholder="Select issue category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.icon} {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                What type of issue are you reporting?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Priority */}
        <FormField
          control={form.control}
          name="priority"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Priority <span className="text-red-500">*</span>
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-priority">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{option.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Auto-suggested based on category, you can change it
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Title <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="e.g., Leaking kitchen faucet"
                  maxLength={100}
                  data-testid="input-title"
                />
              </FormControl>
              <FormDescription>
                Brief description of the issue (max 100 characters)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Description <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Please provide detailed information about the issue..."
                  className="min-h-32 resize-none"
                  maxLength={1000}
                  data-testid="textarea-description"
                />
              </FormControl>
              <div className="flex justify-between items-center">
                <FormDescription>
                  Detailed description helps us resolve the issue faster (min 20 chars)
                </FormDescription>
                <span
                  className={cn(
                    'text-sm',
                    description.length < 20
                      ? 'text-red-500'
                      : description.length > 950
                      ? 'text-orange-500'
                      : 'text-muted-foreground'
                  )}
                >
                  {description.length} / 1000
                </span>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Photo Upload */}
        <div className="space-y-2">
          <FormLabel>Photos (Optional)</FormLabel>
          <PhotoUploadZone photos={photos} onPhotosChange={setPhotos} />
          <p className="text-sm text-muted-foreground">
            Upload up to 5 photos (JPG/PNG, max 5MB each). Photos will be compressed automatically.
          </p>
        </div>

        {/* Preferred Access Time */}
        <FormField
          control={form.control}
          name="preferredAccessTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Preferred Access Time <span className="text-red-500">*</span>
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-access-time">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {ACCESS_TIME_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                When would you prefer the maintenance team to access your unit?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Preferred Access Date */}
        <FormField
          control={form.control}
          name="preferredAccessDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>
                Preferred Access Date <span className="text-red-500">*</span>
              </FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !field.value && 'text-muted-foreground'
                      )}
                      data-testid="btn-access-date"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(field.value, 'PPP') : 'Pick a date'}
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
                Date cannot be in the past
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <div className="flex justify-end gap-4 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} data-testid="btn-submit">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
