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

    await this.page.fill('[data-testid="email-input"]', email);
    await this.page.fill('[data-testid="password-input"]', password);
    await this.page.click('[data-testid="login-button"]');

    // Wait for redirect to dashboard
    await this.page.waitForURL('/(dashboard)', { timeout: 15000 });
  }

  /**
   * Login as admin user
   */
  async loginAsAdmin() {
    const adminEmail = process.env.TEST_ADMIN_EMAIL || 'admin@ultrabms.com';
    const adminPassword = process.env.TEST_ADMIN_PASSWORD || 'admin123';

    await this.login(adminEmail, adminPassword);
  }

  /**
   * Login as regular user
   */
  async loginAsUser() {
    const userEmail = process.env.TEST_USER_EMAIL || 'user@ultrabms.com';
    const userPassword = process.env.TEST_USER_PASSWORD || 'user123';

    await this.login(userEmail, userPassword);
  }

  /**
   * Logout
   */
  async logout() {
    await this.page.click('[data-testid="user-menu"]');
    await this.page.click('[data-testid="logout-button"]');

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
