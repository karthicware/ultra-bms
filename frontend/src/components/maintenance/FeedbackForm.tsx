/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

/**
 * Feedback Form Component
 * Story 3.5: Tenant Portal - Maintenance Request Submission
 *
 * Allows tenants to submit rating and feedback after request completion
 */

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Star, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { submitFeedbackSchema, type SubmitFeedbackFormData } from '@/lib/validations/maintenance';
import { submitMaintenanceRequestFeedback } from '@/services/maintenance.service';
import { cn } from '@/lib/utils';

interface FeedbackFormProps {
  requestId: string;
}

export function FeedbackForm({ requestId }: FeedbackFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);

  const form = useForm<SubmitFeedbackFormData>({
    resolver: zodResolver(submitFeedbackSchema),
    defaultValues: {
      rating: 0,
      comment: '',
    },
  });

  const rating = form.watch('rating');

  const onSubmit = async (data: SubmitFeedbackFormData) => {
    setIsSubmitting(true);

    try {
      await submitMaintenanceRequestFeedback(requestId, data);

      toast({
        title: 'Feedback submitted',
        description: 'Thank you for your feedback!',
        variant: 'success',
      });

      // Refresh request data
      queryClient.invalidateQueries({ queryKey: ['maintenance-request', requestId] });
    } catch (error: any) {
      toast({
        title: 'Failed to submit feedback',
        description: error.response?.data?.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rate this service</CardTitle>
        <CardDescription>
          How satisfied are you with the maintenance service?
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Star Rating */}
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Rating <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => field.onChange(star)}
                          onMouseEnter={() => setHoveredStar(star)}
                          onMouseLeave={() => setHoveredStar(0)}
                          className="focus:outline-none focus:ring-2 focus:ring-primary rounded"
                          data-testid={`star-${star}`}
                        >
                          <Star
                            className={cn(
                              'h-8 w-8 transition-colors',
                              star <= (hoveredStar || rating)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            )}
                          />
                        </button>
                      ))}
                      {rating > 0 && (
                        <span className="text-sm text-muted-foreground ml-2">
                          {rating} out of 5 stars
                        </span>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Click to rate your experience
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Comment */}
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comments (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Share your experience (optional)"
                      className="min-h-24 resize-none"
                      maxLength={500}
                      data-testid="textarea-feedback"
                    />
                  </FormControl>
                  <div className="flex justify-between items-center">
                    <FormDescription>
                      Help us improve our service
                    </FormDescription>
                    <span className="text-sm text-muted-foreground">
                      {field.value?.length || 0} / 500
                    </span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <Button type="submit" disabled={isSubmitting || rating === 0} data-testid="btn-submit-feedback">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
