import { TestApiClient } from './test-api-client';
import properties from '../fixtures/properties.json';
import units from '../fixtures/units.json';

export class SeedUtils {
    private api: TestApiClient;
    private createdPropertyIds: string[] = [];

    constructor() {
        this.api = new TestApiClient();
    }

    async seedProperties() {
        const createdProperties = [];
        for (const property of properties) {
            try {
                const response = await this.api.post('/properties', property);
                this.createdPropertyIds.push(response.data.id);
                createdProperties.push(response.data);
            } catch (error) {
                console.error(`Failed to seed property ${property.name}:`, error);
            }
        }
        return createdProperties;
    }

    async seedUnits(propertyId: string) {
        const createdUnits = [];
        for (const unit of units) {
            try {
                const response = await this.api.post(`/properties/${propertyId}/units`, unit);
                createdUnits.push(response.data);
            } catch (error) {
                console.error(`Failed to seed unit ${unit.unitNumber}:`, error);
            }
        }
        return createdUnits;
    }

    async cleanup() {
        for (const id of this.createdPropertyIds) {
            try {
                await this.api.delete(`/properties/${id}`);
            } catch (error) {
                console.error(`Failed to delete property ${id}:`, error);
            }
        }
        this.createdPropertyIds = [];
    }
}
