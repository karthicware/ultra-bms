'use client';

/**
 * Document Replace Modal Component
 * Story 5.2: Vendor Document and License Management
 *
 * AC #12: Replace document functionality
 * - Upload new version of existing document
 * - Update expiry date
 * - Previous version retained in S3
 */

import { useState, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Upload, FileText, Image, X, AlertCircle, RefreshCw } from 'lucide-react';

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
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

import {
  type VendorDocumentListItem,
  getDocumentTypeLabel,
  requiresExpiryDate,
  formatFileSize,
  ALLOWED_FILE_EXTENSIONS,
  MAX_FILE_SIZE_MB,
} from '@/types/vendor-documents';
import { validateFile } from '@/lib/validations/vendor-document';
import { useReplaceDocument } from '@/hooks/useVendorDocuments';

// Schema for replace form - simpler than upload since type is fixed
const replaceFormSchema = z.object({
  expiryDate: z.string().optional().nullable(),
  notes: z
    .string()
    .max(200, 'Notes must be less than 200 characters')
    .optional()
    .or(z.literal('')),
});

type ReplaceFormData = z.infer<typeof replaceFormSchema>;

interface DocumentReplaceModalProps {
  /** Vendor ID */
  vendorId: string;
  /** Document being replaced */
  document: VendorDocumentListItem;
  /** Whether the modal is open */
  open: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Callback when replace is successful */
  onSuccess?: () => void;
}

export function DocumentReplaceModal({
  vendorId,
  document,
  open,
  onClose,
  onSuccess,
}: DocumentReplaceModalProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Replace mutation
  const { mutate: replaceDocument, isPending, uploadProgress } = useReplaceDocument();

  // Form setup
  const form = useForm<ReplaceFormData>({
    resolver: zodResolver(replaceFormSchema),
    defaultValues: {
      expiryDate: document.expiryDate || undefined,
      notes: '',
    },
  });

  const needsExpiry = requiresExpiryDate(document.documentType);

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
  const handleSubmit = (data: ReplaceFormData) => {
    if (!selectedFile) {
      setFileError('Please select a file to upload');
      return;
    }

    // Validate expiry date for critical documents
    if (needsExpiry && !data.expiryDate) {
      form.setError('expiryDate', {
        type: 'manual',
        message: 'Expiry date is required for this document type',
      });
      return;
    }

    replaceDocument(
      {
        vendorId,
        documentId: document.id,
        data: {
          documentType: document.documentType, // Keep same type
          expiryDate: data.expiryDate || undefined,
          notes: data.notes || undefined,
        },
        file: selectedFile,
      },
      {
        onSuccess: () => {
          toast({
            title: 'Document replaced',
            description: 'The document has been replaced successfully.',
            variant: 'success',
          });
          handleClose();
          onSuccess?.();
        },
        onError: (error) => {
          toast({
            title: 'Replace failed',
            description: error.message || 'Failed to replace document. Please try again.',
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
          <DialogTitle>Replace Document</DialogTitle>
          <DialogDescription>
            Upload a new version of this document. The previous version will be retained.
          </DialogDescription>
        </DialogHeader>

        {/* Current document info */}
        <div className="rounded-lg border bg-muted/50 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary">
              {getDocumentTypeLabel(document.documentType)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Current file: <span className="font-medium">{document.fileName}</span>
          </p>
          {document.expiryDate && (
            <p className="text-sm text-muted-foreground">
              Current expiry: {new Date(document.expiryDate).toLocaleDateString()}
            </p>
          )}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* File Upload */}
            <div className="space-y-2">
              <FormLabel>New File *</FormLabel>
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
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ALLOWED_FILE_EXTENSIONS.join(',')}
                  onChange={handleInputChange}
                  className="hidden"
                  disabled={isPending}
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
                    New Expiry Date {needsExpiry && '*'}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      value={field.value || ''}
                      min={new Date().toISOString().split('T')[0]}
                      disabled={isPending}
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
                      placeholder="Optional notes about this replacement..."
                      className="resize-none"
                      rows={2}
                      {...field}
                      disabled={isPending}
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
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || !selectedFile}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Replacing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Replace Document
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
