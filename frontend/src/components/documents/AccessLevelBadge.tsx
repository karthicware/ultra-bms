/**
 * Access Level Badge Component
 * Story 7.2: Document Management System (AC #27)
 *
 * Displays document access level with color coding:
 * - Green "Public" badge (all authenticated users)
 * - Yellow "Internal" badge (staff only)
 * - Red "Restricted" badge (specific roles)
 */

import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import {
  type DocumentAccessLevel,
  getAccessLevelLabel,
  getAccessLevelDescription,
  getAccessLevelColor
} from '@/types/document';

interface AccessLevelBadgeProps {
  /** Access level of the document */
  accessLevel: DocumentAccessLevel;
  /** Show tooltip with description */
  showTooltip?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Access level badge component with tooltip showing description
 */
export function AccessLevelBadge({
  accessLevel,
  showTooltip = true,
  className = ''
}: AccessLevelBadgeProps) {
  const label = getAccessLevelLabel(accessLevel);
  const description = getAccessLevelDescription(accessLevel);
  const colorClass = getAccessLevelColor(accessLevel);

  const badge = (
    <Badge
      variant="secondary"
      className={`${colorClass} ${className}`}
      data-testid="badge-access-level"
    >
      {label}
    </Badge>
  );

  if (!showTooltip || !description) {
    return badge;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent>
          <p>{description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default AccessLevelBadge;
