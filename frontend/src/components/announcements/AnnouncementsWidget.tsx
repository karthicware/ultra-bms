'use client';

/**
 * Announcements Widget Component
 * Story 9.2: Internal Announcement Management
 * AC #64-70: Dashboard widget showing latest announcements
 *
 * Can be used in both admin dashboard and tenant portal
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  getAnnouncements,
  getAnnouncementStats,
  getTenantAnnouncements,
} from '@/services/announcement.service';
import {
  AnnouncementListItem,
  AnnouncementStats,
  TenantAnnouncement,
} from '@/types/announcement';
import {
  Megaphone,
  Paperclip,
  ArrowRight,
  FileText,
  Plus,
} from 'lucide-react';

interface AnnouncementsWidgetProps {
  /** Whether this is for tenant portal (uses tenant API) */
  isTenantView?: boolean;
  /** Maximum number of announcements to show */
  maxItems?: number;
}

export function AnnouncementsWidget({
  isTenantView = false,
  maxItems = 5,
}: AnnouncementsWidgetProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [announcements, setAnnouncements] = useState<(AnnouncementListItem | TenantAnnouncement)[]>([]);
  const [stats, setStats] = useState<AnnouncementStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);

      if (isTenantView) {
        // Tenant view - fetch active announcements
        const data = await getTenantAnnouncements();
        setAnnouncements(data.slice(0, maxItems));
      } else {
        // Admin view - fetch active + stats
        const [announcementsResponse, statsData] = await Promise.all([
          getAnnouncements({ tab: 'ACTIVE', size: maxItems }),
          getAnnouncementStats(),
        ]);
        setAnnouncements(announcementsResponse.data || []);
        setStats(statsData);
      }
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
      // Don't show toast - widget should fail silently
    } finally {
      setIsLoading(false);
    }
  }, [isTenantView, maxItems]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleViewAll = () => {
    router.push(isTenantView ? '/tenant/announcements' : '/announcements');
  };

  const handleCreateNew = () => {
    router.push('/announcements/new');
  };

  const handleViewAnnouncement = (id: string) => {
    router.push(isTenantView ? `/tenant/announcements/${id}` : `/announcements/${id}`);
  };

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-9 w-20" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Megaphone className="h-5 w-5 text-primary" />
            Announcements
          </CardTitle>
          {stats && !isTenantView && (
            <CardDescription>
              {stats.activeCount} active
              {stats.draftCount > 0 && ` · ${stats.draftCount} drafts`}
            </CardDescription>
          )}
        </div>
        <div className="flex gap-2">
          {!isTenantView && (
            <Button variant="outline" size="sm" onClick={handleCreateNew}>
              <Plus className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={handleViewAll}>
            View All
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {announcements.length === 0 ? (
          <div className="text-center py-6">
            <Megaphone className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              {isTenantView
                ? 'No announcements at this time'
                : 'No active announcements'}
            </p>
            {!isTenantView && (
              <Button
                variant="link"
                size="sm"
                className="mt-2"
                onClick={handleCreateNew}
              >
                Create your first announcement
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((announcement) => {
              // Determine if this is a tenant announcement (has publishedAt as required field)
              const isTenantAnnouncement = 'publishedAt' in announcement && typeof (announcement as TenantAnnouncement).publishedAt === 'string';
              const date = isTenantAnnouncement
                ? (announcement as TenantAnnouncement).publishedAt
                : (announcement as AnnouncementListItem).createdAt;
              const hasAttachment = isTenantAnnouncement
                ? (announcement as TenantAnnouncement).hasAttachment
                : (announcement as AnnouncementListItem).hasAttachment;

              return (
                <div
                  key={announcement.id}
                  className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleViewAnnouncement(announcement.id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Megaphone className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{announcement.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{format(new Date(date), 'dd MMM yyyy')}</span>
                        {hasAttachment && (
                          <span className="flex items-center gap-1">
                            <Paperclip className="h-3 w-3" />
                            PDF
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </div>
              );
            })}

            {announcements.length >= maxItems && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={handleViewAll}
              >
                View All Announcements
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
