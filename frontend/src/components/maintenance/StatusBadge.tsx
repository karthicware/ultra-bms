import { Badge } from '@/components/ui/badge';
import { MaintenanceStatus } from '@/types/maintenance';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: MaintenanceStatus;
  className?: string;
  showLabel?: boolean;
}

const STATUS_CONFIG: Record<MaintenanceStatus, { color: string; label: string }> = {
  [MaintenanceStatus.SUBMITTED]: {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-100',
    label: 'Waiting for Assignment',
  },
  [MaintenanceStatus.ASSIGNED]: {
    color: 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-100',
    label: 'Assigned to Vendor',
  },
  [MaintenanceStatus.IN_PROGRESS]: {
    color: 'bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-100',
    label: 'Work in Progress',
  },
  [MaintenanceStatus.COMPLETED]: {
    color: 'bg-green-100 text-green-800 border-green-300 hover:bg-green-100',
    label: 'Work Completed',
  },
  [MaintenanceStatus.CLOSED]: {
    color: 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-100',
    label: 'Closed',
  },
  [MaintenanceStatus.CANCELLED]: {
    color: 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-100',
    label: 'Cancelled',
  },
};

export function StatusBadge({ status, className, showLabel = true }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <Badge 
      variant="outline" 
      className={cn(config.color, 'whitespace-nowrap', className)}
      data-testid={`badge-status-${status.toLowerCase()}`}
    >
      {showLabel ? config.label : status}
    </Badge>
  );
}
