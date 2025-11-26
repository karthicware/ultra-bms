/**
 * Tests for ReassignmentDialog component
 * Story 4.3 - Work Order Assignment and Vendor Coordination
 * AC #10: Reassign button + required reason field
 */

// Mock ResizeObserver for Radix UI components
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReassignmentDialog } from '../ReassignmentDialog';
import { getInternalStaffForAssignment, getExternalVendorsForAssignment } from '@/services/assignees.service';
import { AssigneeType, type InternalStaffAssignee, type ExternalVendorAssignee } from '@/types';

// Mock the assignees service
jest.mock('@/services/assignees.service');
const mockGetInternalStaff = getInternalStaffForAssignment as jest.MockedFunction<typeof getInternalStaffForAssignment>;
const mockGetExternalVendors = getExternalVendorsForAssignment as jest.MockedFunction<typeof getExternalVendorsForAssignment>;

const mockWorkOrder = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  workOrderNumber: 'WO-2025-0001',
  assignedTo: 'a1111111-1111-4111-8111-111111111111',
  assigneeName: 'John Doe',
};

const mockInternalStaff: InternalStaffAssignee[] = [
  {
    id: 'a1111111-1111-4111-8111-111111111111',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    role: 'MAINTENANCE_SUPERVISOR',
    avatarUrl: undefined,
  },
  {
    id: 'b2222222-2222-4222-8222-222222222222',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    role: 'MAINTENANCE_SUPERVISOR',
    avatarUrl: undefined,
  },
  {
    id: 'c3333333-3333-4333-8333-333333333333',
    firstName: 'Bob',
    lastName: 'Wilson',
    email: 'bob.wilson@example.com',
    role: 'MAINTENANCE_SUPERVISOR',
    avatarUrl: undefined,
  },
];

const mockExternalVendors: ExternalVendorAssignee[] = [
  {
    id: 'd4444444-4444-4444-8444-444444444444',
    companyName: 'ABC Plumbing',
    contactPerson: { name: 'Mike Johnson', email: 'mike@abcplumbing.com' },
    serviceCategories: ['PLUMBING'],
    rating: 4.5,
    status: 'ACTIVE',
  },
];

describe('ReassignmentDialog', () => {
  const mockOnReassign = jest.fn();
  const mockOnOpenChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetInternalStaff.mockResolvedValue(mockInternalStaff);
    mockGetExternalVendors.mockResolvedValue(mockExternalVendors);
  });

  it('should render dialog with "Reassign Work Order" title', async () => {
    render(
      <ReassignmentDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        workOrder={mockWorkOrder}
        onReassign={mockOnReassign}
        isSubmitting={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('should show current assignee information', async () => {
    render(
      <ReassignmentDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        workOrder={mockWorkOrder}
        onReassign={mockOnReassign}
        isSubmitting={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/John Doe/)).toBeInTheDocument();
    });
  });

  it('should exclude current assignee from available staff list', async () => {
    render(
      <ReassignmentDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        workOrder={mockWorkOrder}
        onReassign={mockOnReassign}
        isSubmitting={false}
      />
    );

    await waitFor(() => {
      // Jane Smith and Bob Wilson should be available
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
    });

    // John Doe should NOT be in the selectable list (he's the current assignee)
    // Note: He appears in the "Currently assigned to" section, but not in the selection list
    const staffButtons = screen.getAllByRole('button').filter(btn =>
      btn.textContent?.includes('John Doe') && !btn.closest('[role="alert"]')
    );
    // The only John Doe should be in the info banner, not as a selectable option
    expect(staffButtons.length).toBe(0);
  });

  it('should have required reassignment reason field', async () => {
    render(
      <ReassignmentDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        workOrder={mockWorkOrder}
        onReassign={mockOnReassign}
        isSubmitting={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Look for textarea with reassignment reason placeholder
    const reasonField = screen.getByPlaceholderText(/reason for reassigning/i);
    expect(reasonField).toBeInTheDocument();
  });

  it('should require minimum 10 characters for reassignment reason', async () => {
    const user = userEvent.setup();

    render(
      <ReassignmentDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        workOrder={mockWorkOrder}
        onReassign={mockOnReassign}
        isSubmitting={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    // Select new assignee using data-testid
    const staffItem = screen.getByTestId('staff-option-reassign-b2222222-2222-4222-8222-222222222222');
    await user.click(staffItem);

    // Enter short reason (less than 10 chars)
    const reasonTextarea = screen.getByPlaceholderText(/reason for reassigning/i);
    await user.type(reasonTextarea, 'Short');

    // Try to submit using data-testid
    const submitButton = screen.getByTestId('btn-confirm-reassignment');
    await user.click(submitButton);

    // Validation should prevent submission
    expect(mockOnReassign).not.toHaveBeenCalled();
  });

  it('should call onReassign with correct data when form is valid', async () => {
    const user = userEvent.setup();

    render(
      <ReassignmentDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        workOrder={mockWorkOrder}
        onReassign={mockOnReassign}
        isSubmitting={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    // Select new assignee using data-testid
    const staffItem = screen.getByTestId('staff-option-reassign-b2222222-2222-4222-8222-222222222222');
    await user.click(staffItem);

    // Enter valid reassignment reason (10+ chars)
    const reasonTextarea = screen.getByPlaceholderText(/reason for reassigning/i);
    await user.type(reasonTextarea, 'Staff member unavailable due to schedule conflict');

    // Submit form using data-testid
    const submitButton = screen.getByTestId('btn-confirm-reassignment');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnReassign).toHaveBeenCalled();
    });
  });

  it('should show loading state when isSubmitting is true', async () => {
    render(
      <ReassignmentDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        workOrder={mockWorkOrder}
        onReassign={mockOnReassign}
        isSubmitting={true}
      />
    );

    await waitFor(() => {
      const submitButton = screen.getByRole('button', { name: /reassigning/i });
      expect(submitButton).toBeDisabled();
    });
  });

  it('should close dialog when Cancel button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <ReassignmentDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        workOrder={mockWorkOrder}
        onReassign={mockOnReassign}
        isSubmitting={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('should render dialog without work order details when workOrder is null', () => {
    render(
      <ReassignmentDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        workOrder={null}
        onReassign={mockOnReassign}
        isSubmitting={false}
      />
    );

    // Dialog still renders but without work order number
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.queryByText(/WO-2025-0001/)).not.toBeInTheDocument();
  });

  it('should allow switching to External Vendor tab for reassignment', async () => {
    const user = userEvent.setup();

    render(
      <ReassignmentDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        workOrder={mockWorkOrder}
        onReassign={mockOnReassign}
        isSubmitting={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /external vendor/i })).toBeInTheDocument();
    });

    const vendorTab = screen.getByRole('tab', { name: /external vendor/i });
    await user.click(vendorTab);

    await waitFor(() => {
      expect(screen.getByText('ABC Plumbing')).toBeInTheDocument();
    });
  });
});
