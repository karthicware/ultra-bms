/**
 * Tests for ThemeProvider component
 * Story 2.7: Admin Theme Settings & System Theme Support
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '../theme-provider';

// Mock next-themes ThemeProvider
jest.mock('next-themes', () => ({
  ThemeProvider: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <div data-testid="theme-provider" data-props={JSON.stringify(props)}>
      {children}
    </div>
  ),
}));

describe('ThemeProvider', () => {
  it('should render children correctly', () => {
    render(
      <ThemeProvider>
        <div data-testid="child">Test Child</div>
      </ThemeProvider>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Test Child')).toBeInTheDocument();
  });

  it('should pass correct props to NextThemesProvider', () => {
    render(
      <ThemeProvider>
        <div>Content</div>
      </ThemeProvider>
    );

    const provider = screen.getByTestId('theme-provider');
    const props = JSON.parse(provider.getAttribute('data-props') || '{}');

    // Verify AC#2: attribute="class" for Tailwind CSS dark mode compatibility
    expect(props.attribute).toBe('class');

    // Verify default theme is system for AC#5
    expect(props.defaultTheme).toBe('system');

    // Verify system theme detection is enabled for AC#5
    expect(props.enableSystem).toBe(true);

    // Verify storage key for AC#4 localStorage fallback
    expect(props.storageKey).toBe('ultra-bms-theme');

    // Verify transitions are enabled for AC#9
    expect(props.disableTransitionOnChange).toBe(false);
  });

  it('should allow custom props to override defaults', () => {
    render(
      <ThemeProvider defaultTheme="dark" storageKey="custom-key">
        <div>Content</div>
      </ThemeProvider>
    );

    const provider = screen.getByTestId('theme-provider');
    const props = JSON.parse(provider.getAttribute('data-props') || '{}');

    expect(props.defaultTheme).toBe('dark');
    expect(props.storageKey).toBe('custom-key');
  });

  it('should wrap multiple children', () => {
    render(
      <ThemeProvider>
        <div data-testid="child1">Child 1</div>
        <div data-testid="child2">Child 2</div>
      </ThemeProvider>
    );

    expect(screen.getByTestId('child1')).toBeInTheDocument();
    expect(screen.getByTestId('child2')).toBeInTheDocument();
  });

  it('should maintain class attribute for Tailwind dark mode (AC#8)', () => {
    render(
      <ThemeProvider>
        <div>Content</div>
      </ThemeProvider>
    );

    const provider = screen.getByTestId('theme-provider');
    const props = JSON.parse(provider.getAttribute('data-props') || '{}');

    // Critical for Tailwind CSS darkMode: 'class' strategy
    expect(props.attribute).toBe('class');
  });

  it('should have enableSystem true for OS preference detection (AC#5)', () => {
    render(
      <ThemeProvider>
        <div>Content</div>
      </ThemeProvider>
    );

    const provider = screen.getByTestId('theme-provider');
    const props = JSON.parse(provider.getAttribute('data-props') || '{}');

    expect(props.enableSystem).toBe(true);
  });

  it('should use ultra-bms-theme storage key for localStorage (AC#4)', () => {
    render(
      <ThemeProvider>
        <div>Content</div>
      </ThemeProvider>
    );

    const provider = screen.getByTestId('theme-provider');
    const props = JSON.parse(provider.getAttribute('data-props') || '{}');

    expect(props.storageKey).toBe('ultra-bms-theme');
  });
});
