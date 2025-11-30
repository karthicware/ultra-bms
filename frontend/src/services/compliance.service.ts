/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Compliance API Service
 * Story 7.3: Compliance and Inspection Tracking
 *
 * All compliance-related API calls with comprehensive JSDoc documentation
 */

import { apiClient } from '@/lib/api';
import type {
  ComplianceRequirementDetail,
  ComplianceScheduleDetail,
  ComplianceScheduleListItem,
  InspectionDetail,
  ViolationDetail,
  ComplianceDashboard,
  PropertyComplianceHistoryItem,
  CreateComplianceRequirementDto,
  UpdateComplianceRequirementDto,
  CompleteScheduleDto,
  CreateInspectionDto,
  UpdateInspectionDto,
  CreateViolationDto,
  UpdateViolationDto,
  ComplianceRequirementFilters,
  ComplianceScheduleFilters,
  InspectionFilters,
  ViolationFilters,
  CreateRequirementResponse,
  GetRequirementResponse,
  ComplianceRequirementListResponse,
  ComplianceScheduleListResponse,
  CompleteScheduleResponse,
  InspectionListResponse,
  InspectionResponse,
  ViolationListResponse,
  ViolationResponse,
  ComplianceDashboardResponse,
  PropertyComplianceHistoryResponse
} from '@/types/compliance';

const COMPLIANCE_REQUIREMENTS_BASE_PATH = '/v1/compliance-requirements';
const COMPLIANCE_SCHEDULES_BASE_PATH = '/v1/compliance-schedules';
const INSPECTIONS_BASE_PATH = '/v1/inspections';
const VIOLATIONS_BASE_PATH = '/v1/violations';
const COMPLIANCE_DASHBOARD_PATH = '/v1/compliance/dashboard';

// ============================================================================
// COMPLIANCE REQUIREMENTS - CRUD
// ============================================================================

/**
 * Create a new compliance requirement
 *
 * @param data - Compliance requirement creation data
 * @returns Promise that resolves to the created requirement with generated schedules count
 *
 * @throws {ValidationException} When validation fails (400)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks PROPERTY_MANAGER or SUPER_ADMIN role (403)
 *
 * @example
 * ```typescript
 * const requirement = await createComplianceRequirement({
 *   requirementName: 'Fire Safety Inspection',
 *   category: 'FIRE',
 *   frequency: 'ANNUALLY',
 *   applicableProperties: null, // all properties
 *   authorityAgency: 'Civil Defense'
 * });
 *
 * console.log(requirement.requirementNumber); // "CMP-2025-0001"
 * console.log(requirement.schedulesCreated); // 5 (for each property)
 * ```
 */
export async function createComplianceRequirement(
  data: CreateComplianceRequirementDto
): Promise<ComplianceRequirementDetail & { schedulesCreated: number }> {
  const response = await apiClient.post<CreateRequirementResponse>(
    COMPLIANCE_REQUIREMENTS_BASE_PATH,
    data
  );
  return response.data.data;
}

/**
 * Get paginated list of compliance requirements with filters
 *
 * @param filters - Optional filters (category, status, search, pagination)
 * @returns Promise that resolves to paginated list of requirements
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 *
 * @example
 * ```typescript
 * const response = await getComplianceRequirements({
 *   category: 'FIRE',
 *   status: 'ACTIVE',
 *   page: 0,
 *   size: 20
 * });
 *
 * console.log(response.data.content); // ComplianceRequirementListItem[]
 * ```
 */
export async function getComplianceRequirements(
  filters?: ComplianceRequirementFilters
): Promise<ComplianceRequirementListResponse> {
  const params: Record<string, any> = {
    page: filters?.page ?? 0,
    size: filters?.size ?? 20,
    sortBy: filters?.sortBy ?? 'requirementName',
    sortDirection: filters?.sortDirection ?? 'ASC'
  };

  if (filters?.category) {
    params.category = filters.category;
  }
  if (filters?.status) {
    params.status = filters.status;
  }
  if (filters?.search) {
    params.search = filters.search;
  }

  const response = await apiClient.get<ComplianceRequirementListResponse>(
    COMPLIANCE_REQUIREMENTS_BASE_PATH,
    { params }
  );
  return response.data;
}

/**
 * Get compliance requirement details by ID
 *
 * @param id - Requirement UUID
 * @returns Promise that resolves to requirement details with schedules
 *
 * @throws {NotFoundException} When requirement not found (404)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 *
 * @example
 * ```typescript
 * const requirement = await getComplianceRequirement('uuid-here');
 * console.log(requirement.scheduleCount);
 * console.log(requirement.upcomingSchedules);
 * ```
 */
export async function getComplianceRequirement(id: string): Promise<ComplianceRequirementDetail> {
  const response = await apiClient.get<GetRequirementResponse>(
    `${COMPLIANCE_REQUIREMENTS_BASE_PATH}/${id}`
  );
  return response.data.data;
}

/**
 * Update a compliance requirement
 *
 * @param id - Requirement UUID
 * @param data - Update data
 * @returns Promise that resolves to updated requirement
 *
 * @throws {NotFoundException} When requirement not found (404)
 * @throws {ValidationException} When validation fails (400)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks PROPERTY_MANAGER or SUPER_ADMIN role (403)
 *
 * @example
 * ```typescript
 * const updated = await updateComplianceRequirement('uuid-here', {
 *   frequency: 'SEMI_ANNUALLY',
 *   status: 'INACTIVE'
 * });
 * ```
 */
export async function updateComplianceRequirement(
  id: string,
  data: UpdateComplianceRequirementDto
): Promise<ComplianceRequirementDetail> {
  const response = await apiClient.put<GetRequirementResponse>(
    `${COMPLIANCE_REQUIREMENTS_BASE_PATH}/${id}`,
    data
  );
  return response.data.data;
}

/**
 * Delete a compliance requirement
 *
 * @param id - Requirement UUID
 * @returns Promise that resolves when deleted
 *
 * @throws {NotFoundException} When requirement not found (404)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks SUPER_ADMIN role (403)
 */
export async function deleteComplianceRequirement(id: string): Promise<void> {
  await apiClient.delete(`${COMPLIANCE_REQUIREMENTS_BASE_PATH}/${id}`);
}

// ============================================================================
// COMPLIANCE SCHEDULES
// ============================================================================

/**
 * Get paginated list of compliance schedules with filters
 *
 * @param filters - Optional filters (propertyId, requirementId, category, status, date range)
 * @returns Promise that resolves to paginated list of schedules
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 *
 * @example
 * ```typescript
 * const response = await getComplianceSchedules({
 *   status: 'OVERDUE',
 *   propertyId: 'property-uuid',
 *   page: 0,
 *   size: 20
 * });
 * ```
 */
export async function getComplianceSchedules(
  filters?: ComplianceScheduleFilters
): Promise<ComplianceScheduleListResponse> {
  const params: Record<string, any> = {
    page: filters?.page ?? 0,
    size: filters?.size ?? 20,
    sortBy: filters?.sortBy ?? 'dueDate',
    sortDirection: filters?.sortDirection ?? 'ASC'
  };

  if (filters?.propertyId) {
    params.propertyId = filters.propertyId;
  }
  if (filters?.requirementId) {
    params.requirementId = filters.requirementId;
  }
  if (filters?.category) {
    params.category = filters.category;
  }
  if (filters?.status) {
    params.status = filters.status;
  }
  if (filters?.dueDateStart) {
    params.dueDateStart = filters.dueDateStart;
  }
  if (filters?.dueDateEnd) {
    params.dueDateEnd = filters.dueDateEnd;
  }

  const response = await apiClient.get<ComplianceScheduleListResponse>(
    COMPLIANCE_SCHEDULES_BASE_PATH,
    { params }
  );
  return response.data;
}

/**
 * Get compliance schedule details by ID
 *
 * @param id - Schedule UUID
 * @returns Promise that resolves to schedule details
 *
 * @throws {NotFoundException} When schedule not found (404)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 */
export async function getComplianceSchedule(id: string): Promise<ComplianceScheduleDetail> {
  const response = await apiClient.get<{ success: boolean; data: ComplianceScheduleDetail }>(
    `${COMPLIANCE_SCHEDULES_BASE_PATH}/${id}`
  );
  return response.data.data;
}

/**
 * Mark a compliance schedule as complete
 *
 * @param id - Schedule UUID
 * @param data - Completion data (completedDate, notes, optional certificateFile)
 * @returns Promise that resolves to completed schedule and next schedule if recurring
 *
 * @throws {NotFoundException} When schedule not found (404)
 * @throws {ValidationException} When validation fails (400)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks required role (403)
 *
 * @example
 * ```typescript
 * const result = await completeComplianceSchedule('uuid-here', {
 *   completedDate: '2025-11-29',
 *   notes: 'Passed inspection with no issues',
 *   certificateFile: file // optional
 * });
 *
 * console.log(result.completedSchedule.status); // 'COMPLETED'
 * console.log(result.nextSchedule?.dueDate); // next due date for recurring
 * ```
 */
export async function completeComplianceSchedule(
  id: string,
  data: CompleteScheduleDto
): Promise<{ completedSchedule: ComplianceScheduleDetail; nextSchedule?: ComplianceScheduleListItem }> {
  const formData = new FormData();
  formData.append('completedDate', data.completedDate);
  if (data.notes) {
    formData.append('notes', data.notes);
  }
  if (data.certificateFile) {
    formData.append('certificateFile', data.certificateFile);
  }

  const response = await apiClient.patch<CompleteScheduleResponse>(
    `${COMPLIANCE_SCHEDULES_BASE_PATH}/${id}/complete`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }
  );
  return response.data.data;
}

/**
 * Mark a compliance schedule as exempt
 *
 * @param id - Schedule UUID
 * @param notes - Reason for exemption
 * @returns Promise that resolves to updated schedule
 */
export async function exemptComplianceSchedule(
  id: string,
  notes: string
): Promise<ComplianceScheduleDetail> {
  const response = await apiClient.patch<{ success: boolean; data: ComplianceScheduleDetail }>(
    `${COMPLIANCE_SCHEDULES_BASE_PATH}/${id}/exempt`,
    { notes }
  );
  return response.data.data;
}

// ============================================================================
// INSPECTIONS
// ============================================================================

/**
 * Get paginated list of inspections with filters
 *
 * @param filters - Optional filters (propertyId, complianceScheduleId, status, result, date range)
 * @returns Promise that resolves to paginated list of inspections
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 */
export async function getInspections(filters?: InspectionFilters): Promise<InspectionListResponse> {
  const params: Record<string, any> = {
    page: filters?.page ?? 0,
    size: filters?.size ?? 20,
    sortBy: filters?.sortBy ?? 'scheduledDate',
    sortDirection: filters?.sortDirection ?? 'DESC'
  };

  if (filters?.propertyId) {
    params.propertyId = filters.propertyId;
  }
  if (filters?.complianceScheduleId) {
    params.complianceScheduleId = filters.complianceScheduleId;
  }
  if (filters?.status) {
    params.status = filters.status;
  }
  if (filters?.result) {
    params.result = filters.result;
  }
  if (filters?.scheduledDateStart) {
    params.scheduledDateStart = filters.scheduledDateStart;
  }
  if (filters?.scheduledDateEnd) {
    params.scheduledDateEnd = filters.scheduledDateEnd;
  }

  const response = await apiClient.get<InspectionListResponse>(
    INSPECTIONS_BASE_PATH,
    { params }
  );
  return response.data;
}

/**
 * Get inspection details by ID
 *
 * @param id - Inspection UUID
 * @returns Promise that resolves to inspection details
 *
 * @throws {NotFoundException} When inspection not found (404)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 */
export async function getInspection(id: string): Promise<InspectionDetail> {
  const response = await apiClient.get<InspectionResponse>(`${INSPECTIONS_BASE_PATH}/${id}`);
  return response.data.data;
}

/**
 * Schedule a new inspection
 *
 * @param data - Inspection creation data (complianceScheduleId, propertyId, inspectorName, scheduledDate)
 * @returns Promise that resolves to created inspection
 *
 * @throws {ValidationException} When validation fails (400)
 * @throws {NotFoundException} When schedule or property not found (404)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks required role (403)
 *
 * @example
 * ```typescript
 * const inspection = await createInspection({
 *   complianceScheduleId: 'schedule-uuid',
 *   propertyId: 'property-uuid',
 *   inspectorName: 'John Smith',
 *   scheduledDate: '2025-12-15'
 * });
 *
 * console.log(inspection.status); // 'SCHEDULED'
 * ```
 */
export async function createInspection(data: CreateInspectionDto): Promise<InspectionDetail> {
  const response = await apiClient.post<InspectionResponse>(INSPECTIONS_BASE_PATH, data);
  return response.data.data;
}

/**
 * Update inspection results
 *
 * @param id - Inspection UUID
 * @param data - Update data (inspectionDate, status, result, issuesFound, recommendations, certificateFile, nextInspectionDate)
 * @returns Promise that resolves to updated inspection
 *
 * Note: If result is FAILED, a remediation work order will be automatically created
 *
 * @throws {NotFoundException} When inspection not found (404)
 * @throws {ValidationException} When validation fails (400)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks required role (403)
 *
 * @example
 * ```typescript
 * // Passing inspection
 * const passed = await updateInspection('uuid-here', {
 *   inspectionDate: '2025-11-29',
 *   status: 'PASSED',
 *   result: 'PASSED',
 *   certificateFile: certificatePdf
 * });
 *
 * // Failing inspection - creates remediation work order
 * const failed = await updateInspection('uuid-here', {
 *   inspectionDate: '2025-11-29',
 *   status: 'FAILED',
 *   result: 'FAILED',
 *   issuesFound: 'Fire extinguishers expired'
 * });
 *
 * console.log(failed.remediationWorkOrderId); // auto-created work order
 * ```
 */
export async function updateInspection(
  id: string,
  data: UpdateInspectionDto
): Promise<InspectionDetail> {
  const formData = new FormData();

  if (data.inspectionDate) {
    formData.append('inspectionDate', data.inspectionDate);
  }
  if (data.status) {
    formData.append('status', data.status);
  }
  if (data.result) {
    formData.append('result', data.result);
  }
  if (data.issuesFound) {
    formData.append('issuesFound', data.issuesFound);
  }
  if (data.recommendations) {
    formData.append('recommendations', data.recommendations);
  }
  if (data.nextInspectionDate) {
    formData.append('nextInspectionDate', data.nextInspectionDate);
  }
  if (data.certificateFile) {
    formData.append('certificateFile', data.certificateFile);
  }

  const response = await apiClient.put<InspectionResponse>(
    `${INSPECTIONS_BASE_PATH}/${id}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }
  );
  return response.data.data;
}

// ============================================================================
// VIOLATIONS
// ============================================================================

/**
 * Get paginated list of violations with filters
 *
 * @param filters - Optional filters (complianceScheduleId, fineStatus, date range)
 * @returns Promise that resolves to paginated list of violations
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 */
export async function getViolations(filters?: ViolationFilters): Promise<ViolationListResponse> {
  const params: Record<string, any> = {
    page: filters?.page ?? 0,
    size: filters?.size ?? 20,
    sortBy: filters?.sortBy ?? 'violationDate',
    sortDirection: filters?.sortDirection ?? 'DESC'
  };

  if (filters?.complianceScheduleId) {
    params.complianceScheduleId = filters.complianceScheduleId;
  }
  if (filters?.fineStatus) {
    params.fineStatus = filters.fineStatus;
  }
  if (filters?.violationDateStart) {
    params.violationDateStart = filters.violationDateStart;
  }
  if (filters?.violationDateEnd) {
    params.violationDateEnd = filters.violationDateEnd;
  }

  const response = await apiClient.get<ViolationListResponse>(VIOLATIONS_BASE_PATH, { params });
  return response.data;
}

/**
 * Get violation details by ID
 *
 * @param id - Violation UUID
 * @returns Promise that resolves to violation details
 *
 * @throws {NotFoundException} When violation not found (404)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 */
export async function getViolation(id: string): Promise<ViolationDetail> {
  const response = await apiClient.get<ViolationResponse>(`${VIOLATIONS_BASE_PATH}/${id}`);
  return response.data.data;
}

/**
 * Record a new violation
 *
 * @param data - Violation creation data
 * @returns Promise that resolves to created violation
 *
 * @throws {ValidationException} When validation fails (400)
 * @throws {NotFoundException} When schedule not found (404)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks required role (403)
 *
 * @example
 * ```typescript
 * const violation = await createViolation({
 *   complianceScheduleId: 'schedule-uuid',
 *   violationDate: '2025-11-29',
 *   description: 'Fire safety equipment not maintained',
 *   fineAmount: 5000,
 *   createRemediationWorkOrder: true
 * });
 *
 * console.log(violation.violationNumber); // "VIO-2025-0001"
 * console.log(violation.remediationWorkOrderId); // created if requested
 * ```
 */
export async function createViolation(data: CreateViolationDto): Promise<ViolationDetail> {
  const response = await apiClient.post<ViolationResponse>(VIOLATIONS_BASE_PATH, data);
  return response.data.data;
}

/**
 * Update a violation
 *
 * @param id - Violation UUID
 * @param data - Update data (description, fineAmount, fineStatus, resolutionDate, remediationWorkOrderId)
 * @returns Promise that resolves to updated violation
 *
 * @throws {NotFoundException} When violation not found (404)
 * @throws {ValidationException} When validation fails (400)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks required role (403)
 *
 * @example
 * ```typescript
 * const updated = await updateViolation('uuid-here', {
 *   fineStatus: 'PAID',
 *   resolutionDate: '2025-12-01'
 * });
 * ```
 */
export async function updateViolation(
  id: string,
  data: UpdateViolationDto
): Promise<ViolationDetail> {
  const response = await apiClient.put<ViolationResponse>(
    `${VIOLATIONS_BASE_PATH}/${id}`,
    data
  );
  return response.data.data;
}

// ============================================================================
// DASHBOARD
// ============================================================================

/**
 * Get compliance dashboard data
 *
 * @returns Promise that resolves to dashboard KPIs and metrics
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 *
 * @example
 * ```typescript
 * const dashboard = await getComplianceDashboard();
 *
 * console.log(dashboard.upcomingInspections); // count in next 30 days
 * console.log(dashboard.overdueComplianceItems); // count
 * console.log(dashboard.complianceRatePercentage); // e.g., 85.5
 * console.log(dashboard.inspectionsByStatus); // { SCHEDULED: 5, PASSED: 10, ... }
 * ```
 */
export async function getComplianceDashboard(): Promise<ComplianceDashboard> {
  const response = await apiClient.get<ComplianceDashboardResponse>(COMPLIANCE_DASHBOARD_PATH);
  return response.data.data;
}

// ============================================================================
// PROPERTY COMPLIANCE HISTORY
// ============================================================================

/**
 * Get compliance history for a specific property
 *
 * @param propertyId - Property UUID
 * @returns Promise that resolves to property's compliance history
 *
 * @throws {NotFoundException} When property not found (404)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 *
 * @example
 * ```typescript
 * const history = await getPropertyComplianceHistory('property-uuid');
 *
 * history.forEach(item => {
 *   console.log(item.schedule.requirementName);
 *   console.log(item.inspections);
 *   console.log(item.violations);
 * });
 * ```
 */
export async function getPropertyComplianceHistory(
  propertyId: string
): Promise<PropertyComplianceHistoryItem[]> {
  const response = await apiClient.get<PropertyComplianceHistoryResponse>(
    `/v1/properties/${propertyId}/compliance-history`
  );
  return response.data.data;
}

// ============================================================================
// CERTIFICATE DOWNLOAD
// ============================================================================

/**
 * Get download URL for a compliance certificate
 *
 * @param scheduleId - Schedule UUID
 * @returns Promise that resolves to presigned download URL
 *
 * @throws {NotFoundException} When schedule or certificate not found (404)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 */
export async function getScheduleCertificateUrl(scheduleId: string): Promise<string> {
  const response = await apiClient.get<{ success: boolean; data: { url: string } }>(
    `${COMPLIANCE_SCHEDULES_BASE_PATH}/${scheduleId}/certificate`
  );
  return response.data.data.url;
}

/**
 * Get download URL for an inspection certificate
 *
 * @param inspectionId - Inspection UUID
 * @returns Promise that resolves to presigned download URL
 *
 * @throws {NotFoundException} When inspection or certificate not found (404)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 */
export async function getInspectionCertificateUrl(inspectionId: string): Promise<string> {
  const response = await apiClient.get<{ success: boolean; data: { url: string } }>(
    `${INSPECTIONS_BASE_PATH}/${inspectionId}/certificate`
  );
  return response.data.data.url;
}

// ============================================================================
// SERVICE EXPORT
// ============================================================================

export const complianceService = {
  // Requirements
  createComplianceRequirement,
  getComplianceRequirements,
  getComplianceRequirement,
  updateComplianceRequirement,
  deleteComplianceRequirement,
  // Aliases for requirements (shorter names)
  createRequirement: createComplianceRequirement,
  getRequirements: getComplianceRequirements,
  getRequirementById: getComplianceRequirement,
  updateRequirement: updateComplianceRequirement,
  deleteRequirement: deleteComplianceRequirement,

  // Schedules
  getComplianceSchedules,
  getComplianceSchedule,
  completeComplianceSchedule,
  exemptComplianceSchedule,
  // Aliases for schedules (shorter names)
  getSchedules: getComplianceSchedules,
  getScheduleById: getComplianceSchedule,
  completeSchedule: completeComplianceSchedule,
  exemptSchedule: exemptComplianceSchedule,

  // Inspections
  getInspections,
  getInspection,
  createInspection,
  updateInspection,
  // Aliases for inspections
  getInspectionById: getInspection,

  // Violations
  getViolations,
  getViolation,
  createViolation,
  updateViolation,
  // Aliases for violations
  getViolationById: getViolation,

  // Dashboard
  getComplianceDashboard,
  // Alias for dashboard
  getDashboard: getComplianceDashboard,

  // Property history
  getPropertyComplianceHistory,

  // Certificates
  getScheduleCertificateUrl,
  getInspectionCertificateUrl
};

export default complianceService;
