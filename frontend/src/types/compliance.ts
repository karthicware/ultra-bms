/**
 * Compliance and Inspection Tracking Types and Interfaces
 * Story 7.3: Compliance and Inspection Tracking
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Compliance category enum
 * Categories of regulatory compliance requirements
 */
export enum ComplianceCategory {
  SAFETY = 'SAFETY',
  FIRE = 'FIRE',
  ELECTRICAL = 'ELECTRICAL',
  PLUMBING = 'PLUMBING',
  STRUCTURAL = 'STRUCTURAL',
  ENVIRONMENTAL = 'ENVIRONMENTAL',
  LICENSING = 'LICENSING',
  OTHER = 'OTHER'
}

/**
 * Compliance frequency enum
 * How often compliance requirements need to be met
 */
export enum ComplianceFrequency {
  ONE_TIME = 'ONE_TIME',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  SEMI_ANNUALLY = 'SEMI_ANNUALLY',
  ANNUALLY = 'ANNUALLY',
  BIANNUALLY = 'BIANNUALLY'
}

/**
 * Compliance schedule status enum
 * Status of a compliance schedule item
 */
export enum ComplianceScheduleStatus {
  UPCOMING = 'UPCOMING',
  DUE = 'DUE',
  COMPLETED = 'COMPLETED',
  OVERDUE = 'OVERDUE',
  EXEMPT = 'EXEMPT'
}

/**
 * Inspection status enum
 * Status of an inspection
 */
export enum InspectionStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

/**
 * Inspection result enum
 * Result of a completed inspection
 */
export enum InspectionResult {
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  PARTIAL_PASS = 'PARTIAL_PASS'
}

/**
 * Fine status enum
 * Payment status of violation fines
 */
export enum FineStatus {
  NOT_APPLICABLE = 'NOT_APPLICABLE',
  PENDING = 'PENDING',
  PAID = 'PAID',
  APPEALED = 'APPEALED',
  WAIVED = 'WAIVED',
  OVERDUE = 'OVERDUE'
}

/**
 * Requirement status enum
 * Active status of a compliance requirement
 */
export enum RequirementStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

// ============================================================================
// MAIN INTERFACES
// ============================================================================

/**
 * Full compliance requirement entity
 */
export interface ComplianceRequirement {
  id: string;
  requirementNumber: string;
  requirementName: string;
  name: string; // Alias for requirementName
  category: ComplianceCategory;
  description?: string;
  applicableProperties?: string[]; // Array of property IDs, null = all properties
  frequency: ComplianceFrequency;
  authorityAgency?: string;
  regulatoryBody?: string; // Alias for authorityAgency
  referenceCode?: string;
  penaltyDescription?: string;
  notes?: string;
  status: RequirementStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * Compliance requirement with additional details
 */
export interface ComplianceRequirementDetail extends ComplianceRequirement {
  applicablePropertyNames?: string[];
  scheduleCount: number;
  upcomingSchedules: ComplianceScheduleListItem[];
  overdueCount: number;
  nextDueDate?: string;
}

/**
 * Compliance requirement list item for table view
 */
export interface ComplianceRequirementListItem {
  id: string;
  requirementNumber: string;
  requirementName: string;
  category: ComplianceCategory;
  frequency: ComplianceFrequency;
  authorityAgency?: string;
  status: RequirementStatus;
  propertiesCount: number;
  nextDueDate?: string;
}

/**
 * Full compliance schedule entity
 */
export interface ComplianceSchedule {
  id: string;
  complianceRequirementId: string;
  propertyId: string;
  dueDate: string;
  status: ComplianceScheduleStatus;
  completedDate?: string;
  completedBy?: string;
  completedByName?: string;
  notes?: string;
  certificateFilePath?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Compliance schedule with requirement and property details
 */
export interface ComplianceScheduleDetail extends ComplianceSchedule {
  requirementNumber: string;
  requirementName: string;
  category: ComplianceCategory;
  frequency: ComplianceFrequency;
  propertyName: string;
  inspections: InspectionListItem[];
  violations: ViolationListItem[];
}

/**
 * Compliance schedule list item for table view
 */
export interface ComplianceScheduleListItem {
  id: string;
  requirementName: string;
  requirementNumber: string;
  category: ComplianceCategory;
  propertyId: string;
  propertyName: string;
  dueDate: string;
  status: ComplianceScheduleStatus;
  lastCompleted?: string;
}

/**
 * Full compliance inspection entity
 * Note: Named ComplianceInspection to avoid conflict with checkout.ts Inspection
 */
export interface ComplianceInspection {
  id: string;
  complianceScheduleId: string;
  propertyId: string;
  inspectorName: string;
  scheduledDate: string;
  inspectionDate?: string;
  status: InspectionStatus;
  result?: InspectionResult;
  issuesFound?: string;
  recommendations?: string;
  certificatePath?: string;
  nextInspectionDate?: string;
  remediationWorkOrderId?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Inspection with schedule and property details
 */
export interface InspectionDetail extends ComplianceInspection {
  complianceSchedule: ComplianceScheduleListItem;
  propertyName: string;
  remediationWorkOrderNumber?: string;
}

/**
 * Inspection list item for table view
 */
export interface InspectionListItem {
  id: string;
  complianceScheduleId: string;
  propertyName: string;
  requirementName: string;
  inspectorName: string;
  scheduledDate: string;
  inspectionDate?: string;
  status: InspectionStatus;
  result?: InspectionResult;
}

/**
 * Full violation entity
 */
export interface Violation {
  id: string;
  violationNumber: string;
  complianceScheduleId: string;
  violationDate: string;
  description: string;
  fineAmount?: number;
  fineStatus: FineStatus;
  remediationWorkOrderId?: string;
  resolutionDate?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Violation with schedule and property details
 */
export interface ViolationDetail extends Violation {
  complianceSchedule: ComplianceScheduleListItem;
  propertyName: string;
  requirementName: string;
  remediationWorkOrderNumber?: string;
}

/**
 * Violation list item for table view
 */
export interface ViolationListItem {
  id: string;
  violationNumber: string;
  propertyName: string;
  requirementName: string;
  violationDate: string;
  description: string;
  fineAmount?: number;
  fineStatus: FineStatus;
}

/**
 * Compliance dashboard data
 */
export interface ComplianceDashboard {
  upcomingInspections: number;
  overdueComplianceItems: number;
  recentViolationsCount: number;
  recentViolations: ViolationListItem[];
  complianceRatePercentage: number;
  inspectionsByStatus: Record<InspectionStatus, number>;
  schedulesByCategory: Record<ComplianceCategory, number>;
}

/**
 * Property compliance history item
 */
export interface PropertyComplianceHistoryItem {
  schedule: ComplianceScheduleListItem;
  inspections: InspectionListItem[];
  violations: ViolationListItem[];
}

// ============================================================================
// DTO INTERFACES
// ============================================================================

/**
 * Request DTO for creating a compliance requirement
 */
export interface CreateComplianceRequirementDto {
  requirementName: string;
  category: ComplianceCategory;
  description?: string;
  applicableProperties?: string[]; // null = all properties
  frequency: ComplianceFrequency;
  authorityAgency?: string;
  penaltyDescription?: string;
  status?: RequirementStatus;
}

/**
 * Request DTO for updating a compliance requirement
 */
export interface UpdateComplianceRequirementDto {
  requirementName?: string;
  category?: ComplianceCategory;
  description?: string;
  applicableProperties?: string[];
  frequency?: ComplianceFrequency;
  authorityAgency?: string;
  penaltyDescription?: string;
  status?: RequirementStatus;
}

/**
 * Request DTO for marking a schedule complete
 */
export interface CompleteScheduleDto {
  completedDate: string;
  notes?: string;
  certificateFile?: File;
}

/**
 * Request DTO for creating an inspection
 */
export interface CreateInspectionDto {
  complianceScheduleId: string;
  propertyId: string;
  inspectorName: string;
  scheduledDate: string;
}

/**
 * Request DTO for updating inspection results
 */
export interface UpdateInspectionDto {
  inspectionDate?: string;
  status?: InspectionStatus;
  result?: InspectionResult;
  issuesFound?: string;
  recommendations?: string;
  certificateFile?: File;
  nextInspectionDate?: string;
}

/**
 * Request DTO for creating a violation
 */
export interface CreateViolationDto {
  complianceScheduleId: string;
  violationDate: string;
  description: string;
  fineAmount?: number;
  fineStatus?: FineStatus;
  createRemediationWorkOrder?: boolean;
}

/**
 * Request DTO for updating a violation
 */
export interface UpdateViolationDto {
  description?: string;
  fineAmount?: number;
  fineStatus?: FineStatus;
  resolutionDate?: string;
  remediationWorkOrderId?: string;
}

// ============================================================================
// FILTER INTERFACES
// ============================================================================

/**
 * Filter parameters for compliance requirements list
 */
export interface ComplianceRequirementFilters {
  category?: ComplianceCategory;
  status?: RequirementStatus;
  search?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}

/**
 * Filter parameters for compliance schedules list
 */
export interface ComplianceScheduleFilters {
  propertyId?: string;
  requirementId?: string;
  category?: ComplianceCategory;
  status?: ComplianceScheduleStatus;
  dueDateStart?: string;
  dueDateEnd?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}

/**
 * Filter parameters for inspections list
 */
export interface InspectionFilters {
  propertyId?: string;
  complianceScheduleId?: string;
  status?: InspectionStatus;
  result?: InspectionResult;
  scheduledDateStart?: string;
  scheduledDateEnd?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}

/**
 * Filter parameters for violations list
 */
export interface ViolationFilters {
  complianceScheduleId?: string;
  fineStatus?: FineStatus;
  violationDateStart?: string;
  violationDateEnd?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Response from create compliance requirement endpoint
 */
export interface CreateRequirementResponse {
  success: boolean;
  message: string;
  data: ComplianceRequirementDetail & { schedulesCreated: number };
  timestamp: string;
}

/**
 * Response from get compliance requirement endpoint
 */
export interface GetRequirementResponse {
  success: boolean;
  message: string;
  data: ComplianceRequirementDetail;
  timestamp: string;
}

/**
 * Response from list compliance requirements endpoint
 */
export interface ComplianceRequirementListResponse {
  success: boolean;
  message: string;
  data: {
    content: ComplianceRequirementListItem[];
    totalElements: number;
    totalPages: number;
    page: number;
    size: number;
  };
  timestamp: string;
}

/**
 * Response from list compliance schedules endpoint
 */
export interface ComplianceScheduleListResponse {
  success: boolean;
  message: string;
  data: {
    content: ComplianceScheduleListItem[];
    totalElements: number;
    totalPages: number;
    page: number;
    size: number;
  };
  timestamp: string;
}

/**
 * Response from complete schedule endpoint
 */
export interface CompleteScheduleResponse {
  success: boolean;
  message: string;
  data: {
    completedSchedule: ComplianceScheduleDetail;
    nextSchedule?: ComplianceScheduleListItem;
  };
  timestamp: string;
}

/**
 * Response from list inspections endpoint
 */
export interface InspectionListResponse {
  success: boolean;
  message: string;
  data: {
    content: InspectionListItem[];
    totalElements: number;
    totalPages: number;
    page: number;
    size: number;
  };
  timestamp: string;
}

/**
 * Response from create/update inspection endpoint
 */
export interface InspectionResponse {
  success: boolean;
  message: string;
  data: InspectionDetail;
  timestamp: string;
}

/**
 * Response from list violations endpoint
 */
export interface ViolationListResponse {
  success: boolean;
  message: string;
  data: {
    content: ViolationListItem[];
    totalElements: number;
    totalPages: number;
    page: number;
    size: number;
  };
  timestamp: string;
}

/**
 * Response from create/update violation endpoint
 */
export interface ViolationResponse {
  success: boolean;
  message: string;
  data: ViolationDetail;
  timestamp: string;
}

/**
 * Response from compliance dashboard endpoint
 */
export interface ComplianceDashboardResponse {
  success: boolean;
  message: string;
  data: ComplianceDashboard;
  timestamp: string;
}

/**
 * Response from property compliance history endpoint
 */
export interface PropertyComplianceHistoryResponse {
  success: boolean;
  message: string;
  data: PropertyComplianceHistoryItem[];
  timestamp: string;
}

// ============================================================================
// HELPER TYPES AND CONSTANTS
// ============================================================================

/**
 * Compliance category display information
 */
export interface ComplianceCategoryInfo {
  value: ComplianceCategory;
  label: string;
  description: string;
}

/**
 * Compliance category options for dropdowns
 */
export const COMPLIANCE_CATEGORY_OPTIONS: ComplianceCategoryInfo[] = [
  { value: ComplianceCategory.SAFETY, label: 'Safety', description: 'General safety compliance' },
  { value: ComplianceCategory.FIRE, label: 'Fire', description: 'Fire safety and prevention' },
  { value: ComplianceCategory.ELECTRICAL, label: 'Electrical', description: 'Electrical safety compliance' },
  { value: ComplianceCategory.PLUMBING, label: 'Plumbing', description: 'Plumbing compliance' },
  { value: ComplianceCategory.STRUCTURAL, label: 'Structural', description: 'Building structural integrity' },
  { value: ComplianceCategory.ENVIRONMENTAL, label: 'Environmental', description: 'Environmental regulations' },
  { value: ComplianceCategory.LICENSING, label: 'Licensing', description: 'Business and operating licenses' },
  { value: ComplianceCategory.OTHER, label: 'Other', description: 'Other compliance requirements' }
];

/**
 * Compliance frequency display information
 */
export interface ComplianceFrequencyInfo {
  value: ComplianceFrequency;
  label: string;
  months: number;
}

/**
 * Compliance frequency options for dropdowns
 */
export const COMPLIANCE_FREQUENCY_OPTIONS: ComplianceFrequencyInfo[] = [
  { value: ComplianceFrequency.ONE_TIME, label: 'One Time', months: 0 },
  { value: ComplianceFrequency.MONTHLY, label: 'Monthly', months: 1 },
  { value: ComplianceFrequency.QUARTERLY, label: 'Quarterly', months: 3 },
  { value: ComplianceFrequency.SEMI_ANNUALLY, label: 'Semi-Annually', months: 6 },
  { value: ComplianceFrequency.ANNUALLY, label: 'Annually', months: 12 },
  { value: ComplianceFrequency.BIANNUALLY, label: 'Biannually', months: 24 }
];

/**
 * Compliance schedule status display information
 */
export interface ComplianceScheduleStatusInfo {
  value: ComplianceScheduleStatus;
  label: string;
  color: 'yellow' | 'orange' | 'green' | 'red' | 'gray';
  description: string;
}

/**
 * Compliance schedule status options for dropdowns
 */
export const COMPLIANCE_SCHEDULE_STATUS_OPTIONS: ComplianceScheduleStatusInfo[] = [
  { value: ComplianceScheduleStatus.UPCOMING, label: 'Upcoming', color: 'yellow', description: 'Due in more than 30 days' },
  { value: ComplianceScheduleStatus.DUE, label: 'Due', color: 'orange', description: 'Due within 30 days' },
  { value: ComplianceScheduleStatus.COMPLETED, label: 'Completed', color: 'green', description: 'Compliance met' },
  { value: ComplianceScheduleStatus.OVERDUE, label: 'Overdue', color: 'red', description: 'Past due date' },
  { value: ComplianceScheduleStatus.EXEMPT, label: 'Exempt', color: 'gray', description: 'Exempt from this requirement' }
];

/**
 * Inspection status display information
 */
export interface InspectionStatusInfo {
  value: InspectionStatus;
  label: string;
  color: 'blue' | 'yellow' | 'green' | 'red' | 'gray';
  description: string;
}

/**
 * Inspection status options for dropdowns
 */
export const INSPECTION_STATUS_OPTIONS: InspectionStatusInfo[] = [
  { value: InspectionStatus.SCHEDULED, label: 'Scheduled', color: 'blue', description: 'Inspection scheduled' },
  { value: InspectionStatus.IN_PROGRESS, label: 'In Progress', color: 'yellow', description: 'Inspection underway' },
  { value: InspectionStatus.PASSED, label: 'Passed', color: 'green', description: 'Inspection passed' },
  { value: InspectionStatus.FAILED, label: 'Failed', color: 'red', description: 'Inspection failed' },
  { value: InspectionStatus.CANCELLED, label: 'Cancelled', color: 'gray', description: 'Inspection cancelled' }
];

/**
 * Inspection result display information
 */
export interface InspectionResultInfo {
  value: InspectionResult;
  label: string;
  color: 'green' | 'red' | 'yellow';
}

/**
 * Inspection result options for dropdowns
 */
export const INSPECTION_RESULT_OPTIONS: InspectionResultInfo[] = [
  { value: InspectionResult.PASSED, label: 'Passed', color: 'green' },
  { value: InspectionResult.FAILED, label: 'Failed', color: 'red' },
  { value: InspectionResult.PARTIAL_PASS, label: 'Partial Pass', color: 'yellow' }
];

/**
 * Fine status display information
 */
export interface FineStatusInfo {
  value: FineStatus;
  label: string;
  color: 'yellow' | 'green' | 'blue' | 'gray' | 'red';
  description: string;
}

/**
 * Fine status options for dropdowns
 */
export const FINE_STATUS_OPTIONS: FineStatusInfo[] = [
  { value: FineStatus.NOT_APPLICABLE, label: 'N/A', color: 'gray', description: 'No fine applicable' },
  { value: FineStatus.PENDING, label: 'Pending', color: 'yellow', description: 'Payment pending' },
  { value: FineStatus.PAID, label: 'Paid', color: 'green', description: 'Fine paid' },
  { value: FineStatus.APPEALED, label: 'Appealed', color: 'blue', description: 'Under appeal' },
  { value: FineStatus.WAIVED, label: 'Waived', color: 'gray', description: 'Fine waived' },
  { value: FineStatus.OVERDUE, label: 'Overdue', color: 'red', description: 'Payment overdue' }
];

/**
 * Requirement status display information
 */
export interface RequirementStatusInfo {
  value: RequirementStatus;
  label: string;
  color: 'green' | 'gray';
}

/**
 * Requirement status options for dropdowns
 */
export const REQUIREMENT_STATUS_OPTIONS: RequirementStatusInfo[] = [
  { value: RequirementStatus.ACTIVE, label: 'Active', color: 'green' },
  { value: RequirementStatus.INACTIVE, label: 'Inactive', color: 'gray' }
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get compliance category label
 */
export function getComplianceCategoryLabel(category: ComplianceCategory): string {
  const info = COMPLIANCE_CATEGORY_OPTIONS.find(c => c.value === category);
  return info?.label ?? category;
}

/**
 * Get compliance category color class
 */
export function getComplianceCategoryColor(category: ComplianceCategory): string {
  switch (category) {
    case ComplianceCategory.SAFETY:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case ComplianceCategory.FIRE:
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    case ComplianceCategory.ELECTRICAL:
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case ComplianceCategory.PLUMBING:
      return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300';
    case ComplianceCategory.STRUCTURAL:
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
    case ComplianceCategory.ENVIRONMENTAL:
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case ComplianceCategory.LICENSING:
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
    case ComplianceCategory.OTHER:
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
}

/**
 * Get compliance frequency label
 */
export function getComplianceFrequencyLabel(frequency: ComplianceFrequency): string {
  const info = COMPLIANCE_FREQUENCY_OPTIONS.find(f => f.value === frequency);
  return info?.label ?? frequency;
}

/**
 * Get compliance frequency months interval
 */
export function getComplianceFrequencyMonths(frequency: ComplianceFrequency): number {
  const info = COMPLIANCE_FREQUENCY_OPTIONS.find(f => f.value === frequency);
  return info?.months ?? 0;
}

/**
 * Get schedule status color class
 */
export function getScheduleStatusColor(status: ComplianceScheduleStatus): string {
  switch (status) {
    case ComplianceScheduleStatus.UPCOMING:
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case ComplianceScheduleStatus.DUE:
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
    case ComplianceScheduleStatus.COMPLETED:
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case ComplianceScheduleStatus.OVERDUE:
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    case ComplianceScheduleStatus.EXEMPT:
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
}

/**
 * Get schedule status label
 */
export function getScheduleStatusLabel(status: ComplianceScheduleStatus): string {
  const info = COMPLIANCE_SCHEDULE_STATUS_OPTIONS.find(s => s.value === status);
  return info?.label ?? status;
}

/**
 * Get inspection status color class
 */
export function getInspectionStatusColor(status: InspectionStatus): string {
  switch (status) {
    case InspectionStatus.SCHEDULED:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case InspectionStatus.IN_PROGRESS:
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case InspectionStatus.PASSED:
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case InspectionStatus.FAILED:
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    case InspectionStatus.CANCELLED:
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
}

/**
 * Get inspection status label
 */
export function getInspectionStatusLabel(status: InspectionStatus): string {
  const info = INSPECTION_STATUS_OPTIONS.find(s => s.value === status);
  return info?.label ?? status;
}

/**
 * Get inspection result color class
 */
export function getInspectionResultColor(result: InspectionResult): string {
  switch (result) {
    case InspectionResult.PASSED:
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case InspectionResult.FAILED:
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    case InspectionResult.PARTIAL_PASS:
    default:
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
  }
}

/**
 * Get inspection result label
 */
export function getInspectionResultLabel(result: InspectionResult): string {
  const info = INSPECTION_RESULT_OPTIONS.find(r => r.value === result);
  return info?.label ?? result;
}

/**
 * Get fine status color class
 */
export function getFineStatusColor(status: FineStatus): string {
  switch (status) {
    case FineStatus.PENDING:
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case FineStatus.PAID:
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case FineStatus.APPEALED:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case FineStatus.OVERDUE:
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    case FineStatus.NOT_APPLICABLE:
    case FineStatus.WAIVED:
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
}

/**
 * Get fine status label
 */
export function getFineStatusLabel(status: FineStatus): string {
  const info = FINE_STATUS_OPTIONS.find(s => s.value === status);
  return info?.label ?? status;
}

/**
 * Get requirement status color class
 */
export function getRequirementStatusColor(status: RequirementStatus): string {
  switch (status) {
    case RequirementStatus.ACTIVE:
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case RequirementStatus.INACTIVE:
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
}

/**
 * Get requirement status label
 */
export function getRequirementStatusLabel(status: RequirementStatus): string {
  const info = REQUIREMENT_STATUS_OPTIONS.find(s => s.value === status);
  return info?.label ?? status;
}

// ============================================================================
// CALENDAR TYPES
// ============================================================================

/**
 * Calendar event for compliance calendar view
 */
export interface ComplianceCalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay?: boolean;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  extendedProps: {
    type: 'schedule' | 'inspection';
    status: ComplianceScheduleStatus | InspectionStatus;
    scheduleId?: string;
    inspectionId?: string;
    propertyName: string;
    requirementName: string;
  };
}

/**
 * Get calendar event color based on status
 */
export function getCalendarEventColor(
  type: 'schedule' | 'inspection',
  status: ComplianceScheduleStatus | InspectionStatus
): { backgroundColor: string; borderColor: string; textColor: string } {
  if (type === 'schedule') {
    switch (status as ComplianceScheduleStatus) {
      case ComplianceScheduleStatus.COMPLETED:
        return { backgroundColor: '#22c55e', borderColor: '#16a34a', textColor: '#ffffff' };
      case ComplianceScheduleStatus.UPCOMING:
        return { backgroundColor: '#eab308', borderColor: '#ca8a04', textColor: '#ffffff' };
      case ComplianceScheduleStatus.DUE:
        return { backgroundColor: '#f97316', borderColor: '#ea580c', textColor: '#ffffff' };
      case ComplianceScheduleStatus.OVERDUE:
        return { backgroundColor: '#ef4444', borderColor: '#dc2626', textColor: '#ffffff' };
      case ComplianceScheduleStatus.EXEMPT:
      default:
        return { backgroundColor: '#6b7280', borderColor: '#4b5563', textColor: '#ffffff' };
    }
  } else {
    switch (status as InspectionStatus) {
      case InspectionStatus.SCHEDULED:
        return { backgroundColor: '#3b82f6', borderColor: '#2563eb', textColor: '#ffffff' };
      case InspectionStatus.IN_PROGRESS:
        return { backgroundColor: '#eab308', borderColor: '#ca8a04', textColor: '#ffffff' };
      case InspectionStatus.PASSED:
        return { backgroundColor: '#22c55e', borderColor: '#16a34a', textColor: '#ffffff' };
      case InspectionStatus.FAILED:
        return { backgroundColor: '#ef4444', borderColor: '#dc2626', textColor: '#ffffff' };
      case InspectionStatus.CANCELLED:
      default:
        return { backgroundColor: '#6b7280', borderColor: '#4b5563', textColor: '#ffffff' };
    }
  }
}

// ============================================================================
// SHORT ALIAS EXPORTS (for convenience in pages)
// ============================================================================

/**
 * Alias for getComplianceCategoryLabel
 */
export const getCategoryLabel = getComplianceCategoryLabel;

/**
 * Alias for getComplianceCategoryColor
 */
export const getCategoryColor = getComplianceCategoryColor;

/**
 * Alias for getComplianceFrequencyLabel
 */
export const getFrequencyLabel = getComplianceFrequencyLabel;
