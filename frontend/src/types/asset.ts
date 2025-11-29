/**
 * Asset Management Types and Interfaces
 * Story 7.1: Asset Registry and Tracking
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Asset category enum
 * Categories for asset classification
 */
export enum AssetCategory {
  HVAC = 'HVAC',
  ELEVATOR = 'ELEVATOR',
  GENERATOR = 'GENERATOR',
  WATER_PUMP = 'WATER_PUMP',
  FIRE_SYSTEM = 'FIRE_SYSTEM',
  SECURITY_SYSTEM = 'SECURITY_SYSTEM',
  ELECTRICAL_PANEL = 'ELECTRICAL_PANEL',
  PLUMBING_FIXTURE = 'PLUMBING_FIXTURE',
  APPLIANCE = 'APPLIANCE',
  OTHER = 'OTHER'
}

/**
 * Asset status enum
 * Tracks asset lifecycle status
 */
export enum AssetStatus {
  ACTIVE = 'ACTIVE',
  UNDER_MAINTENANCE = 'UNDER_MAINTENANCE',
  OUT_OF_SERVICE = 'OUT_OF_SERVICE',
  DISPOSED = 'DISPOSED'
}

/**
 * Asset document type enum
 * Types of documents that can be attached to assets
 */
export enum AssetDocumentType {
  MANUAL = 'MANUAL',
  WARRANTY = 'WARRANTY',
  PURCHASE_INVOICE = 'PURCHASE_INVOICE',
  SPECIFICATION = 'SPECIFICATION',
  OTHER = 'OTHER'
}

/**
 * Warranty status for display
 */
export enum WarrantyStatus {
  ACTIVE = 'ACTIVE',
  EXPIRING_SOON = 'EXPIRING_SOON',
  EXPIRED = 'EXPIRED',
  NO_WARRANTY = 'NO_WARRANTY'
}

// ============================================================================
// MAIN INTERFACES
// ============================================================================

/**
 * Full asset entity
 * Complete asset information from backend
 */
export interface Asset {
  id: string;
  assetNumber: string;
  assetName: string;
  category: AssetCategory;
  propertyId: string;
  propertyName?: string;
  location: string;
  manufacturer?: string;
  modelNumber?: string;
  serialNumber?: string;
  installationDate?: string;
  warrantyExpiryDate?: string;
  purchaseCost?: number;
  estimatedUsefulLife?: number;
  status: AssetStatus;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Asset list item for table view
 * Minimal fields for efficient list rendering
 */
export interface AssetListItem {
  id: string;
  assetNumber: string;
  assetName: string;
  category: AssetCategory;
  categoryDisplayName: string;
  propertyId: string;
  propertyName?: string;
  location: string;
  status: AssetStatus;
  statusDisplayName: string;
  statusColor: string;
  warrantyExpiryDate?: string;
  warrantyStatus: string | null;
  warrantyDaysRemaining: number | null;
  createdAt: string;
}

/**
 * Asset detail with additional relations
 * Extended asset info for detail page
 */
export interface AssetDetail extends Asset {
  // Property details
  propertyAddress?: string;

  // Documents attached to asset
  documents: AssetDocument[];

  // Maintenance summary (from backend DTO)
  maintenanceSummary?: {
    totalWorkOrders: number;
    completedWorkOrders: number;
    totalMaintenanceCost: number;
  };

  // Warranty status computed from warrantyExpiryDate
  warrantyStatus: WarrantyStatus;
  warrantyDaysRemaining?: number;

  // Status display fields
  statusDisplayName?: string;
  statusColor?: string;
  categoryDisplayName?: string;
  statusNotes?: string;

  // Permission flags
  editable: boolean;
  canLinkToWorkOrder: boolean;
}

/**
 * Asset document entity
 */
export interface AssetDocument {
  id: string;
  assetId: string;
  documentType: AssetDocumentType;
  fileName: string;
  filePath: string;
  fileSize: number;
  uploadedBy: string;
  uploadedByName?: string;
  uploadedAt: string;
  downloadUrl?: string;
}

/**
 * Asset maintenance history item
 * Work order linked to asset
 */
export interface AssetMaintenanceHistory {
  id: string;
  workOrderNumber: string;
  createdAt: string;
  description: string;
  status: string;
  actualCost?: number;
  vendorId?: string;
  vendorName?: string;
  completedAt?: string;
}

// ============================================================================
// DTO INTERFACES
// ============================================================================

/**
 * Request DTO for creating asset
 */
export interface AssetCreateRequest {
  assetName: string;
  category: AssetCategory;
  propertyId: string;
  location: string;
  manufacturer?: string;
  modelNumber?: string;
  serialNumber?: string;
  installationDate?: string;
  warrantyExpiryDate?: string;
  purchaseCost?: number;
  estimatedUsefulLife?: number;
}

/**
 * Request DTO for updating asset
 */
export interface AssetUpdateRequest {
  assetName?: string;
  category?: AssetCategory;
  propertyId?: string;
  location?: string;
  manufacturer?: string;
  modelNumber?: string;
  serialNumber?: string;
  installationDate?: string;
  warrantyExpiryDate?: string;
  purchaseCost?: number;
  estimatedUsefulLife?: number;
  nextMaintenanceDate?: string;
}

/**
 * Request DTO for updating asset status
 */
export interface AssetStatusUpdateRequest {
  status: AssetStatus;
  notes?: string;
}

/**
 * Request DTO for uploading asset document
 */
export interface AssetDocumentUploadRequest {
  documentType: AssetDocumentType;
  file: File;
}

/**
 * Filter parameters for asset list
 */
export interface AssetFilter {
  search?: string;
  propertyId?: string;
  category?: AssetCategory | AssetCategory[] | 'ALL';
  status?: AssetStatus | AssetStatus[] | 'ALL';
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Response from create asset endpoint
 */
export interface CreateAssetResponse {
  success: boolean;
  message: string;
  data: Asset;
  timestamp: string;
}

/**
 * Response from get asset endpoint
 */
export interface GetAssetResponse {
  success: boolean;
  message: string;
  data: AssetDetail;
  timestamp: string;
}

/**
 * Response from list assets endpoint
 */
export interface AssetListResponse {
  success: boolean;
  message: string;
  data: {
    content: AssetListItem[];
    totalElements: number;
    totalPages: number;
    page: number;
    size: number;
  };
  timestamp: string;
}

/**
 * Response from update asset status endpoint
 */
export interface AssetStatusUpdateResponse {
  success: boolean;
  message: string;
  data: Asset;
  timestamp: string;
}

/**
 * Response from maintenance history endpoint
 */
export interface AssetMaintenanceHistoryResponse {
  success: boolean;
  message: string;
  data: {
    content: AssetMaintenanceHistory[];
    totalElements: number;
    totalPages: number;
    page: number;
    size: number;
    totalMaintenanceCost: number;
  };
  timestamp: string;
}

/**
 * Response from upload document endpoint
 */
export interface AssetDocumentUploadResponse {
  success: boolean;
  message: string;
  data: AssetDocument;
  timestamp: string;
}

/**
 * Response from expiring warranties endpoint
 */
export interface ExpiringWarrantiesResponse {
  success: boolean;
  message: string;
  data: ExpiringWarrantyItem[];
  timestamp: string;
}

/**
 * Expiring warranty item
 */
export interface ExpiringWarrantyItem {
  id: string;
  assetNumber: string;
  assetName: string;
  category: AssetCategory;
  propertyId: string;
  propertyName: string;
  warrantyExpiryDate: string;
  daysUntilExpiry: number;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Asset category display information
 */
export interface AssetCategoryInfo {
  value: AssetCategory;
  label: string;
  color: 'blue' | 'purple' | 'orange' | 'cyan' | 'red' | 'green' | 'yellow' | 'indigo' | 'pink' | 'gray';
  icon: string;
  description: string;
}

/**
 * Asset category options for dropdowns and badges
 */
export const ASSET_CATEGORY_OPTIONS: AssetCategoryInfo[] = [
  {
    value: AssetCategory.HVAC,
    label: 'HVAC',
    color: 'blue',
    icon: 'wind',
    description: 'Heating, Ventilation, and Air Conditioning'
  },
  {
    value: AssetCategory.ELEVATOR,
    label: 'Elevator',
    color: 'purple',
    icon: 'arrow-up-down',
    description: 'Elevators and lifts'
  },
  {
    value: AssetCategory.GENERATOR,
    label: 'Generator',
    color: 'orange',
    icon: 'zap',
    description: 'Power generators'
  },
  {
    value: AssetCategory.WATER_PUMP,
    label: 'Water Pump',
    color: 'cyan',
    icon: 'droplets',
    description: 'Water pumps and systems'
  },
  {
    value: AssetCategory.FIRE_SYSTEM,
    label: 'Fire System',
    color: 'red',
    icon: 'flame',
    description: 'Fire safety and suppression systems'
  },
  {
    value: AssetCategory.SECURITY_SYSTEM,
    label: 'Security System',
    color: 'green',
    icon: 'shield',
    description: 'Security and surveillance systems'
  },
  {
    value: AssetCategory.ELECTRICAL_PANEL,
    label: 'Electrical Panel',
    color: 'yellow',
    icon: 'plug',
    description: 'Electrical panels and distribution'
  },
  {
    value: AssetCategory.PLUMBING_FIXTURE,
    label: 'Plumbing Fixture',
    color: 'indigo',
    icon: 'pipette',
    description: 'Plumbing fixtures and systems'
  },
  {
    value: AssetCategory.APPLIANCE,
    label: 'Appliance',
    color: 'pink',
    icon: 'refrigerator',
    description: 'Household and building appliances'
  },
  {
    value: AssetCategory.OTHER,
    label: 'Other',
    color: 'gray',
    icon: 'more-horizontal',
    description: 'Other equipment and assets'
  }
];

/**
 * Asset status display information
 */
export interface AssetStatusInfo {
  value: AssetStatus;
  label: string;
  color: 'green' | 'amber' | 'red' | 'gray';
  icon: string;
  description: string;
}

/**
 * Asset status options for dropdowns and badges
 */
export const ASSET_STATUS_OPTIONS: AssetStatusInfo[] = [
  {
    value: AssetStatus.ACTIVE,
    label: 'Active',
    color: 'green',
    icon: 'check-circle',
    description: 'Asset is operational'
  },
  {
    value: AssetStatus.UNDER_MAINTENANCE,
    label: 'Under Maintenance',
    color: 'amber',
    icon: 'wrench',
    description: 'Asset is being maintained'
  },
  {
    value: AssetStatus.OUT_OF_SERVICE,
    label: 'Out of Service',
    color: 'red',
    icon: 'x-circle',
    description: 'Asset is not operational'
  },
  {
    value: AssetStatus.DISPOSED,
    label: 'Disposed',
    color: 'gray',
    icon: 'trash-2',
    description: 'Asset has been disposed'
  }
];

/**
 * Asset document type display information
 */
export interface AssetDocumentTypeInfo {
  value: AssetDocumentType;
  label: string;
  icon: string;
  description: string;
}

/**
 * Asset document type options for dropdowns
 */
export const ASSET_DOCUMENT_TYPE_OPTIONS: AssetDocumentTypeInfo[] = [
  {
    value: AssetDocumentType.MANUAL,
    label: 'Manual',
    icon: 'book-open',
    description: 'User manual or operating guide'
  },
  {
    value: AssetDocumentType.WARRANTY,
    label: 'Warranty',
    icon: 'file-badge',
    description: 'Warranty certificate or terms'
  },
  {
    value: AssetDocumentType.PURCHASE_INVOICE,
    label: 'Purchase Invoice',
    icon: 'receipt',
    description: 'Purchase invoice or receipt'
  },
  {
    value: AssetDocumentType.SPECIFICATION,
    label: 'Specification',
    icon: 'file-text',
    description: 'Technical specifications'
  },
  {
    value: AssetDocumentType.OTHER,
    label: 'Other',
    icon: 'file',
    description: 'Other documents'
  }
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get category badge color class
 */
export function getAssetCategoryColor(category: AssetCategory): string {
  switch (category) {
    case AssetCategory.HVAC:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case AssetCategory.ELEVATOR:
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
    case AssetCategory.GENERATOR:
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
    case AssetCategory.WATER_PUMP:
      return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300';
    case AssetCategory.FIRE_SYSTEM:
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    case AssetCategory.SECURITY_SYSTEM:
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case AssetCategory.ELECTRICAL_PANEL:
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case AssetCategory.PLUMBING_FIXTURE:
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300';
    case AssetCategory.APPLIANCE:
      return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300';
    case AssetCategory.OTHER:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Get asset status badge color class
 */
export function getAssetStatusColor(status: AssetStatus): string {
  switch (status) {
    case AssetStatus.ACTIVE:
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case AssetStatus.UNDER_MAINTENANCE:
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
    case AssetStatus.OUT_OF_SERVICE:
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    case AssetStatus.DISPOSED:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Get warranty status badge color class
 */
export function getWarrantyStatusColor(status: WarrantyStatus): string {
  switch (status) {
    case WarrantyStatus.ACTIVE:
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case WarrantyStatus.EXPIRING_SOON:
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case WarrantyStatus.EXPIRED:
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    case WarrantyStatus.NO_WARRANTY:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Calculate warranty status from expiry date
 */
export function calculateWarrantyStatus(warrantyExpiryDate?: string): WarrantyStatus {
  if (!warrantyExpiryDate) {
    return WarrantyStatus.NO_WARRANTY;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiryDate = new Date(warrantyExpiryDate);
  expiryDate.setHours(0, 0, 0, 0);

  const diffTime = expiryDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return WarrantyStatus.EXPIRED;
  } else if (diffDays <= 30) {
    return WarrantyStatus.EXPIRING_SOON;
  } else {
    return WarrantyStatus.ACTIVE;
  }
}

/**
 * Calculate days remaining until warranty expiry
 */
export function calculateWarrantyDaysRemaining(warrantyExpiryDate?: string): number | undefined {
  if (!warrantyExpiryDate) {
    return undefined;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiryDate = new Date(warrantyExpiryDate);
  expiryDate.setHours(0, 0, 0, 0);

  const diffTime = expiryDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get asset status badge variant for shadcn Badge
 */
export function getAssetStatusVariant(status: AssetStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case AssetStatus.ACTIVE:
      return 'default';
    case AssetStatus.UNDER_MAINTENANCE:
      return 'secondary';
    case AssetStatus.OUT_OF_SERVICE:
      return 'destructive';
    case AssetStatus.DISPOSED:
      return 'outline';
    default:
      return 'secondary';
  }
}

/**
 * Get asset category label
 */
export function getAssetCategoryLabel(category: AssetCategory): string {
  const option = ASSET_CATEGORY_OPTIONS.find(opt => opt.value === category);
  return option?.label ?? category;
}

/**
 * Get asset status label
 */
export function getAssetStatusLabel(status: AssetStatus): string {
  const option = ASSET_STATUS_OPTIONS.find(opt => opt.value === status);
  return option?.label ?? status;
}

/**
 * Get warranty status label
 */
export function getWarrantyStatusLabel(status: WarrantyStatus): string {
  switch (status) {
    case WarrantyStatus.ACTIVE:
      return 'Active';
    case WarrantyStatus.EXPIRING_SOON:
      return 'Expiring Soon';
    case WarrantyStatus.EXPIRED:
      return 'Expired';
    case WarrantyStatus.NO_WARRANTY:
      return 'No Warranty';
    default:
      return 'Unknown';
  }
}

/**
 * Get document type label
 */
export function getAssetDocumentTypeLabel(type: AssetDocumentType): string {
  const option = ASSET_DOCUMENT_TYPE_OPTIONS.find(opt => opt.value === type);
  return option?.label ?? type;
}

/**
 * Check if asset can be edited
 * DISPOSED assets cannot be edited
 */
export function canEditAsset(status: AssetStatus): boolean {
  return status !== AssetStatus.DISPOSED;
}

/**
 * Check if asset can link to work orders
 * Only ACTIVE and UNDER_MAINTENANCE assets can link
 */
export function canLinkToWorkOrder(status: AssetStatus): boolean {
  return status === AssetStatus.ACTIVE || status === AssetStatus.UNDER_MAINTENANCE;
}

/**
 * Check if asset can be disposed
 * Already DISPOSED assets cannot be disposed again
 */
export function canDisposeAsset(status: AssetStatus): boolean {
  return status !== AssetStatus.DISPOSED;
}

/**
 * Format currency as AED for assets
 */
export function formatAssetCurrency(amount?: number): string {
  if (amount === undefined || amount === null) {
    return '-';
  }
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Format file size for display (asset-specific)
 */
export function formatAssetFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ============================================================================
// LABEL RECORDS FOR DISPLAY
// ============================================================================

/**
 * Asset category labels for display
 */
export const ASSET_CATEGORY_LABELS: Record<AssetCategory, string> = {
  [AssetCategory.HVAC]: 'HVAC',
  [AssetCategory.ELEVATOR]: 'Elevator',
  [AssetCategory.GENERATOR]: 'Generator',
  [AssetCategory.WATER_PUMP]: 'Water Pump',
  [AssetCategory.FIRE_SYSTEM]: 'Fire System',
  [AssetCategory.SECURITY_SYSTEM]: 'Security System',
  [AssetCategory.ELECTRICAL_PANEL]: 'Electrical Panel',
  [AssetCategory.PLUMBING_FIXTURE]: 'Plumbing Fixture',
  [AssetCategory.APPLIANCE]: 'Appliance',
  [AssetCategory.OTHER]: 'Other'
};

/**
 * Asset status labels for display
 */
export const ASSET_STATUS_LABELS: Record<AssetStatus, string> = {
  [AssetStatus.ACTIVE]: 'Active',
  [AssetStatus.UNDER_MAINTENANCE]: 'Under Maintenance',
  [AssetStatus.OUT_OF_SERVICE]: 'Out of Service',
  [AssetStatus.DISPOSED]: 'Disposed'
};

/**
 * Warranty status labels for display
 */
export const WARRANTY_STATUS_LABELS: Record<WarrantyStatus, string> = {
  [WarrantyStatus.ACTIVE]: 'Active',
  [WarrantyStatus.EXPIRING_SOON]: 'Expiring Soon',
  [WarrantyStatus.EXPIRED]: 'Expired',
  [WarrantyStatus.NO_WARRANTY]: 'No Warranty'
};

/**
 * Asset document type labels for display
 */
export const ASSET_DOCUMENT_TYPE_LABELS: Record<AssetDocumentType, string> = {
  [AssetDocumentType.MANUAL]: 'Manual',
  [AssetDocumentType.WARRANTY]: 'Warranty',
  [AssetDocumentType.PURCHASE_INVOICE]: 'Purchase Invoice',
  [AssetDocumentType.SPECIFICATION]: 'Specification',
  [AssetDocumentType.OTHER]: 'Other'
};
