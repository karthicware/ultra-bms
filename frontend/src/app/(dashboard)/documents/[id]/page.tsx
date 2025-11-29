'use client';

/**
 * Document Detail Page
 * Story 7.2: Document Management System
 * AC #20: Document detail page with metadata, preview, version history
 */

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  Download,
  Eye,
  Edit2,
  Trash2,
  FileText,
  Calendar,
  User,
  Tag,
  Clock,
  History,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Lock,
  Unlock,
  ShieldCheck,
  Upload,
  RefreshCw,
} from 'lucide-react';
import {
  useDocument,
  useDocumentVersions,
  useDeleteDocument,
  useDownloadDocument,
  usePreviewDocument,
} from '@/hooks/useDocuments';
import {
  ENTITY_TYPE_OPTIONS,
  ACCESS_LEVEL_OPTIONS,
  getEntityTypeColor,
  getAccessLevelColor,
  getExpiryStatusColor,
  getExpiryStatusLabel,
  formatFileSize,
  canPreviewFileType,
  DocumentEntityType,
  DocumentAccessLevel,
} from '@/types/document';

export default function DocumentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const documentId = params.id as string;

  // State
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Queries
  const { data: document, isLoading, error } = useDocument(documentId);
  const { data: versions, isLoading: isLoadingVersions } = useDocumentVersions(documentId);

  // Mutations
  const { mutate: deleteDocument, isPending: isDeleting } = useDeleteDocument();
  const { mutate: downloadDoc, isPending: isDownloading } = useDownloadDocument();
  const { mutate: previewDoc, isPending: isLoadingPreview } = usePreviewDocument();

  // Handlers
  const handleBack = () => {
    router.push('/documents');
  };

  const handleEdit = () => {
    router.push(`/documents/${documentId}/edit`);
  };

  const handleReplace = () => {
    router.push(`/documents/${documentId}/replace`);
  };

  const handleDelete = () => {
    deleteDocument(documentId, {
      onSuccess: () => {
        router.push('/documents');
      },
    });
  };

  const handleDownload = () => {
    downloadDoc(documentId);
  };

  const handlePreview = () => {
    if (document?.previewUrl) {
      setPreviewUrl(document.previewUrl);
      setShowPreview(true);
    } else {
      previewDoc(documentId, {
        onSuccess: (data) => {
          if (data.canPreview && data.previewUrl) {
            setPreviewUrl(data.previewUrl);
            setShowPreview(true);
          }
        },
      });
    }
  };

  const handleDownloadVersion = (versionId: string) => {
    // Download specific version - would need to implement in hook
    window.open(`/api/v1/documents/${documentId}/versions/${versionId}/download`, '_blank');
  };

  // Access level icon helper
  const getAccessLevelIcon = (accessLevel: DocumentAccessLevel) => {
    switch (accessLevel) {
      case DocumentAccessLevel.PUBLIC:
        return <Unlock className="h-4 w-4" />;
      case DocumentAccessLevel.RESTRICTED:
        return <Lock className="h-4 w-4" />;
      case DocumentAccessLevel.INTERNAL:
      default:
        return <ShieldCheck className="h-4 w-4" />;
    }
  };

  // Expiry status icon helper
  const getExpiryStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="h-4 w-4" />;
      case 'expiring_soon':
        return <AlertTriangle className="h-4 w-4" />;
      case 'expired':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Skeleton className="h-64 w-full" />
          </div>
          <div>
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <FileText className="h-12 w-12 mb-4" />
        <p className="text-lg font-medium">Document not found</p>
        <Button variant="outline" className="mt-4" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Documents
        </Button>
      </div>
    );
  }

  const canPreview = canPreviewFileType(document.fileType);

  return (
    <div className="space-y-6" data-testid="page-document-detail">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{document.title}</h1>
              <Badge variant="outline">{document.documentNumber}</Badge>
            </div>
            <p className="text-gray-500">{document.documentType}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownload} disabled={isDownloading}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          {canPreview && (
            <Button variant="outline" onClick={handlePreview} disabled={isLoadingPreview}>
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
          )}
          <Button variant="outline" onClick={handleReplace}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Replace
          </Button>
          <Button variant="outline" onClick={handleEdit}>
            <Edit2 className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Document</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this document? This action cannot be undone.
                  The file will be retained in storage for audit purposes.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Document Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Document Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {document.description && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="mt-1 text-gray-900">{document.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">File Name</label>
                  <p className="mt-1 text-gray-900">{document.fileName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">File Size</label>
                  <p className="mt-1 text-gray-900">{formatFileSize(document.fileSize)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">File Type</label>
                  <p className="mt-1 text-gray-900">{document.fileType}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Version</label>
                  <p className="mt-1 text-gray-900">v{document.version}</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Entity Type</label>
                  <div className="mt-1">
                    <Badge className={getEntityTypeColor(document.entityType)}>
                      {ENTITY_TYPE_OPTIONS.find(o => o.value === document.entityType)?.label}
                    </Badge>
                  </div>
                </div>
                {document.entityName && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Entity</label>
                    <p className="mt-1 text-gray-900">{document.entityName}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">Access Level</label>
                  <div className="mt-1">
                    <Badge className={`${getAccessLevelColor(document.accessLevel)} flex items-center gap-1 w-fit`}>
                      {getAccessLevelIcon(document.accessLevel)}
                      {ACCESS_LEVEL_OPTIONS.find(o => o.value === document.accessLevel)?.label}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Expiry Status</label>
                  <div className="mt-1">
                    {document.expiryDate ? (
                      <Badge className={`${getExpiryStatusColor(document.expiryStatus)} flex items-center gap-1 w-fit`}>
                        {getExpiryStatusIcon(document.expiryStatus)}
                        {getExpiryStatusLabel(document.expiryStatus, document.daysUntilExpiry)}
                      </Badge>
                    ) : (
                      <span className="text-gray-400">No expiry date</span>
                    )}
                  </div>
                </div>
              </div>

              {document.tags && document.tags.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <label className="text-sm font-medium text-gray-500">Tags</label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {document.tags.map((tag, index) => (
                        <Badge key={index} variant="outline">
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Version History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Version History
              </CardTitle>
              <CardDescription>
                All versions of this document are retained for audit purposes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingVersions ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : versions && versions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Version</TableHead>
                      <TableHead>File Name</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Uploaded By</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {versions.map((version) => (
                      <TableRow key={version.id}>
                        <TableCell className="font-medium">v{version.versionNumber}</TableCell>
                        <TableCell>{version.fileName}</TableCell>
                        <TableCell>{formatFileSize(version.fileSize)}</TableCell>
                        <TableCell>{version.uploaderName || 'Unknown'}</TableCell>
                        <TableCell>{format(new Date(version.uploadedAt), 'MMM dd, yyyy HH:mm')}</TableCell>
                        <TableCell className="max-w-[150px] truncate" title={version.notes}>
                          {version.notes || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadVersion(version.id)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <History className="h-8 w-8 mx-auto mb-2" />
                  <p>No previous versions</p>
                  <p className="text-sm">Replace the document to create a new version</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start" variant="outline" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download File
              </Button>
              {canPreview && (
                <Button className="w-full justify-start" variant="outline" onClick={handlePreview}>
                  <Eye className="mr-2 h-4 w-4" />
                  Preview in Browser
                </Button>
              )}
              <Button className="w-full justify-start" variant="outline" onClick={handleReplace}>
                <Upload className="mr-2 h-4 w-4" />
                Upload New Version
              </Button>
              <Button className="w-full justify-start" variant="outline" onClick={handleEdit}>
                <Edit2 className="mr-2 h-4 w-4" />
                Edit Metadata
              </Button>
            </CardContent>
          </Card>

          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Dates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Uploaded At</label>
                <p className="mt-1 text-gray-900">
                  {format(new Date(document.uploadedAt), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
              {document.updatedAt && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Updated</label>
                  <p className="mt-1 text-gray-900">
                    {format(new Date(document.updatedAt), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              )}
              {document.expiryDate && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Expiry Date</label>
                  <p className={`mt-1 ${document.expiryStatus === 'expired' ? 'text-red-600' : document.expiryStatus === 'expiring_soon' ? 'text-amber-600' : 'text-gray-900'}`}>
                    {format(new Date(document.expiryDate), 'MMM dd, yyyy')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Uploaded By */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Uploaded By
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-900">{document.uploaderName || 'Unknown'}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && previewUrl && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold">Document Preview</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open in New Tab
                  </a>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)}>
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="h-[70vh] overflow-auto">
              {document.fileType.startsWith('image/') ? (
                <img src={previewUrl} alt={document.title} className="max-w-full h-auto mx-auto" />
              ) : (
                <iframe
                  src={previewUrl}
                  className="w-full h-full"
                  title={document.title}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
