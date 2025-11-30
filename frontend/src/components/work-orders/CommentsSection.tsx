'use client';

/**
 * Comments Section Component
 * Story 4.1: Work Order Creation and Management
 * Displays comments and provides add comment functionality
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, formatDistanceToNow } from 'date-fns';
import { Loader2, Send } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { addWorkOrderComment } from '@/services/work-orders.service';
import { addCommentSchema, type AddCommentFormData } from '@/schemas/workOrderSchemas';
import type { WorkOrderComment } from '@/types/work-orders';

interface CommentsSectionProps {
  workOrderId: string;
  comments: WorkOrderComment[];
  onCommentAdded?: () => void;
}

export function CommentsSection({ workOrderId, comments, onCommentAdded }: CommentsSectionProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AddCommentFormData>({
    resolver: zodResolver(addCommentSchema),
    defaultValues: {
      commentText: '',
    },
  });

  const watchedCommentText = form.watch('commentText');

  const onSubmit = async (data: AddCommentFormData) => {
    try {
      setIsSubmitting(true);
      await addWorkOrderComment(workOrderId, { commentText: data.commentText });

      toast({
        title: 'Success',
        description: 'Comment added successfully',
        variant: 'success',
      });

      form.reset();

      // Notify parent to refresh comments
      if (onCommentAdded) {
        onCommentAdded();
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error?.message || 'Failed to add comment',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comments</CardTitle>
        <CardDescription>
          {comments.length === 0
            ? 'No comments yet. Be the first to add a comment.'
            : `${comments.length} comment${comments.length !== 1 ? 's' : ''}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Existing Comments */}
        {comments.length > 0 && (
          <div className="space-y-4">
            {comments.map((comment, index) => (
              <div key={comment.id}>
                <div className="flex gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{getInitials(comment.createdByName || 'Unknown')}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{comment.createdByName || 'Unknown User'}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                      </span>
                      {comment.isStatusChange && (
                        <Badge variant="outline" className="text-xs">
                          Status Change
                        </Badge>
                      )}
                    </div>
                    {comment.isStatusChange && comment.previousStatus && comment.newStatus && (
                      <div className="text-sm text-muted-foreground">
                        Changed status from{' '}
                        <Badge variant="outline" className="text-xs">
                          {comment.previousStatus}
                        </Badge>{' '}
                        to{' '}
                        <Badge variant="outline" className="text-xs">
                          {comment.newStatus}
                        </Badge>
                      </div>
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{comment.commentText}</p>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(comment.createdAt), 'dd MMM yyyy HH:mm')}
                    </div>
                  </div>
                </div>
                {index < comments.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </div>
        )}

        {/* Add Comment Form */}
        <div>
          {comments.length > 0 && <Separator className="mb-4" />}
          <div className="text-sm font-medium mb-3">Add a Comment</div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="form-add-comment">
              <FormField
                control={form.control}
                name="commentText"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Add a comment or note about this work order..."
                        className="resize-none"
                        rows={4}
                        {...field}
                        data-testid="textarea-comment"
                        maxLength={2000}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{watchedCommentText?.length || 0}/2000 characters</span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isSubmitting || !watchedCommentText?.trim()}
                  data-testid="btn-submit-comment"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Add Comment
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </CardContent>
    </Card>
  );
}
