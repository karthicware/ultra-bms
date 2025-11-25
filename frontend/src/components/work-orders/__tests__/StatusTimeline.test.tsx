/**
 * Tests for Work Order StatusTimeline component
 * Story 4.1 - Work Order Creation and Management
 */
import { render, screen } from '@testing-library/react';
import { StatusTimeline } from '../StatusTimeline';
import { WorkOrderStatus } from '@/types/work-orders';

describe('Work Order StatusTimeline', () => {
  it('should render all timeline checkpoints', () => {
    render(
      <StatusTimeline
        status={WorkOrderStatus.OPEN}
        createdAt="2025-01-15T10:00:00Z"
      />
    );

    expect(screen.getByTestId('checkpoint-OPEN')).toBeInTheDocument();
    expect(screen.getByTestId('checkpoint-ASSIGNED')).toBeInTheDocument();
    expect(screen.getByTestId('checkpoint-IN_PROGRESS')).toBeInTheDocument();
    expect(screen.getByTestId('checkpoint-COMPLETED')).toBeInTheDocument();
    expect(screen.getByTestId('checkpoint-CLOSED')).toBeInTheDocument();
  });

  it('should mark OPEN status as current', () => {
    render(
      <StatusTimeline
        status={WorkOrderStatus.OPEN}
        createdAt="2025-01-15T10:00:00Z"
      />
    );

    const openCheckpoint = screen.getByTestId('checkpoint-OPEN');
    expect(openCheckpoint.querySelector('.active')).toBeInTheDocument();
  });

  it('should mark past statuses as completed', () => {
    render(
      <StatusTimeline
        status={WorkOrderStatus.IN_PROGRESS}
        createdAt="2025-01-15T10:00:00Z"
        assignedAt="2025-01-15T14:00:00Z"
        startedAt="2025-01-16T09:00:00Z"
      />
    );

    const openCheckpoint = screen.getByTestId('checkpoint-OPEN');
    const assignedCheckpoint = screen.getByTestId('checkpoint-ASSIGNED');

    expect(openCheckpoint.querySelector('.completed')).toBeInTheDocument();
    expect(assignedCheckpoint.querySelector('.completed')).toBeInTheDocument();
  });

  it('should mark future statuses as pending', () => {
    render(
      <StatusTimeline
        status={WorkOrderStatus.ASSIGNED}
        createdAt="2025-01-15T10:00:00Z"
        assignedAt="2025-01-15T14:00:00Z"
      />
    );

    const inProgressCheckpoint = screen.getByTestId('checkpoint-IN_PROGRESS');
    const completedCheckpoint = screen.getByTestId('checkpoint-COMPLETED');

    expect(inProgressCheckpoint.querySelector('.pending')).toBeInTheDocument();
    expect(completedCheckpoint.querySelector('.pending')).toBeInTheDocument();
  });

  it('should display timestamps for completed checkpoints', () => {
    render(
      <StatusTimeline
        status={WorkOrderStatus.COMPLETED}
        createdAt="2025-01-15T10:00:00Z"
        assignedAt="2025-01-15T14:00:00Z"
        startedAt="2025-01-16T09:00:00Z"
        completedAt="2025-01-16T15:00:00Z"
      />
    );

    const openCheckpoint = screen.getByTestId('checkpoint-OPEN');
    expect(openCheckpoint).toHaveTextContent(/15 Jan 2025/);
  });

  it('should display "Pending" for future checkpoints', () => {
    render(
      <StatusTimeline
        status={WorkOrderStatus.ASSIGNED}
        createdAt="2025-01-15T10:00:00Z"
        assignedAt="2025-01-15T14:00:00Z"
      />
    );

    const inProgressCheckpoint = screen.getByTestId('checkpoint-IN_PROGRESS');
    expect(inProgressCheckpoint).toHaveTextContent('Pending');
  });

  it('should display correct labels for each status', () => {
    render(
      <StatusTimeline
        status={WorkOrderStatus.OPEN}
        createdAt="2025-01-15T10:00:00Z"
      />
    );

    expect(screen.getByText('Created')).toBeInTheDocument();
    expect(screen.getByText('Assigned')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Closed')).toBeInTheDocument();
  });

  it('should display descriptions for completed checkpoints', () => {
    render(
      <StatusTimeline
        status={WorkOrderStatus.ASSIGNED}
        createdAt="2025-01-15T10:00:00Z"
        assignedAt="2025-01-15T14:00:00Z"
      />
    );

    expect(screen.getByText('Work order has been created')).toBeInTheDocument();
    expect(screen.getByText('Work order has been assigned to a vendor')).toBeInTheDocument();
  });

  it('should handle all statuses progressing to CLOSED', () => {
    render(
      <StatusTimeline
        status={WorkOrderStatus.CLOSED}
        createdAt="2025-01-15T10:00:00Z"
        assignedAt="2025-01-15T14:00:00Z"
        startedAt="2025-01-16T09:00:00Z"
        completedAt="2025-01-16T15:00:00Z"
        closedAt="2025-01-17T10:00:00Z"
      />
    );

    const closedCheckpoint = screen.getByTestId('checkpoint-CLOSED');
    expect(closedCheckpoint.querySelector('.active')).toBeInTheDocument();
    expect(closedCheckpoint).toHaveTextContent(/17 Jan 2025/);
  });

  it('should handle work order with only created timestamp', () => {
    render(
      <StatusTimeline
        status={WorkOrderStatus.OPEN}
        createdAt="2025-01-15T10:00:00Z"
      />
    );

    const openCheckpoint = screen.getByTestId('checkpoint-OPEN');
    const assignedCheckpoint = screen.getByTestId('checkpoint-ASSIGNED');

    expect(openCheckpoint.querySelector('.active')).toBeInTheDocument();
    expect(assignedCheckpoint.querySelector('.pending')).toBeInTheDocument();
    expect(assignedCheckpoint).toHaveTextContent('Pending');
  });

  it('should mark IN_PROGRESS as current when status is IN_PROGRESS', () => {
    render(
      <StatusTimeline
        status={WorkOrderStatus.IN_PROGRESS}
        createdAt="2025-01-15T10:00:00Z"
        assignedAt="2025-01-15T14:00:00Z"
        startedAt="2025-01-16T09:00:00Z"
      />
    );

    const inProgressCheckpoint = screen.getByTestId('checkpoint-IN_PROGRESS');
    expect(inProgressCheckpoint.querySelector('.active')).toBeInTheDocument();
  });
});
