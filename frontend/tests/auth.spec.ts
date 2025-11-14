import { test, expect } from '@playwright/test';

// Test constants
const TEST_USER = {
  email: 'test@example.com',
  password: 'Test@1234',
  firstName: 'Test',
  lastName: 'User',
};

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

test.describe('Authentication Flow', () => {
  test.describe('Login Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
    });

    test('should display login form', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    });

    test('should show validation errors for empty fields', async ({ page }) => {
      await page.getByRole('button', { name: /sign in/i }).click();

      await expect(page.getByText(/email is required/i)).toBeVisible();
      await expect(page.getByText(/password is required/i)).toBeVisible();
    });

    test('should show validation error for invalid email', async ({ page }) => {
      await page.getByLabel(/email/i).fill('invalid-email');
      await page.getByLabel(/password/i).fill('password123');
      await page.getByRole('button', { name: /sign in/i }).click();

      await expect(page.getByText(/valid email/i)).toBeVisible();
    });

    test('should toggle password visibility', async ({ page }) => {
      const passwordInput = page.getByLabel(/password/i);
      const toggleButton = page.getByLabel(/show password|hide password/i);

      // Initially password should be hidden
      await expect(passwordInput).toHaveAttribute('type', 'password');

      // Click toggle to show password
      await toggleButton.click();
      await expect(passwordInput).toHaveAttribute('type', 'text');

      // Click toggle to hide password again
      await toggleButton.click();
      await expect(passwordInput).toHaveAttribute('type', 'password');
    });

    test('should have forgot password link', async ({ page }) => {
      const forgotPasswordLink = page.getByRole('link', { name: /forgot password/i });
      await expect(forgotPasswordLink).toBeVisible();
      await expect(forgotPasswordLink).toHaveAttribute('href', '/forgot-password');
    });

    test('should have sign up link', async ({ page }) => {
      const signUpLink = page.getByRole('link', { name: /sign up/i });
      await expect(signUpLink).toBeVisible();
      await expect(signUpLink).toHaveAttribute('href', '/register');
    });

    // Skip actual login test if backend not available
    test.skip('should successfully login with valid credentials', async ({ page }) => {
      await page.getByLabel(/email/i).fill(TEST_USER.email);
      await page.getByLabel(/password/i).fill(TEST_USER.password);
      await page.getByRole('button', { name: /sign in/i }).click();

      // Should redirect to dashboard
      await expect(page).toHaveURL(/\/dashboard/);
      await expect(page.getByText(/welcome/i)).toBeVisible();
    });
  });

  test.describe('Registration Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/register`);
    });

    test('should display registration form', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /create.*account/i })).toBeVisible();
      await expect(page.getByLabel(/first name/i)).toBeVisible();
      await expect(page.getByLabel(/last name/i)).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/^password$/i)).toBeVisible();
      await expect(page.getByLabel(/confirm.*password/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /create account/i })).toBeVisible();
    });

    test('should show password strength meter when typing password', async ({ page }) => {
      await page.getByLabel(/^password$/i).fill('weak');
      await expect(page.getByText(/password strength/i)).toBeVisible();
    });

    test('should show password requirements checklist', async ({ page }) => {
      await page.getByLabel(/^password$/i).fill('Test@1234');

      // Check that all requirements are shown
      await expect(page.getByText(/at least 8 characters/i)).toBeVisible();
      await expect(page.getByText(/uppercase letter/i)).toBeVisible();
      await expect(page.getByText(/lowercase letter/i)).toBeVisible();
      await expect(page.getByText(/number/i)).toBeVisible();
      await expect(page.getByText(/special character/i)).toBeVisible();
    });

    test('should show error when passwords do not match', async ({ page }) => {
      await page.getByLabel(/first name/i).fill(TEST_USER.firstName);
      await page.getByLabel(/last name/i).fill(TEST_USER.lastName);
      await page.getByLabel(/email/i).fill(TEST_USER.email);
      await page.getByLabel(/^password$/i).fill(TEST_USER.password);
      await page.getByLabel(/confirm.*password/i).fill('Different@123');

      await page.getByRole('button', { name: /create account/i }).click();

      await expect(page.getByText(/passwords do not match/i)).toBeVisible();
    });

    test('should require terms acceptance', async ({ page }) => {
      await page.getByLabel(/first name/i).fill(TEST_USER.firstName);
      await page.getByLabel(/last name/i).fill(TEST_USER.lastName);
      await page.getByLabel(/email/i).fill(TEST_USER.email);
      await page.getByLabel(/^password$/i).fill(TEST_USER.password);
      await page.getByLabel(/confirm.*password/i).fill(TEST_USER.password);

      // Don't check the terms checkbox
      await page.getByRole('button', { name: /create account/i }).click();

      await expect(page.getByText(/must accept.*terms/i)).toBeVisible();
    });

    test('should have sign in link', async ({ page }) => {
      const signInLink = page.getByRole('link', { name: /sign in/i });
      await expect(signInLink).toBeVisible();
      await expect(signInLink).toHaveAttribute('href', '/login');
    });
  });

  test.describe('Forgot Password Flow', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/forgot-password`);
    });

    test('should display forgot password form', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /reset.*password/i })).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /send reset link/i })).toBeVisible();
    });

    test('should show validation error for invalid email', async ({ page }) => {
      await page.getByLabel(/email/i).fill('invalid-email');
      await page.getByRole('button', { name: /send reset link/i }).click();

      await expect(page.getByText(/valid email/i)).toBeVisible();
    });

    test('should have back to sign in link', async ({ page }) => {
      const backLink = page.getByRole('link', { name: /back to sign in/i });
      await expect(backLink).toBeVisible();
      await expect(backLink).toHaveAttribute('href', '/login');
    });
  });

  test.describe('Reset Password Flow', () => {
    test('should show invalid token error for missing token', async ({ page }) => {
      await page.goto(`${BASE_URL}/reset-password`);

      await expect(page.getByText(/token is missing/i)).toBeVisible();
    });

    test.skip('should display reset password form with valid token', async ({ page }) => {
      // This would require a valid token from the backend
      const validToken = 'valid-test-token';
      await page.goto(`${BASE_URL}/reset-password?token=${validToken}`);

      await expect(page.getByRole('heading', { name: /reset.*password/i })).toBeVisible();
      await expect(page.getByLabel(/new password/i)).toBeVisible();
      await expect(page.getByLabel(/confirm.*password/i)).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('login page should be keyboard navigable', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);

      // Tab through form elements
      await page.keyboard.press('Tab'); // Email field
      await expect(page.getByLabel(/email/i)).toBeFocused();

      await page.keyboard.press('Tab'); // Password field
      await expect(page.getByLabel(/password/i)).toBeFocused();

      await page.keyboard.press('Tab'); // Forgot password link
      await page.keyboard.press('Tab'); // Remember me checkbox
      await page.keyboard.press('Tab'); // Sign in button
      await expect(page.getByRole('button', { name: /sign in/i })).toBeFocused();
    });

    test('forms should have proper ARIA labels', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);

      const emailInput = page.getByLabel(/email/i);
      const passwordInput = page.getByLabel(/password/i);

      await expect(emailInput).toHaveAttribute('type', 'email');
      await expect(emailInput).toHaveAttribute('autocomplete', 'email');
      await expect(passwordInput).toHaveAttribute('autocomplete', 'current-password');
    });
  });
});
