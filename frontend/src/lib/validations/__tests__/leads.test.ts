/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Unit tests for Lead validation schemas
 * Tests Emirates ID format, phone format, email validation, and all field constraints
 */

import {
  createLeadSchema,
  updateLeadSchema,
  emiratesIdSchema,
  phoneSchema,
  emailSchema,
  passportNumberSchema,
  fullNameSchema,
} from '../leads';
import { LeadSource } from '@/types';

describe('Lead Validation Schemas', () => {
  describe('emiratesIdSchema', () => {
    it('should accept valid Emirates ID format (XXX-XXXX-XXXXXXX-X)', () => {
      const result = emiratesIdSchema.safeParse('784-1234-1234567-1');
      expect(result.success).toBe(true);
    });

    it('should reject Emirates ID without dashes', () => {
      const result = emiratesIdSchema.safeParse('78412341234567 1');
      expect(result.success).toBe(false);
    });

    it('should reject Emirates ID with incorrect segment lengths', () => {
      const result = emiratesIdSchema.safeParse('78-1234-1234567-1');
      expect(result.success).toBe(false);
    });

    it('should reject empty Emirates ID', () => {
      const result = emiratesIdSchema.safeParse('');
      expect(result.success).toBe(false);
    });
  });

  describe('phoneSchema', () => {
    it('should accept valid E.164 phone with +971 prefix', () => {
      const result = phoneSchema.safeParse('+971501234567');
      expect(result.success).toBe(true);
    });

    it('should accept valid E.164 phone with +1 prefix', () => {
      const result = phoneSchema.safeParse('+12125551234');
      expect(result.success).toBe(true);
    });

    it('should reject phone without + prefix', () => {
      const result = phoneSchema.safeParse('971501234567');
      expect(result.success).toBe(false);
    });

    it('should reject phone with invalid characters', () => {
      const result = phoneSchema.safeParse('+971-50-123-4567');
      expect(result.success).toBe(false);
    });

    it('should reject phone that is too short', () => {
      const result = phoneSchema.safeParse('+971');
      expect(result.success).toBe(false);
    });

    it('should reject phone that is too long', () => {
      const result = phoneSchema.safeParse('+97150123456789012345');
      expect(result.success).toBe(false);
    });
  });

  describe('emailSchema', () => {
    it('should accept valid email', () => {
      const result = emailSchema.safeParse('test@example.com');
      expect(result.success).toBe(true);
    });

    it('should accept email with subdomain', () => {
      const result = emailSchema.safeParse('user@mail.example.com');
      expect(result.success).toBe(true);
    });

    it('should reject email without @', () => {
      const result = emailSchema.safeParse('testexample.com');
      expect(result.success).toBe(false);
    });

    it('should reject email without domain', () => {
      const result = emailSchema.safeParse('test@');
      expect(result.success).toBe(false);
    });

    it('should reject email that exceeds max length (255 chars)', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      const result = emailSchema.safeParse(longEmail);
      expect(result.success).toBe(false);
    });
  });

  describe('passportNumberSchema', () => {
    it('should accept valid passport number (6-50 chars)', () => {
      const result = passportNumberSchema.safeParse('AB1234567');
      expect(result.success).toBe(true);
    });

    it('should reject passport number less than 6 characters', () => {
      const result = passportNumberSchema.safeParse('AB123');
      expect(result.success).toBe(false);
    });

    it('should reject passport number more than 50 characters', () => {
      const result = passportNumberSchema.safeParse('A'.repeat(51));
      expect(result.success).toBe(false);
    });
  });

  describe('fullNameSchema', () => {
    it('should accept valid full name (2-200 chars)', () => {
      const result = fullNameSchema.safeParse('John Doe');
      expect(result.success).toBe(true);
    });

    it('should reject name less than 2 characters', () => {
      const result = fullNameSchema.safeParse('J');
      expect(result.success).toBe(false);
    });

    it('should reject name more than 200 characters', () => {
      const result = fullNameSchema.safeParse('A'.repeat(201));
      expect(result.success).toBe(false);
    });
  });

  describe('createLeadSchema', () => {
    const validLead = {
      fullName: 'Ahmed Hassan',
      emiratesId: '784-1234-1234567-1',
      passportNumber: 'AB1234567',
      passportExpiryDate: new Date('2026-12-31'),
      homeCountry: 'United Arab Emirates',
      email: 'ahmed@example.com',
      contactNumber: '+971501234567',
      leadSource: LeadSource.WEBSITE,
      notes: 'Looking for 2 BHK apartment',
      propertyInterest: 'Marina View Tower',
    };

    it('should accept valid lead data', () => {
      const result = createLeadSchema.safeParse(validLead);
      expect(result.success).toBe(true);
    });

    it('should reject lead without required fields', () => {
      const invalidLead = { ...validLead };
      delete (invalidLead as any).email;
      const result = createLeadSchema.safeParse(invalidLead);
      expect(result.success).toBe(false);
    });

    it('should accept lead without optional notes', () => {
      const { notes, ...leadWithoutNotes } = validLead;
      const result = createLeadSchema.safeParse(leadWithoutNotes);
      expect(result.success).toBe(true);
    });

    it('should reject lead with notes exceeding 1000 characters', () => {
      const leadWithLongNotes = {
        ...validLead,
        notes: 'A'.repeat(1001),
      };
      const result = createLeadSchema.safeParse(leadWithLongNotes);
      expect(result.success).toBe(false);
    });

    it('should reject lead with past passport expiry date', () => {
      const leadWithPastExpiry = {
        ...validLead,
        passportExpiryDate: new Date('2020-01-01'),
      };
      const result = createLeadSchema.safeParse(leadWithPastExpiry);
      expect(result.success).toBe(false);
    });

    it('should reject lead with invalid lead source', () => {
      const leadWithInvalidSource = {
        ...validLead,
        leadSource: 'INVALID_SOURCE' as any,
      };
      const result = createLeadSchema.safeParse(leadWithInvalidSource);
      expect(result.success).toBe(false);
    });
  });

  describe('updateLeadSchema', () => {
    it('should accept partial lead data', () => {
      const result = updateLeadSchema.safeParse({
        fullName: 'Updated Name',
        email: 'updated@example.com',
      });
      expect(result.success).toBe(true);
    });

    it('should accept empty update (all fields optional)', () => {
      const result = updateLeadSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should reject update with invalid email format', () => {
      const result = updateLeadSchema.safeParse({
        email: 'invalid-email',
      });
      expect(result.success).toBe(false);
    });

    it('should reject update with invalid Emirates ID format', () => {
      const result = updateLeadSchema.safeParse({
        emiratesId: '123-456-789',
      });
      expect(result.success).toBe(false);
    });
  });
});
