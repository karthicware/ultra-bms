/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

/**
 * Photo Upload Zone Component
 * Story 3.5: Tenant Portal - Maintenance Request Submission
 *
 * Features:
 * - Drag-and-drop file upload
 * - Click to browse files
 * - Photo preview thumbnails
 * - Remove photo option
 * - File validation (JPG/PNG, max 5MB, max 5 photos)
 */

import { useCallback, useRef } from 'react';
import { Upload, X, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface PhotoUploadZoneProps {
  photos: File[];
  onPhotosChange: (photos: File[]) => void;
  maxPhotos?: number;
  maxSizeMB?: number;
}

const MAX_PHOTOS = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];

export function PhotoUploadZone({
  photos,
  onPhotosChange,
  maxPhotos = MAX_PHOTOS,
  maxSizeMB = 5,
}: PhotoUploadZoneProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `${file.name} must be JPG or PNG`;
    }
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `${file.name} exceeds ${maxSizeMB}MB`;
    }
    return null;
  };

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;

      const newFiles = Array.from(files);
      const totalPhotos = photos.length + newFiles.length;

      if (totalPhotos > maxPhotos) {
        toast({
          title: 'Too many photos',
          description: `Maximum ${maxPhotos} photos allowed`,
          variant: 'destructive',
        });
        return;
      }

      // Validate each file
      const validFiles: File[] = [];
      const errors: string[] = [];

      for (const file of newFiles) {
        const error = validateFile(file);
        if (error) {
          errors.push(error);
        } else {
          validFiles.push(file);
        }
      }

      // Show errors if any
      if (errors.length > 0) {
        toast({
          title: 'Some files were rejected',
          description: errors.join(', '),
          variant: 'destructive',
        });
      }

      // Add valid files
      if (validFiles.length > 0) {
        onPhotosChange([...photos, ...validFiles]);
      }
    },
    [photos, maxPhotos, toast, onPhotosChange, maxSizeMB]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);
  };

  const getPhotoPreview = (file: File): string => {
    return URL.createObjectURL(file);
  };

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={handleClick}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          'hover:border-primary hover:bg-accent/50',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
          photos.length >= maxPhotos && 'opacity-50 cursor-not-allowed'
        )}
        role="button"
        tabIndex={0}
        aria-label="Upload photos"
        data-testid="photo-upload-zone"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/jpg"
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
          disabled={photos.length >= maxPhotos}
          data-testid="file-input"
        />

        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-sm font-medium mb-1">
          {photos.length >= maxPhotos
            ? `Maximum ${maxPhotos} photos reached`
            : 'Click to upload or drag and drop'}
        </p>
        <p className="text-xs text-muted-foreground">
          JPG or PNG (max {maxSizeMB}MB each, up to {maxPhotos} photos)
        </p>
      </div>

      {/* Photo Previews */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {photos.map((photo, index) => (
            <div
              key={index}
              className="relative group aspect-square rounded-lg overflow-hidden border bg-muted"
              data-testid={`photo-preview-${index}`}
            >
              <img
                src={getPhotoPreview(photo)}
                alt={`Photo ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(index);
                  }}
                  className="gap-1"
                  data-testid={`btn-remove-${index}`}
                >
                  <X className="h-4 w-4" />
                  Remove
                </Button>
              </div>
              <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                {(photo.size / 1024 / 1024).toFixed(1)}MB
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Photo Count */}
      {photos.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          {photos.length} of {maxPhotos} photos selected
        </p>
      )}
    </div>
  );
}
