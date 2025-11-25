/**
 * Tests for AssignmentDialog component
 * Story 4.3 - Work Order Assignment and Vendor Coordination
 * AC #2: Tab interface (Internal Staff | External Vendor)
 * AC #3: Internal staff list with name, email, role
 * AC #4: Search/filter for internal staff
 * AC #5: Vendors grouped by service category
 * AC #6: Vendor rating display (1-5 stars)
 * AC #7: Optional assignment notes textarea
 */
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AssignmentDialog } from '../AssignmentDialog';
import { getInternalStaffForAssignment, getExternalVendorsForAssignment } from '@/services/assignees.service';
import { AssigneeType } from '@/types';

// Mock the assignees service
jest.mock('@/services/assignees.service');
const mockGetInternalStaff = getInternalStaffForAssignment as jest.MockedFunction<typeof getInternalStaffForAssignment>;
const mockGetExternalVendors = getExternalVendorsForAssignment as jest.MockedFunction<typeof getExternalVendorsForAssignment>;

const mockWorkOrder = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  workOrderNumber: 'WO-2025-0001',
  title: 'Fix leaking faucet',
  category: 'PLUMBING',
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
  {
    id: 'vendor-2',
    companyName: 'XYZ Electrical',
    contactPerson: 'Sarah Williams',
    email: 'contact@xyzelectrical.com',
    serviceCategories: ['ELECTRICAL'],
    rating: 4.0,
  },
];

describe('AssignmentDialog', () => {
  const mockOnAssign = jest.fn();
  const mockOnOpenChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetInternalStaff.mockResolvedValue(mockInternalStaff);
    mockGetExternalVendors.mockResolvedValue(mockExternalVendors);
  });

  it('should render dialog with work order number in title', async () => {
    render(
      <AssignmentDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        workOrder={mockWorkOrder}
        onAssign={mockOnAssign}
        isSubmitting={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Assign Work Order')).toBeInTheDocument();
    });

    expect(screen.getByText(/WO-2025-0001/)).toBeInTheDocument();
  });

  it('should display tabs for Internal Staff and External Vendor', async () => {
    render(
      <AssignmentDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        workOrder={mockWorkOrder}
        onAssign={mockOnAssign}
        isSubmitting={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /internal staff/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /external vendor/i })).toBeInTheDocument();
    });
  });

  it('should load and display internal staff list', async () => {
    render(
      <AssignmentDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        workOrder={mockWorkOrder}
        onAssign={mockOnAssign}
        isSubmitting={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
  });

  it('should filter internal staff by search term', async () => {
    const user = userEvent.setup();

    render(
      <AssignmentDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        workOrder={mockWorkOrder}
        onAssign={mockOnAssign}
        isSubmitting={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'Jane');

    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });
  });

  it('should switch to External Vendor tab and display vendors', async () => {
    const user = userEvent.setup();

    render(
      <AssignmentDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        workOrder={mockWorkOrder}
        onAssign={mockOnAssign}
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

  it('should display vendor ratings as stars', async () => {
    const user = userEvent.setup();

    render(
      <AssignmentDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        workOrder={mockWorkOrder}
        onAssign={mockOnAssign}
        isSubmitting={false}
      />
    );

    const vendorTab = screen.getByRole('tab', { name: /external vendor/i });
    await user.click(vendorTab);

    await waitFor(() => {
      // Check that rating text is displayed (4.5 for ABC Plumbing)
      expect(screen.getByText('4.5')).toBeInTheDocument();
    });
  });

  it('should have assignment notes textarea', async () => {
    render(
      <AssignmentDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        workOrder={mockWorkOrder}
        onAssign={mockOnAssign}
        isSubmitting={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/assignment notes/i)).toBeInTheDocument();
    });
  });

  it('should select staff member and enable submit button', async () => {
    const user = userEvent.setup();

    render(
      <AssignmentDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        workOrder={mockWorkOrder}
        onAssign={mockOnAssign}
        isSubmitting={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Click on staff member to select
    const staffItem = screen.getByText('John Doe').closest('button');
    if (staffItem) {
      await user.click(staffItem);
    }

    // Submit button should be enabled after selection
    const submitButton = screen.getByRole('button', { name: /assign work order/i });
    expect(submitButton).not.toBeDisabled();
  });

  it('should call onAssign with correct data when form is submitted', async () => {
    const user = userEvent.setup();

    render(
      <AssignmentDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        workOrder={mockWorkOrder}
        onAssign={mockOnAssign}
        isSubmitting={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Select staff member
    const staffItem = screen.getByText('John Doe').closest('button');
    if (staffItem) {
      await user.click(staffItem);
    }

    // Add assignment notes
    const notesTextarea = screen.getByLabelText(/assignment notes/i);
    await user.type(notesTextarea, 'Urgent repair needed');

    // Submit form
    const submitButton = screen.getByRole('button', { name: /assign work order/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnAssign).toHaveBeenCalledWith({
        assigneeType: AssigneeType.INTERNAL_STAFF,
        assigneeId: 'staff-1',
        assignmentNotes: 'Urgent repair needed',
      });
    });
  });

  it('should show loading state when isSubmitting is true', async () => {
    render(
      <AssignmentDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        workOrder={mockWorkOrder}
        onAssign={mockOnAssign}
        isSubmitting={true}
      />
    );

    await waitFor(() => {
      const submitButton = screen.getByRole('button', { name: /assigning/i });
      expect(submitButton).toBeDisabled();
    });
  });

  it('should close dialog when Cancel button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <AssignmentDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        workOrder={mockWorkOrder}
        onAssign={mockOnAssign}
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
      <AssignmentDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        workOrder={null}
        onAssign={mockOnAssign}
        isSubmitting={false}
      />
    );

    expect(screen.queryByText('Assign Work Order')).not.toBeInTheDocument();
  });
});
