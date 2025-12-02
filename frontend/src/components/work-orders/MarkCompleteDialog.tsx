 
'use client';

/**
 * Mark Complete Dialog Component
 * Story 4.4: Job Progress Tracking and Completion
 * AC #11-20: Mark complete functionality with required fields
 */

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { CheckCircle, Upload, X, Camera, Loader2, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import type { WorkOrder } from '@/types/work-orders';
import { compressImages } from '@/lib/utils/image-compression';

const markCompleteSchema = z.object({
  completionNotes: z.string()
    .min(1, 'Completion notes are required')
    .max(2000, 'Completion notes cannot exceed 2000 characters'),
  hoursSpent: z.string()
    .min(1, 'Hours spent is required')
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: 'Hours spent must be a positive number',
    }),
  totalCost: z.string()
    .min(1, 'Total cost is required')
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
      message: 'Total cost must be a non-negative number',
    }),
  recommendations: z.string().max(1000, 'Recommendations cannot exceed 1000 characters').optional(),
  followUpRequired: z.boolean(),
  followUpDescription: z.string().max(500, 'Follow-up description cannot exceed 500 characters').optional(),
}).refine((data) => {
  // If follow-up is required, description is mandatory
  if (data.followUpRequired && (!data.followUpDescription || data.followUpDescription.trim() === '')) {
    return false;
  }
  return true;
}, {
  message: 'Follow-up description is required when follow-up is needed',
  path: ['followUpDescription'],
});

type MarkCompleteFormData = z.infer<typeof markCompleteSchema>;

interface MarkCompleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workOrder: WorkOrder;
  onSubmit: (data: {
    completionNotes: string;
    afterPhotos: File[];
    hoursSpent: number;
    totalCost: number;
    recommendations?: string;
    followUpRequired: boolean;
    followUpDescription?: string;
  }) => Promise<void>;
  isSubmitting: boolean;
}

const MIN_PHOTOS = 1;
const MAX_PHOTOS = 10;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function MarkCompleteDialog({
  open,
  onOpenChange,
  workOrder,
  onSubmit,
  isSubmitting,
}: MarkCompleteDialogProps) {
  const [afterPhotos, setAfterPhotos] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<MarkCompleteFormData>({
    resolver: zodResolver(markCompleteSchema),
    defaultValues: {
      completionNotes: '',
      hoursSpent: '',
      totalCost: workOrder.estimatedCost?.toString() || '',
      recommendations: '',
      followUpRequired: false,
      followUpDescription: '',
    },
  });

  const followUpRequired = form.watch('followUpRequired');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setPhotoError(null);

    // Validate file count
    if (afterPhotos.length + files.length > MAX_PHOTOS) {
      setPhotoError(`Maximum ${MAX_PHOTOS} photos allowed`);
      return;
    }

    // Validate each file
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        setPhotoError(`File ${file.name} exceeds 5MB limit`);
        return;
      }
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        setPhotoError('Only JPG and PNG images are allowed');
        return;
      }
    }

    // Compress images before adding (AC #24)
    setIsCompressing(true);
    setCompressionProgress(0);

    try {
      const { files: compressedFiles } = await compressImages(
        files,
        { maxSizeMB: 1, maxWidthOrHeight: 1920, quality: 0.8 },
        (fileIndex, progress) => {
          const overallProgress = ((fileIndex + progress / 100) / files.length) * 100;
          setCompressionProgress(Math.round(overallProgress));
        }
      );

      // Create preview URLs from compressed files
      const newPreviewUrls = compressedFiles.map((file) => URL.createObjectURL(file));
      setPhotoPreviewUrls([...photoPreviewUrls, ...newPreviewUrls]);
      setAfterPhotos([...afterPhotos, ...compressedFiles]);
    } catch {
      setPhotoError('Failed to process images. Please try again.');
    } finally {
      setIsCompressing(false);
      setCompressionProgress(0);
    }
  };

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(photoPreviewUrls[index]);
    setPhotoPreviewUrls(photoPreviewUrls.filter((_, i) => i !== index));
    setAfterPhotos(afterPhotos.filter((_, i) => i !== index));
  };

  const handleSubmit = async (data: MarkCompleteFormData) => {
    // Validate minimum photos
    if (afterPhotos.length < MIN_PHOTOS) {
      setPhotoError(`At least ${MIN_PHOTOS} "after" photo is required`);
      return;
    }

    try {
      await onSubmit({
        completionNotes: data.completionNotes,
        afterPhotos,
        hoursSpent: parseFloat(data.hoursSpent),
        totalCost: parseFloat(data.totalCost),
        recommendations: data.recommendations || undefined,
        followUpRequired: data.followUpRequired,
        followUpDescription: data.followUpDescription || undefined,
      });
      // Clear state on success
      photoPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
      setAfterPhotos([]);
      setPhotoPreviewUrls([]);
      setPhotoError(null);
      form.reset();
    } catch {
      // Error handled by parent
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      photoPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
      setAfterPhotos([]);
      setPhotoPreviewUrls([]);
      setPhotoError(null);
      form.reset();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby="mark-complete-description" data-testid="dialog-mark-complete">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Mark Work Order Complete
          </DialogTitle>
          <DialogDescription id="mark-complete-description">
            Complete work order {workOrder.workOrderNumber}. All required fields must be filled.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Work Order Summary */}
            <div className="rounded-lg border p-3 bg-muted/50">
              <h4 className="font-medium mb-1">{workOrder.title}</h4>
              <p className="text-sm text-muted-foreground">
                {workOrder.propertyName}
                {workOrder.unitNumber && ` • Unit ${workOrder.unitNumber}`}
              </p>
            </div>

            {/* After Photos - Required */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                After Photos *
              </Label>
              <p className="text-sm text-muted-foreground">
                Upload at least 1 photo showing the completed work. Max 10 photos, 5MB each.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                capture="environment"
                multiple
                onChange={handleFileChange}
                className="hidden"
                disabled={afterPhotos.length >= MAX_PHOTOS || isSubmitting}
                aria-label="Upload after photos"
                data-testid="input-after-photos"
              />

              {isCompressing && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Compressing images... {compressionProgress}%
                  </div>
                  <Progress value={compressionProgress} className="h-2" />
                </div>
              )}

              {!isCompressing && afterPhotos.length < MAX_PHOTOS && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload After Photos ({afterPhotos.length}/{MAX_PHOTOS})
                </Button>
              )}

              {/* Photo Previews */}
              {photoPreviewUrls.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {photoPreviewUrls.map((url, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                      <Image
                        src={url}
                        alt={`After photo ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-1 right-1 p-1 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={isSubmitting}
                        aria-label={`Remove photo ${index + 1}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {photoError && (
                <p className="text-sm text-destructive" role="alert">{photoError}</p>
              )}
            </div>

            {/* Completion Notes */}
            <FormField
              control={form.control}
              name="completionNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Completion Notes *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the work completed, any parts replaced, and the final state..."
                      className="min-h-[100px] resize-none"
                      {...field}
                      disabled={isSubmitting}
                      data-testid="textarea-completion-notes"
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value?.length || 0}/2000 characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Hours and Cost */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="hoursSpent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hours Spent *</FormLabel>
                    <FormControl>
                      <NumberInput
                        step={0.25}
                        min={0.25}
                        placeholder="e.g., 2.5"
                        value={field.value ? parseFloat(field.value) : undefined}
                        onChange={(val) => field.onChange(val.toString())}
                        onBlur={field.onBlur}
                        disabled={isSubmitting}
                        data-testid="input-hours-spent"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="totalCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Cost (AED) *</FormLabel>
                    <FormControl>
                      <NumberInput
                        step={0.01}
                        min={0}
                        placeholder="e.g., 350.00"
                        value={field.value ? parseFloat(field.value) : undefined}
                        onChange={(val) => field.onChange(val.toString())}
                        onBlur={field.onBlur}
                        disabled={isSubmitting}
                        data-testid="input-total-cost"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Recommendations */}
            <FormField
              control={form.control}
              name="recommendations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recommendations (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any recommendations for the property manager (preventive measures, future maintenance, etc.)..."
                      className="min-h-[80px] resize-none"
                      {...field}
                      disabled={isSubmitting}
                      data-testid="textarea-recommendations"
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value?.length || 0}/1000 characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Follow-up Required */}
            <div className="space-y-4 p-4 rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
              <FormField
                control={form.control}
                name="followUpRequired"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmitting}
                        aria-describedby="follow-up-description"
                        data-testid="checkbox-follow-up-required"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        Follow-up Required
                      </FormLabel>
                      <FormDescription id="follow-up-description">
                        Check if additional work or inspection is needed in the future
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {followUpRequired && (
                <FormField
                  control={form.control}
                  name="followUpDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Follow-up Details *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe what follow-up is needed and when..."
                          className="min-h-[80px] resize-none"
                          {...field}
                          disabled={isSubmitting}
                          data-testid="textarea-follow-up-description"
                        />
                      </FormControl>
                      <FormDescription>
                        {field.value?.length || 0}/500 characters
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700"
                data-testid="btn-submit-completion"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Completing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark Complete
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
