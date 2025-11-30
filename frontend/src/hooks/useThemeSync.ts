/**
 * React Query hooks for theme synchronization with backend
 * Story 2.7: Admin Theme Settings & System Theme Support
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from 'next-themes';
import { useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { getAppearanceSettings, updateAppearanceSettings } from '@/services/settings.service';
import {
  themePreferenceToNextTheme,
  nextThemeToThemePreference,
} from '@/types/settings';

// Query keys for React Query
export const appearanceKeys = {
  all: ['appearance'] as const,
  settings: () => [...appearanceKeys.all, 'settings'] as const,
};

/**
 * Hook to fetch appearance settings from the backend
 * Only fetches when user is authenticated
 */
export function useAppearanceSettings() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: appearanceKeys.settings(),
    queryFn: getAppearanceSettings,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
}

/**
 * Hook to update appearance settings on the backend
 */
export function useUpdateAppearanceSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAppearanceSettings,
    onSuccess: (data) => {
      // Update the cache with the new settings
      queryClient.setQueryData(appearanceKeys.settings(), data);
      toast.success('Theme preference saved');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      const message = error.response?.data?.message || 'Failed to save theme preference';
      toast.error(message);
    },
  });
}

/**
 * Main hook that synchronizes theme between next-themes and backend
 *
 * Features:
 * - Fetches user's theme preference from backend on mount (if authenticated)
 * - Syncs theme changes to backend for authenticated users
 * - Falls back to localStorage for non-authenticated users
 * - Provides setTheme function that handles sync
 *
 * @example
 * ```tsx
 * const { theme, setTheme, resolvedTheme, isLoading } = useThemeSync();
 * ```
 */
export function useThemeSync() {
  const { isAuthenticated } = useAuth();
  const { theme, setTheme: setNextTheme, resolvedTheme, systemTheme } = useTheme();
  const { data: settings, isLoading: isLoadingSettings } = useAppearanceSettings();
  const updateSettings = useUpdateAppearanceSettings();

  // Sync theme from backend when settings are loaded
  useEffect(() => {
    if (settings?.themePreference && isAuthenticated) {
      const nextThemeValue = themePreferenceToNextTheme(settings.themePreference);
      if (theme !== nextThemeValue) {
        setNextTheme(nextThemeValue);
      }
    }
  }, [settings?.themePreference, isAuthenticated, theme, setNextTheme]);

  // Custom setTheme that syncs to backend for authenticated users
  const setTheme = useCallback(
    (newTheme: string) => {
      // Update next-themes immediately for responsive UI
      setNextTheme(newTheme);

      // Sync to backend if authenticated
      if (isAuthenticated) {
        const themePreference = nextThemeToThemePreference(newTheme);
        updateSettings.mutate({ themePreference });
      }
    },
    [isAuthenticated, setNextTheme, updateSettings]
  );

  // Get the current theme preference enum value
  const themePreference = settings?.themePreference ?? nextThemeToThemePreference(theme);

  return {
    /** Current theme ('system' | 'light' | 'dark') */
    theme,
    /** Function to change theme */
    setTheme,
    /** Resolved theme after system preference ('light' | 'dark') */
    resolvedTheme,
    /** Operating system theme preference */
    systemTheme,
    /** Backend theme preference enum */
    themePreference,
    /** Whether theme settings are loading */
    isLoading: isLoadingSettings,
    /** Whether theme update is in progress */
    isUpdating: updateSettings.isPending,
  };
}
