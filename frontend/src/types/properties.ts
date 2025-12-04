/**
 * Property Management Types
 * Defines all types related to property management, images, and search parameters
 */

// ===========================
// Enums
// ===========================

export enum PropertyType {
  RESIDENTIAL = 'RESIDENTIAL',
  COMMERCIAL = 'COMMERCIAL',
  MIXED_USE = 'MIXED_USE'
}

export enum PropertyStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

// ===========================
// Core Entity Types
// ===========================

export interface Property {
  id: string;
  name: string;
  address: string;
  propertyType: PropertyType;
  totalUnitsCount: number;
  managerId?: string;
  yearBuilt?: number;
  totalSquareFootage?: number;
  amenities?: string[];
  status: PropertyStatus;
  active: boolean;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  createdBy: string; // userId

  // Calculated fields from backend
  occupancyRate?: number;
  availableUnits?: number;
  occupiedUnits?: number;
  underMaintenanceUnits?: number;
  reservedUnits?: number;

  // Images (optional, included when fetching property list with images)
  images?: PropertyImage[];
  thumbnailUrl?: string; // Primary/thumbnail image URL
}

export interface PropertyImage {
  id: string;
  propertyId: string;
  fileName: string;
  filePath: string;
  fileSize: number; // in bytes
  displayOrder: number;
  uploadedBy: string; // userId
  uploadedAt: string; // ISO date string
}

export interface PropertyManager {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
}

// ===========================
// API Request Types
// ===========================

export interface CreatePropertyRequest {
  name: string;
  address: string;
  propertyType: PropertyType;
  totalUnitsCount: number;
  managerId?: string;
  yearBuilt?: number;
  totalSquareFootage?: number;
  amenities?: string[];
}

export interface UpdatePropertyRequest {
  name?: string;
  address?: string;
  propertyType?: PropertyType;
  totalUnitsCount?: number;
  managerId?: string;
  yearBuilt?: number;
  totalSquareFootage?: number;
  amenities?: string[];
  status?: PropertyStatus;
}

export interface UploadPropertyImageRequest {
  file: File;
  displayOrder?: number;
}

export interface AssignManagerRequest {
  managerId: string;
}

// ===========================
// API Response Types
// ===========================

export interface PropertyResponse {
  id: string;
  name: string;
  address: string;
  propertyType: PropertyType;
  totalUnitsCount: number;
  managerId?: string;
  manager?: PropertyManager;
  yearBuilt?: number;
  totalSquareFootage?: number;
  amenities?: string[];
  status: PropertyStatus;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;

  // Extended details
  images?: PropertyImage[];
  unitCounts?: {
    total: number;
    available: number;
    occupied: number;
    underMaintenance: number;
    reserved: number;
  };
  occupancyRate?: number;
}

export interface PropertyListResponse {
  content: Property[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

// ===========================
// Search & Filter Types
// ===========================

export interface PropertySearchParams {
  page?: number;
  size?: number;
  sort?: string;
  direction?: 'asc' | 'desc';
  search?: string;
  types?: PropertyType[];
  managerId?: string;
  occupancyMin?: number;
  occupancyMax?: number;
  status?: PropertyStatus;
}

// ===========================
// Form Data Types
// ===========================

export interface PropertyFormData {
  name: string;
  address: string;
  propertyType: PropertyType;
  totalUnitsCount: number;
  managerId: string;
  yearBuilt: number | null;
  totalSquareFootage: number | null;
  amenities: string[];
}

// ===========================
// UI-Specific Types
// ===========================

export interface PropertyCardData {
  id: string;
  name: string;
  address: string;
  propertyType: PropertyType;
  totalUnits: number;
  occupiedUnits: number;
  occupancyRate: number;
  occupancyColor: 'success' | 'warning' | 'error';
  manager?: {
    name: string;
    avatar?: string;
  };
}

export interface OccupancyMetrics {
  total: number;
  available: number;
  occupied: number;
  underMaintenance: number;
  reserved: number;
  occupancyPercentage: number;
  trend?: number; // percentage change from last period
}
