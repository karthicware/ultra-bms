/**
 * Document Replace Dialog Component
 * Story 7.2: Document Management System (AC #23)
 *
 * Dialog for replacing document file with a new version:
 * - Shows current file info (name, size, version)
 * - File upload dropzone for new version
 * - Notes textarea (optional)
 * - Creates new version on submit
 */

'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileText, Upload, X, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useReplaceDocument } from '@/hooks/useDocuments';
import {
  formatFileSize,
  ALLOWED_DOCUMENT_FILE_TYPES,
  ALLOWED_DOCUMENT_FILE_EXTENSIONS,
  MAX_DOCUMENT_FILE_SIZE,
  MAX_DOCUMENT_FILE_SIZE_MB,
  isValidDocumentFileType,
  isValidDocumentFileSize
} from '@/types/document';

interface DocumentReplaceDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback to close the dialog */
  onOpenChange: (open: boolean) => void;
  /** Document ID to replace */
  documentId: string;
  /** Current file name */
  currentFileName: string;
  /** Current file size */
  currentFileSize: number;
  /** Current version number */
  currentVersion: number;
  /** Callback on successful replacement */
  onSuccess?: () => void;
}

/**
 * Document replace dialog with dropzone and version notes
 */
export function DocumentReplaceDialog({
  open,
  onOpenChange,
  documentId,
  currentFileName,
  currentFileSize,
  currentVersion,
  onSuccess
}: DocumentReplaceDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [fileError, setFileError] = useState<string | null>(null);

  const { mutate: replaceDocument, isPending, uploadProgress } = useReplaceDocument();

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: unknown[]) => {
    setFileError(null);

    if (rejectedFiles.length > 0) {
      setFileError('Invalid file type. Please upload a PDF, image, Word, or Excel file.');
      return;
    }

    const droppedFile = acceptedFiles[0];
    if (!droppedFile) return;

    // Validate file type
    if (!isValidDocumentFileType(droppedFile)) {
      setFileError(`Invalid file type. Allowed types: ${ALLOWED_DOCUMENT_FILE_EXTENSIONS.join(', ')}`);
      return;
    }

    // Validate file size
    if (!isValidDocumentFileSize(droppedFile)) {
      setFileError(`File size exceeds ${MAX_DOCUMENT_FILE_SIZE_MB}MB limit.`);
      return;
    }

    setFile(droppedFile);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxFiles: 1,
    maxSize: MAX_DOCUMENT_FILE_SIZE
  });

  const handleSubmit = () => {
    if (!file) {
      setFileError('Please select a file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    if (notes.trim()) {
      formData.append('notes', notes.trim());
    }

    replaceDocument(
      { documentId, formData },
      {
        onSuccess: () => {
          handleClose();
          onSuccess?.();
        }
      }
    );
  };

  const handleClose = () => {
    if (!isPending) {
      setFile(null);
      setNotes('');
      setFileError(null);
      onOpenChange(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setFileError(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-document-replace">
        <DialogHeader>
          <DialogTitle>Replace Document</DialogTitle>
          <DialogDescription>
            Upload a new version of this document. The current version will be archived.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current file info */}
          <div className="rounded-lg border bg-muted/30 p-4">
            <h4 className="text-sm font-medium mb-2">Current Version (v{currentVersion})</h4>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span className="truncate flex-1">{currentFileName}</span>
              <span>{formatFileSize(currentFileSize)}</span>
            </div>
          </div>

          {/* File dropzone */}
          <div className="space-y-2">
            <Label>New File</Label>
            {!file ? (
              <div
                {...getRootProps()}
                className={`
                  border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
                  transition-colors
                  ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
                  ${fileError ? 'border-destructive' : ''}
                `}
              >
                <input {...getInputProps()} data-testid="file-input" />
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium">
                  {isDragActive ? 'Drop the file here' : 'Drag & drop a file, or click to select'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF, JPG, PNG, DOC, XLSX (max {MAX_DOCUMENT_FILE_SIZE_MB}MB)
                </p>
              </div>
            ) : (
              <div className="border rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={removeFile}
                    disabled={isPending}
                    data-testid="remove-file"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            {fileError && (
              <p className="text-sm text-destructive">{fileError}</p>
            )}
          </div>

          {/* Notes textarea */}
          <div className="space-y-2">
            <Label htmlFor="notes">Version Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Describe what changed in this version..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isPending}
              rows={3}
              data-testid="notes-input"
            />
          </div>

          {/* Upload progress */}
          {isPending && uploadProgress > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Uploading...</span>
                <span className="font-medium">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!file || isPending} data-testid="submit-replace">
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Replace Document
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DocumentReplaceDialog;
