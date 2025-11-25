/**
 * Work Order Assignment Types and Interfaces
 * Story 4.3: Work Order Assignment and Vendor Coordination
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Assignee type for work order assignment
 * Determines whether the assignee is internal staff or external vendor
 */
export enum AssigneeType {
  INTERNAL_STAFF = 'INTERNAL_STAFF',
  EXTERNAL_VENDOR = 'EXTERNAL_VENDOR'
}

// ============================================================================
// MAIN INTERFACES
// ============================================================================

/**
 * Work order assignment record
 * Represents a single assignment (initial or reassignment) in the assignment history
 */
export interface WorkOrderAssignment {
  id: string;
  workOrderId: string;
  assigneeType: AssigneeType;
  assigneeId: string;
  assigneeName: string;
  assignedBy: string;
  assignedByName: string;
  assignedDate: string; // ISO datetime string
  reassignmentReason?: string;
  assignmentNotes?: string;
}

/**
 * Assignee option for dropdowns
 * Used in both internal staff and external vendor selection
 */
export interface AssigneeOption {
  id: string;
  name: string;
  type: AssigneeType;
  email?: string;
  // Internal staff specific
  role?: string;
  avatarUrl?: string;
  // External vendor specific
  companyName?: string;
  serviceCategories?: string[];
  rating?: number;
  contactPerson?: {
    name: string;
    email: string;
    phone?: string;
  };
}

/**
 * Internal staff user for assignment
 */
export interface InternalStaffAssignee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

/**
 * External vendor for assignment
 */
export interface ExternalVendorAssignee {
  id: string;
  companyName: string;
  serviceCategories: string[];
  rating: number;
  contactPerson: {
    name: string;
    email: string;
    phone?: string;
  };
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

// ============================================================================
// DTO INTERFACES
// ============================================================================

/**
 * DTO for assigning a work order
 */
export interface AssignWorkOrderRequest {
  assigneeType: AssigneeType;
  assigneeId: string;
  assignmentNotes?: string;
}

/**
 * DTO for reassigning a work order
 */
export interface ReassignWorkOrderRequest {
  newAssigneeType: AssigneeType;
  newAssigneeId: string;
  reassignmentReason: string;
  assignmentNotes?: string;
}

/**
 * Filters for listing unassigned work orders
 */
export interface UnassignedWorkOrderFilters {
  propertyId?: string;
  priority?: string[];
  category?: string[];
  search?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Response from assignment endpoint
 */
export interface AssignWorkOrderResponse {
  success: boolean;
  message: string;
  data: {
    workOrderId: string;
    assignedTo: {
      id: string;
      name: string;
      type: AssigneeType;
    };
    assignedDate: string;
  };
  timestamp: string;
}

/**
 * Response from reassignment endpoint
 */
export interface ReassignWorkOrderResponse {
  success: boolean;
  message: string;
  data: {
    workOrderId: string;
    previousAssignee: {
      id: string;
      name: string;
      type: AssigneeType;
    };
    newAssignee: {
      id: string;
      name: string;
      type: AssigneeType;
    };
    reassignedDate: string;
  };
  timestamp: string;
}

/**
 * Response from assignment history endpoint
 */
export interface AssignmentHistoryResponse {
  success: boolean;
  message: string;
  data: {
    assignments: WorkOrderAssignment[];
    totalElements: number;
  };
  timestamp: string;
}

/**
 * Response from internal staff list endpoint
 */
export interface InternalStaffListResponse {
  success: boolean;
  message: string;
  data: InternalStaffAssignee[];
  timestamp: string;
}

/**
 * Response from vendor list endpoint
 */
export interface VendorListResponse {
  success: boolean;
  message: string;
  data: ExternalVendorAssignee[];
  timestamp: string;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Assignee type display information
 */
export interface AssigneeTypeInfo {
  value: AssigneeType;
  label: string;
  description: string;
}

/**
 * Assignment type info options
 */
export const ASSIGNEE_TYPE_OPTIONS: AssigneeTypeInfo[] = [
  {
    value: AssigneeType.INTERNAL_STAFF,
    label: 'Internal Staff',
    description: 'Assign to in-house maintenance team member'
  },
  {
    value: AssigneeType.EXTERNAL_VENDOR,
    label: 'External Vendor',
    description: 'Assign to external contractor or service provider'
  }
];

/**
 * Form data for work order assignment
 */
export interface AssignWorkOrderFormData {
  assigneeType: AssigneeType;
  assigneeId: string;
  assignmentNotes: string;
}

/**
 * Form data for work order reassignment
 */
export interface ReassignWorkOrderFormData {
  newAssigneeType: AssigneeType;
  newAssigneeId: string;
  reassignmentReason: string;
  assignmentNotes: string;
}
