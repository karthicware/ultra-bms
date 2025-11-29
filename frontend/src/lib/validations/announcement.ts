/**
 * Announcement Validation Schema
 * Story 9.2: Internal Announcement Management
 */

import { z } from 'zod';
import { AnnouncementTemplate } from '@/types/announcement';

/**
 * Create/Update Announcement Schema
 * AC #8: Title max 150 characters
 * AC #9: Message max 5000 characters
 * AC #10: Expiry date required and must be in future
 */
export const announcementFormSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(150, 'Title must be 150 characters or less'),
  message: z
    .string()
    .min(1, 'Message is required')
    .max(5000, 'Message must be 5000 characters or less'),
  templateUsed: z
    .nativeEnum(AnnouncementTemplate)
    .optional()
    .nullable(),
  expiresAt: z
    .string()
    .min(1, 'Expiry date is required')
    .refine((date) => {
      const expiryDate = new Date(date);
      const now = new Date();
      return expiryDate > now;
    }, 'Expiry date must be in the future'),
});

export type AnnouncementFormData = z.infer<typeof announcementFormSchema>;

/**
 * Default form values
 */
export const announcementFormDefaults: AnnouncementFormData = {
  title: '',
  message: '',
  templateUsed: undefined,
  expiresAt: '',
};

/**
 * Attachment validation
 * AC #7: PDF only, max 5MB
 */
export const validateAttachment = (file: File): { valid: boolean; error?: string } => {
  // Check file type
  if (file.type !== 'application/pdf') {
    return { valid: false, error: 'Only PDF files are allowed' };
  }

  // Check file size (5MB = 5 * 1024 * 1024 bytes)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 5MB' };
  }

  return { valid: true };
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
