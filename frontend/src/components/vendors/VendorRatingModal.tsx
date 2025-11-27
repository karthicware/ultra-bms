'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { StarRatingInput, StarRatingDisplay } from './StarRatingInput';
import {
  vendorRatingSchema,
  type VendorRatingFormData,
  vendorRatingFormDefaults,
  calculateOverallScore,
  areAllScoresProvided,
  getRatingLabel,
  getRatingColorClass
} from '@/lib/validations/vendor-rating';
import { useSubmitRating, useUpdateRating, useWorkOrderRating } from '@/hooks/useVendorRatings';
import { cn } from '@/lib/utils';

/**
 * VendorRatingModal Component
 * Story 5.3: Vendor Performance Tracking and Rating
 *
 * Modal for rating a vendor after work order completion.
 * Features:
 * - 4 category ratings (Quality, Timeliness, Communication, Professionalism)
 * - Auto-calculated overall score
 * - Optional comments (max 500 chars)
 * - Edit mode for existing ratings (within 7 days)
 */

interface VendorRatingModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when modal should close */
  onOpenChange: (open: boolean) => void;
  /** Work order ID */
  workOrderId: string;
  /** Work order number for display */
  workOrderNumber: string;
  /** Vendor name for display */
  vendorName: string;
  /** Callback after successful submission */
  onSuccess?: () => void;
}

export function VendorRatingModal({
  open,
  onOpenChange,
  workOrderId,
  workOrderNumber,
  vendorName,
  onSuccess
}: VendorRatingModalProps) {
  // Check for existing rating
  const { data: existingRating, isLoading: isLoadingRating } = useWorkOrderRating(
    workOrderId,
    open
  );

  const isEditMode = !!existingRating;
  const canEdit = existingRating?.canUpdate ?? true;

  // Mutations
  const { mutate: submitRating, isPending: isSubmitting } = useSubmitRating();
  const { mutate: updateRating, isPending: isUpdating } = useUpdateRating();

  const isPending = isSubmitting || isUpdating;

  // Form setup
  const form = useForm<VendorRatingFormData>({
    resolver: zodResolver(vendorRatingSchema),
    defaultValues: vendorRatingFormDefaults
  });

  const { watch, setValue, handleSubmit, reset, formState: { errors } } = form;

  // Watch all scores for overall calculation
  const qualityScore = watch('qualityScore');
  const timelinessScore = watch('timelinessScore');
  const communicationScore = watch('communicationScore');
  const professionalismScore = watch('professionalismScore');
  const comments = watch('comments');

  // Calculate overall score
  const allScoresProvided = areAllScoresProvided({
    qualityScore,
    timelinessScore,
    communicationScore,
    professionalismScore,
    comments
  });

  const overallScore = allScoresProvided
    ? calculateOverallScore(qualityScore, timelinessScore, communicationScore, professionalismScore)
    : 0;

  // Reset form when modal opens/closes or existing rating loads
  useEffect(() => {
    if (open && existingRating) {
      reset({
        qualityScore: existingRating.qualityScore,
        timelinessScore: existingRating.timelinessScore,
        communicationScore: existingRating.communicationScore,
        professionalismScore: existingRating.professionalismScore,
        comments: existingRating.comments || ''
      });
    } else if (!open) {
      reset(vendorRatingFormDefaults);
    }
  }, [open, existingRating, reset]);

  const onSubmit = (data: VendorRatingFormData) => {
    const payload = {
      workOrderId,
      data: {
        qualityScore: data.qualityScore,
        timelinessScore: data.timelinessScore,
        communicationScore: data.communicationScore,
        professionalismScore: data.professionalismScore,
        comments: data.comments || undefined
      }
    };

    const mutationFn = isEditMode ? updateRating : submitRating;

    mutationFn(payload, {
      onSuccess: () => {
        onOpenChange(false);
        onSuccess?.();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[500px]"
        data-testid="vendor-rating-modal"
      >
        <DialogHeader>
          <DialogTitle data-testid="vendor-rating-modal-title">
            {isEditMode ? 'Update Vendor Rating' : 'Rate Vendor'}
          </DialogTitle>
          <DialogDescription data-testid="vendor-rating-modal-description">
            {isEditMode
              ? `Update your rating for ${vendorName} on work order ${workOrderNumber}`
              : `Rate ${vendorName}'s performance on work order ${workOrderNumber}`}
          </DialogDescription>
        </DialogHeader>

        {isLoadingRating ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : isEditMode && !canEdit ? (
          <div className="py-6 text-center">
            <p className="text-muted-foreground">
              This rating can no longer be edited (7-day window has passed).
            </p>
            <div className="mt-4">
              <StarRatingDisplay
                value={existingRating?.overallScore ?? 0}
                size="lg"
                showValue
                testIdPrefix="existing-rating"
              />
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Rating Categories */}
            <div className="space-y-4">
              <StarRatingInput
                label="Quality of Work"
                value={qualityScore}
                onChange={(v) => setValue('qualityScore', v, { shouldValidate: true })}
                disabled={isPending}
                testIdPrefix="input-quality"
              />
              {errors.qualityScore && (
                <p className="text-sm text-destructive">{errors.qualityScore.message}</p>
              )}

              <StarRatingInput
                label="Timeliness"
                value={timelinessScore}
                onChange={(v) => setValue('timelinessScore', v, { shouldValidate: true })}
                disabled={isPending}
                testIdPrefix="input-timeliness"
              />
              {errors.timelinessScore && (
                <p className="text-sm text-destructive">{errors.timelinessScore.message}</p>
              )}

              <StarRatingInput
                label="Communication"
                value={communicationScore}
                onChange={(v) => setValue('communicationScore', v, { shouldValidate: true })}
                disabled={isPending}
                testIdPrefix="input-communication"
              />
              {errors.communicationScore && (
                <p className="text-sm text-destructive">{errors.communicationScore.message}</p>
              )}

              <StarRatingInput
                label="Professionalism"
                value={professionalismScore}
                onChange={(v) => setValue('professionalismScore', v, { shouldValidate: true })}
                disabled={isPending}
                testIdPrefix="input-professionalism"
              />
              {errors.professionalismScore && (
                <p className="text-sm text-destructive">{errors.professionalismScore.message}</p>
              )}
            </div>

            {/* Overall Score Display */}
            <div
              className="p-4 bg-muted/50 rounded-lg"
              data-testid="overall-score-section"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Overall Score</span>
                <div className="flex items-center gap-2">
                  <StarRatingDisplay
                    value={overallScore}
                    size="md"
                    showValue
                    testIdPrefix="overall-score"
                  />
                  {allScoresProvided && (
                    <span
                      className={cn('text-sm font-medium', getRatingColorClass(overallScore))}
                      data-testid="overall-score-label"
                    >
                      {getRatingLabel(overallScore)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Comments */}
            <div className="space-y-2">
              <Label htmlFor="comments">Comments (Optional)</Label>
              <Textarea
                id="comments"
                placeholder="Share additional feedback about the vendor's performance..."
                value={comments || ''}
                onChange={(e) => setValue('comments', e.target.value)}
                disabled={isPending}
                maxLength={500}
                rows={3}
                data-testid="input-comments"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{errors.comments?.message}</span>
                <span data-testid="comments-char-count">
                  {(comments || '').length}/500
                </span>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
                data-testid="btn-cancel-rating"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending || !allScoresProvided}
                data-testid="btn-submit-rating"
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditMode ? 'Update Rating' : 'Submit Rating'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default VendorRatingModal;
