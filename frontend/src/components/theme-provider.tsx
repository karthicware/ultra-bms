'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

/**
 * Theme provider component that wraps next-themes ThemeProvider
 * Provides theme context to the entire application
 *
 * Features:
 * - System theme detection (respects OS prefers-color-scheme)
 * - Light/Dark/System theme options
 * - Persistent theme preference in localStorage
 * - Class-based dark mode for Tailwind CSS compatibility
 *
 * @example
 * ```tsx
 * <ThemeProvider>
 *   <App />
 * </ThemeProvider>
 * ```
 */
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
      storageKey="ultra-bms-theme"
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
