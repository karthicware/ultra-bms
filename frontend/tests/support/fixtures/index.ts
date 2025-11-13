import { test as base } from '@playwright/test';
import { UserFactory } from './factories/user-factory';
import { TenantFactory } from './factories/tenant-factory';

/**
 * Extended Playwright fixtures for Ultra BMS
 * Provides auto-cleanup and factory pattern for test data
 */

type TestFixtures = {
  userFactory: UserFactory;
  tenantFactory: TenantFactory;
};

export const test = base.extend<TestFixtures>({
  userFactory: async ({}, use) => {
    const factory = new UserFactory();
    await use(factory);
    await factory.cleanup(); // Auto-cleanup after each test
  },

  tenantFactory: async ({}, use) => {
    const factory = new TenantFactory();
    await use(factory);
    await factory.cleanup(); // Auto-cleanup after each test
  },
});

export { expect } from '@playwright/test';
