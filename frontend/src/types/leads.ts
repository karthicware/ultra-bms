/**
 * Lead Management Types
 * Defines all types related to lead management, document uploads, and communication history
 */

// ===========================
// Enums
// ===========================

export enum LeadStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  QUOTATION_SENT = 'QUOTATION_SENT',
  ACCEPTED = 'ACCEPTED',
  CONVERTED = 'CONVERTED',
  LOST = 'LOST'
}

export enum LeadSource {
  WEBSITE = 'WEBSITE',
  REFERRAL = 'REFERRAL',
  WALK_IN = 'WALK_IN',
  PHONE_CALL = 'PHONE_CALL',
  SOCIAL_MEDIA = 'SOCIAL_MEDIA',
  OTHER = 'OTHER'
}

export enum LeadDocumentType {
  EMIRATES_ID = 'EMIRATES_ID',
  PASSPORT = 'PASSPORT',
  MARRIAGE_CERTIFICATE = 'MARRIAGE_CERTIFICATE',
  VISA = 'VISA',
  SALARY_CERTIFICATE = 'SALARY_CERTIFICATE',
  BANK_STATEMENTS = 'BANK_STATEMENTS',
  OTHER = 'OTHER'
}

export enum LeadEventType {
  CREATED = 'CREATED',
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
  QUOTATION_CREATED = 'QUOTATION_CREATED',
  QUOTATION_SENT = 'QUOTATION_SENT',
  STATUS_CHANGED = 'STATUS_CHANGED'
}

// ===========================
// Core Entity Types
// ===========================

export interface Lead {
  id: string;
  leadNumber: string;
  fullName: string;
  emiratesId: string;
  passportNumber: string;
  passportExpiryDate: string; // ISO date string
  homeCountry: string;
  email: string;
  contactNumber: string;
  leadSource: LeadSource;
  notes?: string;
  status: LeadStatus;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  createdBy: string; // userId
  propertyInterest?: string; // Property name or ID
}

export interface LeadDocument {
  id: string;
  leadId: string;
  documentType: LeadDocumentType;
  fileName: string;
  filePath: string;
  fileSize: number; // in bytes
  uploadedBy: string; // userId
  uploadedAt: string; // ISO date string
}

export interface LeadHistory {
  id: string;
  leadId: string;
  eventType: LeadEventType;
  eventData: Record<string, unknown>; // JSON data
  createdAt: string; // ISO date string
  createdBy: string; // userId
}

// ===========================
// API Request Types
// ===========================

export interface CreateLeadRequest {
  fullName: string;
  email: string;
  contactNumber: string;
  leadSource: LeadSource;
  notes?: string;
  propertyInterest?: string;
}

export interface UpdateLeadRequest {
  fullName?: string;
  emiratesId?: string;
  passportNumber?: string;
  passportExpiryDate?: string;
  homeCountry?: string;
  email?: string;
  contactNumber?: string;
  leadSource?: LeadSource;
  notes?: string;
  status?: LeadStatus;
  propertyInterest?: string;
}

export interface LeadSearchParams {
  page?: number;
  size?: number;
  sort?: string;
  direction?: 'ASC' | 'DESC';
  status?: LeadStatus[];
  propertyId?: string;
  leadSource?: LeadSource[];
  searchTerm?: string; // Search across name, email, phone, Emirates ID
  dateFrom?: string; // ISO date string
  dateTo?: string; // ISO date string
}

export interface UploadDocumentRequest {
  file: File;
  documentType: LeadDocumentType;
}

// ===========================
// API Response Types
// ===========================

export interface LeadResponse {
  success: boolean;
  data: Lead;
  timestamp: string;
}

export interface LeadListResponse {
  success: boolean;
  data: {
    content: Lead[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
  timestamp: string;
}

export interface LeadDocumentResponse {
  success: boolean;
  data: LeadDocument;
  timestamp: string;
}

export interface LeadDocumentListResponse {
  success: boolean;
  data: LeadDocument[];
  timestamp: string;
}

export interface LeadHistoryResponse {
  success: boolean;
  data: {
    content: LeadHistory[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
  };
  timestamp: string;
}

// ===========================
// Form Data Types
// ===========================

export interface LeadFormData {
  fullName: string;
  emiratesId: string;
  passportNumber: string;
  passportExpiryDate: Date | string;
  homeCountry: string;
  email: string;
  contactNumber: string;
  leadSource: LeadSource;
  notes?: string;
  propertyInterest?: string;
}

export interface LeadDocumentUploadFormData {
  file: File;
  documentType: LeadDocumentType;
}

// ===========================
// Utility Types
// ===========================

export interface LeadSearchFilters {
  status: LeadStatus[];
  leadSource: LeadSource[];
  propertyId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface LeadTableRow extends Lead {
  daysInPipeline: number; // Calculated: today - createdAt
}

// ===========================
// Error Types
// ===========================

export type LeadErrorCode =
  | 'LEAD_NOT_FOUND'
  | 'DUPLICATE_LEAD'
  | 'INVALID_EMIRATES_ID'
  | 'INVALID_EMAIL'
  | 'INVALID_PHONE'
  | 'DOCUMENT_UPLOAD_FAILED'
  | 'DOCUMENT_TOO_LARGE'
  | 'INVALID_FILE_TYPE'
  | 'LEAD_ALREADY_CONVERTED';
