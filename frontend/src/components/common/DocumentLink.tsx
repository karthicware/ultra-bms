'use client';

/**
 * Document Link Component
 * SCP-2025-12-06: Icon-based document link with file type detection
 *
 * Features:
 * - Automatic file type detection from URL/path
 * - Appropriate icons for PDF, Word, Images, and other files
 * - Color-coded icons for easy identification
 * - Download button with hover states
 * - Truncated filename display
 */

import { useMemo } from 'react';
import Link from 'next/link';
import {
  FileText,
  Image as ImageIcon,
  File,
  Download,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export type DocumentType = 'pdf' | 'word' | 'image' | 'other';

interface DocumentLinkProps {
  /** URL or path to the document */
  url: string;
  /** Display filename (optional - will be extracted from URL if not provided) */
  filename?: string;
  /** Label for the document (e.g., "Emirates ID Front") */
  label?: string;
  /** Whether to open in new tab (default: true) */
  openInNewTab?: boolean;
  /** Whether to show download button (default: true) */
  showDownload?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Detect document type from file extension
 */
function getDocumentType(url: string): DocumentType {
  const extension = url.split('.').pop()?.toLowerCase() || '';

  if (extension === 'pdf') {
    return 'pdf';
  }

  if (['doc', 'docx'].includes(extension)) {
    return 'word';
  }

  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(extension)) {
    return 'image';
  }

  return 'other';
}

/**
 * Get icon component and color based on document type
 */
function getDocumentIcon(type: DocumentType) {
  switch (type) {
    case 'pdf':
      return {
        Icon: FileText,
        color: 'text-red-500',
        bgColor: 'bg-red-50',
      };
    case 'word':
      return {
        Icon: FileText,
        color: 'text-blue-500',
        bgColor: 'bg-blue-50',
      };
    case 'image':
      return {
        Icon: ImageIcon,
        color: 'text-green-500',
        bgColor: 'bg-green-50',
      };
    default:
      return {
        Icon: File,
        color: 'text-muted-foreground',
        bgColor: 'bg-muted/50',
      };
  }
}

/**
 * Extract filename from URL or path
 */
function extractFilename(url: string): string {
  // Remove query params and get last path segment
  const path = url.split('?')[0];
  const segments = path.split('/');
  return segments[segments.length - 1] || 'Document';
}

/**
 * Truncate filename for display
 */
function truncateFilename(filename: string, maxLength: number = 30): string {
  if (filename.length <= maxLength) return filename;

  const extension = filename.split('.').pop() || '';
  const nameWithoutExt = filename.slice(0, filename.lastIndexOf('.'));
  const availableLength = maxLength - extension.length - 4; // 4 for "..." and "."

  if (availableLength <= 0) return filename.slice(0, maxLength) + '...';

  return `${nameWithoutExt.slice(0, availableLength)}...${extension ? `.${extension}` : ''}`;
}

export function DocumentLink({
  url,
  filename,
  label,
  openInNewTab = true,
  showDownload = true,
  className,
  size = 'md',
}: DocumentLinkProps) {
  const documentType = useMemo(() => getDocumentType(url), [url]);
  const { Icon, color, bgColor } = useMemo(
    () => getDocumentIcon(documentType),
    [documentType]
  );
  const displayFilename = filename || extractFilename(url);

  const sizeClasses = {
    sm: {
      container: 'p-2',
      icon: 'h-4 w-4',
      iconWrapper: 'h-8 w-8',
      text: 'text-xs',
      downloadIcon: 'h-3 w-3',
    },
    md: {
      container: 'p-3',
      icon: 'h-5 w-5',
      iconWrapper: 'h-10 w-10',
      text: 'text-sm',
      downloadIcon: 'h-4 w-4',
    },
    lg: {
      container: 'p-4',
      icon: 'h-6 w-6',
      iconWrapper: 'h-12 w-12',
      text: 'text-base',
      downloadIcon: 'h-5 w-5',
    },
  };

  const sizes = sizeClasses[size];

  return (
    <TooltipProvider>
      <div
        className={cn(
          'group flex items-center gap-3 rounded-xl border bg-card transition-all',
          'hover:bg-muted/50 hover:border-primary/20 hover:shadow-sm',
          sizes.container,
          className
        )}
      >
        {/* Icon */}
        <div
          className={cn(
            'flex-shrink-0 flex items-center justify-center rounded-lg transition-colors',
            bgColor,
            sizes.iconWrapper
          )}
        >
          <Icon className={cn(sizes.icon, color)} />
        </div>

        {/* Text Content */}
        <div className="flex-1 min-w-0">
          {label && (
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">
              {label}
            </p>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <p className={cn('font-medium truncate', sizes.text)}>
                {truncateFilename(displayFilename)}
              </p>
            </TooltipTrigger>
            <TooltipContent>
              <p>{displayFilename}</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {showDownload && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  asChild
                >
                  <a href={url} download={displayFilename}>
                    <Download className={sizes.downloadIcon} />
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Download</TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                asChild
              >
                <Link
                  href={url}
                  target={openInNewTab ? '_blank' : undefined}
                  rel={openInNewTab ? 'noopener noreferrer' : undefined}
                >
                  <ExternalLink className={sizes.downloadIcon} />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Open</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}

/**
 * Simple inline document link without card styling
 */
export function InlineDocumentLink({
  url,
  filename,
  className,
}: Pick<DocumentLinkProps, 'url' | 'filename' | 'className'>) {
  const documentType = useMemo(() => getDocumentType(url), [url]);
  const { Icon, color } = useMemo(
    () => getDocumentIcon(documentType),
    [documentType]
  );
  const displayFilename = filename || extractFilename(url);

  return (
    <Link
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex items-center gap-2 text-sm hover:underline',
        className
      )}
    >
      <Icon className={cn('h-4 w-4', color)} />
      <span className="truncate max-w-[200px]">{displayFilename}</span>
    </Link>
  );
}

export default DocumentLink;
