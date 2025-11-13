# Ultra BMS E2E Test Suite

Production-ready Playwright test framework for Ultra BMS web application.

## 📋 Overview

This test suite provides comprehensive end-to-end testing capabilities for the Ultra BMS platform using Playwright. The framework follows industry best practices with fixture-based test isolation, data factories with auto-cleanup, and deterministic waiting strategies.

**Framework:** Playwright 1.49+
**Language:** TypeScript 5+
**Test Runner:** Playwright Test

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- Backend API running on `http://localhost:8080`
- Frontend dev server running on `http://localhost:3000`

### Installation

```bash
# Install dependencies (from frontend directory)
npm install

# Install Playwright browsers
npx playwright install
```

### Environment Setup

```bash
# Copy environment template
cp .env.test.example .env.test

# Edit .env.test and fill in test credentials
```

### Running Tests

```bash
# Run all tests (headless)
npm run test:e2e

# Run with UI mode (recommended for development)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug mode (step through tests)
npm run test:e2e:debug

# View HTML report
npm run test:e2e:report
```

---

## 📁 Architecture

### Directory Structure

```
tests/
├── e2e/                          # Test files
│   └── example.spec.ts           # Example test suite
├── support/                      # Test infrastructure
│   ├── fixtures/                 # Playwright fixtures
│   │   ├── index.ts              # Main fixture export
│   │   └── factories/            # Data factories
│   │       ├── user-factory.ts
│   │       └── tenant-factory.ts
│   ├── helpers/                  # Utility helpers
│   │   ├── auth-helper.ts
│   │   └── wait-helper.ts
│   └── page-objects/             # Page object models (optional)
└── README.md                     # This file
```

### Key Patterns

#### 1. Fixture Architecture

Tests use Playwright's fixture pattern for automatic setup/teardown:

```typescript
import { test, expect } from '../support/fixtures';

test('should create tenant', async ({ tenantFactory }) => {
  // Factory creates test data
  const tenant = await tenantFactory.createTenant();

  // Test logic here...

  // Automatic cleanup after test
});
```

#### 2. Data Factories

Factories create realistic test data with auto-cleanup:

```typescript
// UserFactory
await userFactory.createUser({ role: 'ADMIN' });
await userFactory.createFinanceManager();

// TenantFactory
await tenantFactory.createTenant({
  firstName: 'Ahmed',
  nationality: 'United Arab Emirates',
});
```

#### 3. Helper Utilities

Reusable helpers for common operations:

```typescript
// AuthHelper
const authHelper = new AuthHelper(page);
await authHelper.loginAsAdmin();
await authHelper.logout();

// WaitHelper
const waitHelper = new WaitHelper(page);
await waitHelper.waitForApiResponse(/\/api\/v1\/tenants/);
await waitHelper.waitForTableData();
await waitHelper.waitForToast('Success');
```

#### 4. Selector Strategy

Always use `data-testid` attributes for reliable element selection:

```typescript
// ✓ GOOD - Stable selectors
await page.click('[data-testid="login-button"]');
await page.fill('[data-testid="email-input"]', email);

// ✗ BAD - Brittle selectors
await page.click('.btn-primary');
await page.fill('#email');
```

---

## 🧪 Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from '../support/fixtures';
import { AuthHelper } from '../support/helpers/auth-helper';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    // Arrange
    await page.goto('/path');

    // Act
    await page.click('[data-testid="action-button"]');

    // Assert
    await expect(page.locator('[data-testid="result"]')).toBeVisible();
  });
});
```

### Using Fixtures

```typescript
test('should create and verify tenant', async ({ page, tenantFactory }) => {
  // Create test data via API
  const tenant = await tenantFactory.createTenant();

  // Navigate to UI
  await page.goto('/(dashboard)/tenants');

  // Verify tenant appears
  const tenantRow = page.locator(`[data-testid="tenant-row"]:has-text("${tenant.email}")`);
  await expect(tenantRow).toBeVisible();

  // Factory handles cleanup automatically
});
```

### Network-First Testing

Always wait for API responses before assertions:

```typescript
import { WaitHelper } from '../support/helpers/wait-helper';

test('should load tenant list', async ({ page }) => {
  const waitHelper = new WaitHelper(page);

  await page.goto('/(dashboard)/tenants');

  // Wait for API to complete
  await waitHelper.waitForApiResponse(/\/api\/v1\/tenants/);

  // Now safe to assert
  await waitHelper.waitForTableData();
  await expect(page.locator('[data-testid="tenant-row"]')).toHaveCount(10);
});
```

---

## 📊 Test Configuration

### Timeouts

| Action            | Timeout | Configured In       |
| ----------------- | ------- | ------------------- |
| Test execution    | 60s     | playwright.config.ts |
| Element action    | 15s     | playwright.config.ts |
| Navigation        | 30s     | playwright.config.ts |
| Assertion         | 15s     | playwright.config.ts |

### Browsers

Tests run on:

- ✓ Chromium (Desktop Chrome)
- ✓ Firefox (Desktop Firefox)
- ✓ WebKit (Desktop Safari)

### Artifacts

Captured only on failure to reduce storage:

- Screenshots: `only-on-failure`
- Videos: `retain-on-failure`
- Traces: `retain-on-failure`

Artifacts saved to: `test-results/`

---

## 🔧 CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: npm ci
        working-directory: frontend

      - name: Install Playwright browsers
        run: npx playwright install --with-deps
        working-directory: frontend

      - name: Run E2E tests
        run: npm run test:e2e
        working-directory: frontend
        env:
          BASE_URL: http://localhost:3000
          API_URL: http://localhost:8080/api/v1

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: frontend/test-results/
```

---

## 📝 Best Practices

### Test Isolation

- ✓ Each test is independent
- ✓ Use factories for data creation
- ✓ Automatic cleanup after each test
- ✓ No shared state between tests

### Deterministic Testing

- ✓ Wait for API responses before assertions
- ✓ Use `waitForSelector` with state: 'visible'
- ✓ Avoid arbitrary `waitForTimeout` (use only for animations)
- ✓ Use `waitForLoadState('networkidle')` when appropriate

### Maintainability

- ✓ Keep tests focused (one behavior per test)
- ✓ Use descriptive test names
- ✓ Extract complex logic to helpers or page objects
- ✓ Use data-testid for all UI interactions

### Performance

- ✓ Run tests in parallel (default)
- ✓ Use fixtures to avoid redundant setup
- ✓ Mock external services when possible
- ✓ Limit retries to CI environments only

---

## 🔍 Debugging

### UI Mode (Recommended)

```bash
npm run test:e2e:ui
```

Features:

- Time travel debugging
- Step-by-step execution
- Network activity inspector
- Console logs viewer

### Debug Mode

```bash
npm run test:e2e:debug
```

Opens Playwright Inspector for step-by-step debugging.

### Headed Mode

```bash
npm run test:e2e:headed
```

Run tests with visible browser (useful for observing test execution).

### Viewing Traces

```bash
npx playwright show-trace test-results/trace.zip
```

View detailed execution trace with screenshots, network, and console logs.

---

## 🎯 Coverage

### Module Coverage Goals

| Module                | E2E Coverage Target |
| --------------------- | ------------------- |
| Authentication        | 100%                |
| Tenant Management     | 90%                 |
| Maintenance (Work Orders) | 85%             |
| Financial (Invoices, PDCs) | 90%            |
| Vendor Management     | 80%                 |
| Dashboard & Analytics | 75%                 |
| Settings              | 70%                 |

---

## 📚 Additional Resources

### Playwright Documentation

- [Official Docs](https://playwright.dev/docs/intro)
- [API Reference](https://playwright.dev/docs/api/class-playwright)
- [Best Practices](https://playwright.dev/docs/best-practices)

### Ultra BMS Documentation

- Architecture: `/docs/architecture.md`
- API Contracts: See architecture doc for endpoint specs
- Component Library: shadcn/ui documentation

### Knowledge Base References

This framework implements patterns from TEA (Test Architect) knowledge base:

- Fixture architecture with `mergeTests` composition
- Faker-based data factories with auto-cleanup
- Network-first testing safeguards
- Failure-only artifact capture
- Deterministic waiting strategies

---

## 🤝 Contributing

### Adding New Tests

1. Create test file in `tests/e2e/`
2. Use fixtures and helpers for common operations
3. Follow naming convention: `feature-name.spec.ts`
4. Add `data-testid` attributes to UI components

### Adding New Factories

1. Create factory in `tests/support/fixtures/factories/`
2. Implement `cleanup()` method
3. Export in `tests/support/fixtures/index.ts`
4. Track created IDs for deletion

### Adding New Helpers

1. Create helper in `tests/support/helpers/`
2. Accept `Page` object in constructor
3. Keep methods focused and reusable

---

**Framework Version:** 1.0
**Generated:** 2025-11-13
**Maintained by:** TEA (Test Architect)
**Part of:** BMAD Method v6.0
