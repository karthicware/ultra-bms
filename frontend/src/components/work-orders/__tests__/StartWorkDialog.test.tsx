/**
 * Tests for StartWorkDialog component
 * Story 4.4 - Job Progress Tracking and Completion
 * AC #1: Start Work button with data-testid="btn-start-work"
 * AC #2: Start Work confirmation dialog and functionality
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
import { StartWorkDialog } from '../StartWorkDialog';
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
  status: WorkOrderStatus.ASSIGNED,
  description: 'Kitchen faucet is leaking',
  attachments: [],
  completionPhotos: [],
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

describe('StartWorkDialog', () => {
  const mockOnStartWork = jest.fn();
  const mockOnOpenChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render dialog with work order number', () => {
    render(
      <StartWorkDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        workOrder={mockWorkOrder}
        onStartWork={mockOnStartWork}
        isSubmitting={false}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/WO-2025-0001/)).toBeInTheDocument();
  });

  it('should display dialog title with Play icon', () => {
    render(
      <StartWorkDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        workOrder={mockWorkOrder}
        onStartWork={mockOnStartWork}
        isSubmitting={false}
      />
    );

    // Title appears in both dialog header and button, so query the heading specifically
    expect(screen.getByRole('heading', { name: /start work/i })).toBeInTheDocument();
  });

  it('should display work order summary with title and property', () => {
    render(
      <StartWorkDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        workOrder={mockWorkOrder}
        onStartWork={mockOnStartWork}
        isSubmitting={false}
      />
    );

    expect(screen.getByText('Fix leaking faucet')).toBeInTheDocument();
    expect(screen.getByText(/Sunset Apartments/)).toBeInTheDocument();
    expect(screen.getByText(/Unit 101/)).toBeInTheDocument();
  });

  it('should have file input for before photos', () => {
    render(
      <StartWorkDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        workOrder={mockWorkOrder}
        onStartWork={mockOnStartWork}
        isSubmitting={false}
      />
    );

    const fileInput = screen.getByLabelText(/upload before photos/i);
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute('type', 'file');
    expect(fileInput).toHaveAttribute('accept', 'image/jpeg,image/png');
  });

  it('should display upload button when photos are under limit', () => {
    render(
      <StartWorkDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        workOrder={mockWorkOrder}
        onStartWork={mockOnStartWork}
        isSubmitting={false}
      />
    );

    expect(screen.getByRole('button', { name: /upload before photos/i })).toBeInTheDocument();
  });

  it('should call onStartWork when Start Work button is clicked', async () => {
    const user = userEvent.setup();
    mockOnStartWork.mockResolvedValueOnce(undefined);

    render(
      <StartWorkDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        workOrder={mockWorkOrder}
        onStartWork={mockOnStartWork}
        isSubmitting={false}
      />
    );

    const startButton = screen.getByRole('button', { name: /start work/i });
    await user.click(startButton);

    await waitFor(() => {
      expect(mockOnStartWork).toHaveBeenCalledWith(undefined);
    });
  });

  it('should show loading state when isSubmitting is true', () => {
    render(
      <StartWorkDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        workOrder={mockWorkOrder}
        onStartWork={mockOnStartWork}
        isSubmitting={true}
      />
    );

    expect(screen.getByText('Starting...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /starting/i })).toBeDisabled();
  });

  it('should close dialog when Cancel button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <StartWorkDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        workOrder={mockWorkOrder}
        onStartWork={mockOnStartWork}
        isSubmitting={false}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('should disable Cancel button when submitting', () => {
    render(
      <StartWorkDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        workOrder={mockWorkOrder}
        onStartWork={mockOnStartWork}
        isSubmitting={true}
      />
    );

    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
  });

  it('should have camera capture attribute for mobile', () => {
    render(
      <StartWorkDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        workOrder={mockWorkOrder}
        onStartWork={mockOnStartWork}
        isSubmitting={false}
      />
    );

    const fileInput = screen.getByLabelText(/upload before photos/i);
    expect(fileInput).toHaveAttribute('capture', 'environment');
  });

  it('should display info message about status change', () => {
    render(
      <StartWorkDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        workOrder={mockWorkOrder}
        onStartWork={mockOnStartWork}
        isSubmitting={false}
      />
    );

    expect(screen.getByText(/status will change to "In Progress"/i)).toBeInTheDocument();
  });
});
