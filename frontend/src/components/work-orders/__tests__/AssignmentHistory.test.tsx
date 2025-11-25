/**
 * Tests for AssignmentHistory component
 * Story 4.3 - Work Order Assignment and Vendor Coordination
 * AC #11: Assignment history shows all past assignments
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AssignmentHistory } from '../AssignmentHistory';
import { getAssignmentHistory } from '@/services/work-orders.service';
import { AssigneeType, type WorkOrderAssignment } from '@/types';

// Mock the work-orders service
jest.mock('@/services/work-orders.service');
const mockGetAssignmentHistory = getAssignmentHistory as jest.MockedFunction<typeof getAssignmentHistory>;

describe('AssignmentHistory', () => {
  const mockWorkOrderId = '123e4567-e89b-12d3-a456-426614174000';

  const mockAssignments: WorkOrderAssignment[] = [
    {
      id: 'assignment-1',
      workOrderId: mockWorkOrderId,
      assigneeType: AssigneeType.INTERNAL_STAFF,
      assigneeId: 'staff-1',
      assigneeName: 'John Doe',
      assignedBy: 'manager-1',
      assignedByName: 'Jane Manager',
      assignedDate: '2025-01-15T10:00:00Z',
      reassignmentReason: undefined,
      assignmentNotes: 'Initial assignment',
    },
    {
      id: 'assignment-2',
      workOrderId: mockWorkOrderId,
      assigneeType: AssigneeType.EXTERNAL_VENDOR,
      assigneeId: 'vendor-1',
      assigneeName: 'ABC Plumbing',
      assignedBy: 'manager-1',
      assignedByName: 'Jane Manager',
      assignedDate: '2025-01-16T14:00:00Z',
      reassignmentReason: 'Staff unavailable',
      assignmentNotes: 'Reassigned to vendor',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state initially', () => {
    mockGetAssignmentHistory.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<AssignmentHistory workOrderId={mockWorkOrderId} />);

    expect(screen.getByText('Assignment History')).toBeInTheDocument();
  });

  it('should display empty state when no assignments', async () => {
    mockGetAssignmentHistory.mockResolvedValue({
      success: true,
      message: 'Assignment history retrieved successfully',
      data: { assignments: [], totalElements: 0 },
      timestamp: new Date().toISOString(),
    });

    render(<AssignmentHistory workOrderId={mockWorkOrderId} />);

    await waitFor(() => {
      expect(screen.getByText('No assignment history yet')).toBeInTheDocument();
    });
  });

  it('should display assignments when expanded', async () => {
    mockGetAssignmentHistory.mockResolvedValue({
      success: true,
      message: 'Assignment history retrieved successfully',
      data: { assignments: mockAssignments, totalElements: 2 },
      timestamp: new Date().toISOString(),
    });

    const user = userEvent.setup();
    render(<AssignmentHistory workOrderId={mockWorkOrderId} />);

    // Wait for loading to complete and collapsible to appear
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument(); // Badge with count
    });

    // Click the button element that contains "Assignment History"
    const expandButton = screen.getByRole('button');
    await user.click(expandButton);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('ABC Plumbing')).toBeInTheDocument();
    });
  });

  it('should show reassignment reason for reassignments', async () => {
    mockGetAssignmentHistory.mockResolvedValue({
      success: true,
      message: 'Assignment history retrieved successfully',
      data: { assignments: mockAssignments, totalElements: 2 },
      timestamp: new Date().toISOString(),
    });

    const user = userEvent.setup();
    render(<AssignmentHistory workOrderId={mockWorkOrderId} />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    // Click to expand
    const expandButton = screen.getByRole('button');
    await user.click(expandButton);

    await waitFor(() => {
      expect(screen.getByText('Staff unavailable')).toBeInTheDocument();
    });
  });

  it('should display badge with assignment count', async () => {
    mockGetAssignmentHistory.mockResolvedValue({
      success: true,
      message: 'Assignment history retrieved successfully',
      data: { assignments: mockAssignments, totalElements: 2 },
      timestamp: new Date().toISOString(),
    });

    render(<AssignmentHistory workOrderId={mockWorkOrderId} />);

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  it('should display assignee type badges', async () => {
    mockGetAssignmentHistory.mockResolvedValue({
      success: true,
      message: 'Assignment history retrieved successfully',
      data: { assignments: mockAssignments, totalElements: 2 },
      timestamp: new Date().toISOString(),
    });

    const user = userEvent.setup();
    render(<AssignmentHistory workOrderId={mockWorkOrderId} />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    // Click to expand
    const expandButton = screen.getByRole('button');
    await user.click(expandButton);

    await waitFor(() => {
      expect(screen.getByText('Internal Staff')).toBeInTheDocument();
      expect(screen.getByText('External Vendor')).toBeInTheDocument();
    });
  });

  it('should show assigned by information', async () => {
    mockGetAssignmentHistory.mockResolvedValue({
      success: true,
      message: 'Assignment history retrieved successfully',
      data: { assignments: mockAssignments, totalElements: 2 },
      timestamp: new Date().toISOString(),
    });

    const user = userEvent.setup();
    render(<AssignmentHistory workOrderId={mockWorkOrderId} />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    // Click to expand
    const expandButton = screen.getByRole('button');
    await user.click(expandButton);

    await waitFor(() => {
      const byJaneElements = screen.getAllByText(/by Jane Manager/);
      expect(byJaneElements.length).toBeGreaterThan(0);
    });
  });

  it('should handle API error gracefully', async () => {
    mockGetAssignmentHistory.mockRejectedValue(new Error('Failed to fetch'));

    render(<AssignmentHistory workOrderId={mockWorkOrderId} />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load assignment history')).toBeInTheDocument();
    });
  });

  it('should have data-testid for assignment items', async () => {
    mockGetAssignmentHistory.mockResolvedValue({
      success: true,
      message: 'Assignment history retrieved successfully',
      data: { assignments: mockAssignments, totalElements: 2 },
      timestamp: new Date().toISOString(),
    });

    const user = userEvent.setup();
    render(<AssignmentHistory workOrderId={mockWorkOrderId} />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    // Click to expand
    const expandButton = screen.getByRole('button');
    await user.click(expandButton);

    await waitFor(() => {
      expect(screen.getByTestId('assignment-history-item-assignment-1')).toBeInTheDocument();
      expect(screen.getByTestId('assignment-history-item-assignment-2')).toBeInTheDocument();
    });
  });
});
