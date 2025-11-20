/**
 * E2E Tests for Validation and Error Handling
 * Tests: Form validations, duplicate detection, constraint violations, error messages
 */

import { test, expect } from '@playwright/test';
import { SeedUtils } from '../../tests/utils/seed-utils';
import { AuthHelper } from '../../tests/support/helpers/auth-helper';

test.describe('Validation and Error Handling', () => {
    let seedUtils: SeedUtils;
    let authHelper: AuthHelper;

    test.beforeAll(async () => {
        seedUtils = new SeedUtils();
        await seedUtils.cleanup();
        await seedUtils.seedPropertyWithUnits();
    });

    test.beforeEach(async ({ page }) => {
        authHelper = new AuthHelper(page);
        await authHelper.loginAsAdmin();
    });

    test.afterAll(async () => {
        await seedUtils.cleanup();
    });

    // Property Form Validation Tests
    test('should submit empty property form → verify required field errors (name, address, type, totalUnits)', async ({ page }) => {
        await page.goto('/properties');

        // Click create property
        await page.getByTestId('btn-create-property').click();

        // Submit without filling fields
        await page.getByTestId('btn-submit-property').click();

        // Verify all required field errors
        await expect(page.getByText(/property name is required/i)).toBeVisible();
        await expect(page.getByText(/address is required/i)).toBeVisible();
        await expect(page.getByText(/property type is required/i)).toBeVisible();
        await expect(page.getByText(/total units is required/i)).toBeVisible();
    });

    test('should enter totalUnits = -5 → verify error: "Total units must be positive"', async ({ page }) => {
        await page.goto('/properties');

        await page.getByTestId('btn-create-property').click();

        // Fill form with negative total units
        await page.getByTestId('input-property-name').fill('Negative Units Test');
        await page.getByTestId('input-property-address').fill('123 Test St');
        await page.getByTestId('select-property-type').click();
        await page.getByRole('option', { name: 'RESIDENTIAL' }).click();
        await page.getByTestId('input-total-units').fill('-5');

        // Blur input to trigger validation
        await page.getByTestId('input-total-units').blur();

        // Verify error message
        await expect(page.getByText(/total units must be positive/i)).toBeVisible();

        // Verify submit button is disabled
        await expect(page.getByTestId('btn-submit-property')).toBeDisabled();
    });

    test('should enter totalUnits = 0 → verify error: "Total units must be at least 1"', async ({ page }) => {
        await page.goto('/properties');

        await page.getByTestId('btn-create-property').click();

        // Fill form with zero total units
        await page.getByTestId('input-property-name').fill('Zero Units Test');
        await page.getByTestId('input-property-address').fill('123 Test St');
        await page.getByTestId('select-property-type').click();
        await page.getByRole('option', { name: 'RESIDENTIAL' }).click();
        await page.getByTestId('input-total-units').fill('0');

        // Blur input to trigger validation
        await page.getByTestId('input-total-units').blur();

        // Verify error message
        await expect(page.getByText(/total units must be at least 1/i)).toBeVisible();
    });

    // Unit Form Validation Tests
    test('should submit empty unit form → verify required field errors (unitNumber, floor, bedrooms, bathrooms, rent)', async ({ page }) => {
        await page.goto('/properties');

        // Click on a property
        await page.getByTestId('property-card').first().click();

        // Navigate to units tab
        await page.getByTestId('tab-units').click();

        // Click add unit
        await page.getByTestId('btn-add-unit').click();

        // Submit without filling fields
        await page.getByTestId('btn-submit-unit').click();

        // Verify all required field errors
        await expect(page.getByText(/unit number is required/i)).toBeVisible();
        await expect(page.getByText(/floor is required/i)).toBeVisible();
        await expect(page.getByText(/bedrooms is required/i)).toBeVisible();
        await expect(page.getByText(/bathrooms is required/i)).toBeVisible();
        await expect(page.getByText(/rent is required/i)).toBeVisible();
    });

    test('should enter rent = -1000 → verify error: "Rent must be positive"', async ({ page }) => {
        await page.goto('/properties');

        // Click on a property
        await page.getByTestId('property-card').first().click();

        // Navigate to units tab
        await page.getByTestId('tab-units').click();

        // Click add unit
        await page.getByTestId('btn-add-unit').click();

        // Fill form with negative rent
        await page.getByTestId('input-unit-number').fill('501');
        await page.getByTestId('input-floor').fill('5');
        await page.getByTestId('input-bedrooms').fill('2');
        await page.getByTestId('input-bathrooms').fill('2');
        await page.getByTestId('input-rent').fill('-1000');

        // Blur input to trigger validation
        await page.getByTestId('input-rent').blur();

        // Verify error message
        await expect(page.getByText(/rent must be positive/i)).toBeVisible();
    });

    test('should enter bedrooms = -1 → verify error: "Bedrooms must be 0 or more"', async ({ page }) => {
        await page.goto('/properties');

        // Click on a property
        await page.getByTestId('property-card').first().click();

        // Navigate to units tab
        await page.getByTestId('tab-units').click();

        // Click add unit
        await page.getByTestId('btn-add-unit').click();

        // Fill form with negative bedrooms
        await page.getByTestId('input-unit-number').fill('502');
        await page.getByTestId('input-floor').fill('5');
        await page.getByTestId('input-bedrooms').fill('-1');

        // Blur input to trigger validation
        await page.getByTestId('input-bedrooms').blur();

        // Verify error message
        await expect(page.getByText(/bedrooms must be 0 or more/i)).toBeVisible();
    });

    // Duplicate Detection Tests
    test('should create unit with same unit number in same property → verify error: "Unit number already exists"', async ({ page }) => {
        await page.goto('/properties');

        // Click on a property
        await page.getByTestId('property-card').first().click();

        // Navigate to units tab
        await page.getByTestId('tab-units').click();

        // Get an existing unit number
        const existingUnitNumber = await page.locator('[data-testid="unit-card"]').first().getByTestId('unit-number').textContent();

        // Try to create unit with same number
        await page.getByTestId('btn-add-unit').click();
        await page.getByTestId('input-unit-number').fill(existingUnitNumber || '101');
        await page.getByTestId('input-floor').fill('1');
        await page.getByTestId('input-bedrooms').fill('2');
        await page.getByTestId('input-bathrooms').fill('2');
        await page.getByTestId('input-rent').fill('80000');

        // Submit form
        await page.getByTestId('btn-submit-unit').click();

        // Verify error message
        await expect(page.getByText(/unit number already exists/i)).toBeVisible({ timeout: 5000 });
    });

    test('should attempt delete property with occupied units → verify error: "Cannot delete property with occupied units"', async ({ page }) => {
        await page.goto('/properties');

        // Create a property with occupied units
        // First, create property
        await page.getByTestId('btn-create-property').click();
        await page.getByTestId('input-property-name').fill('Delete Constraint Test');
        await page.getByTestId('input-property-address').fill('456 Delete St');
        await page.getByTestId('select-property-type').click();
        await page.getByRole('option', { name: 'RESIDENTIAL' }).click();
        await page.getByTestId('input-total-units').fill('5');
        await page.getByTestId('btn-submit-property').click();

        // Wait for creation
        await expect(page.getByText(/property created successfully/i)).toBeVisible({ timeout: 5000 });

        // Navigate to property
        await page.getByText('Delete Constraint Test').click();

        // Add an occupied unit
        await page.getByTestId('tab-units').click();
        await page.getByTestId('btn-add-unit').click();
        await page.getByTestId('input-unit-number').fill('601');
        await page.getByTestId('input-floor').fill('6');
        await page.getByTestId('input-bedrooms').fill('2');
        await page.getByTestId('input-bathrooms').fill('2');
        await page.getByTestId('input-rent').fill('80000');
        await page.getByTestId('select-unit-status').click();
        await page.getByRole('option', { name: 'OCCUPIED' }).click();
        await page.getByTestId('btn-submit-unit').click();

        // Wait for unit creation
        await page.waitForTimeout(1000);

        // Go back to properties list
        await page.goto('/properties');

        // Try to delete property
        const propertyCard = page.locator('[data-testid="property-card"]', {
            has: page.getByText('Delete Constraint Test')
        });
        await propertyCard.click();
        await page.getByTestId('btn-delete-property').click();
        await page.getByTestId('btn-confirm-delete').click();

        // Verify error message
        await expect(page.getByText(/cannot delete property with occupied units/i)).toBeVisible({ timeout: 5000 });

        // Verify property still exists
        await page.goto('/properties');
        await expect(page.getByText('Delete Constraint Test')).toBeVisible();
    });

    test('should attempt delete occupied unit → verify error: "Cannot delete occupied unit"', async ({ page }) => {
        await page.goto('/properties');

        // Click on a property
        await page.getByTestId('property-card').first().click();

        // Navigate to units tab
        await page.getByTestId('tab-units').click();

        // Find an OCCUPIED unit
        const occupiedUnit = page.locator('[data-testid="unit-card"][data-status="OCCUPIED"]').first();

        // If no occupied units, create one
        if (await occupiedUnit.count() === 0) {
            await page.getByTestId('btn-add-unit').click();
            await page.getByTestId('input-unit-number').fill('999');
            await page.getByTestId('input-floor').fill('9');
            await page.getByTestId('input-bedrooms').fill('2');
            await page.getByTestId('input-bathrooms').fill('2');
            await page.getByTestId('input-rent').fill('80000');
            await page.getByTestId('select-unit-status').click();
            await page.getByRole('option', { name: 'OCCUPIED' }).click();
            await page.getByTestId('btn-submit-unit').click();
            await page.waitForTimeout(1000);
        }

        // Try to delete occupied unit
        await occupiedUnit.first().click();
        await page.getByTestId('btn-delete-unit').click();
        await page.getByTestId('btn-confirm-delete').click();

        // Verify error message
        await expect(page.getByText(/cannot delete occupied unit/i)).toBeVisible({ timeout: 5000 });

        // Verify unit still exists
        await expect(occupiedUnit.first()).toBeVisible();
    });

    // Constraint Violation Tests
    test('should enter property name > 200 characters → verify error: "Name must be 200 characters or less"', async ({ page }) => {
        await page.goto('/properties');

        await page.getByTestId('btn-create-property').click();

        // Create a string longer than 200 characters
        const longName = 'A'.repeat(201);
        await page.getByTestId('input-property-name').fill(longName);
        await page.getByTestId('input-property-name').blur();

        // Verify error message
        await expect(page.getByText(/name must be 200 characters or less/i)).toBeVisible();
    });

    test('should enter unit number > 50 characters → verify error: "Unit number must be 50 characters or less"', async ({ page }) => {
        await page.goto('/properties');

        // Click on a property
        await page.getByTestId('property-card').first().click();

        // Navigate to units tab
        await page.getByTestId('tab-units').click();

        // Click add unit
        await page.getByTestId('btn-add-unit').click();

        // Create a string longer than 50 characters
        const longUnitNumber = 'U'.repeat(51);
        await page.getByTestId('input-unit-number').fill(longUnitNumber);
        await page.getByTestId('input-unit-number').blur();

        // Verify error message
        await expect(page.getByText(/unit number must be 50 characters or less/i)).toBeVisible();
    });

    // Error Message Accessibility Tests
    test('should verify all error messages are visible and accessible (WCAG 2.1 AA compliant)', async ({ page }) => {
        await page.goto('/properties');

        await page.getByTestId('btn-create-property').click();

        // Trigger multiple validation errors
        await page.getByTestId('btn-submit-property').click();

        // Get all error messages
        const errorMessages = page.getByRole('alert');
        const count = await errorMessages.count();

        // Verify at least 4 error messages (for required fields)
        expect(count).toBeGreaterThanOrEqual(4);

        // Verify each error has proper ARIA attributes
        for (let i = 0; i < count; i++) {
            const error = errorMessages.nth(i);

            // Verify visible
            await expect(error).toBeVisible();

            // Verify has role="alert" or aria-live="polite"
            const role = await error.getAttribute('role');
            const ariaLive = await error.getAttribute('aria-live');

            expect(role === 'alert' || ariaLive === 'polite' || ariaLive === 'assertive').toBeTruthy();
        }
    });
});
