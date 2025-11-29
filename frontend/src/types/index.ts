// Common Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    field?: string;
  };
  timestamp: string;
}

// Pagination
export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

// Module-specific types
export * from './auth';
export * from './leads';
export * from './quotations';
export * from './properties';
export * from './units';
export * from './tenant';
export * from './tenant-portal';
export * from './maintenance';
export * from './work-orders';
export * from './work-order-assignment';
export * from './pm-schedule';
export * from './work-order-progress';
export * from './vendors';
export * from './vendor-documents';
export * from './vendor-ratings';
export * from './invoice';
export * from './expense';
export * from './lease';
export * from './checkout';
export * from './parking';
export * from './pdc';
export * from './asset';
export * from './reports';
export * from './compliance';
export * from './announcement';
// Exclude conflicting types from document.ts that are already exported from vendor-documents.ts
// (ExpiringDocument, ExpiringDocumentsFilter, ExpiringDocumentsResponse)
export {
  DocumentEntityType,
  DocumentAccessLevel,
  type DocumentExpiryStatus,
  type Document,
  type DocumentListItem,
  type DocumentVersion,
  type DocumentUpload,
  type DocumentUpdate,
  type DocumentReplace,
  type DocumentFilters,
  type DocumentResponse,
  type DocumentListResponse,
  type DocumentDetailResponse,
  type DocumentVersionsResponse,
  type DownloadUrlResponse,
  type PreviewUrlResponse,
  type EntityTypeInfo,
  ENTITY_TYPE_OPTIONS,
  type AccessLevelInfo,
  ACCESS_LEVEL_OPTIONS,
  type ExpiryStatusInfo,
  EXPIRY_STATUS_OPTIONS,
  getEntityTypeLabel,
  getEntityTypeColor,
  getAccessLevelLabel,
  getAccessLevelDescription,
  getAccessLevelColor,
  getExpiryStatus,
  getDaysUntilExpiry,
  getExpiryStatusColor,
  getExpiryStatusLabel,
  formatFileSize,
  canPreviewFileType,
  isImageFileType,
  isPdfFileType,
  getFileTypeIcon,
  ALLOWED_DOCUMENT_FILE_TYPES,
  ALLOWED_DOCUMENT_FILE_EXTENSIONS,
  MAX_DOCUMENT_FILE_SIZE,
  MAX_DOCUMENT_FILE_SIZE_MB,
  isValidDocumentFileType,
  isValidDocumentFileSize,
  COMMON_DOCUMENT_TYPES,
} from './document';
