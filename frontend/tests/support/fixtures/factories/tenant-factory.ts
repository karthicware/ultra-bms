import { faker } from '@faker-js/faker';

/**
 * Tenant Factory
 * Creates test tenants with realistic UAE-specific data and automatic cleanup
 */

interface Tenant {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  idNumber?: string;
  nationality?: string;
}

export class TenantFactory {
  private createdTenants: string[] = [];
  private apiUrl = process.env.API_URL || 'http://localhost:8080/api/v1';

  /**
   * Create a test tenant with optional overrides
   */
  async createTenant(overrides: Partial<Tenant> = {}): Promise<Tenant> {
    const tenant: Tenant = {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email(),
      phone: `+971${faker.number.int({ min: 500000000, max: 599999999 })}`, // UAE mobile format
      alternatePhone: `+971${faker.number.int({ min: 500000000, max: 599999999 })}`,
      idNumber: `784-${faker.string.numeric(4)}-${faker.string.numeric(7)}-${faker.number.int({ min: 0, max: 9 })}`, // Emirates ID format
      nationality: faker.helpers.arrayElement([
        'United Arab Emirates',
        'India',
        'Pakistan',
        'Philippines',
        'Egypt',
        'United Kingdom',
      ]),
      ...overrides,
    };

    // API call to create tenant
    const response = await fetch(`${this.apiUrl}/tenants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tenant),
    });

    if (!response.ok) {
      throw new Error(`Failed to create tenant: ${response.statusText}`);
    }

    const created = await response.json();
    this.createdTenants.push(created.data.id);

    return { ...tenant, id: created.data.id };
  }

  /**
   * Create a tenant with active lease
   */
  async createTenantWithLease(overrides: Partial<Tenant> = {}): Promise<Tenant> {
    const tenant = await this.createTenant(overrides);

    // Create lease for this tenant
    // TODO: Implement lease creation when LeaseFactory is available

    return tenant;
  }

  /**
   * Cleanup all created tenants
   */
  async cleanup() {
    for (const tenantId of this.createdTenants) {
      try {
        await fetch(`${this.apiUrl}/tenants/${tenantId}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.warn(`Failed to delete tenant ${tenantId}:`, error);
      }
    }
    this.createdTenants = [];
  }
}
