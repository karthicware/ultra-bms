/**
 * Quotation Management Types
 * Defines all types related to quotation creation, management, and conversion
 */

// ===========================
// Enums
// ===========================

export enum QuotationStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
  CONVERTED = 'CONVERTED'
}

export enum StayType {
  STUDIO = 'STUDIO',
  ONE_BHK = 'ONE_BHK',
  TWO_BHK = 'TWO_BHK',
  THREE_BHK = 'THREE_BHK',
  VILLA = 'VILLA'
}

// ===========================
// Core Entity Types
// ===========================

export interface Quotation {
  id: string;
  quotationNumber: string;
  leadId: string;
  leadName?: string; // For display purposes
  propertyId: string;
  propertyName?: string; // For display purposes
  unitId: string;
  unitNumber?: string; // For display purposes
  stayType: StayType;
  issueDate: string; // ISO date string
  validityDate: string; // ISO date string

  // Rent breakdown
  baseRent: number; // Monthly rent
  serviceCharges: number;
  parkingSpotId?: string | null; // Optional parking spot UUID
  parkingSpotNumber?: string | null; // Spot number for display
  parkingFee?: number; // Optional parking fee (editable)
  securityDeposit: number;
  adminFee: number; // One-time
  totalFirstPayment: number; // Calculated

  // Document requirements
  documentRequirements: string[]; // Array of required document types

  // Terms and conditions
  paymentTerms: string;
  moveinProcedures: string;
  cancellationPolicy: string;
  specialTerms?: string;

  // SCP-2025-12-04: Identity document fields (moved from Lead)
  emiratesIdNumber?: string;
  emiratesIdExpiry?: string; // ISO date string
  passportNumber?: string;
  passportExpiry?: string; // ISO date string
  nationality?: string;
  emiratesIdFrontPath?: string;
  emiratesIdBackPath?: string;
  passportPath?: string;

  // Status and timestamps
  status: QuotationStatus;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  sentAt?: string; // ISO date string
  acceptedAt?: string; // ISO date string
  rejectedAt?: string; // ISO date string
  rejectionReason?: string;
  createdBy: string; // userId
}

// ===========================
// API Request Types
// ===========================

export interface CreateQuotationRequest {
  leadId: string;
  issueDate: string; // ISO date string
  validityDate: string; // ISO date string
  propertyId: string;
  unitId: string;
  baseRent: number;
  serviceCharges: number;
  parkingSpotId?: string | null; // Optional parking spot UUID
  parkingFee?: number; // Optional parking fee (editable)
  securityDeposit: number;
  adminFee: number;
  documentRequirements: string[];
  // SCP-2025-12-04: Identity document fields (moved from Lead)
  emiratesIdNumber: string;
  emiratesIdExpiry: string; // ISO date string
  passportNumber: string;
  passportExpiry: string; // ISO date string
  nationality: string;
  // Document file paths (set after S3 upload)
  emiratesIdFrontPath?: string;
  emiratesIdBackPath?: string;
  passportPath?: string;
  paymentTerms: string;
  moveinProcedures: string;
  cancellationPolicy: string;
  specialTerms?: string;
}

export interface UpdateQuotationRequest {
  issueDate?: string;
  validityDate?: string;
  propertyId?: string;
  unitId?: string;
  baseRent?: number;
  serviceCharges?: number;
  parkingSpotId?: string | null;
  parkingFee?: number;
  securityDeposit?: number;
  adminFee?: number;
  documentRequirements?: string[];
  // SCP-2025-12-04: Identity document fields (moved from Lead)
  emiratesIdNumber?: string;
  emiratesIdExpiry?: string;
  passportNumber?: string;
  passportExpiry?: string;
  nationality?: string;
  emiratesIdFrontPath?: string;
  emiratesIdBackPath?: string;
  passportPath?: string;
  paymentTerms?: string;
  moveinProcedures?: string;
  cancellationPolicy?: string;
  specialTerms?: string;
}

export interface QuotationSearchParams {
  page?: number;
  size?: number;
  sort?: string;
  direction?: 'ASC' | 'DESC';
  status?: QuotationStatus[];
  propertyId?: string;
  leadId?: string;
  dateFrom?: string; // ISO date string
  dateTo?: string; // ISO date string
}

export interface RejectQuotationRequest {
  reason: string;
}

// ===========================
// API Response Types
// ===========================

export interface QuotationResponse {
  success: boolean;
  data: Quotation;
  timestamp: string;
}

export interface QuotationListResponse {
  success: boolean;
  data: {
    content: Quotation[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
  timestamp: string;
}

export interface QuotationDashboard {
  newQuotes: number; // Last 30 days
  quotesConverted: number; // Last 30 days
  conversionRate: number; // Percentage
  avgTimeToConvert: number; // Days
  expiringQuotes: QuotationExpiryInfo[];
}

export interface QuotationDashboardResponse {
  success: boolean;
  data: QuotationDashboard;
  timestamp: string;
}

export interface QuotationExpiryInfo {
  id: string;
  quotationNumber: string;
  leadName: string;
  propertyName: string;
  validityDate: string; // ISO date string
  daysRemaining: number;
  urgency: 'high' | 'medium' | 'low'; // < 7 days, 7-14 days, 14+ days
}

// ===========================
// Form Data Types
// ===========================

export interface QuotationFormData {
  leadId: string;
  issueDate: Date | string;
  validityDate: Date | string;
  propertyId: string;
  unitId: string;
  stayType: StayType;
  baseRent: number;
  serviceCharges: number;
  parkingSpotId?: string | null;
  parkingFee?: number;
  securityDeposit: number;
  adminFee: number;
  documentRequirements: string[];
  paymentTerms: string;
  moveinProcedures: string;
  cancellationPolicy: string;
  specialTerms?: string;
}

export interface RejectQuotationFormData {
  reason: string;
}

// ===========================
// Utility Types
// ===========================

export interface QuotationCalculation {
  baseRent: number;
  serviceCharges: number;
  parkingFee: number; // Single spot fee (or 0 if no parking)
  securityDeposit: number;
  adminFee: number;
  totalFirstPayment: number; // Sum of all above
}

export interface QuotationSearchFilters {
  status: QuotationStatus[];
  propertyId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface QuotationTableRow extends Quotation {
  leadStatus?: string; // Lead's current status
  isExpiring?: boolean; // Within 30 days
}

// ===========================
// Sales Funnel Types
// ===========================

export interface SalesFunnelData {
  quotesIssued: number;
  quotesAccepted: number;
  quotesConverted: number;
}

// ===========================
// Default Values
// ===========================

export const DEFAULT_QUOTATION_TERMS = {
  paymentTerms: `Payment Terms:
1. First payment includes: Security deposit + Admin fee + First month rent + Service charges + Parking fee
2. Subsequent monthly payments due on the 1st of each month
3. Payment methods: Bank transfer, Cheque
4. Late payment penalty: 5% of monthly rent after 7 days
5. All payments in AED`,

  moveinProcedures: `Move-in Procedures:
1. Submit signed lease agreement
2. Provide post-dated cheques for rent duration
3. Complete move-in inspection checklist
4. Receive keys and access cards
5. Register with building management
6. Submit utility connection requests`,

  cancellationPolicy: `Cancellation Policy:
1. Cancellation before move-in: Security deposit refundable minus admin fee
2. Cancellation after move-in: Subject to lease agreement terms
3. Notice period: 30 days written notice required
4. Early termination: 2 months rent penalty
5. Damage beyond normal wear: Deducted from security deposit`
};

// ===========================
// Error Types
// ===========================

export type QuotationErrorCode =
  | 'QUOTATION_NOT_FOUND'
  | 'QUOTATION_ALREADY_SENT'
  | 'QUOTATION_ALREADY_ACCEPTED'
  | 'QUOTATION_EXPIRED'
  | 'UNIT_NOT_AVAILABLE'
  | 'INVALID_VALIDITY_DATE'
  | 'LEAD_NOT_FOUND'
  | 'EMAIL_SEND_FAILED'
  | 'PDF_GENERATION_FAILED';

// ===========================
// Conversion Types
// ===========================

/**
 * Response from lead to tenant conversion
 * Contains pre-populated data for tenant onboarding
 */
export interface LeadConversionResponse {
  // Lead information
  leadId: string;
  leadNumber: string;
  fullName: string;
  emiratesId: string;
  passportNumber: string;
  passportExpiryDate: string;
  homeCountry: string;
  email: string;
  contactNumber: string;

  // Quotation information
  quotationId: string;
  quotationNumber: string;
  propertyId: string;
  unitId: string;
  baseRent: number;
  serviceCharges: number;
  parkingSpotId?: string | null;
  parkingFee?: number;
  securityDeposit: number;
  adminFee: number;
  totalFirstPayment: number;

  // Conversion metadata
  message: string;
}

export interface LeadConversionAPIResponse {
  success: boolean;
  data: LeadConversionResponse;
  message: string;
}
