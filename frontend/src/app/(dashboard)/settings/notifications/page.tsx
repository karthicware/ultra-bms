'use client';

/**
 * Email Notifications Management Page
 * Story 9.1: Email Notification System
 * AC #33-36: Admin UI for email logs with filters, retry, and test email
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { debounce } from 'lodash';
import { format } from 'date-fns';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  useNotifications,
  useEmailStats,
  useRetryNotification,
  useSendTestEmail,
} from '@/hooks/useNotifications';
import {
  EmailNotificationStatus,
  NotificationType,
  NOTIFICATION_STATUS_CONFIG,
  NOTIFICATION_CATEGORIES,
  type EmailNotificationListItem,
  type NotificationFilters,
  type EmailStats,
} from '@/types/notification';
import { notificationService } from '@/services/notification.service';
import {
  Search,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Eye,
  Settings,
  Send,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

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
 * Get badge variant based on status
 */
function getStatusBadgeVariant(status: EmailNotificationStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case EmailNotificationStatus.SENT:
      return 'default';
    case EmailNotificationStatus.PENDING:
    case EmailNotificationStatus.QUEUED:
      return 'secondary';
    case EmailNotificationStatus.FAILED:
      return 'destructive';
    default:
      return 'outline';
  }
}

/**
 * Stats cards component
 */
function StatsCards({ stats, isLoading }: { stats: EmailStats | undefined; isLoading: boolean }) {
  return (
    <div className="grid gap-4 md:grid-cols-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {isLoading ? <Skeleton className="h-8 w-16" /> : stats?.pending || 0}
          </div>
          <p className="text-xs text-muted-foreground">Awaiting processing</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Queued</CardTitle>
          <Mail className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {isLoading ? <Skeleton className="h-8 w-16" /> : stats?.queued || 0}
          </div>
          <p className="text-xs text-muted-foreground">Ready to send</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Sent</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {isLoading ? <Skeleton className="h-8 w-16" /> : stats?.sent || 0}
          </div>
          <p className="text-xs text-muted-foreground">Successfully delivered</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Failed</CardTitle>
          <XCircle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {isLoading ? <Skeleton className="h-8 w-16" /> : stats?.failed || 0}
          </div>
          <p className="text-xs text-muted-foreground">Delivery failed</p>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Loading skeleton component
 */
function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-12 w-full" />
        </div>
      ))}
    </div>
  );
}

export default function NotificationsPage() {
  // State
  const [filters, setFilters] = useState<NotificationFilters>({
    page: 0,
    size: 20,
    sortBy: 'createdAt',
    sortDir: 'desc',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNotification, setSelectedNotification] = useState<EmailNotificationListItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isTestEmailOpen, setIsTestEmailOpen] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState('');

  // React Query hooks
  const { data: notificationsData, isLoading, refetch } = useNotifications(filters);
  const { data: stats, isLoading: statsLoading } = useEmailStats();
  const retryMutation = useRetryNotification();
  const sendTestEmailMutation = useSendTestEmail();

  // Debounced search
  const debouncedSearch = useMemo(
    () =>
      debounce((term: string) => {
        setFilters((prev) => ({
          ...prev,
          recipientEmail: term || undefined,
          page: 0,
        }));
      }, 300),
    []
  );

  useEffect(() => {
    debouncedSearch(searchTerm);
    return () => debouncedSearch.cancel();
  }, [searchTerm, debouncedSearch]);

  // Handlers
  const handleStatusFilter = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      status: value === 'ALL' ? undefined : (value as EmailNotificationStatus),
      page: 0,
    }));
  };

  const handleTypeFilter = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      type: value === 'ALL' ? undefined : (value as NotificationType),
      page: 0,
    }));
  };

  const handleRetry = useCallback(
    async (id: string) => {
      try {
        await retryMutation.mutateAsync(id);
        refetch();
      } catch {
        // Error handled in mutation
      }
    },
    [retryMutation, refetch]
  );

  const handleViewDetails = useCallback(async (notification: EmailNotificationListItem) => {
    try {
      const details = await notificationService.getNotificationById(notification.id);
      setSelectedNotification({ ...notification, ...details });
      setIsDetailOpen(true);
    } catch {
      toast.error('Failed to load notification details');
    }
  }, []);

  const handleSendTestEmail = useCallback(async () => {
    if (!testEmailAddress) {
      toast.error('Please enter an email address');
      return;
    }
    try {
      await sendTestEmailMutation.mutateAsync(testEmailAddress);
      setIsTestEmailOpen(false);
      setTestEmailAddress('');
      refetch();
    } catch {
      // Error handled in mutation
    }
  }, [testEmailAddress, sendTestEmailMutation, refetch]);

  // Pagination
  const notifications = notificationsData?.data || [];
  const pagination = notificationsData?.pagination;
  const totalElements = pagination?.totalElements || 0;
  const totalPages = pagination?.totalPages || 0;
  const currentPage = filters.page || 0;

  return (
    <div className="container max-w-7xl py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email Notifications</h1>
          <p className="text-muted-foreground">
            Monitor email delivery and manage notification settings
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsTestEmailOpen(true)}>
            <Send className="mr-2 h-4 w-4" />
            Send Test Email
          </Button>
          <Link href="/settings/notifications/settings">
            <Button>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} isLoading={statsLoading} />

      {/* Notifications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Log</CardTitle>
          <CardDescription>
            {totalElements} total notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by recipient email..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select
              value={filters.status || 'ALL'}
              onValueChange={handleStatusFilter}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                {Object.values(EmailNotificationStatus).map((status) => (
                  <SelectItem key={status} value={status}>
                    {NOTIFICATION_STATUS_CONFIG[status].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.type || 'ALL'}
              onValueChange={handleTypeFilter}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Notification Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                {Object.values(NotificationType).map((type) => (
                  <SelectItem key={type} value={type}>
                    {formatNotificationType(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Table */}
          {isLoading ? (
            <LoadingSkeleton />
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No notifications found</h3>
              <p className="text-muted-foreground">
                {searchTerm || filters.status || filters.type
                  ? 'Try adjusting your filters'
                  : 'Notifications will appear here when sent'}
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notifications.map((notification) => (
                      <TableRow
                        key={notification.id}
                        className={
                          notification.status === EmailNotificationStatus.FAILED
                            ? 'bg-red-50 dark:bg-red-950/20'
                            : ''
                        }
                      >
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">
                              {notification.recipientName || 'Unknown'}
                            </div>
                            <div className="text-muted-foreground">
                              {notification.recipientEmail}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {NOTIFICATION_CATEGORIES[notification.notificationType]}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {notification.subject}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(notification.status)}>
                            {NOTIFICATION_STATUS_CONFIG[notification.status].label}
                          </Badge>
                          {notification.retryCount > 0 && (
                            <span className="ml-1 text-xs text-muted-foreground">
                              (retry {notification.retryCount}/3)
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {notification.sentAt
                            ? format(new Date(notification.sentAt), 'MMM d, HH:mm')
                            : format(new Date(notification.createdAt), 'MMM d, HH:mm')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(notification)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {notification.status === EmailNotificationStatus.FAILED && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRetry(notification.id)}
                                disabled={retryMutation.isPending}
                              >
                                {retryMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <RefreshCw className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {currentPage * (filters.size || 20) + 1} to{' '}
                  {Math.min((currentPage + 1) * (filters.size || 20), totalElements)} of{' '}
                  {totalElements} notifications
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, page: Math.max(0, currentPage - 1) }))
                    }
                    disabled={currentPage === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        page: Math.min(totalPages - 1, currentPage + 1),
                      }))
                    }
                    disabled={currentPage >= totalPages - 1}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Notification Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Notification Details</DialogTitle>
            <DialogDescription>
              {selectedNotification?.subject}
            </DialogDescription>
          </DialogHeader>
          {selectedNotification && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Recipient</p>
                  <p className="font-medium">{selectedNotification.recipientEmail}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant={getStatusBadgeVariant(selectedNotification.status)}>
                    {NOTIFICATION_STATUS_CONFIG[selectedNotification.status].label}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Type</p>
                  <p className="font-medium">
                    {formatNotificationType(selectedNotification.notificationType)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p className="font-medium">
                    {format(new Date(selectedNotification.createdAt), 'MMM d, yyyy HH:mm')}
                  </p>
                </div>
                {selectedNotification.sentAt && (
                  <div>
                    <p className="text-muted-foreground">Sent At</p>
                    <p className="font-medium">
                      {format(new Date(selectedNotification.sentAt), 'MMM d, yyyy HH:mm')}
                    </p>
                  </div>
                )}
                {selectedNotification.failedAt && (
                  <div>
                    <p className="text-muted-foreground">Failed At</p>
                    <p className="font-medium text-red-600">
                      {format(new Date(selectedNotification.failedAt), 'MMM d, yyyy HH:mm')}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">Retry Count</p>
                  <p className="font-medium">{selectedNotification.retryCount} / 3</p>
                </div>
              </div>
              {selectedNotification.status === EmailNotificationStatus.FAILED && (
                <div className="rounded-md bg-red-50 dark:bg-red-950/20 p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-800 dark:text-red-200">
                        Delivery Failed
                      </p>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                        {(selectedNotification as unknown as { failureReason?: string }).failureReason ||
                          'Unknown error occurred'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {selectedNotification.status === EmailNotificationStatus.FAILED && (
                <div className="flex justify-end">
                  <Button
                    onClick={() => {
                      handleRetry(selectedNotification.id);
                      setIsDetailOpen(false);
                    }}
                    disabled={retryMutation.isPending}
                  >
                    {retryMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    Retry Notification
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Send Test Email Dialog */}
      <Dialog open={isTestEmailOpen} onOpenChange={setIsTestEmailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
            <DialogDescription>
              Send a test email to verify your email configuration is working correctly.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="testEmail" className="text-sm font-medium">
                Email Address
              </label>
              <Input
                id="testEmail"
                type="email"
                placeholder="your@email.com"
                value={testEmailAddress}
                onChange={(e) => setTestEmailAddress(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsTestEmailOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSendTestEmail}
                disabled={sendTestEmailMutation.isPending || !testEmailAddress}
              >
                {sendTestEmailMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Send Test Email
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
