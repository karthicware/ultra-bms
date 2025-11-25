/**
 * E2E Tests for Quotation Management
 * Tests: Create quotation, send quotation, accept quotation, convert to tenant
 */

import { test, expect } from '@playwright/test';

test.describe('Quotation Management', () => {
  let leadId: string;

  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@ultrabms.com');
    await page.fill('input[name="password"]', 'Admin@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should create quotation for a lead successfully', async ({ page }) => {
    // Navigate to leads page
    await page.goto('/leads');
    await expect(page.getByText('Lead Management')).toBeVisible();

    // Select a lead with CONTACTED status
    await page.click('[data-testid^="lead-row-"]', { timeout: 10000 });
    await expect(page.getByText('Lead Details')).toBeVisible();

    // Navigate to Quotations tab
    await page.click('button[data-testid="tab-quotations"]');

    // Click "Create Quotation" button
    await page.click('button[data-testid="btn-create-quotation"]');
    await expect(page.getByText('Create Quotation')).toBeVisible();

    // Fill quotation form
    // Select property
    await page.click('button[data-testid="select-property"]');
    await page.click('div[data-testid^="option-property-"]');

    // Select unit
    await page.click('button[data-testid="select-unit"]');
    await page.click('div[data-testid^="option-unit-"]');

    // Select stay type
    await page.click('button[data-testid="select-stay-type"]');
    await page.click('div[data-testid="option-TWO_BHK"]');

    // Set dates
    const today = new Date().toISOString().split('T')[0];
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const validityDate = futureDate.toISOString().split('T')[0];

    await page.fill('input[name="issueDate"]', today);
    await page.fill('input[name="validityDate"]', validityDate);

    // Fill financial details
    await page.fill('input[name="baseRent"]', '5000');
    await page.fill('input[name="serviceCharges"]', '500');
    await page.fill('input[name="parkingSpots"]', '1');
    await page.fill('input[name="parkingFee"]', '200');
    await page.fill('input[name="securityDeposit"]', '5000');
    await page.fill('input[name="adminFee"]', '1000');

    // Verify total first payment is calculated correctly
    // 5000 + 500 + (1 * 200) + 5000 + 1000 = 11,700
    await expect(page.locator('[data-testid="total-first-payment"]')).toContainText('11,700');

    // Fill terms and conditions
    await page.fill('textarea[name="paymentTerms"]', 'Payment due on 1st of each month');
    await page.fill('textarea[name="moveinProcedures"]', 'Complete inspection checklist before move-in');
    await page.fill('textarea[name="cancellationPolicy"]', '30 days notice required for cancellation');

    // Submit quotation
    await page.click('button[data-testid="btn-submit-quotation"]');

    // Wait for success message
    await expect(page.getByText('Quotation created successfully')).toBeVisible({ timeout: 5000 });

    // Verify quotation appears in list with DRAFT status
    await expect(page.getByText('DRAFT')).toBeVisible();
    await expect(page.getByText('AED 5,000')).toBeVisible();
  });

  test('should show validation errors for invalid quotation data', async ({ page }) => {
    await page.goto('/leads');
    await page.click('[data-testid^="lead-row-"]', { timeout: 10000 });
    await page.click('button[data-testid="tab-quotations"]');
    await page.click('button[data-testid="btn-create-quotation"]');

    // Try to submit empty form
    await page.click('button[data-testid="btn-submit-quotation"]');

    // Check for validation errors
    await expect(page.getByText('Property is required')).toBeVisible();
    await expect(page.getByText('Unit is required')).toBeVisible();
    await expect(page.getByText('Stay type is required')).toBeVisible();

    // Test invalid base rent (zero or negative)
    await page.fill('input[name="baseRent"]', '0');
    await page.locator('input[name="baseRent"]').blur();
    await expect(page.getByText('Base rent must be greater than 0')).toBeVisible();

    await page.fill('input[name="baseRent"]', '-1000');
    await page.locator('input[name="baseRent"]').blur();
    await expect(page.getByText('Base rent must be greater than 0')).toBeVisible();

    // Test invalid dates (validity before issue date)
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const pastDate = yesterday.toISOString().split('T')[0];

    await page.fill('input[name="issueDate"]', today);
    await page.fill('input[name="validityDate"]', pastDate);
    await page.locator('input[name="validityDate"]').blur();
    await expect(page.getByText('Validity date must be after issue date')).toBeVisible();
  });

  test('should send quotation successfully', async ({ page }) => {
    // Navigate to leads page and select a lead
    await page.goto('/leads');
    await page.click('[data-testid^="lead-row-"]', { timeout: 10000 });
    await page.click('button[data-testid="tab-quotations"]');

    // Find a DRAFT quotation
    const draftQuotation = page.locator('[data-testid^="quotation-row-"]').filter({ hasText: 'DRAFT' }).first();

    if (await draftQuotation.isVisible()) {
      // Click on the quotation
      await draftQuotation.click();

      // Click "Send Quotation" button
      await page.click('button[data-testid="btn-send-quotation"]');

      // Confirm sending in dialog
      await page.click('button[data-testid="btn-confirm-send"]');

      // Wait for success message
      await expect(page.getByText('Quotation sent successfully')).toBeVisible({ timeout: 10000 });

      // Verify status changed to SENT
      await expect(page.locator('[data-testid="badge-status"]')).toHaveText('SENT');

      // Verify sent timestamp is displayed
      await expect(page.getByText('Sent on:')).toBeVisible();
    }
  });

  test('should accept quotation successfully', async ({ page }) => {
    // Navigate to quotations page
    await page.goto('/quotations');
    await expect(page.getByText('Quotation Management')).toBeVisible();

    // Filter for SENT quotations
    await page.click('button[data-testid="filter-status"]');
    await page.click('div[data-testid="status-SENT"]');
    await page.waitForTimeout(500);

    // Click on a SENT quotation
    const sentQuotation = page.locator('[data-testid^="quotation-row-"]').first();

    if (await sentQuotation.isVisible()) {
      await sentQuotation.click();

      // Click "Accept Quotation" button
      await page.click('button[data-testid="btn-accept-quotation"]');

      // Confirm acceptance in dialog
      await page.click('button[data-testid="btn-confirm-accept"]');

      // Wait for success message
      await expect(page.getByText('Quotation accepted successfully')).toBeVisible({ timeout: 10000 });

      // Verify status changed to ACCEPTED
      await expect(page.locator('[data-testid="badge-status"]')).toHaveText('ACCEPTED');

      // Verify accepted timestamp is displayed
      await expect(page.getByText('Accepted on:')).toBeVisible();

      // Verify "Convert to Tenant" button is now visible
      await expect(page.locator('button[data-testid="btn-convert-to-tenant"]')).toBeVisible();
    }
  });

  test('should reject quotation with reason', async ({ page }) => {
    await page.goto('/quotations');

    // Filter for SENT quotations
    await page.click('button[data-testid="filter-status"]');
    await page.click('div[data-testid="status-SENT"]');
    await page.waitForTimeout(500);

    // Click on a SENT quotation
    const sentQuotation = page.locator('[data-testid^="quotation-row-"]').first();

    if (await sentQuotation.isVisible()) {
      await sentQuotation.click();

      // Click "Reject Quotation" button
      await page.click('button[data-testid="btn-reject-quotation"]');

      // Enter rejection reason
      await page.fill('textarea[data-testid="input-rejection-reason"]', 'Rent is too high for current budget');

      // Confirm rejection
      await page.click('button[data-testid="btn-confirm-reject"]');

      // Wait for success message
      await expect(page.getByText('Quotation rejected')).toBeVisible({ timeout: 5000 });

      // Verify status changed to REJECTED
      await expect(page.locator('[data-testid="badge-status"]')).toHaveText('REJECTED');

      // Verify rejection reason is displayed
      await expect(page.getByText('Rent is too high for current budget')).toBeVisible();
    }
  });

  test('should convert lead to tenant successfully', async ({ page }) => {
    // Navigate to leads page
    await page.goto('/leads');

    // Find a lead with ACCEPTED quotation
    await page.click('[data-testid^="lead-row-"]', { timeout: 10000 });
    await page.click('button[data-testid="tab-quotations"]');

    // Look for ACCEPTED quotation
    const acceptedQuotation = page.locator('[data-testid^="quotation-row-"]').filter({ hasText: 'ACCEPTED' }).first();

    if (await acceptedQuotation.isVisible()) {
      // Click "Convert to Tenant" button
      await page.click('button[data-testid="btn-convert-to-tenant"]');

      // Confirm conversion in dialog
      await page.click('button[data-testid="btn-confirm-convert"]');

      // Wait for success message
      await expect(page.getByText(/converted to tenant/i)).toBeVisible({ timeout: 10000 });

      // Verify quotation status changed to CONVERTED
      await expect(page.locator('[data-testid="badge-status"]')).toHaveText('CONVERTED');

      // Verify lead status changed to CONVERTED
      await page.click('button[data-testid="tab-overview"]');
      await expect(page.locator('[data-testid="badge-lead-status"]')).toHaveText('CONVERTED');

      // Verify history entry is created
      await page.click('button[data-testid="tab-history"]');
      await expect(page.getByText('Lead converted to tenant')).toBeVisible();
    }
  });

  test('should download quotation PDF', async ({ page }) => {
    await page.goto('/quotations');

    // Click on any quotation
    await page.click('[data-testid^="quotation-row-"]', { timeout: 10000 });

    // Set up download listener
    const downloadPromise = page.waitForEvent('download');

    // Click download PDF button
    await page.click('button[data-testid="btn-download-pdf"]');

    // Wait for download to complete
    const download = await downloadPromise;

    // Verify download filename
    expect(download.suggestedFilename()).toMatch(/quotation-QUOT-.*\.pdf/);
  });

  test('should update quotation details', async ({ page }) => {
    await page.goto('/quotations');

    // Find a DRAFT quotation
    const draftQuotation = page.locator('[data-testid^="quotation-row-"]').filter({ hasText: 'DRAFT' }).first();

    if (await draftQuotation.isVisible()) {
      await draftQuotation.click();

      // Click edit button
      await page.click('button[data-testid="btn-edit-quotation"]');

      // Update financial details
      await page.fill('input[name="baseRent"]', '6000');
      await page.fill('input[name="parkingSpots"]', '2');

      // Verify total recalculation
      // New total: 6000 + 500 + (2 * 200) + 5000 + 1000 = 12,700
      await expect(page.locator('[data-testid="total-first-payment"]')).toContainText('12,700');

      // Submit update
      await page.click('button[data-testid="btn-submit-update"]');

      // Wait for success message
      await expect(page.getByText('Quotation updated successfully')).toBeVisible({ timeout: 5000 });

      // Verify updated information is displayed
      await expect(page.getByText('AED 6,000')).toBeVisible();
    }
  });

  test('should search and filter quotations', async ({ page }) => {
    await page.goto('/quotations');
    await expect(page.getByText('Quotation Management')).toBeVisible();

    // Test search by quotation number
    await page.fill('input[data-testid="input-search-quotations"]', 'QUOT-');
    await page.waitForTimeout(500);

    // Verify search results
    const quotationRows = page.locator('[data-testid^="quotation-row-"]');
    await expect(quotationRows.first()).toBeVisible({ timeout: 5000 });

    // Clear search
    await page.fill('input[data-testid="input-search-quotations"]', '');
    await page.waitForTimeout(500);

    // Test status filter
    await page.click('button[data-testid="filter-status"]');
    await page.click('div[data-testid="status-DRAFT"]');
    await page.waitForTimeout(500);

    // Verify filtered results show only DRAFT status
    const statusBadges = page.locator('[data-testid="badge-status"]');
    const count = await statusBadges.count();
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        await expect(statusBadges.nth(i)).toHaveText('DRAFT');
      }
    }

    // Clear filters
    await page.click('button[data-testid="btn-clear-filters"]');
    await page.waitForTimeout(500);
  });

  test('should view quotation dashboard statistics', async ({ page }) => {
    await page.goto('/quotations');
    await expect(page.getByText('Quotation Management')).toBeVisible();

    // Verify dashboard cards are visible
    await expect(page.locator('[data-testid="card-new-leads"]')).toBeVisible();
    await expect(page.locator('[data-testid="card-active-quotes"]')).toBeVisible();
    await expect(page.locator('[data-testid="card-quotes-expiring"]')).toBeVisible();
    await expect(page.locator('[data-testid="card-conversion-rate"]')).toBeVisible();

    // Verify statistics have numeric values
    const newLeadsCount = await page.locator('[data-testid="stat-new-leads"]').textContent();
    expect(newLeadsCount).toMatch(/\d+/);

    const activeQuotesCount = await page.locator('[data-testid="stat-active-quotes"]').textContent();
    expect(activeQuotesCount).toMatch(/\d+/);

    const conversionRate = await page.locator('[data-testid="stat-conversion-rate"]').textContent();
    expect(conversionRate).toMatch(/\d+(\.\d+)?%/);
  });

  test('should delete quotation successfully (DRAFT only)', async ({ page }) => {
    await page.goto('/quotations');

    // Find a DRAFT quotation
    const draftQuotation = page.locator('[data-testid^="quotation-row-"]').filter({ hasText: 'DRAFT' }).first();

    if (await draftQuotation.isVisible()) {
      await draftQuotation.click();

      // Click delete button
      await page.click('button[data-testid="btn-delete-quotation"]');

      // Confirm deletion
      await page.click('button[data-testid="btn-confirm-delete"]');

      // Wait for success message
      await expect(page.getByText('Quotation deleted successfully')).toBeVisible({ timeout: 5000 });

      // Verify redirected back to quotations list
      await expect(page).toHaveURL(/\/quotations$/);
    }
  });

  test('should prevent sending non-DRAFT quotations', async ({ page }) => {
    await page.goto('/quotations');

    // Find a non-DRAFT quotation (SENT, ACCEPTED, etc.)
    const nonDraftQuotation = page.locator('[data-testid^="quotation-row-"]')
      .filter({ hasNot: page.locator(':has-text("DRAFT")') })
      .first();

    if (await nonDraftQuotation.isVisible()) {
      await nonDraftQuotation.click();

      // Verify "Send Quotation" button is not visible or disabled
      const sendButton = page.locator('button[data-testid="btn-send-quotation"]');
      const isVisible = await sendButton.isVisible();

      if (isVisible) {
        await expect(sendButton).toBeDisabled();
      }
    }
  });

  test('should prevent converting non-ACCEPTED quotations', async ({ page }) => {
    await page.goto('/quotations');

    // Find a non-ACCEPTED quotation
    const nonAcceptedQuotation = page.locator('[data-testid^="quotation-row-"]')
      .filter({ hasNot: page.locator(':has-text("ACCEPTED")') })
      .first();

    if (await nonAcceptedQuotation.isVisible()) {
      await nonAcceptedQuotation.click();

      // Verify "Convert to Tenant" button is not visible
      await expect(page.locator('button[data-testid="btn-convert-to-tenant"]')).not.toBeVisible();
    }
  });
});
