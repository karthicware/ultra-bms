/**
 * Tenant Checkout and Deposit Refund Types
 * Story 3.7: Tenant Checkout and Deposit Refund Processing
 *
 * Defines all types related to tenant checkout, deposit refund, and inspection
 */

// ===========================
// Enums
// ===========================

/**
 * Reasons for tenant checkout
 */
export enum CheckoutReason {
  LEASE_END = 'LEASE_END',
  EARLY_TERMINATION = 'EARLY_TERMINATION',
  EVICTION = 'EVICTION',
  MUTUAL_AGREEMENT = 'MUTUAL_AGREEMENT',
  OTHER = 'OTHER'
}

/**
 * Status of checkout process
 */
export enum CheckoutStatus {
  PENDING = 'PENDING',
  INSPECTION_SCHEDULED = 'INSPECTION_SCHEDULED',
  INSPECTION_COMPLETE = 'INSPECTION_COMPLETE',
  DEPOSIT_CALCULATED = 'DEPOSIT_CALCULATED',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REFUND_PROCESSING = 'REFUND_PROCESSING',
  REFUND_PROCESSED = 'REFUND_PROCESSED',
  COMPLETED = 'COMPLETED',
  ON_HOLD = 'ON_HOLD'
}

/**
 * Deposit refund methods
 */
export enum RefundMethod {
  BANK_TRANSFER = 'BANK_TRANSFER',
  CHEQUE = 'CHEQUE',
  CASH = 'CASH'
}

/**
 * Status of deposit refund
 */
export enum RefundStatus {
  CALCULATED = 'CALCULATED',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ON_HOLD = 'ON_HOLD'
}

/**
 * Inspection item condition ratings
 */
export enum ItemCondition {
  GOOD = 'GOOD',
  FAIR = 'FAIR',
  DAMAGED = 'DAMAGED',
  MISSING = 'MISSING'
}

/**
 * Types of deductions from deposit
 */
export enum DeductionType {
  UNPAID_RENT = 'UNPAID_RENT',
  UNPAID_UTILITIES = 'UNPAID_UTILITIES',
  DAMAGE_REPAIRS = 'DAMAGE_REPAIRS',
  CLEANING_FEE = 'CLEANING_FEE',
  KEY_REPLACEMENT = 'KEY_REPLACEMENT',
  EARLY_TERMINATION_PENALTY = 'EARLY_TERMINATION_PENALTY',
  OTHER = 'OTHER'
}

/**
 * Inspection time slots
 */
export enum InspectionTimeSlot {
  MORNING = 'MORNING',
  AFTERNOON = 'AFTERNOON',
  SPECIFIC = 'SPECIFIC'
}

// ===========================
// Core Entity Types
// ===========================

/**
 * Tenant Checkout entity
 */
export interface TenantCheckout {
  id: string;
  tenantId: string;
  checkoutNumber: string; // e.g., CHK-2025-0001

  // Notice details
  noticeDate: string; // ISO date
  expectedMoveOutDate: string; // ISO date
  actualMoveOutDate?: string; // ISO date
  checkoutReason: CheckoutReason;
  reasonNotes?: string;

  // Inspection
  inspectionId?: string;
  inspectionDate?: string; // ISO date
  inspectionTime?: string;
  inspectorId?: string;

  // Deposit refund
  depositRefundId?: string;

  // Settlement
  settlementType?: 'FULL' | 'PARTIAL';
  settlementNotes?: string;

  // Status
  status: CheckoutStatus;
  completedAt?: string; // ISO datetime
  completedBy?: string;

  // Audit
  createdAt: string;
  updatedAt: string;
  createdBy: string;

  // Convenience properties (flattened from relations for easier access)
  tenantName?: string; // Full name: firstName + lastName
  propertyName?: string; // Property name
  unitNumber?: string; // Unit number
  securityDeposit?: number; // From tenant record
  monthlyRent?: number; // From tenant record
  isEarlyTermination?: boolean; // Calculated flag
  hasInspectionReport?: boolean; // Whether inspection report exists
  hasDepositStatement?: boolean; // Whether deposit statement exists
  hasFinalStatement?: boolean; // Whether final statement exists

  // Inspection convenience properties
  overallCondition?: number; // From inspection record (1-10)
  inspectionNotes?: string; // From inspection record
  inspectionChecklist?: InspectionSection[]; // From inspection record

  // Populated relations
  tenant?: {
    id: string;
    firstName: string;
    lastName: string;
    tenantNumber: string;
    email: string;
    phone?: string;
    securityDeposit: number;
    leaseStartDate: string;
    leaseEndDate: string;
    monthlyRent: number;
    status: string;
  };
  property?: {
    id: string;
    name: string;
    address?: string;
  };
  unit?: {
    id: string;
    unitNumber: string;
    floor?: number;
    bedrooms?: number;
  };
  inspection?: Inspection;
  depositRefund?: DepositRefund;
  inspector?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

/**
 * Deposit Refund entity
 */
export interface DepositRefund {
  id: string;
  checkoutId: string;

  // Amounts
  originalDeposit: number;
  deductions: Deduction[];
  totalDeductions: number;
  netRefund: number;
  amountOwedByTenant?: number; // When deductions > deposit

  // Refund details
  refundMethod?: RefundMethod;
  refundDate?: string; // ISO date
  refundReference?: string; // auto-generated REF-2025-0001

  // Bank details (for BANK_TRANSFER)
  bankName?: string;
  accountHolderName?: string;
  iban?: string; // masked in responses
  swiftCode?: string;

  // Cheque details
  chequeNumber?: string;
  chequeDate?: string;

  // Status
  refundStatus: RefundStatus;
  approvedBy?: string;
  approvedAt?: string;
  processedAt?: string;
  transactionId?: string; // Payment transaction ID
  notes?: string;

  // Audit
  createdAt: string;
  updatedAt: string;
}

/**
 * Individual deduction from deposit
 */
export interface Deduction {
  id?: string;
  type: DeductionType;
  description: string;
  amount: number;
  notes?: string | null;
  autoCalculated?: boolean;
  invoiceId?: string | null; // Reference to invoice if applicable
}

/**
 * Inspection entity
 */
export interface Inspection {
  id: string;
  checkoutId: string;
  inspectionDate: string; // ISO date
  inspectionTime?: string;
  inspectorId: string;
  inspectorName?: string;

  // Checklist
  checklist: InspectionSection[];

  // Photos
  photos: InspectionPhoto[];

  // Summary
  totalDamageCost: number;
  overallCondition?: number; // 1-5 rating
  inspectionNotes?: string;

  // Audit
  createdAt: string;
  updatedAt: string;
}

/**
 * Inspection checklist section
 */
export interface InspectionSection {
  name: string;
  displayName?: string;
  items: InspectionItem[];
}

/**
 * Individual inspection item
 */
export interface InspectionItem {
  name: string;
  displayName?: string;
  condition: ItemCondition;
  damageDescription?: string | null;
  repairCost?: number | null;
  notes?: string | null;
}

/**
 * Inspection photo
 */
export interface InspectionPhoto {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  section?: string;
  photoType: 'BEFORE' | 'AFTER' | 'DAMAGE';
  caption?: string;
  uploadedAt: string;
  presignedUrl?: string; // For viewing
}

// ===========================
// API Request Types
// ===========================

/**
 * Request to initiate checkout
 */
export interface InitiateCheckoutRequest {
  noticeDate: string;
  expectedMoveOutDate: string;
  checkoutReason: CheckoutReason;
  reasonNotes?: string;
}

/**
 * Request to save inspection data
 */
export interface SaveInspectionRequest {
  inspectionDate: string;
  inspectionTime: InspectionTimeSlot;
  specificTime?: string; // If SPECIFIC time slot
  inspectorId?: string;
  sendNotification?: boolean;
  preInspectionNotes?: string;
  checklist: InspectionSection[];
  overallCondition: number;
  inspectionNotes?: string;
}

/**
 * Request to save deposit calculation
 */
export interface SaveDepositCalculationRequest {
  originalDeposit: number;
  deductions: Deduction[];
  notes?: string | null;
  adjustmentReason?: string; // Required if manual adjustment made
}

/**
 * Request to process refund
 */
export interface ProcessRefundRequest {
  refundMethod: RefundMethod;
  refundDate?: string;

  // Bank transfer details
  bankName?: string;
  accountHolderName?: string;
  iban?: string;
  swiftCode?: string;

  // Cheque details
  chequeNumber?: string;
  chequeDate?: string;

  // Cash acknowledgment
  cashAcknowledged?: boolean;

  notes?: string;
}

/**
 * Request to complete checkout
 */
export interface CompleteCheckoutRequest {
  settlementType: 'FULL' | 'PARTIAL';
  settlementNotes?: string;
  acknowledgeFinalization: boolean;
  outstandingInvoiceActions?: OutstandingInvoiceAction[];
}

/**
 * Action for outstanding invoice during settlement
 */
export interface OutstandingInvoiceAction {
  invoiceId: string;
  action: 'PAY' | 'WRITE_OFF' | 'DEDUCT_FROM_DEPOSIT';
  paymentDetails?: {
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    reference?: string;
  };
  writeOffReason?: string;
}

/**
 * Request to upload inspection photos
 */
export interface UploadInspectionPhotosRequest {
  files: File[];
  section: string;
  photoType: 'BEFORE' | 'AFTER' | 'DAMAGE';
}

/**
 * Request to approve refund (ADMIN only for amounts > threshold)
 */
export interface ApproveRefundRequest {
  notes?: string;
}

/**
 * Request to update refund status
 */
export interface UpdateRefundStatusRequest {
  status: RefundStatus;
  reason?: string;
  transactionId?: string;
}

// ===========================
// API Response Types
// ===========================

/**
 * Response from initiating checkout
 */
export interface InitiateCheckoutResponse {
  success: boolean;
  data: {
    checkoutId: string;
    checkoutNumber: string;
    status: CheckoutStatus;
  };
  message?: string;
}

/**
 * Response from completing checkout
 */
export interface CompleteCheckoutResponse {
  success: boolean;
  data: {
    checkoutId: string;
    refundId?: string;
    finalStatementUrl?: string;
    inspectionReportUrl?: string;
    depositStatementUrl?: string;
  };
  message?: string;
}

/**
 * Outstanding amounts for tenant
 */
export interface OutstandingAmounts {
  tenantId: string;
  tenantName: string;

  // Invoice breakdown
  outstandingInvoices: OutstandingInvoice[];
  totalOutstandingRent: number;
  totalOutstandingUtilities: number;
  totalLateFees: number;

  // Damage charges
  damageCharges: number;

  // Early termination
  earlyTerminationFee?: number;

  // Summary
  totalOutstanding: number; // Total of all outstanding amounts
  unpaidRent: number; // Alias for totalOutstandingRent (used by deposit calculation)
  unpaidUtilities: number; // Alias for totalOutstandingUtilities (used by deposit calculation)
  grandTotal: number;
}

/**
 * Outstanding invoice item
 */
export interface OutstandingInvoice {
  id: string;
  invoiceNumber: string;
  dueDate: string;
  amount: number;
  description: string;
  status: string;
}

// ===========================
// List Item Types
// ===========================

/**
 * Checkout list item for displaying in tables/lists
 * Flattened version of TenantCheckout for easier display
 */
export interface CheckoutListItem {
  id: string;
  tenantId: string;
  checkoutNumber: string;
  tenantName: string;
  tenantNumber: string;
  propertyName: string;
  unitNumber: string;
  expectedMoveOutDate: string;
  actualMoveOutDate?: string;
  status: CheckoutStatus;
  netRefund?: number;
  refundStatus?: RefundStatus;
  createdAt: string;
}

// ===========================
// Paginated Types
// ===========================

/**
 * Paginated checkout list
 */
export interface CheckoutPage {
  content: CheckoutListItem[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

// ===========================
// Filter Types
// ===========================

/**
 * Filters for checkout list
 */
export interface CheckoutFilters {
  status?: CheckoutStatus;
  propertyId?: string;
  fromDate?: string;
  toDate?: string;
  search?: string; // tenant name or checkout number
  refundStatus?: RefundStatus;
}

// ===========================
// Form Data Types
// ===========================

/**
 * Step 1: Notice Details form data
 */
export interface NoticeDetailsFormData {
  tenantId: string;
  noticeDate: Date;
  expectedMoveOutDate: Date;
  checkoutReason: CheckoutReason;
  reasonNotes?: string;
}

/**
 * Step 2: Inspection form data
 */
export interface InspectionFormData {
  inspectionDate: Date;
  inspectionTimeSlot: InspectionTimeSlot;
  specificTime?: string;
  inspectorId: string;
  sendNotification: boolean;
  preInspectionNotes?: string;
}

/**
 * Inspection checklist form data
 */
export interface InspectionChecklistFormData {
  sections: {
    name: string;
    items: {
      name: string;
      condition: ItemCondition;
      damageDescription?: string;
      repairCost?: number;
    }[];
  }[];
}

/**
 * Step 3: Deposit calculation form data
 * Note: The canonical type is exported from lib/validations/checkout.ts
 */
export interface DepositCalculationFormData {
  originalDeposit: number;
  deductions: {
    type: DeductionType;
    description: string;
    amount: number;
    notes?: string | null;
    autoCalculated?: boolean;
    invoiceId?: string | null;
  }[];
  notes?: string | null;
}

/**
 * Refund processing form data
 */
export interface RefundFormData {
  refundMethod: RefundMethod;
  bankName?: string;
  accountHolderName?: string;
  iban?: string;
  swiftCode?: string;
  chequeNumber?: string;
  chequeDate?: Date;
  cashAcknowledged?: boolean;
  notes?: string;
}

/**
 * Step 4: Final settlement form data
 */
export interface FinalSettlementFormData {
  settlementType: 'FULL' | 'PARTIAL';
  settlementNotes?: string | null;
  acknowledgeFinalization: boolean;
  invoiceActions?: {
    invoiceId: string;
    action: 'PAY' | 'WRITE_OFF' | 'DEDUCT_FROM_DEPOSIT';
    writeOffReason?: string | null;
  }[];
  // Refund processing fields
  refundMethod?: RefundMethod;
  bankName?: string;
  accountHolderName?: string;
  iban?: string;
  swiftCode?: string;
  chequeNumber?: string;
  chequeDate?: Date;
  cashAcknowledged?: boolean;
}

// ===========================
// Checkout Wizard Types
// ===========================

/**
 * Wizard step definition
 */
export interface WizardStep {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'current' | 'completed';
}

/**
 * Combined wizard form data
 */
export interface CheckoutWizardData {
  // Step 1
  noticeDetails: NoticeDetailsFormData;
  // Step 2
  inspection: InspectionFormData;
  inspectionChecklist: InspectionChecklistFormData;
  inspectionPhotos: File[];
  // Step 3
  depositCalculation: DepositCalculationFormData;
  refundDetails: RefundFormData;
  // Step 4
  finalSettlement: FinalSettlementFormData;
}

// ===========================
// Tenant Summary for Checkout
// ===========================

/**
 * Tenant summary displayed during checkout
 */
export interface TenantCheckoutSummary {
  tenantId: string;
  tenantNumber: string;
  tenantName: string;
  email: string;
  phone?: string;

  propertyId: string;
  propertyName: string;
  unitId: string;
  unitNumber: string;
  floor?: number;

  leaseStartDate: string;
  leaseEndDate: string;
  daysUntilLeaseEnd: number;

  monthlyRent: number;
  securityDeposit: number;
  outstandingBalance: number;

  status: string;
}

// ===========================
// Default Inspection Checklist
// ===========================

/**
 * Default inspection sections and items
 */
export const DEFAULT_INSPECTION_SECTIONS: InspectionSection[] = [
  {
    name: 'living_areas',
    displayName: 'Living Areas',
    items: [
      { name: 'walls', displayName: 'Walls', condition: ItemCondition.GOOD },
      { name: 'flooring', displayName: 'Flooring', condition: ItemCondition.GOOD },
      { name: 'windows', displayName: 'Windows', condition: ItemCondition.GOOD },
      { name: 'doors', displayName: 'Doors', condition: ItemCondition.GOOD },
      { name: 'lighting', displayName: 'Lighting', condition: ItemCondition.GOOD }
    ]
  },
  {
    name: 'kitchen',
    displayName: 'Kitchen',
    items: [
      { name: 'cabinets', displayName: 'Cabinets', condition: ItemCondition.GOOD },
      { name: 'countertops', displayName: 'Countertops', condition: ItemCondition.GOOD },
      { name: 'sink', displayName: 'Sink', condition: ItemCondition.GOOD },
      { name: 'oven', displayName: 'Oven', condition: ItemCondition.GOOD },
      { name: 'hood', displayName: 'Hood/Exhaust', condition: ItemCondition.GOOD },
      { name: 'dishwasher', displayName: 'Dishwasher', condition: ItemCondition.GOOD }
    ]
  },
  {
    name: 'bathrooms',
    displayName: 'Bathrooms',
    items: [
      { name: 'fixtures', displayName: 'Fixtures', condition: ItemCondition.GOOD },
      { name: 'tiles', displayName: 'Tiles', condition: ItemCondition.GOOD },
      { name: 'plumbing', displayName: 'Plumbing', condition: ItemCondition.GOOD },
      { name: 'ventilation', displayName: 'Ventilation', condition: ItemCondition.GOOD }
    ]
  },
  {
    name: 'bedrooms',
    displayName: 'Bedrooms',
    items: [
      { name: 'walls', displayName: 'Walls', condition: ItemCondition.GOOD },
      { name: 'flooring', displayName: 'Flooring', condition: ItemCondition.GOOD },
      { name: 'closets', displayName: 'Closets', condition: ItemCondition.GOOD },
      { name: 'windows', displayName: 'Windows', condition: ItemCondition.GOOD }
    ]
  },
  {
    name: 'balcony_outdoor',
    displayName: 'Balcony/Outdoor',
    items: [
      { name: 'flooring', displayName: 'Flooring', condition: ItemCondition.GOOD },
      { name: 'railings', displayName: 'Railings', condition: ItemCondition.GOOD },
      { name: 'drainage', displayName: 'Drainage', condition: ItemCondition.GOOD }
    ]
  },
  {
    name: 'fixtures_fittings',
    displayName: 'Fixtures & Fittings',
    items: [
      { name: 'light_fixtures', displayName: 'Light Fixtures', condition: ItemCondition.GOOD },
      { name: 'switches', displayName: 'Switches', condition: ItemCondition.GOOD },
      { name: 'outlets', displayName: 'Outlets', condition: ItemCondition.GOOD },
      { name: 'ac_units', displayName: 'AC Units', condition: ItemCondition.GOOD }
    ]
  },
  {
    name: 'appliances',
    displayName: 'Appliances',
    items: [
      { name: 'refrigerator', displayName: 'Refrigerator', condition: ItemCondition.GOOD },
      { name: 'washing_machine', displayName: 'Washing Machine', condition: ItemCondition.GOOD },
      { name: 'dryer', displayName: 'Dryer', condition: ItemCondition.GOOD },
      { name: 'water_heater', displayName: 'Water Heater', condition: ItemCondition.GOOD }
    ]
  },
  {
    name: 'keys_access',
    displayName: 'Keys & Access',
    items: [
      { name: 'unit_keys', displayName: 'Unit Keys', condition: ItemCondition.GOOD },
      { name: 'mailbox_key', displayName: 'Mailbox Key', condition: ItemCondition.GOOD },
      { name: 'parking_card', displayName: 'Parking Card', condition: ItemCondition.GOOD },
      { name: 'access_fob', displayName: 'Access Fob', condition: ItemCondition.GOOD }
    ]
  }
];

// ===========================
// Status Display Helpers
// ===========================

/**
 * Checkout status display options
 */
export const CHECKOUT_STATUS_OPTIONS: Record<
  CheckoutStatus,
  { label: string; color: 'default' | 'secondary' | 'destructive' | 'outline'; variant: string }
> = {
  [CheckoutStatus.PENDING]: { label: 'Pending', color: 'secondary', variant: 'bg-slate-100 text-slate-700' },
  [CheckoutStatus.INSPECTION_SCHEDULED]: { label: 'Inspection Scheduled', color: 'secondary', variant: 'bg-blue-100 text-blue-700' },
  [CheckoutStatus.INSPECTION_COMPLETE]: { label: 'Inspection Complete', color: 'secondary', variant: 'bg-indigo-100 text-indigo-700' },
  [CheckoutStatus.DEPOSIT_CALCULATED]: { label: 'Deposit Calculated', color: 'secondary', variant: 'bg-purple-100 text-purple-700' },
  [CheckoutStatus.PENDING_APPROVAL]: { label: 'Pending Approval', color: 'secondary', variant: 'bg-yellow-100 text-yellow-700' },
  [CheckoutStatus.APPROVED]: { label: 'Approved', color: 'default', variant: 'bg-green-100 text-green-700' },
  [CheckoutStatus.REFUND_PROCESSING]: { label: 'Refund Processing', color: 'secondary', variant: 'bg-orange-100 text-orange-700' },
  [CheckoutStatus.REFUND_PROCESSED]: { label: 'Refund Processed', color: 'default', variant: 'bg-emerald-100 text-emerald-700' },
  [CheckoutStatus.COMPLETED]: { label: 'Completed', color: 'default', variant: 'bg-green-100 text-green-800' },
  [CheckoutStatus.ON_HOLD]: { label: 'On Hold', color: 'destructive', variant: 'bg-red-100 text-red-700' }
};

/**
 * Refund status display options
 */
export const REFUND_STATUS_OPTIONS: Record<
  RefundStatus,
  { label: string; color: 'default' | 'secondary' | 'destructive' | 'outline'; variant: string }
> = {
  [RefundStatus.CALCULATED]: { label: 'Calculated', color: 'secondary', variant: 'bg-slate-100 text-slate-700' },
  [RefundStatus.PENDING_APPROVAL]: { label: 'Pending Approval', color: 'secondary', variant: 'bg-yellow-100 text-yellow-700' },
  [RefundStatus.APPROVED]: { label: 'Approved', color: 'default', variant: 'bg-green-100 text-green-700' },
  [RefundStatus.PROCESSING]: { label: 'Processing', color: 'secondary', variant: 'bg-blue-100 text-blue-700' },
  [RefundStatus.COMPLETED]: { label: 'Completed', color: 'default', variant: 'bg-green-100 text-green-800' },
  [RefundStatus.ON_HOLD]: { label: 'On Hold', color: 'destructive', variant: 'bg-orange-100 text-orange-700' }
};

/**
 * Item condition display options
 */
export const ITEM_CONDITION_OPTIONS: Record<
  ItemCondition,
  { label: string; color: string }
> = {
  [ItemCondition.GOOD]: { label: 'Good', color: 'text-green-600' },
  [ItemCondition.FAIR]: { label: 'Fair', color: 'text-yellow-600' },
  [ItemCondition.DAMAGED]: { label: 'Damaged', color: 'text-red-600' },
  [ItemCondition.MISSING]: { label: 'Missing', color: 'text-red-700' }
};

/**
 * Checkout reason display options
 */
export const CHECKOUT_REASON_OPTIONS: { value: CheckoutReason; label: string }[] = [
  { value: CheckoutReason.LEASE_END, label: 'Lease End' },
  { value: CheckoutReason.EARLY_TERMINATION, label: 'Early Termination' },
  { value: CheckoutReason.EVICTION, label: 'Eviction' },
  { value: CheckoutReason.MUTUAL_AGREEMENT, label: 'Mutual Agreement' },
  { value: CheckoutReason.OTHER, label: 'Other' }
];

/**
 * Refund method display options
 */
export const REFUND_METHOD_OPTIONS: { value: RefundMethod; label: string }[] = [
  { value: RefundMethod.BANK_TRANSFER, label: 'Bank Transfer' },
  { value: RefundMethod.CHEQUE, label: 'Cheque' },
  { value: RefundMethod.CASH, label: 'Cash' }
];

/**
 * Inspection time slot display options
 */
export const INSPECTION_TIME_OPTIONS: { value: InspectionTimeSlot; label: string; description: string }[] = [
  { value: InspectionTimeSlot.MORNING, label: 'Morning', description: '9 AM - 12 PM' },
  { value: InspectionTimeSlot.AFTERNOON, label: 'Afternoon', description: '1 PM - 5 PM' },
  { value: InspectionTimeSlot.SPECIFIC, label: 'Specific Time', description: 'Choose exact time' }
];

// ===========================
// Helper Functions
// ===========================

// Note: formatCurrency is already exported from ./invoice.ts

/**
 * Calculate days until move-out
 */
export function calculateDaysUntilMoveOut(moveOutDate: string | Date): number {
  const date = typeof moveOutDate === 'string' ? new Date(moveOutDate) : moveOutDate;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  const diffTime = date.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Check if checkout is early termination
 */
export function isEarlyTermination(moveOutDate: string | Date, leaseEndDate: string | Date): boolean {
  const moveOut = typeof moveOutDate === 'string' ? new Date(moveOutDate) : moveOutDate;
  const leaseEnd = typeof leaseEndDate === 'string' ? new Date(leaseEndDate) : leaseEndDate;
  return moveOut < leaseEnd;
}

/**
 * Calculate early termination fee
 * Default: 1 month rent if < 6 months remaining, 2 months if > 6 months
 */
export function calculateEarlyTerminationFee(
  monthlyRent: number,
  moveOutDate: string | Date,
  leaseEndDate: string | Date
): number {
  const moveOut = typeof moveOutDate === 'string' ? new Date(moveOutDate) : moveOutDate;
  const leaseEnd = typeof leaseEndDate === 'string' ? new Date(leaseEndDate) : leaseEndDate;

  const monthsRemaining =
    (leaseEnd.getFullYear() - moveOut.getFullYear()) * 12 +
    (leaseEnd.getMonth() - moveOut.getMonth());

  if (monthsRemaining <= 0) return 0;
  return monthsRemaining > 6 ? monthlyRent * 2 : monthlyRent;
}

/**
 * Validate UAE IBAN format
 * Format: AE + 2 check digits + 19 alphanumeric characters = 23 total
 */
export function isValidUaeIban(iban: string): boolean {
  const cleanIban = iban.replace(/\s/g, '').toUpperCase();
  const uaeIbanRegex = /^AE\d{2}[A-Z0-9]{19}$/;
  return uaeIbanRegex.test(cleanIban);
}

/**
 * Mask IBAN for display (show only last 4 characters)
 */
export function maskIban(iban: string): string {
  if (!iban) return '';
  const cleanIban = iban.replace(/\s/g, '');
  if (cleanIban.length <= 4) return cleanIban;
  return '*'.repeat(cleanIban.length - 4) + cleanIban.slice(-4);
}

/**
 * Calculate total damage cost from inspection checklist
 */
export function calculateTotalDamageCost(sections: InspectionSection[]): number {
  return sections.reduce((total, section) => {
    return (
      total +
      section.items.reduce((sectionTotal, item) => {
        return sectionTotal + (item.repairCost || 0);
      }, 0)
    );
  }, 0);
}

/**
 * Calculate net refund amount
 */
export function calculateNetRefund(
  originalDeposit: number,
  totalDeductions: number
): { netRefund: number; amountOwed: number } {
  const difference = originalDeposit - totalDeductions;
  return {
    netRefund: Math.max(0, difference),
    amountOwed: Math.max(0, -difference)
  };
}

/**
 * Get default inspection checklist template
 * Standard sections and items for move-out inspection
 */
export function getDefaultInspectionChecklist(): InspectionSection[] {
  return [
    {
      name: 'living_areas',
      displayName: 'Living Areas',
      items: [
        { name: 'walls', displayName: 'Walls', condition: ItemCondition.GOOD },
        { name: 'ceiling', displayName: 'Ceiling', condition: ItemCondition.GOOD },
        { name: 'flooring', displayName: 'Flooring', condition: ItemCondition.GOOD },
        { name: 'doors', displayName: 'Doors', condition: ItemCondition.GOOD },
        { name: 'windows', displayName: 'Windows', condition: ItemCondition.GOOD },
        { name: 'lighting', displayName: 'Lighting', condition: ItemCondition.GOOD },
        { name: 'electrical_outlets', displayName: 'Electrical Outlets', condition: ItemCondition.GOOD },
        { name: 'ac_vents', displayName: 'AC Vents', condition: ItemCondition.GOOD },
      ]
    },
    {
      name: 'kitchen',
      displayName: 'Kitchen',
      items: [
        { name: 'cabinets', displayName: 'Cabinets', condition: ItemCondition.GOOD },
        { name: 'countertops', displayName: 'Countertops', condition: ItemCondition.GOOD },
        { name: 'sink', displayName: 'Sink & Faucet', condition: ItemCondition.GOOD },
        { name: 'stove', displayName: 'Stove/Cooktop', condition: ItemCondition.GOOD },
        { name: 'oven', displayName: 'Oven', condition: ItemCondition.GOOD },
        { name: 'refrigerator', displayName: 'Refrigerator', condition: ItemCondition.GOOD },
        { name: 'dishwasher', displayName: 'Dishwasher', condition: ItemCondition.GOOD },
        { name: 'exhaust', displayName: 'Exhaust Hood', condition: ItemCondition.GOOD },
      ]
    },
    {
      name: 'bathrooms',
      displayName: 'Bathrooms',
      items: [
        { name: 'toilet', displayName: 'Toilet', condition: ItemCondition.GOOD },
        { name: 'bathtub_shower', displayName: 'Bathtub/Shower', condition: ItemCondition.GOOD },
        { name: 'sink', displayName: 'Sink & Faucet', condition: ItemCondition.GOOD },
        { name: 'tiles', displayName: 'Tiles', condition: ItemCondition.GOOD },
        { name: 'mirrors', displayName: 'Mirrors', condition: ItemCondition.GOOD },
        { name: 'cabinets', displayName: 'Cabinets', condition: ItemCondition.GOOD },
        { name: 'exhaust_fan', displayName: 'Exhaust Fan', condition: ItemCondition.GOOD },
      ]
    },
    {
      name: 'bedrooms',
      displayName: 'Bedrooms',
      items: [
        { name: 'walls', displayName: 'Walls', condition: ItemCondition.GOOD },
        { name: 'ceiling', displayName: 'Ceiling', condition: ItemCondition.GOOD },
        { name: 'flooring', displayName: 'Flooring', condition: ItemCondition.GOOD },
        { name: 'closets', displayName: 'Closets/Wardrobes', condition: ItemCondition.GOOD },
        { name: 'doors', displayName: 'Doors', condition: ItemCondition.GOOD },
        { name: 'windows', displayName: 'Windows', condition: ItemCondition.GOOD },
        { name: 'lighting', displayName: 'Lighting', condition: ItemCondition.GOOD },
      ]
    },
    {
      name: 'exterior',
      displayName: 'Exterior/Common',
      items: [
        { name: 'entry_door', displayName: 'Entry Door', condition: ItemCondition.GOOD },
        { name: 'balcony', displayName: 'Balcony/Terrace', condition: ItemCondition.GOOD },
        { name: 'parking', displayName: 'Parking Space', condition: ItemCondition.GOOD },
        { name: 'storage', displayName: 'Storage Area', condition: ItemCondition.GOOD },
      ]
    },
    {
      name: 'appliances',
      displayName: 'Appliances & Equipment',
      items: [
        { name: 'ac_unit', displayName: 'AC Unit', condition: ItemCondition.GOOD },
        { name: 'water_heater', displayName: 'Water Heater', condition: ItemCondition.GOOD },
        { name: 'washer_dryer', displayName: 'Washer/Dryer', condition: ItemCondition.GOOD },
        { name: 'smoke_detector', displayName: 'Smoke Detector', condition: ItemCondition.GOOD },
      ]
    },
    {
      name: 'keys_access',
      displayName: 'Keys & Access',
      items: [
        { name: 'main_keys', displayName: 'Main Door Keys', condition: ItemCondition.GOOD },
        { name: 'access_card', displayName: 'Access Card/Fob', condition: ItemCondition.GOOD },
        { name: 'mailbox_key', displayName: 'Mailbox Key', condition: ItemCondition.GOOD },
        { name: 'parking_card', displayName: 'Parking Card', condition: ItemCondition.GOOD },
        { name: 'remote_controls', displayName: 'Remote Controls', condition: ItemCondition.GOOD },
      ]
    },
  ];
}
