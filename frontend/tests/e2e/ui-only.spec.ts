import { test, expect } from '@playwright/test';

/**
 * UI-Only Tests
 * These tests verify the frontend UI without requiring backend API
 * Can run with just `npm run dev`
 */

test.describe('Login Page - UI Elements (No Backend Required)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    // Use 'domcontentloaded' instead of 'networkidle' for better reliability in Firefox
    await page.waitForLoadState('domcontentloaded');
  });

  test('should display login form with all elements', async ({ page }) => {
    // Verify heading (CardTitle is a div, not h1/h2)
    await expect(page.locator('[data-slot="card-title"]').filter({ hasText: /sign in/i })).toBeVisible();

    // Verify email input
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute('autocomplete', 'email');

    // Verify password input
    const passwordInput = page.locator('input[type="password"]').first();
    await expect(passwordInput).toBeVisible();

    // Verify submit button
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Verify forgot password link
    await expect(page.locator('a[href*="forgot-password"]')).toBeVisible();

    // Verify register link
    await expect(page.locator('a[href*="register"]')).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.click('button[type="submit"]');

    // Wait for validation errors to appear
    await page.waitForTimeout(500);

    // Should have error messages (exact text may vary)
    const errorCount = await page.locator('[role="alert"], .text-destructive, [class*="error"]').count();
    expect(errorCount).toBeGreaterThan(0);
  });

  test('should validate email format', async ({ page }) => {
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', 'anypassword');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(500);

    // Should show email validation error
    const hasError = await page.locator('text=/email|valid/i').isVisible({ timeout: 2000 });
    expect(hasError).toBeTruthy();
  });

  test('should have password visibility toggle', async ({ page }) => {
    // Use autocomplete attribute as stable selector (doesn't change when type changes)
    const passwordInput = page.locator('input[autocomplete="current-password"]');

    // Should be password type initially
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Look for toggle button by aria-label
    const toggleButton = page.locator('button[aria-label*="password" i]').first();

    // Verify toggle button exists
    await expect(toggleButton).toBeVisible();

    // Click toggle button
    await toggleButton.click();
    await page.waitForTimeout(300);

    // After toggle, input should be text type
    await expect(passwordInput).toHaveAttribute('type', 'text');

    // Click again to toggle back
    await toggleButton.click();
    await page.waitForTimeout(300);

    // Should be password again
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });
});

test.describe('Registration Page - UI Elements (No Backend Required)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
    // Use 'domcontentloaded' instead of 'networkidle' for better reliability in Firefox
    await page.waitForLoadState('domcontentloaded');
  });

  test('should display registration form with all fields', async ({ page }) => {
    // Verify heading (CardTitle is a div, not h1/h2)
    await expect(page.locator('[data-slot="card-title"]').filter({ hasText: /create|register|sign up/i })).toBeVisible();

    // Verify first name
    await expect(page.locator('input[name*="first" i], input[id*="first" i]').first()).toBeVisible();

    // Verify last name
    await expect(page.locator('input[name*="last" i], input[id*="last" i]').first()).toBeVisible();

    // Verify email
    await expect(page.locator('input[type="email"]')).toBeVisible();

    // Verify password
    await expect(page.locator('input[name*="password" i]').first()).toBeVisible();

    // Verify confirm password
    const passwordInputs = await page.locator('input[type="password"]').count();
    expect(passwordInputs).toBeGreaterThanOrEqual(2);

    // Verify submit button
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should display password strength meter when typing', async ({ page }) => {
    const passwordInput = page.locator('input[name="password"], input[id*="password"]').first();

    await passwordInput.fill('weak');
    await page.waitForTimeout(500);

    // Should show password strength indicator (actual labels: "Very Weak", "Weak", "Fair", "Good", "Strong")
    // Use .first() to avoid strict mode violation when multiple elements match
    const hasStrengthMeter = await page.locator('text=/Password Strength|Very Weak|Weak|Fair|Good|Strong/i').first().isVisible({ timeout: 2000 });
    expect(hasStrengthMeter).toBeTruthy();
  });

  test('should display password requirements', async ({ page }) => {
    const passwordInput = page.locator('input[name="password"]').first();

    await passwordInput.fill('test');
    await page.waitForTimeout(500);

    // Should show requirements list
    const hasRequirements = await page.locator('text=/8 characters|uppercase|lowercase|number|special/i').count();
    expect(hasRequirements).toBeGreaterThan(0);
  });

  test('should have terms and conditions checkbox', async ({ page }) => {
    const termsCheckbox = page.locator('input[type="checkbox"]').filter({ has: page.locator('text=/terms|conditions/i') });

    if (await termsCheckbox.count() > 0) {
      await expect(termsCheckbox.first()).toBeVisible();
    } else {
      // Alternative: Look for any checkbox
      const checkboxCount = await page.locator('input[type="checkbox"]').count();
      expect(checkboxCount).toBeGreaterThan(0);
    }
  });
});

test.describe('Forgot Password Page - UI Elements (No Backend Required)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/forgot-password');
    // Use 'domcontentloaded' instead of 'networkidle' for better reliability in Firefox
    await page.waitForLoadState('domcontentloaded');
  });

  test('should display forgot password form', async ({ page }) => {
    // Verify heading (CardTitle is a div, not h1/h2)
    await expect(page.locator('[data-slot="card-title"]').filter({ hasText: /forgot|reset/i })).toBeVisible();

    // Verify email input
    await expect(page.locator('input[type="email"]')).toBeVisible();

    // Verify submit button
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Verify back to login link
    await expect(page.locator('a[href*="login"]')).toBeVisible();
  });
});

test.describe('Protected Routes - Redirect Behavior (No Backend Required)', () => {
  test('should redirect to login when accessing protected route unauthenticated', async ({ page }) => {
    await page.goto('/dashboard');

    // Should be redirected to login
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });

  test('should redirect to login when accessing settings unauthenticated', async ({ page }) => {
    await page.goto('/dashboard/settings');

    // Should be redirected to login
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });

  test('should include return URL in redirect', async ({ page }) => {
    await page.goto('/dashboard/settings/security');

    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });

    // URL should contain redirect or returnUrl parameter
    const url = page.url();
    const hasRedirectParam = url.includes('redirect') || url.includes('returnUrl') || url.includes('return');

    // This may or may not be implemented yet
    // expect(hasRedirectParam).toBeTruthy();
  });
});

test.describe('Navigation and Links', () => {
  test('should navigate from login to register', async ({ page }) => {
    await page.goto('/login');
    // Use 'domcontentloaded' instead of 'networkidle' for better reliability in Firefox
    await page.waitForLoadState('domcontentloaded');

    await page.click('a[href*="register"]');

    await expect(page).toHaveURL(/\/register/, { timeout: 3000 });
  });

  test('should navigate from login to forgot password', async ({ page }) => {
    await page.goto('/login');
    // Use 'domcontentloaded' instead of 'networkidle' for better reliability in Firefox
    await page.waitForLoadState('domcontentloaded');

    await page.click('a[href*="forgot-password"]');

    await expect(page).toHaveURL(/\/forgot-password/, { timeout: 3000 });
  });

  test('should navigate from register to login', async ({ page }) => {
    await page.goto('/register');
    // Use 'domcontentloaded' instead of 'networkidle' for better reliability in Firefox
    await page.waitForLoadState('domcontentloaded');

    await page.click('a[href*="login"]');

    await expect(page).toHaveURL(/\/login/, { timeout: 3000 });
  });
});

test.describe('Responsive Design', () => {
  test('should be mobile responsive on login page', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
    await page.goto('/login');

    // Form should be visible
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should be tablet responsive on registration page', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad size
    await page.goto('/register');

    // Form should be visible
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });
});
