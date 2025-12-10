/**
 * Unit Tests for FinancialInfoStep - Bank Account Integration
 * Story 3.9: Tenant Onboarding Bank Account Integration
 * AC #10: Frontend tests for bank account dropdown selection
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FinancialInfoStep, type FinancialInfoFormData } from '../FinancialInfoStep';
import { useBankAccountsDropdown } from '@/hooks/useBankAccounts';
import type { BankAccountDropdownItem } from '@/types/bank-account';
import { BankAccountStatus } from '@/types/bank-account';

// Mock dependencies
jest.mock('@/hooks/useBankAccounts');
jest.mock('@/services/textract.service');
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
  },
}));

const mockUseBankAccountsDropdown = useBankAccountsDropdown as jest.MockedFunction<
  typeof useBankAccountsDropdown
>;

describe('FinancialInfoStep - Bank Account Integration (Story 3.9)', () => {
  // Mock data
  const mockBankAccounts: BankAccountDropdownItem[] = [
    {
      id: 'bank-1',
      bankName: 'Emirates NBD',
      accountName: 'Ultra BMS Main Account',
      accountNumberMasked: '****1234',
      isPrimary: true,
      status: BankAccountStatus.ACTIVE,
    },
    {
      id: 'bank-2',
      bankName: 'ADCB',
      accountName: 'Ultra BMS Secondary Account',
      accountNumberMasked: '****5678',
      isPrimary: false,
      status: BankAccountStatus.ACTIVE,
    },
    {
      id: 'bank-3',
      bankName: 'FAB',
      accountName: 'Ultra BMS Reserve Account',
      accountNumberMasked: '****9012',
      isPrimary: false,
      status: BankAccountStatus.ACTIVE,
    },
  ];

  const defaultProps = {
    data: {
      chequeDetails: [],
      bankAccountId: undefined,
      bankAccountName: undefined,
      bankName: undefined,
    } as FinancialInfoFormData,
    onComplete: jest.fn(),
    onBack: jest.fn(),
    quotationId: 'quotation-123',
    expectedChequeCount: 4,
    firstMonthPaymentMethod: 'CASH' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Bank Account Dropdown - Rendering', () => {
    it('should render bank account dropdown when accounts are loaded', async () => {
      mockUseBankAccountsDropdown.mockReturnValue({
        data: mockBankAccounts,
        isLoading: false,
        error: null,
      } as any);

      render(<FinancialInfoStep {...defaultProps} />);

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByTestId('bank-account-select')).toBeInTheDocument();
      });

      const dropdown = screen.getByTestId('bank-account-select');
      expect(dropdown).toBeInTheDocument();
    });

    it('should show loading skeleton while fetching bank accounts', () => {
      mockUseBankAccountsDropdown.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any);

      render(<FinancialInfoStep {...defaultProps} />);

      // Skeleton should be visible during loading
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should show "no accounts" alert when no bank accounts exist', () => {
      mockUseBankAccountsDropdown.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any);

      render(<FinancialInfoStep {...defaultProps} />);

      expect(
        screen.getByText(/No bank accounts configured/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Bank account selection is optional/i)
      ).toBeInTheDocument();
    });

    it('should display dropdown placeholder when no account is selected', async () => {
      mockUseBankAccountsDropdown.mockReturnValue({
        data: mockBankAccounts,
        isLoading: false,
        error: null,
      } as any);

      render(<FinancialInfoStep {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('bank-account-select')).toBeInTheDocument();
      });

      expect(
        screen.getByText(/Select a bank account \(optional\)/i)
      ).toBeInTheDocument();
    });
  });

  describe('Bank Account Dropdown - Selection', () => {
    it('should allow user to select a bank account', async () => {
      const user = userEvent.setup();
      mockUseBankAccountsDropdown.mockReturnValue({
        data: mockBankAccounts,
        isLoading: false,
        error: null,
      } as any);

      render(<FinancialInfoStep {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('bank-account-select')).toBeInTheDocument();
      });

      // Click the dropdown trigger
      const trigger = screen.getByTestId('bank-account-select');
      await user.click(trigger);

      // Wait for dropdown items to appear
      await waitFor(() => {
        expect(screen.getByText('Emirates NBD')).toBeInTheDocument();
      });

      // Select the first bank account (Emirates NBD)
      const emiratesOption = screen.getByText('Emirates NBD');
      await user.click(emiratesOption);

      // Selected account details should be displayed
      await waitFor(() => {
        expect(screen.getByText('Selected Account Details')).toBeInTheDocument();
        expect(screen.getByText('Ultra BMS Main Account')).toBeInTheDocument();
      });
    });

    it('should display Primary badge for primary account in dropdown', async () => {
      const user = userEvent.setup();
      mockUseBankAccountsDropdown.mockReturnValue({
        data: mockBankAccounts,
        isLoading: false,
        error: null,
      } as any);

      render(<FinancialInfoStep {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('bank-account-select')).toBeInTheDocument();
      });

      // Open dropdown
      const trigger = screen.getByTestId('bank-account-select');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('Emirates NBD')).toBeInTheDocument();
      });

      // Primary badge should be visible
      expect(screen.getByText('Primary')).toBeInTheDocument();
    });

    it('should show all three bank accounts in dropdown', async () => {
      const user = userEvent.setup();
      mockUseBankAccountsDropdown.mockReturnValue({
        data: mockBankAccounts,
        isLoading: false,
        error: null,
      } as any);

      render(<FinancialInfoStep {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('bank-account-select')).toBeInTheDocument();
      });

      const trigger = screen.getByTestId('bank-account-select');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('Emirates NBD')).toBeInTheDocument();
        expect(screen.getByText('ADCB')).toBeInTheDocument();
        expect(screen.getByText('FAB')).toBeInTheDocument();
      });
    });

    it('should display masked account numbers in dropdown items', async () => {
      const user = userEvent.setup();
      mockUseBankAccountsDropdown.mockReturnValue({
        data: mockBankAccounts,
        isLoading: false,
        error: null,
      } as any);

      render(<FinancialInfoStep {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('bank-account-select')).toBeInTheDocument();
      });

      const trigger = screen.getByTestId('bank-account-select');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('****1234')).toBeInTheDocument();
        expect(screen.getByText('****5678')).toBeInTheDocument();
        expect(screen.getByText('****9012')).toBeInTheDocument();
      });
    });
  });

  describe('Bank Account Dropdown - Selected Account Details', () => {
    it('should display selected account details after selection', async () => {
      const user = userEvent.setup();
      mockUseBankAccountsDropdown.mockReturnValue({
        data: mockBankAccounts,
        isLoading: false,
        error: null,
      } as any);

      render(<FinancialInfoStep {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('bank-account-select')).toBeInTheDocument();
      });

      // Select Emirates NBD
      const trigger = screen.getByTestId('bank-account-select');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('Emirates NBD')).toBeInTheDocument();
      });

      const emiratesOption = screen.getByText('Emirates NBD');
      await user.click(emiratesOption);

      // Verify selected account details are shown
      await waitFor(() => {
        expect(screen.getByText('Selected Account Details')).toBeInTheDocument();
        expect(screen.getByText('Emirates NBD')).toBeInTheDocument();
        expect(screen.getByText('Ultra BMS Main Account')).toBeInTheDocument();
        expect(screen.getByText('****1234')).toBeInTheDocument();
        expect(screen.getByText('Primary Account')).toBeInTheDocument();
      });
    });

    it('should show helpful text about invoice usage', async () => {
      const user = userEvent.setup();
      mockUseBankAccountsDropdown.mockReturnValue({
        data: mockBankAccounts,
        isLoading: false,
        error: null,
      } as any);

      render(<FinancialInfoStep {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('bank-account-select')).toBeInTheDocument();
      });

      // Select a bank account
      const trigger = screen.getByTestId('bank-account-select');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('ADCB')).toBeInTheDocument();
      });

      const adcbOption = screen.getByText('ADCB');
      await user.click(adcbOption);

      // Check for invoice usage text
      await waitFor(() => {
        expect(
          screen.getByText(/This account will be shown on invoices/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Bank Account Dropdown - Form Submission', () => {
    it('should include selected bank account in form data on submit', async () => {
      const user = userEvent.setup();
      const mockOnComplete = jest.fn();
      mockUseBankAccountsDropdown.mockReturnValue({
        data: mockBankAccounts,
        isLoading: false,
        error: null,
      } as any);

      const propsWithCheques = {
        ...defaultProps,
        data: {
          chequeDetails: [
            {
              chequeIndex: 0,
              bankName: 'Test Bank',
              chequeNumber: '123456',
              amount: 25000,
              chequeDate: '2025-01-15',
              status: 'SUCCESS' as const,
              confidenceScore: 0.95,
            },
          ],
        } as FinancialInfoFormData,
        onComplete: mockOnComplete,
      };

      render(<FinancialInfoStep {...propsWithCheques} />);

      await waitFor(() => {
        expect(screen.getByTestId('bank-account-select')).toBeInTheDocument();
      });

      // Select Emirates NBD
      const trigger = screen.getByTestId('bank-account-select');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('Emirates NBD')).toBeInTheDocument();
      });

      const emiratesOption = screen.getByText('Emirates NBD');
      await user.click(emiratesOption);

      // Click Next button
      await waitFor(() => {
        expect(screen.getByTestId('btn-next')).toBeInTheDocument();
      });

      const nextButton = screen.getByTestId('btn-next');
      await user.click(nextButton);

      // Verify onComplete was called with bank account data
      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith(
          expect.objectContaining({
            bankAccountId: 'bank-1',
            bankName: 'Emirates NBD',
            bankAccountName: 'Ultra BMS Main Account',
          })
        );
      });
    });

    it('should allow form submission without selecting a bank account (optional)', async () => {
      const user = userEvent.setup();
      const mockOnComplete = jest.fn();
      mockUseBankAccountsDropdown.mockReturnValue({
        data: mockBankAccounts,
        isLoading: false,
        error: null,
      } as any);

      const propsWithCheques = {
        ...defaultProps,
        data: {
          chequeDetails: [
            {
              chequeIndex: 0,
              bankName: 'Test Bank',
              chequeNumber: '123456',
              amount: 25000,
              chequeDate: '2025-01-15',
              status: 'SUCCESS' as const,
              confidenceScore: 0.95,
            },
          ],
        } as FinancialInfoFormData,
        onComplete: mockOnComplete,
      };

      render(<FinancialInfoStep {...propsWithCheques} />);

      await waitFor(() => {
        expect(screen.getByTestId('bank-account-select')).toBeInTheDocument();
      });

      // Don't select any bank account, just click Next
      const nextButton = screen.getByTestId('btn-next');
      await user.click(nextButton);

      // Verify onComplete was called with undefined bank account data
      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith(
          expect.objectContaining({
            bankAccountId: undefined,
            bankName: undefined,
            bankAccountName: undefined,
          })
        );
      });
    });

    it('should include selected bank account in onBack callback', async () => {
      const user = userEvent.setup();
      const mockOnBack = jest.fn();
      mockUseBankAccountsDropdown.mockReturnValue({
        data: mockBankAccounts,
        isLoading: false,
        error: null,
      } as any);

      const propsWithBankAccount = {
        ...defaultProps,
        onBack: mockOnBack,
      };

      render(<FinancialInfoStep {...propsWithBankAccount} />);

      await waitFor(() => {
        expect(screen.getByTestId('bank-account-select')).toBeInTheDocument();
      });

      // Select FAB
      const trigger = screen.getByTestId('bank-account-select');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('FAB')).toBeInTheDocument();
      });

      const fabOption = screen.getByText('FAB');
      await user.click(fabOption);

      // Click Back button
      const backButton = screen.getByTestId('btn-back');
      await user.click(backButton);

      // Verify onBack was called with bank account data
      await waitFor(() => {
        expect(mockOnBack).toHaveBeenCalledWith(
          expect.objectContaining({
            bankAccountId: 'bank-3',
            bankName: 'FAB',
            bankAccountName: 'Ultra BMS Reserve Account',
          })
        );
      });
    });
  });

  describe('Bank Account Dropdown - Pre-selected Account', () => {
    it('should pre-select bank account from form data', async () => {
      mockUseBankAccountsDropdown.mockReturnValue({
        data: mockBankAccounts,
        isLoading: false,
        error: null,
      } as any);

      const propsWithPreselected = {
        ...defaultProps,
        data: {
          chequeDetails: [],
          bankAccountId: 'bank-2', // ADCB
          bankAccountName: 'Ultra BMS Secondary Account',
          bankName: 'ADCB',
        } as FinancialInfoFormData,
      };

      render(<FinancialInfoStep {...propsWithPreselected} />);

      await waitFor(() => {
        expect(screen.getByTestId('bank-account-select')).toBeInTheDocument();
      });

      // Selected account details should be immediately visible
      await waitFor(() => {
        expect(screen.getByText('Selected Account Details')).toBeInTheDocument();
        expect(screen.getByText('ADCB')).toBeInTheDocument();
        expect(screen.getByText('Ultra BMS Secondary Account')).toBeInTheDocument();
      });
    });
  });

  describe('Bank Account Dropdown - Accessibility', () => {
    it('should have accessible label for dropdown', async () => {
      mockUseBankAccountsDropdown.mockReturnValue({
        data: mockBankAccounts,
        isLoading: false,
        error: null,
      } as any);

      render(<FinancialInfoStep {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Select Bank Account/i)).toBeInTheDocument();
      });

      const label = screen.getByLabelText(/Select Bank Account/i);
      expect(label).toHaveAttribute('id', 'bank-account-select');
    });

    it('should indicate optional status in label', async () => {
      mockUseBankAccountsDropdown.mockReturnValue({
        data: mockBankAccounts,
        isLoading: false,
        error: null,
      } as any);

      render(<FinancialInfoStep {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/\(Optional\)/i)).toBeInTheDocument();
      });
    });
  });
});
