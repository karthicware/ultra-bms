/**
 * Property Management API Service
 * All property management-related API calls
 */

import { apiClient } from '@/lib/api';
import type {
  Property,
  PropertyResponse,
  PropertyListResponse,
  CreatePropertyRequest,
  UpdatePropertyRequest,
  PropertySearchParams,
  PropertyImage,
  AssignManagerRequest,
} from '@/types';

const PROPERTIES_BASE_PATH = '/v1/properties';

/**
 * Create a new property in the system
 *
 * @param data - Property creation data
 * @param data.name - Property name (2-255 characters, required)
 * @param data.address - Full address (10-500 characters, required)
 * @param data.propertyType - Type: RESIDENTIAL, COMMERCIAL, or MIXED_USE (required)
 * @param data.totalUnitsCount - Total units in property (1-10,000, required)
 * @param data.managerId - UUID of assigned property manager (optional)
 * @param data.yearBuilt - Year built (1800-current year+2, optional)
 * @param data.totalSquareFootage - Total square footage (>0, optional)
 * @param data.amenities - Array of amenity names (max 50 items, optional)
 *
 * @returns Promise that resolves to the created Property object with auto-generated ID
 *
 * @throws {ValidationException} When validation fails (400)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 *
 * @example
 * ```typescript
 * const property = await createProperty({
 *   name: 'Marina Heights Tower',
 *   address: '123 Sheikh Zayed Road, Dubai Marina, Dubai',
 *   propertyType: 'RESIDENTIAL',
 *   totalUnitsCount: 150,
 *   managerId: '550e8400-e29b-41d4-a716-446655440000',
 *   yearBuilt: 2018,
 *   totalSquareFootage: 250000,
 *   amenities: ['Pool', 'Gym', 'Parking', 'Security']
 * });
 * console.log(property.id); // UUID
 * ```
 */
export async function createProperty(data: CreatePropertyRequest): Promise<Property> {
  const response = await apiClient.post<{ data: Property }>(PROPERTIES_BASE_PATH, data);
  return response.data.data;
}

/**
 * Get paginated list of properties with filters and search
 *
 * @param params - Search and filter parameters
 * @param params.page - Page number (default: 0)
 * @param params.size - Page size (default: 20, max: 100)
 * @param params.sort - Sort field (default: 'name')
 * @param params.direction - Sort direction: 'asc' or 'desc' (default: 'asc')
 * @param params.search - Search term for name or address
 * @param params.types - Array of property types to filter by
 * @param params.managerId - Filter by assigned manager UUID
 * @param params.occupancyMin - Minimum occupancy rate (0-100)
 * @param params.occupancyMax - Maximum occupancy rate (0-100)
 * @param params.status - Filter by status (ACTIVE or INACTIVE)
 *
 * @returns Promise that resolves to paginated property list with occupancy metrics
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 *
 * @example
 * ```typescript
 * // Get all RESIDENTIAL properties with occupancy > 80%
 * const properties = await getProperties({
 *   types: ['RESIDENTIAL'],
 *   occupancyMin: 80,
 *   page: 0,
 *   size: 20
 * });
 *
 * // Search properties by name
 * const searchResults = await getProperties({
 *   search: 'Marina',
 *   page: 0,
 *   size: 10
 * });
 * ```
 */
export async function getProperties(params?: PropertySearchParams): Promise<PropertyListResponse> {
  const response = await apiClient.get<PropertyListResponse>(PROPERTIES_BASE_PATH, { params });
  return response.data;
}

/**
 * Get a single property by ID with complete details
 *
 * @param id - Property UUID
 *
 * @returns Promise that resolves to PropertyResponse with images, manager, and unit counts
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {NotFoundException} When property ID does not exist (404)
 *
 * @example
 * ```typescript
 * const property = await getPropertyById('550e8400-e29b-41d4-a716-446655440000');
 * console.log(property.occupancyRate); // 85.5
 * console.log(property.unitCounts.occupied); // 128
 * console.log(property.images.length); // 5
 * ```
 */
export async function getPropertyById(id: string): Promise<PropertyResponse> {
  const response = await apiClient.get<{ data: PropertyResponse }>(`${PROPERTIES_BASE_PATH}/${id}`);
  return response.data.data;
}

/**
 * Update an existing property (partial update supported)
 *
 * @param id - Property UUID
 * @param data - Property update data (partial)
 *
 * @returns Promise that resolves to updated Property object
 *
 * @throws {ValidationException} When validation fails (400)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {NotFoundException} When property ID does not exist (404)
 *
 * @example
 * ```typescript
 * const updated = await updateProperty('550e8400-e29b-41d4-a716-446655440000', {
 *   name: 'Marina Heights Tower - Updated',
 *   amenities: ['Pool', 'Gym', 'Parking', 'Security', 'Spa']
 * });
 * ```
 */
export async function updateProperty(id: string, data: UpdatePropertyRequest): Promise<Property> {
  const response = await apiClient.put<{ data: Property }>(`${PROPERTIES_BASE_PATH}/${id}`, data);
  return response.data.data;
}

/**
 * Soft delete a property (marks as inactive, does not permanently delete)
 *
 * @param id - Property UUID
 *
 * @returns Promise that resolves when deletion is successful
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {NotFoundException} When property ID does not exist (404)
 * @throws {ConflictException} When property has active leases (409)
 *
 * @example
 * ```typescript
 * await deleteProperty('550e8400-e29b-41d4-a716-446655440000');
 * ```
 */
export async function deleteProperty(id: string): Promise<void> {
  await apiClient.delete(`${PROPERTIES_BASE_PATH}/${id}`);
}

/**
 * Upload a property image
 *
 * @param propertyId - Property UUID
 * @param file - Image file (JPEG, PNG, or WebP, max 10MB)
 * @param displayOrder - Display order (0-99, optional)
 *
 * @returns Promise that resolves to uploaded PropertyImage object
 *
 * @throws {ValidationException} When file validation fails (400)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {NotFoundException} When property ID does not exist (404)
 * @throws {PayloadTooLargeException} When file exceeds 10MB (413)
 *
 * @example
 * ```typescript
 * const imageFile = new File([blob], 'property-front.jpg', { type: 'image/jpeg' });
 * const image = await uploadPropertyImage('550e8400-e29b-41d4-a716-446655440000', imageFile, 1);
 * console.log(image.filePath); // S3 URL
 * ```
 */
export async function uploadPropertyImage(
  propertyId: string,
  file: File,
  displayOrder?: number
): Promise<PropertyImage> {
  const formData = new FormData();
  formData.append('file', file);
  if (displayOrder !== undefined) {
    formData.append('displayOrder', displayOrder.toString());
  }

  const response = await apiClient.post<{ data: PropertyImage }>(
    `${PROPERTIES_BASE_PATH}/${propertyId}/images`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data.data;
}

/**
 * Get all images for a property
 *
 * @param propertyId - Property UUID
 *
 * @returns Promise that resolves to array of PropertyImage objects sorted by displayOrder
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {NotFoundException} When property ID does not exist (404)
 *
 * @example
 * ```typescript
 * const images = await getPropertyImages('550e8400-e29b-41d4-a716-446655440000');
 * images.forEach(img => console.log(img.filePath));
 * ```
 */
export async function getPropertyImages(propertyId: string): Promise<PropertyImage[]> {
  const response = await apiClient.get<{ data: PropertyImage[] }>(
    `${PROPERTIES_BASE_PATH}/${propertyId}/images`
  );
  return response.data.data;
}

/**
 * Delete a property image
 *
 * @param propertyId - Property UUID
 * @param imageId - Image UUID
 *
 * @returns Promise that resolves when deletion is successful
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {NotFoundException} When property or image ID does not exist (404)
 *
 * @example
 * ```typescript
 * await deletePropertyImage('550e8400-e29b-41d4-a716-446655440000', 'image-uuid');
 * ```
 */
export async function deletePropertyImage(propertyId: string, imageId: string): Promise<void> {
  await apiClient.delete(`${PROPERTIES_BASE_PATH}/${propertyId}/images/${imageId}`);
}

/**
 * Assign or update property manager
 *
 * @param propertyId - Property UUID
 * @param managerId - Manager user UUID
 *
 * @returns Promise that resolves to updated Property object
 *
 * @throws {ValidationException} When manager ID is invalid (400)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {NotFoundException} When property or manager ID does not exist (404)
 *
 * @example
 * ```typescript
 * const updated = await assignPropertyManager(
 *   '550e8400-e29b-41d4-a716-446655440000',
 *   'manager-uuid'
 * );
 * console.log(updated.manager.firstName); // Manager details
 * ```
 */
export async function assignPropertyManager(
  propertyId: string,
  managerId: string
): Promise<Property> {
  const response = await apiClient.put<{ data: Property }>(
    `${PROPERTIES_BASE_PATH}/${propertyId}/manager`,
    { managerId } as AssignManagerRequest
  );
  return response.data.data;
}

/**
 * Get occupancy metrics for a property
 * Includes total, available, occupied, under maintenance, and reserved unit counts
 *
 * @param propertyId - Property UUID
 *
 * @returns Promise that resolves to occupancy metrics with percentage
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {NotFoundException} When property ID does not exist (404)
 *
 * @example
 * ```typescript
 * const metrics = await getPropertyOccupancy('550e8400-e29b-41d4-a716-446655440000');
 * console.log(`Occupancy: ${metrics.occupancyPercentage}%`);
 * console.log(`Occupied: ${metrics.occupied}/${metrics.total}`);
 * ```
 */
export async function getPropertyOccupancy(propertyId: string): Promise<{
  total: number;
  available: number;
  occupied: number;
  underMaintenance: number;
  reserved: number;
  occupancyPercentage: number;
}> {
  const response = await apiClient.get<{
    data: {
      total: number;
      available: number;
      occupied: number;
      underMaintenance: number;
      reserved: number;
      occupancyPercentage: number;
    };
  }>(`${PROPERTIES_BASE_PATH}/${propertyId}/occupancy`);
  return response.data.data;
}
