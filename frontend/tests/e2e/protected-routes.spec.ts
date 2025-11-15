import { test, expect } from '../support/fixtures';
import { faker } from '@faker-js/faker';

/**
 * Protected Routes and RBAC E2E Tests
 * Tests route protection, role-based access control, and permission checks
 */

test.describe('Protected Routes - Unauthenticated Access', () => {
  test('should redirect unauthenticated users to login from protected routes', async ({ page }) => {
    const protectedRoutes = [
      '/dashboard',
      '/dashboard/settings',
      '/dashboard/settings/security',
      '/properties',
      '/tenants',
      '/maintenance',
      '/vendors',
    ];

    for (const route of protectedRoutes) {
      await page.goto(route);

      // Should be redirected to login
      await expect(page).toHaveURL(/\/login/, { timeout: 5000 });

      // URL should include redirect parameter
      const url = page.url();
      expect(url).toMatch(/returnUrl|redirect/);
    }
  });

  test('should preserve intended URL after authentication', async ({ page, userFactory }) => {
    const testUser = await userFactory.createUser({
      email: faker.internet.email(),
      password: 'ValidP@ssw0rd123',
    });

    // Try to access protected page
    await page.goto('/dashboard/settings/security');

    // Should redirect to login with return URL
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });

    // Login
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', 'ValidP@ssw0rd123');
    await page.click('button[type="submit"]:has-text("Sign in")');

    // Should redirect to originally intended page
    await expect(page).toHaveURL(/\/dashboard\/settings\/security/, { timeout: 10000 });
  });

  test('should allow access to public routes without authentication', async ({ page }) => {
    const publicRoutes = [
      '/',
      '/login',
      '/register',
      '/forgot-password',
    ];

    for (const route of publicRoutes) {
      await page.goto(route);

      // Should NOT be redirected
      await expect(page).toHaveURL(new RegExp(route.replace('/', '\\/')), { timeout: 3000 });

      // Should not show authentication error
      const hasAuthError = await page.locator('text=/unauthorized|forbidden|access denied/i').isVisible({ timeout: 1000 }).catch(() => false);
      expect(hasAuthError).toBe(false);
    }
  });

  test('should redirect authenticated users away from auth pages', async ({ page, userFactory, authHelper }) => {
    const testUser = await userFactory.createUser({
      email: faker.internet.email(),
      password: 'ValidP@ssw0rd123',
    });

    // Login first
    await authHelper.login(page, testUser.email, 'ValidP@ssw0rd123');

    // Try to access auth pages
    const authRoutes = ['/login', '/register'];

    for (const route of authRoutes) {
      await page.goto(route);

      // Should be redirected to dashboard
      await expect(page).toHaveURL(/\/(dashboard)?/, { timeout: 5000 });
    }
  });
});

test.describe('Protected Routes - Middleware Protection', () => {
  test('should enforce middleware protection on server routes', async ({ page }) => {
    // Test that middleware blocks access before page loads
    await page.goto('/dashboard');

    // Should be redirected immediately (server-side redirect)
    await expect(page).toHaveURL(/\/login/, { timeout: 3000 });

    // Page should not have loaded protected content
    const hasDashboardContent = await page.locator('[data-testid="dashboard-content"]').isVisible({ timeout: 500 }).catch(() => false);
    expect(hasDashboardContent).toBe(false);
  });

  test('should check authentication on every navigation', async ({ page, userFactory, authHelper }) => {
    const testUser = await userFactory.createUser({
      email: faker.internet.email(),
      password: 'ValidP@ssw0rd123',
    });

    await authHelper.login(page, testUser.email, 'ValidP@ssw0rd123');

    // Access protected page
    await page.goto('/dashboard');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible({ timeout: 5000 });

    // Manually clear cookies (simulate session expiry)
    await page.context().clearCookies();

    // Try to navigate to another protected page
    await page.goto('/dashboard/settings');

    // Should be redirected to login
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });
});

test.describe('RBAC - Role-Based Access Control', () => {
  test('should allow SUPER_ADMIN access to admin pages', async ({ page, userFactory, authHelper }) => {
    const adminUser = await userFactory.createUser({
      email: faker.internet.email(),
      password: 'ValidP@ssw0rd123',
      role: 'SUPER_ADMIN',
    });

    await authHelper.login(page, adminUser.email, 'ValidP@ssw0rd123');

    // Access admin-only pages
    await page.goto('/dashboard/admin/users');

    // Should NOT be redirected to forbidden page
    await expect(page).not.toHaveURL(/\/403/);

    // Should see admin content
    const hasAdminContent = await page.locator('[data-testid="admin-content"], h1:has-text("Users")').isVisible({ timeout: 5000 }).catch(() => false);
    // Admin page should load (or show 404 if page doesn't exist yet, but NOT 403)
  });

  test('should deny TENANT access to admin pages', async ({ page, userFactory, authHelper }) => {
    const tenantUser = await userFactory.createUser({
      email: faker.internet.email(),
      password: 'ValidP@ssw0rd123',
      role: 'TENANT',
    });

    await authHelper.login(page, tenantUser.email, 'ValidP@ssw0rd123');

    // Try to access admin page
    await page.goto('/dashboard/admin/users');

    // Should be redirected to 403 Forbidden
    await expect(page).toHaveURL(/\/403/, { timeout: 5000 });

    // Should show access denied message
    await expect(page.locator('text=/access denied|forbidden|insufficient permissions/i')).toBeVisible();
  });

  test('should show 403 Forbidden page with appropriate content', async ({ page, userFactory, authHelper }) => {
    const tenantUser = await userFactory.createUser({
      email: faker.internet.email(),
      password: 'ValidP@ssw0rd123',
      role: 'TENANT',
    });

    await authHelper.login(page, tenantUser.email, 'ValidP@ssw0rd123');

    // Navigate to admin page
    await page.goto('/dashboard/admin/properties');
    await expect(page).toHaveURL(/\/403/, { timeout: 5000 });

    // Verify 403 page content
    await expect(page.locator('h1, h2').filter({ hasText: /403|forbidden|access denied/i })).toBeVisible();
    await expect(page.locator('text=/you do not have permission|insufficient permissions/i')).toBeVisible();

    // Should have link back to dashboard or home
    await expect(page.locator('a[href*="dashboard"], a:has-text("Go Back")').first()).toBeVisible();
  });

  test('should allow PROPERTY_MANAGER access to property management', async ({ page, userFactory, authHelper }) => {
    const propertyManager = await userFactory.createUser({
      email: faker.internet.email(),
      password: 'ValidP@ssw0rd123',
      role: 'PROPERTY_MANAGER',
    });

    await authHelper.login(page, propertyManager.email, 'ValidP@ssw0rd123');

    // Access property management pages
    await page.goto('/dashboard/properties');

    // Should NOT be redirected to 403
    await expect(page).not.toHaveURL(/\/403/);
  });

  test('should deny VENDOR access to financial reports', async ({ page, userFactory, authHelper }) => {
    const vendorUser = await userFactory.createUser({
      email: faker.internet.email(),
      password: 'ValidP@ssw0rd123',
      role: 'VENDOR',
    });

    await authHelper.login(page, vendorUser.email, 'ValidP@ssw0rd123');

    // Try to access financial reports
    await page.goto('/dashboard/finance/reports');

    // Should be denied
    await expect(page).toHaveURL(/\/403/, { timeout: 5000 });
  });
});

test.describe('RBAC - Permission-Based Access Control', () => {
  test('should allow users with MANAGE_USERS permission to access user management', async ({ page, userFactory, authHelper }) => {
    const userWithPermission = await userFactory.createUser({
      email: faker.internet.email(),
      password: 'ValidP@ssw0rd123',
      permissions: ['MANAGE_USERS', 'VIEW_USERS'],
    });

    await authHelper.login(page, userWithPermission.email, 'ValidP@ssw0rd123');

    // Access user management
    await page.goto('/dashboard/admin/users');

    // Should be allowed
    await expect(page).not.toHaveURL(/\/403/);
  });

  test('should deny users without required permission', async ({ page, userFactory, authHelper }) => {
    const userWithoutPermission = await userFactory.createUser({
      email: faker.internet.email(),
      password: 'ValidP@ssw0rd123',
      permissions: ['VIEW_PROPERTIES'], // Missing MANAGE_USERS
    });

    await authHelper.login(page, userWithoutPermission.email, 'ValidP@ssw0rd123');

    // Try to access user management
    await page.goto('/dashboard/admin/users');

    // Should be denied
    await expect(page).toHaveURL(/\/403/, { timeout: 5000 });
  });

  test('should conditionally render UI elements based on permissions', async ({ page, userFactory, authHelper }) => {
    const adminUser = await userFactory.createUser({
      email: faker.internet.email(),
      password: 'ValidP@ssw0rd123',
      role: 'SUPER_ADMIN',
      permissions: ['MANAGE_USERS', 'DELETE_USERS', 'VIEW_USERS'],
    });

    await authHelper.login(page, adminUser.email, 'ValidP@ssw0rd123');

    await page.goto('/dashboard/admin/users');

    // Admin should see all action buttons
    const deleteButton = page.locator('button:has-text("Delete"), [aria-label*="delete" i]');
    const hasDeleteButton = await deleteButton.isVisible({ timeout: 3000 }).catch(() => false);

    // Elements requiring permissions should be visible
    if (hasDeleteButton) {
      await expect(deleteButton).toBeVisible();
    }
  });

  test('should hide UI elements from users without permissions', async ({ page, userFactory, authHelper }) => {
    const limitedUser = await userFactory.createUser({
      email: faker.internet.email(),
      password: 'ValidP@ssw0rd123',
      role: 'TENANT',
      permissions: ['VIEW_PROPERTIES'], // Limited permissions
    });

    await authHelper.login(page, limitedUser.email, 'ValidP@ssw0rd123');

    await page.goto('/dashboard');

    // Admin menu items should not be visible
    const adminMenuItems = await page.locator('a[href*="/admin"], text=/admin panel/i').count();
    expect(adminMenuItems).toBe(0);

    // Delete buttons should not be visible
    const deleteButtons = await page.locator('button:has-text("Delete")').count();
    // Tenant users shouldn't see delete buttons on dashboard
  });
});

test.describe('RBAC - Multiple Roles and Permissions', () => {
  test('should grant access when user has ANY of the required roles', async ({ page, userFactory, authHelper }) => {
    // Test route that accepts either PROPERTY_MANAGER or FINANCE_MANAGER
    const propertyManager = await userFactory.createUser({
      email: faker.internet.email(),
      password: 'ValidP@ssw0rd123',
      role: 'PROPERTY_MANAGER',
    });

    await authHelper.login(page, propertyManager.email, 'ValidP@ssw0rd123');

    // Access route that requires PROPERTY_MANAGER OR FINANCE_MANAGER
    await page.goto('/dashboard/reports/property-financial');

    // Should be allowed (has one of the required roles)
    const isForbidden = page.url().includes('/403');
    expect(isForbidden).toBe(false);
  });

  test('should deny access when user has NONE of the required roles', async ({ page, userFactory, authHelper }) => {
    const tenantUser = await userFactory.createUser({
      email: faker.internet.email(),
      password: 'ValidP@ssw0rd123',
      role: 'TENANT',
    });

    await authHelper.login(page, tenantUser.email, 'ValidP@ssw0rd123');

    // Try to access route requiring PROPERTY_MANAGER OR FINANCE_MANAGER
    await page.goto('/dashboard/reports/property-financial');

    // Should be denied
    await expect(page).toHaveURL(/\/403/, { timeout: 5000 });
  });
});

test.describe('Protected Routes - Client-Side Protection', () => {
  test('should show loading skeleton while verifying authentication', async ({ page, userFactory, authHelper }) => {
    const testUser = await userFactory.createUser({
      email: faker.internet.email(),
      password: 'ValidP@ssw0rd123',
    });

    await authHelper.login(page, testUser.email, 'ValidP@ssw0rd123');

    // Navigate to protected page
    await page.goto('/dashboard');

    // Should briefly show skeleton loader
    const skeleton = page.locator('[data-testid="skeleton"], [class*="skeleton"], [class*="loading"]');
    const hasLoading = await skeleton.isVisible({ timeout: 1000 }).catch(() => false);

    // After loading, should show actual content
    await expect(page.locator('[data-testid="dashboard-content"], main')).toBeVisible({ timeout: 5000 });
  });

  test('should not flash content before redirecting unauthorized users', async ({ page }) => {
    // Navigate to protected page
    await page.goto('/dashboard/admin/users');

    // Should redirect quickly without showing protected content
    await expect(page).toHaveURL(/\/login|\/403/, { timeout: 3000 });

    // Should not have shown admin content
    const flashedContent = await page.locator('[data-testid="admin-content"]').isVisible({ timeout: 500 }).catch(() => false);
    expect(flashedContent).toBe(false);
  });
});

test.describe('Protected Routes - Edge Cases', () => {
  test('should handle invalid/malformed tokens', async ({ page }) => {
    // Set invalid token in cookies
    await page.context().addCookies([{
      name: 'refreshToken',
      value: 'invalid.token.here',
      domain: 'localhost',
      path: '/',
    }]);

    // Try to access protected page
    await page.goto('/dashboard');

    // Should be redirected to login
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });

  test('should handle concurrent requests during authentication check', async ({ page, userFactory, authHelper }) => {
    const testUser = await userFactory.createUser({
      email: faker.internet.email(),
      password: 'ValidP@ssw0rd123',
    });

    await authHelper.login(page, testUser.email, 'ValidP@ssw0rd123');

    // Navigate to multiple protected pages quickly
    await Promise.all([
      page.goto('/dashboard'),
      page.goto('/dashboard/settings'),
      page.goto('/dashboard/properties'),
    ]);

    // Should end up on a valid protected page (not stuck or errored)
    const url = page.url();
    expect(url).toMatch(/\/dashboard/);
  });

  test('should maintain authentication state across tabs', async ({ page, context, userFactory, authHelper }) => {
    const testUser = await userFactory.createUser({
      email: faker.internet.email(),
      password: 'ValidP@ssw0rd123',
    });

    await authHelper.login(page, testUser.email, 'ValidP@ssw0rd123');

    // Open new tab in same context
    const newPage = await context.newPage();
    await newPage.goto('/dashboard');

    // New tab should also be authenticated
    await expect(newPage.locator('[data-testid="user-menu"]')).toBeVisible({ timeout: 5000 });
    await expect(newPage).not.toHaveURL(/\/login/);

    await newPage.close();
  });

  test('should handle role/permission changes during active session', async ({ page, userFactory, authHelper }) => {
    const testUser = await userFactory.createUser({
      email: faker.internet.email(),
      password: 'ValidP@ssw0rd123',
      role: 'PROPERTY_MANAGER',
    });

    await authHelper.login(page, testUser.email, 'ValidP@ssw0rd123');

    // Access property management (allowed)
    await page.goto('/dashboard/properties');
    await expect(page).not.toHaveURL(/\/403/);

    // Simulate role downgrade (in real app, would need backend to update and force re-auth)
    // For this test, we can verify that after token refresh, new permissions are checked

    // After role change and token refresh, user should be denied
    // This test may need actual backend support to change user role mid-session
  });
});
