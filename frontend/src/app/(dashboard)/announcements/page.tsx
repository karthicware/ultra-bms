'use client';

/**
 * Announcement List Page
 * Story 9.2: Internal Announcement Management
 * AC #27-34: Three-tab UI (Active, Drafts, History) with search and filtering
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { debounce } from 'lodash';
import { format } from 'date-fns';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  AnnouncementStatus,
  AnnouncementStats,
  AnnouncementFilter,
} from '@/types/announcement';
import {
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Send,
  Archive,
  Copy,
  MoreHorizontal,
  Megaphone,
  FileText,
  Clock,
  Paperclip,
  ArrowUpDown,
} from 'lucide-react';

// Status badge styling
function getStatusBadgeClass(status: AnnouncementStatus): string {
  switch (status) {
    case AnnouncementStatus.DRAFT:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    case AnnouncementStatus.PUBLISHED:
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case AnnouncementStatus.EXPIRED:
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
    case AnnouncementStatus.ARCHIVED:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getStatusLabel(status: AnnouncementStatus): string {
  switch (status) {
    case AnnouncementStatus.DRAFT:
      return 'Draft';
    case AnnouncementStatus.PUBLISHED:
      return 'Published';
    case AnnouncementStatus.EXPIRED:
      return 'Expired';
    case AnnouncementStatus.ARCHIVED:
      return 'Archived';
    default:
      return status;
  }
}

export default function AnnouncementsPage() {
  const router = useRouter();
  const { toast } = useToast();

  // State
  const [announcements, setAnnouncements] = useState<AnnouncementListItem[]>([]);
  const [stats, setStats] = useState<AnnouncementStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'DRAFTS' | 'HISTORY'>('ACTIVE');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState<AnnouncementListItem | null>(null);

  // Fetch announcements
  const fetchAnnouncements = useCallback(async () => {
    try {
      setIsLoading(true);

      const filters: AnnouncementFilter = {
        tab: activeTab,
        search: searchTerm || undefined,
        page: currentPage,
        size: pageSize,
        sortBy: sortField,
        sortDir: sortDirection,
      };

      const response = await getAnnouncements(filters);

      setAnnouncements(response.data || []);
      setTotalPages(response.pagination?.totalPages || 0);
      setTotalElements(response.pagination?.totalElements || 0);
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
      toast({
        title: 'Error',
        description: 'Failed to load announcements',
        variant: 'destructive',
      });
      setAnnouncements([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, currentPage, pageSize, searchTerm, sortField, sortDirection, toast]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const statsData = await getAnnouncementStats();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, []);

  // Debounced search
  const debouncedFetch = useMemo(
    () => debounce(fetchAnnouncements, 300),
    [fetchAnnouncements]
  );

  useEffect(() => {
    debouncedFetch();
    return () => debouncedFetch.cancel();
  }, [debouncedFetch]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

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

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(0);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as 'ACTIVE' | 'DRAFTS' | 'HISTORY');
    setCurrentPage(0);
    setSearchTerm('');
  };

  const handlePublish = async (id: string) => {
    try {
      await publishAnnouncement(id);
      toast({
        title: 'Success',
        description: 'Announcement published successfully. Emails have been sent to all tenants.',
        variant: 'success',
      });
      fetchAnnouncements();
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
      fetchAnnouncements();
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
      fetchAnnouncements();
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

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-12 w-full" />
        </div>
      ))}
    </div>
  );

  // Get available actions based on status
  const getRowActions = (announcement: AnnouncementListItem) => {
    const actions = [];

    // View is always available
    actions.push({
      label: 'View',
      icon: Eye,
      onClick: () => handleViewAnnouncement(announcement.id),
    });

    // Edit only for DRAFT
    if (announcement.status === AnnouncementStatus.DRAFT) {
      actions.push({
        label: 'Edit',
        icon: Edit,
        onClick: () => handleEditAnnouncement(announcement.id),
      });
      actions.push({
        label: 'Publish',
        icon: Send,
        onClick: () => handlePublish(announcement.id),
      });
    }

    // Archive for PUBLISHED or EXPIRED
    if (announcement.status === AnnouncementStatus.PUBLISHED ||
        announcement.status === AnnouncementStatus.EXPIRED) {
      actions.push({
        label: 'Archive',
        icon: Archive,
        onClick: () => handleArchive(announcement.id),
      });
    }

    // Copy is always available
    actions.push({
      label: 'Copy',
      icon: Copy,
      onClick: () => handleCopy(announcement.id),
    });

    // Delete only for DRAFT
    if (announcement.status === AnnouncementStatus.DRAFT) {
      actions.push({
        label: 'Delete',
        icon: Trash2,
        onClick: () => handleDeleteClick(announcement),
        variant: 'destructive' as const,
      });
    }

    return actions;
  };

  return (
    <div className="space-y-6" data-testid="announcements-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
          <p className="text-muted-foreground">
            Manage internal announcements for tenants
          </p>
        </div>
        <Button onClick={handleCreateAnnouncement} data-testid="create-announcement-btn">
          <Plus className="mr-2 h-4 w-4" />
          Create Announcement
        </Button>
      </div>

      {/* Summary Cards */}
      <SummaryCards />

      {/* Tabs and Content */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
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
          <Card>
            <CardHeader>
              <CardTitle>
                {activeTab === 'ACTIVE' && 'Active Announcements'}
                {activeTab === 'DRAFTS' && 'Draft Announcements'}
                {activeTab === 'HISTORY' && 'Announcement History'}
              </CardTitle>
              <CardDescription>
                {totalElements} announcements
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search */}
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by title or announcement number..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(0);
                    }}
                    data-testid="announcement-search-input"
                  />
                </div>
              </div>

              {/* Table */}
              {isLoading ? (
                <LoadingSkeleton />
              ) : announcements.length === 0 ? (
                <div className="text-center py-12">
                  <Megaphone className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No announcements found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm
                      ? 'Try adjusting your search'
                      : activeTab === 'DRAFTS'
                      ? 'Create a new announcement to get started'
                      : 'No announcements in this category'}
                  </p>
                  {!searchTerm && activeTab === 'DRAFTS' && (
                    <Button onClick={handleCreateAnnouncement} className="mt-4">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Announcement
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>
                            <Button
                              variant="ghost"
                              onClick={() => handleSort('announcementNumber')}
                              className="h-auto p-0 font-medium"
                            >
                              Number
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </Button>
                          </TableHead>
                          <TableHead>
                            <Button
                              variant="ghost"
                              onClick={() => handleSort('title')}
                              className="h-auto p-0 font-medium"
                            >
                              Title
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </Button>
                          </TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>
                            <Button
                              variant="ghost"
                              onClick={() => handleSort('expiresAt')}
                              className="h-auto p-0 font-medium"
                            >
                              Expires
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </Button>
                          </TableHead>
                          <TableHead>
                            <Button
                              variant="ghost"
                              onClick={() => handleSort('createdAt')}
                              className="h-auto p-0 font-medium"
                            >
                              Created
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </Button>
                          </TableHead>
                          <TableHead>Created By</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {announcements.map((announcement) => (
                          <TableRow key={announcement.id} data-testid={`announcement-row-${announcement.id}`}>
                            <TableCell className="font-medium">
                              {announcement.announcementNumber}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{announcement.title}</span>
                                {announcement.hasAttachment && (
                                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusBadgeClass(announcement.status)}>
                                {getStatusLabel(announcement.status)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {format(new Date(announcement.expiresAt), 'dd MMM yyyy')}
                            </TableCell>
                            <TableCell>
                              {format(new Date(announcement.createdAt), 'dd MMM yyyy')}
                            </TableCell>
                            <TableCell>
                              {announcement.createdByName || '-'}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {getRowActions(announcement).map((action) => (
                                    <div key={action.label}>
                                      {action.label === 'Delete' && <DropdownMenuSeparator />}
                                      <DropdownMenuItem
                                        onClick={action.onClick}
                                        className={action.variant === 'destructive' ? 'text-red-600' : ''}
                                      >
                                        <action.icon className="mr-2 h-4 w-4" />
                                        {action.label}
                                      </DropdownMenuItem>
                                    </div>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {currentPage * pageSize + 1} to{' '}
                      {Math.min((currentPage + 1) * pageSize, totalElements)} of{' '}
                      {totalElements} announcements
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                        disabled={currentPage === 0}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
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
