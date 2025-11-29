'use client';

/**
 * Notification Settings Page
 * Story 9.1: Email Notification System
 * AC #31-32: Settings page with toggles for notification types and frequency
 */

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  useNotificationSettings,
  useUpdateNotificationSettings,
  useResetNotificationSettings,
} from '@/hooks/useNotifications';
import {
  NotificationType,
  NotificationFrequency,
  NOTIFICATION_CATEGORIES,
  FREQUENCY_CONFIG,
  type NotificationSettings,
  type NotificationCategory,
} from '@/types/notification';
import {
  ArrowLeft,
  RotateCcw,
  Loader2,
  Shield,
  Users,
  Wrench,
  DollarSign,
  Truck,
  ClipboardCheck,
  FileText,
  Megaphone,
} from 'lucide-react';

/**
 * Category icons and labels
 */
const CATEGORY_CONFIG: Record<
  NotificationCategory,
  { icon: typeof Shield; label: string; description: string }
> = {
  authentication: {
    icon: Shield,
    label: 'Authentication',
    description: 'Password resets and account security notifications',
  },
  tenant: {
    icon: Users,
    label: 'Tenant',
    description: 'Tenant onboarding and lease-related notifications',
  },
  maintenance: {
    icon: Wrench,
    label: 'Maintenance',
    description: 'Work orders and maintenance request notifications',
  },
  financial: {
    icon: DollarSign,
    label: 'Financial',
    description: 'Invoices, payments, and overdue notifications',
  },
  vendor: {
    icon: Truck,
    label: 'Vendor',
    description: 'Vendor registration and document notifications',
  },
  compliance: {
    icon: ClipboardCheck,
    label: 'Compliance',
    description: 'Inspection and compliance due notifications',
  },
  document: {
    icon: FileText,
    label: 'Document',
    description: 'Document upload and expiry notifications',
  },
  announcement: {
    icon: Megaphone,
    label: 'Announcement',
    description: 'System-wide announcement notifications',
  },
};

/**
 * Format notification type for display
 */
function formatNotificationType(type: NotificationType): string {
  return type
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Group settings by category
 */
function groupSettingsByCategory(
  settings: NotificationSettings[]
): Record<NotificationCategory, NotificationSettings[]> {
  const grouped: Record<NotificationCategory, NotificationSettings[]> = {
    authentication: [],
    tenant: [],
    maintenance: [],
    financial: [],
    vendor: [],
    compliance: [],
    document: [],
    announcement: [],
  };

  settings.forEach((setting) => {
    const category = NOTIFICATION_CATEGORIES[setting.notificationType];
    if (category && grouped[category]) {
      grouped[category].push(setting);
    }
  });

  return grouped;
}

export default function NotificationSettingsPage() {
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  // React Query hooks
  const { data: settings, isLoading, refetch } = useNotificationSettings();
  const updateMutation = useUpdateNotificationSettings();
  const resetMutation = useResetNotificationSettings();

  // Group settings by category
  const groupedSettings = settings ? groupSettingsByCategory(settings) : null;

  // Handlers
  const handleToggle = useCallback(
    async (notificationType: NotificationType, emailEnabled: boolean) => {
      try {
        await updateMutation.mutateAsync({
          notificationType,
          emailEnabled,
        });
      } catch {
        // Error handled in mutation
      }
    },
    [updateMutation]
  );

  const handleFrequencyChange = useCallback(
    async (notificationType: NotificationType, frequency: NotificationFrequency) => {
      try {
        await updateMutation.mutateAsync({
          notificationType,
          frequency,
        });
      } catch {
        // Error handled in mutation
      }
    },
    [updateMutation]
  );

  const handleReset = useCallback(async () => {
    try {
      await resetMutation.mutateAsync();
      setResetDialogOpen(false);
      refetch();
    } catch {
      // Error handled in mutation
    }
  }, [resetMutation, refetch]);

  // Loading state
  if (isLoading) {
    return (
      <div className="container max-w-4xl py-8 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/settings/notifications">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notification Settings</h1>
            <p className="text-muted-foreground">
              Configure which notifications are sent and their delivery frequency
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => setResetDialogOpen(true)}
          disabled={resetMutation.isPending}
        >
          {resetMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RotateCcw className="mr-2 h-4 w-4" />
          )}
          Reset to Defaults
        </Button>
      </div>

      {/* Settings by Category */}
      {groupedSettings &&
        Object.entries(groupedSettings).map(([category, categorySettings]) => {
          if (categorySettings.length === 0) return null;

          const config = CATEGORY_CONFIG[category as NotificationCategory];
          const Icon = config.icon;

          return (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className="h-5 w-5" />
                  {config.label}
                </CardTitle>
                <CardDescription>{config.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categorySettings.map((setting) => (
                    <div
                      key={setting.id}
                      className="flex items-center justify-between py-3 border-b last:border-0"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">
                          {formatNotificationType(setting.notificationType)}
                        </p>
                        {setting.description && (
                          <p className="text-sm text-muted-foreground">
                            {setting.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <Select
                          value={setting.frequency}
                          onValueChange={(value) =>
                            handleFrequencyChange(
                              setting.notificationType,
                              value as NotificationFrequency
                            )
                          }
                          disabled={!setting.emailEnabled || updateMutation.isPending}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(FREQUENCY_CONFIG).map(([freq, config]) => (
                              <SelectItem key={freq} value={freq}>
                                {config.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Switch
                          checked={setting.emailEnabled}
                          onCheckedChange={(checked) =>
                            handleToggle(setting.notificationType, checked)
                          }
                          disabled={updateMutation.isPending}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}

      {/* Frequency Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery Frequency Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {Object.entries(FREQUENCY_CONFIG).map(([freq, config]) => (
              <div key={freq} className="space-y-1">
                <Badge variant="outline">{config.label}</Badge>
                <p className="text-sm text-muted-foreground">{config.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset to Default Settings?</AlertDialogTitle>
            <AlertDialogDescription>
              This will enable all notification types and set their frequency to immediate
              delivery. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset} disabled={resetMutation.isPending}>
              {resetMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Reset Settings
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
