import { Page } from '@playwright/test';

/**
 * Authentication Helper
 * Provides reusable authentication utilities for tests
 */

export class AuthHelper {
  constructor(private page: Page) {}

  /**
   * Login with email and password
   * @param pageOrEmail - Either a Page object (for legacy compatibility) or email string
   * @param emailOrPassword - Either email (if page provided) or password
   * @param password - Password (only if page provided as first arg)
   */
  async login(pageOrEmail: Page | string, emailOrPassword?: string, password?: string) {
    let targetPage: Page;
    let email: string;
    let pwd: string;

    // Handle legacy 3-argument signature: login(page, email, password)
    if (typeof pageOrEmail === 'object' && 'goto' in pageOrEmail) {
      targetPage = pageOrEmail;
      email = emailOrPassword!;
      pwd = password!;
    } else {
      // Handle standard 2-argument signature: login(email, password)
      targetPage = this.page;
      email = pageOrEmail as string;
      pwd = emailOrPassword!;
    }

    await targetPage.goto('/login');

    // Wait for login form to be ready
    await targetPage.waitForSelector('[data-testid="email-input"]', { state: 'visible' });

    await targetPage.fill('[data-testid="email-input"]', email);
    await targetPage.fill('[data-testid="password-input"]', pwd);

    // Use force: true to bypass Next.js dev overlay interference
    await targetPage.click('[data-testid="login-button"]', { force: true });

    // Wait for navigation away from login page
    await targetPage.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });

    // Additional wait for page to be stable after login
    await targetPage.waitForLoadState('networkidle', { timeout: 10000 });
  }

  /**
   * Login as admin user
   */
  async loginAsAdmin() {
    const adminEmail = process.env.TEST_ADMIN_EMAIL || 'admin@ultrabms.com';
    const adminPassword = process.env.TEST_ADMIN_PASSWORD || 'Admin@123';

    await this.login(adminEmail, adminPassword);
  }

  /**
   * Login as regular user
   */
  async loginAsUser() {
    const userEmail = process.env.TEST_USER_EMAIL || 'user@ultrabms.com';
    const userPassword = process.env.TEST_USER_PASSWORD || 'User@123';

    await this.login(userEmail, userPassword);
  }

  /**
   * Logout
   * @param pageOverride - Optional page object to use instead of the one from constructor
   */
  async logout(pageOverride?: Page) {
    const targetPage = pageOverride || this.page;
    await targetPage.click('[data-testid="user-menu"]', { force: true });
    await targetPage.click('[data-testid="logout-button"]', { force: true });

    // Wait for redirect to login
    await targetPage.waitForURL('/login', { timeout: 15000 });
  }

  /**
   * Check if user is logged in
   */
  async isLoggedIn(): Promise<boolean> {
    try {
      await this.page.waitForSelector('[data-testid="user-menu"]', { timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }
}
