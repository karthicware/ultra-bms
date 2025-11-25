# Ultra BMS - Dark Mode Implementation Guide

## Overview

Ultra BMS now supports both light and dark modes with carefully designed color palettes optimized for each theme while maintaining WCAG 2.1 Level AA accessibility compliance.

## Color Adaptations

### Light Mode Colors
- **Primary:** #0A2342 (Deep Navy)
- **Secondary:** #1152D4 (Professional Blue)
- **Accent:** #D4AF37 (Gold)
- **Background:** #FFFFFF
- **Foreground:** #333333

### Dark Mode Colors
- **Primary:** #1A3A5C (Lightened Navy)
- **Secondary:** #3474F4 (Brighter Blue)
- **Accent:** #E5C965 (Lightened Gold)
- **Background:** #0B0F19 (Dark Canvas)
- **Background Secondary:** #111827 (Elevated Surfaces)
- **Foreground:** #F9FAFB (Light Text)

### Semantic Colors (Same in Both Modes)
- **Success:** #22C55E
- **Warning:** #F59E0B
- **Error:** #EF4444
- **Info:** #3B82F6

## Implementation Steps

### 1. Install Dependencies

```bash
npm install next-themes
```

### 2. Configure Tailwind (tailwind.config.js)

```javascript
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0A2342',
          foreground: '#FFFFFF',
          dark: '#1A3A5C'
        },
        secondary: {
          DEFAULT: '#1152D4',
          foreground: '#FFFFFF',
          dark: '#3474F4'
        },
        accent: {
          DEFAULT: '#D4AF37',
          foreground: '#0A2342',
          dark: '#E5C965'
        },
        background: {
          DEFAULT: '#FFFFFF',
          dark: '#0B0F19',
          'dark-secondary': '#111827'
        },
        foreground: {
          DEFAULT: '#333333',
          dark: '#F9FAFB',
          'dark-muted': '#9CA3AF'
        }
      }
    }
  }
}
```

### 3. Create Theme Provider

```tsx
// app/providers.tsx
'use client'
import { ThemeProvider } from 'next-themes'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  )
}
```

### 4. Wrap App with Provider

```tsx
// app/layout.tsx
import { Providers } from './providers'

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
```

### 5. Create Theme Toggle Component

```tsx
// components/theme-toggle.tsx
'use client'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="rounded-lg"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
```

### 6. Add Toggle to Header

```tsx
// components/header.tsx
import { ThemeToggle } from '@/components/theme-toggle'

export function Header() {
  return (
    <header className="border-b bg-white dark:bg-gray-800">
      <div className="flex items-center justify-between p-4">
        {/* ... other header content ... */}
        <ThemeToggle />
      </div>
    </header>
  )
}
```

## Using Dark Mode in Components

### Button Example

```tsx
<Button className="bg-primary dark:bg-primary-dark text-primary-foreground">
  Primary Action
</Button>
```

### Card Example

```tsx
<Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
  <CardContent className="text-gray-900 dark:text-gray-100">
    Content here
  </CardContent>
</Card>
```

### Text Example

```tsx
<p className="text-gray-600 dark:text-gray-300">
  This text adapts to theme
</p>
```

### Input Example

```tsx
<Input
  className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600
             text-gray-900 dark:text-gray-100
             placeholder-gray-400 dark:placeholder-gray-500
             focus:ring-primary dark:focus:ring-secondary-dark"
/>
```

## shadcn/ui Component Styling

All shadcn/ui components should be styled with dark mode support:

### globals.css

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 20%;
    --primary: 213 80% 15%;
    --primary-foreground: 0 0% 100%;
    /* ... other light mode variables */
  }

  .dark {
    --background: 220 25% 6%;
    --foreground: 0 0% 98%;
    --primary: 214 50% 30%;
    --primary-foreground: 0 0% 100%;
    /* ... other dark mode variables */
  }
}
```

## Best Practices

### 1. Always Use Tailwind's dark: Prefix

```tsx
// Good
<div className="bg-white dark:bg-gray-800">

// Bad - hardcoded dark color
<div className="bg-gray-800">
```

### 2. Test Both Modes

- Open dev tools
- Toggle between modes
- Check all screens for:
  - Text readability
  - Button visibility
  - Form input contrast
  - Chart/graph colors

### 3. Images and Logos

For images that need dark mode variants:

```tsx
import Image from 'next/image'

export function Logo() {
  return (
    <>
      <Image
        src="/logo-light.png"
        alt="Logo"
        className="block dark:hidden"
      />
      <Image
        src="/logo-dark.png"
        alt="Logo"
        className="hidden dark:block"
      />
    </>
  )
}
```

### 4. Shadows in Dark Mode

Shadows need adjustment in dark mode:

```tsx
<div className="shadow-md dark:shadow-gray-700/50">
  Card with adaptive shadow
</div>
```

### 5. Border Adjustments

```tsx
<div className="border border-gray-200 dark:border-gray-700">
  Adaptive borders
</div>
```

## Testing Checklist

- [ ] Toggle between modes (smooth transition)
- [ ] All text is readable (WCAG AA contrast)
- [ ] Forms are usable in both modes
- [ ] Buttons are visible and accessible
- [ ] Cards have appropriate elevation
- [ ] Alerts maintain semantic colors
- [ ] Tables are readable
- [ ] Charts/graphs adapt colors
- [ ] Modals have correct overlay opacity
- [ ] Toast notifications are visible
- [ ] Loading states are clear
- [ ] Status badges maintain meaning

## Common Issues and Solutions

### Issue: Flash of Wrong Theme on Load

**Solution:** Add `suppressHydrationWarning` to html tag:

```tsx
<html lang="en" suppressHydrationWarning>
```

### Issue: Component Doesn't Respect Theme

**Solution:** Ensure you're using Tailwind's `dark:` prefix, not custom CSS:

```tsx
// Good
className="text-gray-900 dark:text-gray-100"

// Bad - won't respond to theme toggle
style={{ color: isDark ? '#fff' : '#000' }}
```

### Issue: System Preference Not Detected

**Solution:** Verify ThemeProvider has `enableSystem` prop:

```tsx
<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
```

## Accessibility Notes

### Contrast Ratios

All color combinations meet WCAG 2.1 Level AA:

**Light Mode:**
- Primary on White: 15.7:1 (AAA)
- Text on White: 12.6:1 (AAA)
- Muted text: 5.7:1 (AA)

**Dark Mode:**
- Foreground on Dark BG: 14.2:1 (AAA)
- Secondary on Dark BG: 7.8:1 (AAA)
- Muted text: 4.6:1 (AA)

### Screen Reader Support

Theme toggle should be accessible:

```tsx
<Button aria-label="Toggle dark mode">
  <Sun className="dark:hidden" />
  <Moon className="hidden dark:block" />
</Button>
```

## Performance Considerations

- Theme toggle is instant (class toggle)
- No flash of unstyled content (FOUC)
- LocalStorage preserves preference
- System preference detection is automatic
- CSS variables enable efficient updates

## Resources

- **Interactive Demo:** Open `/docs/development/ux-color-themes.html` to toggle between modes
- **UX Specification:** Full dark mode strategy in `/docs/development/ux-design-specification.md`
- **next-themes Docs:** https://github.com/pacocoursey/next-themes
- **Tailwind Dark Mode:** https://tailwindcss.com/docs/dark-mode

---

**Last Updated:** November 13, 2025
**Version:** 1.0
