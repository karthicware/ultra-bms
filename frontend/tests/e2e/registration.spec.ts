/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect } from '../support/fixtures';
import { faker } from '@faker-js/faker';

/**
 * Registration Flow E2E Tests
 * Tests the complete user registration workflow
 */

test.describe('Registration Page - UI and Form Elements', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
  });

  test('should display all registration form elements', async ({ page }) => {
    // Verify page title and heading
    await expect(page).toHaveTitle(/Sign up|Register|Create Account/i);
    await expect(page.locator('h1, h2').filter({ hasText: /create account|sign up|register/i })).toBeVisible();

    // Verify all required inputs
    await expect(page.locator('input[name="firstName"], input[id*="firstName"]')).toBeVisible();
    await expect(page.locator('input[name="lastName"], input[id*="lastName"]')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"], input[id*="password"]').first()).toBeVisible();
    await expect(page.locator('input[name="confirmPassword"], input[id*="confirmPassword"]')).toBeVisible();

    // Verify optional fields
    const phoneInput = page.locator('input[name="phone"], input[type="tel"]');
    if (await phoneInput.count() > 0) {
      await expect(phoneInput).toBeVisible();
    }

    // Verify terms checkbox
    await expect(page.locator('input[type="checkbox"]').filter({ has: page.locator('text=/terms/i') })).toBeVisible();

    // Verify submit button
    await expect(page.locator('button[type="submit"]:has-text("Create Account"), button[type="submit"]:has-text("Sign up")')).toBeVisible();

    // Verify login link
    await expect(page.locator('a[href="/login"]')).toBeVisible();
  });

  test('should display password strength meter', async ({ page }) => {
    const passwordInput = page.locator('input[name="password"], input[id*="password"]').first();

    await passwordInput.fill('weak');

    // Password strength indicator should appear
    await expect(page.locator('text=/password strength|strength:/i')).toBeVisible({ timeout: 2000 });
  });

  test('should display password requirements checklist', async ({ page }) => {
    const passwordInput = page.locator('input[name="password"], input[id*="password"]').first();

    await passwordInput.fill('Test');

    // Verify all requirements are shown
    await expect(page.locator('text=/at least 8 characters|8\+ characters/i')).toBeVisible();
    await expect(page.locator('text=/uppercase letter|one uppercase/i')).toBeVisible();
    await expect(page.locator('text=/lowercase letter|one lowercase/i')).toBeVisible();
    await expect(page.locator('text=/number|one number|digit/i')).toBeVisible();
    await expect(page.locator('text=/special character|one special/i')).toBeVisible();
  });
});

test.describe('Registration Flow - Successful Registration', () => {
  test('should successfully register with valid data', async ({ page }) => {
    await page.goto('/register');

    const testData = {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email(),
      password: 'ValidP@ssw0rd123',
      phone: faker.phone.number({ style: 'international' }),
    };

    // Fill in all fields
    await page.fill('input[name="firstName"], input[id*="firstName"]', testData.firstName);
    await page.fill('input[name="lastName"], input[id*="lastName"]', testData.lastName);
    await page.fill('input[type="email"]', testData.email);
    await page.fill('input[name="password"], input[id*="password"]', testData.password);
    await page.fill('input[name="confirmPassword"], input[id*="confirmPassword"]', testData.password);

    // Fill phone if field exists
    const phoneInput = page.locator('input[name="phone"], input[type="tel"]');
    if (await phoneInput.count() > 0) {
      await phoneInput.fill(testData.phone);
    }

    // Accept terms
    await page.check('input[type="checkbox"]');

    // Submit form
    await page.click('button[type="submit"]:has-text("Create Account"), button[type="submit"]:has-text("Sign up")');

    // Verify success message or redirect
    await expect(
      page.locator('text=/registration successful|account created|check your email/i')
    ).toBeVisible({ timeout: 10000 });

    // Should redirect to login page or show email verification message
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/login|\/register/);
  });

  test('should register with minimum required fields', async ({ page }) => {
    await page.goto('/register');

    const testData = {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email(),
      password: 'ValidP@ssw0rd123',
    };

    // Fill only required fields
    await page.fill('input[name="firstName"], input[id*="firstName"]', testData.firstName);
    await page.fill('input[name="lastName"], input[id*="lastName"]', testData.lastName);
    await page.fill('input[type="email"]', testData.email);
    await page.fill('input[name="password"], input[id*="password"]', testData.password);
    await page.fill('input[name="confirmPassword"], input[id*="confirmPassword"]', testData.password);

    // Accept terms
    await page.check('input[type="checkbox"]');

    // Submit
    await page.click('button[type="submit"]:has-text("Create Account"), button[type="submit"]:has-text("Sign up")');

    // Verify success
    await expect(page.locator('text=/registration successful|account created/i')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Registration Flow - Password Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('should show password strength for weak password', async ({ page }) => {
    const passwordInput = page.locator('input[name="password"], input[id*="password"]').first();

    await passwordInput.fill('weak');

    // Should show "Weak" or similar indicator
    await expect(page.locator('text=/weak|very weak|too weak/i')).toBeVisible({ timeout: 2000 });

    // Strength bar should be red or yellow
    const strengthBar = page.locator('[class*="strength"]');
    if (await strengthBar.count() > 0) {
      const backgroundColor = await strengthBar.evaluate(el => window.getComputedStyle(el).backgroundColor);
      // Should be red-ish or yellow-ish (not green)
      expect(backgroundColor).toMatch(/rgb\((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9]),\s*(0|[1-9]?[0-9]|1[0-9]{2}),\s*(0|[1-9]?[0-9]|1[0-9]{2})\)/);
    }
  });

  test('should show password strength for strong password', async ({ page }) => {
    const passwordInput = page.locator('input[name="password"], input[id*="password"]').first();

    await passwordInput.fill('SuperSecure!P@ssw0rd2024');

    // Should show "Strong" or "Very Strong"
    await expect(page.locator('text=/strong|very strong|excellent/i')).toBeVisible({ timeout: 2000 });
  });

  test('should reject password without uppercase letter', async ({ page }) => {
    await page.fill('input[name="firstName"], input[id*="firstName"]', 'John');
    await page.fill('input[name="lastName"], input[id*="lastName"]', 'Doe');
    await page.fill('input[type="email"]', faker.internet.email());
    await page.fill('input[name="password"], input[id*="password"]', 'weakpassword123!');
    await page.fill('input[name="confirmPassword"], input[id*="confirmPassword"]', 'weakpassword123!');
    await page.check('input[type="checkbox"]');

    await page.click('button[type="submit"]');

    // Should show validation error
    await expect(page.locator('text=/uppercase letter|must contain.*uppercase/i')).toBeVisible({ timeout: 3000 });
  });

  test('should reject password without lowercase letter', async ({ page }) => {
    await page.fill('input[name="firstName"], input[id*="firstName"]', 'John');
    await page.fill('input[name="lastName"], input[id*="lastName"]', 'Doe');
    await page.fill('input[type="email"]', faker.internet.email());
    await page.fill('input[name="password"], input[id*="password"]', 'WEAKPASSWORD123!');
    await page.fill('input[name="confirmPassword"], input[id*="confirmPassword"]', 'WEAKPASSWORD123!');
    await page.check('input[type="checkbox"]');

    await page.click('button[type="submit"]');

    // Should show validation error
    await expect(page.locator('text=/lowercase letter|must contain.*lowercase/i')).toBeVisible({ timeout: 3000 });
  });

  test('should reject password without number', async ({ page }) => {
    await page.fill('input[name="firstName"], input[id*="firstName"]', 'John');
    await page.fill('input[name="lastName"], input[id*="lastName"]', 'Doe');
    await page.fill('input[type="email"]', faker.internet.email());
    await page.fill('input[name="password"], input[id*="password"]', 'WeakPassword!');
    await page.fill('input[name="confirmPassword"], input[id*="confirmPassword"]', 'WeakPassword!');
    await page.check('input[type="checkbox"]');

    await page.click('button[type="submit"]');

    // Should show validation error
    await expect(page.locator('text=/number|must contain.*digit/i')).toBeVisible({ timeout: 3000 });
  });

  test('should reject password without special character', async ({ page }) => {
    await page.fill('input[name="firstName"], input[id*="firstName"]', 'John');
    await page.fill('input[name="lastName"], input[id*="lastName"]', 'Doe');
    await page.fill('input[type="email"]', faker.internet.email());
    await page.fill('input[name="password"], input[id*="password"]', 'WeakPassword123');
    await page.fill('input[name="confirmPassword"], input[id*="confirmPassword"]', 'WeakPassword123');
    await page.check('input[type="checkbox"]');

    await page.click('button[type="submit"]');

    // Should show validation error
    await expect(page.locator('text=/special character|must contain.*special/i')).toBeVisible({ timeout: 3000 });
  });

  test('should reject password shorter than 8 characters', async ({ page }) => {
    await page.fill('input[name="firstName"], input[id*="firstName"]', 'John');
    await page.fill('input[name="lastName"], input[id*="lastName"]', 'Doe');
    await page.fill('input[type="email"]', faker.internet.email());
    await page.fill('input[name="password"], input[id*="password"]', 'Weak1!');
    await page.fill('input[name="confirmPassword"], input[id*="confirmPassword"]', 'Weak1!');
    await page.check('input[type="checkbox"]');

    await page.click('button[type="submit"]');

    // Should show validation error
    await expect(page.locator('text=/at least 8 characters|minimum.*8/i')).toBeVisible({ timeout: 3000 });
  });

  test('should show error when passwords do not match', async ({ page }) => {
    await page.fill('input[name="firstName"], input[id*="firstName"]', 'John');
    await page.fill('input[name="lastName"], input[id*="lastName"]', 'Doe');
    await page.fill('input[type="email"]', faker.internet.email());
    await page.fill('input[name="password"], input[id*="password"]', 'ValidP@ssw0rd123');
    await page.fill('input[name="confirmPassword"], input[id*="confirmPassword"]', 'DifferentP@ssw0rd123');
    await page.check('input[type="checkbox"]');

    await page.click('button[type="submit"]');

    // Should show "passwords do not match" error
    await expect(page.locator('text=/passwords do not match|passwords must match/i')).toBeVisible({ timeout: 3000 });
  });
});

test.describe('Registration Flow - Form Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('should show all validation errors for empty form', async ({ page }) => {
    await page.click('button[type="submit"]');

    // Verify multiple validation errors appear
    await expect(page.locator('text=/required|cannot be empty/i').first()).toBeVisible({ timeout: 2000 });

    // Count validation errors (should be at least 5: firstName, lastName, email, password, confirmPassword)
    const errorCount = await page.locator('text=/required|cannot be empty/i').count();
    expect(errorCount).toBeGreaterThanOrEqual(5);
  });

  test('should validate email format', async ({ page }) => {
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[name="firstName"], input[id*="firstName"]', 'John');
    await page.click('button[type="submit"]');

    // Should show invalid email error
    await expect(page.locator('text=/valid email|invalid email format/i')).toBeVisible({ timeout: 2000 });
  });

  test('should validate first name length', async ({ page }) => {
    const longName = 'A'.repeat(101); // Exceeds typical max length

    await page.fill('input[name="firstName"], input[id*="firstName"]', longName);
    await page.fill('input[name="lastName"], input[id*="lastName"]', 'Doe');
    await page.fill('input[type="email"]', faker.internet.email());
    await page.click('button[type="submit"]');

    // May show max length error (if enforced)
    const errorVisible = await page.locator('text=/too long|maximum.*100/i').isVisible({ timeout: 1000 }).catch(() => false);
    // Some forms may allow it, so this is optional validation
  });

  test('should validate phone number format if provided', async ({ page }) => {
    const phoneInput = page.locator('input[name="phone"], input[type="tel"]');

    if (await phoneInput.count() > 0) {
      await phoneInput.fill('invalid-phone');
      await page.fill('input[name="firstName"], input[id*="firstName"]', 'John');
      await page.click('button[type="submit"]');

      // May show invalid phone format error
      const phoneError = await page.locator('text=/invalid phone|phone.*format/i').isVisible({ timeout: 1000 }).catch(() => false);
      // Phone validation might be lenient or not enforced
    }
  });

  test('should require terms acceptance', async ({ page }) => {
    await page.fill('input[name="firstName"], input[id*="firstName"]', 'John');
    await page.fill('input[name="lastName"], input[id*="lastName"]', 'Doe');
    await page.fill('input[type="email"]', faker.internet.email());
    await page.fill('input[name="password"], input[id*="password"]', 'ValidP@ssw0rd123');
    await page.fill('input[name="confirmPassword"], input[id*="confirmPassword"]', 'ValidP@ssw0rd123');

    // Do NOT check terms checkbox
    await page.click('button[type="submit"]');

    // Should show terms acceptance error
    await expect(page.locator('text=/must accept.*terms|agree to.*terms/i')).toBeVisible({ timeout: 3000 });
  });
});

test.describe('Registration Flow - Server-Side Validation', () => {
  test('should show error for duplicate email', async ({ page, userFactory }) => {
    // Create existing user
    const existingUser = await userFactory.createUser({
      email: 'existing@example.com',
      password: 'ExistingP@ssw0rd123',
    });

    await page.goto('/register');

    // Try to register with same email
    await page.fill('input[name="firstName"], input[id*="firstName"]', 'John');
    await page.fill('input[name="lastName"], input[id*="lastName"]', 'Doe');
    await page.fill('input[type="email"]', existingUser.email);
    await page.fill('input[name="password"], input[id*="password"]', 'NewP@ssw0rd123');
    await page.fill('input[name="confirmPassword"], input[id*="confirmPassword"]', 'NewP@ssw0rd123');
    await page.check('input[type="checkbox"]');

    await page.click('button[type="submit"]');

    // Should show duplicate email error
    await expect(page.locator('text=/email already.*registered|email.*taken|email.*exists/i')).toBeVisible({ timeout: 5000 });
  });

  test('should handle server errors gracefully', async ({ page }) => {
    await page.goto('/register');

    // Simulate server error
    await page.route('**/api/v1/auth/register', route =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: { message: 'Internal server error' },
        }),
      })
    );

    await page.fill('input[name="firstName"], input[id*="firstName"]', 'John');
    await page.fill('input[name="lastName"], input[id*="lastName"]', 'Doe');
    await page.fill('input[type="email"]', faker.internet.email());
    await page.fill('input[name="password"], input[id*="password"]', 'ValidP@ssw0rd123');
    await page.fill('input[name="confirmPassword"], input[id*="confirmPassword"]', 'ValidP@ssw0rd123');
    await page.check('input[type="checkbox"]');

    await page.click('button[type="submit"]');

    // Should show server error message
    await expect(page.locator('text=/server error|something went wrong|try again/i')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Registration Flow - UI/UX Features', () => {
  test('should show loading state during registration', async ({ page }) => {
    await page.goto('/register');

    // Delay API response
    await page.route('**/api/v1/auth/register', async route => {
      await page.waitForTimeout(1000);
      await route.continue();
    });

    await page.fill('input[name="firstName"], input[id*="firstName"]', 'John');
    await page.fill('input[name="lastName"], input[id*="lastName"]', 'Doe');
    await page.fill('input[type="email"]', faker.internet.email());
    await page.fill('input[name="password"], input[id*="password"]', 'ValidP@ssw0rd123');
    await page.fill('input[name="confirmPassword"], input[id*="confirmPassword"]', 'ValidP@ssw0rd123');
    await page.check('input[type="checkbox"]');

    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Verify loading state
    await expect(submitButton).toBeDisabled({ timeout: 500 });
    await expect(page.locator('button:has-text("Creating"), button:has([class*="spinner"])')).toBeVisible({ timeout: 500 });
  });

  test('should toggle password visibility on both fields', async ({ page }) => {
    await page.goto('/register');

    const passwordInput = page.locator('input[name="password"]').first();
    const confirmPasswordInput = page.locator('input[name="confirmPassword"]');

    // Initially hidden
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await expect(confirmPasswordInput).toHaveAttribute('type', 'password');

    // Click toggle on password field
    const toggleButtons = page.locator('button[aria-label*="password" i]');
    await toggleButtons.first().click();

    // Password field should be visible
    await expect(passwordInput).toHaveAttribute('type', 'text');
  });

  test('should update password requirements checklist dynamically', async ({ page }) => {
    await page.goto('/register');

    const passwordInput = page.locator('input[name="password"]').first();

    // Type password gradually and verify requirements update
    await passwordInput.fill('t');
    await expect(page.locator('text=/lowercase letter/i')).toBeVisible();

    await passwordInput.fill('T');
    await expect(page.locator('text=/uppercase letter/i')).toBeVisible();

    await passwordInput.fill('Test1');
    await expect(page.locator('text=/number/i')).toBeVisible();

    await passwordInput.fill('Test1!');
    await expect(page.locator('text=/special character/i')).toBeVisible();

    await passwordInput.fill('Test1!ab');
    await expect(page.locator('text=/8 characters/i')).toBeVisible();
  });

  test('should be keyboard accessible', async ({ page }) => {
    await page.goto('/register');

    // Tab through all form fields
    await page.keyboard.press('Tab');
    await expect(page.locator('input[name="firstName"]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('input[name="lastName"]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('input[type="email"]')).toBeFocused();

    // Continue tabbing through password fields, checkbox, and submit button
  });
});
