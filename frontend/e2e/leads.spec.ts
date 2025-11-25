/**
 * E2E Tests for Lead Management
 * Tests: Lead creation flow, document upload, search/filter operations
 */

import { test, expect } from '@playwright/test';

test.describe('Lead Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@ultrabms.com');
    await page.fill('input[name="password"]', 'Admin@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should create a new lead successfully', async ({ page }) => {
    // Navigate to leads page
    await page.goto('/leads');
    await expect(page.getByText('Lead Management')).toBeVisible();

    // Click "Add Lead" button
    await page.click('button[data-testid="btn-add-lead"]');
    await expect(page.getByText('Create New Lead')).toBeVisible();

    // Fill lead form
    await page.fill('input[name="fullName"]', 'Ahmed Hassan');
    await page.fill('input[name="emiratesId"]', '784-1234-1234567-1');
    await page.fill('input[name="passportNumber"]', 'AB1234567');
    await page.fill('input[name="passportExpiryDate"]', '2026-12-31');
    await page.fill('input[name="homeCountry"]', 'United Arab Emirates');
    await page.fill('input[name="email"]', 'ahmed.hassan@example.com');
    await page.fill('input[name="contactNumber"]', '+971501234567');

    // Select lead source
    await page.click('button[data-testid="select-lead-source"]');
    await page.click('div[data-testid="option-WEBSITE"]');

    // Add notes
    await page.fill('textarea[name="notes"]', 'Looking for 2 BHK apartment in Dubai Marina');

    // Submit form
    await page.click('button[data-testid="btn-submit-lead"]');

    // Wait for success message
    await expect(page.getByText('Lead created successfully')).toBeVisible({ timeout: 5000 });

    // Verify lead appears in list
    await expect(page.getByText('Ahmed Hassan')).toBeVisible();
    await expect(page.getByText('ahmed.hassan@example.com')).toBeVisible();
    await expect(page.getByText('+971501234567')).toBeVisible();
  });

  test('should show validation errors for invalid lead data', async ({ page }) => {
    await page.goto('/leads');
    await page.click('button[data-testid="btn-add-lead"]');

    // Try to submit empty form
    await page.click('button[data-testid="btn-submit-lead"]');

    // Check for validation errors
    await expect(page.getByText('Full name is required')).toBeVisible();
    await expect(page.getByText('Emirates ID is required')).toBeVisible();
    await expect(page.getByText('Email is required')).toBeVisible();

    // Test invalid Emirates ID format
    await page.fill('input[name="emiratesId"]', 'invalid-id');
    await page.locator('input[name="emiratesId"]').blur();
    await expect(page.getByText('Invalid Emirates ID format')).toBeVisible();

    // Test invalid phone number format
    await page.fill('input[name="contactNumber"]', '123456');
    await page.locator('input[name="contactNumber"]').blur();
    await expect(page.getByText('Invalid UAE phone number format')).toBeVisible();

    // Test invalid email
    await page.fill('input[name="email"]', 'invalid-email');
    await page.locator('input[name="email"]').blur();
    await expect(page.getByText('Invalid email address')).toBeVisible();
  });

  test('should upload document to lead successfully', async ({ page }) => {
    // Navigate to leads page and select a lead
    await page.goto('/leads');
    await page.click('[data-testid^="lead-row-"]', { timeout: 10000 });

    // Wait for lead detail page
    await expect(page.getByText('Lead Details')).toBeVisible();

    // Click on Documents tab
    await page.click('button[data-testid="tab-documents"]');

    // Click upload button
    await page.click('button[data-testid="btn-upload-document"]');

    // Select document type
    await page.click('button[data-testid="select-document-type"]');
    await page.click('div[data-testid="option-EMIRATES_ID"]');

    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'emirates-id.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Mock PDF content'),
    });

    // Submit upload
    await page.click('button[data-testid="btn-submit-upload"]');

    // Wait for success message
    await expect(page.getByText('Document uploaded successfully')).toBeVisible({ timeout: 5000 });

    // Verify document appears in list
    await expect(page.getByText('emirates-id.pdf')).toBeVisible();
    await expect(page.getByText('EMIRATES_ID')).toBeVisible();
  });

  test('should search and filter leads', async ({ page }) => {
    await page.goto('/leads');
    await expect(page.getByText('Lead Management')).toBeVisible();

    // Test search functionality
    await page.fill('input[data-testid="input-search-leads"]', 'Ahmed');
    await page.waitForTimeout(500); // Debounce delay

    // Verify search results
    const leadRows = page.locator('[data-testid^="lead-row-"]');
    await expect(leadRows.first()).toBeVisible({ timeout: 5000 });

    // Clear search
    await page.fill('input[data-testid="input-search-leads"]', '');
    await page.waitForTimeout(500);

    // Test status filter
    await page.click('button[data-testid="filter-status"]');
    await page.click('div[data-testid="status-NEW"]');
    await page.waitForTimeout(500);

    // Verify filtered results show only NEW status
    const statusBadges = page.locator('[data-testid="badge-status"]');
    const count = await statusBadges.count();
    for (let i = 0; i < count; i++) {
      await expect(statusBadges.nth(i)).toHaveText('NEW');
    }

    // Test source filter
    await page.click('button[data-testid="filter-source"]');
    await page.click('div[data-testid="source-WEBSITE"]');
    await page.waitForTimeout(500);

    // Verify filtered results
    await expect(leadRows.first()).toBeVisible();

    // Clear filters
    await page.click('button[data-testid="btn-clear-filters"]');
    await page.waitForTimeout(500);

    // Verify all leads are shown again
    await expect(leadRows.first()).toBeVisible();
  });

  test('should update lead status', async ({ page }) => {
    await page.goto('/leads');

    // Click on a lead
    await page.click('[data-testid^="lead-row-"]', { timeout: 10000 });
    await expect(page.getByText('Lead Details')).toBeVisible();

    // Update status to CONTACTED
    await page.click('button[data-testid="btn-update-status"]');
    await page.click('div[data-testid="status-option-CONTACTED"]');

    // Wait for success message
    await expect(page.getByText('Status updated successfully')).toBeVisible({ timeout: 5000 });

    // Verify status is updated
    await expect(page.locator('[data-testid="badge-status"]')).toHaveText('CONTACTED');

    // Verify history entry is created
    await page.click('button[data-testid="tab-history"]');
    await expect(page.getByText('Status changed to CONTACTED')).toBeVisible();
  });

  test('should view lead details and navigate between tabs', async ({ page }) => {
    await page.goto('/leads');

    // Click on a lead
    await page.click('[data-testid^="lead-row-"]', { timeout: 10000 });
    await expect(page.getByText('Lead Details')).toBeVisible();

    // Verify Overview tab shows lead information
    await expect(page.getByText('Contact Information')).toBeVisible();
    await expect(page.getByText('Lead Information')).toBeVisible();

    // Navigate to Quotations tab
    await page.click('button[data-testid="tab-quotations"]');
    await expect(page.getByText('No quotations found')).toBeVisible();

    // Navigate to Documents tab
    await page.click('button[data-testid="tab-documents"]');
    await expect(page.getByText('Documents') || page.getByText('No documents uploaded')).toBeVisible();

    // Navigate to History tab
    await page.click('button[data-testid="tab-history"]');
    await expect(page.getByText('Activity History') || page.getByText('Lead created')).toBeVisible();

    // Navigate back to Overview
    await page.click('button[data-testid="tab-overview"]');
    await expect(page.getByText('Contact Information')).toBeVisible();
  });

  test('should delete lead successfully', async ({ page }) => {
    await page.goto('/leads');

    // Click on a lead
    await page.click('[data-testid^="lead-row-"]', { timeout: 10000 });
    await expect(page.getByText('Lead Details')).toBeVisible();

    // Click delete button
    await page.click('button[data-testid="btn-delete-lead"]');

    // Confirm deletion in dialog
    await page.click('button[data-testid="btn-confirm-delete"]');

    // Wait for success message
    await expect(page.getByText('Lead deleted successfully')).toBeVisible({ timeout: 5000 });

    // Verify redirected to leads list
    await expect(page).toHaveURL(/\/leads$/);
  });

  test('should paginate through leads list', async ({ page }) => {
    await page.goto('/leads');
    await expect(page.getByText('Lead Management')).toBeVisible();

    // Wait for leads to load
    await page.waitForSelector('[data-testid^="lead-row-"]', { timeout: 10000 });

    // Check if pagination controls are visible (only if there are multiple pages)
    const nextButton = page.locator('button[data-testid="btn-next-page"]');
    const isVisible = await nextButton.isVisible();

    if (isVisible && !await nextButton.isDisabled()) {
      // Click next page
      await nextButton.click();
      await page.waitForTimeout(500);

      // Verify page number changed
      await expect(page.locator('[data-testid="page-info"]')).toContainText('Page 2');

      // Click previous page
      await page.click('button[data-testid="btn-prev-page"]');
      await page.waitForTimeout(500);

      // Verify back to page 1
      await expect(page.locator('[data-testid="page-info"]')).toContainText('Page 1');
    }
  });

  test('should edit lead information', async ({ page }) => {
    await page.goto('/leads');

    // Click on a lead
    await page.click('[data-testid^="lead-row-"]', { timeout: 10000 });
    await expect(page.getByText('Lead Details')).toBeVisible();

    // Click edit button
    await page.click('button[data-testid="btn-edit-lead"]');

    // Update lead information
    await page.fill('input[name="fullName"]', 'Ahmed Hassan Updated');
    await page.fill('textarea[name="notes"]', 'Updated notes for this lead');

    // Submit update
    await page.click('button[data-testid="btn-submit-update"]');

    // Wait for success message
    await expect(page.getByText('Lead updated successfully')).toBeVisible({ timeout: 5000 });

    // Verify updated information is displayed
    await expect(page.getByText('Ahmed Hassan Updated')).toBeVisible();
  });
});
