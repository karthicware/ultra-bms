import { test, expect } from '../support/fixtures';
import { AuthHelper } from '../support/helpers/auth-helper';
import { WaitHelper } from '../support/helpers/wait-helper';

/**
 * Example E2E Test Suite for Ultra BMS
 * Demonstrates best practices: fixtures, helpers, page objects, data-testid selectors
 */

test.describe('Example Test Suite - Homepage', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/');

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Verify title or main heading
    await expect(page).toHaveTitle(/Ultra BMS/i);
  });

  test('should redirect unauthenticated user to login', async ({ page }) => {
    await page.goto('/(dashboard)');

    // Should redirect to login
    await page.waitForURL('/login', { timeout: 15000 });

    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
  });
});

test.describe('Example Test Suite - Authentication', () => {
  test('should login with valid credentials', async ({ page }) => {
    const authHelper = new AuthHelper(page);

    // Use environment variables for test credentials
    const email = process.env.TEST_USER_EMAIL || 'test@example.com';
    const password = process.env.TEST_USER_PASSWORD || 'password123';

    await authHelper.login(email, password);

    // Verify logged in state
    const isLoggedIn = await authHelper.isLoggedIn();
    expect(isLoggedIn).toBe(true);

    // Verify user menu is visible
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('[data-testid="email-input"]', 'invalid@example.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    await page.click('[data-testid="login-button"]');

    // Wait for error message
    const errorMessage = page.locator('[data-testid="error-message"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(/invalid credentials/i);
  });
});

test.describe('Example Test Suite - Tenant Management with Fixtures', () => {
  test('should create tenant using factory', async ({ page, tenantFactory }) => {
    const authHelper = new AuthHelper(page);
    const waitHelper = new WaitHelper(page);

    // Login as admin
    await authHelper.loginAsAdmin();

    // Create test tenant via API (fixture)
    const tenant = await tenantFactory.createTenant({
      firstName: 'John',
      lastName: 'Doe',
    });

    // Navigate to tenants page
    await page.goto('/(dashboard)/tenants');

    // Wait for table to load
    await waitHelper.waitForTableData();

    // Search for created tenant
    await page.fill('[data-testid="search-input"]', tenant.email);

    // Wait for API response
    await waitHelper.waitForApiResponse(/\/api\/v1\/tenants/);

    // Verify tenant appears in list
    const tenantRow = page.locator(`[data-testid="tenant-row"]:has-text("${tenant.email}")`);
    await expect(tenantRow).toBeVisible();
    await expect(tenantRow).toContainText(tenant.firstName);
    await expect(tenantRow).toContainText(tenant.lastName);

    // Factory will auto-cleanup tenant after test
  });
});

test.describe('Example Test Suite - Network Interception', () => {
  test('should handle API errors gracefully', async ({ page }) => {
    // Intercept API call and return error
    await page.route('**/api/v1/tenants', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Database connection failed',
          },
        }),
      });
    });

    await page.goto('/(dashboard)/tenants');

    // Verify error message is displayed
    const errorAlert = page.locator('[data-testid="error-alert"]');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText(/error/i);
  });
});
