'use client';

/**
 * Vendor Document List Component
 * Story 5.2: Vendor Document and License Management
 *
 * AC #10-15: Document list functionality
 * - Display documents grouped by type
 * - Show document name, upload date, expiry date, status
 * - Color-coded expiry status badges (green/yellow/red)
 * - Download/view document actions
 * - Replace document functionality
 * - Delete document with confirmation
 */

import { useState } from 'react';
import { format } from 'date-fns';
import {
  FileText,
  Image,
  Download,
  Eye,
  Trash2,
  RefreshCw,
  Upload,
  Loader2,
  MoreHorizontal,
  AlertTriangle,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

import {
  type VendorDocumentListItem,
  DocumentType,
  ExpiryStatus,
  getDocumentTypeLabel,
  formatFileSize,
} from '@/types/vendor-documents';
import {
  useVendorDocuments,
  useDeleteDocument,
  useVendorDocumentStatus,
} from '@/hooks/useVendorDocuments';
import { downloadDocument } from '@/services/vendor-documents.service';
import { DocumentUploadModal } from './DocumentUploadModal';
import { DocumentReplaceModal } from './DocumentReplaceModal';

interface VendorDocumentListProps {
  /** Vendor ID to show documents for */
  vendorId: string;
  /** Whether the user can manage documents (upload/replace/delete) */
  canManage?: boolean;
}

export function VendorDocumentList({
  vendorId,
  canManage = true,
}: VendorDocumentListProps) {
  const { toast } = useToast();

  // Modals state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [replaceDocument, setReplaceDocument] = useState<VendorDocumentListItem | null>(null);
  const [deleteDocument, setDeleteDocument] = useState<VendorDocumentListItem | null>(null);

  // Query documents
  const { data: documents, isLoading, error } = useVendorDocuments(vendorId);
  const { hasExpiredCritical, hasMissingCritical } = useVendorDocumentStatus(vendorId, documents);

  // Delete mutation
  const { mutate: deleteDocumentMutation, isPending: isDeleting } = useDeleteDocument();

  // Handle download
  const handleDownload = async (document: VendorDocumentListItem, action: 'view' | 'download') => {
    try {
      await downloadDocument(vendorId, document.id, action);
    } catch (error) {
      toast({
        title: 'Download failed',
        description: 'Failed to download the document. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle delete
  const handleDelete = () => {
    if (!deleteDocument) return;

    deleteDocumentMutation(
      { vendorId, documentId: deleteDocument.id },
      {
        onSuccess: () => {
          toast({
            title: 'Document deleted',
            description: 'The document has been deleted successfully.',
          });
          setDeleteDocument(null);
        },
        onError: (error) => {
          toast({
            title: 'Delete failed',
            description: error.message || 'Failed to delete document. Please try again.',
            variant: 'destructive',
          });
        },
      }
    );
  };

  // Get expiry status badge
  const getExpiryBadge = (status: ExpiryStatus | undefined, daysUntilExpiry?: number) => {
    if (!status) return null;

    switch (status) {
      case ExpiryStatus.VALID:
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200" data-testid="badge-expiry-status">
            <CheckCircle className="h-3 w-3 mr-1" />
            Valid
          </Badge>
        );
      case ExpiryStatus.EXPIRING_SOON:
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200" data-testid="badge-expiry-status">
            <Clock className="h-3 w-3 mr-1" />
            {daysUntilExpiry !== undefined && daysUntilExpiry >= 0
              ? `Expires in ${daysUntilExpiry} days`
              : 'Expiring soon'}
          </Badge>
        );
      case ExpiryStatus.EXPIRED:
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200" data-testid="badge-expiry-status">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Expired
          </Badge>
        );
      default:
        return null;
    }
  };

  // Get file icon
  const getFileIcon = (fileType: string | undefined) => {
    if (fileType === 'application/pdf') {
      return <FileText className="h-4 w-4 text-red-500" />;
    }
    return <Image className="h-4 w-4 text-blue-500" />;
  };

  // Render loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Documents</CardTitle>
            <CardDescription>Loading vendor documents...</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Failed to load documents. Please try again.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card data-testid="section-vendor-documents">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Documents</CardTitle>
            <CardDescription>
              Manage vendor documents, licenses, and certificates
            </CardDescription>
          </div>
          {canManage && (
            <Button onClick={() => setUploadModalOpen(true)} data-testid="btn-upload-document">
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {/* Status alerts */}
          {(hasExpiredCritical || hasMissingCritical) && (
            <div className="mb-4 space-y-2">
              {hasExpiredCritical && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 border border-red-200" data-testid="expired-documents-alert">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm">
                    Critical documents have expired. Vendor may be suspended.
                  </span>
                </div>
              )}
              {hasMissingCritical && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-50 text-yellow-700 border border-yellow-200" data-testid="missing-documents-alert">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">
                    Some critical documents are missing (Trade License, Insurance).
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Documents table */}
          {documents && documents.length > 0 ? (
            <div className="rounded-md border">
              <Table data-testid="table-vendor-documents">
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Uploaded</TableHead>
                    {canManage && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc.id} data-testid={`document-row-${doc.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getFileIcon(doc.fileType)}
                          <span className="font-medium truncate max-w-[200px]" title={doc.fileName}>
                            {doc.fileName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {getDocumentTypeLabel(doc.documentType)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {doc.fileSize ? formatFileSize(doc.fileSize) : '-'}
                      </TableCell>
                      <TableCell>
                        {doc.expiryDate
                          ? format(new Date(doc.expiryDate), 'MMM dd, yyyy')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {getExpiryBadge(doc.expiryStatus, doc.daysUntilExpiry)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {doc.uploadedAt
                          ? format(new Date(doc.uploadedAt), 'MMM dd, yyyy')
                          : '-'}
                      </TableCell>
                      {canManage && (
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleDownload(doc, 'view')}
                                data-testid="btn-view-document"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDownload(doc, 'download')}
                                data-testid="btn-download-document"
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setReplaceDocument(doc)}
                                data-testid="btn-replace-document"
                              >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Replace
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setDeleteDocument(doc)}
                                className="text-destructive focus:text-destructive"
                                data-testid="btn-delete-document"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10 border rounded-lg border-dashed" data-testid="no-documents-empty-state">
              <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">No documents uploaded yet</p>
              {canManage && (
                <Button variant="outline" onClick={() => setUploadModalOpen(true)} data-testid="upload-first-document-btn">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload First Document
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Modal */}
      <DocumentUploadModal
        vendorId={vendorId}
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
      />

      {/* Replace Modal */}
      {replaceDocument && (
        <DocumentReplaceModal
          vendorId={vendorId}
          document={replaceDocument}
          open={!!replaceDocument}
          onClose={() => setReplaceDocument(null)}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteDocument} onOpenChange={() => setDeleteDocument(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteDocument?.fileName}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} data-testid="delete-dialog-cancel">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="delete-dialog-confirm"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
