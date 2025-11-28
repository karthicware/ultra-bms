/**
 * Lease Extension and Renewal Types
 * Story 3.6: Tenant Lease Extension and Renewal
 *
 * Defines all types related to lease extensions, renewal requests, and expiry monitoring
 */

// ===========================
// Enums
// ===========================

export enum RentAdjustmentType {
  NO_CHANGE = 'NO_CHANGE',
  PERCENTAGE = 'PERCENTAGE',
  FLAT = 'FLAT',
  CUSTOM = 'CUSTOM'
}

export enum RenewalRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum LeaseExtensionStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  APPLIED = 'APPLIED'
}

// ===========================
// Core Entity Types
// ===========================

export interface LeaseExtension {
  id: string;
  tenantId: string;
  extensionNumber: string; // e.g., EXT-2025-0001

  // Date fields
  previousEndDate: string; // ISO date string
  newEndDate: string; // ISO date string
  effectiveDate: string; // ISO date string

  // Rent fields
  previousRent: number;
  newRent: number;
  adjustmentType: RentAdjustmentType;
  adjustmentValue: number; // percentage or flat amount

  // Terms
  renewalType?: string; // FIXED_TERM, MONTH_TO_MONTH, YEARLY
  autoRenewal: boolean;
  specialTerms?: string;
  paymentDueDate?: number; // day of month (1-28)

  // Workflow
  status: LeaseExtensionStatus;
  approvedBy?: string; // userId
  approvedAt?: string; // ISO datetime string
  rejectionReason?: string;
  appliedAt?: string; // ISO datetime string

  // Document
  amendmentDocumentPath?: string; // S3 path

  // Audit
  extendedAt: string; // ISO datetime string
  extendedBy: string; // userId
  createdAt: string;
  updatedAt: string;

  // Populated relations
  tenant?: {
    id: string;
    firstName: string;
    lastName: string;
    tenantNumber: string;
    email: string;
  };
  property?: {
    id: string;
    name: string;
  };
  unit?: {
    id: string;
    unitNumber: string;
    floor: number;
  };
}

export interface RenewalRequest {
  id: string;
  tenantId: string;
  requestNumber: string; // e.g., REN-2025-0001

  // Request details
  requestedAt: string; // ISO datetime string
  preferredTerm: string; // "12_MONTHS", "24_MONTHS", "OTHER"
  comments?: string;

  // Workflow
  status: RenewalRequestStatus;
  rejectedReason?: string;
  processedAt?: string; // ISO datetime string
  processedBy?: string; // userId

  // Conversion tracking
  leaseExtensionId?: string; // FK when converted to extension

  // Audit
  createdAt: string;
  updatedAt: string;

  // Populated relations
  tenant?: {
    id: string;
    firstName: string;
    lastName: string;
    tenantNumber: string;
    email: string;
    leaseEndDate: string;
    unitId: string;
    unit?: {
      unitNumber: string;
    };
  };
}

export interface ExpiringLease {
  tenantId: string;
  tenantNumber: string;
  tenantName: string;
  email: string;
  phone: string;

  propertyId: string;
  propertyName: string;

  unitId: string;
  unitNumber: string;
  floor: number;

  leaseStartDate: string;
  leaseEndDate: string;
  daysRemaining: number;

  currentRent: number;
  status: string;

  // Notification tracking
  notifiedAt90Days?: string;
  notifiedAt60Days?: string;
  notifiedAt30Days?: string;
  notifiedAt14Days?: string;

  // Renewal request status (if any)
  pendingRenewalRequest?: boolean;
  renewalRequestId?: string;
}

// ===========================
// API Request Types
// ===========================

export interface LeaseExtensionRequest {
  newEndDate: string; // ISO date string
  rentAdjustmentType: RentAdjustmentType;
  adjustmentValue?: number; // percentage (0-100) or flat amount (AED)
  customRent?: number; // for CUSTOM type
  renewalType?: string;
  autoRenewal?: boolean;
  specialTerms?: string;
  paymentDueDate?: number; // 1-28
}

export interface SubmitRenewalRequestPayload {
  preferredTerm: string; // "12_MONTHS", "24_MONTHS", "OTHER"
  comments?: string;
}

// Approval redirects to lease extension page - no additional payload needed
export type ApproveRenewalRequestPayload = Record<string, never>;

export interface RejectRenewalRequestPayload {
  reason: string;
}

// ===========================
// API Response Types
// ===========================

export interface LeaseExtensionResponse {
  success: boolean;
  data: {
    tenantId: string;
    newEndDate: string;
    newRent: number;
    extensionId: string;
    amendmentPdfUrl?: string; // presigned URL for download
  };
}

export interface RenewalRequestResponse {
  success: boolean;
  data: RenewalRequest;
  message?: string;
}

export interface ExpiringLeasesResponse {
  success: boolean;
  data: {
    expiring30Days: ExpiringLease[];
    expiring60Days: ExpiringLease[];
    expiring14Days: ExpiringLease[];
  };
  counts: {
    expiring30Days: number;
    expiring60Days: number;
    expiring14Days: number;
  };
}

export interface ExtensionHistoryResponse {
  success: boolean;
  data: LeaseExtension[];
}

// ===========================
// Paginated Types
// ===========================

export interface RenewalRequestPage {
  content: RenewalRequest[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

export interface LeaseExtensionPage {
  content: LeaseExtension[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

// ===========================
// Filter Types
// ===========================

export interface RenewalRequestFilters {
  status?: RenewalRequestStatus;
  propertyId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface ExpiringLeasesFilters {
  propertyId?: string;
  days?: number; // 14, 30, 60, 90
}

// ===========================
// Form Data Types
// ===========================

export interface LeaseExtensionFormData {
  tenantId: string;
  newEndDate: Date;
  rentAdjustmentType: RentAdjustmentType;
  percentageIncrease?: number;
  flatIncrease?: number;
  customRent?: number;
  renewalType?: string;
  autoRenewal: boolean;
  specialTerms?: string;
  paymentDueDate?: number;
}

export interface RenewalRequestFormData {
  preferredTerm: string;
  comments?: string;
}

// ===========================
// Current Lease Summary Type
// ===========================

export interface CurrentLeaseSummary {
  tenantId: string;
  tenantName: string;
  tenantNumber: string;

  propertyName: string;
  unitNumber: string;
  floor: number;

  leaseStartDate: string;
  leaseEndDate: string;
  daysRemaining: number;

  baseRent: number;
  serviceCharge: number;
  totalMonthlyRent: number;
  securityDeposit: number;

  paymentFrequency: string;
  paymentDueDate: number;
  leaseType: string;
}
