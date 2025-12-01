'use client';

/**
 * Announcement List Page
 * Story 9.2: Internal Announcement Management
 * AC #27-34: Three-tab UI (Active, Drafts, History) with search and filtering
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { useToast } from '@/hooks/use-toast';
import {
  getAnnouncements,
  getAnnouncementStats,
  deleteAnnouncement,
  publishAnnouncement,
  archiveAnnouncement,
  copyAnnouncement,
} from '@/services/announcement.service';
import {
  AnnouncementListItem,
  AnnouncementStats,
} from '@/types/announcement';
import {
  Plus,
  Megaphone,
  FileText,
  Clock,
} from 'lucide-react';
import AnnouncementsDatatable from '@/components/announcements/AnnouncementsDatatable';

export default function AnnouncementsPage() {
  const router = useRouter();
  const { toast } = useToast();

  // State
  const [activeAnnouncements, setActiveAnnouncements] = useState<AnnouncementListItem[]>([]);
  const [draftAnnouncements, setDraftAnnouncements] = useState<AnnouncementListItem[]>([]);
  const [historyAnnouncements, setHistoryAnnouncements] = useState<AnnouncementListItem[]>([]);
  const [stats, setStats] = useState<AnnouncementStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'DRAFTS' | 'HISTORY'>('ACTIVE');

  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState<AnnouncementListItem | null>(null);

  // Fetch all announcements for each tab
  const fetchAllAnnouncements = useCallback(async () => {
    try {
      setIsLoading(true);

      // Fetch all tabs in parallel
      const [activeResponse, draftsResponse, historyResponse] = await Promise.all([
        getAnnouncements({ tab: 'ACTIVE', page: 0, size: 1000 }),
        getAnnouncements({ tab: 'DRAFTS', page: 0, size: 1000 }),
        getAnnouncements({ tab: 'HISTORY', page: 0, size: 1000 }),
      ]);

      setActiveAnnouncements(activeResponse.data || []);
      setDraftAnnouncements(draftsResponse.data || []);
      setHistoryAnnouncements(historyResponse.data || []);
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

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const statsData = await getAnnouncementStats();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchAllAnnouncements();
    fetchStats();
  }, [fetchAllAnnouncements, fetchStats]);

  // Handlers
  const handleCreateAnnouncement = () => {
    router.push('/announcements/new');
  };

  const handleViewAnnouncement = (id: string) => {
    router.push(`/announcements/${id}`);
  };

  const handleEditAnnouncement = (id: string) => {
    router.push(`/announcements/${id}?edit=true`);
  };

  const handlePublish = async (id: string) => {
    try {
      await publishAnnouncement(id);
      toast({
        title: 'Success',
        description: 'Announcement published successfully. Emails have been sent to all tenants.',
        variant: 'success',
      });
      fetchAllAnnouncements();
      fetchStats();
    } catch (error) {
      console.error('Failed to publish announcement:', error);
      toast({
        title: 'Error',
        description: 'Failed to publish announcement',
        variant: 'destructive',
      });
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await archiveAnnouncement(id);
      toast({
        title: 'Success',
        description: 'Announcement archived successfully',
        variant: 'success',
      });
      fetchAllAnnouncements();
      fetchStats();
    } catch (error) {
      console.error('Failed to archive announcement:', error);
      toast({
        title: 'Error',
        description: 'Failed to archive announcement',
        variant: 'destructive',
      });
    }
  };

  const handleCopy = async (id: string) => {
    try {
      const copied = await copyAnnouncement(id);
      toast({
        title: 'Success',
        description: 'Announcement copied. You can now edit the draft.',
        variant: 'success',
      });
      router.push(`/announcements/${copied.id}?edit=true`);
    } catch (error) {
      console.error('Failed to copy announcement:', error);
      toast({
        title: 'Error',
        description: 'Failed to copy announcement',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteClick = (announcement: AnnouncementListItem) => {
    setAnnouncementToDelete(announcement);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!announcementToDelete) return;

    try {
      await deleteAnnouncement(announcementToDelete.id);
      toast({
        title: 'Success',
        description: 'Announcement deleted successfully',
        variant: 'success',
      });
      fetchAllAnnouncements();
      fetchStats();
    } catch (error) {
      console.error('Failed to delete announcement:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete announcement',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setAnnouncementToDelete(null);
    }
  };

  // Get data for current tab
  const getCurrentTabData = () => {
    switch (activeTab) {
      case 'ACTIVE':
        return activeAnnouncements;
      case 'DRAFTS':
        return draftAnnouncements;
      case 'HISTORY':
        return historyAnnouncements;
      default:
        return [];
    }
  };

  // Summary cards
  const SummaryCards = () => (
    <div className="grid gap-4 md:grid-cols-2 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Announcements</CardTitle>
          <Megaphone className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {stats ? stats.activeCount : <Skeleton className="h-8 w-12" />}
          </div>
          <p className="text-xs text-muted-foreground">Currently visible to tenants</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Draft Announcements</CardTitle>
          <FileText className="h-4 w-4 text-gray-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats ? stats.draftCount : <Skeleton className="h-8 w-12" />}
          </div>
          <p className="text-xs text-muted-foreground">Pending publication</p>
        </CardContent>
      </Card>
    </div>
  );

  if (isLoading) {
    return (
      <div className="container mx-auto space-y-6" data-testid="announcements-page">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-44" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6" data-testid="announcements-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Megaphone className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
            <p className="text-muted-foreground">
              Manage internal announcements for tenants
            </p>
          </div>
        </div>
        <Button onClick={handleCreateAnnouncement} data-testid="create-announcement-btn">
          <Plus className="mr-2 h-4 w-4" />
          Create Announcement
        </Button>
      </div>

      {/* Summary Cards */}
      <SummaryCards />

      {/* Tabs and Content */}
      <Tabs value={activeTab} onValueChange={(tab) => setActiveTab(tab as 'ACTIVE' | 'DRAFTS' | 'HISTORY')}>
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="ACTIVE" className="flex items-center gap-2" data-testid="tab-active">
            <Megaphone className="h-4 w-4" />
            Active
          </TabsTrigger>
          <TabsTrigger value="DRAFTS" className="flex items-center gap-2" data-testid="tab-drafts">
            <FileText className="h-4 w-4" />
            Drafts
          </TabsTrigger>
          <TabsTrigger value="HISTORY" className="flex items-center gap-2" data-testid="tab-history">
            <Clock className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card className="py-0">
            <AnnouncementsDatatable
              data={getCurrentTabData()}
              onView={handleViewAnnouncement}
              onEdit={handleEditAnnouncement}
              onPublish={handlePublish}
              onArchive={handleArchive}
              onCopy={handleCopy}
              onDelete={handleDeleteClick}
            />
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Announcement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{announcementToDelete?.title}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
