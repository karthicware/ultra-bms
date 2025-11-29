'use client';

/**
 * Announcement Detail/Edit Page
 * Story 9.2: Internal Announcement Management
 * AC #11-22: View, edit, publish, archive announcements
 */

import { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
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
import { useToast } from '@/hooks/use-toast';
import {
  getAnnouncementById,
  updateAnnouncement,
  publishAnnouncement,
  archiveAnnouncement,
  copyAnnouncement,
  deleteAnnouncement,
  uploadAttachment,
  deleteAttachment,
  getAttachmentDownloadUrl,
} from '@/services/announcement.service';
import {
  announcementFormSchema,
  validateAttachment,
  formatFileSize,
  type AnnouncementFormData,
} from '@/lib/validations/announcement';
import {
  Announcement,
  AnnouncementStatus,
} from '@/types/announcement';
import {
  ArrowLeft,
  Loader2,
  Send,
  Save,
  Edit,
  Archive,
  Copy,
  Trash2,
  FileText,
  Paperclip,
  X,
  Calendar,
  User,
  Clock,
  Download,
  Eye,
  CheckCircle,
} from 'lucide-react';

// Wrapper for Suspense
export default function AnnouncementDetailPage() {
  return (
    <Suspense fallback={<DetailPageSkeleton />}>
      <AnnouncementDetailContent />
    </Suspense>
  );
}

function DetailPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Skeleton className="h-96" />
        </div>
        <div>
          <Skeleton className="h-64" />
        </div>
      </div>
    </div>
  );
}

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

function AnnouncementDetailContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const announcementId = params.id as string;
  const isEditMode = searchParams.get('edit') === 'true';

  // State
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(isEditMode);
  const [newAttachment, setNewAttachment] = useState<File | null>(null);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);

  // Form setup
  const form = useForm<AnnouncementFormData>({
    resolver: zodResolver(announcementFormSchema),
    defaultValues: {
      title: '',
      message: '',
      templateUsed: undefined,
      expiresAt: '',
    },
  });

  const messageValue = form.watch('message');
  const titleValue = form.watch('title');

  // Fetch announcement
  const fetchAnnouncement = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getAnnouncementById(announcementId);
      setAnnouncement(data);

      // Populate form
      form.reset({
        title: data.title,
        message: data.message,
        templateUsed: data.templateUsed || undefined,
        expiresAt: format(new Date(data.expiresAt), 'yyyy-MM-dd'),
      });
    } catch (error) {
      console.error('Failed to fetch announcement:', error);
      toast({
        title: 'Error',
        description: 'Failed to load announcement',
        variant: 'destructive',
      });
      router.push('/announcements');
    } finally {
      setIsLoading(false);
    }
  }, [announcementId, form, router, toast]);

  useEffect(() => {
    fetchAnnouncement();
  }, [fetchAnnouncement]);

  // File handling
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateAttachment(file);
    if (!validation.valid) {
      toast({
        title: 'Invalid File',
        description: validation.error,
        variant: 'destructive',
      });
      return;
    }

    setNewAttachment(file);
  };

  const handleRemoveNewAttachment = () => {
    setNewAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteExistingAttachment = async () => {
    if (!announcement) return;

    try {
      await deleteAttachment(announcement.id);
      setAnnouncement({
        ...announcement,
        attachmentFilePath: undefined,
        attachmentFileName: undefined,
      });
      toast({
        title: 'Success',
        description: 'Attachment removed',
      });
    } catch (error) {
      console.error('Failed to delete attachment:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove attachment',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadAttachment = async () => {
    if (!announcement) return;

    try {
      const url = await getAttachmentDownloadUrl(announcement.id);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Failed to get download URL:', error);
      toast({
        title: 'Error',
        description: 'Failed to download attachment',
        variant: 'destructive',
      });
    }
  };

  // Form submit
  const onSubmit = async (data: AnnouncementFormData) => {
    if (!announcement) return;

    try {
      setIsSubmitting(true);

      await updateAnnouncement(announcement.id, {
        title: data.title,
        message: data.message,
        templateUsed: data.templateUsed || undefined,
        expiresAt: data.expiresAt,
      });

      // Upload new attachment if present
      if (newAttachment) {
        await uploadAttachment(announcement.id, newAttachment);
        setNewAttachment(null);
      }

      toast({
        title: 'Success',
        description: 'Announcement updated',
      });

      setIsEditing(false);
      fetchAnnouncement();
    } catch (error) {
      console.error('Failed to update announcement:', error);
      toast({
        title: 'Error',
        description: 'Failed to update announcement',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Actions
  const handlePublish = async () => {
    if (!announcement) return;

    try {
      setIsSubmitting(true);
      await publishAnnouncement(announcement.id);
      toast({
        title: 'Published!',
        description: 'Announcement published. Emails have been sent to all tenants.',
      });
      fetchAnnouncement();
    } catch (error) {
      console.error('Failed to publish:', error);
      toast({
        title: 'Error',
        description: 'Failed to publish announcement',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
      setShowPublishDialog(false);
    }
  };

  const handleArchive = async () => {
    if (!announcement) return;

    try {
      setIsSubmitting(true);
      await archiveAnnouncement(announcement.id);
      toast({
        title: 'Success',
        description: 'Announcement archived',
      });
      fetchAnnouncement();
    } catch (error) {
      console.error('Failed to archive:', error);
      toast({
        title: 'Error',
        description: 'Failed to archive announcement',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
      setShowArchiveDialog(false);
    }
  };

  const handleCopy = async () => {
    if (!announcement) return;

    try {
      const copied = await copyAnnouncement(announcement.id);
      toast({
        title: 'Success',
        description: 'Announcement copied. You can now edit the draft.',
      });
      router.push(`/announcements/${copied.id}?edit=true`);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast({
        title: 'Error',
        description: 'Failed to copy announcement',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!announcement) return;

    try {
      setIsSubmitting(true);
      await deleteAnnouncement(announcement.id);
      toast({
        title: 'Success',
        description: 'Announcement deleted',
      });
      router.push('/announcements');
    } catch (error) {
      console.error('Failed to delete:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete announcement',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
      setShowDeleteDialog(false);
    }
  };

  if (isLoading) {
    return <DetailPageSkeleton />;
  }

  if (!announcement) {
    return null;
  }

  const isDraft = announcement.status === AnnouncementStatus.DRAFT;
  const isPublished = announcement.status === AnnouncementStatus.PUBLISHED;
  const isExpired = announcement.status === AnnouncementStatus.EXPIRED;
  const canEdit = isDraft && isEditing;
  const hasAttachment = announcement.attachmentFilePath || newAttachment;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/announcements')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {announcement.announcementNumber}
              </h1>
              <Badge className={getStatusBadgeClass(announcement.status)}>
                {getStatusLabel(announcement.status)}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Created on {format(new Date(announcement.createdAt), 'dd MMM yyyy')}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {isDraft && !isEditing && (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
          {isDraft && (
            <Button onClick={() => setShowPublishDialog(true)}>
              <Send className="mr-2 h-4 w-4" />
              Publish
            </Button>
          )}
          {(isPublished || isExpired) && (
            <Button variant="outline" onClick={() => setShowArchiveDialog(true)}>
              <Archive className="mr-2 h-4 w-4" />
              Archive
            </Button>
          )}
          <Button variant="outline" onClick={handleCopy}>
            <Copy className="mr-2 h-4 w-4" />
            Copy
          </Button>
          {isDraft && (
            <Button
              variant="outline"
              className="text-red-600 hover:text-red-700"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {canEdit ? (
        // Edit Mode
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              {/* Content */}
              <div className="md:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Announcement Content</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title *</FormLabel>
                          <FormControl>
                            <Input maxLength={150} {...field} />
                          </FormControl>
                          <div className="flex justify-between">
                            <FormMessage />
                            <span className="text-xs text-muted-foreground">
                              {titleValue?.length || 0}/150
                            </span>
                          </div>
                        </FormItem>
                      )}
                    />

                    <Separator />

                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Message *</FormLabel>
                          <FormControl>
                            <Textarea
                              className="min-h-[300px] font-mono text-sm"
                              maxLength={5000}
                              {...field}
                            />
                          </FormControl>
                          <div className="flex justify-between">
                            <FormDescription>
                              Supports basic HTML tags for formatting
                            </FormDescription>
                            <span className="text-xs text-muted-foreground">
                              {messageValue?.length || 0}/5000
                            </span>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="expiresAt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expiry Date *</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              min={format(new Date(), 'yyyy-MM-dd')}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Paperclip className="h-5 w-5" />
                      Attachment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Existing attachment */}
                    {announcement.attachmentFileName && !newAttachment && (
                      <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="text-sm truncate">
                            {announcement.attachmentFileName}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleDownloadAttachment}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleDeleteExistingAttachment}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* New attachment */}
                    {newAttachment && (
                      <div className="flex items-center justify-between p-3 border rounded-lg bg-green-50 dark:bg-green-950">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-green-600" />
                          <div>
                            <p className="text-sm font-medium">{newAttachment.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(newAttachment.size)} (new)
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveNewAttachment}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    {/* Upload button */}
                    {!hasAttachment && (
                      <div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,application/pdf"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Paperclip className="mr-2 h-4 w-4" />
                          Add PDF
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="flex flex-col gap-2">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      fetchAnnouncement();
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </Form>
      ) : (
        // View Mode
        <div className="grid gap-6 md:grid-cols-3">
          {/* Content */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>{announcement.title}</CardTitle>
                {announcement.templateUsed && (
                  <Badge variant="outline" className="w-fit">
                    Template: {announcement.templateUsed.replace(/_/g, ' ')}
                  </Badge>
                )}
              </CardHeader>
              <CardContent>
                <div
                  className="prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: announcement.message }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Created by</p>
                    <p className="text-sm text-muted-foreground">
                      {announcement.createdByName || 'Unknown'}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Created</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(announcement.createdAt), 'dd MMM yyyy, HH:mm')}
                    </p>
                  </div>
                </div>

                {announcement.publishedAt && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <div>
                        <p className="text-sm font-medium">Published</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(announcement.publishedAt), 'dd MMM yyyy, HH:mm')}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Expires</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(announcement.expiresAt), 'dd MMM yyyy')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Attachment */}
            {announcement.attachmentFileName && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Paperclip className="h-4 w-4" />
                    Attachment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-4 w-4 flex-shrink-0" />
                      <span className="text-sm truncate">
                        {announcement.attachmentFileName}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDownloadAttachment}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Status info */}
            {isPublished && (
              <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
                <CardContent className="pt-6">
                  <div className="flex gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <div className="text-sm text-green-800 dark:text-green-200">
                      <p className="font-medium mb-1">Published</p>
                      <p>
                        This announcement is visible to all tenants in their portal.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {isDraft && (
              <Card className="border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
                <CardContent className="pt-6">
                  <div className="flex gap-3">
                    <Eye className="h-5 w-5 text-gray-600 flex-shrink-0" />
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      <p className="font-medium mb-1">Draft</p>
                      <p>
                        This announcement is not yet visible to tenants. Publish it
                        to send email notifications.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Publish Confirmation Dialog */}
      <AlertDialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish Announcement?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately make the announcement visible to all tenants and
              send email notifications to every active tenant. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePublish} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Publish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Announcement?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the announcement from active display in the tenant
              portal. It will still be accessible in the History tab.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Archive className="mr-2 h-4 w-4" />
              )}
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Announcement?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this draft announcement. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
