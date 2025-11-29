'use client';

/**
 * Tenant Portal - Announcements List Page
 * Story 9.2: Internal Announcement Management
 * AC #40-49: Tenant view of active announcements
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getTenantAnnouncements } from '@/services/announcement.service';
import { TenantAnnouncement } from '@/types/announcement';
import {
  Megaphone,
  Paperclip,
  ArrowRight,
  FileText,
  Calendar,
} from 'lucide-react';

export default function TenantAnnouncementsPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [announcements, setAnnouncements] = useState<TenantAnnouncement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnnouncements = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getTenantAnnouncements();
      setAnnouncements(data);
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
      toast({
        title: 'Error',
        description: 'Failed to load announcements',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleViewAnnouncement = (id: string) => {
    router.push(`/tenant/announcements/${id}`);
  };

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/4 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
        <p className="text-muted-foreground">
          Important notices from property management
        </p>
      </div>

      {/* Announcements List */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : announcements.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Megaphone className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No Announcements</h3>
              <p className="text-muted-foreground">
                There are no active announcements at this time.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <Card
              key={announcement.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleViewAnnouncement(announcement.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Megaphone className="h-5 w-5 text-primary" />
                      {announcement.title}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(announcement.publishedAt), 'dd MMM yyyy')}
                      </span>
                      {announcement.hasAttachment && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Paperclip className="h-3 w-3" />
                          Attachment
                        </Badge>
                      )}
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Show truncated message preview */}
                <div
                  className="text-sm text-muted-foreground line-clamp-3"
                  dangerouslySetInnerHTML={{
                    __html: announcement.message.substring(0, 200) + (announcement.message.length > 200 ? '...' : ''),
                  }}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
