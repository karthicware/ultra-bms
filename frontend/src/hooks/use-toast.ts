/**
 * useToast hook for displaying toast notifications
 * Wraps sonner toast library with a consistent API
 */

import { toast as sonnerToast } from 'sonner';

type ToastVariant = 'default' | 'destructive' | 'success';

interface ToastProps {
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

export function useToast() {
  const toast = ({ title, description, variant = 'default', duration = 5000 }: ToastProps) => {
    const message = title || description || '';
    const fullDescription = title && description ? description : undefined;

    switch (variant) {
      case 'destructive':
        sonnerToast.error(message, {
          description: fullDescription,
          duration,
        });
        break;
      case 'success':
        sonnerToast.success(message, {
          description: fullDescription,
          duration,
        });
        break;
      default:
        sonnerToast(message, {
          description: fullDescription,
          duration,
        });
    }
  };

  return { toast };
}
