/**
 * Tests for ProgressUpdateDialog component
 * Story 4.4 - Job Progress Tracking and Completion
 * AC #4: Add Progress Update Dialog with data-testid="dialog-add-progress-update"
 * AC #5: Progress notes textarea with data-testid="textarea-progress-notes"
 * AC #6: Upload progress photos with data-testid="input-progress-photos"
 * AC #7: Estimated completion date with data-testid="calendar-estimated-completion"
 * AC #8: Form validation and submission with data-testid="btn-save-progress-update"
 */

// Mock ResizeObserver for Radix UI components
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock URL.createObjectURL and revokeObjectURL for file handling
global.URL.createObjectURL = jest.fn(() => 'blob:test-url');
global.URL.revokeObjectURL = jest.fn();

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProgressUpdateDialog } from '../ProgressUpdateDialog';
import { WorkOrderCategory, WorkOrderPriority, WorkOrderStatus, type WorkOrder } from '@/types/work-orders';

const mockWorkOrder: WorkOrder = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  workOrderNumber: 'WO-2025-0001',
  title: 'Fix leaking faucet',
  propertyId: 'prop-123',
  propertyName: 'Sunset Apartments',
  unitId: 'unit-456',
  unitNumber: '101',
  requestedBy: 'user-789',
  category: WorkOrderCategory.PLUMBING,
  priority: WorkOrderPriority.HIGH,
  status: WorkOrderStatus.IN_PROGRESS,
  description: 'Kitchen faucet is leaking',
  attachments: [],
  completionPhotos: [],
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

describe('ProgressUpdateDialog', () => {
  const mockOnSubmit = jest.fn();
  const mockOnOpenChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render dialog with work order number', () => {
    render(
      <ProgressUpdateDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        workOrder={mockWorkOrder}
        onSubmit={mockOnSubmit}
        isSubmitting={false}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/WO-2025-0001/)).toBeInTheDocument();
  });

  it('should display dialog title "Add Progress Update"', () => {
    render(
      <ProgressUpdateDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        workOrder={mockWorkOrder}
        onSubmit={mockOnSubmit}
        isSubmitting={false}
      />
    );

    expect(screen.getByText('Add Progress Update')).toBeInTheDocument();
  });

  it('should have progress notes textarea', () => {
    render(
      <ProgressUpdateDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        workOrder={mockWorkOrder}
        onSubmit={mockOnSubmit}
        isSubmitting={false}
      />
    );

    expect(screen.getByLabelText(/progress notes/i)).toBeInTheDocument();
  });

  it('should display character counter for progress notes', async () => {
    const user = userEvent.setup();

    render(
      <ProgressUpdateDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        workOrder={mockWorkOrder}
        onSubmit={mockOnSubmit}
        isSubmitting={false}
      />
    );

    expect(screen.getByText('0/500 characters')).toBeInTheDocument();

    const textarea = screen.getByPlaceholderText(/describe the current progress/i);
    await user.type(textarea, 'Test progress');

    await waitFor(() => {
      expect(screen.getByText('13/500 characters')).toBeInTheDocument();
    });
  });

  it('should have estimated completion date input', () => {
    render(
      <ProgressUpdateDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        workOrder={mockWorkOrder}
        onSubmit={mockOnSubmit}
        isSubmitting={false}
      />
    );

    expect(screen.getByLabelText(/estimated completion date/i)).toBeInTheDocument();
  });

  it('should have file input for progress photos', () => {
    render(
      <ProgressUpdateDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        workOrder={mockWorkOrder}
        onSubmit={mockOnSubmit}
        isSubmitting={false}
      />
    );

    const fileInput = screen.getByLabelText(/upload progress photos/i);
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute('type', 'file');
  });

  it('should show validation error when progress notes are empty', async () => {
    const user = userEvent.setup();

    render(
      <ProgressUpdateDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        workOrder={mockWorkOrder}
        onSubmit={mockOnSubmit}
        isSubmitting={false}
      />
    );

    const submitButton = screen.getByRole('button', { name: /add update/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/progress notes are required/i)).toBeInTheDocument();
    });
  });

  it('should call onSubmit with correct data when form is valid', async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockResolvedValueOnce(undefined);

    render(
      <ProgressUpdateDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        workOrder={mockWorkOrder}
        onSubmit={mockOnSubmit}
        isSubmitting={false}
      />
    );

    const textarea = screen.getByPlaceholderText(/describe the current progress/i);
    await user.type(textarea, 'Making good progress on the repair');

    const submitButton = screen.getByRole('button', { name: /add update/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        progressNotes: 'Making good progress on the repair',
        photos: undefined,
        estimatedCompletionDate: undefined,
      });
    });
  });

  it('should show loading state when isSubmitting is true', () => {
    render(
      <ProgressUpdateDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        workOrder={mockWorkOrder}
        onSubmit={mockOnSubmit}
        isSubmitting={true}
      />
    );

    expect(screen.getByText('Saving...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
  });

  it('should close dialog when Cancel button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <ProgressUpdateDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        workOrder={mockWorkOrder}
        onSubmit={mockOnSubmit}
        isSubmitting={false}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('should disable form fields when submitting', () => {
    render(
      <ProgressUpdateDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        workOrder={mockWorkOrder}
        onSubmit={mockOnSubmit}
        isSubmitting={true}
      />
    );

    const textarea = screen.getByPlaceholderText(/describe the current progress/i);
    expect(textarea).toBeDisabled();
  });

  it('should have camera capture attribute for mobile', () => {
    render(
      <ProgressUpdateDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        workOrder={mockWorkOrder}
        onSubmit={mockOnSubmit}
        isSubmitting={false}
      />
    );

    const fileInput = screen.getByLabelText(/upload progress photos/i);
    expect(fileInput).toHaveAttribute('capture', 'environment');
  });

  it('should show photo count in upload button', () => {
    render(
      <ProgressUpdateDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        workOrder={mockWorkOrder}
        onSubmit={mockOnSubmit}
        isSubmitting={false}
      />
    );

    expect(screen.getByText(/Upload Photos \(0\/5\)/)).toBeInTheDocument();
  });
});
