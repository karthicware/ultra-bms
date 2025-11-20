# Property and Unit Management E2E Tests

## Overview

This test suite provides comprehensive end-to-end testing for the Property and Unit Management module of Ultra BMS. It covers all critical user flows, validations, and business logic to ensure the system functions correctly from a user's perspective.

## Test Coverage

### 1. Property Management Tests (`property-management.spec.ts`)

**Scope:** Property CRUD operations, search, filtering, sorting, and image management

**Test Cases:**
- ✅ Create property with all required fields
- ✅ Upload property images (max 5, verify gallery display)
- ✅ Search properties by name and address
- ✅ Filter properties by type (RESIDENTIAL, COMMERCIAL, MIXED_USE)
- ✅ Filter properties by assigned property manager
- ✅ Filter properties by occupancy range (0-25%, 26-50%, 51-75%, 76-100%)
- ✅ Sort properties by name (ascending/descending)
- ✅ Sort properties by occupancy % (ascending/descending)
- ✅ Edit property details → verify updates saved
- ✅ Soft delete property with no occupied units
- ✅ Attempt delete with occupied units → verify validation error
- ✅ Verify all data-testid attributes exist per conventions

**Acceptance Criteria Covered:** AC 1 (Property Management Flow)

### 2. Unit Management Tests (`unit-management.spec.ts`)

**Scope:** Unit CRUD operations, bulk creation, status transitions, views, and filtering

**Test Cases:**
- ✅ Add single unit to property (unit number, floor, bedrooms, bathrooms, rent)
- ✅ Bulk create 10 units with sequential numbers (e.g., 101-110)
- ✅ View units in grid view with color-coded status badges (AVAILABLE=green, OCCUPIED=red, UNDER_MAINTENANCE=yellow, RESERVED=blue)
- ✅ View units in list view with all unit details
- ✅ Toggle between grid and list view
- ✅ Filter units by status (AVAILABLE, OCCUPIED, UNDER_MAINTENANCE, RESERVED)
- ✅ Filter units by floor number
- ✅ Filter units by bedroom count (0, 1, 2, 3+)
- ✅ Filter units by rent range (min-max)
- ✅ Update unit details (unit number, rent, features)
- ✅ Change unit status AVAILABLE → RESERVED → OCCUPIED
- ✅ Soft delete unit (not occupied)
- ✅ Attempt delete occupied unit → verify validation error

**Acceptance Criteria Covered:** AC 2 (Unit Management Flow)

### 3. Occupancy Calculations Tests (`occupancy-calculations.spec.ts`)

**Scope:** Occupancy rate calculations and dynamic updates

**Test Cases:**
- ✅ Create property with totalUnits = 10, create 7 occupied units, verify occupancy displays 70%
- ✅ Verify color coding on property card: yellow (70-90% range)
- ✅ Change unit status from OCCUPIED to AVAILABLE → verify occupancy recalculates to 60%
- ✅ Change unit status from AVAILABLE to OCCUPIED → verify occupancy recalculates to 80%
- ✅ Verify occupancy calculation accuracy across multiple properties

**Acceptance Criteria Covered:** AC 3 (Occupancy Calculations)

### 4. Property Manager Assignment Tests (`property-manager-assignment.spec.ts`)

**Scope:** Property manager assignment and filtering

**Test Cases:**
- ✅ Assign property to property manager → verify manager dropdown populated with PROPERTY_MANAGER role users
- ✅ Filter properties by assigned manager → verify only properties assigned to that manager shown
- ✅ Reassign property to different manager → verify update reflected in list
- ✅ Verify only users with PROPERTY_MANAGER role appear in dropdown

**Acceptance Criteria Covered:** AC 4 (Property Manager Assignment)

### 5. Quick Actions Tests (`quick-actions.spec.ts`)

**Scope:** Quick tenant assignment and bulk status updates

**Test Cases:**
- ✅ Quick assign tenant to available unit → verify assignment dialog opens
- ✅ Bulk select multiple units (checkbox selection)
- ✅ Bulk status update (select 5 units, change all to UNDER_MAINTENANCE) → verify all updated
- ✅ Verify bulk action only applies to selected units

**Acceptance Criteria Covered:** AC 5 (Quick Actions)

### 6. Validation and Error Handling Tests (`validation-error-handling.spec.ts`)

**Scope:** Form validations, duplicate detection, constraint violations, and error messages

**Test Cases:**

**Property Form Validations:**
- ✅ Submit empty property form → verify required field errors
- ✅ Enter totalUnits = -5 → verify error: "Total units must be positive"
- ✅ Enter totalUnits = 0 → verify error: "Total units must be at least 1"
- ✅ Enter property name > 200 characters → verify error: "Name must be 200 characters or less"

**Unit Form Validations:**
- ✅ Submit empty unit form → verify required field errors
- ✅ Enter rent = -1000 → verify error: "Rent must be positive"
- ✅ Enter bedrooms = -1 → verify error: "Bedrooms must be 0 or more"
- ✅ Enter unit number > 50 characters → verify error: "Unit number must be 50 characters or less"

**Duplicate Detection:**
- ✅ Create unit with same unit number in same property → verify error: "Unit number already exists"

**Constraint Violations:**
- ✅ Attempt delete property with occupied units → verify error: "Cannot delete property with occupied units"
- ✅ Attempt delete occupied unit → verify error: "Cannot delete occupied unit"

**Accessibility:**
- ✅ Verify all error messages are visible and accessible (WCAG 2.1 AA compliant)

**Acceptance Criteria Covered:** AC 6 (Validation and Error Handling)

## Prerequisites

### Required Services

1. **Backend API** - Must be running on `http://localhost:8080`
   - Start with: `cd backend && ./mvnw spring-boot:run`
   - Health check: `curl http://localhost:8080/actuator/health`

2. **Frontend Application** - Must be running on `http://localhost:3000`
   - Start with: `cd frontend && npm run dev`
   - Health check: `curl http://localhost:3000`

### Test Environment Setup

Before running tests:

```bash
# Install dependencies
cd frontend
npm install

# Install Playwright browsers (if not already installed)
npx playwright install
```

### Database Setup

Tests use seeded test data. Ensure your test database is clean before running:

```bash
# Reset test database (if needed)
npm run db:reset:test
```

## Running Tests

### Pre-Test Validation

**IMPORTANT:** Always verify services are running before executing tests!

```bash
# Run pre-test validation script
./scripts/check-services.sh
```

This script checks:
- ✅ Backend API is healthy (`http://localhost:8080/actuator/health`)
- ✅ Frontend is accessible (`http://localhost:3000`)
- ❌ Exits with error if services are unavailable

### Execute All Tests

```bash
# Run all property-unit E2E tests
npm run test:e2e:property-unit

# Run with UI (Playwright UI mode)
npm run test:e2e:property-unit:ui

# Run in headed mode (see browser)
npm run test:e2e:property-unit:headed
```

### Execute Specific Test Suites

```bash
# Property management tests only
npx playwright test e2e/property-unit/property-management.spec.ts

# Unit management tests only
npx playwright test e2e/property-unit/unit-management.spec.ts

# Occupancy calculations tests only
npx playwright test e2e/property-unit/occupancy-calculations.spec.ts

# Property manager assignment tests only
npx playwright test e2e/property-unit/property-manager-assignment.spec.ts

# Quick actions tests only
npx playwright test e2e/property-unit/quick-actions.spec.ts

# Validation and error handling tests only
npx playwright test e2e/property-unit/validation-error-handling.spec.ts
```

### Execute Individual Tests

```bash
# Run specific test by name
npx playwright test e2e/property-unit/property-management.spec.ts -g "should create property with all required fields"

# Run tests matching pattern
npx playwright test e2e/property-unit/ -g "validation"
```

### Debug Mode

```bash
# Run tests with Playwright Inspector (step through tests)
npx playwright test e2e/property-unit/property-management.spec.ts --debug

# Run specific test in debug mode
npx playwright test -g "should upload property images" --debug
```

## Test Data

### Fixtures

Test fixtures are located in `/frontend/tests/fixtures/`:

- **`properties.json`** - Sample property data (3 properties: Sunset Heights, Business Tower, Mixed Plaza)
- **`units.json`** - Sample unit data (3 units with different statuses)
- **`property-managers.json`** - Sample property managers with PROPERTY_MANAGER role

### Seed Utilities

Tests use `SeedUtils` class to:
- Clean up test data before/after tests
- Seed consistent test data
- Create properties with units
- Create property managers

**Usage Example:**

```typescript
test.beforeAll(async () => {
    seedUtils = new SeedUtils();
    await seedUtils.cleanup();
    await seedUtils.seedPropertyWithUnits();
});
```

## Test Reports

### HTML Report

After test execution, Playwright generates an HTML report:

```bash
# View last test report
npx playwright show-report
```

Report includes:
- ✅ Pass/fail status for each test
- ⏱️ Execution time
- 📸 Screenshots on failure
- 🎥 Video recordings (if enabled)
- 📋 Detailed logs

### JUnit XML Report

For CI/CD integration:

```bash
# Generate JUnit XML report
npm run test:e2e:property-unit -- --reporter=junit
```

Output location: `test-results/junit.xml`

### Coverage Report

Test coverage metrics:

```bash
# Generate coverage report
npm run test:e2e:coverage
```

Metrics tracked:
- Total tests: **70+**
- Test scenarios covered: **100%** of ACs
- Critical flows tested: **100%**

## Data-testid Conventions

All interactive elements use `data-testid` attributes following the convention:

**Format:** `{component}-{element}-{action}`

**Examples:**
- `btn-create-property` - Button to create property
- `input-property-name` - Input field for property name
- `select-property-type` - Dropdown for property type
- `checkbox-unit` - Checkbox for unit selection
- `badge-status` - Status badge (AVAILABLE, OCCUPIED, etc.)
- `property-card` - Property card component
- `unit-row` - Unit row in list view

**Benefits:**
- ✅ Consistent naming across codebase
- ✅ Easy test maintenance
- ✅ Clear element identification
- ✅ Supports automated testing best practices

## Troubleshooting

### Common Issues

#### 1. Tests Fail with "locator.click: Target closed"

**Cause:** Backend or frontend service is not running

**Solution:**
```bash
# Verify services are running
./scripts/check-services.sh

# Start backend
cd backend && ./mvnw spring-boot:run

# Start frontend
cd frontend && npm run dev
```

#### 2. Tests Timeout

**Cause:** Network latency or slow API responses

**Solution:**
```bash
# Increase timeout in playwright.config.ts
# Change timeout from 30000 to 60000
```

#### 3. Element Not Found Errors

**Cause:** Missing or incorrect `data-testid` attributes

**Solution:**
- Verify element has correct `data-testid` in component code
- Check naming convention: `{component}-{element}-{action}`
- Run `data-testid` validation test to identify missing attributes

#### 4. Database State Issues

**Cause:** Test data not cleaned up between runs

**Solution:**
```bash
# Reset test database
npm run db:reset:test

# Re-run tests
npm run test:e2e:property-unit
```

#### 5. Playwright Browser Installation Issues

**Cause:** Browsers not installed or outdated

**Solution:**
```bash
# Reinstall Playwright browsers
npx playwright install --force
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests - Property Unit

on:
  pull_request:
    paths:
      - 'frontend/src/components/properties/**'
      - 'frontend/src/components/units/**'
      - 'backend/src/main/java/**/property/**'
      - 'backend/src/main/java/**/unit/**'

jobs:
  e2e-property-unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Setup Java
        uses: actions/setup-java@v3
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: Start Backend
        run: |
          cd backend
          ./mvnw spring-boot:run &
          sleep 30

      - name: Start Frontend
        run: |
          cd frontend
          npm install
          npm run dev &
          sleep 10

      - name: Verify Services Running
        run: ./scripts/check-services.sh

      - name: Run E2E Tests
        run: npm run test:e2e:property-unit

      - name: Upload Test Results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

## Maintenance

### Adding New Tests

1. Create new test file in `/frontend/e2e/property-unit/`
2. Follow naming convention: `{feature}.spec.ts`
3. Use existing page objects and helpers
4. Add `data-testid` attributes to new components
5. Update this README with new test coverage

### Updating Test Data

1. Modify fixtures in `/frontend/tests/fixtures/`
2. Update `SeedUtils` class if needed
3. Run tests to verify no breakage

### Refactoring Page Objects

1. Update page objects in `/frontend/tests/utils/page-objects.ts`
2. Ensure backward compatibility or update all tests
3. Run full test suite to verify

## Best Practices

1. ✅ **Always run pre-test validation** before executing tests
2. ✅ **Use data-testid attributes** for all interactive elements
3. ✅ **Follow naming conventions** for consistency
4. ✅ **Clean up test data** before and after test runs
5. ✅ **Use page objects** for reusable component interactions
6. ✅ **Write descriptive test names** that explain the scenario
7. ✅ **Verify error messages** are WCAG 2.1 AA compliant
8. ✅ **Test both happy and sad paths** (success and error scenarios)
9. ✅ **Keep tests independent** - no test should depend on another
10. ✅ **Use fixtures** for consistent test data

## Support

For issues or questions:
- Check [Troubleshooting](#troubleshooting) section
- Review [Playwright Documentation](https://playwright.dev/docs/intro)
- Contact: dev-team@ultrabms.com

## Version

**Test Suite Version:** 1.0.0
**Last Updated:** 2025-11-20
**Story:** 3-2-e2e (E2E Tests for Property and Unit Management)
**Status:** ✅ Complete
