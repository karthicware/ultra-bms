/**
 * Quick Actions Grid Component
 * Displays action buttons for common tenant tasks
 */
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { QuickAction } from '@/types/tenant-portal';

interface QuickActionsGridProps {
  actions: QuickAction[];
}

export function QuickActionsGrid({ actions }: QuickActionsGridProps) {
  const getIconElement = (icon: string) => {
    const icons: Record<string, string> = {
      'tools': '🔧',
      'credit-card': '💳',
      'calendar': '📅',
      'file-text': '📄',
    };
    return icons[icon] || '📌';
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
            <span className="text-2xl">{getIconElement(action.icon)}</span>
            <span className="text-sm">{action.name}</span>
          </Button>
        </Link>
      ))}
    </div>
  );
}
