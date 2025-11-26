/**
 * Tests for MarkCompleteDialog component
 * Story 4.4 - Job Progress Tracking and Completion
 * AC #11: Mark as Complete button with data-testid="btn-mark-complete"
 * AC #12: Completion Dialog with data-testid="dialog-mark-complete"
 * AC #13: Completion notes with data-testid="textarea-completion-notes"
 * AC #14: After photos upload with data-testid="input-after-photos"
 * AC #15: Hours and cost fields with data-testid="input-hours-spent" and "input-total-cost"
 * AC #16: Recommendations with data-testid="textarea-recommendations"
 * AC #17: Follow-up required with data-testid="checkbox-follow-up-required" and "textarea-follow-up-description"
 * AC #18: Form validation and submission with data-testid="btn-submit-completion"
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
import { MarkCompleteDialog } from '../MarkCompleteDialog';
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
  estimatedCost: 250.00,
  attachments: [],
  completionPhotos: [],
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

// Create a mock file (prefixed with _ as it's prepared for future tests)
const _createMockFile = (name: string, size: number = 1024, type: string = 'image/jpeg'): File => {
  const file = new File([''], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

describe('MarkCompleteDialog', () => {
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
      <MarkCompleteDialog
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

  it('should display dialog title "Mark Work Order Complete"', () => {
    render(
      <MarkCompleteDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        workOrder={mockWorkOrder}
        onSubmit={mockOnSubmit}
        isSubmitting={false}
      />
    );

    expect(screen.getByText('Mark Work Order Complete')).toBeInTheDocument();
  });

  it('should display work order summary', () => {
    render(
      <MarkCompleteDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        workOrder={mockWorkOrder}
        onSubmit={mockOnSubmit}
        isSubmitting={false}
      />
    );

    expect(screen.getByText('Fix leaking faucet')).toBeInTheDocument();
    expect(screen.getByText(/Sunset Apartments/)).toBeInTheDocument();
  });

  it('should have after photos upload section', () => {
    render(
      <MarkCompleteDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        workOrder={mockWorkOrder}
        onSubmit={mockOnSubmit}
        isSubmitting={false}
      />
    );

    expect(screen.getByText(/After Photos/i)).toBeInTheDocument();
    const fileInput = screen.getByLabelText(/upload after photos/i);
    expect(fileInput).toBeInTheDocument();
  });

  it('should have completion notes textarea', () => {
    render(
      <MarkCompleteDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        workOrder={mockWorkOrder}
        onSubmit={mockOnSubmit}
        isSubmitting={false}
      />
    );

    expect(screen.getByLabelText(/completion notes/i)).toBeInTheDocument();
  });

  it('should display character counter for completion notes', async () => {
    const user = userEvent.setup();

    render(
      <MarkCompleteDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        workOrder={mockWorkOrder}
        onSubmit={mockOnSubmit}
        isSubmitting={false}
      />
    );

    expect(screen.getByText('0/2000 characters')).toBeInTheDocument();

    const textarea = screen.getByPlaceholderText(/describe the work completed/i);
    await user.type(textarea, 'Test completion');

    await waitFor(() => {
      expect(screen.getByText('15/2000 characters')).toBeInTheDocument();
    });
  });

  it('should have hours spent input field', () => {
    render(
      <MarkCompleteDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        workOrder={mockWorkOrder}
        onSubmit={mockOnSubmit}
        isSubmitting={false}
      />
    );

    expect(screen.getByLabelText(/hours spent/i)).toBeInTheDocument();
  });

  it('should have total cost input field', () => {
    render(
      <MarkCompleteDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        workOrder={mockWorkOrder}
        onSubmit={mockOnSubmit}
        isSubmitting={false}
      />
    );

    expect(screen.getByLabelText(/total cost/i)).toBeInTheDocument();
  });

  it('should pre-fill total cost with estimated cost', () => {
    render(
      <MarkCompleteDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        workOrder={mockWorkOrder}
        onSubmit={mockOnSubmit}
        isSubmitting={false}
      />
    );

    const costInput = screen.getByLabelText(/total cost/i) as HTMLInputElement;
    expect(costInput.value).toBe('250');
  });

  it('should have recommendations textarea', () => {
    render(
      <MarkCompleteDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        workOrder={mockWorkOrder}
        onSubmit={mockOnSubmit}
        isSubmitting={false}
      />
    );

    expect(screen.getByLabelText(/recommendations/i)).toBeInTheDocument();
  });

  it('should have follow-up required checkbox', () => {
    render(
      <MarkCompleteDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        workOrder={mockWorkOrder}
        onSubmit={mockOnSubmit}
        isSubmitting={false}
      />
    );

    expect(screen.getByText(/follow-up required/i)).toBeInTheDocument();
  });

  it('should show follow-up description when checkbox is checked', async () => {
    const user = userEvent.setup();

    render(
      <MarkCompleteDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        workOrder={mockWorkOrder}
        onSubmit={mockOnSubmit}
        isSubmitting={false}
      />
    );

    // Initially, follow-up description should not be visible
    expect(screen.queryByLabelText(/follow-up details/i)).not.toBeInTheDocument();

    // Click the checkbox
    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    // Now follow-up description should be visible
    await waitFor(() => {
      expect(screen.getByLabelText(/follow-up details/i)).toBeInTheDocument();
    });
  });

  it('should show validation error when completion notes are empty', async () => {
    const user = userEvent.setup();

    render(
      <MarkCompleteDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        workOrder={mockWorkOrder}
        onSubmit={mockOnSubmit}
        isSubmitting={false}
      />
    );

    const submitButton = screen.getByRole('button', { name: /mark complete/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/completion notes are required/i)).toBeInTheDocument();
    });
  });

  it('should show error when no after photos are uploaded', async () => {
    const user = userEvent.setup();

    render(
      <MarkCompleteDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        workOrder={mockWorkOrder}
        onSubmit={mockOnSubmit}
        isSubmitting={false}
      />
    );

    // Fill required fields
    const notesTextarea = screen.getByPlaceholderText(/describe the work completed/i);
    await user.type(notesTextarea, 'Work has been completed successfully');

    const hoursInput = screen.getByLabelText(/hours spent/i);
    await user.type(hoursInput, '2.5');

    const costInput = screen.getByLabelText(/total cost/i);
    await user.clear(costInput);
    await user.type(costInput, '350');

    const submitButton = screen.getByRole('button', { name: /mark complete/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/at least 1 "after" photo is required/i)).toBeInTheDocument();
    });
  });

  it('should show loading state when isSubmitting is true', () => {
    render(
      <MarkCompleteDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        workOrder={mockWorkOrder}
        onSubmit={mockOnSubmit}
        isSubmitting={true}
      />
    );

    expect(screen.getByText('Completing...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /completing/i })).toBeDisabled();
  });

  it('should close dialog when Cancel button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <MarkCompleteDialog
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
      <MarkCompleteDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        workOrder={mockWorkOrder}
        onSubmit={mockOnSubmit}
        isSubmitting={true}
      />
    );

    const textarea = screen.getByPlaceholderText(/describe the work completed/i);
    expect(textarea).toBeDisabled();
  });

  it('should have camera capture attribute for mobile', () => {
    render(
      <MarkCompleteDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        workOrder={mockWorkOrder}
        onSubmit={mockOnSubmit}
        isSubmitting={false}
      />
    );

    const fileInput = screen.getByLabelText(/upload after photos/i);
    expect(fileInput).toHaveAttribute('capture', 'environment');
  });

  it('should require follow-up description when checkbox is checked', async () => {
    const user = userEvent.setup();

    render(
      <MarkCompleteDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        workOrder={mockWorkOrder}
        onSubmit={mockOnSubmit}
        isSubmitting={false}
      />
    );

    // Check the follow-up checkbox
    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    // Fill other required fields but not follow-up description
    const notesTextarea = screen.getByPlaceholderText(/describe the work completed/i);
    await user.type(notesTextarea, 'Work has been completed successfully');

    const hoursInput = screen.getByLabelText(/hours spent/i);
    await user.type(hoursInput, '2.5');

    const submitButton = screen.getByRole('button', { name: /mark complete/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/follow-up description is required/i)).toBeInTheDocument();
    });
  });
});
