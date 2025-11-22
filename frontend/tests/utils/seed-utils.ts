import { TestApiClient } from './test-api-client';
import properties from '../fixtures/properties.json';
import units from '../fixtures/units.json';

export class SeedUtils {
    private api: TestApiClient;
    private createdPropertyIds: string[] = [];

    constructor() {
        this.api = new TestApiClient();
    }

    /**
     * Clean up old test data from previous failed test runs
     * Searches for properties matching test fixture names
     */
    async cleanupOldTestData() {
        try {
            console.log('Cleaning up old test data...');

            // Get all properties
            const response = await this.api.get('/properties?page=0&size=1000');
            const allProperties = response.data.content || response.data.data?.content || [];

            // Find properties that match our test fixture names (with timestamps)
            const testPropertyNames = properties.map(p => p.name);
            const testPropertiesToDelete = allProperties.filter((prop: any) =>
                testPropertyNames.some(name => prop.name?.startsWith(name + '-'))
            );

            console.log(`Found ${testPropertiesToDelete.length} old test properties to clean up`);

            // Delete old test properties
            for (const property of testPropertiesToDelete) {
                try {
                    await this.api.delete(`/properties/${property.id}`);
                    console.log(`Deleted old test property: ${property.name}`);
                } catch (error) {
                    console.error(`Failed to delete old test property ${property.name}:`, error);
                }
            }

            console.log('Old test data cleanup complete');
        } catch (error) {
            console.error('Failed to cleanup old test data:', error);
            // Don't throw - continue with tests even if cleanup fails
        }
    }

    async seedProperties() {
        const createdProperties = [];
        const timestamp = Date.now();
        for (const property of properties) {
            try {
                // Make property names unique by adding timestamp
                const uniqueProperty = {
                    ...property,
                    name: `${property.name}-${timestamp}`
                };
                const response = await this.api.post('/properties', uniqueProperty);

                // Debug: Log full response structure to identify correct path
                console.log('Property creation response structure:', JSON.stringify(response.data, null, 2));

                // Extract property data with multiple fallback paths
                let propertyData = null;
                if (response.data?.data?.id) {
                    // Case 1: { data: { data: { id, ... } } }
                    propertyData = response.data.data;
                } else if (response.data?.id) {
                    // Case 2: { data: { id, ... } }
                    propertyData = response.data;
                } else if (response.data?.success && response.data?.data) {
                    // Case 3: { data: { success: true, data: { id, ... } } }
                    propertyData = response.data.data;
                } else {
                    // Case 4: Unexpected response structure
                    console.error('Unexpected response structure:', response.data);
                    throw new Error('Property ID not found in response');
                }

                // Defensive check: Ensure we have a valid ID
                if (!propertyData?.id) {
                    console.error('Property data missing ID:', propertyData);
                    throw new Error(`Property creation succeeded but ID is missing. Response: ${JSON.stringify(response.data)}`);
                }

                this.createdPropertyIds.push(propertyData.id);
                createdProperties.push(propertyData);
                console.log(`✅ Seeded property: ${uniqueProperty.name} (ID: ${propertyData.id})`);
            } catch (error) {
                console.error(`❌ Failed to seed property ${property.name}:`, error);
                // Re-throw to prevent undefined IDs from cascading
                throw error;
            }
        }
        return createdProperties;
    }

    async seedUnits(propertyId: string) {
        // Defensive check: Validate property ID before making API calls
        if (!propertyId || propertyId === 'undefined' || propertyId === 'null') {
            const error = new Error(`Invalid property ID provided to seedUnits: "${propertyId}"`);
            console.error('❌ CRITICAL:', error.message);
            throw error;
        }

        console.log(`Seeding units for property ID: ${propertyId}`);
        const createdUnits = [];
        for (const unit of units) {
            try {
                const response = await this.api.post(`/properties/${propertyId}/units`, unit);

                // Extract unit data with multiple fallback paths
                let unitData = null;
                if (response.data?.data?.id) {
                    unitData = response.data.data;
                } else if (response.data?.id) {
                    unitData = response.data;
                } else {
                    console.error('Unexpected unit response structure:', response.data);
                    throw new Error('Unit ID not found in response');
                }

                if (!unitData?.id) {
                    throw new Error(`Unit creation succeeded but ID is missing. Response: ${JSON.stringify(response.data)}`);
                }

                createdUnits.push(unitData);
                console.log(`✅ Seeded unit: ${unit.unitNumber} (ID: ${unitData.id})`);
            } catch (error) {
                console.error(`❌ Failed to seed unit ${unit.unitNumber}:`, error);
                // Re-throw to prevent partial test data
                throw error;
            }
        }
        return createdUnits;
    }

    async seedPropertyWithUnits() {
        // Seed properties first
        const createdProperties = await this.seedProperties();

        // Seed units for the first property if any properties were created
        if (createdProperties.length > 0) {
            const firstProperty = createdProperties[0];
            await this.seedUnits(firstProperty.id);
        }

        return createdProperties;
    }

    /**
     * Clean up properties created during this test session
     * Automatically refreshes token if needed to handle long-running tests
     */
    async cleanup() {
        // Filter out any invalid IDs before attempting cleanup
        const validIds = this.createdPropertyIds.filter(id =>
            id && id !== 'undefined' && id !== 'null' && typeof id === 'string'
        );

        const invalidIds = this.createdPropertyIds.filter(id =>
            !id || id === 'undefined' || id === 'null' || typeof id !== 'string'
        );

        if (invalidIds.length > 0) {
            console.warn(`⚠️  Found ${invalidIds.length} invalid property IDs in cleanup list:`, invalidIds);
        }

        console.log(`Cleaning up ${validIds.length} test properties...`);

        if (validIds.length === 0) {
            console.log('No valid property IDs to clean up');
            this.createdPropertyIds = [];
            return;
        }

        // Refresh token before cleanup to avoid 401 errors from expired tokens
        try {
            await this.api.refreshToken();
            console.log('Token refreshed for cleanup');
        } catch (error) {
            console.error('Failed to refresh token for cleanup:', error);
        }

        for (const id of validIds) {
            try {
                await this.api.delete(`/properties/${id}`);
                console.log(`✅ Deleted property: ${id}`);
            } catch (error) {
                console.error(`❌ Failed to delete property ${id}:`, error);
            }
        }
        this.createdPropertyIds = [];
        console.log('Cleanup complete');
    }
}
