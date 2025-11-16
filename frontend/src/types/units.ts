/**
 * Unit Management Types
 * Defines all types related to unit management, status changes, and bulk operations
 */

// ===========================
// Enums
// ===========================

export enum UnitStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  UNDER_MAINTENANCE = 'UNDER_MAINTENANCE',
  RESERVED = 'RESERVED'
}

export enum IncrementPattern {
  SEQUENTIAL = 'SEQUENTIAL',
  FLOOR_BASED = 'FLOOR_BASED',
  CUSTOM = 'CUSTOM'
}

// ===========================
// Core Entity Types
// ===========================

export interface Unit {
  id: string;
  propertyId: string;
  unitNumber: string;
  floor?: number;
  bedroomCount: number;
  bathroomCount: number;
  squareFootage?: number;
  monthlyRent: number;
  status: UnitStatus;
  features?: UnitFeatures;
  active: boolean;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string

  // Extended fields from joins
  propertyName?: string;
  tenantName?: string;
  tenantId?: string;
  leaseStartDate?: string;
  leaseEndDate?: string;
}

export interface UnitFeatures {
  balcony?: boolean;
  view?: string;
  floorPlanType?: string;
  parkingSpotsIncluded?: number;
  furnished?: boolean;
  [key: string]: string | number | boolean | undefined; // Flexible JSON storage
}

export interface UnitHistory {
  id: string;
  unitId: string;
  oldStatus: UnitStatus;
  newStatus: UnitStatus;
  reason?: string;
  changedBy: string; // userId
  changedAt: string; // ISO date string
  changedByName?: string; // User's full name
}

// ===========================
// API Request Types
// ===========================

export interface CreateUnitRequest {
  propertyId: string;
  unitNumber: string;
  floor?: number;
  bedroomCount: number;
  bathroomCount: number;
  squareFootage?: number;
  monthlyRent: number;
  status?: UnitStatus;
  features?: UnitFeatures;
}

export interface UpdateUnitRequest {
  unitNumber?: string;
  floor?: number;
  bedroomCount?: number;
  bathroomCount?: number;
  squareFootage?: number;
  monthlyRent?: number;
  status?: UnitStatus;
  features?: UnitFeatures;
}

export interface UpdateUnitStatusRequest {
  status: UnitStatus;
  reason?: string;
}

export interface BulkUpdateStatusRequest {
  unitIds: string[];
  newStatus: UnitStatus;
  reason?: string;
}

export interface BulkCreateUnitsRequest {
  propertyId: string;
  startingUnitNumber: string;
  count: number;
  floor: number;
  incrementPattern: IncrementPattern;
  bedroomCount: number;
  bathroomCount: number;
  squareFootage?: number;
  monthlyRent: number;
  features?: UnitFeatures;
}

// ===========================
// API Response Types
// ===========================

export interface UnitResponse {
  id: string;
  propertyId: string;
  propertyName: string;
  unitNumber: string;
  floor?: number;
  bedroomCount: number;
  bathroomCount: number;
  squareFootage?: number;
  monthlyRent: number;
  rentPerSqft?: number; // Calculated field
  status: UnitStatus;
  features?: UnitFeatures;
  active: boolean;
  createdAt: string;
  updatedAt: string;

  // Extended details
  tenant?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    leaseStartDate: string;
    leaseEndDate: string;
  };
  history?: UnitHistory[];
}

export interface UnitListResponse {
  units: Unit[];
  totalCount: number;
}

export interface BulkUpdateResult {
  successCount: number;
  failureCount: number;
  failures?: Array<{
    unitId: string;
    unitNumber: string;
    reason: string;
  }>;
}

export interface BulkCreateResult {
  successCount: number;
  failureCount: number;
  createdUnits?: Unit[];
  failures?: Array<{
    unitNumber: string;
    reason: string;
  }>;
}

// ===========================
// Search & Filter Types
// ===========================

export interface UnitSearchParams {
  propertyId?: string;
  status?: UnitStatus[];
  floorMin?: number;
  floorMax?: number;
  bedroomCount?: number[];
  rentMin?: number;
  rentMax?: number;
  search?: string;
}

export interface UnitFilterOptions {
  statuses: UnitStatus[];
  floors: { min?: number; max?: number };
  bedrooms: number[];
  rentRange: { min?: number; max?: number };
}

// ===========================
// Form Data Types
// ===========================

export interface UnitFormData {
  unitNumber: string;
  floor: number | null;
  bedroomCount: number;
  bathroomCount: number;
  squareFootage: number | null;
  monthlyRent: number;
  status: UnitStatus;
  features: UnitFeatures;
}

export interface BulkCreateFormData {
  startingUnitNumber: string;
  count: number;
  floor: number;
  incrementPattern: IncrementPattern;
  bedroomCount: number;
  bathroomCount: number;
  squareFootage: number | null;
  monthlyRent: number;
  features: UnitFeatures;
}

// ===========================
// UI-Specific Types
// ===========================

export interface UnitCardData {
  id: string;
  unitNumber: string;
  floor?: number;
  type: string; // e.g., "2 BED / 2 BATH"
  squareFootage?: number;
  monthlyRent: number;
  status: UnitStatus;
  statusColor: 'success' | 'error' | 'warning' | 'info';
  tenantName?: string;
}

export interface UnitViewMode {
  mode: 'grid' | 'list';
}

// ===========================
// Status Transition Types
// ===========================

export interface StatusTransition {
  from: UnitStatus;
  to: UnitStatus;
  allowed: boolean;
  requiresReason?: boolean;
  validationMessage?: string;
}

// Status transition validation rules
export const STATUS_TRANSITIONS: Record<UnitStatus, UnitStatus[]> = {
  [UnitStatus.AVAILABLE]: [UnitStatus.RESERVED, UnitStatus.UNDER_MAINTENANCE],
  [UnitStatus.RESERVED]: [UnitStatus.OCCUPIED, UnitStatus.AVAILABLE, UnitStatus.UNDER_MAINTENANCE],
  [UnitStatus.OCCUPIED]: [UnitStatus.AVAILABLE, UnitStatus.UNDER_MAINTENANCE],
  [UnitStatus.UNDER_MAINTENANCE]: [UnitStatus.AVAILABLE, UnitStatus.RESERVED]
};

// Helper function to check if status transition is valid
export const isValidStatusTransition = (from: UnitStatus, to: UnitStatus): boolean => {
  return STATUS_TRANSITIONS[from]?.includes(to) ?? false;
};
