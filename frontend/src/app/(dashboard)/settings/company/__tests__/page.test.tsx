/**
 * Tests for Company Profile Settings Page
 * Story 2.8: Company Profile Settings
 *
 * Tests for company profile management UI
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CompanyProfilePage from '../page';
import type { CompanyProfileResponse } from '@/types/company-profile';

// Mock service functions
const mockGetCompanyProfile = jest.fn();
const mockSaveCompanyProfile = jest.fn();
const mockUploadCompanyLogo = jest.fn();
const mockDeleteCompanyLogo = jest.fn();

jest.mock('@/services/company-profile.service', () => ({
  getCompanyProfile: () => mockGetCompanyProfile(),
  saveCompanyProfile: (data: unknown) => mockSaveCompanyProfile(data),
  uploadCompanyLogo: (file: File) => mockUploadCompanyLogo(file),
  deleteCompanyLogo: () => mockDeleteCompanyLogo(),
}));

// Mock usePermission hook
const mockHasRole = jest.fn();
jest.mock('@/contexts/auth-context', () => ({
  usePermission: () => ({
    hasRole: mockHasRole,
  }),
}));

// Mock useToast hook
const mockToast = jest.fn();
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock next/link
jest.mock('next/link', () => {
  return function MockLink({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) {
    return <a href={href}>{children}</a>;
  };
});

// Mock next/image
jest.mock('next/image', () => {
  return function MockImage({
    src,
    alt,
    ...props
  }: {
    src: string;
    alt: string;
  }) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...props} />;
  };
});

// Simulate mounted state
jest.useFakeTimers();

const mockProfile: CompanyProfileResponse = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  legalCompanyName: 'Test Company LLC',
  companyAddress: '123 Business Bay, Tower A',
  city: 'Dubai',
  country: 'United Arab Emirates',
  trn: '100123456789012',
  phoneNumber: '+971501234567',
  emailAddress: 'info@testcompany.ae',
  logoUrl: null,
  updatedByName: 'John Admin',
  updatedAt: '2024-01-15T10:30:00Z',
};

describe('CompanyProfilePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default to admin user
    mockHasRole.mockImplementation((role: string) =>
      ['ADMIN', 'SUPER_ADMIN'].includes(role)
    );
    // Default to profile not existing
    mockGetCompanyProfile.mockResolvedValue(null);
  });

  describe('Page rendering', () => {
    it('should render page title and description', async () => {
      render(<CompanyProfilePage />);
      jest.runAllTimers();

      await waitFor(() => {
        expect(screen.getByText('Company Profile')).toBeInTheDocument();
        expect(
          screen.getByText(
            /Manage your organization details for invoices, documents, and official communications/
          )
        ).toBeInTheDocument();
      });
    });

    it('should render back to settings link', async () => {
      render(<CompanyProfilePage />);
      jest.runAllTimers();

      await waitFor(() => {
        expect(screen.getByText('Back to Settings')).toBeInTheDocument();
      });
    });

    it('should render company logo section (AC#10)', async () => {
      render(<CompanyProfilePage />);
      jest.runAllTimers();

      await waitFor(() => {
        expect(screen.getByText('Company Logo')).toBeInTheDocument();
        expect(
          screen.getByText(/Upload your company logo for invoices and documents/)
        ).toBeInTheDocument();
      });
    });

    it('should render company details section (AC#1-4)', async () => {
      render(<CompanyProfilePage />);
      jest.runAllTimers();

      await waitFor(() => {
        expect(screen.getByText('Company Details')).toBeInTheDocument();
        expect(screen.getByLabelText(/Legal Company Name/)).toBeInTheDocument();
        expect(screen.getByLabelText(/Company Address/)).toBeInTheDocument();
        expect(screen.getByLabelText(/City/)).toBeInTheDocument();
        expect(screen.getByText(/Tax Registration Number/)).toBeInTheDocument();
      });
    });

    it('should render contact information section (AC#5-6)', async () => {
      render(<CompanyProfilePage />);
      jest.runAllTimers();

      await waitFor(() => {
        expect(screen.getByText('Contact Information')).toBeInTheDocument();
        expect(screen.getByLabelText(/Phone Number/)).toBeInTheDocument();
        expect(screen.getByLabelText(/Email Address/)).toBeInTheDocument();
      });
    });
  });

  describe('Admin access (AC#14 - edit capability)', () => {
    beforeEach(() => {
      mockHasRole.mockImplementation((role: string) =>
        ['ADMIN', 'SUPER_ADMIN'].includes(role)
      );
      mockGetCompanyProfile.mockResolvedValue(mockProfile);
    });

    it('should enable form fields for admin users', async () => {
      render(<CompanyProfilePage />);
      jest.runAllTimers();

      await waitFor(() => {
        const companyNameInput = screen.getByTestId('input-legal-company-name');
        expect(companyNameInput).not.toBeDisabled();
      });
    });

    it('should show save and reset buttons for admin users', async () => {
      render(<CompanyProfilePage />);
      jest.runAllTimers();

      await waitFor(() => {
        expect(screen.getByTestId('save-profile-button')).toBeInTheDocument();
        expect(screen.getByText('Reset')).toBeInTheDocument();
      });
    });

    it('should NOT show read-only notice for admin users', async () => {
      render(<CompanyProfilePage />);
      jest.runAllTimers();

      await waitFor(() => {
        expect(screen.queryByText('Read-Only Access')).not.toBeInTheDocument();
      });
    });
  });

  describe('Non-admin access (AC#14 - read-only)', () => {
    beforeEach(() => {
      mockHasRole.mockImplementation((role: string) =>
        ['FINANCE_MANAGER', 'PROPERTY_MANAGER'].includes(role)
      );
      mockGetCompanyProfile.mockResolvedValue(mockProfile);
    });

    it('should show read-only notice for non-admin users', async () => {
      render(<CompanyProfilePage />);
      jest.runAllTimers();

      await waitFor(() => {
        expect(screen.getByText('Read-Only Access')).toBeInTheDocument();
        expect(
          screen.getByText(/You have view-only access to company profile settings/)
        ).toBeInTheDocument();
      });
    });

    it('should disable form fields for non-admin users', async () => {
      render(<CompanyProfilePage />);
      jest.runAllTimers();

      await waitFor(() => {
        const companyNameInput = screen.getByTestId('input-legal-company-name');
        expect(companyNameInput).toBeDisabled();
      });
    });

    it('should NOT show save button for non-admin users', async () => {
      render(<CompanyProfilePage />);
      jest.runAllTimers();

      await waitFor(() => {
        expect(screen.queryByTestId('save-profile-button')).not.toBeInTheDocument();
      });
    });
  });

  describe('Loading existing profile (AC#8)', () => {
    beforeEach(() => {
      mockHasRole.mockImplementation((role: string) =>
        ['ADMIN', 'SUPER_ADMIN'].includes(role)
      );
      mockGetCompanyProfile.mockResolvedValue(mockProfile);
    });

    it('should load and display existing profile data', async () => {
      render(<CompanyProfilePage />);
      jest.runAllTimers();

      await waitFor(() => {
        const companyNameInput = screen.getByTestId('input-legal-company-name');
        expect(companyNameInput).toHaveValue('Test Company LLC');

        const cityInput = screen.getByTestId('input-city');
        expect(cityInput).toHaveValue('Dubai');

        const trnInput = screen.getByTestId('input-trn');
        expect(trnInput).toHaveValue('100123456789012');

        const phoneInput = screen.getByTestId('input-phone-number');
        expect(phoneInput).toHaveValue('+971501234567');

        const emailInput = screen.getByTestId('input-email-address');
        expect(emailInput).toHaveValue('info@testcompany.ae');
      });
    });

    it('should display last updated information', async () => {
      render(<CompanyProfilePage />);
      jest.runAllTimers();

      await waitFor(() => {
        expect(screen.getByText(/Last updated/)).toBeInTheDocument();
        expect(screen.getByText(/John Admin/)).toBeInTheDocument();
      });
    });
  });

  describe('Saving profile (AC#8, AC#9)', () => {
    beforeEach(() => {
      mockHasRole.mockImplementation((role: string) =>
        ['ADMIN', 'SUPER_ADMIN'].includes(role)
      );
      mockGetCompanyProfile.mockResolvedValue(null); // No existing profile
      mockSaveCompanyProfile.mockResolvedValue({
        ...mockProfile,
        updatedAt: new Date().toISOString(),
      });
    });

    it('should save profile on form submission', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<CompanyProfilePage />);
      jest.runAllTimers();

      await waitFor(() => {
        expect(screen.getByTestId('input-legal-company-name')).toBeInTheDocument();
      });

      // Fill form
      const companyNameInput = screen.getByTestId('input-legal-company-name');
      await user.clear(companyNameInput);
      await user.type(companyNameInput, 'New Company LLC');

      const addressInput = screen.getByTestId('input-company-address');
      await user.clear(addressInput);
      await user.type(addressInput, '456 New Street');

      const cityInput = screen.getByTestId('input-city');
      await user.clear(cityInput);
      await user.type(cityInput, 'Abu Dhabi');

      const trnInput = screen.getByTestId('input-trn');
      await user.clear(trnInput);
      await user.type(trnInput, '100987654321098');

      const phoneInput = screen.getByTestId('input-phone-number');
      await user.clear(phoneInput);
      await user.type(phoneInput, '+971509876543');

      const emailInput = screen.getByTestId('input-email-address');
      await user.clear(emailInput);
      await user.type(emailInput, 'new@company.ae');

      // Submit form
      const saveButton = screen.getByTestId('save-profile-button');
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockSaveCompanyProfile).toHaveBeenCalledWith(
          expect.objectContaining({
            legalCompanyName: 'New Company LLC',
            companyAddress: '456 New Street',
            city: 'Abu Dhabi',
            trn: '100987654321098',
            phoneNumber: '+971509876543',
            emailAddress: 'new@company.ae',
          })
        );
      });
    });

    it('should show success toast after saving', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      mockGetCompanyProfile.mockResolvedValue(mockProfile);
      render(<CompanyProfilePage />);
      jest.runAllTimers();

      await waitFor(() => {
        expect(screen.getByTestId('input-legal-company-name')).toHaveValue(
          'Test Company LLC'
        );
      });

      // Make a change
      const companyNameInput = screen.getByTestId('input-legal-company-name');
      await user.clear(companyNameInput);
      await user.type(companyNameInput, 'Updated Company LLC');

      // Submit form
      const saveButton = screen.getByTestId('save-profile-button');
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Success',
            description: 'Company profile saved successfully.',
          })
        );
      });
    });
  });

  describe('Logo management (AC#10, AC#11)', () => {
    beforeEach(() => {
      mockHasRole.mockImplementation((role: string) =>
        ['ADMIN', 'SUPER_ADMIN'].includes(role)
      );
    });

    it('should show upload button when profile exists but no logo', async () => {
      mockGetCompanyProfile.mockResolvedValue({ ...mockProfile, logoUrl: null });
      render(<CompanyProfilePage />);
      jest.runAllTimers();

      await waitFor(() => {
        expect(screen.getByText('Upload Logo')).toBeInTheDocument();
      });
    });

    it('should show change and delete buttons when logo exists', async () => {
      mockGetCompanyProfile.mockResolvedValue({
        ...mockProfile,
        logoUrl: 'https://example.com/logo.png',
      });
      render(<CompanyProfilePage />);
      jest.runAllTimers();

      await waitFor(() => {
        expect(screen.getByText('Change Logo')).toBeInTheDocument();
        expect(screen.getByTestId('delete-logo-button')).toBeInTheDocument();
      });
    });

    it('should show message to save profile first before upload', async () => {
      mockGetCompanyProfile.mockResolvedValue(null); // No profile exists
      render(<CompanyProfilePage />);
      jest.runAllTimers();

      await waitFor(() => {
        expect(screen.getByText('Save profile first to upload logo')).toBeInTheDocument();
      });
    });

    it('should delete logo when delete button is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      mockGetCompanyProfile.mockResolvedValue({
        ...mockProfile,
        logoUrl: 'https://example.com/logo.png',
      });
      mockDeleteCompanyLogo.mockResolvedValue(undefined);

      render(<CompanyProfilePage />);
      jest.runAllTimers();

      await waitFor(() => {
        expect(screen.getByTestId('delete-logo-button')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('delete-logo-button'));

      await waitFor(() => {
        expect(mockDeleteCompanyLogo).toHaveBeenCalled();
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Success',
            description: 'Logo deleted successfully.',
          })
        );
      });
    });
  });

  describe('Form validation (AC#12, AC#17)', () => {
    beforeEach(() => {
      mockHasRole.mockImplementation((role: string) =>
        ['ADMIN', 'SUPER_ADMIN'].includes(role)
      );
      mockGetCompanyProfile.mockResolvedValue(mockProfile);
    });

    it('should show TRN format hint', async () => {
      render(<CompanyProfilePage />);
      jest.runAllTimers();

      await waitFor(() => {
        expect(screen.getByText(/15-digit UAE TRN starting with 100/)).toBeInTheDocument();
      });
    });

    it('should show phone number format hint', async () => {
      render(<CompanyProfilePage />);
      jest.runAllTimers();

      await waitFor(() => {
        expect(screen.getByText(/UAE format: \+971 followed by 9 digits/)).toBeInTheDocument();
      });
    });
  });

  describe('Error handling', () => {
    beforeEach(() => {
      mockHasRole.mockImplementation((role: string) =>
        ['ADMIN', 'SUPER_ADMIN'].includes(role)
      );
    });

    it('should show error toast when loading fails', async () => {
      mockGetCompanyProfile.mockRejectedValue(new Error('Network error'));
      render(<CompanyProfilePage />);
      jest.runAllTimers();

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Error',
            description: 'Failed to load company profile. Please try again.',
            variant: 'destructive',
          })
        );
      });
    });

    it('should show error toast when saving fails', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      mockGetCompanyProfile.mockResolvedValue(mockProfile);
      mockSaveCompanyProfile.mockRejectedValue(new Error('Save failed'));

      render(<CompanyProfilePage />);
      jest.runAllTimers();

      await waitFor(() => {
        expect(screen.getByTestId('input-legal-company-name')).toHaveValue(
          'Test Company LLC'
        );
      });

      // Make a change and submit
      const companyNameInput = screen.getByTestId('input-legal-company-name');
      await user.clear(companyNameInput);
      await user.type(companyNameInput, 'Another Company');

      const saveButton = screen.getByTestId('save-profile-button');
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Error',
            description: 'Failed to save company profile. Please try again.',
            variant: 'destructive',
          })
        );
      });
    });
  });

  describe('Loading state', () => {
    it('should show loading spinner during initial load', () => {
      mockGetCompanyProfile.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );
      render(<CompanyProfilePage />);
      jest.runAllTimers();

      // Check that loading state is shown
      // Since the promise never resolves, loading spinner should be visible
      const loadingContainer = document.querySelector('.animate-spin');
      expect(loadingContainer).toBeInTheDocument();
    });
  });
});

describe('CompanyProfilePage role-based access scenarios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCompanyProfile.mockResolvedValue(mockProfile);
  });

  it('should grant edit access to SUPER_ADMIN', async () => {
    mockHasRole.mockImplementation((role: string) => role === 'SUPER_ADMIN');
    render(<CompanyProfilePage />);
    jest.runAllTimers();

    await waitFor(() => {
      expect(screen.queryByText('Read-Only Access')).not.toBeInTheDocument();
      expect(screen.getByTestId('save-profile-button')).toBeInTheDocument();
    });
  });

  it('should grant edit access to ADMIN', async () => {
    mockHasRole.mockImplementation((role: string) => role === 'ADMIN');
    render(<CompanyProfilePage />);
    jest.runAllTimers();

    await waitFor(() => {
      expect(screen.queryByText('Read-Only Access')).not.toBeInTheDocument();
      expect(screen.getByTestId('save-profile-button')).toBeInTheDocument();
    });
  });

  it('should show read-only for FINANCE_MANAGER', async () => {
    mockHasRole.mockImplementation((role: string) => role === 'FINANCE_MANAGER');
    render(<CompanyProfilePage />);
    jest.runAllTimers();

    await waitFor(() => {
      expect(screen.getByText('Read-Only Access')).toBeInTheDocument();
    });
  });

  it('should show read-only for PROPERTY_MANAGER', async () => {
    mockHasRole.mockImplementation((role: string) => role === 'PROPERTY_MANAGER');
    render(<CompanyProfilePage />);
    jest.runAllTimers();

    await waitFor(() => {
      expect(screen.getByText('Read-Only Access')).toBeInTheDocument();
    });
  });
});
