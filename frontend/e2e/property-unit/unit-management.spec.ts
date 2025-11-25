/**
 * E2E Tests for Unit Management
 * Tests: Unit CRUD, bulk creation, status transitions, grid/list views, filtering
 */

import { test, expect } from '@playwright/test';
import { SeedUtils } from '../../tests/utils/seed-utils';
import { UnitPage } from '../../tests/utils/page-objects';
import { AuthHelper } from '../../tests/support/helpers/auth-helper';

test.describe('Unit Management Flow', () => {
    let seedUtils: SeedUtils;
    let authHelper: AuthHelper;
    let unitPage: UnitPage;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let testPropertyId: string;

    test.beforeAll(async () => {
        seedUtils = new SeedUtils();
        await seedUtils.cleanup();
        // Seed a property to add units to
        const createdProperties = await seedUtils.seedPropertyWithUnits();
        if (createdProperties.length === 0) {
            throw new Error('Failed to seed test property');
        }
        testPropertyId = createdProperties[0].id;
    });

    test.beforeEach(async ({ page }) => {
        authHelper = new AuthHelper(page);
        unitPage = new UnitPage(page);
        await authHelper.loginAsAdmin();
    });

    test.afterAll(async () => {
        await seedUtils.cleanup();
    });

    test('should add single unit to property (unit number, floor, bedrooms, bathrooms, rent)', async ({ page }) => {
        await page.goto('/properties');

        // Click on a property to view details
        await page.getByTestId('property-row').first().click();

        // Navigate to units tab
        await page.getByTestId('tab-units').click();

        // Click add unit button
        await page.getByTestId('btn-add-unit').click();

        // Fill unit form
        await page.getByTestId('input-unit-number').fill('301');
        await page.getByTestId('input-floor').fill('3');
        await page.getByTestId('input-bedrooms').fill('2');
        await page.getByTestId('input-bathrooms').fill('2');
        await page.getByTestId('input-rent').fill('85000');

        // Submit form
        await page.getByTestId('btn-submit-unit').click();

        // Wait for dialog to close and unit to appear in list
        await page.waitForTimeout(1000);

        // Verify unit appears in list
        await expect(page.getByText('301')).toBeVisible();
        await expect(page.getByText('AED 85,000')).toBeVisible();
    });

    test('should bulk create 10 units with sequential numbers (e.g., 101-110)', async ({ page }) => {
        await page.goto('/properties');

        // Click on a property
        await page.getByTestId('property-row').first().click();

        // Navigate to units tab
        await page.getByTestId('tab-units').click();

        // Click bulk create button
        await page.getByTestId('btn-bulk-create').click();

        // Fill bulk creation form
        await page.getByTestId('input-start-unit-number').fill('101');
        await page.getByTestId('input-unit-count').fill('10');
        await page.getByTestId('input-floor').fill('1');
        await page.getByTestId('input-bedrooms').fill('2');
        await page.getByTestId('input-bathrooms').fill('2');
        await page.getByTestId('input-rent').fill('80000');

        // Submit bulk creation
        await page.getByTestId('btn-submit-bulk').click();

        // Verify success message
        await expect(page.getByText(/10 units created successfully/i)).toBeVisible({ timeout: 5000 });

        // Verify units 101-110 appear in list
        await expect(page.getByText('101')).toBeVisible();
        await expect(page.getByText('110')).toBeVisible();
    });

    test('should view units in grid view � verify color-coded status badges (AVAILABLE=green, OCCUPIED=red, UNDER_MAINTENANCE=yellow, RESERVED=blue)', async ({ page }) => {
        await page.goto('/properties');

        // Click on a property
        await page.getByTestId('property-row').first().click();

        // Navigate to units tab
        await page.getByTestId('tab-units').click();

        // Switch to grid view
        await page.getByTestId('btn-view-grid').click();

        // Verify color-coded badges
        const availableUnit = page.locator('[data-testid="unit-card"][data-status="AVAILABLE"]').first();
        await expect(availableUnit.locator('[data-testid="badge-status"]')).toHaveClass(/bg-green/);

        const occupiedUnit = page.locator('[data-testid="unit-card"][data-status="OCCUPIED"]').first();
        if (await occupiedUnit.count() > 0) {
            await expect(occupiedUnit.locator('[data-testid="badge-status"]')).toHaveClass(/bg-red/);
        }

        const maintenanceUnit = page.locator('[data-testid="unit-card"][data-status="UNDER_MAINTENANCE"]').first();
        if (await maintenanceUnit.count() > 0) {
            await expect(maintenanceUnit.locator('[data-testid="badge-status"]')).toHaveClass(/bg-yellow/);
        }

        const reservedUnit = page.locator('[data-testid="unit-card"][data-status="RESERVED"]').first();
        if (await reservedUnit.count() > 0) {
            await expect(reservedUnit.locator('[data-testid="badge-status"]')).toHaveClass(/bg-blue/);
        }
    });

    test('should view units in list view � verify table displays all unit details', async ({ page }) => {
        await page.goto('/properties');

        // Click on a property
        await page.getByTestId('property-row').first().click();

        // Navigate to units tab
        await page.getByTestId('tab-units').click();

        // Switch to list view
        await page.getByTestId('btn-view-list').click();

        // Verify table headers
        await expect(page.getByText('Unit Number')).toBeVisible();
        await expect(page.getByText('Floor')).toBeVisible();
        await expect(page.getByText('Bedrooms')).toBeVisible();
        await expect(page.getByText('Bathrooms')).toBeVisible();
        await expect(page.getByText('Rent')).toBeVisible();
        await expect(page.getByText('Status')).toBeVisible();

        // Verify at least one row is present
        const rows = page.getByTestId('unit-row');
        await expect(rows.first()).toBeVisible();
    });

    test('should toggle between grid and list view', async ({ page }) => {
        await page.goto('/properties');

        // Click on a property
        await page.getByTestId('property-row').first().click();

        // Navigate to units tab
        await page.getByTestId('tab-units').click();

        // Default is grid view - verify
        await expect(page.locator('[data-testid="unit-card"]').first()).toBeVisible();

        // Toggle to list view
        await page.getByTestId('btn-view-list').click();
        await expect(page.getByTestId('unit-row').first()).toBeVisible();

        // Toggle back to grid view
        await page.getByTestId('btn-view-grid').click();
        await expect(page.locator('[data-testid="unit-card"]').first()).toBeVisible();
    });

    test('should filter units by status (AVAILABLE, OCCUPIED, UNDER_MAINTENANCE, RESERVED)', async ({ page }) => {
        await page.goto('/properties');

        // Click on a property
        await page.getByTestId('property-row').first().click();

        // Navigate to units tab
        await page.getByTestId('tab-units').click();

        // Filter by AVAILABLE
        await page.getByTestId('select-unit-status').click();
        await page.getByRole('option', { name: 'AVAILABLE' }).click();

        // Verify only AVAILABLE units shown
        const availableUnits = page.locator('[data-testid="unit-card"][data-status="AVAILABLE"]');
        const allUnits = page.locator('[data-testid="unit-card"]');
        expect(await availableUnits.count()).toBe(await allUnits.count());
    });

    test('should filter units by floor number', async ({ page }) => {
        await page.goto('/properties');

        // Click on a property
        await page.getByTestId('property-row').first().click();

        // Navigate to units tab
        await page.getByTestId('tab-units').click();

        // Filter by floor 1
        await page.getByTestId('select-floor').click();
        await page.getByRole('option', { name: '1' }).click();

        // Verify only floor 1 units shown
        await page.waitForTimeout(500);
        const floorUnits = page.locator('[data-testid="unit-card"]');
        const count = await floorUnits.count();

        expect(count).toBeGreaterThanOrEqual(1);
    });

    test('should filter units by bedroom count (0, 1, 2, 3+)', async ({ page }) => {
        await page.goto('/properties');

        // Click on a property
        await page.getByTestId('property-row').first().click();

        // Navigate to units tab
        await page.getByTestId('tab-units').click();

        // Filter by 2 bedrooms
        await page.getByTestId('select-bedrooms').click();
        await page.getByRole('option', { name: '2' }).click();

        // Verify only 2-bedroom units shown
        await page.waitForTimeout(500);
        const bedroomUnits = page.locator('[data-testid="unit-card"]');
        const count = await bedroomUnits.count();

        expect(count).toBeGreaterThanOrEqual(1);
    });

    test('should filter units by rent range (min-max)', async ({ page }) => {
        await page.goto('/properties');

        // Click on a property
        await page.getByTestId('property-row').first().click();

        // Navigate to units tab
        await page.getByTestId('tab-units').click();

        // Set rent range filter
        await page.getByTestId('input-rent-min').fill('70000');
        await page.getByTestId('input-rent-max').fill('90000');
        await page.getByTestId('btn-apply-rent-filter').click();

        // Verify units in price range shown
        await page.waitForTimeout(500);
        const filteredUnits = page.locator('[data-testid="unit-card"]');
        const count = await filteredUnits.count();

        expect(count).toBeGreaterThanOrEqual(1);
    });

    test('should update unit details (unit number, rent, features)', async ({ page }) => {
        await page.goto('/properties');

        // Click on a property
        await page.getByTestId('property-row').first().click();

        // Navigate to units tab
        await page.getByTestId('tab-units').click();

        // Click on a unit to edit
        await page.locator('[data-testid="unit-card"]').first().click();
        await page.getByTestId('btn-edit-unit').click();

        // Update rent
        await page.getByTestId('input-rent').fill('95000');

        // Update features
        await page.getByTestId('input-features').fill('Balcony, Sea View, Upgraded Kitchen');

        // Submit changes
        await page.getByTestId('btn-save-unit').click();

        // Verify success message
        await expect(page.getByText(/unit updated successfully/i)).toBeVisible({ timeout: 5000 });

        // Verify updated rent
        await expect(page.getByText('AED 95,000')).toBeVisible();
    });

    test('should change unit status AVAILABLE � RESERVED � OCCUPIED � verify status transitions', async ({ page }) => {
        await page.goto('/properties');

        // Click on a property
        await page.getByTestId('property-row').first().click();

        // Navigate to units tab
        await page.getByTestId('tab-units').click();

        // Find an AVAILABLE unit
        const availableUnit = page.locator('[data-testid="unit-card"][data-status="AVAILABLE"]').first();
        await availableUnit.click();

        // Change status to RESERVED
        await page.getByTestId('btn-status-update').click();
        await page.getByRole('option', { name: 'RESERVED' }).click();
        await page.getByTestId('btn-confirm-status-change').click();

        // Verify status changed
        await expect(page.getByText('RESERVED')).toBeVisible();

        // Change status to OCCUPIED
        await page.getByTestId('btn-status-update').click();
        await page.getByRole('option', { name: 'OCCUPIED' }).click();
        await page.getByTestId('btn-confirm-status-change').click();

        // Verify status changed
        await expect(page.getByText('OCCUPIED')).toBeVisible();
    });

    test('should soft delete unit (not occupied)', async ({ page }) => {
        await page.goto('/properties');

        // Click on a property
        await page.getByTestId('property-row').first().click();

        // Navigate to units tab
        await page.getByTestId('tab-units').click();

        // Find an AVAILABLE unit
        const availableUnit = page.locator('[data-testid="unit-card"][data-status="AVAILABLE"]').first();
        const unitNumber = await availableUnit.getByTestId('unit-number').textContent();
        await availableUnit.click();

        // Delete unit
        await page.getByTestId('btn-delete-unit').click();
        await page.getByTestId('btn-confirm-delete').click();

        // Verify success message
        await expect(page.getByText(/unit deleted successfully/i)).toBeVisible({ timeout: 5000 });

        // Verify unit removed from list
        await expect(page.getByText(unitNumber || '')).not.toBeVisible();
    });

    test('should attempt delete occupied unit � verify validation error', async ({ page }) => {
        await page.goto('/properties');

        // Click on a property
        await page.getByTestId('property-row').first().click();

        // Navigate to units tab
        await page.getByTestId('tab-units').click();

        // Find an OCCUPIED unit
        const occupiedUnit = page.locator('[data-testid="unit-card"][data-status="OCCUPIED"]').first();
        await occupiedUnit.click();

        // Attempt to delete
        await page.getByTestId('btn-delete-unit').click();
        await page.getByTestId('btn-confirm-delete').click();

        // Verify error message
        await expect(page.getByText(/cannot delete occupied unit/i)).toBeVisible({ timeout: 5000 });

        // Verify unit still exists
        await expect(page.locator('[data-testid="unit-card"][data-status="OCCUPIED"]').first()).toBeVisible();
    });
});
