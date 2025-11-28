'use client';

/**
 * Appearance Settings Page
 * Story 2.7: Admin Theme Settings & System Theme Support
 *
 * Allows users to configure their theme preference (System/Light/Dark)
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Monitor, Sun, Moon, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useThemeSync } from '@/hooks/useThemeSync';
import { ThemePreference, THEME_OPTIONS } from '@/types/settings';

// Icon components mapping
const iconComponents = {
  Monitor,
  Sun,
  Moon,
} as const;

export default function AppearanceSettingsPage() {
  const {
    theme,
    setTheme,
    resolvedTheme,
    systemTheme,
    isLoading,
    isUpdating,
  } = useThemeSync();

  // Track mounted state to prevent hydration mismatch
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Map current theme to ThemePreference for radio selection
  const currentThemeValue = theme === 'light'
    ? ThemePreference.LIGHT
    : theme === 'dark'
      ? ThemePreference.DARK
      : ThemePreference.SYSTEM;

  const handleThemeChange = (value: string) => {
    const newTheme = value === ThemePreference.LIGHT
      ? 'light'
      : value === ThemePreference.DARK
        ? 'dark'
        : 'system';
    setTheme(newTheme);
  };

  // Show loading skeleton during SSR/hydration
  if (!mounted) {
    return (
      <div className="container max-w-2xl py-8">
        <div className="mb-6 flex items-center gap-4">
          <div className="h-6 w-20 bg-muted animate-pulse rounded" />
        </div>
        <div className="h-[400px] bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-8">
      {/* Back navigation */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/settings" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Settings
          </Link>
        </Button>
      </div>

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Appearance</h1>
        <p className="text-muted-foreground">
          Customize the look and feel of the application
        </p>
      </div>

      {/* Theme selection card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Theme
            {(isLoading || isUpdating) && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </CardTitle>
          <CardDescription>
            Select your preferred theme. Choose &quot;System&quot; to automatically match your device&apos;s settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Theme radio group */}
          <RadioGroup
            value={currentThemeValue}
            onValueChange={handleThemeChange}
            className="grid gap-4"
            data-testid="theme-radio-group"
          >
            {THEME_OPTIONS.map((option) => {
              const Icon = iconComponents[option.icon];
              const isSelected = currentThemeValue === option.value;

              return (
                <div key={option.value} className="relative">
                  <RadioGroupItem
                    value={option.value}
                    id={`theme-${option.value.toLowerCase()}`}
                    className="peer sr-only"
                    data-testid={`theme-option-${option.value.toLowerCase()}`}
                  />
                  <Label
                    htmlFor={`theme-${option.value.toLowerCase()}`}
                    className={`
                      flex items-center gap-4 rounded-lg border-2 p-4 cursor-pointer
                      transition-all duration-200
                      hover:bg-accent hover:text-accent-foreground
                      peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2
                      ${isSelected ? 'border-primary bg-primary/5' : 'border-muted'}
                    `}
                  >
                    <div className={`
                      flex h-10 w-10 items-center justify-center rounded-full
                      ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'}
                    `}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-muted-foreground">
                        {option.description}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                        <svg
                          className="h-3 w-3 text-primary-foreground"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </Label>
                </div>
              );
            })}
          </RadioGroup>

          {/* Live preview section */}
          <div className="border-t pt-6">
            <h3 className="text-sm font-medium mb-3">Preview</h3>
            <div className={`
              rounded-lg border p-4 transition-colors duration-200
              ${resolvedTheme === 'dark' ? 'bg-zinc-900 text-zinc-100 border-zinc-700' : 'bg-white text-zinc-900 border-zinc-200'}
            `}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`h-8 w-8 rounded-full ${resolvedTheme === 'dark' ? 'bg-zinc-700' : 'bg-zinc-200'}`} />
                <div>
                  <div className={`h-3 w-24 rounded ${resolvedTheme === 'dark' ? 'bg-zinc-700' : 'bg-zinc-200'}`} />
                  <div className={`h-2 w-16 rounded mt-1 ${resolvedTheme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-100'}`} />
                </div>
              </div>
              <div className={`h-2 w-full rounded mb-2 ${resolvedTheme === 'dark' ? 'bg-zinc-700' : 'bg-zinc-200'}`} />
              <div className={`h-2 w-3/4 rounded ${resolvedTheme === 'dark' ? 'bg-zinc-700' : 'bg-zinc-200'}`} />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Currently showing: {resolvedTheme === 'dark' ? 'Dark' : 'Light'} theme
              {theme === 'system' && ` (following system: ${systemTheme})`}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
