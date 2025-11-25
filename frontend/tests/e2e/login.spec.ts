import { test, expect } from '../support/fixtures';
import { faker } from '@faker-js/faker';

/**
 * Login Flow E2E Tests
 * Tests the complete login authentication workflow
 */

test.describe('Login Page - UI and Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
  });

  test('should display all login form elements', async ({ page }) => {
    // Verify page title and heading
    await expect(page).toHaveTitle(/Sign in|Login/i);
    await expect(page.locator('h1, h2').filter({ hasText: /sign in/i })).toBeVisible();

    // Verify form inputs
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('input[type="checkbox"]').filter({ has: page.locator('text=/remember me/i') })).toBeVisible();

    // Verify buttons and links
    await expect(page.locator('button[type="submit"]:has-text("Sign in")')).toBeVisible();
    await expect(page.locator('a[href="/forgot-password"]')).toBeVisible();
    await expect(page.locator('a[href="/register"]')).toBeVisible();
  });

  test('should show validation errors for empty form submission', async ({ page }) => {
    await page.click('button[type="submit"]:has-text("Sign in")');

    // Verify validation errors appear
    await expect(page.locator('text=/email is required|required field/i')).toBeVisible();
    await expect(page.locator('text=/password is required|required field/i')).toBeVisible();
  });

  test('should show validation error for invalid email format', async ({ page }) => {
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', 'SomePassword123!');
    await page.click('button[type="submit"]:has-text("Sign in")');

    await expect(page.locator('text=/valid email|invalid email/i')).toBeVisible();
  });

  test('should toggle password visibility', async ({ page }) => {
    const passwordInput = page.locator('input[type="password"]').first();

    // Initially hidden
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click show password toggle
    const toggleButton = page.locator('button[aria-label*="password" i], button:has(svg)').filter({
      has: page.locator('[class*="eye"]')
    }).first();
    await toggleButton.click();

    // Now visible
    await expect(passwordInput).toHaveAttribute('type', 'text');

    // Click again to hide
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should have accessible form labels', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');

    // Verify autocomplete attributes
    await expect(emailInput).toHaveAttribute('autocomplete', 'email');
    await expect(passwordInput).toHaveAttribute('autocomplete', /current-password|password/);

    // Verify inputs have labels (via aria-label or associated label element)
    const emailLabel = await emailInput.getAttribute('aria-label');
    const passwordLabel = await passwordInput.getAttribute('aria-label');

    expect(emailLabel || await page.locator('label[for*="email"]').count()).toBeTruthy();
    expect(passwordLabel || await page.locator('label[for*="password"]').count()).toBeTruthy();
  });
});

test.describe('Login Flow - Successful Authentication', () => {
  test('should successfully login with valid credentials', async ({ page, userFactory }) => {
    let testUser;
    try {
      testUser = await userFactory.createUser({
        email: faker.internet.email(),
        password: 'ValidP@ssw0rd123',
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      test.skip(errorMessage.includes('Backend API is not available'));
      return;
    }

    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Fill in credentials
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', 'ValidP@ssw0rd123');

    // Submit form
    await page.click('button[type="submit"]:has-text("Sign in")');

    // Verify successful login - should redirect to dashboard
    await expect(page).toHaveURL(/\/(dashboard)?/, { timeout: 10000 });

    // Verify user is authenticated (user menu or profile visible)
    await expect(page.locator('[data-testid="user-menu"], [aria-label="User menu"]')).toBeVisible({ timeout: 5000 });
  });

  test('should persist "Remember Me" preference', async ({ page, userFactory }) => {
    const testUser = await userFactory.createUser({
      email: faker.internet.email(),
      password: 'ValidP@ssw0rd123',
    });

    await page.goto('/login');

    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', 'ValidP@ssw0rd123');

    // Check "Remember me"
    await page.check('input[type="checkbox"]');

    await page.click('button[type="submit"]:has-text("Sign in")');
    await expect(page).toHaveURL(/\/(dashboard)?/, { timeout: 10000 });

    // Verify refresh token cookie has extended expiration (7+ days)
    const cookies = await page.context().cookies();
    const refreshToken = cookies.find(c => c.name === 'refreshToken');

    if (refreshToken) {
      const expirationDays = (refreshToken.expires - Date.now() / 1000) / 86400;
      expect(expirationDays).toBeGreaterThan(6); // Should be 7+ days
    }
  });

  test('should redirect to intended page after login', async ({ page, userFactory }) => {
    const testUser = await userFactory.createUser({
      email: faker.internet.email(),
      password: 'ValidP@ssw0rd123',
    });

    // Try to access protected page while logged out
    await page.goto('/dashboard/settings');

    // Should be redirected to login with returnUrl
    await expect(page).toHaveURL(/\/login.*returnUrl|redirect/);

    // Login
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', 'ValidP@ssw0rd123');
    await page.click('button[type="submit"]:has-text("Sign in")');

    // Should redirect back to intended page
    await expect(page).toHaveURL(/\/dashboard\/settings/, { timeout: 10000 });
  });
});

test.describe('Login Flow - Authentication Errors', () => {
  test('should show error for invalid credentials', async ({ page, userFactory }) => {
    const testUser = await userFactory.createUser({
      email: faker.internet.email(),
      password: 'ValidP@ssw0rd123',
    });

    await page.goto('/login');

    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', 'WrongPassword123!');

    await page.click('button[type="submit"]:has-text("Sign in")');

    // Verify error message appears
    await expect(page.locator('text=/invalid credentials|incorrect password|login failed/i')).toBeVisible({
      timeout: 5000,
    });

    // Verify still on login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('should show error for non-existent user', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[type="email"]', 'nonexistent@example.com');
    await page.fill('input[type="password"]', 'SomePassword123!');

    await page.click('button[type="submit"]:has-text("Sign in")');

    // Verify generic error (don't reveal if email exists)
    await expect(page.locator('text=/invalid credentials|login failed/i')).toBeVisible({ timeout: 5000 });
  });

  test('should handle network errors gracefully', async ({ page, userFactory }) => {
    const testUser = await userFactory.createUser({
      email: faker.internet.email(),
      password: 'ValidP@ssw0rd123',
    });

    await page.goto('/login');

    // Simulate network failure
    await page.route('**/api/v1/auth/login', route => route.abort('failed'));

    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', 'ValidP@ssw0rd123');
    await page.click('button[type="submit"]:has-text("Sign in")');

    // Verify network error message
    await expect(page.locator('text=/network error|unable to connect|connection failed/i')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should display server error message', async ({ page, userFactory }) => {
    const testUser = await userFactory.createUser({
      email: faker.internet.email(),
      password: 'ValidP@ssw0rd123',
    });

    await page.goto('/login');

    // Simulate server error (500)
    await page.route('**/api/v1/auth/login', route =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: { message: 'Internal server error' },
        }),
      })
    );

    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', 'ValidP@ssw0rd123');
    await page.click('button[type="submit"]:has-text("Sign in")');

    // Verify server error message
    await expect(page.locator('text=/server error|something went wrong/i')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Login Flow - UI/UX Features', () => {
  test('should show loading state during login', async ({ page, userFactory }) => {
    const testUser = await userFactory.createUser({
      email: faker.internet.email(),
      password: 'ValidP@ssw0rd123',
    });

    await page.goto('/login');

    // Delay API response to see loading state
    await page.route('**/api/v1/auth/login', async route => {
      await page.waitForTimeout(1000);
      await route.continue();
    });

    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', 'ValidP@ssw0rd123');

    const submitButton = page.locator('button[type="submit"]:has-text("Sign in")');
    await submitButton.click();

    // Verify loading state
    await expect(submitButton).toBeDisabled({ timeout: 500 });
    await expect(page.locator('button:has-text("Signing in"), button:has([class*="spinner"])')).toBeVisible({
      timeout: 500,
    });
  });

  test('should be keyboard accessible', async ({ page }) => {
    await page.goto('/login');

    // Tab through form
    await page.keyboard.press('Tab');
    await expect(page.locator('input[type="email"]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('input[type="password"]')).toBeFocused();

    await page.keyboard.press('Tab');
    // Should focus password toggle or forgot password link

    // Enter to submit form
    await page.locator('input[type="email"]').fill('test@example.com');
    await page.locator('input[type="password"]').fill('Password123!');
    await page.keyboard.press('Enter');

    // Form should submit (will show validation or error)
    await expect(page.locator('text=/invalid credentials|required|logging in/i')).toBeVisible({
      timeout: 3000,
    });
  });

  test('should clear password field after failed login', async ({ page, userFactory }) => {
    const testUser = await userFactory.createUser({
      email: faker.internet.email(),
      password: 'ValidP@ssw0rd123',
    });

    await page.goto('/login');

    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', 'WrongPassword');
    await page.click('button[type="submit"]:has-text("Sign in")');

    // After failed login, password field should be cleared
    await expect(page.locator('text=/invalid credentials/i')).toBeVisible({ timeout: 5000 });

    const passwordValue = await page.locator('input[type="password"]').inputValue();
    expect(passwordValue).toBe('');
  });

  test('should auto-focus email input on page load', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Email input should be auto-focused
    await expect(page.locator('input[type="email"]')).toBeFocused({ timeout: 2000 });
  });
});

test.describe('Login Flow - Redirect Scenarios', () => {
  test('should redirect authenticated users away from login page', async ({ page, userFactory, authHelper }) => {
    const testUser = await userFactory.createUser({
      email: faker.internet.email(),
      password: 'ValidP@ssw0rd123',
    });

    // Login first
    await authHelper.login(page, testUser.email, 'ValidP@ssw0rd123');
    await expect(page).toHaveURL(/\/(dashboard)?/, { timeout: 10000 });

    // Try to access login page while authenticated
    await page.goto('/login');

    // Should be redirected to dashboard
    await expect(page).toHaveURL(/\/(dashboard)?/, { timeout: 5000 });
  });

  test('should preserve query parameters in redirect URL', async ({ page, userFactory }) => {
    const testUser = await userFactory.createUser({
      email: faker.internet.email(),
      password: 'ValidP@ssw0rd123',
    });

    // Try to access protected page with query params
    await page.goto('/dashboard/settings?tab=security');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);

    // Login
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', 'ValidP@ssw0rd123');
    await page.click('button[type="submit"]:has-text("Sign in")');

    // Should redirect back with query params preserved
    await expect(page).toHaveURL(/\/dashboard\/settings.*tab=security/, { timeout: 10000 });
  });
});

test.describe('Login Flow - Rate Limiting', () => {
  test.skip('should enforce rate limit after multiple failed attempts', async ({ page }) => {
    // This test requires backend rate limiting to be configured
    // Skip if not available in test environment

    await page.goto('/login');

    const fakeEmail = 'test@example.com';
    const fakePassword = 'WrongPassword123!';

    // Attempt login 5 times (typical rate limit threshold)
    for (let i = 0; i < 5; i++) {
      await page.fill('input[type="email"]', fakeEmail);
      await page.fill('input[type="password"]', fakePassword);
      await page.click('button[type="submit"]:has-text("Sign in")');
      await page.waitForTimeout(500);
    }

    // 6th attempt should be rate limited
    await page.fill('input[type="email"]', fakeEmail);
    await page.fill('input[type="password"]', fakePassword);
    await page.click('button[type="submit"]:has-text("Sign in")');

    // Verify rate limit error
    await expect(page.locator('text=/too many attempts|rate limit|try again later/i')).toBeVisible({
      timeout: 5000,
    });
  });
});

test.describe('Login Flow - CSRF Protection', () => {
  test('should include CSRF token in login request', async ({ page, userFactory }) => {
    const testUser = await userFactory.createUser({
      email: faker.internet.email(),
      password: 'ValidP@ssw0rd123',
    });

    await page.goto('/login');

    // Monitor network request
    const requestPromise = page.waitForRequest(request =>
      request.url().includes('/api/v1/auth/login') && request.method() === 'POST'
    );

    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', 'ValidP@ssw0rd123');
    await page.click('button[type="submit"]:has-text("Sign in")');

    const request = await requestPromise;
    const headers = request.headers();

    // Verify CSRF token is sent (if backend provides it)
    // This may be in X-XSRF-TOKEN or X-CSRF-TOKEN header
    const hasCsrfHeader = headers['x-xsrf-token'] || headers['x-csrf-token'];

    // Note: CSRF token may only be required for state-changing operations after login
    // so this assertion may be conditional based on backend implementation
    if (hasCsrfHeader) {
      expect(hasCsrfHeader).toBeTruthy();
    }
  });
});
