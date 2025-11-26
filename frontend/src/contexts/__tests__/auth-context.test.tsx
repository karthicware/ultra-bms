/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../auth-context';
import * as authApi from '@/lib/auth-api';
import { getUserFromToken } from '@/lib/jwt-utils';

// Mock the dependencies
jest.mock('@/lib/auth-api');
jest.mock('@/lib/jwt-utils');
jest.mock('@/lib/api', () => ({
  setupAuthInterceptors: jest.fn(),
}));

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Test component that uses the auth context
function TestComponent() {
  const { user, isAuthenticated, isLoading, login, logout, register } = useAuth();

  const handleLogin = async () => {
    try {
      await login('test@example.com', 'password123');
    } catch (error) {
      // Expected error - silently catch
    }
  };

  const handleRegister = async () => {
    try {
      await register({
        email: 'new@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        termsAccepted: true,
      });
    } catch (error) {
      // Expected error - silently catch
    }
  };

  return (
    <div>
      <div data-testid="loading-state">{isLoading ? 'loading' : 'loaded'}</div>
      <div data-testid="auth-state">{isAuthenticated ? 'authenticated' : 'not-authenticated'}</div>
      <div data-testid="user-email">{user?.email || 'no-user'}</div>
      <button data-testid="btn-login" onClick={handleLogin}>
        Login
      </button>
      <button data-testid="btn-logout" onClick={logout}>
        Logout
      </button>
      <button data-testid="btn-register" onClick={handleRegister}>
        Register
      </button>
    </div>
  );
}

describe('AuthContext', () => {
  const mockUser = {
    id: '1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    roles: ['USER'],
    permissions: ['READ'],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
  });

  describe('Initial State', () => {
    it('should show loading state initially', () => {
      (authApi.refreshAccessToken as jest.Mock).mockResolvedValue({
        success: false,
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByTestId('loading-state')).toHaveTextContent('loading');
    });

    it('should restore session if refresh token is valid', async () => {
      const mockToken = 'valid-access-token';

      (authApi.refreshAccessToken as jest.Mock).mockResolvedValue({
        success: true,
        data: { accessToken: mockToken },
      });

      (getUserFromToken as jest.Mock).mockReturnValue(mockUser);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading-state')).toHaveTextContent('loaded');
      });

      expect(screen.getByTestId('auth-state')).toHaveTextContent('authenticated');
      expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
    });

    it('should not restore session if refresh token is invalid', async () => {
      (authApi.refreshAccessToken as jest.Mock).mockRejectedValue(new Error('Invalid token'));

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading-state')).toHaveTextContent('loaded');
      });

      expect(screen.getByTestId('auth-state')).toHaveTextContent('not-authenticated');
      expect(screen.getByTestId('user-email')).toHaveTextContent('no-user');
    });
  });

  describe('Login', () => {
    it('should successfully login with valid credentials', async () => {
      const mockToken = 'access-token';

      (authApi.refreshAccessToken as jest.Mock).mockResolvedValue({
        success: false,
      });

      (authApi.login as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          accessToken: mockToken,
          user: mockUser,
        },
      });

      const user = userEvent.setup();

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading-state')).toHaveTextContent('loaded');
      });

      await user.click(screen.getByTestId('btn-login'));

      await waitFor(() => {
        expect(screen.getByTestId('auth-state')).toHaveTextContent('authenticated');
      });

      expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
      expect(authApi.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        rememberMe: false,
      });
    });

    it('should throw error on failed login', async () => {
      (authApi.refreshAccessToken as jest.Mock).mockResolvedValue({
        success: false,
      });

      (authApi.login as jest.Mock).mockRejectedValue(new Error('Invalid credentials'));

      const user = userEvent.setup();

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading-state')).toHaveTextContent('loaded');
      });

      await user.click(screen.getByTestId('btn-login'));

      await waitFor(() => {
        expect(screen.getByTestId('auth-state')).toHaveTextContent('not-authenticated');
      });
    });
  });

  describe('Logout', () => {
    it('should successfully logout', async () => {
      const mockToken = 'access-token';

      (authApi.refreshAccessToken as jest.Mock).mockResolvedValue({
        success: true,
        data: { accessToken: mockToken },
      });

      (getUserFromToken as jest.Mock).mockReturnValue(mockUser);

      (authApi.logout as jest.Mock).mockResolvedValue({
        success: true,
      });

      const user = userEvent.setup();

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-state')).toHaveTextContent('authenticated');
      });

      await user.click(screen.getByTestId('btn-logout'));

      await waitFor(() => {
        expect(screen.getByTestId('auth-state')).toHaveTextContent('not-authenticated');
      });

      expect(screen.getByTestId('user-email')).toHaveTextContent('no-user');
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  describe('Register', () => {
    it('should successfully register a new user', async () => {
      (authApi.refreshAccessToken as jest.Mock).mockResolvedValue({
        success: false,
      });

      (authApi.register as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          id: '2',
          email: 'new@example.com',
          firstName: 'John',
          lastName: 'Doe',
        },
      });

      const user = userEvent.setup();

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading-state')).toHaveTextContent('loaded');
      });

      await user.click(screen.getByTestId('btn-register'));

      await waitFor(() => {
        expect(authApi.register).toHaveBeenCalledWith({
          email: 'new@example.com',
          password: 'password123',
          confirmPassword: 'password123',
          firstName: 'John',
          lastName: 'Doe',
          termsAccepted: true,
        });
      });
    });

    it('should throw error on failed registration', async () => {
      (authApi.refreshAccessToken as jest.Mock).mockResolvedValue({
        success: false,
      });

      (authApi.register as jest.Mock).mockRejectedValue(
        new Error('Email already exists')
      );

      const user = userEvent.setup();

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading-state')).toHaveTextContent('loaded');
      });

      await user.click(screen.getByTestId('btn-register'));

      // Registration should fail but not crash
      await waitFor(() => {
        expect(screen.getByTestId('auth-state')).toHaveTextContent('not-authenticated');
      });
    });
  });

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = jest.fn();

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useAuth must be used within an AuthProvider');

      console.error = originalError;
    });
  });
});
