import { Page, expect } from '@playwright/test';

export async function waitForAPIResponse(page: Page, urlPart: string, status = 200) {
    return page.waitForResponse(response =>
        response.url().includes(urlPart) && response.status() === status
    );
}

export async function fillForm(page: Page, data: Record<string, string>) {
    for (const [key, value] of Object.entries(data)) {
        await page.fill(`[data-testid="${key}"]`, value);
    }
}
