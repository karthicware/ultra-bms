/**
 * Document Management System Types and Interfaces
 * Story 7.2: Document Management System
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Entity type for documents
 * Defines which entity type the document is associated with
 */
export enum DocumentEntityType {
  PROPERTY = 'PROPERTY',
  TENANT = 'TENANT',
  VENDOR = 'VENDOR',
  ASSET = 'ASSET',
  GENERAL = 'GENERAL'
}

/**
 * Access level for documents
 * Defines who can view/download the document
 */
export enum DocumentAccessLevel {
  PUBLIC = 'PUBLIC',
  INTERNAL = 'INTERNAL',
  RESTRICTED = 'RESTRICTED'
}

/**
 * Expiry status for documents
 * Calculated based on expiry date
 */
export type DocumentExpiryStatus = 'valid' | 'expiring_soon' | 'expired' | 'no_expiry';

// ============================================================================
// MAIN INTERFACES
// ============================================================================

/**
 * Document entity
 * Complete document information from backend
 */
export interface Document {
  id: string;
  documentNumber: string;
  documentType: string;
  title: string;
  description?: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  fileType: string; // MIME type
  entityType: DocumentEntityType;
  entityId?: string;
  entityName?: string; // Property/Tenant/Vendor/Asset name
  expiryDate?: string; // ISO date string
  tags: string[];
  accessLevel: DocumentAccessLevel;
  version: number;
  versionCount?: number;
  uploadedBy: string;
  uploaderName?: string;
  uploadedAt: string; // ISO datetime string
  updatedAt?: string; // ISO datetime string
  expiryStatus: DocumentExpiryStatus;
  daysUntilExpiry?: number;
  downloadUrl?: string; // Presigned S3 URL
  previewUrl?: string; // Presigned S3 URL for preview
  isDeleted?: boolean;
}

/**
 * Document list item for table view
 */
export interface DocumentListItem {
  id: string;
  documentNumber: string;
  title: string;
  documentType: string;
  entityType: DocumentEntityType;
  entityId?: string;
  entityName?: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  expiryDate?: string;
  expiryStatus: DocumentExpiryStatus;
  daysUntilExpiry?: number;
  accessLevel: DocumentAccessLevel;
  version: number;
  uploadedAt: string;
}

/**
 * Document version entity
 * Historical version of a document
 */
export interface DocumentVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  fileName: string;
  filePath: string;
  fileSize: number;
  uploadedBy: string;
  uploaderName?: string;
  uploadedAt: string;
  notes?: string;
  downloadUrl?: string; // Presigned S3 URL
}

/**
 * Expiring document for dashboard/alerts
 */
export interface ExpiringDocument {
  id: string;
  documentNumber: string;
  title: string;
  documentType: string;
  entityType: DocumentEntityType;
  entityId?: string;
  entityName?: string;
  expiryDate: string;
  daysUntilExpiry: number;
  accessLevel: DocumentAccessLevel;
}

// ============================================================================
// DTO INTERFACES
// ============================================================================

/**
 * Request DTO for uploading a document
 * File is handled separately as multipart
 */
export interface DocumentUpload {
  documentType: string;
  title: string;
  description?: string;
  entityType: DocumentEntityType;
  entityId?: string;
  expiryDate?: string; // ISO date string
  tags?: string[];
  accessLevel: DocumentAccessLevel;
}

/**
 * Request DTO for updating document metadata
 */
export interface DocumentUpdate {
  title: string;
  description?: string;
  documentType: string;
  expiryDate?: string;
  tags?: string[];
  accessLevel: DocumentAccessLevel;
}

/**
 * Request DTO for replacing document file
 */
export interface DocumentReplace {
  notes?: string;
}

// ============================================================================
// FILTER INTERFACES
// ============================================================================

/**
 * Filter parameters for document list
 */
export interface DocumentFilters {
  entityType?: DocumentEntityType;
  entityId?: string;
  documentType?: string;
  expiryStatus?: 'all' | 'expiring_soon' | 'expired' | 'valid';
  accessLevel?: DocumentAccessLevel;
  tags?: string[];
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  size?: number;
  sort?: string;
}

/**
 * Filter parameters for expiring documents list
 */
export interface ExpiringDocumentsFilter {
  days?: number; // Days until expiry threshold (default 30)
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Response from upload document endpoint
 */
export interface DocumentResponse {
  success: boolean;
  message: string;
  data: Document;
  timestamp: string;
}

/**
 * Response from list documents endpoint
 */
export interface DocumentListResponse {
  success: boolean;
  message: string;
  data: {
    content: DocumentListItem[];
    totalElements: number;
    totalPages: number;
    page: number;
    size: number;
  };
  timestamp: string;
}

/**
 * Response from get document endpoint (with presigned URLs)
 */
export interface DocumentDetailResponse {
  success: boolean;
  message: string;
  data: Document;
  timestamp: string;
}

/**
 * Response from version history endpoint
 */
export interface DocumentVersionsResponse {
  success: boolean;
  message: string;
  data: DocumentVersion[];
  timestamp: string;
}

/**
 * Response from expiring documents endpoint
 */
export interface ExpiringDocumentsResponse {
  success: boolean;
  message: string;
  data: ExpiringDocument[];
  timestamp: string;
}

/**
 * Response from download endpoint
 */
export interface DownloadUrlResponse {
  success: boolean;
  message: string;
  data: {
    downloadUrl: string;
    fileName: string;
    fileType: string;
  };
  timestamp: string;
}

/**
 * Response from preview endpoint
 */
export interface PreviewUrlResponse {
  success: boolean;
  message: string;
  data: {
    previewUrl: string;
    fileName: string;
    fileType: string;
    canPreview: boolean;
  };
  timestamp: string;
}

// ============================================================================
// HELPER TYPES AND CONSTANTS
// ============================================================================

/**
 * Entity type display information
 */
export interface EntityTypeInfo {
  value: DocumentEntityType;
  label: string;
  color: string;
  bgClass: string;
}

/**
 * Entity type options for dropdown
 */
export const ENTITY_TYPE_OPTIONS: EntityTypeInfo[] = [
  {
    value: DocumentEntityType.PROPERTY,
    label: 'Property',
    color: 'blue',
    bgClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
  },
  {
    value: DocumentEntityType.TENANT,
    label: 'Tenant',
    color: 'purple',
    bgClass: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
  },
  {
    value: DocumentEntityType.VENDOR,
    label: 'Vendor',
    color: 'orange',
    bgClass: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
  },
  {
    value: DocumentEntityType.ASSET,
    label: 'Asset',
    color: 'teal',
    bgClass: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300'
  },
  {
    value: DocumentEntityType.GENERAL,
    label: 'General',
    color: 'gray',
    bgClass: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  }
];

/**
 * Access level display information
 */
export interface AccessLevelInfo {
  value: DocumentAccessLevel;
  label: string;
  description: string;
  color: string;
  bgClass: string;
}

/**
 * Access level options for dropdown
 */
export const ACCESS_LEVEL_OPTIONS: AccessLevelInfo[] = [
  {
    value: DocumentAccessLevel.PUBLIC,
    label: 'Public',
    description: 'All authenticated users can access',
    color: 'green',
    bgClass: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
  },
  {
    value: DocumentAccessLevel.INTERNAL,
    label: 'Internal',
    description: 'Staff members only',
    color: 'yellow',
    bgClass: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
  },
  {
    value: DocumentAccessLevel.RESTRICTED,
    label: 'Restricted',
    description: 'Specific roles only',
    color: 'red',
    bgClass: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
  }
];

/**
 * Expiry status display information
 */
export interface ExpiryStatusInfo {
  value: DocumentExpiryStatus;
  label: string;
  color: string;
  bgClass: string;
}

/**
 * Expiry status options
 */
export const EXPIRY_STATUS_OPTIONS: ExpiryStatusInfo[] = [
  {
    value: 'valid',
    label: 'Valid',
    color: 'green',
    bgClass: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
  },
  {
    value: 'expiring_soon',
    label: 'Expiring Soon',
    color: 'yellow',
    bgClass: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
  },
  {
    value: 'expired',
    label: 'Expired',
    color: 'red',
    bgClass: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
  },
  {
    value: 'no_expiry',
    label: 'No Expiry',
    color: 'gray',
    bgClass: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  }
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get entity type display label
 */
export function getEntityTypeLabel(entityType: DocumentEntityType): string {
  const option = ENTITY_TYPE_OPTIONS.find(opt => opt.value === entityType);
  return option?.label || entityType;
}

/**
 * Get entity type badge color class
 */
export function getEntityTypeColor(entityType: DocumentEntityType): string {
  const option = ENTITY_TYPE_OPTIONS.find(opt => opt.value === entityType);
  return option?.bgClass || 'bg-gray-100 text-gray-800';
}

/**
 * Get access level display label
 */
export function getAccessLevelLabel(accessLevel: DocumentAccessLevel): string {
  const option = ACCESS_LEVEL_OPTIONS.find(opt => opt.value === accessLevel);
  return option?.label || accessLevel;
}

/**
 * Get access level description
 */
export function getAccessLevelDescription(accessLevel: DocumentAccessLevel): string {
  const option = ACCESS_LEVEL_OPTIONS.find(opt => opt.value === accessLevel);
  return option?.description || '';
}

/**
 * Get access level badge color class
 */
export function getAccessLevelColor(accessLevel: DocumentAccessLevel): string {
  const option = ACCESS_LEVEL_OPTIONS.find(opt => opt.value === accessLevel);
  return option?.bgClass || 'bg-gray-100 text-gray-800';
}

/**
 * Get expiry status based on expiry date
 */
export function getExpiryStatus(expiryDate: string | null | undefined): DocumentExpiryStatus {
  if (!expiryDate) return 'no_expiry';

  const expiry = new Date(expiryDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = expiry.getTime() - today.getTime();
  const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysUntilExpiry < 0) return 'expired';
  if (daysUntilExpiry <= 30) return 'expiring_soon';
  return 'valid';
}

/**
 * Calculate days until expiry
 */
export function getDaysUntilExpiry(expiryDate: string | null | undefined): number | null {
  if (!expiryDate) return null;

  const expiry = new Date(expiryDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get expiry status badge color class
 */
export function getExpiryStatusColor(status: DocumentExpiryStatus): string {
  const option = EXPIRY_STATUS_OPTIONS.find(opt => opt.value === status);
  return option?.bgClass || 'bg-gray-100 text-gray-800';
}

/**
 * Get expiry status display label
 */
export function getExpiryStatusLabel(status: DocumentExpiryStatus, daysUntilExpiry?: number | null): string {
  switch (status) {
    case 'valid':
      return 'Valid';
    case 'expiring_soon':
      return daysUntilExpiry !== undefined && daysUntilExpiry !== null
        ? `Expiring in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}`
        : 'Expiring Soon';
    case 'expired':
      if (daysUntilExpiry !== undefined && daysUntilExpiry !== null && daysUntilExpiry < 0) {
        const daysAgo = Math.abs(daysUntilExpiry);
        return `Expired ${daysAgo} day${daysAgo !== 1 ? 's' : ''} ago`;
      }
      return 'Expired';
    case 'no_expiry':
      return 'No Expiry';
    default:
      return 'Unknown';
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Check if file type can be previewed in browser
 */
export function canPreviewFileType(fileType: string): boolean {
  const previewableTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
  ];
  return previewableTypes.includes(fileType.toLowerCase());
}

/**
 * Check if file type is an image
 */
export function isImageFileType(fileType: string): boolean {
  return fileType.toLowerCase().startsWith('image/');
}

/**
 * Check if file type is a PDF
 */
export function isPdfFileType(fileType: string): boolean {
  return fileType.toLowerCase() === 'application/pdf';
}

/**
 * Get file icon based on file type
 */
export function getFileTypeIcon(fileType: string): string {
  const type = fileType.toLowerCase();
  if (type.startsWith('image/')) return 'image';
  if (type === 'application/pdf') return 'file-text';
  if (type.includes('word') || type.includes('document')) return 'file-text';
  if (type.includes('excel') || type.includes('spreadsheet')) return 'table';
  return 'file';
}

// ============================================================================
// FILE VALIDATION CONSTANTS
// ============================================================================

/**
 * Allowed file types for document upload
 */
export const ALLOWED_DOCUMENT_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

/**
 * Allowed file extensions
 */
export const ALLOWED_DOCUMENT_FILE_EXTENSIONS = [
  '.pdf',
  '.jpg',
  '.jpeg',
  '.png',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx'
];

/**
 * Maximum file size in bytes (10MB)
 */
export const MAX_DOCUMENT_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Maximum file size in MB for display
 */
export const MAX_DOCUMENT_FILE_SIZE_MB = 10;

/**
 * Validate file type
 */
export function isValidDocumentFileType(file: File): boolean {
  return ALLOWED_DOCUMENT_FILE_TYPES.includes(file.type);
}

/**
 * Validate file size
 */
export function isValidDocumentFileSize(file: File): boolean {
  return file.size <= MAX_DOCUMENT_FILE_SIZE;
}

/**
 * Common document types for suggestions
 */
export const COMMON_DOCUMENT_TYPES = [
  'Lease Agreement',
  'Rental Contract',
  'Insurance Certificate',
  'Trade License',
  'Emirates ID',
  'Passport Copy',
  'Visa Copy',
  'Bank Statement',
  'NOC Letter',
  'Inspection Report',
  'Maintenance Report',
  'Invoice',
  'Receipt',
  'Certificate',
  'Warranty Document',
  'User Manual',
  'Other'
];
