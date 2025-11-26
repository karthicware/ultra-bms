/**
 * Vendor Document Management Types and Interfaces
 * Story 5.2: Vendor Document and License Management
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Document type enum
 * Types of documents vendors can upload
 */
export enum DocumentType {
  TRADE_LICENSE = 'TRADE_LICENSE',
  INSURANCE = 'INSURANCE',
  CERTIFICATION = 'CERTIFICATION',
  ID_COPY = 'ID_COPY'
}

/**
 * Expiry status for documents
 * Calculated based on expiry date
 */
export enum ExpiryStatus {
  VALID = 'VALID',
  EXPIRING_SOON = 'EXPIRING_SOON',
  EXPIRED = 'EXPIRED'
}

// ============================================================================
// MAIN INTERFACES
// ============================================================================

/**
 * Vendor document entity
 * Complete document information from backend
 */
export interface VendorDocument {
  id: string;
  vendorId: string;
  documentType: DocumentType;
  fileName: string;
  filePath: string;
  fileSize: number;
  fileType: string; // MIME type
  expiryDate?: string; // ISO date string
  notes?: string;
  uploadedBy: string;
  uploadedAt: string; // ISO datetime string
  expiryStatus: ExpiryStatus;
  downloadUrl?: string; // Presigned S3 URL
}

/**
 * Vendor document list item for table view
 */
export interface VendorDocumentListItem {
  id: string;
  documentType: DocumentType;
  fileName: string;
  fileSize?: number;
  fileType?: string; // MIME type for icon display
  expiryDate?: string;
  expiryStatus?: ExpiryStatus;
  uploadedAt: string;
  daysUntilExpiry?: number;
}

/**
 * Expiring document for dashboard/alerts
 * Includes vendor info for context
 */
export interface ExpiringDocument {
  id: string;
  vendorId: string;
  vendorNumber: string;
  companyName: string;
  documentType: DocumentType;
  fileName: string;
  expiryDate: string;
  daysUntilExpiry: number;
  isCritical?: boolean; // True for TRADE_LICENSE and INSURANCE
}

// ============================================================================
// DTO INTERFACES
// ============================================================================

/**
 * Request DTO for uploading a vendor document
 * File is handled separately as multipart
 */
export interface VendorDocumentUploadDto {
  documentType: DocumentType;
  expiryDate?: string; // ISO date string, required for TRADE_LICENSE and INSURANCE
  notes?: string;
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
export interface UploadDocumentResponse {
  success: boolean;
  message: string;
  data: VendorDocument;
  timestamp: string;
}

/**
 * Response from list vendor documents endpoint
 */
export interface VendorDocumentsResponse {
  success: boolean;
  message: string;
  data: VendorDocumentListItem[];
  timestamp: string;
}

/**
 * Response from get document endpoint (with download URL)
 */
export interface GetDocumentResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    downloadUrl: string;
    fileName: string;
    fileType: string;
  };
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

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Document type display information
 */
export interface DocumentTypeInfo {
  value: DocumentType;
  label: string;
  requiresExpiry: boolean;
  description: string;
}

/**
 * Document type options for dropdown
 */
export const DOCUMENT_TYPE_OPTIONS: DocumentTypeInfo[] = [
  {
    value: DocumentType.TRADE_LICENSE,
    label: 'Trade License',
    requiresExpiry: true,
    description: 'Business trade license document'
  },
  {
    value: DocumentType.INSURANCE,
    label: 'Insurance Certificate',
    requiresExpiry: true,
    description: 'Liability or professional insurance'
  },
  {
    value: DocumentType.CERTIFICATION,
    label: 'Certification',
    requiresExpiry: false,
    description: 'Professional or trade certification'
  },
  {
    value: DocumentType.ID_COPY,
    label: 'ID Copy',
    requiresExpiry: false,
    description: 'Emirates ID or passport copy'
  }
];

/**
 * Check if document type requires expiry date
 */
export function requiresExpiryDate(documentType: DocumentType): boolean {
  return documentType === DocumentType.TRADE_LICENSE || documentType === DocumentType.INSURANCE;
}

/**
 * Check if document type is critical (affects vendor status)
 */
export function isCriticalDocumentType(documentType: DocumentType): boolean {
  return documentType === DocumentType.TRADE_LICENSE || documentType === DocumentType.INSURANCE;
}

/**
 * Get expiry status based on expiry date
 */
export function getExpiryStatus(expiryDate: string | null | undefined): ExpiryStatus {
  if (!expiryDate) return ExpiryStatus.VALID;

  const expiry = new Date(expiryDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = expiry.getTime() - today.getTime();
  const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysUntilExpiry < 0) return ExpiryStatus.EXPIRED;
  if (daysUntilExpiry <= 30) return ExpiryStatus.EXPIRING_SOON;
  return ExpiryStatus.VALID;
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
export function getExpiryStatusColor(status: ExpiryStatus): string {
  switch (status) {
    case ExpiryStatus.VALID:
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case ExpiryStatus.EXPIRING_SOON:
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case ExpiryStatus.EXPIRED:
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Get expiry status display label
 */
export function getExpiryStatusLabel(status: ExpiryStatus, daysUntilExpiry?: number): string {
  switch (status) {
    case ExpiryStatus.VALID:
      return 'Valid';
    case ExpiryStatus.EXPIRING_SOON:
      return daysUntilExpiry !== undefined
        ? `Expiring in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}`
        : 'Expiring Soon';
    case ExpiryStatus.EXPIRED:
      if (daysUntilExpiry !== undefined && daysUntilExpiry < 0) {
        const daysAgo = Math.abs(daysUntilExpiry);
        return `Expired ${daysAgo} day${daysAgo !== 1 ? 's' : ''} ago`;
      }
      return 'Expired';
    default:
      return 'Unknown';
  }
}

/**
 * Get document type display label
 */
export function getDocumentTypeLabel(documentType: DocumentType): string {
  const option = DOCUMENT_TYPE_OPTIONS.find(opt => opt.value === documentType);
  return option?.label || documentType.replace(/_/g, ' ');
}

/**
 * Get document type badge color class
 */
export function getDocumentTypeColor(documentType: DocumentType): string {
  switch (documentType) {
    case DocumentType.TRADE_LICENSE:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case DocumentType.INSURANCE:
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
    case DocumentType.CERTIFICATION:
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300';
    case DocumentType.ID_COPY:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    default:
      return 'bg-gray-100 text-gray-800';
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

// ============================================================================
// FILE VALIDATION CONSTANTS
// ============================================================================

/**
 * Allowed file types for document upload
 */
export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png'
];

/**
 * Allowed file extensions
 */
export const ALLOWED_FILE_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];

/**
 * Maximum file size in bytes (10MB)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Maximum file size in MB for display
 */
export const MAX_FILE_SIZE_MB = 10;

/**
 * Validate file type
 */
export function isValidFileType(file: File): boolean {
  return ALLOWED_FILE_TYPES.includes(file.type);
}

/**
 * Validate file size
 */
export function isValidFileSize(file: File): boolean {
  return file.size <= MAX_FILE_SIZE;
}
