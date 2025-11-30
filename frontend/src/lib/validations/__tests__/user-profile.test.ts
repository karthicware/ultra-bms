/**
 * User Profile Validation Schema Tests
 * Story 2.9: User Profile Customization
 *
 * Tests for Zod validation schemas and helper functions
 */

import {
  userProfileSchema,
  avatarFileSchema,
  validateAvatarFileSync,
  validateDisplayName,
  validateContactPhone,
  type UserProfileFormData,
} from '@/lib/validations/user-profile';
import {
  getUserInitials,
  getDisplayNameOrFullName,
  formatRoleName,
  validateAvatarFile,
  MAX_DISPLAY_NAME_LENGTH,
  MAX_CONTACT_PHONE_LENGTH,
  MAX_AVATAR_SIZE,
  ALLOWED_AVATAR_TYPES,
} from '@/types/user-profile';

describe('User Profile Validation Schema', () => {
  describe('userProfileSchema', () => {
    const validProfileData: UserProfileFormData = {
      displayName: 'Johnny D.',
      contactPhone: '+971501234567',
    };

    it('should validate a complete profile with all fields', () => {
      const result = userProfileSchema.safeParse(validProfileData);
      expect(result.success).toBe(true);
    });

    it('should validate profile with empty fields (clears values)', () => {
      const data = { displayName: '', contactPhone: '' };
      const result = userProfileSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    describe('displayName validation', () => {
      it('should accept valid display name', () => {
        const data = { displayName: 'John Doe', contactPhone: '' };
        const result = userProfileSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.displayName).toBe('John Doe');
        }
      });

      it('should reject display name longer than 100 characters', () => {
        const data = { displayName: 'A'.repeat(101), contactPhone: '' };
        const result = userProfileSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('100 characters');
        }
      });

      it('should accept display name at exactly 100 characters', () => {
        const data = { displayName: 'A'.repeat(100), contactPhone: '' };
        const result = userProfileSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should trim whitespace from display name', () => {
        const data = { displayName: '  Johnny D.  ', contactPhone: '' };
        const result = userProfileSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.displayName).toBe('Johnny D.');
        }
      });

      it('should accept empty display name', () => {
        const data = { displayName: '', contactPhone: '' };
        const result = userProfileSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe('contactPhone validation', () => {
      it('should accept valid contact phone', () => {
        const data = { displayName: '', contactPhone: '+971501234567' };
        const result = userProfileSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should reject contact phone longer than 30 characters', () => {
        const data = { displayName: '', contactPhone: 'A'.repeat(31) };
        const result = userProfileSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('30 characters');
        }
      });

      it('should accept any phone format (international support)', () => {
        const validPhones = [
          '+1-555-555-5555',
          '(555) 555-5555',
          '555.555.5555',
          '+44 20 7946 0958',
        ];

        validPhones.forEach((phone) => {
          const data = { displayName: '', contactPhone: phone };
          const result = userProfileSchema.safeParse(data);
          expect(result.success).toBe(true);
        });
      });

      it('should trim whitespace from contact phone', () => {
        const data = { displayName: '', contactPhone: '  +971501234567  ' };
        const result = userProfileSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.contactPhone).toBe('+971501234567');
        }
      });
    });
  });

  describe('validateDisplayName', () => {
    it('should return null for valid display name', () => {
      expect(validateDisplayName('Johnny D.')).toBeNull();
    });

    it('should return null for empty display name', () => {
      expect(validateDisplayName('')).toBeNull();
    });

    it('should return error for display name exceeding max length', () => {
      const longName = 'A'.repeat(MAX_DISPLAY_NAME_LENGTH + 1);
      expect(validateDisplayName(longName)).toContain('100 characters');
    });
  });

  describe('validateContactPhone', () => {
    it('should return null for valid contact phone', () => {
      expect(validateContactPhone('+971501234567')).toBeNull();
    });

    it('should return null for empty contact phone', () => {
      expect(validateContactPhone('')).toBeNull();
    });

    it('should return error for contact phone exceeding max length', () => {
      const longPhone = 'A'.repeat(MAX_CONTACT_PHONE_LENGTH + 1);
      expect(validateContactPhone(longPhone)).toContain('30 characters');
    });
  });
});

describe('User Profile Helper Functions', () => {
  describe('getUserInitials', () => {
    it('should return initials from displayName when set', () => {
      expect(getUserInitials('John Doe', 'Jane', 'Smith')).toBe('JD');
    });

    it('should return first letter when displayName has one word', () => {
      expect(getUserInitials('Johnny', 'Jane', 'Smith')).toBe('J');
    });

    it('should return initials from first and last name when displayName is null', () => {
      expect(getUserInitials(null, 'John', 'Doe')).toBe('JD');
    });

    it('should return initials from first and last name when displayName is empty', () => {
      expect(getUserInitials('', 'John', 'Doe')).toBe('JD');
    });

    it('should return initials from first and last name when displayName is whitespace', () => {
      expect(getUserInitials('   ', 'John', 'Doe')).toBe('JD');
    });

    it('should handle displayName with multiple words', () => {
      expect(getUserInitials('John Middle Doe', 'Jane', 'Smith')).toBe('JD');
    });

    it('should return uppercase initials', () => {
      expect(getUserInitials('john doe', 'jane', 'smith')).toBe('JD');
    });
  });

  describe('getDisplayNameOrFullName', () => {
    it('should return displayName when set', () => {
      expect(getDisplayNameOrFullName('Johnny D.', 'John', 'Doe')).toBe('Johnny D.');
    });

    it('should return full name when displayName is null', () => {
      expect(getDisplayNameOrFullName(null, 'John', 'Doe')).toBe('John Doe');
    });

    it('should return full name when displayName is empty', () => {
      expect(getDisplayNameOrFullName('', 'John', 'Doe')).toBe('John Doe');
    });

    it('should return full name when displayName is whitespace', () => {
      expect(getDisplayNameOrFullName('   ', 'John', 'Doe')).toBe('John Doe');
    });
  });

  describe('formatRoleName', () => {
    it('should format PROPERTY_MANAGER correctly', () => {
      expect(formatRoleName('PROPERTY_MANAGER')).toBe('Property Manager');
    });

    it('should format SUPER_ADMIN correctly', () => {
      expect(formatRoleName('SUPER_ADMIN')).toBe('Super Admin');
    });

    it('should format FINANCE_MANAGER correctly', () => {
      expect(formatRoleName('FINANCE_MANAGER')).toBe('Finance Manager');
    });

    it('should format MAINTENANCE_SUPERVISOR correctly', () => {
      expect(formatRoleName('MAINTENANCE_SUPERVISOR')).toBe('Maintenance Supervisor');
    });

    it('should handle single word roles', () => {
      expect(formatRoleName('ADMIN')).toBe('Admin');
    });
  });
});

describe('Avatar File Validation', () => {
  describe('validateAvatarFile (from types)', () => {
    it('should return null for valid PNG file', () => {
      const file = new File([new ArrayBuffer(1024)], 'avatar.png', { type: 'image/png' });
      expect(validateAvatarFile(file)).toBeNull();
    });

    it('should return null for valid JPEG file', () => {
      const file = new File([new ArrayBuffer(1024)], 'avatar.jpg', { type: 'image/jpeg' });
      expect(validateAvatarFile(file)).toBeNull();
    });

    it('should return error for invalid file type', () => {
      const file = new File([new ArrayBuffer(1024)], 'document.pdf', { type: 'application/pdf' });
      expect(validateAvatarFile(file)).toContain('PNG or JPG');
    });

    it('should return error for file exceeding 2MB', () => {
      const largeBuffer = new ArrayBuffer(MAX_AVATAR_SIZE + 1);
      const file = new File([largeBuffer], 'large.jpg', { type: 'image/jpeg' });
      expect(validateAvatarFile(file)).toContain('2MB');
    });

    it('should return null for file at exactly 2MB', () => {
      const buffer = new ArrayBuffer(MAX_AVATAR_SIZE);
      const file = new File([buffer], 'max.jpg', { type: 'image/jpeg' });
      expect(validateAvatarFile(file)).toBeNull();
    });
  });

  describe('validateAvatarFileSync (from validations)', () => {
    it('should return null for valid file', () => {
      const file = new File([new ArrayBuffer(1024)], 'avatar.jpg', { type: 'image/jpeg' });
      expect(validateAvatarFileSync(file)).toBeNull();
    });

    it('should return error for invalid type', () => {
      const file = new File([new ArrayBuffer(1024)], 'doc.pdf', { type: 'application/pdf' });
      expect(validateAvatarFileSync(file)).toContain('PNG or JPG');
    });

    it('should return error for file too large', () => {
      const largeBuffer = new ArrayBuffer(MAX_AVATAR_SIZE + 1);
      const file = new File([largeBuffer], 'large.jpg', { type: 'image/jpeg' });
      expect(validateAvatarFileSync(file)).toContain('2MB');
    });
  });

  describe('ALLOWED_AVATAR_TYPES constant', () => {
    it('should include image/png', () => {
      expect(ALLOWED_AVATAR_TYPES).toContain('image/png');
    });

    it('should include image/jpeg', () => {
      expect(ALLOWED_AVATAR_TYPES).toContain('image/jpeg');
    });

    it('should include image/jpg', () => {
      expect(ALLOWED_AVATAR_TYPES).toContain('image/jpg');
    });

    it('should have exactly 3 allowed types', () => {
      expect(ALLOWED_AVATAR_TYPES).toHaveLength(3);
    });
  });
});
