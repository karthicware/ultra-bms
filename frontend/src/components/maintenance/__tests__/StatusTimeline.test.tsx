/**
 * Tests for StatusTimeline component
 * Story 3.5 - Maintenance Request Status Timeline
 */
import { render, screen } from '@testing-library/react';
import { StatusTimeline } from '../StatusTimeline';
import { MaintenanceStatus, MaintenanceCategory, MaintenancePriority, MaintenanceRequest, PreferredAccessTime } from '@/types/maintenance';

describe('StatusTimeline', () => {
  const createMockRequest = (status: MaintenanceStatus, timestamps: Partial<MaintenanceRequest> = {}): MaintenanceRequest => ({
    id: '123e4567-e89b-12d3-a456-426614174000',
    requestNumber: 'MR-2025-0001',
    tenantId: 'tenant-123',
    unitId: 'unit-123',
    propertyId: 'property-123',
    category: MaintenanceCategory.PLUMBING,
    priority: MaintenancePriority.HIGH,
    title: 'Test Request',
    description: 'Test description',
    status,
    preferredAccessTime: PreferredAccessTime.MORNING,
    preferredAccessDate: '2025-01-17',
    submittedAt: '2025-01-15T10:00:00Z',
    attachments: [],
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-01-15T10:00:00Z',
    ...timestamps,
  });

  it('should render all timeline checkpoints', () => {
    const request = createMockRequest(MaintenanceStatus.SUBMITTED);
    render(<StatusTimeline request={request} />);

    expect(screen.getByTestId('checkpoint-SUBMITTED')).toBeInTheDocument();
    expect(screen.getByTestId('checkpoint-ASSIGNED')).toBeInTheDocument();
    expect(screen.getByTestId('checkpoint-IN_PROGRESS')).toBeInTheDocument();
    expect(screen.getByTestId('checkpoint-COMPLETED')).toBeInTheDocument();
    expect(screen.getByTestId('checkpoint-CLOSED')).toBeInTheDocument();
  });

  it('should mark current status as active', () => {
    const request = createMockRequest(MaintenanceStatus.ASSIGNED, {
      assignedAt: '2025-01-15T14:00:00Z',
    });
    render(<StatusTimeline request={request} />);

    const activeCheckpoint = screen.getByTestId('checkpoint-ASSIGNED');
    expect(activeCheckpoint).toHaveClass('active');
  });

  it('should mark past statuses as completed', () => {
    const request = createMockRequest(MaintenanceStatus.IN_PROGRESS, {
      assignedAt: '2025-01-15T14:00:00Z',
      startedAt: '2025-01-16T09:00:00Z',
    });
    render(<StatusTimeline request={request} />);

    const submittedCheckpoint = screen.getByTestId('checkpoint-SUBMITTED');
    const assignedCheckpoint = screen.getByTestId('checkpoint-ASSIGNED');

    expect(submittedCheckpoint).toHaveClass('completed');
    expect(assignedCheckpoint).toHaveClass('completed');
  });

  it('should mark future statuses as pending', () => {
    const request = createMockRequest(MaintenanceStatus.ASSIGNED, {
      assignedAt: '2025-01-15T14:00:00Z',
    });
    render(<StatusTimeline request={request} />);

    const inProgressCheckpoint = screen.getByTestId('checkpoint-IN_PROGRESS');
    const completedCheckpoint = screen.getByTestId('checkpoint-COMPLETED');

    expect(inProgressCheckpoint).toHaveClass('pending');
    expect(completedCheckpoint).toHaveClass('pending');
  });

  it('should display timestamps for completed checkpoints', () => {
    const request = createMockRequest(MaintenanceStatus.COMPLETED, {
      submittedAt: '2025-01-15T10:00:00Z',
      assignedAt: '2025-01-15T14:00:00Z',
      startedAt: '2025-01-16T09:00:00Z',
      completedAt: '2025-01-16T15:00:00Z',
    });
    render(<StatusTimeline request={request} />);

    // Format is "January 15th, 2025" (PPP format)
    const submittedCheckpoint = screen.getByTestId('checkpoint-SUBMITTED');
    expect(submittedCheckpoint).toHaveTextContent(/January 15/);
  });

  it('should not display timestamps for pending checkpoints', () => {
    const request = createMockRequest(MaintenanceStatus.ASSIGNED, {
      assignedAt: '2025-01-15T14:00:00Z',
    });
    render(<StatusTimeline request={request} />);

    const inProgressCheckpoint = screen.getByTestId('checkpoint-IN_PROGRESS');
    expect(inProgressCheckpoint).not.toHaveTextContent(/January/);
  });

  it('should show check icon for completed statuses', () => {
    const request = createMockRequest(MaintenanceStatus.COMPLETED, {
      submittedAt: '2025-01-15T10:00:00Z',
      assignedAt: '2025-01-15T14:00:00Z',
      startedAt: '2025-01-16T09:00:00Z',
      completedAt: '2025-01-16T15:00:00Z',
    });
    render(<StatusTimeline request={request} />);

    const submittedCheckpoint = screen.getByTestId('checkpoint-SUBMITTED');
    expect(submittedCheckpoint.querySelector('svg')).toBeInTheDocument();
  });

  it('should display appropriate status labels', () => {
    const request = createMockRequest(MaintenanceStatus.ASSIGNED, {
      assignedAt: '2025-01-15T14:00:00Z',
    });
    render(<StatusTimeline request={request} />);

    expect(screen.getByText(/Submitted/)).toBeInTheDocument();
    expect(screen.getByText(/Assigned.*Current/)).toBeInTheDocument();
    expect(screen.getByText(/In Progress/)).toBeInTheDocument();
    expect(screen.getByText(/Completed/)).toBeInTheDocument();
    expect(screen.getByText(/Closed/)).toBeInTheDocument();
  });

  it('should handle CANCELLED status', () => {
    const request = createMockRequest(MaintenanceStatus.CANCELLED, {
      closedAt: '2025-01-15T16:00:00Z',
    });
    render(<StatusTimeline request={request} />);

    expect(screen.getByText(/Request was cancelled/i)).toBeInTheDocument();
  });

  it('should render timeline structure', () => {
    const request = createMockRequest(MaintenanceStatus.ASSIGNED);
    const { container } = render(<StatusTimeline request={request} />);

    // Timeline container should render
    expect(container.querySelector('.relative')).toBeInTheDocument();
  });
});
