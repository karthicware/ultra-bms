'use client';

/**
 * Property Image Upload Component
 * Multi-image upload with drag-drop, preview, and delete
 * AC: Task 27 - Property image management
 */

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';
import { Upload, X, Loader2, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { compressImage, formatFileSize } from '@/lib/utils/image-compression';
import { getValidImageSrc, isExternalImage } from '@/lib/utils/image-url';
import {
  uploadPropertyImage,
  deletePropertyImage,
} from '@/services/properties.service';
import type { PropertyImage } from '@/types/properties';

interface LocalImage {
  id: string;
  file: File;
  preview: string;
}

interface PropertyImageUploadProps {
  /** Property ID - required for edit mode, optional for create mode */
  propertyId?: string;
  /** Existing images (for edit mode) */
  existingImages?: PropertyImage[];
  /** Mode: 'create' stores locally, 'edit' uploads directly */
  mode: 'create' | 'edit';
  /** Callback when local images change (create mode) */
  onImagesChange?: (files: File[]) => void;
  /** Callback when images are uploaded/deleted (edit mode) */
  onImagesUpdate?: () => void;
  /** Maximum number of images allowed */
  maxImages?: number;
}

export function PropertyImageUpload({
  propertyId,
  existingImages = [],
  mode,
  onImagesChange,
  onImagesUpdate,
  maxImages = 5,
}: PropertyImageUploadProps) {
  const { toast } = useToast();
  const [localImages, setLocalImages] = useState<LocalImage[]>([]);
  const [uploadingIds, setUploadingIds] = useState<Set<string>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const totalImages = existingImages.length + localImages.length;
  const canAddMore = totalImages < maxImages;

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const remainingSlots = maxImages - totalImages;
      const filesToProcess = acceptedFiles.slice(0, remainingSlots);

      if (acceptedFiles.length > remainingSlots) {
        toast({
          title: 'Too many images',
          description: `Only ${remainingSlots} more image(s) can be added. Maximum is ${maxImages}.`,
          variant: 'destructive',
        });
      }

      // Process and compress each file
      const newImages: LocalImage[] = [];
      for (const file of filesToProcess) {
        try {
          const compressed = await compressImage(file, { maxSizeMB: 2 });
          const preview = URL.createObjectURL(compressed.file);
          newImages.push({
            id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            file: compressed.file,
            preview,
          });
        } catch {
          toast({
            title: 'Compression failed',
            description: `Failed to process ${file.name}`,
            variant: 'destructive',
          });
        }
      }

      if (mode === 'create') {
        const updatedImages = [...localImages, ...newImages];
        setLocalImages(updatedImages);
        onImagesChange?.(updatedImages.map((img) => img.file));
      } else if (mode === 'edit' && propertyId) {
        // Upload directly in edit mode
        for (const img of newImages) {
          setUploadingIds((prev) => new Set(prev).add(img.id));
          try {
            await uploadPropertyImage(
              propertyId,
              img.file,
              existingImages.length + newImages.indexOf(img)
            );
            toast({
              title: 'Image uploaded',
              description: 'Property image uploaded successfully.',
              variant: 'success',
            });
            onImagesUpdate?.();
          } catch {
            toast({
              title: 'Upload failed',
              description: `Failed to upload ${img.file.name}`,
              variant: 'destructive',
            });
          } finally {
            setUploadingIds((prev) => {
              const next = new Set(prev);
              next.delete(img.id);
              return next;
            });
            URL.revokeObjectURL(img.preview);
          }
        }
      }
    },
    [
      localImages,
      existingImages.length,
      maxImages,
      totalImages,
      mode,
      propertyId,
      onImagesChange,
      onImagesUpdate,
      toast,
    ]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: !canAddMore,
    multiple: true,
  });

  const handleRemoveLocal = (id: string) => {
    const img = localImages.find((i) => i.id === id);
    if (img) {
      URL.revokeObjectURL(img.preview);
    }
    const updated = localImages.filter((i) => i.id !== id);
    setLocalImages(updated);
    onImagesChange?.(updated.map((i) => i.file));
  };

  const handleDeleteExisting = async (imageId: string) => {
    if (!propertyId) return;

    setDeletingIds((prev) => new Set(prev).add(imageId));
    try {
      await deletePropertyImage(propertyId, imageId);
      toast({
        title: 'Image deleted',
        description: 'Property image deleted successfully.',
        variant: 'success',
      });
      onImagesUpdate?.();
    } catch {
      toast({
        title: 'Delete failed',
        description: 'Failed to delete image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(imageId);
        return next;
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Image Grid */}
      {(existingImages.length > 0 || localImages.length > 0) && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Existing Images */}
          {existingImages.map((img) => (
            <div
              key={img.id}
              className="relative aspect-square rounded-lg overflow-hidden border bg-muted group"
            >
              <Image
                src={getValidImageSrc(img.filePath)}
                alt={img.fileName || 'Property image'}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 20vw"
                unoptimized={isExternalImage(getValidImageSrc(img.filePath))}
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleDeleteExisting(img.id)}
                  disabled={deletingIds.has(img.id)}
                >
                  {deletingIds.has(img.id) ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 truncate">
                {formatFileSize(img.fileSize)}
              </div>
            </div>
          ))}

          {/* Local Images (create mode or pending upload) */}
          {localImages.map((img) => (
            <div
              key={img.id}
              className="relative aspect-square rounded-lg overflow-hidden border bg-muted group"
            >
              <Image
                src={img.preview}
                alt={img.file.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 20vw"
              />
              {uploadingIds.has(img.id) ? (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                </div>
              ) : (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleRemoveLocal(img.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 truncate">
                {formatFileSize(img.file.size)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dropzone */}
      {canAddMore && (
        <div
          {...getRootProps()}
          className={cn(
            'flex flex-col items-center justify-center gap-2 cursor-pointer border-2 border-dashed rounded-lg p-8 transition-colors',
            isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-border hover:bg-accent/50',
            !canAddMore && 'opacity-50 cursor-not-allowed'
          )}
        >
          <input {...getInputProps()} />
          <ImageIcon
            className={cn(
              'h-10 w-10',
              isDragActive ? 'text-primary' : 'text-muted-foreground'
            )}
          />
          <div className="text-center">
            <p className="text-sm font-medium">
              {isDragActive ? 'Drop images here' : 'Drag & drop or click to upload'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              JPG, PNG, or WebP (max 10MB each)
            </p>
            <p className="text-xs text-muted-foreground">
              {totalImages} of {maxImages} images
            </p>
          </div>
        </div>
      )}

      {!canAddMore && (
        <p className="text-sm text-muted-foreground text-center">
          Maximum of {maxImages} images reached
        </p>
      )}
    </div>
  );
}
