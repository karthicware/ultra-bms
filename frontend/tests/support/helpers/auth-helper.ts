import { Page } from '@playwright/test';

/**
 * Authentication Helper
 * Provides reusable authentication utilities for tests
 */

export class AuthHelper {
  constructor(private page: Page) {}

  /**
   * Login with email and password
   */
  async login(email: string, password: string) {
    await this.page.goto('/login');

    // Wait for login form to be ready
    await this.page.waitForSelector('[data-testid="email-input"]', { state: 'visible' });

    await this.page.fill('[data-testid="email-input"]', email);
    await this.page.fill('[data-testid="password-input"]', password);

    // Use force: true to bypass Next.js dev overlay interference
    await this.page.click('[data-testid="login-button"]', { force: true });

    // Wait for navigation away from login page
    await this.page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });

    // Additional wait for page to be stable after login
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
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
   */
  async logout() {
    await this.page.click('[data-testid="user-menu"]', { force: true });
    await this.page.click('[data-testid="logout-button"]', { force: true });

    // Wait for redirect to login
    await this.page.waitForURL('/login', { timeout: 15000 });
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
