/**
 * E2E Tests for Occupancy Calculations
 * Tests: Occupancy rate calculation, color coding, dynamic recalculation
 */

import { test, expect } from '@playwright/test';
import { SeedUtils } from '../../tests/utils/seed-utils';
import { AuthHelper } from '../../tests/support/helpers/auth-helper';

test.describe('Occupancy Calculations', () => {
    let seedUtils: SeedUtils;
    let authHelper: AuthHelper;

    test.beforeAll(async () => {
        seedUtils = new SeedUtils();
        await seedUtils.cleanup();
    });

    test.beforeEach(async ({ page }) => {
        authHelper = new AuthHelper(page);
        await authHelper.loginAsAdmin();
    });

    test.afterAll(async () => {
        await seedUtils.cleanup();
    });

    test('should create property with totalUnits = 10, create 7 occupied units, verify occupancy displays 70%', async ({ page }) => {
        await page.goto('/properties');

        // Create property with 10 total units
        await page.getByTestId('btn-create-property').click();

        // Wait for navigation to create page
        await page.waitForURL('**/properties/create', { timeout: 5000 });

        // Wait for form to be ready (managers loading to complete)
        await page.waitForTimeout(1000);

        await page.getByTestId('input-property-name').fill('Occupancy Test Property');
        await page.getByTestId('input-property-address').fill('Occupancy Test Address');
        await page.getByTestId('select-property-type').click();
        await page.getByRole('option', { name: 'RESIDENTIAL' }).click();
        await page.getByTestId('input-total-units').fill('10');
        await page.getByTestId('btn-submit-property').click();

        // Wait for redirect to property details page after creation
        await page.waitForURL(/\/properties\/[a-f0-9-]+$/, { timeout: 10000 });

        // Navigate to units tab
        await page.getByTestId('tab-units').click();

        // Create 7 occupied units using bulk creation
        await page.getByTestId('btn-bulk-create').click();
        await page.getByTestId('input-start-unit-number').fill('401');
        await page.getByTestId('input-unit-count').fill('7');
        await page.getByTestId('input-floor').fill('4');
        await page.getByTestId('input-bedrooms').fill('2');
        await page.getByTestId('input-bathrooms').fill('2');
        await page.getByTestId('input-rent').fill('80000');

        // Set status to OCCUPIED
        await page.getByTestId('select-bulk-status').click();
        await page.getByRole('option', { name: 'OCCUPIED' }).click();
        await page.getByTestId('btn-submit-bulk').click();

        // Create 3 available units
        await page.getByTestId('btn-bulk-create').click();
        await page.getByTestId('input-start-unit-number').fill('408');
        await page.getByTestId('input-unit-count').fill('3');
        await page.getByTestId('input-floor').fill('4');
        await page.getByTestId('input-bedrooms').fill('2');
        await page.getByTestId('input-bathrooms').fill('2');
        await page.getByTestId('input-rent').fill('80000');

        // Leave status as AVAILABLE (default)
        await page.getByTestId('btn-submit-bulk').click();

        // Go back to properties list
        await page.goto('/properties');

        // Verify occupancy rate displays 70% on property card
        const propertyCard = page.locator('[data-testid="property-card"]', {
            has: page.getByText('Occupancy Test Property')
        });
        await expect(propertyCard.getByTestId('property-occupancy')).toContainText('70%');
    });

    test('should verify color coding on property card: yellow (70-90% range)', async ({ page }) => {
        await page.goto('/properties');

        // Find property with 70% occupancy (from previous test)
        const propertyCard = page.locator('[data-testid="property-card"]', {
            has: page.getByText('Occupancy Test Property')
        });

        // Verify occupancy badge color is yellow (70-90% range)
        const occupancyBadge = propertyCard.getByTestId('badge-occupancy');
        await expect(occupancyBadge).toHaveClass(/bg-yellow/);
    });

    test('should change unit status from OCCUPIED to AVAILABLE → verify occupancy recalculates to 60%', async ({ page }) => {
        await page.goto('/properties');

        // Click on Occupancy Test Property
        await page.getByText('Occupancy Test Property').click();

        // Navigate to units tab
        await page.getByTestId('tab-units').click();

        // Find an OCCUPIED unit and change status to AVAILABLE
        const occupiedUnit = page.locator('[data-testid="unit-card"][data-status="OCCUPIED"]').first();
        await occupiedUnit.click();

        // Change status to AVAILABLE
        await page.getByTestId('btn-status-update').click();
        await page.getByRole('option', { name: 'AVAILABLE' }).click();
        await page.getByTestId('btn-confirm-status-change').click();

        // Wait for status update
        await expect(page.getByText(/status updated successfully/i)).toBeVisible({ timeout: 5000 });

        // Go back to properties list
        await page.goto('/properties');

        // Verify occupancy recalculated to 60% (6 occupied / 10 total)
        const propertyCard = page.locator('[data-testid="property-card"]', {
            has: page.getByText('Occupancy Test Property')
        });
        await expect(propertyCard.getByTestId('property-occupancy')).toContainText('60%');
    });

    test('should change unit status from AVAILABLE to OCCUPIED → verify occupancy recalculates to 80%', async ({ page }) => {
        await page.goto('/properties');

        // Click on Occupancy Test Property
        await page.getByText('Occupancy Test Property').click();

        // Navigate to units tab
        await page.getByTestId('tab-units').click();

        // Find 2 AVAILABLE units and change to OCCUPIED to reach 80% (8/10)
        for (let i = 0; i < 2; i++) {
            const availableUnit = page.locator('[data-testid="unit-card"][data-status="AVAILABLE"]').first();
            await availableUnit.click();

            // Change status to OCCUPIED
            await page.getByTestId('btn-status-update').click();
            await page.getByRole('option', { name: 'OCCUPIED' }).click();
            await page.getByTestId('btn-confirm-status-change').click();

            // Wait for status update
            await page.waitForTimeout(1000);

            // Go back to units list
            await page.getByTestId('btn-back-to-units').click();
        }

        // Go back to properties list
        await page.goto('/properties');

        // Verify occupancy recalculated to 80% (8 occupied / 10 total)
        const propertyCard = page.locator('[data-testid="property-card"]', {
            has: page.getByText('Occupancy Test Property')
        });
        await expect(propertyCard.getByTestId('property-occupancy')).toContainText('80%');
    });

    test('should verify occupancy calculation accuracy across multiple properties', async ({ page }) => {
        await page.goto('/properties');

        // Get all property cards
        const propertyCards = page.locator('[data-testid="property-card"]');
        const count = await propertyCards.count();

        // Verify each property's occupancy calculation
        for (let i = 0; i < count; i++) {
            const card = propertyCards.nth(i);

            // Get property name
            const propertyName = await card.getByTestId('property-name').textContent();

            // Click on property to view details
            await card.click();

            // Navigate to units tab
            await page.getByTestId('tab-units').click();

            // Count occupied units
            const occupiedUnits = page.locator('[data-testid="unit-card"][data-status="OCCUPIED"]');
            const occupiedCount = await occupiedUnits.count();

            // Get total units count (from property details)
            const totalUnitsText = await page.getByTestId('property-total-units').textContent();
            const totalUnits = parseInt(totalUnitsText || '0');

            // Calculate expected occupancy
            const expectedOccupancy = totalUnits > 0 ? Math.round((occupiedCount / totalUnits) * 100) : 0;

            // Go back to properties list
            await page.goto('/properties');

            // Verify occupancy matches calculation
            const propertyCard = page.locator('[data-testid="property-card"]', {
                has: page.getByText(propertyName || '')
            });
            const displayedOccupancy = await propertyCard.getByTestId('property-occupancy').textContent();

            // Extract percentage number
            const displayedPercent = parseInt(displayedOccupancy?.replace('%', '') || '0');

            // Verify accuracy
            expect(displayedPercent).toBe(expectedOccupancy);
        }
    });
});
