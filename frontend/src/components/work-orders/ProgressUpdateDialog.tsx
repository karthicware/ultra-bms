/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

/**
 * Progress Update Dialog Component
 * Story 4.4: Job Progress Tracking and Completion
 * AC #3-10: Progress update functionality
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
import { MessageSquarePlus, Upload, X, Calendar, Loader2 } from 'lucide-react';
import Image from 'next/image';
import type { WorkOrder } from '@/types/work-orders';
import { compressImages } from '@/lib/utils/image-compression';

const progressUpdateSchema = z.object({
  progressNotes: z.string()
    .min(1, 'Progress notes are required')
    .max(500, 'Progress notes cannot exceed 500 characters'),
  estimatedCompletionDate: z.string().optional(),
});

type ProgressUpdateFormData = z.infer<typeof progressUpdateSchema>;

interface ProgressUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workOrder: WorkOrder;
  onSubmit: (data: {
    progressNotes: string;
    photos?: File[];
    estimatedCompletionDate?: string;
  }) => Promise<void>;
  isSubmitting: boolean;
}

const MAX_PHOTOS = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function ProgressUpdateDialog({
  open,
  onOpenChange,
  workOrder,
  onSubmit,
  isSubmitting,
}: ProgressUpdateDialogProps) {
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProgressUpdateFormData>({
    resolver: zodResolver(progressUpdateSchema),
    defaultValues: {
      progressNotes: '',
      estimatedCompletionDate: '',
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setPhotoError(null);

    // Validate file count
    if (photos.length + files.length > MAX_PHOTOS) {
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
      setPhotos([...photos, ...compressedFiles]);
    } catch (err) {
      setPhotoError('Failed to process images. Please try again.');
    } finally {
      setIsCompressing(false);
      setCompressionProgress(0);
    }
  };

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(photoPreviewUrls[index]);
    setPhotoPreviewUrls(photoPreviewUrls.filter((_, i) => i !== index));
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmit = async (data: ProgressUpdateFormData) => {
    try {
      await onSubmit({
        progressNotes: data.progressNotes,
        photos: photos.length > 0 ? photos : undefined,
        estimatedCompletionDate: data.estimatedCompletionDate || undefined,
      });
      // Clear state on success
      photoPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
      setPhotos([]);
      setPhotoPreviewUrls([]);
      setPhotoError(null);
      form.reset();
    } catch (err) {
      // Error handled by parent
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      photoPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
      setPhotos([]);
      setPhotoPreviewUrls([]);
      setPhotoError(null);
      form.reset();
      onOpenChange(false);
    }
  };

  const progressNotesValue = form.watch('progressNotes');

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg" aria-describedby="progress-update-description" data-testid="dialog-add-progress-update">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquarePlus className="h-5 w-5 text-blue-600" />
            Add Progress Update
          </DialogTitle>
          <DialogDescription id="progress-update-description">
            Add an update on the progress of {workOrder.workOrderNumber}.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Progress Notes */}
            <FormField
              control={form.control}
              name="progressNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Progress Notes *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the current progress, any issues encountered, or work completed..."
                      className="min-h-[100px] resize-none"
                      {...field}
                      disabled={isSubmitting}
                      aria-describedby="progress-notes-count"
                      data-testid="textarea-progress-notes"
                    />
                  </FormControl>
                  <FormDescription id="progress-notes-count">
                    {progressNotesValue?.length || 0}/500 characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Estimated Completion Date */}
            <FormField
              control={form.control}
              name="estimatedCompletionDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Estimated Completion Date (Optional)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      disabled={isSubmitting}
                      min={new Date().toISOString().split('T')[0]}
                      data-testid="calendar-estimated-completion"
                    />
                  </FormControl>
                  <FormDescription>
                    Update if completion date has changed
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Progress Photos */}
            <div className="space-y-2">
              <Label>Progress Photos (Optional)</Label>
              <p className="text-sm text-muted-foreground">
                Upload photos showing current progress. Max 5 photos, 5MB each.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                capture="environment"
                multiple
                onChange={handleFileChange}
                className="hidden"
                disabled={photos.length >= MAX_PHOTOS || isSubmitting}
                aria-label="Upload progress photos"
                data-testid="input-progress-photos"
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

              {!isCompressing && photos.length < MAX_PHOTOS && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Photos ({photos.length}/{MAX_PHOTOS})
                </Button>
              )}

              {/* Photo Previews */}
              {photoPreviewUrls.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {photoPreviewUrls.map((url, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                      <Image
                        src={url}
                        alt={`Progress photo ${index + 1}`}
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
                data-testid="btn-save-progress-update"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <MessageSquarePlus className="h-4 w-4 mr-2" />
                    Add Update
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
