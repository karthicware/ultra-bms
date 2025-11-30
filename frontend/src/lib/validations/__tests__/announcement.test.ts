/**
 * Tests for Announcement Validation Schema
 * Story 9.2: Internal Announcement Management
 * AC #74-75: Frontend validation tests
 */

import {
  announcementFormSchema,
  announcementFormDefaults,
  validateAttachment,
  formatFileSize,
} from '../announcement';

describe('announcementFormSchema', () => {
  describe('title validation', () => {
    it('should require title', () => {
      const result = announcementFormSchema.safeParse({
        ...announcementFormDefaults,
        title: '',
        message: 'Test message',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Title is required');
      }
    });

    it('should accept valid title', () => {
      const result = announcementFormSchema.safeParse({
        title: 'Valid Announcement Title',
        message: 'Test message',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      });

      expect(result.success).toBe(true);
    });

    it('should reject title over 200 characters (AC #8)', () => {
      const longTitle = 'A'.repeat(201);
      const result = announcementFormSchema.safeParse({
        ...announcementFormDefaults,
        title: longTitle,
        message: 'Test message',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Title must be 200 characters or less');
      }
    });

    it('should accept title at exactly 200 characters', () => {
      const exactTitle = 'A'.repeat(200);
      const result = announcementFormSchema.safeParse({
        title: exactTitle,
        message: 'Test message',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      });

      expect(result.success).toBe(true);
    });
  });

  describe('message validation', () => {
    it('should require message', () => {
      const result = announcementFormSchema.safeParse({
        ...announcementFormDefaults,
        title: 'Test Title',
        message: '',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Message is required');
      }
    });

    it('should accept valid message', () => {
      const result = announcementFormSchema.safeParse({
        title: 'Test Title',
        message: '<p>This is a valid announcement message.</p>',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      });

      expect(result.success).toBe(true);
    });

    it('should reject message over 5000 characters (AC #9)', () => {
      const longMessage = 'A'.repeat(5001);
      const result = announcementFormSchema.safeParse({
        ...announcementFormDefaults,
        title: 'Test Title',
        message: longMessage,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Message must be 5000 characters or less');
      }
    });

    it('should accept message at exactly 5000 characters', () => {
      const exactMessage = 'A'.repeat(5000);
      const result = announcementFormSchema.safeParse({
        title: 'Test Title',
        message: exactMessage,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      });

      expect(result.success).toBe(true);
    });

    it('should accept HTML content in message', () => {
      const htmlMessage = '<p><strong>Bold text</strong> and <em>italic</em></p><ul><li>Item 1</li></ul>';
      const result = announcementFormSchema.safeParse({
        title: 'Test Title',
        message: htmlMessage,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      });

      expect(result.success).toBe(true);
    });
  });

  describe('expiresAt validation', () => {
    it('should require expiry date', () => {
      const result = announcementFormSchema.safeParse({
        ...announcementFormDefaults,
        title: 'Test Title',
        message: 'Test message',
        expiresAt: '',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Expiry date is required');
      }
    });

    it('should reject past expiry date (AC #10)', () => {
      const pastDate = new Date(Date.now() - 86400000).toISOString();
      const result = announcementFormSchema.safeParse({
        title: 'Test Title',
        message: 'Test message',
        expiresAt: pastDate,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Expiry date must be in the future');
      }
    });

    it('should accept future expiry date', () => {
      const futureDate = new Date(Date.now() + 86400000 * 30).toISOString(); // 30 days from now
      const result = announcementFormSchema.safeParse({
        title: 'Test Title',
        message: 'Test message',
        expiresAt: futureDate,
      });

      expect(result.success).toBe(true);
    });
  });

  describe('templateUsed validation', () => {
    it('should accept undefined template', () => {
      const result = announcementFormSchema.safeParse({
        title: 'Test Title',
        message: 'Test message',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        templateUsed: undefined,
      });

      expect(result.success).toBe(true);
    });

    it('should accept null template', () => {
      const result = announcementFormSchema.safeParse({
        title: 'Test Title',
        message: 'Test message',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        templateUsed: null,
      });

      expect(result.success).toBe(true);
    });

    it('should accept valid template value', () => {
      const result = announcementFormSchema.safeParse({
        title: 'Test Title',
        message: 'Test message',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        templateUsed: 'OFFICE_CLOSURE',
      });

      expect(result.success).toBe(true);
    });
  });
});

describe('validateAttachment', () => {
  describe('file type validation (AC #7)', () => {
    it('should accept PDF files', () => {
      const file = new File(['test content'], 'document.pdf', { type: 'application/pdf' });
      const result = validateAttachment(file);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject non-PDF files', () => {
      const file = new File(['test content'], 'image.png', { type: 'image/png' });
      const result = validateAttachment(file);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Only PDF files are allowed');
    });

    it('should reject Word documents', () => {
      const file = new File(['test content'], 'document.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const result = validateAttachment(file);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Only PDF files are allowed');
    });

    it('should reject Excel files', () => {
      const file = new File(['test content'], 'spreadsheet.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const result = validateAttachment(file);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Only PDF files are allowed');
    });
  });

  describe('file size validation (AC #7)', () => {
    it('should accept files under 5MB', () => {
      const content = new Uint8Array(4 * 1024 * 1024); // 4MB
      const file = new File([content], 'small.pdf', { type: 'application/pdf' });
      const result = validateAttachment(file);

      expect(result.valid).toBe(true);
    });

    it('should accept files at exactly 5MB', () => {
      const content = new Uint8Array(5 * 1024 * 1024); // 5MB
      const file = new File([content], 'exact.pdf', { type: 'application/pdf' });
      const result = validateAttachment(file);

      expect(result.valid).toBe(true);
    });

    it('should reject files over 5MB', () => {
      const content = new Uint8Array(5 * 1024 * 1024 + 1); // 5MB + 1 byte
      const file = new File([content], 'large.pdf', { type: 'application/pdf' });
      const result = validateAttachment(file);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('File size must be less than 5MB');
    });
  });
});

describe('formatFileSize', () => {
  it('should format 0 bytes', () => {
    expect(formatFileSize(0)).toBe('0 Bytes');
  });

  it('should format bytes', () => {
    expect(formatFileSize(500)).toBe('500 Bytes');
  });

  it('should format kilobytes', () => {
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1536)).toBe('1.5 KB');
  });

  it('should format megabytes', () => {
    expect(formatFileSize(1024 * 1024)).toBe('1 MB');
    expect(formatFileSize(2.5 * 1024 * 1024)).toBe('2.5 MB');
  });

  it('should format gigabytes', () => {
    expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
  });

  it('should round to 2 decimal places', () => {
    expect(formatFileSize(1024 * 1024 * 1.234)).toBe('1.23 MB');
  });
});

describe('announcementFormDefaults', () => {
  it('should have correct default values', () => {
    expect(announcementFormDefaults).toEqual({
      title: '',
      message: '',
      templateUsed: undefined,
      expiresAt: '',
    });
  });
});
