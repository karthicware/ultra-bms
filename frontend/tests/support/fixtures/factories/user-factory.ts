import { faker } from '@faker-js/faker';

/**
 * User Factory
 * Creates test users with realistic data and automatic cleanup
 */

interface User {
  id?: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  roleName?: string;
}

export class UserFactory {
  private createdUsers: string[] = [];
  private apiUrl = process.env.API_URL || 'http://localhost:8080/api/v1';
  private baseUrl = process.env.BASE_URL || 'http://localhost:8080';
  private backendAvailable: boolean | null = null;

  /**
   * Check if backend is available
   */
  private async checkBackend(): Promise<boolean> {
    if (this.backendAvailable !== null) {
      return this.backendAvailable;
    }

    try {
      // Health check is at root level, not under /api/v1
      const response = await fetch(`${this.baseUrl}/actuator/health`, {
        method: 'GET',
      }).catch(() => null);

      this.backendAvailable = response?.ok || false;
    } catch {
      this.backendAvailable = false;
    }

    return this.backendAvailable;
  }

  /**
   * Create a test user with optional overrides
   * Throws error if backend is not available
   */
  async createUser(overrides: Partial<User> = {}): Promise<User> {
    const backendAvailable = await this.checkBackend();

    if (!backendAvailable) {
      throw new Error('Backend API is not available. Start the backend server to run integration tests.');
    }

    const user: User = {
      email: faker.internet.email(),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      password: 'Test@123', // Strong password that meets all requirements
      roleName: 'PROPERTY_MANAGER',
      ...overrides,
    };

    // API call to create user via registration endpoint
    const response = await fetch(`${this.apiUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });

    if (!response.ok) {
      throw new Error(`Failed to create user: ${response.statusText}`);
    }

    const created = await response.json();
    this.createdUsers.push(created.data.id);

    return { ...user, id: created.data.id };
  }

  /**
   * Create a super admin user
   */
  async createAdmin(overrides: Partial<User> = {}): Promise<User> {
    return this.createUser({
      roleName: 'SUPER_ADMIN',
      ...overrides,
    });
  }

  /**
   * Create a finance manager user
   */
  async createFinanceManager(overrides: Partial<User> = {}): Promise<User> {
    return this.createUser({
      roleName: 'FINANCE_MANAGER',
      ...overrides,
    });
  }

  /**
   * Cleanup all created users
   */
  async cleanup() {
    for (const userId of this.createdUsers) {
      try {
        await fetch(`${this.apiUrl}/users/${userId}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.warn(`Failed to delete user ${userId}:`, error);
      }
    }
    this.createdUsers = [];
  }
}
