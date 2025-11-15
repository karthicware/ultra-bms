# Test Coverage Configuration Guide

**Project:** Ultra BMS
**Version:** 1.0
**Status:** ✅ Backend Configured | ⚠️ Frontend Needs Setup
**Last Updated:** November 15, 2025

---

## Overview

This guide documents the test coverage configuration and thresholds for Ultra BMS. Based on Epic 2 retrospective action items, we enforce minimum coverage thresholds to maintain code quality.

---

## Coverage Thresholds

### Minimum Requirements (from Definition of Done)

| Layer | Line Coverage | Branch Coverage | Notes |
|-------|---------------|-----------------|-------|
| **Backend** (Java/Spring Boot) | **≥80%** | **≥70%** | Enforced by JaCoCo |
| **Frontend** (TypeScript/React) | **≥70%** | **≥60%** | To be enforced by Jest |
| **E2E Tests** (Playwright) | All critical flows | N/A | Functional coverage |

---

## Backend Coverage (Spring Boot)

### ✅ Status: CONFIGURED

The backend uses **JaCoCo** (Java Code Coverage) integrated with Maven.

### Configuration

**File:** `backend/pom.xml`

```xml
<plugin>
    <groupId>org.jacoco</groupId>
    <artifactId>jacoco-maven-plugin</artifactId>
    <version>0.8.12</version>
    <executions>
        <!-- Prepare agent for test execution -->
        <execution>
            <id>prepare-agent</id>
            <goals>
                <goal>prepare-agent</goal>
            </goals>
        </execution>

        <!-- Generate coverage report after tests -->
        <execution>
            <id>report</id>
            <phase>test</phase>
            <goals>
                <goal>report</goal>
            </goals>
        </execution>

        <!-- Enforce coverage thresholds -->
        <execution>
            <id>check-coverage</id>
            <phase>test</phase>
            <goals>
                <goal>check</goal>
            </goals>
            <configuration>
                <rules>
                    <rule>
                        <element>BUNDLE</element>
                        <limits>
                            <!-- Minimum 80% line coverage -->
                            <limit>
                                <counter>LINE</counter>
                                <value>COVEREDRATIO</value>
                                <minimum>0.80</minimum>
                            </limit>
                            <!-- Minimum 70% branch coverage -->
                            <limit>
                                <counter>BRANCH</counter>
                                <value>COVEREDRATIO</value>
                                <minimum>0.70</minimum>
                            </limit>
                        </limits>
                    </rule>
                </rules>
            </configuration>
        </execution>
    </executions>
</plugin>
```

### Running Backend Tests with Coverage

```bash
# Navigate to backend directory
cd backend

# Run tests with coverage
./mvnw clean test

# Coverage report will be generated at:
# target/site/jacoco/index.html
```

### Viewing Coverage Report

```bash
# Open HTML report in browser
open target/site/jacoco/index.html
# or on Linux:
xdg-open target/site/jacoco/index.html
```

### Coverage Enforcement

- ✅ **Automatic:** Coverage thresholds are checked during `mvn test`
- ✅ **Build Fails:** If coverage < 80% (line) or < 70% (branch)
- ✅ **CI/CD:** Integrated into Maven lifecycle

### Sample Output

```
[INFO] --- jacoco:0.8.12:check (check-coverage) @ ultra-bms-backend ---
[INFO] Loading execution data file /path/to/target/jacoco.exec
[INFO] Analyzed bundle 'UltraBMS' with 45 classes
[INFO] All coverage checks have been met.
```

**Or if coverage is insufficient:**

```
[ERROR] Rule violated for bundle UltraBMS: lines covered ratio is 0.75,
        but expected minimum is 0.80
[ERROR] BUILD FAILURE
```

---

## Frontend Coverage (Next.js/React)

### ⚠️ Status: NEEDS SETUP

The frontend currently only has Playwright E2E tests. Unit/integration testing with coverage tracking needs to be configured.

### Recommended Setup: Jest + React Testing Library

#### Step 1: Install Dependencies

```bash
cd frontend

npm install --save-dev \
  jest \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  jest-environment-jsdom \
  @types/jest
```

#### Step 2: Create Jest Configuration

**File:** `frontend/jest.config.ts`

```typescript
import type { Config } from 'jest';
import nextJest from 'next/jest';

const createJestConfig = nextJest({
  // Provide the path to your Next.js app
  dir: './',
});

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

  // Module paths
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
  ],

  // Coverage thresholds (ENFORCED)
  coverageThreshold: {
    global: {
      lines: 70,
      branches: 60,
      functions: 70,
      statements: 70,
    },
  },

  // Test match patterns
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{spec,test}.{js,jsx,ts,tsx}',
  ],

  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/tests/', // Playwright E2E tests
  ],
};

export default createJestConfig(config);
```

#### Step 3: Create Jest Setup File

**File:** `frontend/jest.setup.ts`

```typescript
import '@testing-library/jest-dom';
```

#### Step 4: Update package.json Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:coverage:watch": "jest --coverage --watch"
  }
}
```

#### Step 5: Example Unit Test

**File:** `frontend/src/components/__tests__/Button.test.tsx`

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/button';

describe('Button Component', () => {
  it('should render button with text', () => {
    render(<Button data-testid="btn-test">Click Me</Button>);

    expect(screen.getByTestId('btn-test')).toHaveTextContent('Click Me');
  });

  it('should handle click events', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();

    render(
      <Button data-testid="btn-test" onClick={handleClick}>
        Click Me
      </Button>
    );

    await user.click(screen.getByTestId('btn-test'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(
      <Button data-testid="btn-test" disabled>
        Click Me
      </Button>
    );

    expect(screen.getByTestId('btn-test')).toBeDisabled();
  });
});
```

### Running Frontend Tests (Once Configured)

```bash
cd frontend

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Coverage report will be generated at:
# coverage/lcov-report/index.html
```

### Viewing Coverage Report

```bash
# Open HTML report in browser
open coverage/lcov-report/index.html
```

---

## Alternative: Vitest (Modern Option)

Vitest is a faster alternative to Jest, optimized for Vite/modern frameworks.

### Setup with Vitest

```bash
cd frontend

npm install --save-dev \
  vitest \
  @vitest/ui \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  jsdom
```

**File:** `frontend/vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        '.next/',
        'tests/', // Playwright E2E
        '**/*.d.ts',
        '**/*.stories.tsx',
      ],
      thresholds: {
        lines: 70,
        branches: 60,
        functions: 70,
        statements: 70,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**package.json scripts:**

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

---

## E2E Test Coverage (Playwright)

### ✅ Status: CONFIGURED

E2E tests use Playwright and focus on **functional coverage** rather than code coverage.

### Critical User Flows to Cover

Based on Epic 2 implementation:

#### Authentication Flows
- [ ] User registration with validation
- [ ] User login with valid credentials
- [ ] User login with invalid credentials
- [ ] Logout functionality
- [ ] Password reset request
- [ ] Password reset completion
- [ ] Session timeout handling
- [ ] Remember me functionality

#### Protected Routes
- [ ] Redirect unauthenticated users to login
- [ ] Allow authenticated users to access protected pages
- [ ] Role-based page access (RBAC)

#### Session Management
- [ ] Active session listing
- [ ] Logout from specific device
- [ ] Logout from all devices
- [ ] Session expiry warning

### Running E2E Tests

```bash
cd frontend

# Ensure servers are running first!
# The check-services.sh script will validate this

# Run all E2E tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug mode
npm run test:e2e:debug

# View report
npm run test:e2e:report
```

### E2E Test Structure

```
frontend/tests/
├── e2e/
│   ├── login.spec.ts          # Login flow tests
│   ├── registration.spec.ts   # Registration tests
│   ├── protected-routes.spec.ts
│   └── session-management.spec.ts
├── support/
│   ├── fixtures/
│   │   ├── index.ts
│   │   └── factories/
│   │       └── user-factory.ts
│   └── helpers/
└── playwright.config.ts
```

---

## Coverage Reports Location

### Backend (JaCoCo)
- **HTML Report:** `backend/target/site/jacoco/index.html`
- **XML Report:** `backend/target/site/jacoco/jacoco.xml`
- **CSV Report:** `backend/target/site/jacoco/jacoco.csv`

### Frontend (Jest - Once Configured)
- **HTML Report:** `frontend/coverage/lcov-report/index.html`
- **LCOV Report:** `frontend/coverage/lcov.info`
- **Text Summary:** Displayed in console after tests

### E2E (Playwright)
- **HTML Report:** `frontend/playwright-report/index.html`
- **Test Results:** `frontend/test-results/`

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests and Coverage

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main, develop]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up JDK 17
        uses: actions/setup-java@v3
        with:
          java-version: '17'
          distribution: 'temurin'

      - name: Run backend tests with coverage
        run: |
          cd backend
          ./mvnw clean test

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/target/site/jacoco/jacoco.xml
          flags: backend

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: |
          cd frontend
          npm ci

      - name: Run unit tests with coverage
        run: |
          cd frontend
          npm run test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./frontend/coverage/lcov.info
          flags: frontend

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up services
        run: |
          # Start PostgreSQL, backend, frontend
          docker-compose up -d

      - name: Install Playwright
        run: |
          cd frontend
          npm ci
          npx playwright install --with-deps

      - name: Run E2E tests
        run: |
          cd frontend
          npm run test:e2e

      - name: Upload Playwright report
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: frontend/playwright-report/
```

---

## Coverage Exclusions

### What NOT to Cover

The following files/patterns are typically excluded from coverage:

#### Backend
```xml
<!-- In JaCoCo configuration if needed -->
<configuration>
  <excludes>
    <exclude>**/*Config.class</exclude>
    <exclude>**/*Entity.class</exclude>
    <exclude>**/*DTO.class</exclude>
    <exclude>**/*Application.class</exclude>
    <exclude>**/migration/**</exclude>
  </excludes>
</configuration>
```

#### Frontend
```javascript
// In jest.config.ts
collectCoverageFrom: [
  'src/**/*.{js,jsx,ts,tsx}',
  '!src/**/*.d.ts',              // Type definitions
  '!src/**/*.stories.{js,jsx,ts,tsx}', // Storybook stories
  '!src/**/__tests__/**',        // Test files themselves
  '!src/**/__mocks__/**',        // Mock files
  '!src/**/types.ts',            // Type-only files
  '!src/app/layout.tsx',         // Next.js layout (minimal logic)
],
```

---

## Enforcement Strategy

### During Development

1. **Developer runs tests locally** before committing
2. **Coverage report reviewed** - identifies uncovered code
3. **Additional tests written** to meet thresholds

### During Code Review

1. **Reviewer checks coverage report** (linked in PR)
2. **Ensures coverage thresholds met** (80% backend, 70% frontend)
3. **Blocks PR if coverage drops** below thresholds

### In CI/CD

1. **Automated tests run** on every PR
2. **Coverage checked** against thresholds
3. **Build fails** if thresholds not met
4. **Coverage trends tracked** over time (Codecov, SonarQube)

---

## Troubleshooting

### Backend: JaCoCo Report Not Generating

**Problem:** No coverage report after running tests

**Solution:**
```bash
# Ensure tests are running
./mvnw clean test

# Check for report
ls -la target/site/jacoco/

# If missing, verify plugin configuration in pom.xml
```

### Frontend: Jest Not Finding Tests

**Problem:** "No tests found" error

**Solution:**
```bash
# Check test file naming
# Must be: *.test.tsx or *.spec.tsx
# Or in __tests__/ directory

# Verify jest.config.ts testMatch patterns
```

### E2E: Playwright Tests Failing

**Problem:** All E2E tests fail

**Solution:**
```bash
# Run service health check first!
bash frontend/scripts/check-services.sh

# Ensure backend is running on port 8080
# Ensure frontend is running on port 3000
```

---

## Next Steps for Frontend

**Action Required:** Set up Jest or Vitest for frontend unit testing

**Owner:** Development Team
**Priority:** P1 (High)
**Epic:** Epic 3

**Steps:**
1. Choose testing framework (Jest recommended for Next.js)
2. Install dependencies (see "Recommended Setup" above)
3. Create jest.config.ts with coverage thresholds
4. Write initial unit tests for existing components
5. Integrate into CI/CD pipeline
6. Update Definition of Done to enforce frontend coverage

---

## Resources

- **Backend Coverage:** JaCoCo reports at `backend/target/site/jacoco/index.html`
- **Definition of Done:** `docs/definition-of-done.md`
- **Epic 2 Retrospective:** `docs/retrospectives/epic-2-retrospective.md`
- **JaCoCo Documentation:** https://www.jacoco.org/jacoco/
- **Jest Documentation:** https://jestjs.io/
- **Vitest Documentation:** https://vitest.dev/
- **React Testing Library:** https://testing-library.com/react
- **Playwright Documentation:** https://playwright.dev/

---

**Remember:** Coverage is a tool, not a goal. Aim for meaningful tests that verify behavior, not just percentage points. Quality > Quantity.
