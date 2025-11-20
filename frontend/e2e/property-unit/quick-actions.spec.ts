/**
 * E2E Tests for Quick Actions
 * Tests: Quick tenant assignment, bulk status updates
 */

import { test, expect } from '@playwright/test';
import { SeedUtils } from '../../tests/utils/seed-utils';
import { AuthHelper } from '../../tests/support/helpers/auth-helper';

test.describe('Quick Actions', () => {
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

    test('should quick assign tenant to available unit → verify assignment dialog opens', async ({ page }) => {
        await page.goto('/properties');

        // Click on a property
        await page.getByTestId('property-card').first().click();

        // Navigate to units tab
        await page.getByTestId('tab-units').click();

        // Find an AVAILABLE unit
        const availableUnit = page.locator('[data-testid="unit-card"][data-status="AVAILABLE"]').first();

        // Right-click or hover to show quick actions
        await availableUnit.hover();

        // Click quick assign button
        await availableUnit.getByTestId('btn-quick-assign').click();

        // Verify assignment dialog opens
        await expect(page.getByTestId('dialog-assign-tenant')).toBeVisible();

        // Verify unit is pre-selected in dialog
        const selectedUnit = await page.getByTestId('dialog-unit-number').textContent();
        expect(selectedUnit).toBeTruthy();

        // Verify tenant dropdown is present
        await expect(page.getByTestId('select-tenant')).toBeVisible();
    });

    test('should bulk select multiple units (checkbox selection)', async ({ page }) => {
        await page.goto('/properties');

        // Click on a property
        await page.getByTestId('property-card').first().click();

        // Navigate to units tab
        await page.getByTestId('tab-units').click();

        // Switch to list view for easier checkbox selection
        await page.getByTestId('btn-view-list').click();

        // Select multiple units using checkboxes
        const unitCheckboxes = page.getByTestId('checkbox-unit');

        // Select first 5 units
        for (let i = 0; i < 5; i++) {
            await unitCheckboxes.nth(i).click();
        }

        // Verify selection count is displayed
        await expect(page.getByTestId('bulk-selection-count')).toContainText('5 units selected');

        // Verify bulk actions toolbar is visible
        await expect(page.getByTestId('toolbar-bulk-actions')).toBeVisible();
    });

    test('should bulk status update (select 5 units, change all to UNDER_MAINTENANCE) → verify all updated', async ({ page }) => {
        await page.goto('/properties');

        // Click on a property
        await page.getByTestId('property-card').first().click();

        // Navigate to units tab
        await page.getByTestId('tab-units').click();

        // Switch to list view
        await page.getByTestId('btn-view-list').click();

        // Select 5 AVAILABLE units
        const availableUnits = page.locator('[data-testid="unit-row"][data-status="AVAILABLE"]');
        const count = Math.min(await availableUnits.count(), 5);

        for (let i = 0; i < count; i++) {
            await availableUnits.nth(i).getByTestId('checkbox-unit').click();
        }

        // Click bulk status update button
        await page.getByTestId('btn-bulk-status-update').click();

        // Select UNDER_MAINTENANCE status
        await page.getByTestId('select-bulk-status').click();
        await page.getByRole('option', { name: 'UNDER_MAINTENANCE' }).click();

        // Confirm bulk action
        await page.getByTestId('btn-confirm-bulk-action').click();

        // Verify success message
        await expect(page.getByText(new RegExp(`${count} units updated successfully`, 'i'))).toBeVisible({ timeout: 5000 });

        // Verify all selected units now have UNDER_MAINTENANCE status
        for (let i = 0; i < count; i++) {
            const unit = page.locator('[data-testid="unit-row"]').nth(i);
            await expect(unit.getByTestId('badge-status')).toContainText('UNDER_MAINTENANCE');
        }
    });

    test('should verify bulk action only applies to selected units', async ({ page }) => {
        await page.goto('/properties');

        // Click on a property
        await page.getByTestId('property-card').first().click();

        // Navigate to units tab
        await page.getByTestId('tab-units').click();

        // Switch to list view
        await page.getByTestId('btn-view-list').click();

        // Get total unit count before bulk action
        const totalUnitsBefore = await page.locator('[data-testid="unit-row"]').count();

        // Select only 3 units
        const unitsToSelect = 3;
        for (let i = 0; i < unitsToSelect; i++) {
            await page.locator('[data-testid="unit-row"]').nth(i).getByTestId('checkbox-unit').click();
        }

        // Store unit numbers of selected units
        const selectedUnitNumbers: string[] = [];
        for (let i = 0; i < unitsToSelect; i++) {
            const unitNumber = await page.locator('[data-testid="unit-row"]').nth(i).getByTestId('unit-number').textContent();
            if (unitNumber) selectedUnitNumbers.push(unitNumber);
        }

        // Apply bulk status change to RESERVED
        await page.getByTestId('btn-bulk-status-update').click();
        await page.getByTestId('select-bulk-status').click();
        await page.getByRole('option', { name: 'RESERVED' }).click();
        await page.getByTestId('btn-confirm-bulk-action').click();

        // Wait for update
        await page.waitForTimeout(1000);

        // Verify total unit count unchanged
        const totalUnitsAfter = await page.locator('[data-testid="unit-row"]').count();
        expect(totalUnitsAfter).toBe(totalUnitsBefore);

        // Verify only selected units have RESERVED status
        for (const unitNumber of selectedUnitNumbers) {
            const unitRow = page.locator('[data-testid="unit-row"]', {
                has: page.getByText(unitNumber)
            });
            await expect(unitRow.getByTestId('badge-status')).toContainText('RESERVED');
        }

        // Verify at least one unit is NOT RESERVED (wasn't selected)
        const nonReservedUnits = page.locator('[data-testid="unit-row"]').filter({
            hasNot: page.locator('[data-testid="badge-status"]', { hasText: 'RESERVED' })
        });
        expect(await nonReservedUnits.count()).toBeGreaterThan(0);
    });
});
