/**
 * Tenant Management Types
 * Defines all types related to tenant onboarding, lease management, and documents
 */

// ===========================
// Enums
// ===========================

export enum LeaseType {
  FIXED_TERM = 'FIXED_TERM',
  MONTH_TO_MONTH = 'MONTH_TO_MONTH',
  YEARLY = 'YEARLY'
}

export enum PaymentFrequency {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY'
}

export enum PaymentMethod {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CARD = 'CARD',
  CHEQUE = 'CHEQUE',
  PDC = 'PDC',
  ONLINE = 'ONLINE'
}

export enum TenantDocumentType {
  EMIRATES_ID = 'EMIRATES_ID',
  PASSPORT = 'PASSPORT',
  VISA = 'VISA',
  SIGNED_LEASE = 'SIGNED_LEASE',
  MULKIYA = 'MULKIYA',
  OTHER = 'OTHER'
}

export enum TenantStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  TERMINATED = 'TERMINATED'
}

// ===========================
// Bank Account Types
// Story 3.9: Tenant Onboarding Bank Account Integration
// ===========================

/**
 * Bank account summary for tenant display
 * AC #4: Update TenantResponse to include bank account details
 */
export interface BankAccountSummary {
  id: string;
  bankName: string;
  accountName: string;
  maskedAccountNumber: string; // e.g., "****1234"
}

// ===========================
// Core Entity Types
// ===========================

export interface Tenant {
  id: string;
  userId: string; // FK to User table
  unitId: string; // FK to Unit
  propertyId: string; // FK to Property

  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string; // ISO date string
  nationalId: string;
  nationality: string;
  emergencyContactName: string;
  emergencyContactPhone: string;

  // Lease Information
  leaseStartDate: string; // ISO date string
  leaseEndDate: string; // ISO date string
  leaseDuration: number; // in months
  leaseType: LeaseType;
  renewalOption: boolean;

  // Rent Breakdown
  baseRent: number;
  adminFee: number;
  serviceCharge: number;
  securityDeposit: number;
  totalMonthlyRent: number; // calculated: baseRent + serviceCharge + parking fees

  // Parking Allocation
  parkingSpots: number;
  parkingFeePerSpot: number;
  spotNumbers?: string; // comma-separated
  mulkiyaDocumentPath?: string; // S3 path to single Mulkiya document

  // Payment Schedule
  paymentFrequency: PaymentFrequency;
  paymentDueDate: number; // day of month (1-31)
  paymentMethod: PaymentMethod;
  pdcChequeCount?: number; // required if paymentMethod = PDC

  // Bank Account (Story 3.9)
  bankAccount?: BankAccountSummary; // Optional - used for rent payment instructions on invoices

  // Metadata
  tenantNumber: string; // e.g., TNT-2025-0001
  status: TenantStatus;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  createdBy: string; // userId

  // Relations (populated in responses)
  property?: {
    id: string;
    name: string;
    address: string;
  };
  unit?: {
    id: string;
    unitNumber: string;
    floor: number;
    bedrooms: number;
    bathrooms: number;
  };

  // Lead conversion tracking
  leadId?: string; // FK to Lead (if converted from lead)
  quotationId?: string; // FK to Quotation (if converted from quotation)
}

export interface TenantDocument {
  id: string;
  tenantId: string;
  documentType: TenantDocumentType;
  fileName: string;
  filePath: string; // S3 path
  fileSize: number; // in bytes
  uploadedBy: string; // userId
  uploadedAt: string; // ISO date string
}

// ===========================
// API Request Types
// ===========================

export interface CreateTenantRequest {
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string; // ISO date string
  nationalId: string;
  nationality: string;
  emergencyContactName: string;
  emergencyContactPhone: string;

  // Lease Information
  propertyId: string;
  unitId: string;
  leaseStartDate: string; // ISO date string
  leaseEndDate: string; // ISO date string
  leaseType: LeaseType;
  renewalOption: boolean;

  // Rent Breakdown
  baseRent: number;
  adminFee: number;
  serviceCharge: number;
  securityDeposit: number;

  // Parking Allocation (optional)
  parkingSpots: number;
  parkingFeePerSpot: number;
  spotNumbers?: string;

  // Payment Schedule
  paymentFrequency: PaymentFrequency;
  paymentDueDate: number; // 1-31
  paymentMethod: PaymentMethod;
  pdcChequeCount?: number;

  // Bank Account (Story 3.9)
  // AC #3: Update TenantRequest DTO to accept bankAccountId (optional)
  bankAccountId?: string; // Optional - FK to BankAccount

  // Lead conversion (optional)
  leadId?: string;
  quotationId?: string;

  // Documents will be sent as multipart/form-data
  // File fields: emiratesId, passport, visa, signedLease, mulkiya, additionalDocuments[]
}

export interface UpdateTenantRequest {
  // Only updatable fields
  phone?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  parkingSpots?: number;
  parkingFeePerSpot?: number;
  spotNumbers?: string;
  status?: TenantStatus;
}

// ===========================
// API Response Types
// ===========================

export interface CreateTenantResponse {
  id: string;
  tenantNumber: string;
  userId: string; // newly created user account
  message: string; // e.g., "Tenant registered successfully! Welcome email sent to tenant@email.com"
}

export interface TenantResponse {
  id: string;
  userId: string;
  unitId: string;
  propertyId: string;

  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  nationalId: string;
  nationality: string;
  emergencyContactName: string;
  emergencyContactPhone: string;

  // Lease Information
  leaseStartDate: string;
  leaseEndDate: string;
  leaseDuration: number;
  leaseType: LeaseType;
  renewalOption: boolean;

  // Rent Breakdown
  baseRent: number;
  adminFee: number;
  serviceCharge: number;
  securityDeposit: number;
  totalMonthlyRent: number;

  // Parking
  parkingSpots: number;
  parkingFeePerSpot: number;
  spotNumbers?: string;
  mulkiyaDocumentPath?: string;

  // Payment Schedule
  paymentFrequency: PaymentFrequency;
  paymentDueDate: number;
  paymentMethod: PaymentMethod;
  pdcChequeCount?: number;

  // Bank Account (Story 3.9)
  // AC #4: Update TenantResponse to include bank account details
  bankAccount?: BankAccountSummary; // Optional - used for rent payment instructions on invoices

  // Metadata
  tenantNumber: string;
  status: TenantStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: string;

  // Populated relations
  property: {
    id: string;
    name: string;
    address: string;
  };
  unit: {
    id: string;
    unitNumber: string;
    floor: number;
    bedrooms: number;
    bathrooms: number;
  };

  // Documents
  documents: TenantDocument[];

  // Lead conversion
  leadId?: string;
  quotationId?: string;
}

// ===========================
// Multi-Step Wizard Form Types
// ===========================

export interface PersonalInfoFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: Date; // Required - validated by zod schema
  nationalId: string;
  nationality: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
}

export interface LeaseInfoFormData {
  propertyId: string;
  unitId: string;
  leaseStartDate: Date;
  leaseEndDate: Date;
  leaseDuration: number; // calculated
  leaseType: LeaseType;
  renewalOption: boolean;
}

export interface RentBreakdownFormData {
  baseRent: number;
  adminFee: number;
  serviceCharge: number;
  securityDeposit: number;
  totalMonthlyRent: number; // calculated
}

export interface ParkingAllocationFormData {
  parkingSpots: number;
  parkingFeePerSpot: number;
  spotNumbers: string;
  mulkiyaFile: File | null;
}

export interface PaymentScheduleFormData {
  paymentFrequency: PaymentFrequency;
  paymentDueDate: number;
  paymentMethod: PaymentMethod;
  pdcChequeCount: number;
}

// SCP-2025-12-07: Updated to support separate front/back uploads for Emirates ID and Passport
// SCP-2025-12-09: Added chequeFiles for scanned cheque copies (max 12 files)
export interface TenantDocumentUploadFormData {
  emiratesIdFile: File | null;        // Front side (required unless preloaded)
  emiratesIdBackFile?: File | null;   // Back side (optional)
  passportFile: File | null;          // Front side (required unless preloaded)
  passportBackFile?: File | null;     // Back side (optional)
  visaFile?: File | null;
  signedLeaseFile: File | null;
  additionalFiles: File[];
  chequeFiles?: File[];               // Scanned cheque copies (max 12 files)
}

// SCP-2025-12-07: Extended rent breakdown form data to include payment due date
// (moved from Step 5 Payment Schedule to Step 3 Rent Breakdown)
export interface ExtendedRentBreakdownFormData extends RentBreakdownFormData {
  yearlyRentAmount?: number;
  numberOfCheques?: number;
  firstMonthPaymentMethod?: 'CASH' | 'CHEQUE';
  chequeBreakdown?: unknown[]; // ChequeBreakdownItem[]
  firstMonthTotal?: number;
  paymentDueDate?: number; // Day of month (1-31), defaults to 5
}

// Combined form data for all steps
// SCP-2025-12-10: Reduced from 6 to 5 steps - Replaced rentBreakdown and parkingAllocation with financialInfo
export interface TenantOnboardingFormData {
  personalInfo: PersonalInfoFormData;
  leaseInfo: LeaseInfoFormData & {
    propertyName?: string;
    unitNumber?: string;
  };
  // SCP-2025-12-10: Financial info includes cheque details from OCR processing
  financialInfo: {
    chequeDetails: Array<{
      chequeIndex: number;
      bankName?: string;
      chequeNumber?: string;
      amount?: number;
      chequeDate?: string;
      status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
      confidenceScore: number;
    }>;
    bankAccountId?: string;
    bankAccountName?: string;
    bankName?: string;
    // From quotation (read-only display)
    yearlyRentAmount?: number;
    numberOfCheques?: number;
    firstMonthPaymentMethod?: 'CASH' | 'CHEQUE';
    baseRent?: number;
    serviceCharge?: number;
    adminFee?: number;
    securityDeposit?: number;
    parkingFee?: number;
  };
  documentUpload: TenantDocumentUploadFormData;

  // Optional lead conversion data
  fromLead?: string;
  fromQuotation?: string;
}

// ===========================
// Utility Types
// ===========================

/**
 * SCP-2025-12-06: Extended to include document paths for tenant onboarding
 */
export interface LeadConversionData {
  leadId: string;
  quotationId: string;
  leadNumber?: string;
  quotationNumber?: string;

  // Pre-populated personal info from lead
  fullName?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  contactNumber?: string; // alias for phone
  nationalId: string;
  nationality: string;

  // Identity documents info (from quotation)
  emiratesId?: string;
  emiratesIdExpiry?: string; // ISO date string
  passportNumber?: string;
  passportExpiryDate?: string; // ISO date string

  // SCP-2025-12-06: Document file paths (S3 storage)
  emiratesIdFrontPath?: string;
  emiratesIdBackPath?: string;
  passportFrontPath?: string;
  passportBackPath?: string;

  // Pre-populated lease info from quotation
  propertyId: string;
  propertyName?: string; // Display name
  unitId: string;
  unitNumber?: string; // Display number
  baseRent: number;
  serviceCharge: number;
  serviceCharges?: number; // alias
  adminFee: number;
  securityDeposit: number;
  totalFirstPayment?: number;
  parkingSpots: number;
  parkingFeePerSpot: number;
  parkingSpotId?: string | null;
  parkingFee?: number;

  // SCP-2025-12-06: Cheque breakdown for auto-population
  yearlyRentAmount?: number;
  numberOfCheques?: number;
  firstMonthPaymentMethod?: 'CASH' | 'CHEQUE';
  chequeBreakdown?: string; // JSON string

  // Terms (from quotation)
  paymentTerms?: string;
  moveinProcedures?: string;
  cancellationPolicy?: string;
  specialTerms?: string;

  // Bank account info (populated during financial info step)
  bankAccountId?: string;
  bankAccountName?: string;
  bankName?: string;

  // Metadata
  message?: string;
}

export interface FileValidationError {
  file: File;
  error: string; // e.g., "File size exceeds 5MB", "Invalid file type"
}

export interface UploadedFilePreview {
  file: File;
  preview: string; // data URL for image preview
  name: string;
  size: number;
  type: string;
}
