/**
 * PDC (Post-Dated Cheque) Management Types and Interfaces
 * Story 6.3: Post-Dated Cheque (PDC) Management
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * PDC status enum
 * Tracks PDC lifecycle from receipt to final state
 * State machine: RECEIVED → DUE → DEPOSITED → CLEARED/BOUNCED/WITHDRAWN
 *                                  BOUNCED → REPLACED
 */
export enum PDCStatus {
  RECEIVED = 'RECEIVED',
  DUE = 'DUE',
  DEPOSITED = 'DEPOSITED',
  CLEARED = 'CLEARED',
  BOUNCED = 'BOUNCED',
  CANCELLED = 'CANCELLED',
  REPLACED = 'REPLACED',
  WITHDRAWN = 'WITHDRAWN'
}

/**
 * New payment method enum for PDC withdrawal replacement
 * When a PDC is withdrawn, tenant may provide alternative payment
 */
export enum NewPaymentMethod {
  BANK_TRANSFER = 'BANK_TRANSFER',
  CASH = 'CASH',
  NEW_CHEQUE = 'NEW_CHEQUE'
}

// ============================================================================
// MAIN INTERFACES
// ============================================================================

/**
 * Full PDC entity
 * Complete post-dated cheque information from backend
 */
export interface PDC {
  id: string;
  chequeNumber: string;
  tenantId: string;
  tenantName: string;
  tenantEmail?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  leaseId?: string;
  leaseNumber?: string;
  bankName: string;
  amount: number;
  chequeDate: string;
  depositDate?: string;
  clearedDate?: string;
  bouncedDate?: string;
  bounceReason?: string;
  status: PDCStatus;
  withdrawalDate?: string;
  withdrawalReason?: string;
  newPaymentMethod?: NewPaymentMethod;
  replacementChequeId?: string;
  replacementChequeNumber?: string;
  originalChequeId?: string;
  originalChequeNumber?: string;
  bankAccountId?: string;
  bankAccountName?: string;
  notes?: string;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * PDC list item for table view
 * Minimal fields for efficient list rendering
 */
export interface PDCListItem {
  id: string;
  chequeNumber: string;
  tenantId: string;
  tenantName: string;
  bankName: string;
  amount: number;
  chequeDate: string;
  status: PDCStatus;
  depositDate?: string;
  clearedDate?: string;
  bouncedDate?: string;
  isDue: boolean;
  daysUntilDue?: number;
}

/**
 * PDC detail with full relations
 * Extended PDC info for detail page
 */
export interface PDCDetail extends PDC {
  tenant: {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
  };
  invoice?: {
    id: string;
    invoiceNumber: string;
    totalAmount: number;
    balanceAmount: number;
  };
  lease?: {
    id: string;
    unitNumber: string;
    propertyName: string;
    startDate: string;
    endDate: string;
  };
  bankAccount?: {
    id: string;
    bankName: string;
    maskedAccountNumber: string;
  };
  statusHistory: PDCStatusTransition[];
  replacementChain?: PDCReplacementChainItem[];
}

/**
 * PDC status transition for timeline
 */
export interface PDCStatusTransition {
  fromStatus: PDCStatus | null;
  toStatus: PDCStatus;
  transitionDate: string;
  performedBy: string;
  performedByName: string;
  notes?: string;
}

/**
 * PDC replacement chain item for tracking bounced cheque replacements
 */
export interface PDCReplacementChainItem {
  id: string;
  chequeNumber: string;
  amount: number;
  chequeDate: string;
  status: PDCStatus;
  bouncedDate?: string;
  bounceReason?: string;
}

/**
 * PDC holder information from company profile
 */
export interface PDCHolder {
  companyName: string;
  legalCompanyName?: string;
  tradeLicenseNumber?: string;
}

/**
 * Bank account for PDC deposit selection
 */
export interface BankAccountOption {
  id: string;
  bankName: string;
  maskedAccountNumber: string;
  displayName: string;
}

// ============================================================================
// DTO INTERFACES
// ============================================================================

/**
 * Single cheque entry for PDC registration
 */
export interface PDCChequeEntry {
  chequeNumber: string;
  bankName: string;
  amount: number;
  chequeDate: string;
}

/**
 * Request DTO for creating single PDC
 */
export interface PDCCreateRequest {
  tenantId: string;
  leaseId?: string;
  invoiceId?: string;
  chequeNumber: string;
  bankName: string;
  amount: number;
  chequeDate: string;
  notes?: string;
}

/**
 * Request DTO for bulk PDC registration
 */
export interface PDCBulkCreateRequest {
  tenantId: string;
  leaseId?: string;
  cheques: PDCChequeEntry[];
}

/**
 * Request DTO for depositing PDC
 */
export interface PDCDepositRequest {
  depositDate: string;
  bankAccountId: string;
}

/**
 * Request DTO for clearing PDC
 */
export interface PDCClearRequest {
  clearedDate: string;
}

/**
 * Request DTO for reporting PDC bounce
 */
export interface PDCBounceRequest {
  bouncedDate: string;
  bounceReason: string;
}

/**
 * Request DTO for replacing bounced PDC
 */
export interface PDCReplaceRequest {
  newChequeNumber: string;
  bankName: string;
  amount: number;
  chequeDate: string;
  notes?: string;
}

/**
 * Transaction details for bank transfer withdrawal replacement
 */
export interface WithdrawalTransactionDetails {
  amount: number;
  transactionId: string;
  bankAccountId: string;
}

/**
 * Request DTO for withdrawing PDC
 */
export interface PDCWithdrawRequest {
  withdrawalDate: string;
  withdrawalReason: string;
  newPaymentMethod?: NewPaymentMethod;
  transactionDetails?: WithdrawalTransactionDetails;
}

/**
 * Filter parameters for PDC list
 */
export interface PDCFilter {
  search?: string;
  status?: PDCStatus | PDCStatus[] | 'ALL';
  tenantId?: string;
  bankName?: string;
  fromDate?: string;
  toDate?: string;
  leaseId?: string;
  invoiceId?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}

/**
 * Filter parameters for PDC withdrawal history
 */
export interface PDCWithdrawalFilter {
  search?: string;
  withdrawalReason?: string | 'ALL';
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}

// ============================================================================
// DASHBOARD TYPES
// ============================================================================

/**
 * PDC Dashboard KPI data
 */
export interface PDCDashboardKPIs {
  pdcsDueThisWeek: {
    count: number;
    totalValue: number;
  };
  pdcsDeposited: {
    count: number;
    totalValue: number;
  };
  totalOutstandingValue: number;
  recentlyBouncedCount: number;
}

/**
 * Full PDC dashboard data
 */
export interface PDCDashboard {
  pdcsDueThisWeek: {
    count: number;
    totalValue: number;
  };
  pdcsDeposited: {
    count: number;
    totalValue: number;
  };
  totalOutstandingValue: number;
  recentlyBouncedCount: number;
  upcomingPDCs: PDCListItem[];
  recentlyDepositedPDCs: PDCListItem[];
}

/**
 * Tenant PDC history with bounce rate
 */
export interface TenantPDCHistory {
  tenantId: string;
  tenantName: string;
  totalPDCs: number;
  clearedPDCs: number;
  bouncedPDCs: number;
  pendingPDCs: number;
  bounceRate: number;
  pdcs: PDCListItem[];
}

// ============================================================================
// WITHDRAWAL HISTORY TYPES
// ============================================================================

/**
 * PDC withdrawal history item
 */
export interface PDCWithdrawalHistoryItem {
  id: string;
  originalChequeNumber: string;
  tenantId: string;
  tenantName: string;
  withdrawalDate: string;
  amount: number;
  withdrawalReason: string;
  newPaymentMethod?: NewPaymentMethod;
  associatedPDCId?: string;
  associatedChequeNumber?: string;
  transactionId?: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Response from create PDC endpoint
 */
export interface CreatePDCResponse {
  success: boolean;
  message: string;
  data: PDC;
  timestamp: string;
}

/**
 * Response from bulk create PDCs endpoint
 */
export interface BulkCreatePDCResponse {
  success: boolean;
  message: string;
  data: PDC[];
  timestamp: string;
}

/**
 * Response from get PDC endpoint
 */
export interface GetPDCResponse {
  success: boolean;
  message: string;
  data: PDCDetail;
  timestamp: string;
}

/**
 * Response from list PDCs endpoint
 */
export interface PDCListResponse {
  success: boolean;
  message: string;
  data: {
    content: PDCListItem[];
    totalElements: number;
    totalPages: number;
    page: number;
    size: number;
  };
  timestamp: string;
}

/**
 * Response from PDC dashboard endpoint
 */
export interface PDCDashboardResponse {
  success: boolean;
  message: string;
  data: PDCDashboard;
  timestamp: string;
}

/**
 * Response from PDC status action endpoints (deposit, clear, bounce, withdraw, cancel)
 */
export interface PDCStatusActionResponse {
  success: boolean;
  message: string;
  data: PDC;
  timestamp: string;
}

/**
 * Response from replace PDC endpoint
 */
export interface PDCReplaceResponse {
  success: boolean;
  message: string;
  data: {
    original: PDC;
    replacement: PDC;
  };
  timestamp: string;
}

/**
 * Response from tenant PDC history endpoint
 */
export interface TenantPDCHistoryResponse {
  success: boolean;
  message: string;
  data: {
    content: PDCListItem[];
    totalElements: number;
    totalPages: number;
    page: number;
    size: number;
    bounceRate: number;
  };
  timestamp: string;
}

/**
 * Response from PDC withdrawal history endpoint
 */
export interface PDCWithdrawalHistoryResponse {
  success: boolean;
  message: string;
  data: {
    content: PDCWithdrawalHistoryItem[];
    totalElements: number;
    totalPages: number;
    page: number;
    size: number;
  };
  timestamp: string;
}

/**
 * Response from bank accounts endpoint for PDC deposit
 */
export interface BankAccountsResponse {
  success: boolean;
  message: string;
  data: BankAccountOption[];
  timestamp: string;
}

/**
 * Response from PDC holder endpoint (company profile)
 */
export interface PDCHolderResponse {
  success: boolean;
  message: string;
  data: PDCHolder;
  timestamp: string;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * PDC status display information
 */
export interface PDCStatusInfo {
  value: PDCStatus;
  label: string;
  color: 'gray' | 'amber' | 'blue' | 'green' | 'red' | 'purple' | 'orange' | 'slate';
  icon: string;
  description: string;
}

/**
 * PDC status options for dropdowns and badges
 */
export const PDC_STATUS_OPTIONS: PDCStatusInfo[] = [
  {
    value: PDCStatus.RECEIVED,
    label: 'Received',
    color: 'gray',
    icon: 'inbox',
    description: 'PDC received from tenant'
  },
  {
    value: PDCStatus.DUE,
    label: 'Due',
    color: 'amber',
    icon: 'calendar-clock',
    description: 'Cheque date within 7 days'
  },
  {
    value: PDCStatus.DEPOSITED,
    label: 'Deposited',
    color: 'blue',
    icon: 'building-2',
    description: 'Submitted to bank'
  },
  {
    value: PDCStatus.CLEARED,
    label: 'Cleared',
    color: 'green',
    icon: 'check-circle',
    description: 'Payment confirmed by bank'
  },
  {
    value: PDCStatus.BOUNCED,
    label: 'Bounced',
    color: 'red',
    icon: 'alert-triangle',
    description: 'Payment failed'
  },
  {
    value: PDCStatus.CANCELLED,
    label: 'Cancelled',
    color: 'slate',
    icon: 'x-circle',
    description: 'PDC voided'
  },
  {
    value: PDCStatus.REPLACED,
    label: 'Replaced',
    color: 'purple',
    icon: 'refresh-cw',
    description: 'Replaced with new PDC'
  },
  {
    value: PDCStatus.WITHDRAWN,
    label: 'Withdrawn',
    color: 'orange',
    icon: 'undo-2',
    description: 'Returned to tenant'
  }
];

/**
 * New payment method display information
 */
export interface NewPaymentMethodInfo {
  value: NewPaymentMethod;
  label: string;
  icon: string;
}

/**
 * New payment method options for withdrawal modal
 */
export const NEW_PAYMENT_METHOD_OPTIONS: NewPaymentMethodInfo[] = [
  { value: NewPaymentMethod.BANK_TRANSFER, label: 'Bank Transfer', icon: 'landmark' },
  { value: NewPaymentMethod.CASH, label: 'Cash', icon: 'banknote' },
  { value: NewPaymentMethod.NEW_CHEQUE, label: 'New Cheque', icon: 'file-text' }
];

/**
 * Common bounce reasons for dropdown
 */
export const BOUNCE_REASON_OPTIONS: string[] = [
  'Insufficient Funds',
  'Signature Mismatch',
  'Account Closed',
  'Payment Stopped',
  'Post-dated',
  'Stale Check',
  'Refer to Drawer',
  'Account Frozen',
  'Other'
];

/**
 * Common withdrawal reasons for dropdown
 */
export const WITHDRAWAL_REASON_OPTIONS: string[] = [
  'Cheque Bounced',
  'Replacement Requested',
  'Early Contract Termination',
  'Payment Method Change',
  'Tenant Request',
  'Other'
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get status badge color class
 */
export function getPDCStatusColor(status: PDCStatus): string {
  switch (status) {
    case PDCStatus.RECEIVED:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    case PDCStatus.DUE:
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
    case PDCStatus.DEPOSITED:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case PDCStatus.CLEARED:
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case PDCStatus.BOUNCED:
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    case PDCStatus.CANCELLED:
      return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
    case PDCStatus.REPLACED:
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
    case PDCStatus.WITHDRAWN:
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Get status badge variant for shadcn Badge
 */
export function getPDCStatusVariant(status: PDCStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case PDCStatus.CLEARED:
      return 'default';
    case PDCStatus.BOUNCED:
      return 'destructive';
    case PDCStatus.CANCELLED:
    case PDCStatus.REPLACED:
    case PDCStatus.WITHDRAWN:
      return 'secondary';
    default:
      return 'outline';
  }
}

/**
 * Get PDC status label
 */
export function getPDCStatusLabel(status: PDCStatus): string {
  const option = PDC_STATUS_OPTIONS.find(opt => opt.value === status);
  return option?.label ?? status;
}

/**
 * Get new payment method label
 */
export function getNewPaymentMethodLabel(method: NewPaymentMethod): string {
  const option = NEW_PAYMENT_METHOD_OPTIONS.find(opt => opt.value === method);
  return option?.label ?? method;
}

/**
 * Check if PDC can be deposited
 * Only DUE status PDCs can be deposited
 */
export function canDepositPDC(status: PDCStatus): boolean {
  return status === PDCStatus.DUE;
}

/**
 * Check if PDC can be cleared
 * Only DEPOSITED status PDCs can be cleared
 */
export function canClearPDC(status: PDCStatus): boolean {
  return status === PDCStatus.DEPOSITED;
}

/**
 * Check if PDC can be bounced
 * Only DEPOSITED status PDCs can be marked as bounced
 */
export function canBouncePDC(status: PDCStatus): boolean {
  return status === PDCStatus.DEPOSITED;
}

/**
 * Check if PDC can be replaced
 * Only BOUNCED status PDCs can be replaced
 */
export function canReplacePDC(status: PDCStatus): boolean {
  return status === PDCStatus.BOUNCED;
}

/**
 * Check if PDC can be withdrawn
 * Only RECEIVED or DUE status PDCs can be withdrawn
 */
export function canWithdrawPDC(status: PDCStatus): boolean {
  return status === PDCStatus.RECEIVED || status === PDCStatus.DUE;
}

/**
 * Check if PDC can be cancelled
 * Only RECEIVED status PDCs can be cancelled
 */
export function canCancelPDC(status: PDCStatus): boolean {
  return status === PDCStatus.RECEIVED;
}

/**
 * Check if PDC is in a final state (no more actions possible)
 */
export function isPDCFinalState(status: PDCStatus): boolean {
  return [
    PDCStatus.CLEARED,
    PDCStatus.CANCELLED,
    PDCStatus.REPLACED,
    PDCStatus.WITHDRAWN
  ].includes(status);
}

/**
 * Format currency as AED for PDCs
 */
export function formatPDCCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Calculate days until cheque date
 * Returns negative if past, positive if future, 0 if today
 */
export function getDaysUntilChequeDate(chequeDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cheque = new Date(chequeDate);
  cheque.setHours(0, 0, 0, 0);
  const diffTime = cheque.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Check if cheque date is within due window (7 days)
 */
export function isWithinDueWindow(chequeDate: string): boolean {
  const days = getDaysUntilChequeDate(chequeDate);
  return days >= 0 && days <= 7;
}

/**
 * Format masked bank account number
 */
export function formatMaskedAccountNumber(accountNumber: string): string {
  if (!accountNumber || accountNumber.length < 4) {
    return '**** **** **** ****';
  }
  const lastFour = accountNumber.slice(-4);
  return `**** **** **** ${lastFour}`;
}

// ============================================================================
// LABEL RECORDS FOR DISPLAY
// ============================================================================

/**
 * PDC status labels for display
 */
export const PDC_STATUS_LABELS: Record<PDCStatus, string> = {
  [PDCStatus.RECEIVED]: 'Received',
  [PDCStatus.DUE]: 'Due',
  [PDCStatus.DEPOSITED]: 'Deposited',
  [PDCStatus.CLEARED]: 'Cleared',
  [PDCStatus.BOUNCED]: 'Bounced',
  [PDCStatus.CANCELLED]: 'Cancelled',
  [PDCStatus.REPLACED]: 'Replaced',
  [PDCStatus.WITHDRAWN]: 'Withdrawn'
};

/**
 * New payment method labels for display
 */
export const NEW_PAYMENT_METHOD_LABELS: Record<NewPaymentMethod, string> = {
  [NewPaymentMethod.BANK_TRANSFER]: 'Bank Transfer',
  [NewPaymentMethod.CASH]: 'Cash',
  [NewPaymentMethod.NEW_CHEQUE]: 'New Cheque'
};
