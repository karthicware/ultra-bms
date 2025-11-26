/**
 * Image Compression Utility
 * Story 4.4: Job Progress Tracking and Completion
 * AC #24: Photo compression before upload
 *
 * Uses browser-image-compression library to compress images client-side
 * before uploading to reduce bandwidth and storage costs.
 */

import imageCompression from 'browser-image-compression';

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  quality?: number;
}

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

export interface CompressionProgress {
  file: File;
  progress: number;
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  quality: 0.8,
};

/**
 * Compress a single image file
 * @param file - The image file to compress
 * @param options - Compression options (optional)
 * @param onProgress - Progress callback (optional)
 * @returns Promise with compressed file and stats
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {},
  onProgress?: (progress: number) => void
): Promise<CompressionResult> {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  const originalSize = file.size;

  // Skip compression for small files (under 500KB)
  if (originalSize < 500 * 1024) {
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 1,
    };
  }

  try {
    const compressedFile = await imageCompression(file, {
      maxSizeMB: mergedOptions.maxSizeMB,
      maxWidthOrHeight: mergedOptions.maxWidthOrHeight,
      useWebWorker: mergedOptions.useWebWorker,
      initialQuality: mergedOptions.quality,
      onProgress: onProgress,
    });

    // Preserve original filename
    const compressedWithName = new File([compressedFile], file.name, {
      type: compressedFile.type,
      lastModified: Date.now(),
    });

    return {
      file: compressedWithName,
      originalSize,
      compressedSize: compressedWithName.size,
      compressionRatio: originalSize / compressedWithName.size,
    };
  } catch (error) {
    console.error('Image compression failed:', error);
    // Return original file if compression fails
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 1,
    };
  }
}

/**
 * Compress multiple image files
 * @param files - Array of image files to compress
 * @param options - Compression options (optional)
 * @param onFileProgress - Progress callback for each file (optional)
 * @returns Promise with array of compressed files and total stats
 */
export async function compressImages(
  files: File[],
  options: CompressionOptions = {},
  onFileProgress?: (fileIndex: number, progress: number) => void
): Promise<{
  files: File[];
  totalOriginalSize: number;
  totalCompressedSize: number;
  averageCompressionRatio: number;
}> {
  const results: CompressionResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const result = await compressImage(
      files[i],
      options,
      onFileProgress ? (progress) => onFileProgress(i, progress) : undefined
    );
    results.push(result);
  }

  const totalOriginalSize = results.reduce((sum, r) => sum + r.originalSize, 0);
  const totalCompressedSize = results.reduce((sum, r) => sum + r.compressedSize, 0);
  const averageCompressionRatio = totalOriginalSize > 0
    ? totalOriginalSize / totalCompressedSize
    : 1;

  return {
    files: results.map((r) => r.file),
    totalOriginalSize,
    totalCompressedSize,
    averageCompressionRatio,
  };
}

/**
 * Format bytes to human-readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
