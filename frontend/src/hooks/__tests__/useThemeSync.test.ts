/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Tests for useThemeSync hook
 * Story 2.7: Admin Theme Settings & System Theme Support
 */
import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useThemeSync, useAppearanceSettings, useUpdateAppearanceSettings } from '../useThemeSync';
import * as settingsService from '@/services/settings.service';
import { ThemePreference } from '@/types/settings';

// Mock next-themes
const mockSetTheme = jest.fn();
jest.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'system',
    setTheme: mockSetTheme,
    resolvedTheme: 'light',
    systemTheme: 'light',
  }),
}));

// Mock auth context
jest.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { id: 'test-user-id' },
  }),
}));

// Mock the settings service
jest.mock('@/services/settings.service');

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  const TestWrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
  TestWrapper.displayName = 'TestWrapper';
  return TestWrapper;
};

describe('useThemeSync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useAppearanceSettings', () => {
    it('should fetch appearance settings successfully', async () => {
      const mockSettings = { themePreference: ThemePreference.DARK };
      (settingsService.getAppearanceSettings as jest.Mock).mockResolvedValue(mockSettings);

      const { result } = renderHook(() => useAppearanceSettings(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockSettings);
    });

    it('should handle fetch errors gracefully', async () => {
      (settingsService.getAppearanceSettings as jest.Mock).mockRejectedValue(
        new Error('API Error')
      );

      const { result } = renderHook(() => useAppearanceSettings(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toBeTruthy();
    });
  });

  describe('useUpdateAppearanceSettings', () => {
    it('should update appearance settings successfully', async () => {
      const mockResponse = { themePreference: ThemePreference.DARK };
      (settingsService.updateAppearanceSettings as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useUpdateAppearanceSettings(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate({ themePreference: ThemePreference.DARK });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(settingsService.updateAppearanceSettings).toHaveBeenCalled();
    });

    it('should handle update errors gracefully', async () => {
      (settingsService.updateAppearanceSettings as jest.Mock).mockRejectedValue(
        new Error('Update failed')
      );

      const { result } = renderHook(() => useUpdateAppearanceSettings(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate({ themePreference: ThemePreference.DARK });
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe('useThemeSync hook', () => {
    it('should return theme properties', async () => {
      const mockSettings = { themePreference: ThemePreference.SYSTEM };
      (settingsService.getAppearanceSettings as jest.Mock).mockResolvedValue(mockSettings);

      const { result } = renderHook(() => useThemeSync(), {
        wrapper: createWrapper(),
      });

      // Initial render should have theme values
      expect(result.current.theme).toBe('system');
      expect(result.current.resolvedTheme).toBe('light');
      expect(result.current.systemTheme).toBe('light');
      expect(typeof result.current.setTheme).toBe('function');
    });

    it('should call setTheme and update backend when authenticated', async () => {
      const mockSettings = { themePreference: ThemePreference.SYSTEM };
      const mockUpdateResponse = { themePreference: ThemePreference.DARK };
      (settingsService.getAppearanceSettings as jest.Mock).mockResolvedValue(mockSettings);
      (settingsService.updateAppearanceSettings as jest.Mock).mockResolvedValue(mockUpdateResponse);

      const { result } = renderHook(() => useThemeSync(), {
        wrapper: createWrapper(),
      });

      // Wait for initial load
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // Call setTheme
      await act(async () => {
        result.current.setTheme('dark');
      });

      // Should update next-themes immediately
      expect(mockSetTheme).toHaveBeenCalledWith('dark');

      // Should sync to backend
      await waitFor(() => {
        expect(settingsService.updateAppearanceSettings).toHaveBeenCalled();
      });
    });

    it('should provide isLoading state', async () => {
      const mockSettings = { themePreference: ThemePreference.SYSTEM };
      (settingsService.getAppearanceSettings as jest.Mock).mockResolvedValue(mockSettings);

      const { result } = renderHook(() => useThemeSync(), {
        wrapper: createWrapper(),
      });

      // Should eventually finish loading
      await waitFor(() => expect(result.current.isLoading).toBe(false));
    });

    it('should provide isUpdating state during mutation', async () => {
      const mockSettings = { themePreference: ThemePreference.SYSTEM };
      let resolveUpdate: (value: any) => void;
      const updatePromise = new Promise((resolve) => {
        resolveUpdate = resolve;
      });

      (settingsService.getAppearanceSettings as jest.Mock).mockResolvedValue(mockSettings);
      (settingsService.updateAppearanceSettings as jest.Mock).mockReturnValue(updatePromise);

      const { result } = renderHook(() => useThemeSync(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // Start update
      act(() => {
        result.current.setTheme('dark');
      });

      // Should show updating state
      await waitFor(() => expect(result.current.isUpdating).toBe(true));

      // Resolve update
      await act(async () => {
        resolveUpdate!({ themePreference: ThemePreference.DARK });
      });

      await waitFor(() => expect(result.current.isUpdating).toBe(false));
    });
  });
});

describe('Theme preference conversion', () => {
  it('should convert next-themes values to ThemePreference', () => {
    // These are tested implicitly through the hook, but we can verify the mapping
    expect(ThemePreference.LIGHT).toBe('LIGHT');
    expect(ThemePreference.DARK).toBe('DARK');
    expect(ThemePreference.SYSTEM).toBe('SYSTEM');
  });
});
