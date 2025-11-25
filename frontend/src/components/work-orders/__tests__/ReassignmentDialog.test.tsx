/**
 * Tests for ReassignmentDialog component
 * Story 4.3 - Work Order Assignment and Vendor Coordination
 * AC #10: Reassign button + required reason field
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReassignmentDialog } from '../ReassignmentDialog';
import { getInternalStaffForAssignment, getExternalVendorsForAssignment } from '@/services/assignees.service';
import { AssigneeType } from '@/types';

// Mock the assignees service
jest.mock('@/services/assignees.service');
const mockGetInternalStaff = getInternalStaffForAssignment as jest.MockedFunction<typeof getInternalStaffForAssignment>;
const mockGetExternalVendors = getExternalVendorsForAssignment as jest.MockedFunction<typeof getExternalVendorsForAssignment>;

const mockWorkOrder = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  workOrderNumber: 'WO-2025-0001',
  assignedTo: 'staff-1',
  assigneeName: 'John Doe',
};

const mockInternalStaff = [
  {
    id: 'staff-1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'MAINTENANCE_SUPERVISOR',
    avatar: undefined,
  },
  {
    id: 'staff-2',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    role: 'MAINTENANCE_SUPERVISOR',
    avatar: undefined,
  },
  {
    id: 'staff-3',
    name: 'Bob Wilson',
    email: 'bob.wilson@example.com',
    role: 'MAINTENANCE_SUPERVISOR',
    avatar: undefined,
  },
];

const mockExternalVendors = [
  {
    id: 'vendor-1',
    companyName: 'ABC Plumbing',
    contactPerson: 'Mike Johnson',
    email: 'contact@abcplumbing.com',
    serviceCategories: ['PLUMBING'],
    rating: 4.5,
  },
];

describe('ReassignmentDialog', () => {
  const mockOnReassign = jest.fn();
  const mockOnOpenChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetInternalStaff.mockResolvedValue({
      success: true,
      message: 'Staff retrieved',
      data: mockInternalStaff,
      timestamp: new Date().toISOString(),
    });
    mockGetExternalVendors.mockResolvedValue({
      success: true,
      message: 'Vendors retrieved',
      data: mockExternalVendors,
      timestamp: new Date().toISOString(),
    });
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
      expect(screen.getByText('Reassign Work Order')).toBeInTheDocument();
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
      expect(screen.getByLabelText(/reassignment reason/i)).toBeInTheDocument();
    });
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

    // Select new assignee
    const staffItem = screen.getByText('Jane Smith').closest('button');
    if (staffItem) {
      await user.click(staffItem);
    }

    // Enter short reason (less than 10 chars)
    const reasonTextarea = screen.getByLabelText(/reassignment reason/i);
    await user.type(reasonTextarea, 'Short');

    // Try to submit
    const submitButton = screen.getByRole('button', { name: /reassign work order/i });
    await user.click(submitButton);

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/at least 10 characters/i)).toBeInTheDocument();
    });

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

    // Select new assignee
    const staffItem = screen.getByText('Jane Smith').closest('button');
    if (staffItem) {
      await user.click(staffItem);
    }

    // Enter valid reassignment reason (10+ chars)
    const reasonTextarea = screen.getByLabelText(/reassignment reason/i);
    await user.type(reasonTextarea, 'Staff member unavailable due to schedule conflict');

    // Add optional notes
    const notesTextarea = screen.getByLabelText(/assignment notes/i);
    await user.type(notesTextarea, 'Please prioritize this task');

    // Submit form
    const submitButton = screen.getByRole('button', { name: /reassign work order/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnReassign).toHaveBeenCalledWith({
        newAssigneeType: AssigneeType.INTERNAL_STAFF,
        newAssigneeId: 'staff-2',
        reassignmentReason: 'Staff member unavailable due to schedule conflict',
        assignmentNotes: 'Please prioritize this task',
      });
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

  it('should not render when workOrder is null', () => {
    render(
      <ReassignmentDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        workOrder={null}
        onReassign={mockOnReassign}
        isSubmitting={false}
      />
    );

    expect(screen.queryByText('Reassign Work Order')).not.toBeInTheDocument();
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
