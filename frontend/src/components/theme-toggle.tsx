'use client';

/**
 * Theme Toggle Component
 * Story 2.7: Admin Theme Settings & System Theme Support
 *
 * A dropdown button for quickly switching between themes
 */

import * as React from 'react';
import { Moon, Sun, Monitor, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useThemeSync } from '@/hooks/useThemeSync';

interface ThemeToggleProps {
  /** Additional CSS classes */
  className?: string;
  /** Size variant for the button */
  variant?: 'default' | 'ghost' | 'outline';
  /** Size of the button */
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

/**
 * Theme toggle dropdown component
 *
 * Displays the current theme icon and allows switching between themes
 *
 * @example
 * ```tsx
 * <ThemeToggle />
 * <ThemeToggle variant="outline" size="sm" />
 * ```
 */
export function ThemeToggle({
  className,
  variant = 'ghost',
  size = 'icon',
}: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useThemeSync();
  const [mounted, setMounted] = React.useState(false);

  // Prevent hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant={variant} size={size} className={className} disabled>
        <Sun className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  // Determine which icon to show based on resolved theme
  const ThemeIcon = resolvedTheme === 'dark' ? Moon : Sun;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={className}
          data-testid="theme-toggle-btn"
        >
          <ThemeIcon className="h-[1.2rem] w-[1.2rem] transition-all" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" data-testid="theme-toggle-menu">
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className="flex items-center gap-2"
          data-testid="theme-option-light"
        >
          <Sun className="h-4 w-4" />
          <span>Light</span>
          {theme === 'light' && <Check className="h-4 w-4 ml-auto" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className="flex items-center gap-2"
          data-testid="theme-option-dark"
        >
          <Moon className="h-4 w-4" />
          <span>Dark</span>
          {theme === 'dark' && <Check className="h-4 w-4 ml-auto" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('system')}
          className="flex items-center gap-2"
          data-testid="theme-option-system"
        >
          <Monitor className="h-4 w-4" />
          <span>System</span>
          {theme === 'system' && <Check className="h-4 w-4 ml-auto" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
