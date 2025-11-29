'use client';

/**
 * PDC Status Badge Component
 * Story 6.3: Post-Dated Cheque (PDC) Management
 * AC #33: Status badges with colors
 */

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PDCStatus, PDC_STATUS_LABELS } from '@/types/pdc';
import {
  Inbox,
  Clock,
  Building2,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Undo2,
} from 'lucide-react';

interface PDCStatusBadgeProps {
  status: PDCStatus;
  showIcon?: boolean;
  className?: string;
}

const statusConfig: Record<PDCStatus, {
  color: string;
  bgColor: string;
  icon: typeof Inbox;
}> = {
  [PDCStatus.RECEIVED]: {
    color: 'text-gray-700 dark:text-gray-300',
    bgColor: 'bg-gray-100 dark:bg-gray-700',
    icon: Inbox,
  },
  [PDCStatus.DUE]: {
    color: 'text-amber-700 dark:text-amber-300',
    bgColor: 'bg-amber-100 dark:bg-amber-900',
    icon: Clock,
  },
  [PDCStatus.DEPOSITED]: {
    color: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-100 dark:bg-blue-900',
    icon: Building2,
  },
  [PDCStatus.CLEARED]: {
    color: 'text-green-700 dark:text-green-300',
    bgColor: 'bg-green-100 dark:bg-green-900',
    icon: CheckCircle,
  },
  [PDCStatus.BOUNCED]: {
    color: 'text-red-700 dark:text-red-300',
    bgColor: 'bg-red-100 dark:bg-red-900',
    icon: AlertTriangle,
  },
  [PDCStatus.CANCELLED]: {
    color: 'text-gray-500 dark:text-gray-400 line-through',
    bgColor: 'bg-gray-100 dark:bg-gray-700',
    icon: XCircle,
  },
  [PDCStatus.REPLACED]: {
    color: 'text-purple-700 dark:text-purple-300',
    bgColor: 'bg-purple-100 dark:bg-purple-900',
    icon: RefreshCw,
  },
  [PDCStatus.WITHDRAWN]: {
    color: 'text-orange-700 dark:text-orange-300',
    bgColor: 'bg-orange-100 dark:bg-orange-900',
    icon: Undo2,
  },
};

export function PDCStatusBadge({ status, showIcon = true, className }: PDCStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  const label = PDC_STATUS_LABELS[status] || status;

  return (
    <Badge
      variant="outline"
      data-testid="badge-pdc-status"
      className={cn(
        'font-medium border-0',
        config.bgColor,
        config.color,
        className
      )}
    >
      {showIcon && <Icon className="mr-1.5 h-3.5 w-3.5" />}
      {label}
    </Badge>
  );
}

export default PDCStatusBadge;
