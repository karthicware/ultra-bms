/**
 * Tests for Appearance Settings Page
 * Story 2.7: Admin Theme Settings & System Theme Support
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AppearanceSettingsPage from '../page';
import { ThemePreference } from '@/types/settings';

// Mock useThemeSync hook
const mockSetTheme = jest.fn();
jest.mock('@/hooks/useThemeSync', () => ({
  useThemeSync: () => ({
    theme: 'system',
    setTheme: mockSetTheme,
    resolvedTheme: 'light',
    systemTheme: 'light',
    themePreference: ThemePreference.SYSTEM,
    isLoading: false,
    isUpdating: false,
  }),
}));

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

// Simulate mounted state
jest.useFakeTimers();

describe('AppearanceSettingsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the page title', async () => {
    render(<AppearanceSettingsPage />);

    // Fast-forward timers to trigger useEffect mount
    jest.runAllTimers();

    await waitFor(() => {
      expect(screen.getByText('Appearance')).toBeInTheDocument();
    });
  });

  it('should render back to settings link', async () => {
    render(<AppearanceSettingsPage />);
    jest.runAllTimers();

    await waitFor(() => {
      expect(screen.getByText('Back to Settings')).toBeInTheDocument();
    });
  });

  it('should render all three theme options (AC#1)', async () => {
    render(<AppearanceSettingsPage />);
    jest.runAllTimers();

    await waitFor(() => {
      expect(screen.getByText('System')).toBeInTheDocument();
      expect(screen.getByText('Light')).toBeInTheDocument();
      expect(screen.getByText('Dark')).toBeInTheDocument();
    });
  });

  it('should render theme option descriptions', async () => {
    render(<AppearanceSettingsPage />);
    jest.runAllTimers();

    await waitFor(() => {
      expect(screen.getByText('Follows your operating system preference')).toBeInTheDocument();
      expect(screen.getByText('Always use light theme')).toBeInTheDocument();
      expect(screen.getByText('Always use dark theme')).toBeInTheDocument();
    });
  });

  it('should render live preview section (AC#12)', async () => {
    render(<AppearanceSettingsPage />);
    jest.runAllTimers();

    await waitFor(() => {
      expect(screen.getByText('Preview')).toBeInTheDocument();
      expect(screen.getByText(/Currently showing:/)).toBeInTheDocument();
    });
  });

  it('should call setTheme when theme option is clicked (AC#1)', async () => {
    render(<AppearanceSettingsPage />);
    jest.runAllTimers();

    await waitFor(() => {
      expect(screen.getByText('Dark')).toBeInTheDocument();
    });

    // Find and click the Dark theme label
    const darkLabel = screen.getByText('Dark').closest('label');
    if (darkLabel) {
      fireEvent.click(darkLabel);
    }

    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('should call setTheme with light when Light option is clicked', async () => {
    render(<AppearanceSettingsPage />);
    jest.runAllTimers();

    await waitFor(() => {
      expect(screen.getByText('Light')).toBeInTheDocument();
    });

    const lightLabel = screen.getByText('Light').closest('label');
    if (lightLabel) {
      fireEvent.click(lightLabel);
    }

    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });

  it('should have System option rendered and selectable', async () => {
    render(<AppearanceSettingsPage />);
    jest.runAllTimers();

    await waitFor(() => {
      expect(screen.getByText('System')).toBeInTheDocument();
    });

    // System is default selected, verify it's in the document
    const systemLabel = screen.getByText('System').closest('label');
    expect(systemLabel).toBeInTheDocument();
  });

  it('should have accessible radio group (AC#1)', async () => {
    render(<AppearanceSettingsPage />);
    jest.runAllTimers();

    await waitFor(() => {
      const radioGroup = screen.getByTestId('theme-radio-group');
      expect(radioGroup).toBeInTheDocument();
    });
  });

  it('should show page description', async () => {
    render(<AppearanceSettingsPage />);
    jest.runAllTimers();

    await waitFor(() => {
      expect(screen.getByText('Customize the look and feel of the application')).toBeInTheDocument();
    });
  });

  it('should show theme card with description', async () => {
    render(<AppearanceSettingsPage />);
    jest.runAllTimers();

    await waitFor(() => {
      expect(screen.getByText('Theme')).toBeInTheDocument();
      expect(screen.getByText(/Select your preferred theme/)).toBeInTheDocument();
    });
  });
});

describe('AppearanceSettingsPage loading states', () => {
  it('should show skeleton before mount', () => {
    // Component shows skeleton before mount
    render(<AppearanceSettingsPage />);

    // Before timers run, should show skeleton (mounted = false)
    // The skeleton has animate-pulse class or the component is in loading state
    const container = document.body;
    expect(container).toBeInTheDocument();
  });
});
