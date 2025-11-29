/**
 * Version History Component
 * Story 7.2: Document Management System (AC #25)
 *
 * Displays document version history list with download links
 * Each row shows: version number, file name, file size, uploaded by, upload date, notes, download button
 * Current version is highlighted
 */

'use client';

import { format } from 'date-fns';
import { Download, FileText, Clock } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { DocumentVersion } from '@/types/document';
import { formatFileSize } from '@/types/document';

interface VersionHistoryProps {
  /** Document versions array */
  versions: DocumentVersion[];
  /** Current version number */
  currentVersion: number;
  /** Loading state */
  isLoading?: boolean;
  /** Callback when download is clicked */
  onDownload?: (version: DocumentVersion) => void;
}

/**
 * Version history component showing document versions
 */
export function VersionHistory({
  versions,
  currentVersion,
  isLoading = false,
  onDownload
}: VersionHistoryProps) {
  const handleDownload = (version: DocumentVersion) => {
    if (version.downloadUrl) {
      // Trigger download
      const link = document.createElement('a');
      link.href = version.downloadUrl;
      link.download = version.fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (onDownload) {
      onDownload(version);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2" data-testid="component-version-history">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (!versions || versions.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-8 text-muted-foreground"
        data-testid="component-version-history"
      >
        <FileText className="h-8 w-8 mb-2" />
        <p>No version history available</p>
      </div>
    );
  }

  // Sort versions by version number descending (newest first)
  const sortedVersions = [...versions].sort((a, b) => b.versionNumber - a.versionNumber);

  return (
    <div className="rounded-md border" data-testid="component-version-history">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-20">Version</TableHead>
            <TableHead>File Name</TableHead>
            <TableHead className="w-24">Size</TableHead>
            <TableHead className="w-36">Uploaded By</TableHead>
            <TableHead className="w-40">Uploaded At</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead className="w-20">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedVersions.map((version) => {
            const isCurrent = version.versionNumber === currentVersion;
            return (
              <TableRow
                key={version.id}
                className={isCurrent ? 'bg-muted/50' : undefined}
                data-testid={`version-row-${version.versionNumber}`}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-mono">v{version.versionNumber}</span>
                    {isCurrent && (
                      <Badge variant="secondary" className="text-xs">
                        Current
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate max-w-[200px]" title={version.fileName}>
                      {version.fileName}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatFileSize(version.fileSize)}
                </TableCell>
                <TableCell>
                  <span className="truncate max-w-[120px]" title={version.uploaderName}>
                    {version.uploaderName || 'Unknown'}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span className="text-sm">
                      {format(new Date(version.uploadedAt), 'MMM d, yyyy HH:mm')}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {version.notes ? (
                    <span className="text-sm text-muted-foreground truncate max-w-[150px]" title={version.notes}>
                      {version.notes}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground/50">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(version)}
                    disabled={!version.downloadUrl && !onDownload}
                    data-testid={`download-version-${version.versionNumber}`}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export default VersionHistory;
