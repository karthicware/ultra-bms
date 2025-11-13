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
  role?: string;
}

export class UserFactory {
  private createdUsers: string[] = [];
  private apiUrl = process.env.API_URL || 'http://localhost:8080/api/v1';

  /**
   * Create a test user with optional overrides
   */
  async createUser(overrides: Partial<User> = {}): Promise<User> {
    const user: User = {
      email: faker.internet.email(),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      password: faker.internet.password({ length: 12 }),
      role: 'PROPERTY_MANAGER',
      ...overrides,
    };

    // API call to create user
    const response = await fetch(`${this.apiUrl}/users`, {
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
      role: 'SUPER_ADMIN',
      ...overrides,
    });
  }

  /**
   * Create a finance manager user
   */
  async createFinanceManager(overrides: Partial<User> = {}): Promise<User> {
    return this.createUser({
      role: 'FINANCE_MANAGER',
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
