 
'use client';

/**
 * Start Work Dialog Component
 * Story 4.4: Job Progress Tracking and Completion
 * AC #1, #2: Start Work button and functionality
 */

import { useState, useRef } from 'react';
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
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Play, Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import Image from 'next/image';
import type { WorkOrder } from '@/types/work-orders';
import { compressImages, formatFileSize } from '@/lib/utils/image-compression';

interface StartWorkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workOrder: WorkOrder;
  onStartWork: (beforePhotos?: File[]) => Promise<void>;
  isSubmitting: boolean;
}

const MAX_PHOTOS = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function StartWorkDialog({
  open,
  onOpenChange,
  workOrder,
  onStartWork,
  isSubmitting,
}: StartWorkDialogProps) {
  const [beforePhotos, setBeforePhotos] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setError(null);

    // Validate file count
    if (beforePhotos.length + files.length > MAX_PHOTOS) {
      setError(`Maximum ${MAX_PHOTOS} photos allowed`);
      return;
    }

    // Validate each file
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        setError(`File ${file.name} exceeds 5MB limit`);
        return;
      }
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        setError('Only JPG and PNG images are allowed');
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
      setBeforePhotos([...beforePhotos, ...compressedFiles]);
    } catch (err) {
      setError('Failed to process images. Please try again.');
    } finally {
      setIsCompressing(false);
      setCompressionProgress(0);
    }
  };

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(photoPreviewUrls[index]);
    setPhotoPreviewUrls(photoPreviewUrls.filter((_, i) => i !== index));
    setBeforePhotos(beforePhotos.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    try {
      await onStartWork(beforePhotos.length > 0 ? beforePhotos : undefined);
      // Clear state on success
      photoPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
      setBeforePhotos([]);
      setPhotoPreviewUrls([]);
      setError(null);
    } catch (err) {
      // Error handled by parent
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      photoPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
      setBeforePhotos([]);
      setPhotoPreviewUrls([]);
      setError(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" aria-describedby="start-work-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="h-5 w-5 text-green-600" />
            Start Work
          </DialogTitle>
          <DialogDescription id="start-work-description">
            Begin work on {workOrder.workOrderNumber}. You can optionally upload "before" photos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Work Order Summary */}
          <div className="rounded-lg border p-3 bg-muted/50">
            <h4 className="font-medium mb-1">{workOrder.title}</h4>
            <p className="text-sm text-muted-foreground">
              {workOrder.propertyName}
              {workOrder.unitNumber && ` • Unit ${workOrder.unitNumber}`}
            </p>
          </div>

          {/* Before Photos (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="before-photos">Before Photos (Optional)</Label>
            <p className="text-sm text-muted-foreground">
              Upload photos showing the current state before work begins. Max 5 photos, 5MB each.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              id="before-photos"
              accept="image/jpeg,image/png"
              capture="environment"
              multiple
              onChange={handleFileChange}
              className="hidden"
              disabled={beforePhotos.length >= MAX_PHOTOS || isSubmitting}
              aria-label="Upload before photos"
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

            {!isCompressing && beforePhotos.length < MAX_PHOTOS && (
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Before Photos
              </Button>
            )}

            {/* Photo Previews */}
            {photoPreviewUrls.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                {photoPreviewUrls.map((url, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                    <Image
                      src={url}
                      alt={`Before photo ${index + 1}`}
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

            {error && (
              <p className="text-sm text-destructive" role="alert">{error}</p>
            )}
          </div>

          {/* Info Message */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
            <ImageIcon className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
            <p className="text-sm text-blue-800 dark:text-blue-200">
              When you start work, the status will change to "In Progress" and you'll be able to add progress updates.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start Work
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
