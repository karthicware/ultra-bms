'use client';

import * as React from 'react';
import { useCallback, useState } from 'react';
import { useDropzone, type Accept } from 'react-dropzone';
import { cn } from '@/lib/utils';
import {
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export type FileUploadStatus = 'idle' | 'uploading' | 'success' | 'error';

export interface FileUploadProgressProps {
  onFileSelect?: (file: File | null) => void;
  onFilesSelect?: (files: File[]) => void;
  selectedFile?: File | null;
  accept?: Accept;
  maxSize?: number;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  multiple?: boolean;
  testId?: string;
  className?: string;
  // Simulated upload progress (parent can control this)
  uploadProgress?: number;
  uploadStatus?: FileUploadStatus;
  errorMessage?: string;
  // SCP-2025-12-12: For edit mode - show existing file name when no new file selected
  existingFileName?: string;
}

const getFileIcon = (file: File) => {
  if (file.type.startsWith('image/')) {
    return ImageIcon;
  }
  return FileText;
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export function FileUploadProgress({
  onFileSelect,
  onFilesSelect,
  selectedFile,
  accept = { 'image/*': ['.png', '.jpg', '.jpeg'], 'application/pdf': ['.pdf'] },
  maxSize = 5 * 1024 * 1024, // 5MB default
  label = 'Upload File',
  required = false,
  disabled = false,
  multiple = false,
  testId,
  className,
  uploadProgress = 0,
  uploadStatus = 'idle',
  errorMessage,
  existingFileName,
}: FileUploadProgressProps) {
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [dragError, setDragError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      setDragError(null);

      if (rejectedFiles.length > 0) {
        const error = rejectedFiles[0]?.errors?.[0];
        if (error?.code === 'file-too-large') {
          setDragError(`File too large. Max size is ${formatFileSize(maxSize)}`);
        } else if (error?.code === 'file-invalid-type') {
          setDragError('Invalid file type');
        } else {
          setDragError('File rejected');
        }
        return;
      }

      if (acceptedFiles.length > 0) {
        // Handle multiple file selection
        if (multiple && onFilesSelect) {
          onFilesSelect(acceptedFiles);
          // Clear preview for multiple files mode
          setLocalPreview(null);
        } else if (onFileSelect) {
          // Single file mode (backward compatible)
          const file = acceptedFiles[0];
          onFileSelect(file);

          // Create preview for images
          if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = () => {
              setLocalPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
          } else {
            setLocalPreview(null);
          }
        }
      }
    },
    [onFileSelect, onFilesSelect, multiple, maxSize]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple,
    disabled,
  });

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileSelect?.(null);
    setLocalPreview(null);
    setDragError(null);
  };

  const FileIcon = selectedFile ? getFileIcon(selectedFile) : Upload;

  // Determine the visual state
  const isUploading = uploadStatus === 'uploading';
  const isSuccess = uploadStatus === 'success';
  const isError = uploadStatus === 'error' || !!dragError;

  // SCP-2025-12-12: For edit mode - determine if we have a file to show (either selected or existing)
  const hasFile = selectedFile || existingFileName;
  const displayFileName = selectedFile?.name || existingFileName || '';
  const displayFileSize = selectedFile ? formatFileSize(selectedFile.size) : 'Uploaded';

  return (
    <div className={cn('space-y-2', className)}>
      {/* Label */}
      {label && (
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium text-muted-foreground">
            {label}
          </span>
          {required && <span className="text-destructive">*</span>}
        </div>
      )}

      {/* Dropzone */}
      <div
        {...getRootProps()}
        data-testid={testId}
        className={cn(
          'relative group cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300',
          'hover:border-primary/50 hover:bg-primary/5',
          isDragActive && !isDragReject && 'border-primary bg-primary/10 scale-[1.02]',
          isDragReject && 'border-destructive bg-destructive/10',
          isSuccess && 'border-green-500/50 bg-green-500/5',
          isError && 'border-destructive/50 bg-destructive/5',
          disabled && 'opacity-50 cursor-not-allowed hover:border-border hover:bg-transparent',
          !hasFile && 'p-8',
          hasFile && 'p-4'
        )}
      >
        <input {...getInputProps()} />

        {!hasFile ? (
          // Empty state
          <div className="flex flex-col items-center justify-center text-center">
            <div
              className={cn(
                'flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-300',
                'bg-muted group-hover:bg-primary/10 group-hover:scale-110',
                isDragActive && 'bg-primary/20 scale-110'
              )}
            >
              <Upload
                className={cn(
                  'h-6 w-6 transition-colors duration-300',
                  'text-muted-foreground group-hover:text-primary',
                  isDragActive && 'text-primary'
                )}
              />
            </div>
            <p className="mt-4 text-sm font-medium">
              {isDragActive ? 'Drop file here' : 'Drag & drop or click to upload'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Max size: {formatFileSize(maxSize)}
            </p>
          </div>
        ) : (
          // File selected state
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              {/* Preview or Icon */}
              <div className="relative shrink-0">
                {localPreview ? (
                  <div className="h-14 w-14 overflow-hidden rounded-xl border bg-muted">
                    <img
                      src={localPreview}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted">
                    <FileIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}

                {/* Status overlay */}
                {isSuccess && (
                  <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white shadow-sm">
                    <CheckCircle2 className="h-3 w-3" />
                  </div>
                )}
                {isError && (
                  <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white shadow-sm">
                    <AlertCircle className="h-3 w-3" />
                  </div>
                )}
              </div>

              {/* File info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{displayFileName}</p>
                <p className="text-xs text-muted-foreground">
                  {displayFileSize}
                </p>
              </div>

              {/* Remove button */}
              {!isUploading && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 rounded-lg hover:bg-destructive/10 hover:text-destructive"
                  onClick={handleRemove}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}

              {/* Loading indicator */}
              {isUploading && (
                <div className="flex h-8 w-8 items-center justify-center shrink-0">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              )}
            </div>

            {/* Progress bar */}
            {isUploading && (
              <div className="space-y-1.5">
                <Progress value={uploadProgress} className="h-1.5" />
                <p className="text-xs text-muted-foreground text-right">
                  {uploadProgress}% uploaded
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error message */}
      {(dragError || errorMessage) && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {dragError || errorMessage}
        </p>
      )}
    </div>
  );
}
