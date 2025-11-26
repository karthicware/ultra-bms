/**
 * Vendor Management Types and Interfaces
 * Story 5.1: Vendor Registration and Profile Management
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Vendor status enum
 * Controls vendor visibility and assignment eligibility
 */
export enum VendorStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED'
}

/**
 * Payment terms enum
 * Defines vendor payment schedule (net days)
 */
export enum PaymentTerms {
  NET_15 = 'NET_15',
  NET_30 = 'NET_30',
  NET_45 = 'NET_45',
  NET_60 = 'NET_60'
}

/**
 * Service category enum
 * Categories of services vendors can provide
 */
export enum ServiceCategory {
  PLUMBING = 'PLUMBING',
  ELECTRICAL = 'ELECTRICAL',
  HVAC = 'HVAC',
  APPLIANCE = 'APPLIANCE',
  CARPENTRY = 'CARPENTRY',
  PEST_CONTROL = 'PEST_CONTROL',
  CLEANING = 'CLEANING',
  PAINTING = 'PAINTING',
  LANDSCAPING = 'LANDSCAPING',
  OTHER = 'OTHER'
}

// ============================================================================
// MAIN INTERFACES
// ============================================================================

/**
 * Full vendor entity
 * Complete vendor information from backend
 */
export interface Vendor {
  id: string;
  vendorNumber: string;
  companyName: string;
  contactPersonName: string;
  email: string;
  phoneNumber: string;
  secondaryPhoneNumber?: string;
  address?: string;
  emiratesIdOrTradeLicense: string;
  trn?: string;
  serviceCategories: ServiceCategory[];
  serviceAreas?: string[]; // Property UUIDs
  hourlyRate: number;
  emergencyCalloutFee?: number;
  paymentTerms: PaymentTerms;
  status: VendorStatus;
  rating: number;
  totalJobsCompleted: number;
  isDeleted: boolean;
  deletedAt?: string;
  deletedBy?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Vendor list item for table view
 * Minimal fields for efficient list rendering
 */
export interface VendorListItem {
  id: string;
  vendorNumber: string;
  companyName: string;
  contactPersonName: string;
  serviceCategories: ServiceCategory[];
  rating: number;
  status: VendorStatus;
}

/**
 * Vendor detail with performance metrics
 * Extended vendor info for detail page
 */
export interface VendorDetail extends Vendor {
  workOrderCount: number;
  averageCompletionTime?: number; // Days - placeholder for Story 5.3
}

// ============================================================================
// DTO INTERFACES
// ============================================================================

/**
 * Request DTO for creating/updating vendor
 */
export interface VendorRequest {
  companyName: string;
  contactPersonName: string;
  email: string;
  phoneNumber: string;
  secondaryPhoneNumber?: string;
  address?: string;
  emiratesIdOrTradeLicense: string;
  trn?: string;
  serviceCategories: ServiceCategory[];
  serviceAreas?: string[];
  hourlyRate: number;
  emergencyCalloutFee?: number;
  paymentTerms: PaymentTerms;
}

/**
 * Request DTO for updating vendor status
 */
export interface UpdateVendorStatusRequest {
  status: VendorStatus;
}

/**
 * Filter parameters for vendor list
 */
export interface VendorFilter {
  search?: string;
  status?: VendorStatus | 'ALL';
  serviceCategories?: ServiceCategory[];
  minRating?: number;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Response from create vendor endpoint
 */
export interface CreateVendorResponse {
  success: boolean;
  message: string;
  data: Vendor;
  timestamp: string;
}

/**
 * Response from get vendor endpoint
 */
export interface GetVendorResponse {
  success: boolean;
  message: string;
  data: VendorDetail;
  timestamp: string;
}

/**
 * Response from list vendors endpoint
 */
export interface VendorListResponse {
  success: boolean;
  message: string;
  data: {
    content: VendorListItem[];
    totalElements: number;
    totalPages: number;
    page: number;
    size: number;
  };
  timestamp: string;
}

/**
 * Response from update vendor status endpoint
 */
export interface VendorStatusResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    status: VendorStatus;
  };
  timestamp: string;
}

/**
 * Work order item for vendor work order history
 * Matches backend WorkOrderListDto
 */
export interface VendorWorkOrderItem {
  id: string;
  workOrderNumber: string;
  propertyName: string;
  unitNumber?: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  scheduledDate?: string;
  assigneeName?: string;
  isOverdue?: boolean;
  createdAt: string;
}

/**
 * Response from vendor work orders endpoint
 */
export interface VendorWorkOrdersResponse {
  success: boolean;
  message: string;
  data: {
    content: VendorWorkOrderItem[];
    totalElements: number;
    totalPages: number;
    page: number;
    size: number;
  };
  timestamp: string;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Vendor status display information
 */
export interface VendorStatusInfo {
  value: VendorStatus;
  label: string;
  color: 'green' | 'gray' | 'red';
  description: string;
}

/**
 * Vendor status options for dropdowns and badges
 */
export const VENDOR_STATUS_OPTIONS: VendorStatusInfo[] = [
  {
    value: VendorStatus.ACTIVE,
    label: 'Active',
    color: 'green',
    description: 'Vendor is active and can receive work orders'
  },
  {
    value: VendorStatus.INACTIVE,
    label: 'Inactive',
    color: 'gray',
    description: 'Vendor is temporarily inactive'
  },
  {
    value: VendorStatus.SUSPENDED,
    label: 'Suspended',
    color: 'red',
    description: 'Vendor is suspended due to compliance issues'
  }
];

/**
 * Payment terms display information
 */
export interface PaymentTermsInfo {
  value: PaymentTerms;
  label: string;
  days: number;
}

/**
 * Payment terms options for dropdown
 */
export const PAYMENT_TERMS_OPTIONS: PaymentTermsInfo[] = [
  { value: PaymentTerms.NET_15, label: 'Net 15 Days', days: 15 },
  { value: PaymentTerms.NET_30, label: 'Net 30 Days', days: 30 },
  { value: PaymentTerms.NET_45, label: 'Net 45 Days', days: 45 },
  { value: PaymentTerms.NET_60, label: 'Net 60 Days', days: 60 }
];

/**
 * Service category display information
 */
export interface ServiceCategoryInfo {
  value: ServiceCategory;
  label: string;
}

/**
 * Service category options for multi-select
 */
export const SERVICE_CATEGORY_OPTIONS: ServiceCategoryInfo[] = [
  { value: ServiceCategory.PLUMBING, label: 'Plumbing' },
  { value: ServiceCategory.ELECTRICAL, label: 'Electrical' },
  { value: ServiceCategory.HVAC, label: 'HVAC' },
  { value: ServiceCategory.APPLIANCE, label: 'Appliance' },
  { value: ServiceCategory.CARPENTRY, label: 'Carpentry' },
  { value: ServiceCategory.PEST_CONTROL, label: 'Pest Control' },
  { value: ServiceCategory.CLEANING, label: 'Cleaning' },
  { value: ServiceCategory.PAINTING, label: 'Painting' },
  { value: ServiceCategory.LANDSCAPING, label: 'Landscaping' },
  { value: ServiceCategory.OTHER, label: 'Other' }
];

/**
 * Get status badge color class
 */
export function getVendorStatusColor(status: VendorStatus): string {
  switch (status) {
    case VendorStatus.ACTIVE:
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case VendorStatus.INACTIVE:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    case VendorStatus.SUSPENDED:
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Get valid status transitions from current status
 */
export function getValidStatusTransitions(currentStatus: VendorStatus): VendorStatus[] {
  switch (currentStatus) {
    case VendorStatus.ACTIVE:
      return [VendorStatus.INACTIVE, VendorStatus.SUSPENDED];
    case VendorStatus.INACTIVE:
      return [VendorStatus.ACTIVE];
    case VendorStatus.SUSPENDED:
      return [VendorStatus.ACTIVE];
    default:
      return [];
  }
}
