'use client';

/**
 * Create Announcement Page
 * Story 9.2: Internal Announcement Management
 * AC #8-10: Form with title, message, expiry date, template selection
 */

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, addDays } from 'date-fns';
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
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
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
import { createAnnouncement, uploadAttachment } from '@/services/announcement.service';
import {
  announcementFormSchema,
  announcementFormDefaults,
  validateAttachment,
  formatFileSize,
  type AnnouncementFormData,
} from '@/lib/validations/announcement';
import {
  AnnouncementTemplate,
  TEMPLATE_CONTENT,
} from '@/types/announcement';
import {
  ArrowLeft,
  Loader2,
  Save,
  FileText,
  Paperclip,
  X,
  Calendar,
  AlertCircle,
} from 'lucide-react';

export default function CreateAnnouncementPage() {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [pendingTemplate, setPendingTemplate] = useState<AnnouncementTemplate | null>(null);

  // Form setup
  const form = useForm<AnnouncementFormData>({
    resolver: zodResolver(announcementFormSchema),
    defaultValues: {
      ...announcementFormDefaults,
      expiresAt: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    },
  });

  // Watch message length for character count
  const messageValue = form.watch('message');
  const titleValue = form.watch('title');

  // Handle template selection
  const handleTemplateChange = (template: string) => {
    if (template === 'none') {
      form.setValue('templateUsed', undefined);
      return;
    }

    const templateEnum = template as AnnouncementTemplate;
    const currentTitle = form.getValues('title');
    const currentMessage = form.getValues('message');

    // Check if there's existing content
    if (currentTitle || currentMessage) {
      setPendingTemplate(templateEnum);
      setShowTemplateDialog(true);
    } else {
      applyTemplate(templateEnum);
    }
  };

  const applyTemplate = (template: AnnouncementTemplate) => {
    const content = TEMPLATE_CONTENT[template];
    form.setValue('title', content.title);
    form.setValue('message', content.message);
    form.setValue('templateUsed', template);
    setShowTemplateDialog(false);
    setPendingTemplate(null);
  };

  const handleTemplateConfirm = () => {
    if (pendingTemplate) {
      applyTemplate(pendingTemplate);
    }
  };

  // Handle file selection
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

    setAttachment(file);
  };

  const handleRemoveAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Form submit
  const onSubmit = async (data: AnnouncementFormData) => {
    try {
      setIsSubmitting(true);

      // Create announcement as draft
      const announcement = await createAnnouncement({
        title: data.title,
        message: data.message,
        templateUsed: data.templateUsed || undefined,
        expiresAt: data.expiresAt,
      });

      // Upload attachment if present
      if (attachment) {
        try {
          await uploadAttachment(announcement.id, attachment);
        } catch (uploadError) {
          console.error('Failed to upload attachment:', uploadError);
          toast({
            title: 'Warning',
            description: 'Announcement created but attachment upload failed. You can try again later.',
            variant: 'warning',
          });
        }
      }

      toast({
        title: 'Success',
        description: 'Announcement created as draft',
        variant: 'success',
      });

      router.push(`/announcements/${announcement.id}`);
    } catch (error) {
      console.error('Failed to create announcement:', error);
      toast({
        title: 'Error',
        description: 'Failed to create announcement',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Announcement</h1>
          <p className="text-muted-foreground">
            Create a new announcement for tenants
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Main Content - Left Side */}
            <div className="md:col-span-2 space-y-6">
              {/* Template Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Template
                  </CardTitle>
                  <CardDescription>
                    Start with a pre-defined template or create from scratch
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="templateUsed"
                    render={({ field }) => (
                      <FormItem>
                        <Select
                          value={field.value || 'none'}
                          onValueChange={handleTemplateChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a template (optional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No Template (Start from scratch)</SelectItem>
                            <SelectItem value={AnnouncementTemplate.OFFICE_CLOSURE}>
                              Office Closure Notice
                            </SelectItem>
                            <SelectItem value={AnnouncementTemplate.MAINTENANCE_SCHEDULE}>
                              Scheduled Maintenance Notice
                            </SelectItem>
                            <SelectItem value={AnnouncementTemplate.POLICY_UPDATE}>
                              Policy Update Notice
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Templates provide pre-formatted content with placeholders
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Content */}
              <Card>
                <CardHeader>
                  <CardTitle>Announcement Content</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Title */}
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter announcement title"
                            maxLength={200}
                            data-testid="announcement-title-input"
                            {...field}
                          />
                        </FormControl>
                        <div className="flex justify-between">
                          <FormMessage />
                          <span className="text-xs text-muted-foreground">
                            {titleValue?.length || 0}/200
                          </span>
                        </div>
                      </FormItem>
                    )}
                  />

                  <Separator />

                  {/* Message */}
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message *</FormLabel>
                        <FormControl>
                          <RichTextEditor
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Write your announcement message here..."
                            minHeight="300px"
                            maxLength={5000}
                            data-testid="announcement-message-editor"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Right Side */}
            <div className="space-y-6">
              {/* Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Expiry Date */}
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
                        <FormDescription>
                          Announcement will auto-expire after this date
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  {/* Quick expiry options */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Quick set:</p>
                    <div className="flex flex-wrap gap-2">
                      {[7, 14, 30, 60, 90].map((days) => (
                        <Badge
                          key={days}
                          variant="outline"
                          className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                          onClick={() => {
                            form.setValue('expiresAt', format(addDays(new Date(), days), 'yyyy-MM-dd'));
                          }}
                        >
                          {days} days
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Attachment */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Paperclip className="h-5 w-5" />
                    Attachment
                  </CardTitle>
                  <CardDescription>
                    PDF only, max 5MB
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {attachment ? (
                    <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="h-4 w-4 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {attachment.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(attachment.size)}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveAttachment}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
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
                        Add PDF Attachment
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Info */}
              <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
                <CardContent className="pt-6">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <div className="text-sm text-blue-800 dark:text-blue-200">
                      <p className="font-medium mb-1">Draft Mode</p>
                      <p>
                        This announcement will be saved as a draft. You can review
                        and publish it later to send emails to all tenants.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save as Draft
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </form>
      </Form>

      {/* Template Confirmation Dialog */}
      <AlertDialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace Content?</AlertDialogTitle>
            <AlertDialogDescription>
              Applying this template will replace your current title and message content.
              Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingTemplate(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleTemplateConfirm}>
              Apply Template
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
