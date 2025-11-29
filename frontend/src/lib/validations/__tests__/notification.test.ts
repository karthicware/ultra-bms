/**
 * Email Notification Validation Schema Tests
 * Story 9.1: Email Notification System
 * AC #43: Frontend unit tests for validation schemas
 */

import {
  sendEmailRequestSchema,
  updateSettingsRequestSchema,
  testEmailRequestSchema,
  notificationFilterSchema,
  validateSendEmailRequest,
  safeParseSendEmailRequest,
  validateUpdateSettingsRequest,
  safeParseUpdateSettingsRequest,
  validateTestEmailRequest,
  isValidEmail,
  formatNotificationType,
  formatFrequency,
  formatStatus,
  getStatusColor,
} from '@/lib/validations/notification';
import {
  EmailNotificationStatus,
  NotificationType,
  NotificationFrequency,
} from '@/types/notification';

describe('Email Notification Validation Schema', () => {
  // =================================================================
  // SEND EMAIL REQUEST SCHEMA TESTS
  // =================================================================

  describe('sendEmailRequestSchema', () => {
    const validSendEmailData = {
      notificationType: NotificationType.INVOICE_GENERATED,
      recipientEmail: 'test@example.com',
      recipientName: 'John Doe',
      subject: 'Test Subject',
      templateName: 'invoice-sent',
      variables: { invoiceNumber: 'INV-001' },
      entityType: 'Invoice',
      entityId: '123e4567-e89b-12d3-a456-426614174000',
    };

    it('should validate a complete send email request', () => {
      const result = sendEmailRequestSchema.safeParse(validSendEmailData);
      expect(result.success).toBe(true);
    });

    it('should validate minimal required fields', () => {
      const minimalData = {
        notificationType: NotificationType.PASSWORD_RESET_REQUESTED,
        recipientEmail: 'user@example.com',
        subject: 'Password Reset',
        templateName: 'password-reset',
      };

      const result = sendEmailRequestSchema.safeParse(minimalData);
      expect(result.success).toBe(true);
    });

    describe('recipientEmail validation', () => {
      it('should reject empty email', () => {
        const data = { ...validSendEmailData, recipientEmail: '' };
        const result = sendEmailRequestSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject invalid email format', () => {
        const data = { ...validSendEmailData, recipientEmail: 'invalid-email' };
        const result = sendEmailRequestSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject email without domain', () => {
        const data = { ...validSendEmailData, recipientEmail: 'test@' };
        const result = sendEmailRequestSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should accept valid email formats', () => {
        const validEmails = [
          'test@example.com',
          'user.name@domain.org',
          'user+tag@email.co.uk',
          'name123@test.io',
        ];

        validEmails.forEach((email) => {
          const data = { ...validSendEmailData, recipientEmail: email };
          const result = sendEmailRequestSchema.safeParse(data);
          expect(result.success).toBe(true);
        });
      });

      it('should normalize email to lowercase', () => {
        const data = { ...validSendEmailData, recipientEmail: 'TEST@EXAMPLE.COM' };
        const result = sendEmailRequestSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.recipientEmail).toBe('test@example.com');
        }
      });
    });

    describe('subject validation', () => {
      it('should reject empty subject', () => {
        const data = { ...validSendEmailData, subject: '' };
        const result = sendEmailRequestSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject subject exceeding 500 characters', () => {
        const data = { ...validSendEmailData, subject: 'a'.repeat(501) };
        const result = sendEmailRequestSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should accept subject up to 500 characters', () => {
        const data = { ...validSendEmailData, subject: 'a'.repeat(500) };
        const result = sendEmailRequestSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe('templateName validation', () => {
      it('should reject empty template name', () => {
        const data = { ...validSendEmailData, templateName: '' };
        const result = sendEmailRequestSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject template name exceeding 100 characters', () => {
        const data = { ...validSendEmailData, templateName: 'a'.repeat(101) };
        const result = sendEmailRequestSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    describe('notificationType validation', () => {
      it('should reject invalid notification type', () => {
        const data = { ...validSendEmailData, notificationType: 'INVALID_TYPE' };
        const result = sendEmailRequestSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should accept all valid notification types', () => {
        Object.values(NotificationType).forEach((type) => {
          const data = { ...validSendEmailData, notificationType: type };
          const result = sendEmailRequestSchema.safeParse(data);
          expect(result.success).toBe(true);
        });
      });
    });

    describe('entityId validation', () => {
      it('should accept valid UUID', () => {
        const data = {
          ...validSendEmailData,
          entityId: '123e4567-e89b-12d3-a456-426614174000',
        };
        const result = sendEmailRequestSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should reject invalid UUID format', () => {
        const data = { ...validSendEmailData, entityId: 'invalid-uuid' };
        const result = sendEmailRequestSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should accept undefined entityId', () => {
        const data = { ...validSendEmailData, entityId: undefined };
        const result = sendEmailRequestSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });
  });

  // =================================================================
  // UPDATE SETTINGS REQUEST SCHEMA TESTS
  // =================================================================

  describe('updateSettingsRequestSchema', () => {
    const validSettingsData = {
      notificationType: NotificationType.INVOICE_GENERATED,
      emailEnabled: true,
      frequency: NotificationFrequency.IMMEDIATE,
    };

    it('should validate complete update settings request', () => {
      const result = updateSettingsRequestSchema.safeParse(validSettingsData);
      expect(result.success).toBe(true);
    });

    it('should validate with only notificationType and emailEnabled', () => {
      const data = {
        notificationType: NotificationType.PAYMENT_RECEIVED,
        emailEnabled: false,
      };
      const result = updateSettingsRequestSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should validate with only notificationType and frequency', () => {
      const data = {
        notificationType: NotificationType.WORK_ORDER_ASSIGNED,
        frequency: NotificationFrequency.DAILY_DIGEST,
      };
      const result = updateSettingsRequestSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    describe('frequency validation', () => {
      it('should reject invalid frequency', () => {
        const data = { ...validSettingsData, frequency: 'INVALID_FREQUENCY' };
        const result = updateSettingsRequestSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should accept all valid frequencies', () => {
        Object.values(NotificationFrequency).forEach((freq) => {
          const data = { ...validSettingsData, frequency: freq };
          const result = updateSettingsRequestSchema.safeParse(data);
          expect(result.success).toBe(true);
        });
      });
    });

    describe('emailEnabled validation', () => {
      it('should accept boolean values', () => {
        [true, false].forEach((enabled) => {
          const data = { ...validSettingsData, emailEnabled: enabled };
          const result = updateSettingsRequestSchema.safeParse(data);
          expect(result.success).toBe(true);
        });
      });
    });
  });

  // =================================================================
  // TEST EMAIL REQUEST SCHEMA TESTS
  // =================================================================

  describe('testEmailRequestSchema', () => {
    it('should validate valid email address', () => {
      const data = { recipientEmail: 'admin@example.com' };
      const result = testEmailRequestSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const data = { recipientEmail: 'not-an-email' };
      const result = testEmailRequestSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject empty email', () => {
      const data = { recipientEmail: '' };
      const result = testEmailRequestSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  // =================================================================
  // NOTIFICATION FILTER SCHEMA TESTS
  // =================================================================

  describe('notificationFilterSchema', () => {
    it('should accept empty filter object', () => {
      const result = notificationFilterSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should apply default values', () => {
      const result = notificationFilterSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(0);
        expect(result.data.size).toBe(20);
        expect(result.data.sortBy).toBe('createdAt');
        expect(result.data.sortDir).toBe('desc');
      }
    });

    it('should validate status filter', () => {
      Object.values(EmailNotificationStatus).forEach((status) => {
        const result = notificationFilterSchema.safeParse({ status });
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid status', () => {
      const result = notificationFilterSchema.safeParse({ status: 'INVALID' });
      expect(result.success).toBe(false);
    });

    it('should validate type filter', () => {
      Object.values(NotificationType).forEach((type) => {
        const result = notificationFilterSchema.safeParse({ type });
        expect(result.success).toBe(true);
      });
    });

    describe('pagination validation', () => {
      it('should reject negative page', () => {
        const result = notificationFilterSchema.safeParse({ page: -1 });
        expect(result.success).toBe(false);
      });

      it('should reject size below 1', () => {
        const result = notificationFilterSchema.safeParse({ size: 0 });
        expect(result.success).toBe(false);
      });

      it('should reject size above 100', () => {
        const result = notificationFilterSchema.safeParse({ size: 101 });
        expect(result.success).toBe(false);
      });

      it('should accept valid pagination values', () => {
        const result = notificationFilterSchema.safeParse({ page: 5, size: 50 });
        expect(result.success).toBe(true);
      });
    });

    describe('sortDir validation', () => {
      it('should accept "asc"', () => {
        const result = notificationFilterSchema.safeParse({ sortDir: 'asc' });
        expect(result.success).toBe(true);
      });

      it('should accept "desc"', () => {
        const result = notificationFilterSchema.safeParse({ sortDir: 'desc' });
        expect(result.success).toBe(true);
      });

      it('should reject invalid sort direction', () => {
        const result = notificationFilterSchema.safeParse({ sortDir: 'invalid' });
        expect(result.success).toBe(false);
      });
    });
  });

  // =================================================================
  // VALIDATION UTILITY FUNCTION TESTS
  // =================================================================

  describe('validateSendEmailRequest', () => {
    it('should return parsed data for valid input', () => {
      const input = {
        notificationType: NotificationType.TENANT_ONBOARDED,
        recipientEmail: 'tenant@example.com',
        subject: 'Welcome!',
        templateName: 'welcome-email',
      };

      const result = validateSendEmailRequest(input);
      expect(result.recipientEmail).toBe('tenant@example.com');
      expect(result.notificationType).toBe(NotificationType.TENANT_ONBOARDED);
    });

    it('should throw error for invalid input', () => {
      const input = {
        notificationType: NotificationType.TENANT_ONBOARDED,
        recipientEmail: 'invalid',
        subject: '',
        templateName: 'welcome-email',
      };

      expect(() => validateSendEmailRequest(input)).toThrow();
    });
  });

  describe('safeParseSendEmailRequest', () => {
    it('should return success result for valid input', () => {
      const input = {
        notificationType: NotificationType.PAYMENT_RECEIVED,
        recipientEmail: 'payer@example.com',
        subject: 'Payment Received',
        templateName: 'payment-received',
      };

      const result = safeParseSendEmailRequest(input);
      expect(result.success).toBe(true);
    });

    it('should return error result for invalid input', () => {
      const input = { recipientEmail: 'not-an-email' };
      const result = safeParseSendEmailRequest(input);
      expect(result.success).toBe(false);
    });
  });

  describe('validateUpdateSettingsRequest', () => {
    it('should return parsed data for valid input', () => {
      const input = {
        notificationType: NotificationType.INVOICE_OVERDUE_7,
        emailEnabled: false,
      };

      const result = validateUpdateSettingsRequest(input);
      expect(result.emailEnabled).toBe(false);
    });
  });

  describe('safeParseUpdateSettingsRequest', () => {
    it('should handle valid and invalid inputs', () => {
      const validInput = {
        notificationType: NotificationType.VENDOR_REGISTERED,
        frequency: NotificationFrequency.WEEKLY_DIGEST,
      };

      expect(safeParseUpdateSettingsRequest(validInput).success).toBe(true);

      const invalidInput = { frequency: 'INVALID' };
      expect(safeParseUpdateSettingsRequest(invalidInput).success).toBe(false);
    });
  });

  describe('validateTestEmailRequest', () => {
    it('should validate correct email', () => {
      const result = validateTestEmailRequest({ recipientEmail: 'test@domain.com' });
      expect(result.recipientEmail).toBe('test@domain.com');
    });

    it('should throw for invalid email', () => {
      expect(() => validateTestEmailRequest({ recipientEmail: 'bad' })).toThrow();
    });
  });

  // =================================================================
  // HELPER FUNCTION TESTS
  // =================================================================

  describe('isValidEmail', () => {
    it('should return true for valid emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.org')).toBe(true);
      expect(isValidEmail('a@b.co')).toBe(true);
    });

    it('should return false for invalid emails', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('notanemail')).toBe(false);
      expect(isValidEmail('@nodomain.com')).toBe(false);
      expect(isValidEmail('no@tld')).toBe(false);
    });
  });

  describe('formatNotificationType', () => {
    it('should format notification types correctly', () => {
      expect(formatNotificationType(NotificationType.INVOICE_GENERATED)).toBe('Invoice Generated');
      expect(formatNotificationType(NotificationType.PASSWORD_RESET_REQUESTED)).toBe(
        'Password Reset Requested'
      );
      expect(formatNotificationType(NotificationType.WORK_ORDER_STATUS_CHANGED)).toBe(
        'Work Order Status Changed'
      );
    });
  });

  describe('formatFrequency', () => {
    it('should format frequencies correctly', () => {
      expect(formatFrequency(NotificationFrequency.IMMEDIATE)).toBe('Immediate');
      expect(formatFrequency(NotificationFrequency.DAILY_DIGEST)).toBe('Daily Digest');
      expect(formatFrequency(NotificationFrequency.WEEKLY_DIGEST)).toBe('Weekly Digest');
    });
  });

  describe('formatStatus', () => {
    it('should format statuses correctly', () => {
      expect(formatStatus(EmailNotificationStatus.PENDING)).toBe('Pending');
      expect(formatStatus(EmailNotificationStatus.QUEUED)).toBe('Queued');
      expect(formatStatus(EmailNotificationStatus.SENT)).toBe('Sent');
      expect(formatStatus(EmailNotificationStatus.FAILED)).toBe('Failed');
    });
  });

  describe('getStatusColor', () => {
    it('should return correct colors for statuses', () => {
      expect(getStatusColor(EmailNotificationStatus.PENDING)).toBe('secondary');
      expect(getStatusColor(EmailNotificationStatus.QUEUED)).toBe('default');
      expect(getStatusColor(EmailNotificationStatus.SENT)).toBe('success');
      expect(getStatusColor(EmailNotificationStatus.FAILED)).toBe('destructive');
    });
  });
});
