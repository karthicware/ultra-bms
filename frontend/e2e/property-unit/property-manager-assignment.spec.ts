/**
 * E2E Tests for Property Manager Assignment
 * Tests: Manager assignment, filtering by manager, reassignment
 */

import { test, expect } from '@playwright/test';
import { SeedUtils } from '../../tests/utils/seed-utils';
import { AuthHelper } from '../../tests/support/helpers/auth-helper';

test.describe('Property Manager Assignment', () => {
    let seedUtils: SeedUtils;
    let authHelper: AuthHelper;

    test.beforeAll(async () => {
        seedUtils = new SeedUtils();
        await seedUtils.cleanup();
        await seedUtils.seedPropertyManagers(); // Seed property managers
    });

    test.beforeEach(async ({ page }) => {
        authHelper = new AuthHelper(page);
        await authHelper.loginAsAdmin();
    });

    test.afterAll(async () => {
        await seedUtils.cleanup();
    });

    test('should assign property to property manager → verify manager dropdown populated with PROPERTY_MANAGER role users', async ({ page }) => {
        await page.goto('/properties');

        // Create a new property
        await page.getByTestId('btn-create-property').click();
        await page.getByTestId('input-property-name').fill('Manager Assignment Test Property');
        await page.getByTestId('input-property-address').fill('123 Manager St');
        await page.getByTestId('select-property-type').click();
        await page.getByRole('option', { name: 'RESIDENTIAL' }).click();
        await page.getByTestId('input-total-units').fill('10');

        // Open property manager dropdown
        await page.getByTestId('select-property-manager').click();

        // Verify dropdown contains only PROPERTY_MANAGER role users
        const managerOptions = page.getByRole('option', { name: /Property Manager/i });
        const count = await managerOptions.count();

        // Verify at least one property manager exists
        expect(count).toBeGreaterThanOrEqual(1);

        // Select first property manager
        await managerOptions.first().click();

        // Submit form
        await page.getByTestId('btn-submit-property').click();

        // Verify success
        await expect(page.getByText(/property created successfully/i)).toBeVisible({ timeout: 5000 });

        // Verify manager is assigned
        const propertyCard = page.locator('[data-testid="property-card"]', {
            has: page.getByText('Manager Assignment Test Property')
        });
        await expect(propertyCard.getByTestId('property-manager-name')).toBeVisible();
    });

    test('should filter properties by assigned manager → verify only properties assigned to that manager shown', async ({ page }) => {
        await page.goto('/properties');

        // Open manager filter dropdown
        await page.getByTestId('select-filter-manager').click();

        // Get first manager option
        const firstManager = page.getByRole('option').first();
        const managerName = await firstManager.textContent();
        await firstManager.click();

        // Wait for filter to apply
        await page.waitForTimeout(500);

        // Get all visible property cards
        const propertyCards = page.locator('[data-testid="property-card"]');
        const count = await propertyCards.count();

        // Verify each property is assigned to the selected manager
        for (let i = 0; i < count; i++) {
            const card = propertyCards.nth(i);
            const assignedManager = await card.getByTestId('property-manager-name').textContent();

            expect(assignedManager).toBe(managerName);
        }
    });

    test('should reassign property to different manager → verify update reflected in list', async ({ page }) => {
        await page.goto('/properties');

        // Click on a property
        await page.getByTestId('property-card').first().click();

        // Click edit button
        await page.getByTestId('btn-edit-property').click();

        // Change property manager
        await page.getByTestId('select-property-manager').click();

        // Select a different manager
        const managerOptions = page.getByRole('option');
        await managerOptions.nth(1).click(); // Select second manager

        const newManagerName = await managerOptions.nth(1).textContent();

        // Save changes
        await page.getByTestId('btn-save-property').click();

        // Verify success
        await expect(page.getByText(/property updated successfully/i)).toBeVisible({ timeout: 5000 });

        // Verify new manager is displayed
        await expect(page.getByText(newManagerName || '')).toBeVisible();

        // Go back to properties list
        await page.goto('/properties');

        // Verify property shows new manager in list
        const propertyCard = page.getByTestId('property-card').first();
        await expect(propertyCard.getByTestId('property-manager-name')).toContainText(newManagerName || '');
    });

    test('should verify only users with PROPERTY_MANAGER role appear in dropdown', async ({ page }) => {
        await page.goto('/properties');

        // Create or edit property
        await page.getByTestId('btn-create-property').click();

        // Open property manager dropdown
        await page.getByTestId('select-property-manager').click();

        // Get all options
        const managerOptions = page.getByRole('option');
        const count = await managerOptions.count();

        // Verify each option has "Property Manager" in the text or role attribute
        for (let i = 0; i < count; i++) {
            const option = managerOptions.nth(i);
            const optionText = await option.textContent();

            // Verify option text contains role indicator or specific naming pattern
            expect(optionText).toMatch(/Property Manager|PM-/i);
        }
    });
});
