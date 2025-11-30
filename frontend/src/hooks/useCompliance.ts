/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * React Query Hooks for Compliance Management
 * Story 7.3: Compliance and Inspection Tracking
 *
 * Provides hooks for fetching, creating, updating compliance requirements,
 * schedules, inspections, and violations with automatic cache invalidation
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  getComplianceRequirements,
  getComplianceRequirement,
  createComplianceRequirement,
  updateComplianceRequirement,
  deleteComplianceRequirement,
  getComplianceSchedules,
  getComplianceSchedule,
  completeComplianceSchedule,
  exemptComplianceSchedule,
  getInspections,
  getInspection,
  createInspection,
  updateInspection,
  getViolations,
  getViolation,
  createViolation,
  updateViolation,
  getComplianceDashboard,
  getPropertyComplianceHistory,
  getScheduleCertificateUrl,
  getInspectionCertificateUrl
} from '@/services/compliance.service';
import type {
  ComplianceRequirementFilters,
  ComplianceScheduleFilters,
  InspectionFilters,
  ViolationFilters,
  CreateComplianceRequirementDto,
  UpdateComplianceRequirementDto,
  CompleteScheduleDto,
  CreateInspectionDto,
  UpdateInspectionDto,
  CreateViolationDto,
  UpdateViolationDto,
  ComplianceRequirementListResponse,
  ComplianceRequirementDetail,
  ComplianceScheduleListResponse,
  ComplianceScheduleDetail,
  InspectionListResponse,
  InspectionDetail,
  ViolationListResponse,
  ViolationDetail,
  ComplianceDashboard,
  PropertyComplianceHistoryItem
} from '@/types/compliance';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const complianceKeys = {
  // Requirements
  requirements: ['compliance-requirements'] as const,
  requirementsList: () => [...complianceKeys.requirements, 'list'] as const,
  requirementsListFiltered: (filters: ComplianceRequirementFilters) =>
    [...complianceKeys.requirementsList(), filters] as const,
  requirementDetails: () => [...complianceKeys.requirements, 'detail'] as const,
  requirementDetail: (id: string) => [...complianceKeys.requirementDetails(), id] as const,

  // Schedules
  schedules: ['compliance-schedules'] as const,
  schedulesList: () => [...complianceKeys.schedules, 'list'] as const,
  schedulesListFiltered: (filters: ComplianceScheduleFilters) =>
    [...complianceKeys.schedulesList(), filters] as const,
  scheduleDetails: () => [...complianceKeys.schedules, 'detail'] as const,
  scheduleDetail: (id: string) => [...complianceKeys.scheduleDetails(), id] as const,

  // Inspections
  inspections: ['inspections'] as const,
  inspectionsList: () => [...complianceKeys.inspections, 'list'] as const,
  inspectionsListFiltered: (filters: InspectionFilters) =>
    [...complianceKeys.inspectionsList(), filters] as const,
  inspectionDetails: () => [...complianceKeys.inspections, 'detail'] as const,
  inspectionDetail: (id: string) => [...complianceKeys.inspectionDetails(), id] as const,

  // Violations
  violations: ['violations'] as const,
  violationsList: () => [...complianceKeys.violations, 'list'] as const,
  violationsListFiltered: (filters: ViolationFilters) =>
    [...complianceKeys.violationsList(), filters] as const,
  violationDetails: () => [...complianceKeys.violations, 'detail'] as const,
  violationDetail: (id: string) => [...complianceKeys.violationDetails(), id] as const,

  // Dashboard
  dashboard: ['compliance-dashboard'] as const,

  // Property history
  propertyHistory: (propertyId: string) =>
    ['property-compliance-history', propertyId] as const
};

// ============================================================================
// COMPLIANCE REQUIREMENTS HOOKS
// ============================================================================

/**
 * Hook to fetch paginated list of compliance requirements with filters
 *
 * @param filters - Optional filters (category, status, search, pagination)
 * @param enabled - Whether the query should execute (default: true)
 *
 * @example
 * ```typescript
 * const { data, isLoading } = useComplianceRequirements({
 *   category: 'FIRE',
 *   status: 'ACTIVE',
 *   page: 0,
 *   size: 20
 * });
 * ```
 */
export function useComplianceRequirements(
  filters?: ComplianceRequirementFilters,
  enabled: boolean = true
) {
  return useQuery<ComplianceRequirementListResponse>({
    queryKey: complianceKeys.requirementsListFiltered(filters ?? {}),
    queryFn: () => getComplianceRequirements(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled
  });
}

/**
 * Hook to fetch a single compliance requirement by ID
 *
 * @param id - Requirement UUID
 * @param enabled - Whether the query should execute (default: true)
 */
export function useComplianceRequirement(id: string, enabled: boolean = true) {
  return useQuery<ComplianceRequirementDetail>({
    queryKey: complianceKeys.requirementDetail(id),
    queryFn: () => getComplianceRequirement(id),
    staleTime: 5 * 60 * 1000,
    enabled: enabled && !!id
  });
}

/**
 * Hook to create a new compliance requirement
 *
 * @example
 * ```typescript
 * const { mutate: create, isPending } = useCreateComplianceRequirement();
 *
 * create({
 *   requirementName: 'Fire Safety Inspection',
 *   category: 'FIRE',
 *   frequency: 'ANNUALLY'
 * });
 * ```
 */
export function useCreateComplianceRequirement() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: CreateComplianceRequirementDto) => createComplianceRequirement(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: complianceKeys.requirements });
      queryClient.invalidateQueries({ queryKey: complianceKeys.schedules });
      queryClient.invalidateQueries({ queryKey: complianceKeys.dashboard });
      toast.success(
        `Compliance requirement created: ${data.requirementNumber}. ${data.schedulesCreated} schedules generated.`
      );
      router.push(`/compliance/requirements/${data.id}`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create compliance requirement';
      toast.error(message);
    }
  });
}

/**
 * Hook to update a compliance requirement
 */
export function useUpdateComplianceRequirement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateComplianceRequirementDto }) =>
      updateComplianceRequirement(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: complianceKeys.requirements });
      queryClient.invalidateQueries({ queryKey: complianceKeys.requirementDetail(variables.id) });
      queryClient.invalidateQueries({ queryKey: complianceKeys.schedules });
      toast.success('Compliance requirement updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update compliance requirement';
      toast.error(message);
    }
  });
}

/**
 * Hook to delete a compliance requirement
 */
export function useDeleteComplianceRequirement() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (id: string) => deleteComplianceRequirement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: complianceKeys.requirements });
      queryClient.invalidateQueries({ queryKey: complianceKeys.schedules });
      queryClient.invalidateQueries({ queryKey: complianceKeys.dashboard });
      toast.success('Compliance requirement deleted');
      router.push('/compliance/requirements');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete compliance requirement';
      toast.error(message);
    }
  });
}

// ============================================================================
// COMPLIANCE SCHEDULES HOOKS
// ============================================================================

/**
 * Hook to fetch paginated list of compliance schedules with filters
 *
 * @param filters - Optional filters (propertyId, requirementId, category, status, date range)
 * @param enabled - Whether the query should execute (default: true)
 *
 * @example
 * ```typescript
 * const { data, isLoading } = useComplianceSchedules({
 *   status: 'OVERDUE',
 *   propertyId: 'property-uuid',
 *   page: 0,
 *   size: 20
 * });
 * ```
 */
export function useComplianceSchedules(
  filters?: ComplianceScheduleFilters,
  enabled: boolean = true
) {
  return useQuery<ComplianceScheduleListResponse>({
    queryKey: complianceKeys.schedulesListFiltered(filters ?? {}),
    queryFn: () => getComplianceSchedules(filters),
    staleTime: 5 * 60 * 1000,
    enabled
  });
}

/**
 * Hook to fetch a single compliance schedule by ID
 *
 * @param id - Schedule UUID
 * @param enabled - Whether the query should execute (default: true)
 */
export function useComplianceSchedule(id: string, enabled: boolean = true) {
  return useQuery<ComplianceScheduleDetail>({
    queryKey: complianceKeys.scheduleDetail(id),
    queryFn: () => getComplianceSchedule(id),
    staleTime: 5 * 60 * 1000,
    enabled: enabled && !!id
  });
}

/**
 * Hook to mark a compliance schedule as complete
 *
 * @example
 * ```typescript
 * const { mutate: complete, isPending } = useCompleteComplianceSchedule();
 *
 * complete({
 *   id: 'schedule-uuid',
 *   data: {
 *     completedDate: '2025-11-29',
 *     notes: 'Passed inspection'
 *   }
 * });
 * ```
 */
export function useCompleteComplianceSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CompleteScheduleDto }) =>
      completeComplianceSchedule(id, data),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: complianceKeys.schedules });
      queryClient.invalidateQueries({ queryKey: complianceKeys.scheduleDetail(variables.id) });
      queryClient.invalidateQueries({ queryKey: complianceKeys.requirements });
      queryClient.invalidateQueries({ queryKey: complianceKeys.dashboard });

      const nextScheduleMsg = result.nextSchedule
        ? ` Next schedule due: ${result.nextSchedule.dueDate}`
        : '';
      toast.success(`Schedule marked complete.${nextScheduleMsg}`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to complete schedule';
      toast.error(message);
    }
  });
}

/**
 * Hook to mark a compliance schedule as exempt
 */
export function useExemptComplianceSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      exemptComplianceSchedule(id, notes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: complianceKeys.schedules });
      queryClient.invalidateQueries({ queryKey: complianceKeys.scheduleDetail(variables.id) });
      queryClient.invalidateQueries({ queryKey: complianceKeys.dashboard });
      toast.success('Schedule marked as exempt');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to exempt schedule';
      toast.error(message);
    }
  });
}

// ============================================================================
// INSPECTIONS HOOKS
// ============================================================================

/**
 * Hook to fetch paginated list of inspections with filters
 *
 * @param filters - Optional filters (propertyId, complianceScheduleId, status, result, date range)
 * @param enabled - Whether the query should execute (default: true)
 */
export function useInspections(filters?: InspectionFilters, enabled: boolean = true) {
  return useQuery<InspectionListResponse>({
    queryKey: complianceKeys.inspectionsListFiltered(filters ?? {}),
    queryFn: () => getInspections(filters),
    staleTime: 5 * 60 * 1000,
    enabled
  });
}

/**
 * Hook to fetch a single inspection by ID
 *
 * @param id - Inspection UUID
 * @param enabled - Whether the query should execute (default: true)
 */
export function useInspection(id: string, enabled: boolean = true) {
  return useQuery<InspectionDetail>({
    queryKey: complianceKeys.inspectionDetail(id),
    queryFn: () => getInspection(id),
    staleTime: 5 * 60 * 1000,
    enabled: enabled && !!id
  });
}

/**
 * Hook to create/schedule a new inspection
 *
 * @example
 * ```typescript
 * const { mutate: schedule, isPending } = useCreateInspection();
 *
 * schedule({
 *   complianceScheduleId: 'schedule-uuid',
 *   propertyId: 'property-uuid',
 *   inspectorName: 'John Smith',
 *   scheduledDate: '2025-12-15'
 * });
 * ```
 */
export function useCreateInspection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInspectionDto) => createInspection(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: complianceKeys.inspections });
      queryClient.invalidateQueries({ queryKey: complianceKeys.schedules });
      queryClient.invalidateQueries({ queryKey: complianceKeys.dashboard });
      toast.success(`Inspection scheduled for ${data.scheduledDate}`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to schedule inspection';
      toast.error(message);
    }
  });
}

/**
 * Hook to update inspection results
 *
 * Note: If inspection fails, a remediation work order is automatically created
 */
export function useUpdateInspection() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInspectionDto }) =>
      updateInspection(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: complianceKeys.inspections });
      queryClient.invalidateQueries({ queryKey: complianceKeys.inspectionDetail(variables.id) });
      queryClient.invalidateQueries({ queryKey: complianceKeys.schedules });
      queryClient.invalidateQueries({ queryKey: complianceKeys.dashboard });

      if (data.remediationWorkOrderId) {
        toast.success(
          'Inspection results saved. Remediation work order created.',
          {
            action: {
              label: 'View Work Order',
              onClick: () => router.push(`/property-manager/work-orders/${data.remediationWorkOrderId}`)
            }
          }
        );
      } else {
        toast.success('Inspection results saved');
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update inspection';
      toast.error(message);
    }
  });
}

// ============================================================================
// VIOLATIONS HOOKS
// ============================================================================

/**
 * Hook to fetch paginated list of violations with filters
 *
 * @param filters - Optional filters (complianceScheduleId, fineStatus, date range)
 * @param enabled - Whether the query should execute (default: true)
 */
export function useViolations(filters?: ViolationFilters, enabled: boolean = true) {
  return useQuery<ViolationListResponse>({
    queryKey: complianceKeys.violationsListFiltered(filters ?? {}),
    queryFn: () => getViolations(filters),
    staleTime: 5 * 60 * 1000,
    enabled
  });
}

/**
 * Hook to fetch a single violation by ID
 *
 * @param id - Violation UUID
 * @param enabled - Whether the query should execute (default: true)
 */
export function useViolation(id: string, enabled: boolean = true) {
  return useQuery<ViolationDetail>({
    queryKey: complianceKeys.violationDetail(id),
    queryFn: () => getViolation(id),
    staleTime: 5 * 60 * 1000,
    enabled: enabled && !!id
  });
}

/**
 * Hook to record a new violation
 *
 * @example
 * ```typescript
 * const { mutate: record, isPending } = useCreateViolation();
 *
 * record({
 *   complianceScheduleId: 'schedule-uuid',
 *   violationDate: '2025-11-29',
 *   description: 'Fire safety equipment not maintained',
 *   fineAmount: 5000,
 *   createRemediationWorkOrder: true
 * });
 * ```
 */
export function useCreateViolation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateViolationDto) => createViolation(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: complianceKeys.violations });
      queryClient.invalidateQueries({ queryKey: complianceKeys.schedules });
      queryClient.invalidateQueries({ queryKey: complianceKeys.dashboard });
      toast.success(`Violation recorded: ${data.violationNumber}`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to record violation';
      toast.error(message);
    }
  });
}

/**
 * Hook to update a violation
 */
export function useUpdateViolation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateViolationDto }) =>
      updateViolation(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: complianceKeys.violations });
      queryClient.invalidateQueries({ queryKey: complianceKeys.violationDetail(variables.id) });
      queryClient.invalidateQueries({ queryKey: complianceKeys.dashboard });
      toast.success('Violation updated');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update violation';
      toast.error(message);
    }
  });
}

// ============================================================================
// DASHBOARD HOOK
// ============================================================================

/**
 * Hook to fetch compliance dashboard data
 *
 * @example
 * ```typescript
 * const { data: dashboard, isLoading } = useComplianceDashboard();
 *
 * if (dashboard) {
 *   console.log(dashboard.complianceRatePercentage);
 *   console.log(dashboard.overdueComplianceItems);
 * }
 * ```
 */
export function useComplianceDashboard() {
  return useQuery<ComplianceDashboard>({
    queryKey: complianceKeys.dashboard,
    queryFn: () => getComplianceDashboard(),
    staleTime: 2 * 60 * 1000, // 2 minutes for dashboard data
    refetchInterval: 5 * 60 * 1000 // Refetch every 5 minutes
  });
}

// ============================================================================
// PROPERTY COMPLIANCE HISTORY HOOK
// ============================================================================

/**
 * Hook to fetch compliance history for a specific property
 *
 * @param propertyId - Property UUID
 * @param enabled - Whether the query should execute (default: true)
 */
export function usePropertyComplianceHistory(propertyId: string, enabled: boolean = true) {
  return useQuery<PropertyComplianceHistoryItem[]>({
    queryKey: complianceKeys.propertyHistory(propertyId),
    queryFn: () => getPropertyComplianceHistory(propertyId),
    staleTime: 5 * 60 * 1000,
    enabled: enabled && !!propertyId
  });
}

// ============================================================================
// CERTIFICATE URL HOOKS
// ============================================================================

/**
 * Hook to get schedule certificate download URL
 *
 * @param scheduleId - Schedule UUID
 * @param enabled - Whether the query should execute (default: true)
 */
export function useScheduleCertificateUrl(scheduleId: string, enabled: boolean = true) {
  return useQuery<string>({
    queryKey: [...complianceKeys.scheduleDetail(scheduleId), 'certificate'],
    queryFn: () => getScheduleCertificateUrl(scheduleId),
    staleTime: 10 * 60 * 1000, // 10 minutes (URL validity)
    enabled: enabled && !!scheduleId
  });
}

/**
 * Hook to get inspection certificate download URL
 *
 * @param inspectionId - Inspection UUID
 * @param enabled - Whether the query should execute (default: true)
 */
export function useInspectionCertificateUrl(inspectionId: string, enabled: boolean = true) {
  return useQuery<string>({
    queryKey: [...complianceKeys.inspectionDetail(inspectionId), 'certificate'],
    queryFn: () => getInspectionCertificateUrl(inspectionId),
    staleTime: 10 * 60 * 1000,
    enabled: enabled && !!inspectionId
  });
}

// ============================================================================
// REFETCH UTILITIES
// ============================================================================

/**
 * Hook to get refetch functions for compliance data
 * Useful for manual refresh after external changes
 */
export function useRefreshCompliance() {
  const queryClient = useQueryClient();

  return {
    refreshRequirements: () =>
      queryClient.invalidateQueries({ queryKey: complianceKeys.requirements }),
    refreshSchedules: () =>
      queryClient.invalidateQueries({ queryKey: complianceKeys.schedules }),
    refreshInspections: () =>
      queryClient.invalidateQueries({ queryKey: complianceKeys.inspections }),
    refreshViolations: () =>
      queryClient.invalidateQueries({ queryKey: complianceKeys.violations }),
    refreshDashboard: () =>
      queryClient.invalidateQueries({ queryKey: complianceKeys.dashboard }),
    refreshAll: () => {
      queryClient.invalidateQueries({ queryKey: complianceKeys.requirements });
      queryClient.invalidateQueries({ queryKey: complianceKeys.schedules });
      queryClient.invalidateQueries({ queryKey: complianceKeys.inspections });
      queryClient.invalidateQueries({ queryKey: complianceKeys.violations });
      queryClient.invalidateQueries({ queryKey: complianceKeys.dashboard });
    }
  };
}
