/**
 * Parking Spot Inventory Management Types
 * Story 3.8: Parking Spot Inventory Management
 *
 * Defines all types related to parking spot management, allocation, and status tracking
 */

// ===========================
// Enums
// ===========================

/**
 * Status of a parking spot
 */
export enum ParkingSpotStatus {
  /** Spot is available for allocation */
  AVAILABLE = 'AVAILABLE',
  /** Spot is currently assigned to a tenant */
  ASSIGNED = 'ASSIGNED',
  /** Spot is under maintenance and unavailable */
  UNDER_MAINTENANCE = 'UNDER_MAINTENANCE'
}

// ===========================
// Core Entity Types
// ===========================

/**
 * Parking Spot entity
 * Represents a single parking spot within a property
 */
export interface ParkingSpot {
  /** UUID of the parking spot */
  id: string;
  /** Spot identifier (e.g., P2-115, A-101, G-12) */
  spotNumber: string;
  /** UUID of the property this spot belongs to */
  propertyId: string;
  /** Name of the property (populated from relation) */
  propertyName: string;
  /** Default monthly fee for this spot (AED) */
  defaultFee: number;
  /** Current status of the spot */
  status: ParkingSpotStatus;
  /** UUID of assigned tenant (null if not assigned) */
  assignedTenantId: string | null;
  /** Name of assigned tenant (populated from relation) */
  assignedTenantName: string | null;
  /** When the spot was assigned to current tenant */
  assignedAt: string | null;
  /** Optional notes about the spot */
  notes: string | null;
  /** When the spot was created */
  createdAt: string;
  /** When the spot was last updated */
  updatedAt: string;
}

/**
 * Paginated list response for parking spots
 */
export interface ParkingSpotListResponse {
  /** Array of parking spots */
  content: ParkingSpot[];
  /** Total number of elements across all pages */
  totalElements: number;
  /** Total number of pages */
  totalPages: number;
  /** Current page number (0-indexed) */
  page: number;
  /** Number of items per page */
  size: number;
}

/**
 * Filters for parking spot list
 */
export interface ParkingSpotFilters {
  /** Filter by property ID */
  propertyId?: string;
  /** Filter by status */
  status?: ParkingSpotStatus;
  /** Search by spot number or tenant name */
  search?: string;
  /** Page number (0-indexed) */
  page: number;
  /** Number of items per page */
  size: number;
  /** Sort field and direction (e.g., "spotNumber,asc") */
  sort?: string;
}

// ===========================
// API Request Types
// ===========================

/**
 * Request to create a new parking spot
 */
export interface CreateParkingSpotRequest {
  /** UUID of the property */
  propertyId: string;
  /** Spot identifier (max 20 chars) */
  spotNumber: string;
  /** Default monthly fee (AED, >= 0) */
  defaultFee: number;
  /** Optional notes */
  notes?: string;
}

/**
 * Request to update an existing parking spot
 */
export interface UpdateParkingSpotRequest {
  /** UUID of the property (cannot change if ASSIGNED) */
  propertyId?: string;
  /** Spot identifier (max 20 chars) */
  spotNumber?: string;
  /** Default monthly fee (AED, >= 0) */
  defaultFee?: number;
  /** Optional notes */
  notes?: string;
}

/**
 * Request to change parking spot status
 */
export interface ChangeParkingSpotStatusRequest {
  /** New status (AVAILABLE or UNDER_MAINTENANCE only) */
  status: ParkingSpotStatus.AVAILABLE | ParkingSpotStatus.UNDER_MAINTENANCE;
}

/**
 * Request for bulk delete operation
 */
export interface BulkDeleteParkingSpotRequest {
  /** Array of parking spot IDs to delete */
  ids: string[];
}

/**
 * Request for bulk status change operation
 */
export interface BulkStatusChangeParkingSpotRequest {
  /** Array of parking spot IDs */
  ids: string[];
  /** New status to apply */
  status: ParkingSpotStatus.AVAILABLE | ParkingSpotStatus.UNDER_MAINTENANCE;
}

/**
 * Response from bulk operations
 */
export interface BulkOperationResponse {
  /** Number of successfully processed items */
  successCount: number;
  /** Number of items that failed (e.g., ASSIGNED spots) */
  failedCount: number;
  /** IDs of items that failed */
  failedIds: string[];
  /** Message describing the operation result */
  message: string;
}

/**
 * Response for parking spot counts by status
 */
export interface ParkingSpotCountsResponse {
  /** Count of available spots */
  available: number;
  /** Count of assigned spots */
  assigned: number;
  /** Count of spots under maintenance */
  underMaintenance: number;
  /** Total count of all spots */
  total: number;
}

// ===========================
// Form Data Types
// ===========================

/**
 * Form data for creating/editing a parking spot
 */
export interface ParkingSpotFormData {
  /** UUID of the property */
  propertyId: string;
  /** Spot identifier */
  spotNumber: string;
  /** Default monthly fee */
  defaultFee: number;
  /** Optional notes */
  notes?: string;
}

// ===========================
// Status Display Helpers
// ===========================

/**
 * Status badge configuration for UI display
 */
export const PARKING_SPOT_STATUS_CONFIG: Record<
  ParkingSpotStatus,
  { label: string; variant: 'success' | 'default' | 'warning'; className: string }
> = {
  [ParkingSpotStatus.AVAILABLE]: {
    label: 'Available',
    variant: 'success',
    className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
  },
  [ParkingSpotStatus.ASSIGNED]: {
    label: 'Assigned',
    variant: 'default',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
  },
  [ParkingSpotStatus.UNDER_MAINTENANCE]: {
    label: 'Under Maintenance',
    variant: 'warning',
    className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
  }
};

/**
 * Status options for filter dropdown
 */
export const PARKING_SPOT_STATUS_OPTIONS: { value: ParkingSpotStatus; label: string }[] = [
  { value: ParkingSpotStatus.AVAILABLE, label: 'Available' },
  { value: ParkingSpotStatus.ASSIGNED, label: 'Assigned' },
  { value: ParkingSpotStatus.UNDER_MAINTENANCE, label: 'Under Maintenance' }
];

// ===========================
// Helper Functions
// ===========================

/**
 * Format currency amount in AED
 *
 * @param amount - Amount to format
 * @returns Formatted string (e.g., "AED 500.00")
 */
export function formatParkingFee(amount: number): string {
  return `AED ${amount.toFixed(2)}`;
}

/**
 * Check if a parking spot can be deleted
 *
 * @param spot - Parking spot to check
 * @returns true if spot can be deleted (not ASSIGNED)
 */
export function canDeleteParkingSpot(spot: ParkingSpot): boolean {
  return spot.status !== ParkingSpotStatus.ASSIGNED;
}

/**
 * Check if a parking spot's status can be changed manually
 *
 * @param spot - Parking spot to check
 * @returns true if status can be changed (not ASSIGNED)
 */
export function canChangeStatus(spot: ParkingSpot): boolean {
  return spot.status !== ParkingSpotStatus.ASSIGNED;
}

/**
 * Get available status transitions for a parking spot
 *
 * @param currentStatus - Current status of the spot
 * @returns Array of available target statuses
 */
export function getAvailableStatusTransitions(
  currentStatus: ParkingSpotStatus
): ParkingSpotStatus[] {
  switch (currentStatus) {
    case ParkingSpotStatus.AVAILABLE:
      return [ParkingSpotStatus.UNDER_MAINTENANCE];
    case ParkingSpotStatus.UNDER_MAINTENANCE:
      return [ParkingSpotStatus.AVAILABLE];
    case ParkingSpotStatus.ASSIGNED:
      // ASSIGNED status can only be changed via tenant allocation/checkout
      return [];
    default:
      return [];
  }
}

/**
 * Check if a parking spot's building can be changed
 *
 * @param spot - Parking spot to check
 * @returns true if building can be changed (not ASSIGNED)
 */
export function canChangeParkingSpotBuilding(spot: ParkingSpot): boolean {
  return spot.status !== ParkingSpotStatus.ASSIGNED;
}
