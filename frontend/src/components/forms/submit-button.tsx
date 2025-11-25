'use client';

import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import React from 'react';

interface SubmitButtonProps extends Omit<React.ComponentPropsWithoutRef<typeof Button>, 'children'> {
  isLoading?: boolean;
  loadingText?: string;
  children?: React.ReactNode;
}

export function SubmitButton({
  children,
  isLoading = false,
  loadingText = 'Loading...',
  disabled,
  className,
  ...props
}: SubmitButtonProps) {
  return (
    <Button
      type="submit"
      disabled={disabled || isLoading}
      className={cn('w-full', className)}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
