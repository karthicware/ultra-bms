/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Assignees Service for Work Order Assignment
 * Story 4.3: Work Order Assignment and Vendor Coordination
 *
 * Provides methods to fetch internal staff and external vendors for assignment
 * External vendors will be fully implemented when Epic 5 (Vendor Management) is complete
 */

import { apiClient } from '@/lib/api';
import type {
  AssigneeType,
  InternalStaffAssignee,
  ExternalVendorAssignee,
  AssigneeOption,
  InternalStaffListResponse,
  VendorListResponse
} from '@/types/work-order-assignment';

// ============================================================================
// INTERNAL STAFF
// ============================================================================

/**
 * Get list of internal staff available for assignment
 * Returns users with MAINTENANCE_SUPERVISOR role who are active
 *
 * @returns Promise that resolves to list of internal staff
 *
 * @example
 * ```typescript
 * const staff = await getInternalStaffForAssignment();
 * staff.forEach(member => {
 *   console.log(`${member.firstName} ${member.lastName} - ${member.email}`);
 * });
 * ```
 */
export async function getInternalStaffForAssignment(): Promise<InternalStaffAssignee[]> {
  try {
    const response = await apiClient.get<InternalStaffListResponse>(
      '/v1/users',
      { params: { role: 'MAINTENANCE_SUPERVISOR', status: 'ACTIVE' } }
    );
    return response.data.data || [];
  } catch {
    // Return empty array if API fails (e.g., endpoint not implemented)
    console.warn('Failed to fetch internal staff, returning empty list');
    return [];
  }
}

// ============================================================================
// EXTERNAL VENDORS
// ============================================================================

/**
 * Get list of external vendors available for assignment
 * Optionally filtered by service category matching work order category
 *
 * Note: Vendor management (Epic 5) is not yet implemented.
 * This function returns mock data until vendors are available.
 *
 * @param serviceCategory - Optional category to filter vendors by (e.g., 'PLUMBING', 'ELECTRICAL')
 *
 * @returns Promise that resolves to list of external vendors
 *
 * @example
 * ```typescript
 * const vendors = await getExternalVendorsForAssignment('PLUMBING');
 * vendors.forEach(vendor => {
 *   console.log(`${vendor.companyName} - Rating: ${vendor.rating}/5`);
 * });
 * ```
 */
export async function getExternalVendorsForAssignment(
  serviceCategory?: string
): Promise<ExternalVendorAssignee[]> {
  try {
    const params: Record<string, any> = { status: 'ACTIVE' };
    if (serviceCategory) {
      params.serviceCategory = serviceCategory;
    }

    const response = await apiClient.get<VendorListResponse>(
      '/v1/vendors',
      { params }
    );
    return response.data.data || [];
  } catch {
    // Vendor management not yet implemented - return empty array
    // Will be populated when Epic 5 is complete
    console.warn('Vendor endpoint not available, returning empty list');
    return [];
  }
}

// ============================================================================
// COMBINED ASSIGNEES
// ============================================================================

/**
 * Get all assignees (both internal staff and external vendors) formatted for dropdown
 * Groups assignees by type for organized display
 *
 * @param workOrderCategory - Work order category to filter vendors by
 *
 * @returns Promise that resolves to combined list of assignee options
 *
 * @example
 * ```typescript
 * const assignees = await getAllAssigneesForDropdown('PLUMBING');
 * const internalStaff = assignees.filter(a => a.type === 'INTERNAL_STAFF');
 * const vendors = assignees.filter(a => a.type === 'EXTERNAL_VENDOR');
 * ```
 */
export async function getAllAssigneesForDropdown(
  workOrderCategory?: string
): Promise<AssigneeOption[]> {
  // Fetch both internal staff and vendors in parallel
  const [staff, vendors] = await Promise.all([
    getInternalStaffForAssignment(),
    getExternalVendorsForAssignment(workOrderCategory)
  ]);

  const assigneeOptions: AssigneeOption[] = [];

  // Map internal staff to AssigneeOption
  staff.forEach((member) => {
    assigneeOptions.push({
      id: member.id,
      name: `${member.firstName} ${member.lastName}`,
      type: 'INTERNAL_STAFF' as AssigneeType,
      email: member.email,
      role: member.role,
      avatarUrl: member.avatarUrl
    });
  });

  // Map vendors to AssigneeOption
  vendors.forEach((vendor) => {
    assigneeOptions.push({
      id: vendor.id,
      name: vendor.companyName,
      type: 'EXTERNAL_VENDOR' as AssigneeType,
      companyName: vendor.companyName,
      serviceCategories: vendor.serviceCategories,
      rating: vendor.rating,
      contactPerson: vendor.contactPerson
    });
  });

  return assigneeOptions;
}

/**
 * Get grouped assignees for SelectGroup component
 * Returns assignees grouped by type with labels
 *
 * @param workOrderCategory - Work order category to filter vendors by
 *
 * @returns Promise that resolves to grouped assignee options
 */
export async function getGroupedAssigneesForDropdown(
  workOrderCategory?: string
): Promise<{
  internalStaff: AssigneeOption[];
  externalVendors: AssigneeOption[];
}> {
  const allAssignees = await getAllAssigneesForDropdown(workOrderCategory);

  return {
    internalStaff: allAssignees.filter(a => a.type === 'INTERNAL_STAFF'),
    externalVendors: allAssignees.filter(a => a.type === 'EXTERNAL_VENDOR')
  };
}
