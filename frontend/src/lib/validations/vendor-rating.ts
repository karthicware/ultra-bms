/**
 * Vendor Rating Validation Schemas
 * Story 5.3: Vendor Performance Tracking and Rating
 *
 * Zod schemas for form validation following React Hook Form pattern
 */

import { z } from 'zod';

// ============================================================================
// RATING SCHEMAS
// ============================================================================

/**
 * Score validation (1-5 integer)
 */
const scoreSchema = z
  .number({ message: 'Rating is required' })
  .int({ message: 'Rating must be a whole number' })
  .min(1, 'Rating must be at least 1 star')
  .max(5, 'Rating cannot exceed 5 stars');

/**
 * Validation schema for vendor rating submission
 *
 * @example
 * ```typescript
 * const form = useForm({
 *   resolver: zodResolver(vendorRatingSchema),
 *   defaultValues: {
 *     qualityScore: 0,
 *     timelinessScore: 0,
 *     communicationScore: 0,
 *     professionalismScore: 0,
 *     comments: ''
 *   }
 * });
 * ```
 */
export const vendorRatingSchema = z.object({
  qualityScore: scoreSchema,
  timelinessScore: scoreSchema,
  communicationScore: scoreSchema,
  professionalismScore: scoreSchema,
  comments: z
    .string()
    .max(500, 'Comments must be less than 500 characters')
    .optional()
    .or(z.literal(''))
});

/**
 * Type inference from vendor rating schema
 */
export type VendorRatingFormData = z.infer<typeof vendorRatingSchema>;

/**
 * Default values for vendor rating form
 */
export const vendorRatingFormDefaults: VendorRatingFormData = {
  qualityScore: 0,
  timelinessScore: 0,
  communicationScore: 0,
  professionalismScore: 0,
  comments: ''
};

// ============================================================================
// FILTER SCHEMAS
// ============================================================================

/**
 * Validation schema for vendor ranking filters
 */
export const vendorRankingFilterSchema = z.object({
  category: z
    .string()
    .optional()
    .or(z.literal('')),

  dateFrom: z
    .string()
    .optional()
    .or(z.literal('')),

  dateTo: z
    .string()
    .optional()
    .or(z.literal('')),

  minRating: z
    .number()
    .min(0, 'Minimum rating must be at least 0')
    .max(5, 'Minimum rating cannot exceed 5')
    .optional()
    .nullable()
});

/**
 * Type inference from ranking filter schema
 */
export type VendorRankingFilterFormData = z.infer<typeof vendorRankingFilterSchema>;

/**
 * Default values for ranking filter form
 */
export const vendorRankingFilterDefaults: VendorRankingFilterFormData = {
  category: '',
  dateFrom: '',
  dateTo: '',
  minRating: null
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate overall score from individual ratings
 * Returns average of 4 category scores, rounded to 2 decimal places
 */
export function calculateOverallScore(
  quality: number,
  timeliness: number,
  communication: number,
  professionalism: number
): number {
  const sum = quality + timeliness + communication + professionalism;
  const average = sum / 4;
  return Math.round(average * 100) / 100;
}

/**
 * Validate that all required scores are provided
 */
export function areAllScoresProvided(data: VendorRatingFormData): boolean {
  return (
    data.qualityScore >= 1 &&
    data.timelinessScore >= 1 &&
    data.communicationScore >= 1 &&
    data.professionalismScore >= 1
  );
}

/**
 * Format rating for display
 * Converts numeric rating to string with 1 decimal place
 */
export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

/**
 * Get rating label based on score
 */
export function getRatingLabel(score: number): string {
  if (score >= 4.5) return 'Excellent';
  if (score >= 3.5) return 'Good';
  if (score >= 2.5) return 'Average';
  if (score >= 1.5) return 'Below Average';
  if (score >= 0.5) return 'Poor';
  return 'Not Rated';
}

/**
 * Get rating color class based on score
 */
export function getRatingColorClass(score: number): string {
  if (score >= 4.5) return 'text-green-600 dark:text-green-400';
  if (score >= 3.5) return 'text-blue-600 dark:text-blue-400';
  if (score >= 2.5) return 'text-yellow-600 dark:text-yellow-400';
  if (score >= 1.5) return 'text-orange-600 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
}
