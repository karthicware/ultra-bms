'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  Download, 
  FileText, 
  Trash2, 
  FileImage, 
  FileCode, 
  Calendar, 
  FileSpreadsheet, 
  File,
  Loader2
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { downloadDocument } from '@/services/leads.service';

import { cn } from '@/lib/utils';

type Document = {
  id: string;
  documentType: string;
  fileName: string;
  fileSize: number;
  uploadedAt?: string;
};

type Props = {
  leadId: string;
  documents: Document[];
  onDownload: (docId: string, fileName: string) => void;
  onDelete?: (docId: string) => void;
  className?: string;
};

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  if (bytes < k) return bytes + ' B';
  if (bytes < k * k) return (bytes / k).toFixed(0) + ' KB';
  return (bytes / (k * k)).toFixed(1) + ' MB';
};

const formatDocumentType = (type: string): string => {
  return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
};

const getFileExtension = (fileName: string) => fileName.split('.').pop()?.toLowerCase() || '';

const isImageFile = (fileName: string) => {
  const ext = getFileExtension(fileName);
  return ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext);
};

const getFileIcon = (fileName: string) => {
  const ext = getFileExtension(fileName);
  
  if (['pdf'].includes(ext)) {
    return <FileText className="h-10 w-10 text-red-500" />;
  }
  if (['doc', 'docx'].includes(ext)) {
    return <FileText className="h-10 w-10 text-blue-500" />;
  }
  if (['xls', 'xlsx', 'csv'].includes(ext)) {
    return <FileSpreadsheet className="h-10 w-10 text-green-600" />;
  }
  if (['zip', 'rar', '7z'].includes(ext)) {
    return <FileCode className="h-10 w-10 text-yellow-600" />;
  }
  return <File className="h-10 w-10 text-gray-400" />;
};

const DocumentCard = ({ 
  doc, 
  index, 
  leadId, 
  onDownload, 
  onDelete 
}: { 
  doc: Document; 
  index: number; 
  leadId: string;
  onDownload: (docId: string, fileName: string) => void;
  onDelete?: (docId: string) => void;
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const isImage = isImageFile(doc.fileName);
  const fileExtension = getFileExtension(doc.fileName);
  const displayFileName = `Document ${index + 1}${fileExtension ? '.' + fileExtension : ''}`;

  useEffect(() => {
    let isMounted = true;
    
    const fetchImage = async () => {
      if (isImage && !imageUrl) {
        setIsLoadingImage(true);
        try {
          const url = await downloadDocument(leadId, doc.id);
          if (isMounted) setImageUrl(url);
        } catch (error) {
          console.error('Failed to load image thumbnail', error);
        } finally {
          if (isMounted) setIsLoadingImage(false);
        }
      }
    };

    fetchImage();

    return () => {
      isMounted = false;
    };
  }, [doc.id, doc.fileName, leadId, isImage, imageUrl]);

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-md border-muted bg-card h-full flex flex-col">
      {/* Preview Area */}
      <div className="relative h-32 w-full bg-muted/20 flex items-center justify-center overflow-hidden border-b border-border/50">
        {isImage ? (
          isLoadingImage ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              src={imageUrl} 
              alt={doc.fileName} 
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" 
            />
          ) : (
            <FileImage className="h-10 w-10 text-blue-500 opacity-50" />
          )
        ) : (
          <div className="transform transition-transform duration-300 group-hover:scale-110">
            {getFileIcon(doc.fileName)}
          </div>
        )}

        {/* Action Overlay */}
        <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="h-7 w-7 rounded-full bg-white/90 hover:bg-white shadow-sm border border-black/5"
                onClick={() => onDownload(doc.id, doc.fileName)}
              >
                <Download className="h-3.5 w-3.5 text-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Download</TooltipContent>
          </Tooltip>
          
          {onDelete && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-7 w-7 rounded-full shadow-sm opacity-90 hover:opacity-100"
                  onClick={() => onDelete(doc.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Details Area */}
      <CardContent className="p-3 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-semibold text-xs truncate flex-1" title={doc.fileName}>
            {displayFileName}
          </h4>
          <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal bg-muted/50 text-muted-foreground border-transparent shrink-0">
            {formatDocumentType(doc.documentType)}
          </Badge>
        </div>
        
        <div className="mt-auto flex items-center justify-between text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3 w-3" />
            <span>
              {doc.uploadedAt 
                ? format(new Date(doc.uploadedAt), 'MMM d, yyyy') 
                : 'Unknown'}
            </span>
          </div>
          <span className="font-mono bg-muted/30 px-1 rounded">
            {formatBytes(doc.fileSize)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

const DocumentList = ({ documents, onDownload, onDelete, className, leadId }: Props) => {
  if (!documents || documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-xl bg-muted/20">
        <div className="bg-muted p-4 rounded-full mb-3">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium">No documents uploaded</h3>
        <p className="text-muted-foreground text-sm mt-1">
          No documents available for this lead.
        </p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className={cn('grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4', className)}>
        {documents.map((doc, index) => (
          <DocumentCard
            key={doc.id}
            doc={doc}
            index={index}
            leadId={leadId}
            onDownload={onDownload}
            onDelete={onDelete}
          />
        ))}
      </div>
    </TooltipProvider>
  );
};

export default DocumentList;
