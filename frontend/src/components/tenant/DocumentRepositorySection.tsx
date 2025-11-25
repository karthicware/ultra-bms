/**
 * Document Repository Section Component
 * Displays and manages tenant's uploaded documents
 */
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Upload } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useUploadDocument } from '@/hooks/useUploadDocument';
import type { TenantProfile } from '@/types/tenant-portal';

interface DocumentRepositorySectionProps {
  profile: TenantProfile;
}

export function DocumentRepositorySection({ profile }: DocumentRepositorySectionProps) {
  const { documents } = profile;
  const uploadMutation = useUploadDocument();
  const [uploading, setUploading] = useState(false);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setUploading(true);
        try {
          await uploadMutation.mutateAsync({ file: acceptedFiles[0] });
        } finally {
          setUploading(false);
        }
      }
    },
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card data-testid="card-document-repository">
      <CardHeader>
        <CardTitle>Document Repository</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Zone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
            ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
          data-testid="dropzone-upload"
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          {uploading ? (
            <p className="text-base font-medium">Uploading...</p>
          ) : isDragActive ? (
            <p className="text-base font-medium">Drop the file here...</p>
          ) : (
            <>
              <p className="text-base font-medium mb-2">
                Drag & drop a document here, or click to select
              </p>
              <p className="text-sm text-muted-foreground">
                Accepted: PDF, JPG, PNG (max 5MB)
              </p>
            </>
          )}
        </div>

        {/* Documents Table */}
        {documents.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">{doc.fileName}</TableCell>
                  <TableCell>{doc.documentType}</TableCell>
                  <TableCell>{formatFileSize(doc.fileSize)}</TableCell>
                  <TableCell>{formatDate(doc.uploadedAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      onClick={() => window.open(`/api/v1/tenant/documents/${doc.id}/download`, '_blank')}
                      data-testid={`btn-download-${doc.id}`}
                      variant="ghost"
                      size="sm"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            No documents uploaded yet. Upload your first document above.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
