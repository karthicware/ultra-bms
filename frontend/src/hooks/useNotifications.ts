/**
 * React Query hooks for Email Notifications
 * Story 9.1: Email Notification System
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '@/services/notification.service';
import type {
  NotificationFilters,
  UpdateSettingsRequest,
  SendEmailRequest,
} from '@/types/notification';
import { toast } from 'sonner';

// Query keys for cache management
export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (filters: NotificationFilters) => [...notificationKeys.lists(), filters] as const,
  details: () => [...notificationKeys.all, 'detail'] as const,
  detail: (id: string) => [...notificationKeys.details(), id] as const,
  stats: (startDate?: string, endDate?: string) =>
    [...notificationKeys.all, 'stats', startDate, endDate] as const,
  settings: () => [...notificationKeys.all, 'settings'] as const,
};

// ============================================================================
// NOTIFICATION LIST HOOKS
// ============================================================================

/**
 * Hook to fetch paginated notifications with filters
 */
export function useNotifications(filters?: NotificationFilters) {
  return useQuery({
    queryKey: notificationKeys.list(filters || {}),
    queryFn: () => notificationService.getNotifications(filters),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refresh every minute
  });
}

/**
 * Hook to fetch a single notification by ID
 */
export function useNotification(id: string) {
  return useQuery({
    queryKey: notificationKeys.detail(id),
    queryFn: () => notificationService.getNotificationById(id),
    enabled: !!id,
  });
}

/**
 * Hook to fetch email statistics
 */
export function useEmailStats(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: notificationKeys.stats(startDate, endDate),
    queryFn: () => notificationService.getEmailStats(startDate, endDate),
    staleTime: 60 * 1000, // 1 minute
  });
}

// ============================================================================
// NOTIFICATION ACTION HOOKS
// ============================================================================

/**
 * Hook to retry a failed notification
 */
export function useRetryNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationService.retryNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.stats() });
      toast.success('Notification retry initiated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to retry notification: ${error.message}`);
    },
  });
}

/**
 * Hook to send an email notification
 */
export function useSendEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SendEmailRequest) => notificationService.sendEmail(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.stats() });
      toast.success('Email queued for delivery');
    },
    onError: (error: Error) => {
      toast.error(`Failed to send email: ${error.message}`);
    },
  });
}

/**
 * Hook to send a test email
 */
export function useSendTestEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (email: string) => notificationService.sendTestEmail(email),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      if (data.status === 'SENT') {
        toast.success('Test email sent successfully!');
      } else {
        toast.info('Test email queued. Check the notification log for status.');
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to send test email: ${error.message}`);
    },
  });
}

// ============================================================================
// NOTIFICATION SETTINGS HOOKS
// ============================================================================

/**
 * Hook to fetch all notification settings
 */
export function useNotificationSettings() {
  return useQuery({
    queryKey: notificationKeys.settings(),
    queryFn: () => notificationService.getNotificationSettings(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to update notification settings
 */
export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateSettingsRequest) =>
      notificationService.updateNotificationSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.settings() });
      toast.success('Settings updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update settings: ${error.message}`);
    },
  });
}

/**
 * Hook to reset notification settings to defaults
 */
export function useResetNotificationSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationService.resetNotificationSettings(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.settings() });
      toast.success('Settings reset to defaults');
    },
    onError: (error: Error) => {
      toast.error(`Failed to reset settings: ${error.message}`);
    },
  });
}
