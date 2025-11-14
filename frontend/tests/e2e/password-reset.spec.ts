import { test, expect } from '../support/fixtures';
import { faker } from '@faker-js/faker';

/**
 * Password Reset Flow E2E Tests
 * Tests the complete password reset and recovery workflow
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

test.describe('Password Reset Flow - Happy Path', () => {
  test('should complete full password reset flow successfully', async ({ page, userFactory }) => {
    // Step 1: Create test user
    const testUser = await userFactory.createUser({
      email: faker.internet.email(),
      password: 'OldPassword123!',
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
    });

    // Step 2: Navigate to forgot password page
    await page.goto('/forgot-password');
    await page.waitForLoadState('networkidle');

    // Verify page loaded
    await expect(page.locator('text=Forgot Password?')).toBeVisible();

    // Step 3: Submit forgot password request
    await page.fill('input[type="email"]', testUser.email);
    await page.click('button:has-text("Send Reset Link")');

    // Verify success message
    await expect(page.locator('text=Check Your Email')).toBeVisible();
    await expect(page.locator('text=15 minutes')).toBeVisible();

    // Step 4: Mock token retrieval (in real scenario, would check email)
    // For E2E, we'll use the API directly to get the token
    const tokenResponse = await page.request.get(`${API_BASE_URL}/v1/test/password-reset-token/${testUser.email}`);
    if (!tokenResponse.ok()) {
      test.skip(true, 'Test token endpoint not available - skipping token retrieval');
      return;
    }
    const { token } = await tokenResponse.json();

    // Step 5: Navigate to reset password page with token
    await page.goto(`/reset-password?token=${token}`);
    await page.waitForLoadState('networkidle');

    // Verify token is being validated
    await expect(page.locator('text=Reset Your Password')).toBeVisible({timeout: 10000});

    // Verify remaining minutes is displayed
    await expect(page.locator('text=/expires in \\d+ minute/i')).toBeVisible();

    // Step 6: Enter new password
    const newPassword = 'NewSecureP@ssw0rd123';
    await page.fill('input#password', newPassword);

    // Verify password strength indicator appears
    await expect(page.locator('text=Password Strength')).toBeVisible();
    await expect(page.locator('text=Strong')).toBeVisible(); // Should show "Strong"

    // Verify all requirements are met (checkmarks visible)
    await expect(page.locator('text=At least 8 characters')).toBeVisible();
    await expect(page.locator('text=One uppercase letter')).toBeVisible();
    await expect(page.locator('text=One lowercase letter')).toBeVisible();
    await expect(page.locator('text=One number')).toBeVisible();
    await expect(page.locator('text=/One special character/')).toBeVisible();

    // Step 7: Confirm password
    await page.fill('input#confirmPassword', newPassword);

    // Step 8: Submit password reset
    await page.click('button:has-text("Reset Password")');

    // Verify success message
    await expect(page.locator('text=Password Reset Successful')).toBeVisible();
    await expect(page.locator('text=Redirecting to login')).toBeVisible();

    // Wait for redirect to login
    await page.waitForURL('/login', { timeout: 5000 });

    // Step 9: Login with new password
    await page.fill('[data-testid="email-input"]', testUser.email);
    await page.fill('[data-testid="password-input"]', newPassword);
    await page.click('[data-testid="login-button"]');

    // Verify successful login
    await expect(page).toHaveURL(/\/(dashboard)?/, { timeout: 10000 });
  });
});

test.describe('Password Reset Flow - Error Scenarios', () => {
  test('should handle non-existent email gracefully', async ({ page }) => {
    await page.goto('/forgot-password');

    const nonExistentEmail = faker.internet.email();
    await page.fill('input[type="email"]', nonExistentEmail);
    await page.click('button:has-text("Send Reset Link")');

    // Should still show success message (security: don't reveal email exists)
    await expect(page.locator('text=Check Your Email')).toBeVisible();
    await expect(page.locator('text=/If your email is registered/i')).toBeVisible();
  });

  test('should show error for invalid token', async ({ page }) => {
    const invalidToken = 'a'.repeat(64); // 64-char invalid token

    await page.goto(`/reset-password?token=${invalidToken}`);
    await page.waitForLoadState('networkidle');

    // Should show invalid token error
    await expect(page.locator('text=/Invalid Reset Link|Reset link is invalid/i')).toBeVisible({timeout: 10000});
    await expect(page.locator('button:has-text("Request New Reset Link")')).toBeVisible();
  });

  test('should reject weak passwords', async ({ page, userFactory }) => {
    const testUser = await userFactory.createUser({
      email: faker.internet.email(),
      password: 'OldPassword123!',
    });

    // Request password reset
    await page.goto('/forgot-password');
    await page.fill('input[type="email"]', testUser.email);
    await page.click('button:has-text("Send Reset Link")');
    await expect(page.locator('text=Check Your Email')).toBeVisible();

    // Get token (mock)
    const tokenResponse = await page.request.get(`${API_BASE_URL}/v1/test/password-reset-token/${testUser.email}`);
    if (!tokenResponse.ok()) {
      test.skip(true, 'Test token endpoint not available');
      return;
    }
    const { token } = await tokenResponse.json();

    await page.goto(`/reset-password?token=${token}`);
    await page.waitForLoadState('networkidle');

    // Try weak password (no uppercase)
    await page.fill('input#password', 'weakpassword123!');
    await page.fill('input#confirmPassword', 'weakpassword123!');

    // Verify password strength shows "Weak" or "Medium"
    await expect(page.locator('text=/Weak|Medium/')).toBeVisible();

    await page.click('button:has-text("Reset Password")');

    // Should show validation error from frontend or backend
    // Frontend validation should prevent submission or backend should return 400
    await expect(page.locator('text=/Password must contain.*uppercase|validation failed/i')).toBeVisible({ timeout: 5000 });
  });

  test('should show error when passwords don\'t match', async ({ page, userFactory }) => {
    const testUser = await userFactory.createUser({
      email: faker.internet.email(),
      password: 'OldPassword123!',
    });

    await page.goto('/forgot-password');
    await page.fill('input[type="email"]', testUser.email);
    await page.click('button:has-text("Send Reset Link")');

    const tokenResponse = await page.request.get(`${API_BASE_URL}/v1/test/password-reset-token/${testUser.email}`);
    if (!tokenResponse.ok()) {
      test.skip(true, 'Test token endpoint not available');
      return;
    }
    const { token } = await tokenResponse.json();

    await page.goto(`/reset-password?token=${token}`);
    await page.waitForLoadState('networkidle');

    await page.fill('input#password', 'NewSecureP@ssw0rd123');
    await page.fill('input#confirmPassword', 'DifferentP@ssw0rd123');

    await page.click('button:has-text("Reset Password")');

    // Should show "Passwords do not match" error
    await expect(page.locator('text=/Passwords do not match/i')).toBeVisible();
  });
});

test.describe('Password Reset Flow - Rate Limiting', () => {
  test('should enforce rate limit after 3 requests', async ({ page }) => {
    const testEmail = faker.internet.email();

    await page.goto('/forgot-password');

    // Send 3 requests (should succeed)
    for (let i = 0; i < 3; i++) {
      await page.fill('input[type="email"]', testEmail);
      await page.click('button:has-text("Send Reset Link")');
      await expect(page.locator('text=Check Your Email')).toBeVisible();

      // Go back to try again
      await page.click('a:has-text("Back to Login")');
      await page.goto('/forgot-password');
    }

    // 4th request should be rate limited
    await page.fill('input[type="email"]', testEmail);
    await page.click('button:has-text("Send Reset Link")');

    // Should show rate limit error
    await expect(page.locator('text=/Too many password reset attempts|rate limit/i')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Password Reset Flow - Token Invalidation', () => {
  test('should invalidate previous token when new reset is requested', async ({ page, userFactory }) => {
    const testUser = await userFactory.createUser({
      email: faker.internet.email(),
      password: 'OldPassword123!',
    });

    // Request first reset
    await page.goto('/forgot-password');
    await page.fill('input[type="email"]', testUser.email);
    await page.click('button:has-text("Send Reset Link")');
    await expect(page.locator('text=Check Your Email')).toBeVisible();

    // Get first token
    let tokenResponse = await page.request.get(`${API_BASE_URL}/v1/test/password-reset-token/${testUser.email}`);
    if (!tokenResponse.ok()) {
      test.skip(true, 'Test token endpoint not available');
      return;
    }
    const { token: token1 } = await tokenResponse.json();

    // Request second reset (should invalidate token1)
    await page.click('a:has-text("Back to Login")');
    await page.goto('/forgot-password');
    await page.fill('input[type="email"]', testUser.email);
    await page.click('button:has-text("Send Reset Link")');
    await expect(page.locator('text=Check Your Email')).toBeVisible();

    // Get second token
    tokenResponse = await page.request.get(`${API_BASE_URL}/v1/test/password-reset-token/${testUser.email}`);
    const { token: token2 } = await tokenResponse.json();

    // Try to use first token (should be invalidated)
    await page.goto(`/reset-password?token=${token1}`);
    await page.waitForLoadState('networkidle');

    // Should show invalid/expired token error
    await expect(page.locator('text=/Invalid Reset Link|invalidated/i')).toBeVisible({ timeout: 10000 });

    // Try to use second token (should work)
    await page.goto(`/reset-password?token=${token2}`);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=Reset Your Password')).toBeVisible({ timeout: 10000 });
  });

  test('should prevent token reuse after successful password reset', async ({ page, userFactory }) => {
    const testUser = await userFactory.createUser({
      email: faker.internet.email(),
      password: 'OldPassword123!',
    });

    // Request reset
    await page.goto('/forgot-password');
    await page.fill('input[type="email"]', testUser.email);
    await page.click('button:has-text("Send Reset Link")');
    await expect(page.locator('text=Check Your Email')).toBeVisible();

    // Get token
    const tokenResponse = await page.request.get(`${API_BASE_URL}/v1/test/password-reset-token/${testUser.email}`);
    if (!tokenResponse.ok()) {
      test.skip(true, 'Test token endpoint not available');
      return;
    }
    const { token } = await tokenResponse.json();

    // Complete password reset
    await page.goto(`/reset-password?token=${token}`);
    await page.waitForLoadState('networkidle');

    const newPassword = 'NewSecureP@ssw0rd123';
    await page.fill('input#password', newPassword);
    await page.fill('input#confirmPassword', newPassword);
    await page.click('button:has-text("Reset Password")');

    await expect(page.locator('text=Password Reset Successful')).toBeVisible();

    // Try to reuse the same token
    await page.goto(`/reset-password?token=${token}`);
    await page.waitForLoadState('networkidle');

    // Should show "already used" or "invalid" error
    await expect(page.locator('text=/Invalid Reset Link|already been used|expired/i')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Password Reset Flow - UI/UX Features', () => {
  test('should show password visibility toggle', async ({ page, userFactory }) => {
    const testUser = await userFactory.createUser({
      email: faker.internet.email(),
      password: 'OldPassword123!',
    });

    await page.goto('/forgot-password');
    await page.fill('input[type="email"]', testUser.email);
    await page.click('button:has-text("Send Reset Link")');

    const tokenResponse = await page.request.get(`${API_BASE_URL}/v1/test/password-reset-token/${testUser.email}`);
    if (!tokenResponse.ok()) {
      test.skip(true, 'Test token endpoint not available');
      return;
    }
    const { token } = await tokenResponse.json();

    await page.goto(`/reset-password?token=${token}`);
    await page.waitForLoadState('networkidle');

    const passwordInput = page.locator('input#password');
    const confirmPasswordInput = page.locator('input#confirmPassword');

    // Initially should be password type (hidden)
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await expect(confirmPasswordInput).toHaveAttribute('type', 'password');

    // Click eye icon to show password
    const toggleButtons = page.locator('button:has(svg)').filter({ has: page.locator('[class*="eye"]') });
    await toggleButtons.first().click();

    // Password field should now be text type (visible)
    await expect(passwordInput).toHaveAttribute('type', 'text');
  });

  test('should display loading states correctly', async ({ page }) => {
    await page.goto('/forgot-password');

    const submitButton = page.locator('button:has-text("Send Reset Link")');
    await page.fill('input[type="email"]', faker.internet.email());

    // Intercept API to delay response and check loading state
    await page.route('**/api/v1/auth/forgot-password', async (route) => {
      await page.waitForTimeout(1000); // Delay to see loading state
      await route.continue();
    });

    await submitButton.click();

    // Should show loading text
    await expect(page.locator('button:has-text("Sending")')).toBeVisible({ timeout: 2000 });
  });
});

test.describe('Password Reset Flow - Token Expiration', () => {
  test.skip('should reject expired token (requires 16+ minute wait)', async ({ page }) => {
    // This test is skipped because it requires waiting 16 minutes for token expiration
    // In a real scenario, you would:
    // 1. Request password reset
    // 2. Wait 16 minutes
    // 3. Try to use the token
    // 4. Expect "expired" error

    // For CI/CD, consider using a test-only endpoint that allows setting custom expiration times
  });
});
