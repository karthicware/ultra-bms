'use client';

import { Button, ButtonProps } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SubmitButtonProps extends ButtonProps {
  isLoading?: boolean;
  loadingText?: string;
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
