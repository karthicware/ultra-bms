'use client';

/**
 * Document Upload Modal Component
 * Story 5.2: Vendor Document and License Management
 *
 * AC #2-7: Document upload functionality
 * - Document type selection (Trade License, Insurance, Certification, ID Copy)
 * - File upload with drag-and-drop support
 * - File validation (PDF, JPG, PNG up to 10MB)
 * - Expiry date field (required for Trade License and Insurance)
 * - Upload progress indicator
 * - Success/error toast notifications
 */

import { useState, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Upload, FileText, Image, X, AlertCircle, CheckCircle2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

import {
  DocumentType,
  getDocumentTypeLabel,
  requiresExpiryDate,
  formatFileSize,
  ALLOWED_FILE_EXTENSIONS,
  MAX_FILE_SIZE_MB,
} from '@/types/vendor-documents';
import {
  vendorDocumentUploadSchema,
  validateFile,
  type VendorDocumentUploadFormData,
} from '@/lib/validations/vendor-document';
import { useUploadDocument } from '@/hooks/useVendorDocuments';

// Document type options
const DOCUMENT_TYPE_OPTIONS = Object.values(DocumentType).map((type) => ({
  value: type,
  label: getDocumentTypeLabel(type),
}));

interface DocumentUploadModalProps {
  /** Vendor ID to upload document for */
  vendorId: string;
  /** Whether the modal is open */
  open: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Callback when upload is successful */
  onSuccess?: () => void;
}

export function DocumentUploadModal({
  vendorId,
  open,
  onClose,
  onSuccess,
}: DocumentUploadModalProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Upload mutation
  const { mutate: uploadDocument, isPending, uploadProgress } = useUploadDocument();

  // Form setup
  const form = useForm<VendorDocumentUploadFormData>({
    resolver: zodResolver(vendorDocumentUploadSchema),
    defaultValues: {
      documentType: DocumentType.TRADE_LICENSE,
      expiryDate: undefined,
      notes: '',
    },
  });

  const documentType = form.watch('documentType');
  const needsExpiry = requiresExpiryDate(documentType);

  // File selection handler
  const handleFileSelect = useCallback((file: File) => {
    const validation = validateFile(file);
    if (!validation.valid) {
      setFileError(validation.error || 'Invalid file');
      setSelectedFile(null);
      return;
    }
    setFileError(null);
    setSelectedFile(file);
  }, []);

  // Input change handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Remove file
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Form submit
  const handleSubmit = (data: VendorDocumentUploadFormData) => {
    if (!selectedFile) {
      setFileError('Please select a file to upload');
      return;
    }

    uploadDocument(
      {
        vendorId,
        data: {
          documentType: data.documentType,
          expiryDate: data.expiryDate || undefined,
          notes: data.notes || undefined,
        },
        file: selectedFile,
      },
      {
        onSuccess: () => {
          toast({
            title: 'Document uploaded',
            description: 'The document has been uploaded successfully.',
          });
          handleClose();
          onSuccess?.();
        },
        onError: (error) => {
          toast({
            title: 'Upload failed',
            description: error.message || 'Failed to upload document. Please try again.',
            variant: 'destructive',
          });
        },
      }
    );
  };

  // Close handler
  const handleClose = () => {
    if (!isPending) {
      form.reset();
      setSelectedFile(null);
      setFileError(null);
      onClose();
    }
  };

  // Get file icon
  const getFileIcon = (file: File) => {
    if (file.type === 'application/pdf') {
      return <FileText className="h-8 w-8 text-red-500" />;
    }
    return <Image className="h-8 w-8 text-blue-500" />;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Upload a document for this vendor. Supported formats: PDF, JPG, PNG (max {MAX_FILE_SIZE_MB}MB).
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Document Type */}
            <FormField
              control={form.control}
              name="documentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document Type *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isPending}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="document-type-select">
                        <SelectValue placeholder="Select document type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {DOCUMENT_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* File Upload */}
            <div className="space-y-2">
              <FormLabel>File *</FormLabel>
              <div
                className={cn(
                  'border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer',
                  isDragging && 'border-primary bg-primary/5',
                  fileError && 'border-destructive',
                  !selectedFile && !isDragging && !fileError && 'border-muted-foreground/25 hover:border-muted-foreground/50'
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                data-testid="file-upload-dropzone"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ALLOWED_FILE_EXTENSIONS.join(',')}
                  onChange={handleInputChange}
                  className="hidden"
                  disabled={isPending}
                  data-testid="file-upload-input"
                />

                {selectedFile ? (
                  <div className="flex items-center gap-3">
                    {getFileIcon(selectedFile)}
                    <div className="flex-1 text-left">
                      <p className="font-medium truncate">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile();
                      }}
                      disabled={isPending}
                      data-testid="remove-file-btn"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-10 w-10 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Drag and drop or click to select
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PDF, JPG, PNG up to {MAX_FILE_SIZE_MB}MB
                    </p>
                  </div>
                )}
              </div>
              {fileError && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {fileError}
                </p>
              )}
            </div>

            {/* Expiry Date */}
            <FormField
              control={form.control}
              name="expiryDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Expiry Date {needsExpiry && '*'}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      value={field.value || ''}
                      min={new Date().toISOString().split('T')[0]}
                      disabled={isPending}
                      data-testid="document-expiry-date"
                    />
                  </FormControl>
                  {needsExpiry && (
                    <FormDescription>
                      Required for Trade License and Insurance documents
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional notes about this document..."
                      className="resize-none"
                      rows={2}
                      {...field}
                      disabled={isPending}
                      data-testid="document-notes"
                    />
                  </FormControl>
                  <FormDescription>
                    Maximum 200 characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Upload Progress */}
            {isPending && uploadProgress > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            {/* Footer */}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isPending}
                data-testid="upload-modal-cancel"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || !selectedFile} data-testid="upload-modal-submit">
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Document
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
