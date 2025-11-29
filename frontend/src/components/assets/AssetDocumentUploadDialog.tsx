'use client';

/**
 * Asset Document Upload Dialog Component
 * Story 7.1: Asset Registry and Tracking
 * AC #23: Document upload dialog with type select, drag-drop, progress indicator
 */

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileText, Upload, X, Loader2 } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { AssetDocumentType } from '@/types/asset';
import { useUploadAssetDocument } from '@/hooks/useAssets';

/**
 * Allowed file types for asset documents
 */
const ALLOWED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
};

const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILE_SIZE_MB = 10;

/**
 * Document type display names
 */
const DOCUMENT_TYPE_CONFIG: Record<AssetDocumentType, { label: string; description: string }> = {
  [AssetDocumentType.MANUAL]: {
    label: 'Manual',
    description: 'User manual or operation guide',
  },
  [AssetDocumentType.WARRANTY]: {
    label: 'Warranty',
    description: 'Warranty certificate or documentation',
  },
  [AssetDocumentType.PURCHASE_INVOICE]: {
    label: 'Purchase Invoice',
    description: 'Original purchase invoice',
  },
  [AssetDocumentType.SPECIFICATION]: {
    label: 'Specification',
    description: 'Technical specifications',
  },
  [AssetDocumentType.OTHER]: {
    label: 'Other',
    description: 'Other related documents',
  },
};

interface AssetDocumentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetId: string;
  assetName: string;
  onSuccess?: () => void;
}

export function AssetDocumentUploadDialog({
  open,
  onOpenChange,
  assetId,
  assetName,
  onSuccess,
}: AssetDocumentUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<AssetDocumentType | ''>('');
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { mutate: uploadDocument, isPending } = useUploadAssetDocument();

  const isValidFileType = (file: File): boolean => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    return ALLOWED_EXTENSIONS.includes(extension);
  };

  const isValidFileSize = (file: File): boolean => {
    return file.size <= MAX_FILE_SIZE;
  };

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: unknown[]) => {
    setFileError(null);

    if (rejectedFiles && Array.isArray(rejectedFiles) && rejectedFiles.length > 0) {
      setFileError('Invalid file type. Please upload a PDF, JPG, or PNG file.');
      return;
    }

    const droppedFile = acceptedFiles[0];
    if (!droppedFile) return;

    // Validate file type
    if (!isValidFileType(droppedFile)) {
      setFileError(`Invalid file type. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`);
      return;
    }

    // Validate file size
    if (!isValidFileSize(droppedFile)) {
      setFileError(`File size exceeds ${MAX_FILE_SIZE_MB}MB limit.`);
      return;
    }

    setFile(droppedFile);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ALLOWED_FILE_TYPES,
    maxFiles: 1,
    disabled: isPending,
  });

  const handleUpload = () => {
    if (!file || !documentType) return;

    // Simulate progress for UX
    setUploadProgress(0);
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 100);

    uploadDocument(
      {
        assetId,
        file,
        documentType,
      },
      {
        onSuccess: () => {
          clearInterval(progressInterval);
          setUploadProgress(100);
          setTimeout(() => {
            resetForm();
            onOpenChange(false);
            onSuccess?.();
          }, 500);
        },
        onError: () => {
          clearInterval(progressInterval);
          setUploadProgress(0);
        },
      }
    );
  };

  const resetForm = () => {
    setFile(null);
    setDocumentType('');
    setFileError(null);
    setUploadProgress(0);
  };

  const handleClose = () => {
    if (!isPending) {
      resetForm();
      onOpenChange(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setFileError(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-md"
        aria-describedby="document-upload-description"
        data-testid="dialog-document-upload"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Upload Document
          </DialogTitle>
          <DialogDescription id="document-upload-description">
            Upload a document for asset <strong>{assetName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Document Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="document-type">Document Type</Label>
            <Select
              value={documentType}
              onValueChange={(value) => setDocumentType(value as AssetDocumentType)}
              disabled={isPending}
            >
              <SelectTrigger id="document-type" data-testid="select-document-type">
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DOCUMENT_TYPE_CONFIG).map(([type, config]) => (
                  <SelectItem key={type} value={type} data-testid={`doc-type-${type.toLowerCase()}`}>
                    <div className="flex flex-col">
                      <span>{config.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* File Dropzone */}
          <div className="space-y-2">
            <Label>File</Label>
            {!file ? (
              <div
                {...getRootProps()}
                className={`
                  border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
                  transition-colors duration-200
                  ${isDragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-300 hover:border-primary/50'
                  }
                  ${isPending ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                data-testid="dropzone-file"
              >
                <input {...getInputProps()} data-testid="input-file" />
                <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">
                  {isDragActive
                    ? 'Drop the file here...'
                    : 'Drag and drop a file, or click to select'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  PDF, JPG, PNG (max {MAX_FILE_SIZE_MB}MB)
                </p>
              </div>
            ) : (
              <div className="border rounded-lg p-4 flex items-center justify-between" data-testid="selected-file">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm font-medium truncate max-w-[200px]">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={removeFile}
                  disabled={isPending}
                  data-testid="btn-remove-file"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* File Error */}
            {fileError && (
              <p className="text-sm text-red-500" data-testid="file-error">
                {fileError}
              </p>
            )}
          </div>

          {/* Upload Progress */}
          {isPending && (
            <div className="space-y-2" data-testid="upload-progress">
              <div className="flex items-center justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isPending}
            data-testid="btn-cancel-upload"
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!file || !documentType || isPending}
            data-testid="btn-confirm-upload"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              'Upload'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
