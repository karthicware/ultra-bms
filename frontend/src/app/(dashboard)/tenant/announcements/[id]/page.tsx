'use client';

/**
 * Tenant Portal - Announcement Detail Page
 * Story 9.2: Internal Announcement Management
 * AC #40-49: Tenant view of single announcement with attachment download
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  getTenantAnnouncementById,
  getTenantAttachmentDownloadUrl,
} from '@/services/announcement.service';
import { TenantAnnouncement } from '@/types/announcement';
import {
  ArrowLeft,
  Megaphone,
  Paperclip,
  Download,
  Calendar,
  FileText,
} from 'lucide-react';

export default function TenantAnnouncementDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();

  const announcementId = params.id as string;

  const [announcement, setAnnouncement] = useState<TenantAnnouncement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  const fetchAnnouncement = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getTenantAnnouncementById(announcementId);
      setAnnouncement(data);
    } catch (error) {
      console.error('Failed to fetch announcement:', error);
      toast({
        title: 'Error',
        description: 'Failed to load announcement',
        variant: 'destructive',
      });
      router.push('/tenant/announcements');
    } finally {
      setIsLoading(false);
    }
  }, [announcementId, router, toast]);

  useEffect(() => {
    fetchAnnouncement();
  }, [fetchAnnouncement]);

  const handleDownloadAttachment = async () => {
    if (!announcement) return;

    try {
      setIsDownloading(true);
      const url = await getTenantAttachmentDownloadUrl(announcement.id);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Failed to download attachment:', error);
      toast({
        title: 'Error',
        description: 'Failed to download attachment',
        variant: 'destructive',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-32 mt-2" />
          </div>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!announcement) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/tenant/announcements')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Megaphone className="h-8 w-8 text-primary" />
            Announcement
          </h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Published on {format(new Date(announcement.publishedAt), 'EEEE, dd MMMM yyyy')}
          </p>
        </div>
      </div>

      {/* Announcement Content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{announcement.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Message */}
          <div
            className="prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: announcement.message }}
          />

          {/* Attachment */}
          {announcement.hasAttachment && (
            <>
              <Separator />
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-background rounded-lg">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {announcement.attachmentFileName || 'Attachment'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      PDF Document
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleDownloadAttachment}
                  disabled={isDownloading}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {isDownloading ? 'Downloading...' : 'Download'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Back button */}
      <Button
        variant="outline"
        onClick={() => router.push('/tenant/announcements')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Announcements
      </Button>
    </div>
  );
}
