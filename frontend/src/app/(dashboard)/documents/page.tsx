'use client';

/**
 * Document List Page
 * Story 7.2: Document Management System
 * AC #19: Document list page with table, filters, and status badges
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useDocuments, useDownloadDocument } from '@/hooks/useDocuments';
import { DocumentListItem } from '@/types/document';
import { Plus, FileText } from 'lucide-react';
import DocumentsDatatable from '@/components/documents/DocumentsDatatable';

export default function DocumentsPage() {
  const router = useRouter();
  const { toast } = useToast();

  // State
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all documents for client-side filtering
  const { data, isLoading: queryLoading, error } = useDocuments({
    page: 0,
    size: 1000, // Fetch all for client-side filtering
  });

  const { mutate: downloadDocument } = useDownloadDocument();

  useEffect(() => {
    if (data?.content) {
      setDocuments(data.content);
    }
    setIsLoading(queryLoading);
  }, [data, queryLoading]);

  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load documents',
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  // Handlers
  const handleUploadDocument = () => {
    router.push('/documents/upload');
  };

  const handleDownload = (id: string) => {
    downloadDocument(id);
  };

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="page-documents">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="page-documents">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
            <p className="text-gray-500">Manage and organize all documents</p>
          </div>
        </div>
        <Button onClick={handleUploadDocument} className="w-full md:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </div>

      {/* Datatable */}
      <Card>
        <DocumentsDatatable data={documents} onDownload={handleDownload} />
      </Card>
    </div>
  );
}
