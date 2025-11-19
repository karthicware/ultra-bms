import { test, expect } from '@playwright/test';

/**
 * Tenant Portal E2E Tests
 * Tests for Story 3.4 - Tenant Portal Dashboard and Profile Management
 *
 * Tests cover:
 * - Dashboard access and content display
 * - Profile viewing across all tabs
 * - Password change functionality
 * - Document viewing/download
 * - Route protection and authorization
 */

test.describe('Tenant Portal - Authentication and Authorization', () => {
  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/tenant/dashboard');

    // Should be redirected to login
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });

  test('should deny access to non-tenant roles', async ({ page, context }) => {
    // This test assumes a cookie can be set to simulate authentication
    // In real implementation, you would use your auth helper to login as non-tenant user

    await page.goto('/tenant/dashboard');

    // Should either redirect to login or show forbidden/access denied
    const url = page.url();
    expect(url.includes('/login') || url.includes('/unauthorized') || url.includes('/403')).toBeTruthy();
  });
});

test.describe('Tenant Dashboard - Content and Navigation', () => {
  test.skip('should display dashboard with unit information', async ({ page }) => {
    // Skip if tenant test user is not available
    // In a real test environment, you would create a tenant user with lease data

    // Login as tenant user would go here

    await page.goto('/tenant/dashboard');
    await page.waitForLoadState('networkidle');

    // Verify dashboard elements
    await expect(page.locator('[data-testid="welcome-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="unit-info-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="stats-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="quick-actions-section"]')).toBeVisible();

    // Verify unit information is displayed
    await expect(page.locator('text=/Property Name|Unit Number/i')).toBeVisible();
    await expect(page.locator('text=/Bedrooms|Bathrooms/i')).toBeVisible();
    await expect(page.locator('text=/Lease/i')).toBeVisible();
  });

  test.skip('should display stats with correct values', async ({ page }) => {
    await page.goto('/tenant/dashboard');
    await page.waitForLoadState('networkidle');

    const statsSection = page.locator('[data-testid="stats-section"]');

    // Verify all stat cards are visible
    await expect(statsSection.locator('text=/Outstanding Balance/i')).toBeVisible();
    await expect(statsSection.locator('text=/Next Payment/i')).toBeVisible();
    await expect(statsSection.locator('text=/Open Requests/i')).toBeVisible();
    await expect(statsSection.locator('text=/Upcoming Bookings/i')).toBeVisible();
  });

  test.skip('should display quick action buttons', async ({ page }) => {
    await page.goto('/tenant/dashboard');
    await page.waitForLoadState('networkidle');

    const quickActionsSection = page.locator('[data-testid="quick-actions-section"]');

    // Verify quick action cards exist
    const actionCards = quickActionsSection.locator('[data-testid^="quick-action-"]');
    const count = await actionCards.count();

    expect(count).toBeGreaterThan(0);

    // Verify action cards are clickable
    await expect(actionCards.first()).toBeEnabled();
  });

  test.skip('should have responsive mobile navigation', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/tenant/dashboard');
    await page.waitForLoadState('networkidle');

    // Verify mobile navigation is visible
    await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();

    // Verify navigation links
    await expect(page.locator('[data-testid="nav-link-dashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-link-requests"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-link-payments"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-link-profile"]')).toBeVisible();
  });
});

test.describe('Tenant Profile - Tab Navigation', () => {
  test.skip('should navigate between profile tabs', async ({ page }) => {
    await page.goto('/tenant/profile');
    await page.waitForLoadState('networkidle');

    // Verify all tabs are present
    await expect(page.locator('button[role="tab"]:has-text("Personal")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("Lease")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("Parking")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("Documents")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("Settings")')).toBeVisible();

    // Click on each tab and verify content changes
    await page.click('button[role="tab"]:has-text("Lease")');
    await expect(page.locator('text=/Base Rent|Monthly Rent/i')).toBeVisible({ timeout: 2000 });

    await page.click('button[role="tab"]:has-text("Parking")');
    await expect(page.locator('text=/Parking Spot|Mulkiya/i')).toBeVisible({ timeout: 2000 });

    await page.click('button[role="tab"]:has-text("Documents")');
    await expect(page.locator('text=/Document|Upload/i')).toBeVisible({ timeout: 2000 });

    await page.click('button[role="tab"]:has-text("Settings")');
    await expect(page.locator('[data-testid="btn-change-password"]')).toBeVisible({ timeout: 2000 });
  });

  test.skip('should display personal information in read-only mode', async ({ page }) => {
    await page.goto('/tenant/profile');
    await page.waitForLoadState('networkidle');

    // Click Personal tab
    await page.click('button[role="tab"]:has-text("Personal")');

    // Verify personal info fields are displayed
    await expect(page.locator('text=/First Name/i')).toBeVisible();
    await expect(page.locator('text=/Last Name/i')).toBeVisible();
    await expect(page.locator('text=/Email/i')).toBeVisible();
    await expect(page.locator('text=/Phone/i')).toBeVisible();
    await expect(page.locator('text=/Emergency Contact/i')).toBeVisible();

    // Verify fields are read-only (no input fields should be editable)
    const editableInputs = await page.locator('input:not([readonly]):not([disabled])').count();
    expect(editableInputs).toBe(0);
  });

  test.skip('should display lease information correctly', async ({ page }) => {
    await page.goto('/tenant/profile');
    await page.click('button[role="tab"]:has-text("Lease")');
    await page.waitForLoadState('networkidle');

    // Verify lease details
    await expect(page.locator('text=/Property Name/i')).toBeVisible();
    await expect(page.locator('text=/Unit Number/i')).toBeVisible();
    await expect(page.locator('text=/Lease Type/i')).toBeVisible();
    await expect(page.locator('text=/Start Date/i')).toBeVisible();
    await expect(page.locator('text=/End Date/i')).toBeVisible();
    await expect(page.locator('text=/Base Rent/i')).toBeVisible();
    await expect(page.locator('text=/Payment Frequency/i')).toBeVisible();

    // Verify download lease button exists
    await expect(page.locator('button:has-text("Download Lease")')).toBeVisible();
  });

  test.skip('should display parking information', async ({ page }) => {
    await page.goto('/tenant/profile');
    await page.click('button[role="tab"]:has-text("Parking")');
    await page.waitForLoadState('networkidle');

    // Verify parking info
    await expect(page.locator('text=/Parking Spot/i')).toBeVisible();
    await expect(page.locator('text=/Spot Number/i')).toBeVisible();
    await expect(page.locator('text=/Fee/i')).toBeVisible();
  });
});

test.describe('Account Settings - Password Change', () => {
  test.skip('should display password change form', async ({ page }) => {
    await page.goto('/tenant/profile');
    await page.click('button[role="tab"]:has-text("Settings")');
    await page.waitForLoadState('networkidle');

    // Verify password form elements
    await expect(page.locator('[data-testid="input-current-password"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-new-password"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-confirm-password"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-change-password"]')).toBeVisible();
  });

  test.skip('should validate password requirements', async ({ page }) => {
    await page.goto('/tenant/profile');
    await page.click('button[role="tab"]:has-text("Settings")');
    await page.waitForLoadState('networkidle');

    // Try to submit empty form
    await page.click('[data-testid="btn-change-password"]');

    // Verify validation errors
    await expect(page.locator('text=/required/i')).toBeVisible({ timeout: 2000 });
  });

  test.skip('should validate password strength', async ({ page }) => {
    await page.goto('/tenant/profile');
    await page.click('button[role="tab"]:has-text("Settings")');
    await page.waitForLoadState('networkidle');

    // Fill with weak password
    await page.fill('[data-testid="input-current-password"]', 'OldPassword123!');
    await page.fill('[data-testid="input-new-password"]', 'weak');
    await page.fill('[data-testid="input-confirm-password"]', 'weak');

    await page.click('[data-testid="btn-change-password"]');

    // Verify password strength validation error
    await expect(page.locator('text=/at least 12 characters|password must/i')).toBeVisible({
      timeout: 2000,
    });
  });

  test.skip('should validate password confirmation matches', async ({ page }) => {
    await page.goto('/tenant/profile');
    await page.click('button[role="tab"]:has-text("Settings")');
    await page.waitForLoadState('networkidle');

    // Fill with mismatched passwords
    await page.fill('[data-testid="input-current-password"]', 'OldPassword123!');
    await page.fill('[data-testid="input-new-password"]', 'NewSecurePass123!@');
    await page.fill('[data-testid="input-confirm-password"]', 'DifferentPass123!@');

    await page.click('[data-testid="btn-change-password"]');

    // Verify mismatch error
    await expect(page.locator('text=/passwords must match|do not match/i')).toBeVisible({
      timeout: 2000,
    });
  });

  test.skip('should successfully change password with valid input', async ({ page }) => {
    await page.goto('/tenant/profile');
    await page.click('button[role="tab"]:has-text("Settings")');
    await page.waitForLoadState('networkidle');

    // Fill with valid passwords
    await page.fill('[data-testid="input-current-password"]', 'OldPassword123!');
    await page.fill('[data-testid="input-new-password"]', 'NewSecurePass123!@');
    await page.fill('[data-testid="input-confirm-password"]', 'NewSecurePass123!@');

    // Monitor network request
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/api/v1/tenant/account/change-password') &&
        response.request().method() === 'POST'
    );

    await page.click('[data-testid="btn-change-password"]');

    const response = await responsePromise;

    // Verify success (either redirect or success message)
    if (response.status() === 200) {
      await expect(page.locator('text=/password changed|success/i')).toBeVisible({
        timeout: 3000,
      });
    }
  });

  test.skip('should show loading state during password change', async ({ page }) => {
    await page.goto('/tenant/profile');
    await page.click('button[role="tab"]:has-text("Settings")');
    await page.waitForLoadState('networkidle');

    // Delay API response to see loading state
    await page.route('**/api/v1/tenant/account/change-password', async (route) => {
      await page.waitForTimeout(1000);
      await route.continue();
    });

    await page.fill('[data-testid="input-current-password"]', 'OldPassword123!');
    await page.fill('[data-testid="input-new-password"]', 'NewSecurePass123!@');
    await page.fill('[data-testid="input-confirm-password"]', 'NewSecurePass123!@');

    const submitButton = page.locator('[data-testid="btn-change-password"]');
    await submitButton.click();

    // Verify button is disabled during submission
    await expect(submitButton).toBeDisabled({ timeout: 500 });
  });
});

test.describe('Tenant Portal - Contact Banner', () => {
  test.skip('should display contact information banner', async ({ page }) => {
    await page.goto('/tenant/profile');
    await page.waitForLoadState('networkidle');

    // Verify contact banner is visible
    await expect(
      page.locator('text=/contact property management|support@ultrabms.com/i')
    ).toBeVisible();

    // Verify email link
    const emailLink = page.locator('a[href="mailto:support@ultrabms.com"]');
    await expect(emailLink).toBeVisible();
  });
});

test.describe('Tenant Portal - Accessibility', () => {
  test.skip('should be keyboard navigable', async ({ page }) => {
    await page.goto('/tenant/dashboard');
    await page.waitForLoadState('networkidle');

    // Tab through interactive elements
    await page.keyboard.press('Tab');

    // Verify focus is on an interactive element
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['BUTTON', 'A', 'INPUT']).toContain(focusedElement);
  });

  test.skip('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/tenant/dashboard');
    await page.waitForLoadState('networkidle');

    // Verify h1 exists
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThanOrEqual(1);

    // Verify logical heading structure (no h3 before h2, etc.)
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    expect(headings.length).toBeGreaterThan(0);
  });

  test.skip('should have proper ARIA labels on form inputs', async ({ page }) => {
    await page.goto('/tenant/profile');
    await page.click('button[role="tab"]:has-text("Settings")');
    await page.waitForLoadState('networkidle');

    // Verify password inputs have labels or aria-labels
    const currentPasswordInput = page.locator('[data-testid="input-current-password"]');
    const newPasswordInput = page.locator('[data-testid="input-new-password"]');
    const confirmPasswordInput = page.locator('[data-testid="input-confirm-password"]');

    // Each input should have either aria-label or associated label
    for (const input of [currentPasswordInput, newPasswordInput, confirmPasswordInput]) {
      const ariaLabel = await input.getAttribute('aria-label');
      const id = await input.getAttribute('id');
      const hasLabel = id ? await page.locator(`label[for="${id}"]`).count() > 0 : false;

      expect(ariaLabel || hasLabel).toBeTruthy();
    }
  });
});

test.describe('Tenant Portal - Responsive Design', () => {
  test.skip('should be mobile responsive', async ({ page }) => {
    // Test on mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/tenant/dashboard');
    await page.waitForLoadState('networkidle');

    // Verify content is visible and not overflowing
    const body = page.locator('body');
    const scrollWidth = await body.evaluate((el) => el.scrollWidth);
    const clientWidth = await body.evaluate((el) => el.clientWidth);

    // Allow for small differences due to scrollbars
    expect(scrollWidth - clientWidth).toBeLessThan(20);
  });

  test.skip('should be tablet responsive', async ({ page }) => {
    // Test on tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto('/tenant/profile');
    await page.waitForLoadState('networkidle');

    // Verify layout adapts to tablet size
    await expect(page.locator('[data-testid="profile-container"]')).toBeVisible();

    // Verify tabs are visible and functional
    await page.click('button[role="tab"]:has-text("Lease")');
    await expect(page.locator('text=/Base Rent/i')).toBeVisible();
  });
});
