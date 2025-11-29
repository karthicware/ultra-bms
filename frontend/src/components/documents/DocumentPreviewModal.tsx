/**
 * Document Preview Modal Component
 * Story 7.2: Document Management System (AC #24)
 *
 * Modal for in-browser document preview:
 * - PDFs: embedded PDF viewer (iframe with presigned URL)
 * - Images: display with zoom controls
 * - DOC/XLSX: "Preview not available" message with download button
 */

'use client';

import { useState } from 'react';
import { X, Download, ZoomIn, ZoomOut, RotateCw, FileText, FileX } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { isImageFileType, isPdfFileType, canPreviewFileType } from '@/types/document';

interface DocumentPreviewModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback to close the modal */
  onOpenChange: (open: boolean) => void;
  /** File name for display */
  fileName: string;
  /** MIME type of the file */
  fileType: string;
  /** Presigned URL for preview */
  previewUrl?: string;
  /** Whether the file can be previewed */
  canPreview?: boolean;
  /** Loading state */
  isLoading?: boolean;
  /** Callback when download is clicked */
  onDownload?: () => void;
}

/**
 * Document preview modal with PDF/image viewer
 */
export function DocumentPreviewModal({
  open,
  onOpenChange,
  fileName,
  fileType,
  previewUrl,
  canPreview = true,
  isLoading = false,
  onDownload
}: DocumentPreviewModalProps) {
  const [imageZoom, setImageZoom] = useState(100);
  const [imageRotation, setImageRotation] = useState(0);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const isPdf = isPdfFileType(fileType);
  const isImage = isImageFileType(fileType);
  const canShowPreview = canPreview && previewUrl && canPreviewFileType(fileType);

  const handleZoomIn = () => setImageZoom((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setImageZoom((prev) => Math.max(prev - 25, 25));
  const handleRotate = () => setImageRotation((prev) => (prev + 90) % 360);

  const handleClose = () => {
    // Reset state on close
    setImageZoom(100);
    setImageRotation(0);
    setIframeLoaded(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        data-testid="modal-document-preview"
      >
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 truncate pr-4">
              <FileText className="h-5 w-5" />
              <span className="truncate">{fileName}</span>
            </DialogTitle>
            <div className="flex items-center gap-2">
              {isImage && canShowPreview && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleZoomOut}
                    disabled={imageZoom <= 25}
                    title="Zoom out"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground w-12 text-center">
                    {imageZoom}%
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleZoomIn}
                    disabled={imageZoom >= 200}
                    title="Zoom in"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleRotate}
                    title="Rotate"
                  >
                    <RotateCw className="h-4 w-4" />
                  </Button>
                </>
              )}
              {onDownload && (
                <Button variant="outline" size="sm" onClick={onDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="ml-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-full min-h-[400px]">
              <Skeleton className="w-full h-full" />
            </div>
          ) : !canShowPreview ? (
            <PreviewNotAvailable
              fileName={fileName}
              fileType={fileType}
              onDownload={onDownload}
            />
          ) : isPdf ? (
            <PdfPreview
              previewUrl={previewUrl}
              onLoad={() => setIframeLoaded(true)}
              isLoaded={iframeLoaded}
            />
          ) : isImage ? (
            <ImagePreview
              previewUrl={previewUrl}
              fileName={fileName}
              zoom={imageZoom}
              rotation={imageRotation}
            />
          ) : (
            <PreviewNotAvailable
              fileName={fileName}
              fileType={fileType}
              onDownload={onDownload}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * PDF preview using iframe
 */
function PdfPreview({
  previewUrl,
  onLoad,
  isLoaded
}: {
  previewUrl: string;
  onLoad: () => void;
  isLoaded: boolean;
}) {
  return (
    <div className="relative w-full h-[600px]">
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <Skeleton className="w-full h-full" />
        </div>
      )}
      <iframe
        src={previewUrl}
        title="PDF Preview"
        className="w-full h-full border-0"
        onLoad={onLoad}
        data-testid="pdf-viewer"
      />
    </div>
  );
}

/**
 * Image preview with zoom and rotation
 */
function ImagePreview({
  previewUrl,
  fileName,
  zoom,
  rotation
}: {
  previewUrl: string;
  fileName: string;
  zoom: number;
  rotation: number;
}) {
  return (
    <div className="flex items-center justify-center p-4 bg-muted/30 min-h-[400px] overflow-auto">
      <img
        src={previewUrl}
        alt={fileName}
        className="max-w-full transition-transform duration-200"
        style={{
          transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
          transformOrigin: 'center center'
        }}
        data-testid="image-viewer"
      />
    </div>
  );
}

/**
 * Preview not available fallback
 */
function PreviewNotAvailable({
  fileName,
  fileType,
  onDownload
}: {
  fileName: string;
  fileType: string;
  onDownload?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <FileX className="h-16 w-16 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">Preview not available</h3>
      <p className="text-muted-foreground mb-4 max-w-md">
        This file type ({fileType}) cannot be previewed in the browser.
        Please download the file to view it.
      </p>
      <p className="text-sm text-muted-foreground mb-6">{fileName}</p>
      {onDownload && (
        <Button onClick={onDownload} data-testid="download-button">
          <Download className="h-4 w-4 mr-2" />
          Download File
        </Button>
      )}
    </div>
  );
}

export default DocumentPreviewModal;
