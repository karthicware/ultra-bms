'use client';

/**
 * Lease Extension History Component
 * Story 3.6: Tenant Lease Extension and Renewal (AC: #12)
 *
 * Displays a timeline of all lease extensions for a tenant
 * Can be embedded in tenant profile pages
 */

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  FileText,
  Calendar,
  DollarSign,
  ArrowRight,
  Download,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronDown,
  ChevronUp,
  History,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

import { getExtensionHistory, getAmendmentPdf } from '@/services/lease.service';
import type { LeaseExtension } from '@/types/lease';
import { LeaseExtensionStatus, RentAdjustmentType } from '@/types/lease';

interface LeaseExtensionHistoryProps {
  tenantId: string;
  showTitle?: boolean;
  maxItems?: number;
  compact?: boolean;
}

/**
 * Get status badge styling
 */
function getStatusBadge(status: LeaseExtensionStatus) {
  switch (status) {
    case LeaseExtensionStatus.APPLIED:
      return {
        className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        icon: CheckCircle2,
        label: 'Applied',
      };
    case LeaseExtensionStatus.APPROVED:
      return {
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        icon: CheckCircle2,
        label: 'Approved',
      };
    case LeaseExtensionStatus.PENDING_APPROVAL:
      return {
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        icon: Clock,
        label: 'Pending',
      };
    case LeaseExtensionStatus.REJECTED:
      return {
        className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        icon: XCircle,
        label: 'Rejected',
      };
    case LeaseExtensionStatus.DRAFT:
      return {
        className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
        icon: FileText,
        label: 'Draft',
      };
    default:
      return {
        className: '',
        icon: FileText,
        label: status,
      };
  }
}

/**
 * Get adjustment type label
 */
function getAdjustmentLabel(type: RentAdjustmentType): string {
  switch (type) {
    case RentAdjustmentType.NO_CHANGE:
      return 'No Change';
    case RentAdjustmentType.PERCENTAGE:
      return 'Percentage';
    case RentAdjustmentType.FLAT:
      return 'Flat Amount';
    case RentAdjustmentType.CUSTOM:
      return 'Custom';
    default:
      return type;
  }
}

/**
 * Calculate rent change percentage
 */
function getRentChangePercentage(previous: number, current: number): string {
  if (previous === 0) return '0';
  const change = ((current - previous) / previous) * 100;
  return change.toFixed(1);
}

/**
 * Extension Item Component
 */
function ExtensionItem({
  extension,
  tenantId,
  compact = false,
}: {
  extension: LeaseExtension;
  tenantId: string;
  compact?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const statusBadge = getStatusBadge(extension.status);
  const StatusIcon = statusBadge.icon;
  const rentChange = extension.newRent - extension.previousRent;
  const rentChangePercent = getRentChangePercentage(extension.previousRent, extension.newRent);

  const handleDownloadPdf = async () => {
    try {
      setIsDownloading(true);
      const pdfUrl = await getAmendmentPdf(tenantId, extension.id);
      window.open(pdfUrl, '_blank');
    } catch (error) {
      console.error('Failed to download PDF:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  if (compact) {
    return (
      <div className="flex items-center justify-between py-3 border-b last:border-0">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <div>
            <span className="font-mono text-sm">{extension.extensionNumber}</span>
            <div className="text-xs text-muted-foreground">
              {format(new Date(extension.extendedAt), 'dd MMM yyyy')}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-medium">
            AED {extension.newRent.toLocaleString()}
          </div>
          {rentChange !== 0 && (
            <div className={`text-xs ${rentChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {rentChange > 0 ? '+' : ''}{rentChangePercent}%
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="border rounded-lg">
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="font-medium">{extension.extensionNumber}</div>
                <div className="text-sm text-muted-foreground">
                  Extended on {format(new Date(extension.extendedAt), 'dd MMM yyyy')}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge className={statusBadge.className}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusBadge.label}
              </Badge>
              {isOpen ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 pt-0 space-y-4">
            <Separator />

            {/* Date Changes */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Previous End Date
                </span>
                <p className="font-medium">
                  {format(new Date(extension.previousEndDate), 'dd MMM yyyy')}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <ArrowRight className="h-3 w-3" />
                  New End Date
                </span>
                <p className="font-medium text-primary">
                  {format(new Date(extension.newEndDate), 'dd MMM yyyy')}
                </p>
              </div>
            </div>

            {/* Rent Changes */}
            <div className="bg-muted rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  Rent Adjustment
                </span>
                <Badge variant="outline">
                  {getAdjustmentLabel(extension.adjustmentType)}
                </Badge>
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Previous</span>
                  <p className="font-medium">AED {extension.previousRent.toLocaleString()}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="text-sm text-muted-foreground">New</span>
                  <p className="font-medium text-primary">
                    AED {extension.newRent.toLocaleString()}
                  </p>
                </div>
                {rentChange !== 0 && (
                  <div className={`text-sm ${rentChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ({rentChange > 0 ? '+' : ''}AED {Math.abs(rentChange).toLocaleString()},{' '}
                    {rentChange > 0 ? '+' : ''}{rentChangePercent}%)
                  </div>
                )}
              </div>
            </div>

            {/* Special Terms */}
            {extension.specialTerms && (
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Special Terms</span>
                <p className="text-sm bg-yellow-50 text-yellow-800 rounded-lg p-3 dark:bg-yellow-950 dark:text-yellow-300">
                  {extension.specialTerms}
                </p>
              </div>
            )}

            {/* Auto Renewal */}
            {extension.autoRenewal && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                Auto-Renewal Enabled
              </Badge>
            )}

            {/* Download PDF */}
            {extension.amendmentDocumentPath && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPdf}
                disabled={isDownloading}
              >
                <Download className="h-4 w-4 mr-2" />
                {isDownloading ? 'Downloading...' : 'Download Amendment PDF'}
              </Button>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

/**
 * Main Lease Extension History Component
 */
export function LeaseExtensionHistory({
  tenantId,
  showTitle = true,
  maxItems,
  compact = false,
}: LeaseExtensionHistoryProps) {
  const [extensions, setExtensions] = useState<LeaseExtension[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    async function loadHistory() {
      try {
        setIsLoading(true);
        const history = await getExtensionHistory(tenantId);
        setExtensions(history);
      } catch (error) {
        console.error('Failed to load extension history:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadHistory();
  }, [tenantId]);

  // Determine which extensions to display
  const displayedExtensions = maxItems && !showAll
    ? extensions.slice(0, maxItems)
    : extensions;
  const hasMore = maxItems && extensions.length > maxItems;

  if (isLoading) {
    return (
      <Card>
        {showTitle && (
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
        )}
        <CardContent className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (extensions.length === 0) {
    return (
      <Card>
        {showTitle && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Extension History
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center py-8">
            <History className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No lease extensions found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {showTitle && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Extension History
          </CardTitle>
          <CardDescription>
            {extensions.length} extension{extensions.length !== 1 ? 's' : ''} on record
          </CardDescription>
        </CardHeader>
      )}
      <CardContent className={compact ? 'pt-0' : ''}>
        <div className={compact ? '' : 'space-y-4'}>
          {displayedExtensions.map((extension) => (
            <ExtensionItem
              key={extension.id}
              extension={extension}
              tenantId={tenantId}
              compact={compact}
            />
          ))}
        </div>

        {hasMore && !showAll && (
          <Button
            variant="ghost"
            className="w-full mt-4"
            onClick={() => setShowAll(true)}
          >
            Show {extensions.length - (maxItems || 0)} more
            <ChevronDown className="h-4 w-4 ml-1" />
          </Button>
        )}

        {showAll && hasMore && (
          <Button
            variant="ghost"
            className="w-full mt-4"
            onClick={() => setShowAll(false)}
          >
            Show less
            <ChevronUp className="h-4 w-4 ml-1" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default LeaseExtensionHistory;
