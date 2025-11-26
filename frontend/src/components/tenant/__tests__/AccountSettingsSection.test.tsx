/* eslint-disable @typescript-eslint/no-explicit-any, react/display-name */
/**
 * Tests for AccountSettingsSection component
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AccountSettingsSection } from '../AccountSettingsSection';
import * as useChangePasswordHook from '@/hooks/useChangePassword';

jest.mock('@/hooks/useChangePassword');
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('AccountSettingsSection', () => {
  const mockMutate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useChangePasswordHook.useChangePassword as jest.Mock).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });
  });

  it('should render password change form', () => {
    render(<AccountSettingsSection />, { wrapper: createWrapper() });

    expect(screen.getByTestId('input-current-password')).toBeInTheDocument();
    expect(screen.getByTestId('input-new-password')).toBeInTheDocument();
    expect(screen.getByTestId('input-confirm-password')).toBeInTheDocument();
    expect(screen.getByTestId('btn-change-password')).toBeInTheDocument();
  });

  it('should validate password requirements', async () => {
    render(<AccountSettingsSection />, { wrapper: createWrapper() });

    const submitButton = screen.getByTestId('btn-change-password');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Current password must be at least 8 characters/i)).toBeInTheDocument();
    });
  });

  it('should submit valid password change', async () => {
    render(<AccountSettingsSection />, { wrapper: createWrapper() });

    fireEvent.change(screen.getByTestId('input-current-password'), {
      target: { value: 'OldPass123!' },
    });
    fireEvent.change(screen.getByTestId('input-new-password'), {
      target: { value: 'NewSecurePass123!@' },
    });
    fireEvent.change(screen.getByTestId('input-confirm-password'), {
      target: { value: 'NewSecurePass123!@' },
    });

    fireEvent.click(screen.getByTestId('btn-change-password'));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        currentPassword: 'OldPass123!',
        newPassword: 'NewSecurePass123!@',
        confirmPassword: 'NewSecurePass123!@',
      });
    });
  });
});
