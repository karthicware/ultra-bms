import { test as base } from '@playwright/test';
import { UserFactory } from './factories/user-factory';
import { TenantFactory } from './factories/tenant-factory';
import { AuthHelper } from '../helpers/auth-helper';

/**
 * Extended Playwright fixtures for Ultra BMS
 * Provides auto-cleanup and factory pattern for test data
 */

type TestFixtures = {
  userFactory: UserFactory;
  tenantFactory: TenantFactory;
  authHelper: AuthHelper;
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

  authHelper: async ({ page }, use) => {
    const helper = new AuthHelper(page);
    await use(helper);
  },
});

export { expect } from '@playwright/test';
