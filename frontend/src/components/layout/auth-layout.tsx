'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  footer?: React.ReactNode;
  className?: string;
}

export function AuthLayout({ children, title, description, footer, className }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-4">
        {/* Logo/Brand */}
        <div className="flex flex-col items-center justify-center space-y-2">
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="text-xl font-bold">U</span>
            </div>
            <span className="text-2xl font-bold text-foreground">Ultra BMS</span>
          </Link>
        </div>

        {/* Auth Card */}
        <Card className={cn('border-border shadow-lg', className)}>
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold tracking-tight">{title}</CardTitle>
            {description && (
              <CardDescription className="text-muted-foreground">{description}</CardDescription>
            )}
          </CardHeader>
          <CardContent>{children}</CardContent>
          {footer && <CardFooter className="flex flex-col space-y-2">{footer}</CardFooter>}
        </Card>

        {/* Footer Links */}
        <p className="text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Ultra BMS. All rights reserved.
        </p>
      </div>
    </div>
  );
}
