/**
 * Expiry Status Badge Component
 * Story 7.2: Document Management System (AC #26)
 *
 * Displays document expiry status with color coding:
 * - Green "Valid" badge (no expiry or expiry > 30 days)
 * - Yellow "Expiring Soon" badge (expiry within 30 days, shows days remaining)
 * - Red "Expired" badge (past expiry)
 * - Gray "No Expiry" badge (null expiry)
 */

import { Badge } from '@/components/ui/badge';
import {
  type DocumentExpiryStatus,
  getExpiryStatusLabel,
  getExpiryStatusColor
} from '@/types/document';

interface ExpiryStatusBadgeProps {
  /** Expiry status of the document */
  status: DocumentExpiryStatus;
  /** Days until expiry (optional, for more detailed display) */
  daysUntilExpiry?: number | null;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Expiry status badge component with color coding
 */
export function ExpiryStatusBadge({
  status,
  daysUntilExpiry,
  className = ''
}: ExpiryStatusBadgeProps) {
  const label = getExpiryStatusLabel(status, daysUntilExpiry);
  const colorClass = getExpiryStatusColor(status);

  return (
    <Badge
      variant="secondary"
      className={`${colorClass} ${className}`}
      data-testid="badge-expiry-status"
    >
      {label}
    </Badge>
  );
}

export default ExpiryStatusBadge;
