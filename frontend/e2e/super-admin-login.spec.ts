import { test } from '@playwright/test';

/**
 * Super Admin Login Test
 * Tests the super admin login redirect issue
 */

test.describe('Super Admin Login - Debug Test', () => {
  test('should successfully login as super admin and redirect to dashboard', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    console.log('📍 Current URL:', page.url());

    // Use super admin credentials
    const superAdminEmail = 'admin@ultrabms.com';
    const superAdminPassword = 'Admin@123';

    // Fill in credentials
    console.log('🔑 Filling in super admin credentials...');
    await page.fill('[data-testid="email-input"]', superAdminEmail);
    await page.fill('[data-testid="password-input"]', superAdminPassword);

    // Set up listeners
    page.on('console', msg => console.log(`🖥️  Browser Console: ${msg.text()}`));

    // Wait for login API response
    const loginPromise = page.waitForResponse(
      response => response.url().includes('/auth/login') && response.status() === 200,
      { timeout: 10000 }
    );

    // Submit form
    console.log('📤 Submitting login form...');
    await page.click('[data-testid="login-button"]');

    // Wait for login to complete
    await loginPromise;
    console.log('✅ Login API call successful');

    // Wait a moment for the refresh token cookie to be set
    await page.waitForTimeout(1000);

    // Navigate directly to dashboard
    console.log('🚀 Navigating to dashboard...');
    await page.goto('/dashboard', { waitUntil: 'networkidle' });

    console.log('📍 Current URL after navigation:', page.url());

    // Wait for dashboard to load - check for dashboard-specific content
    try {
      // Wait for dashboard page content to appear
      await page.waitForSelector('[data-testid="dashboard-page"]', { timeout: 10000 });
      console.log('✅ Dashboard page loaded successfully!');
    } catch (error) {
      console.log('❌ Dashboard page did not load');
      console.log('📍 Current URL:', page.url());
      await page.screenshot({ path: 'dashboard-load-failure.png', fullPage: true });
      throw error;
    }

    console.log('✅ Login and dashboard navigation test passed!');
  });

  test('debug - check auth state after login', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const superAdminEmail = 'admin@ultrabms.com';
    const superAdminPassword = 'Admin@123';

    // Fill and submit
    await page.fill('[data-testid="email-input"]', superAdminEmail);
    await page.fill('[data-testid="password-input"]', superAdminPassword);

    // Intercept the login API call
    const loginResponse = page.waitForResponse(response =>
      response.url().includes('/auth/login') && response.status() === 200
    );

    await page.click('[data-testid="login-button"]');

    // Wait for login response
    const response = await loginResponse;
    const responseData = await response.json();
    console.log('📡 Login Response Data:', JSON.stringify(responseData, null, 2));

    // Check cookies
    const cookies = await page.context().cookies();
    console.log('🍪 Cookies after login:', cookies.map(c => ({ name: c.name, httpOnly: c.httpOnly })));

    // Wait and check current URL
    await page.waitForTimeout(3000);
    console.log('📍 Final URL:', page.url());

    // Check local storage / session storage
    const authState = await page.evaluate(() => {
      return {
        localStorage: { ...localStorage },
        sessionStorage: { ...sessionStorage },
      };
    });
    console.log('💾 Storage after login:', authState);
  });
});
