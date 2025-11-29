/**
 * Entity Type Badge Component
 * Story 7.2: Document Management System (AC #28)
 *
 * Displays document entity type with color coding:
 * - Blue "Property" badge
 * - Purple "Tenant" badge
 * - Orange "Vendor" badge
 * - Teal "Asset" badge
 * - Gray "General" badge
 */

import { Badge } from '@/components/ui/badge';
import {
  type DocumentEntityType,
  getEntityTypeLabel,
  getEntityTypeColor
} from '@/types/document';

interface EntityTypeBadgeProps {
  /** Entity type of the document */
  entityType: DocumentEntityType;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Entity type badge component with color coding
 */
export function EntityTypeBadge({
  entityType,
  className = ''
}: EntityTypeBadgeProps) {
  const label = getEntityTypeLabel(entityType);
  const colorClass = getEntityTypeColor(entityType);

  return (
    <Badge
      variant="secondary"
      className={`${colorClass} ${className}`}
      data-testid="badge-entity-type"
    >
      {label}
    </Badge>
  );
}

export default EntityTypeBadge;
