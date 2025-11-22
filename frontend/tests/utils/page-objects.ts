import { Page, Locator } from '@playwright/test';

export class BasePage {
    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    async goto(path: string) {
        await this.page.goto(path);
    }
}

export class PropertyPage extends BasePage {
    readonly createButton: Locator;
    readonly nameInput: Locator;
    readonly addressInput: Locator;
    readonly typeSelect: Locator;
    readonly totalUnitsInput: Locator;
    readonly submitButton: Locator;

    constructor(page: Page) {
        super(page);
        this.createButton = page.getByTestId('btn-create-property');
        this.nameInput = page.getByTestId('input-property-name');
        this.addressInput = page.getByTestId('input-property-address');
        this.typeSelect = page.getByTestId('select-property-type');
        this.totalUnitsInput = page.getByTestId('input-total-units');
        this.submitButton = page.getByTestId('btn-submit-property');
    }

    /**
     * Select an option from a shadcn Select component
     * shadcn Select is a custom React component, not a native <select>
     * Use click-based interaction instead of selectOption()
     * Maps test values (e.g., 'RESIDENTIAL') to UI display text (e.g., 'Residential')
     */
    async selectPropertyType(type: string) {
        await this.typeSelect.click();

        // Wait for dropdown to open
        await this.page.waitForSelector('[role="option"]', { state: 'visible', timeout: 5000 });

        // Map test values to UI display text
        const displayNameMap: Record<string, string> = {
            'RESIDENTIAL': 'Residential',
            'COMMERCIAL': 'Commercial',
            'MIXED_USE': 'Mixed Use'
        };

        const displayName = displayNameMap[type] || type;
        await this.page.getByRole('option', { name: displayName }).click();
    }

    async createProperty(data: { name: string; address: string; type: string; totalUnits: string }) {
        // Navigate directly to create page (more reliable than clicking button)
        await this.page.goto('/properties/create');
        await this.page.waitForLoadState('networkidle');

        // Wait for form to be fully loaded
        await this.nameInput.waitFor({ state: 'visible', timeout: 5000 });

        // Fill form fields
        await this.nameInput.fill(data.name);
        await this.addressInput.fill(data.address);

        // Use click-based selection for shadcn Select component
        await this.selectPropertyType(data.type);

        await this.totalUnitsInput.fill(data.totalUnits);

        // Submit and wait for navigation back to properties list
        await this.submitButton.click();

        // Wait for either success (redirect to property detail) or stay on create page (error)
        // We'll check for the success case - redirect to /properties/{id}
        try {
            await this.page.waitForURL(/\/properties\/[a-f0-9-]+/, { timeout: 10000 });
        } catch (e) {
            // If we don't navigate, we're still on create page (error occurred)
            // Continue anyway - test will check assertions
        }
    }
}
