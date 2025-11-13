import { Page } from '@playwright/test';

/**
 * Wait Helper
 * Provides deterministic waiting strategies for network and UI operations
 */

export class WaitHelper {
  constructor(private page: Page) {}

  /**
   * Wait for API response
   */
  async waitForApiResponse(urlPattern: string | RegExp, method: string = 'GET') {
    return this.page.waitForResponse(
      (response) =>
        response.url().match(urlPattern) !== null &&
        response.request().method() === method,
      { timeout: 30000 }
    );
  }

  /**
   * Wait for multiple API responses
   */
  async waitForMultipleApiResponses(patterns: Array<{ url: string | RegExp; method?: string }>) {
    const promises = patterns.map(({ url, method = 'GET' }) =>
      this.waitForApiResponse(url, method)
    );

    return Promise.all(promises);
  }

  /**
   * Wait for element to be visible and stable
   */
  async waitForElementStable(selector: string, timeout: number = 15000) {
    const element = this.page.locator(selector);

    // Wait for visible
    await element.waitFor({ state: 'visible', timeout });

    // Wait for animations to complete
    await this.page.waitForTimeout(300);

    return element;
  }

  /**
   * Wait for table to load data
   */
  async waitForTableData(tableSelector: string = '[data-testid="data-table"]') {
    // Wait for table to be visible
    await this.page.waitForSelector(tableSelector, { state: 'visible' });

    // Wait for loading spinner to disappear
    await this.page.waitForSelector('[data-testid="loading-spinner"]', { state: 'hidden' });

    // Wait for at least one row
    await this.page.waitForSelector(`${tableSelector} tbody tr`, { timeout: 15000 });
  }

  /**
   * Wait for toast notification
   */
  async waitForToast(message?: string) {
    const toastSelector = '[data-testid="toast"]';

    await this.page.waitForSelector(toastSelector, { state: 'visible', timeout: 5000 });

    if (message) {
      await this.page.waitForSelector(`${toastSelector}:has-text("${message}")`);
    }

    return this.page.locator(toastSelector);
  }
}
