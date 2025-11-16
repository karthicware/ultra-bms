'use client';

/**
 * File Upload Zone Component
 * Drag-and-drop file upload with validation using react-dropzone
 */

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatFileSize } from '@/lib/validations/tenant';
import { cn } from '@/lib/utils';

interface FileUploadZoneProps {
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
  accept?: Record<string, string[]>;
  maxSize?: number; // in bytes
  label: string;
  description?: string;
  required?: boolean;
  testId?: string;
}

export function FileUploadZone({
  onFileSelect,
  selectedFile,
  accept = {
    'application/pdf': ['.pdf'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
  },
  maxSize = 5 * 1024 * 1024, // 5MB default
  label,
  description,
  required = false,
  testId,
}: FileUploadZoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: false,
  });

  const handleRemove = () => {
    onFileSelect(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        <span className="text-sm font-medium">{label}</span>
        {required && <span className="text-destructive">*</span>}
      </div>

      {selectedFile ? (
        <div className="flex items-center justify-between p-4 border rounded-md bg-accent/50">
          <div className="flex items-center gap-3">
            <FileIcon className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            data-testid={`${testId}-remove`}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            'flex flex-col items-center justify-center gap-2 cursor-pointer border-2 border-dashed rounded-md p-8 transition-colors',
            isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent/50'
          )}
          data-testid={testId}
        >
          <input {...getInputProps()} />
          <Upload className={cn('h-8 w-8', isDragActive ? 'text-primary' : 'text-muted-foreground')} />
          <div className="text-center">
            <p className="text-sm font-medium">
              {isDragActive ? 'Drop file here' : 'Drag & drop or click to upload'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {description || `PDF, JPG, or PNG (max ${formatFileSize(maxSize)})`}
            </p>
          </div>
        </div>
      )}

      {fileRejections.length > 0 && (
        <p className="text-xs text-destructive mt-1">
          {fileRejections[0].errors[0].message}
        </p>
      )}
    </div>
  );
}
