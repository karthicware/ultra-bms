import { render, screen, waitFor } from '@testing-library/react';
import { ProtectedRoute } from '../protected-route';
import * as AuthContext from '@/contexts/auth-context';

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock the auth context
jest.mock('@/contexts/auth-context', () => ({
  useAuth: jest.fn(),
  usePermission: jest.fn(),
}));

describe('ProtectedRoute', () => {
  const mockUser = {
    id: '1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    roles: ['USER', 'ADMIN'],
    permissions: ['READ', 'WRITE', 'DELETE'],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
  });

  describe('Authentication', () => {
    it('should show loading state while checking authentication', () => {
      (AuthContext.useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
        user: null,
      });

      (AuthContext.usePermission as jest.Mock).mockReturnValue({
        hasRole: jest.fn(),
        hasAnyRole: jest.fn(),
        hasPermission: jest.fn(),
        hasAnyPermission: jest.fn(),
        hasAllPermissions: jest.fn(),
      });

      render(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should redirect to login when user is not authenticated', async () => {
      (AuthContext.useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
      });

      (AuthContext.usePermission as jest.Mock).mockReturnValue({
        hasRole: jest.fn(),
        hasAnyRole: jest.fn(),
        hasPermission: jest.fn(),
        hasAnyPermission: jest.fn(),
        hasAllPermissions: jest.fn(),
      });

      render(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringContaining('/login?redirect=')
        );
      });
    });

    it('should render content when user is authenticated', async () => {
      (AuthContext.useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: mockUser,
      });

      (AuthContext.usePermission as jest.Mock).mockReturnValue({
        hasRole: jest.fn(),
        hasAnyRole: jest.fn(),
        hasPermission: jest.fn(),
        hasAnyPermission: jest.fn(),
        hasAllPermissions: jest.fn(),
      });

      render(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  describe('Role-Based Access Control', () => {
    it('should redirect to 403 when user lacks required role', async () => {
      (AuthContext.useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: mockUser,
      });

      const mockHasRole = jest.fn().mockReturnValue(false);

      (AuthContext.usePermission as jest.Mock).mockReturnValue({
        hasRole: mockHasRole,
        hasAnyRole: jest.fn(),
        hasPermission: jest.fn(),
        hasAnyPermission: jest.fn(),
        hasAllPermissions: jest.fn(),
      });

      render(
        <ProtectedRoute requiredRole="SUPER_ADMIN">
          <div data-testid="protected-content">Admin Only</div>
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(mockHasRole).toHaveBeenCalledWith('SUPER_ADMIN');
        expect(mockPush).toHaveBeenCalledWith('/403');
      });
    });

    it('should render content when user has required role', async () => {
      (AuthContext.useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: mockUser,
      });

      const mockHasRole = jest.fn().mockReturnValue(true);

      (AuthContext.usePermission as jest.Mock).mockReturnValue({
        hasRole: mockHasRole,
        hasAnyRole: jest.fn(),
        hasPermission: jest.fn(),
        hasAnyPermission: jest.fn(),
        hasAllPermissions: jest.fn(),
      });

      render(
        <ProtectedRoute requiredRole="ADMIN">
          <div data-testid="protected-content">Admin Only</div>
        </ProtectedRoute>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(mockHasRole).toHaveBeenCalledWith('ADMIN');
    });

    it('should redirect when user lacks any of required roles', async () => {
      (AuthContext.useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: mockUser,
      });

      const mockHasAnyRole = jest.fn().mockReturnValue(false);

      (AuthContext.usePermission as jest.Mock).mockReturnValue({
        hasRole: jest.fn(),
        hasAnyRole: mockHasAnyRole,
        hasPermission: jest.fn(),
        hasAnyPermission: jest.fn(),
        hasAllPermissions: jest.fn(),
      });

      render(
        <ProtectedRoute requiredRoles={['SUPER_ADMIN', 'OWNER']}>
          <div data-testid="protected-content">Restricted</div>
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(mockHasAnyRole).toHaveBeenCalledWith(['SUPER_ADMIN', 'OWNER']);
        expect(mockPush).toHaveBeenCalledWith('/403');
      });
    });

    it('should render when user has at least one of required roles', async () => {
      (AuthContext.useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: mockUser,
      });

      const mockHasAnyRole = jest.fn().mockReturnValue(true);

      (AuthContext.usePermission as jest.Mock).mockReturnValue({
        hasRole: jest.fn(),
        hasAnyRole: mockHasAnyRole,
        hasPermission: jest.fn(),
        hasAnyPermission: jest.fn(),
        hasAllPermissions: jest.fn(),
      });

      render(
        <ProtectedRoute requiredRoles={['ADMIN', 'MANAGER']}>
          <div data-testid="protected-content">Manager Area</div>
        </ProtectedRoute>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(mockHasAnyRole).toHaveBeenCalledWith(['ADMIN', 'MANAGER']);
    });
  });

  describe('Permission-Based Access Control', () => {
    it('should redirect when user lacks required permission', async () => {
      (AuthContext.useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: mockUser,
      });

      const mockHasPermission = jest.fn().mockReturnValue(false);

      (AuthContext.usePermission as jest.Mock).mockReturnValue({
        hasRole: jest.fn(),
        hasAnyRole: jest.fn(),
        hasPermission: mockHasPermission,
        hasAnyPermission: jest.fn(),
        hasAllPermissions: jest.fn(),
      });

      render(
        <ProtectedRoute requiredPermission="ADMIN_ACCESS">
          <div data-testid="protected-content">Admin Functions</div>
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(mockHasPermission).toHaveBeenCalledWith('ADMIN_ACCESS');
        expect(mockPush).toHaveBeenCalledWith('/403');
      });
    });

    it('should render when user has required permission', async () => {
      (AuthContext.useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: mockUser,
      });

      const mockHasPermission = jest.fn().mockReturnValue(true);

      (AuthContext.usePermission as jest.Mock).mockReturnValue({
        hasRole: jest.fn(),
        hasAnyRole: jest.fn(),
        hasPermission: mockHasPermission,
        hasAnyPermission: jest.fn(),
        hasAllPermissions: jest.fn(),
      });

      render(
        <ProtectedRoute requiredPermission="DELETE">
          <div data-testid="protected-content">Delete Action</div>
        </ProtectedRoute>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(mockHasPermission).toHaveBeenCalledWith('DELETE');
    });

    it('should check for any permission when requireAllPermissions is false', async () => {
      (AuthContext.useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: mockUser,
      });

      const mockHasAnyPermission = jest.fn().mockReturnValue(true);

      (AuthContext.usePermission as jest.Mock).mockReturnValue({
        hasRole: jest.fn(),
        hasAnyRole: jest.fn(),
        hasPermission: jest.fn(),
        hasAnyPermission: mockHasAnyPermission,
        hasAllPermissions: jest.fn(),
      });

      render(
        <ProtectedRoute
          requiredPermissions={['WRITE', 'ADMIN']}
          requireAllPermissions={false}
        >
          <div data-testid="protected-content">Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(mockHasAnyPermission).toHaveBeenCalledWith(['WRITE', 'ADMIN']);
    });

    it('should check for all permissions when requireAllPermissions is true', async () => {
      (AuthContext.useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: mockUser,
      });

      const mockHasAllPermissions = jest.fn().mockReturnValue(true);

      (AuthContext.usePermission as jest.Mock).mockReturnValue({
        hasRole: jest.fn(),
        hasAnyRole: jest.fn(),
        hasPermission: jest.fn(),
        hasAnyPermission: jest.fn(),
        hasAllPermissions: mockHasAllPermissions,
      });

      render(
        <ProtectedRoute
          requiredPermissions={['READ', 'WRITE']}
          requireAllPermissions={true}
        >
          <div data-testid="protected-content">Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(mockHasAllPermissions).toHaveBeenCalledWith(['READ', 'WRITE']);
    });
  });

  describe('Custom Fallback URL', () => {
    it('should redirect to custom fallback URL on access denied', async () => {
      (AuthContext.useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: mockUser,
      });

      const mockHasRole = jest.fn().mockReturnValue(false);

      (AuthContext.usePermission as jest.Mock).mockReturnValue({
        hasRole: mockHasRole,
        hasAnyRole: jest.fn(),
        hasPermission: jest.fn(),
        hasAnyPermission: jest.fn(),
        hasAllPermissions: jest.fn(),
      });

      render(
        <ProtectedRoute requiredRole="SUPER_ADMIN" fallbackUrl="/unauthorized">
          <div data-testid="protected-content">Super Admin Area</div>
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/unauthorized');
      });
    });
  });
});
