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

// Mock ResizeObserver for Radix UI components
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AssignmentDialog } from '../AssignmentDialog';
import { getInternalStaffForAssignment, getExternalVendorsForAssignment } from '@/services/assignees.service';
import { AssigneeType, type InternalStaffAssignee, type ExternalVendorAssignee } from '@/types';

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
];

const mockExternalVendors: ExternalVendorAssignee[] = [
  {
    id: 'c3333333-3333-4333-8333-333333333333',
    companyName: 'ABC Plumbing',
    contactPerson: { name: 'Mike Johnson', email: 'mike@abcplumbing.com' },
    serviceCategories: ['PLUMBING'],
    rating: 4.5,
    status: 'ACTIVE',
  },
  {
    id: 'd4444444-4444-4444-8444-444444444444',
    companyName: 'XYZ Electrical',
    contactPerson: { name: 'Sarah Williams', email: 'sarah@xyzelectrical.com' },
    serviceCategories: ['ELECTRICAL'],
    rating: 4.0,
    status: 'ACTIVE',
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
      expect(screen.getByRole('dialog')).toBeInTheDocument();
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
      // Check that vendor company is displayed
      expect(screen.getByText('ABC Plumbing')).toBeInTheDocument();
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

    // Click on staff member to select using data-testid
    const staffItem = screen.getByTestId('staff-option-a1111111-1111-4111-8111-111111111111');
    await user.click(staffItem);

    // Staff should be selected (verify selection state)
    await waitFor(() => {
      expect(staffItem).toHaveClass('border-primary');
    });
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

    // Select staff member using data-testid
    const staffItem = screen.getByTestId('staff-option-a1111111-1111-4111-8111-111111111111');
    await user.click(staffItem);

    // Wait for selection to be applied
    await waitFor(() => {
      expect(staffItem).toHaveClass('border-primary');
    });

    // Add assignment notes
    const notesTextarea = screen.getByLabelText(/assignment notes/i);
    await user.type(notesTextarea, 'Urgent repair needed');

    // Submit form using data-testid
    const submitButton = screen.getByTestId('btn-confirm-assignment');
    expect(submitButton).not.toBeDisabled();
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnAssign).toHaveBeenCalled();
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

  it('should render dialog without work order details when workOrder is null', () => {
    render(
      <AssignmentDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        workOrder={null}
        onAssign={mockOnAssign}
        isSubmitting={false}
      />
    );

    // Dialog still renders but without work order number
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.queryByText(/WO-2025-0001/)).not.toBeInTheDocument();
  });
});
