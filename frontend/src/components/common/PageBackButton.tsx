'use client';

/**
 * PageBackButton Component
 * Consistent back button used in page headers across the application
 * Based on the design from tenants/create page
 */

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PageBackButtonProps {
  /** The URL to navigate to. If not provided, uses router.back() */
  href?: string;
  /** Custom click handler. Takes precedence over href */
  onClick?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Accessible label for the button */
  'aria-label'?: string;
}

/**
 * A consistent back button component for page headers
 * Features a rounded, semi-transparent design with backdrop blur
 */
export function PageBackButton({
  href,
  onClick,
  className,
  'aria-label': ariaLabel = 'Go back',
}: PageBackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      aria-label={ariaLabel}
      className={cn(
        'h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background shadow-sm',
        className
      )}
    >
      <ArrowLeft className="h-5 w-5" />
    </Button>
  );
}
