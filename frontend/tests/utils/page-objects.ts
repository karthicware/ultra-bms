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

    async createProperty(data: { name: string; address: string; type: string; totalUnits: string }) {
        await this.createButton.click();
        await this.nameInput.fill(data.name);
        await this.addressInput.fill(data.address);
        await this.typeSelect.selectOption(data.type);
        await this.totalUnitsInput.fill(data.totalUnits);
        await this.submitButton.click();
    }
}
