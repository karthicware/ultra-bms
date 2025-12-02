/**
 * Quick Actions Grid Component
 * Displays action buttons for common tenant tasks
 * Upgraded to use lucide-react icons for consistency
 */
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Wrench, CreditCard, Calendar, FileText, Pin } from 'lucide-react';
import type { QuickAction } from '@/types/tenant-portal';
import type { ReactNode } from 'react';

interface QuickActionsGridProps {
  actions: QuickAction[];
}

export function QuickActionsGrid({ actions }: QuickActionsGridProps) {
  const getIconElement = (icon: string): ReactNode => {
    const icons: Record<string, ReactNode> = {
      'tools': <Wrench className="h-6 w-6" />,
      'credit-card': <CreditCard className="h-6 w-6" />,
      'calendar': <Calendar className="h-6 w-6" />,
      'file-text': <FileText className="h-6 w-6" />,
    };
    return icons[icon] || <Pin className="h-6 w-6" />;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {actions.map((action, index) => (
        <Link key={index} href={action.url}>
          <Button
            data-testid={`btn-${action.name.toLowerCase().replace(/\s+/g, '-')}`}
            className="w-full h-20 flex flex-col gap-2"
            variant={index === 0 ? 'default' : 'outline'}
          >
            {getIconElement(action.icon)}
            <span className="text-sm">{action.name}</span>
          </Button>
        </Link>
      ))}
    </div>
  );
}
