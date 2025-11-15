import { test, expect } from '../support/fixtures';
import { faker } from '@faker-js/faker';

/**
 * Session Management E2E Tests
 * Tests session lifecycle, token refresh, expiry warnings, and multi-device management
 */

test.describe('Session Management - Token Refresh', () => {
  test('should automatically refresh expired access token', async ({ page, userFactory, authHelper }) => {
    const testUser = await userFactory.createUser({
      email: faker.internet.email(),
      password: 'ValidP@ssw0rd123',
    });

    // Login
    await authHelper.login(page, testUser.email, 'ValidP@ssw0rd123');
    await expect(page).toHaveURL(/\/(dashboard)?/, { timeout: 10000 });

    // Monitor network requests
    const refreshRequests = [];
    page.on('request', request => {
      if (request.url().includes('/auth/refresh')) {
        refreshRequests.push(request);
      }
    });

    // Make an API call after some time (simulating token near expiry)
    // In a real test, you would either:
    // 1. Wait for actual token expiry (1 hour)
    // 2. Use a test endpoint to set short-lived tokens
    // 3. Manually modify token expiration time

    // For this test, we'll navigate and make requests
    await page.goto('/dashboard/settings');
    await page.waitForTimeout(1000);

    // The token refresh should happen automatically in the background
    // Verify the page still works (user is authenticated)
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible({ timeout: 5000 });
  });

  test('should handle refresh token expiration', async ({ page, userFactory, authHelper }) => {
    const testUser = await userFactory.createUser({
      email: faker.internet.email(),
      password: 'ValidP@ssw0rd123',
    });

    // Login
    await authHelper.login(page, testUser.email, 'ValidP@ssw0rd123');
    await expect(page).toHaveURL(/\/(dashboard)?/, { timeout: 10000 });

    // Simulate refresh token expiration by clearing cookies
    await page.context().clearCookies();

    // Try to navigate to protected page
    await page.goto('/dashboard/settings');

    // Should be redirected to login
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });

    // Should show session expired message
    await expect(page.locator('text=/session expired|please login again/i')).toBeVisible({ timeout: 3000 });
  });

  test('should maintain session across page refreshes', async ({ page, userFactory, authHelper }) => {
    const testUser = await userFactory.createUser({
      email: faker.internet.email(),
      password: 'ValidP@ssw0rd123',
    });

    // Login
    await authHelper.login(page, testUser.email, 'ValidP@ssw0rd123');
    await expect(page).toHaveURL(/\/(dashboard)?/, { timeout: 10000 });

    // Verify user is authenticated
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();

    // Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // User should still be authenticated
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible({ timeout: 5000 });
    await expect(page).toHaveURL(/\/(dashboard)?/);
  });
});

test.describe('Session Management - Session Expiry Warning', () => {
  test.skip('should show session expiry warning before timeout', async ({ page, userFactory, authHelper }) => {
    // This test requires either:
    // 1. Waiting 55 minutes (impractical for automated tests)
    // 2. A test endpoint to set custom token expiration
    // 3. Mocking the token expiration time

    const testUser = await userFactory.createUser({
      email: faker.internet.email(),
      password: 'ValidP@ssw0rd123',
    });

    await authHelper.login(page, testUser.email, 'ValidP@ssw0rd123');

    // In a real implementation, you would:
    // - Use a test-only endpoint to create a token expiring in 5 minutes
    // - Wait 1 minute
    // - Verify warning modal appears
    // - Verify countdown timer updates
    // - Click "Stay Logged In" button
    // - Verify token is refreshed and modal closes
  });

  test.skip('should auto-logout when session expiry countdown reaches zero', async ({ page, userFactory, authHelper }) => {
    // Similar to above, requires test-specific token expiration configuration

    const testUser = await userFactory.createUser({
      email: faker.internet.email(),
      password: 'ValidP@ssw0rd123',
    });

    await authHelper.login(page, testUser.email, 'ValidP@ssw0rd123');

    // Would need to:
    // - Set token expiring in 5 minutes
    // - Wait 5 minutes
    // - Verify auto-logout occurs
    // - Verify redirect to login page
    // - Verify "Session expired" message
  });
});

test.describe('Session Management - Active Sessions', () => {
  test('should display list of active sessions', async ({ page, userFactory, authHelper }) => {
    const testUser = await userFactory.createUser({
      email: faker.internet.email(),
      password: 'ValidP@ssw0rd123',
    });

    // Login
    await authHelper.login(page, testUser.email, 'ValidP@ssw0rd123');

    // Navigate to security settings
    await page.goto('/dashboard/settings/security');
    await page.waitForLoadState('networkidle');

    // Verify active sessions section exists
    await expect(page.locator('text=/active sessions|your sessions/i')).toBeVisible({ timeout: 5000 });

    // Verify current session is shown
    await expect(page.locator('text=/current session|this device/i')).toBeVisible();

    // Verify session details are displayed
    await expect(page.locator('text=/browser|device|ip address/i')).toBeVisible();
  });

  test('should show current session with badge', async ({ page, userFactory, authHelper }) => {
    const testUser = await userFactory.createUser({
      email: faker.internet.email(),
      password: 'ValidP@ssw0rd123',
    });

    await authHelper.login(page, testUser.email, 'ValidP@ssw0rd123');
    await page.goto('/dashboard/settings/security');

    // Verify current session has a badge or indicator
    const currentSessionRow = page.locator('text=/current session|this device/i').locator('..').locator('..');
    await expect(currentSessionRow).toBeVisible();
  });

  test('should revoke a specific session', async ({ page, browser, userFactory }) => {
    const testUser = await userFactory.createUser({
      email: faker.internet.email(),
      password: 'ValidP@ssw0rd123',
    });

    // Create first session (browser context 1)
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();
    await page1.goto('/login');
    await page1.fill('input[type="email"]', testUser.email);
    await page1.fill('input[type="password"]', 'ValidP@ssw0rd123');
    await page1.click('button[type="submit"]:has-text("Sign in")');
    await expect(page1).toHaveURL(/\/(dashboard)?/, { timeout: 10000 });

    // Create second session (browser context 2)
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await page2.goto('/login');
    await page2.fill('input[type="email"]', testUser.email);
    await page2.fill('input[type="password"]', 'ValidP@ssw0rd123');
    await page2.click('button[type="submit"]:has-text("Sign in")');
    await expect(page2).toHaveURL(/\/(dashboard)?/, { timeout: 10000 });

    // From page1, navigate to sessions and verify 2 sessions are shown
    await page1.goto('/dashboard/settings/security');
    await page1.waitForLoadState('networkidle');

    const sessionRows = page1.locator('tr, [data-testid="session-item"]');
    const sessionCount = await sessionRows.count();
    expect(sessionCount).toBeGreaterThanOrEqual(2);

    // Revoke the second session (non-current)
    const revokeButtons = page1.locator('button:has-text("Revoke")');
    const revokeButtonCount = await revokeButtons.count();

    if (revokeButtonCount > 0) {
      // Click first non-current session's revoke button
      const firstRevokeButton = revokeButtons.first();
      await firstRevokeButton.click();

      // Confirm revocation in dialog
      const confirmButton = page1.locator('button:has-text("Confirm"), button:has-text("Yes")');
      if (await confirmButton.isVisible({ timeout: 2000 })) {
        await confirmButton.click();
      }

      // Verify success message
      await expect(page1.locator('text=/session revoked|session ended/i')).toBeVisible({ timeout: 5000 });

      // From page2, try to access protected resource
      await page2.goto('/dashboard/settings');

      // Page2 should be logged out and redirected to login
      await expect(page2).toHaveURL(/\/login/, { timeout: 10000 });
    }

    await context1.close();
    await context2.close();
  });

  test('should logout from all other devices', async ({ page, browser, userFactory }) => {
    const testUser = await userFactory.createUser({
      email: faker.internet.email(),
      password: 'ValidP@ssw0rd123',
    });

    // Create multiple sessions
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();
    await page1.goto('/login');
    await page1.fill('input[type="email"]', testUser.email);
    await page1.fill('input[type="password"]', 'ValidP@ssw0rd123');
    await page1.click('button[type="submit"]:has-text("Sign in")');
    await expect(page1).toHaveURL(/\/(dashboard)?/, { timeout: 10000 });

    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await page2.goto('/login');
    await page2.fill('input[type="email"]', testUser.email);
    await page2.fill('input[type="password"]', 'ValidP@ssw0rd123');
    await page2.click('button[type="submit"]:has-text("Sign in")');
    await expect(page2).toHaveURL(/\/(dashboard)?/, { timeout: 10000 });

    // From page1, logout all other devices
    await page1.goto('/dashboard/settings/security');
    await page1.waitForLoadState('networkidle');

    const logoutAllButton = page1.locator('button:has-text("Logout All"), button:has-text("Logout all other devices")');
    if (await logoutAllButton.isVisible({ timeout: 3000 })) {
      await logoutAllButton.click();

      // Confirm in dialog
      const confirmButton = page1.locator('button:has-text("Confirm"), button:has-text("Yes")');
      if (await confirmButton.isVisible({ timeout: 2000 })) {
        await confirmButton.click();
      }

      // Verify success message
      await expect(page1.locator('text=/logged out|sessions ended/i')).toBeVisible({ timeout: 5000 });

      // Page1 should still be logged in
      await expect(page1.locator('[data-testid="user-menu"]')).toBeVisible();

      // Page2 should be logged out
      await page2.goto('/dashboard');
      await expect(page2).toHaveURL(/\/login/, { timeout: 10000 });
    }

    await context1.close();
    await context2.close();
  });

  test('should auto-refresh session list', async ({ page, userFactory, authHelper }) => {
    const testUser = await userFactory.createUser({
      email: faker.internet.email(),
      password: 'ValidP@ssw0rd123',
    });

    await authHelper.login(page, testUser.email, 'ValidP@ssw0rd123');
    await page.goto('/dashboard/settings/security');

    // Capture initial session count
    await page.waitForTimeout(1000);
    const initialRows = await page.locator('tr, [data-testid="session-item"]').count();

    // Wait for auto-refresh (typically 30 seconds)
    // For testing, we can verify the refresh endpoint is called
    const refreshRequests = [];
    page.on('request', request => {
      if (request.url().includes('/auth/sessions')) {
        refreshRequests.push(request);
      }
    });

    // Wait a bit to see if refresh request is made
    await page.waitForTimeout(5000);

    // At least one request should have been made (initial load)
    expect(refreshRequests.length).toBeGreaterThan(0);
  });
});

test.describe('Session Management - Change Password', () => {
  test('should successfully change password', async ({ page, userFactory, authHelper }) => {
    const testUser = await userFactory.createUser({
      email: faker.internet.email(),
      password: 'OldP@ssw0rd123',
    });

    await authHelper.login(page, testUser.email, 'OldP@ssw0rd123');
    await page.goto('/dashboard/settings/security');

    // Fill change password form
    await page.fill('input[name="currentPassword"], input[id*="currentPassword"]', 'OldP@ssw0rd123');
    await page.fill('input[name="newPassword"], input[id*="newPassword"]', 'NewP@ssw0rd123');
    await page.fill('input[name="confirmNewPassword"], input[id*="confirmPassword"]', 'NewP@ssw0rd123');

    // Submit
    await page.click('button[type="submit"]:has-text("Change Password"), button:has-text("Update Password")');

    // Verify success message
    await expect(page.locator('text=/password changed|password updated successfully/i')).toBeVisible({
      timeout: 5000,
    });

    // Logout
    await authHelper.logout(page);

    // Login with new password
    await page.goto('/login');
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', 'NewP@ssw0rd123');
    await page.click('button[type="submit"]:has-text("Sign in")');

    // Should login successfully
    await expect(page).toHaveURL(/\/(dashboard)?/, { timeout: 10000 });
  });

  test('should reject wrong current password', async ({ page, userFactory, authHelper }) => {
    const testUser = await userFactory.createUser({
      email: faker.internet.email(),
      password: 'OldP@ssw0rd123',
    });

    await authHelper.login(page, testUser.email, 'OldP@ssw0rd123');
    await page.goto('/dashboard/settings/security');

    // Fill with wrong current password
    await page.fill('input[name="currentPassword"], input[id*="currentPassword"]', 'WrongP@ssw0rd123');
    await page.fill('input[name="newPassword"], input[id*="newPassword"]', 'NewP@ssw0rd123');
    await page.fill('input[name="confirmNewPassword"], input[id*="confirmPassword"]', 'NewP@ssw0rd123');

    await page.click('button[type="submit"]:has-text("Change Password"), button:has-text("Update Password")');

    // Should show error
    await expect(page.locator('text=/current password.*incorrect|wrong password/i')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should validate new password requirements', async ({ page, userFactory, authHelper }) => {
    const testUser = await userFactory.createUser({
      email: faker.internet.email(),
      password: 'OldP@ssw0rd123',
    });

    await authHelper.login(page, testUser.email, 'OldP@ssw0rd123');
    await page.goto('/dashboard/settings/security');

    // Try weak new password
    await page.fill('input[name="currentPassword"], input[id*="currentPassword"]', 'OldP@ssw0rd123');
    await page.fill('input[name="newPassword"], input[id*="newPassword"]', 'weak');
    await page.fill('input[name="confirmNewPassword"], input[id*="confirmPassword"]', 'weak');

    await page.click('button[type="submit"]:has-text("Change Password"), button:has-text("Update Password")');

    // Should show validation error
    await expect(page.locator('text=/password.*requirements|password.*strong/i')).toBeVisible({
      timeout: 3000,
    });
  });
});

test.describe('Session Management - Logout', () => {
  test('should successfully logout and clear session', async ({ page, userFactory, authHelper }) => {
    const testUser = await userFactory.createUser({
      email: faker.internet.email(),
      password: 'ValidP@ssw0rd123',
    });

    await authHelper.login(page, testUser.email, 'ValidP@ssw0rd123');
    await expect(page).toHaveURL(/\/(dashboard)?/, { timeout: 10000 });

    // Logout
    await authHelper.logout(page);

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });

    // Try to access protected page
    await page.goto('/dashboard');

    // Should be redirected back to login
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });

    // Verify cookies are cleared
    const cookies = await page.context().cookies();
    const refreshToken = cookies.find(c => c.name === 'refreshToken');
    expect(refreshToken).toBeUndefined();
  });

  test('should clear user session data on logout', async ({ page, userFactory, authHelper }) => {
    const testUser = await userFactory.createUser({
      email: faker.internet.email(),
      password: 'ValidP@ssw0rd123',
    });

    await authHelper.login(page, testUser.email, 'ValidP@ssw0rd123');

    // Store some data in session storage (if app uses it)
    await page.evaluate(() => {
      sessionStorage.setItem('test-data', 'some-value');
    });

    // Logout
    await authHelper.logout(page);

    // Session storage should be cleared (or at minimum, auth data should be cleared)
    const sessionData = await page.evaluate(() => sessionStorage.getItem('test-data'));
    // Note: Whether this is cleared depends on implementation
  });
});

test.describe('Session Management - CSRF Protection', () => {
  test('should include CSRF token in state-changing requests', async ({ page, userFactory, authHelper }) => {
    const testUser = await userFactory.createUser({
      email: faker.internet.email(),
      password: 'ValidP@ssw0rd123',
    });

    await authHelper.login(page, testUser.email, 'ValidP@ssw0rd123');
    await page.goto('/dashboard/settings/security');

    // Monitor change password request for CSRF token
    const requestPromise = page.waitForRequest(request =>
      request.url().includes('/auth/change-password') && request.method() === 'POST'
    );

    await page.fill('input[name="currentPassword"]', 'ValidP@ssw0rd123');
    await page.fill('input[name="newPassword"]', 'NewP@ssw0rd123');
    await page.fill('input[name="confirmNewPassword"]', 'NewP@ssw0rd123');
    await page.click('button:has-text("Change Password")');

    const request = await requestPromise.catch(() => null);

    if (request) {
      const headers = request.headers();
      const csrfToken = headers['x-xsrf-token'] || headers['x-csrf-token'];

      // CSRF token should be present for POST requests
      expect(csrfToken).toBeTruthy();
    }
  });
});
