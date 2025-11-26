/**
 * Tests for ProgressTimeline component
 * Story 4.4 - Job Progress Tracking and Completion
 * AC #22: Progress Timeline display with data-testid="timeline-work-order-progress"
 * AC #25: Cost visibility based on user role (showCost prop)
 */

// Mock ResizeObserver for Radix UI components
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProgressTimeline } from '../ProgressTimeline';
import { TimelineEntryType, type TimelineEntry } from '@/types/work-order-progress';

const mockTimelineEntries: TimelineEntry[] = [
  {
    id: 'entry-1',
    type: TimelineEntryType.CREATED,
    timestamp: '2025-01-01T10:00:00Z',
    actorName: 'System',
  },
  {
    id: 'entry-2',
    type: TimelineEntryType.ASSIGNED,
    timestamp: '2025-01-01T11:00:00Z',
    actorName: 'John Manager',
    assigneeName: 'Mike Technician',
    assigneeType: 'MAINTENANCE_SUPERVISOR',
  },
  {
    id: 'entry-3',
    type: TimelineEntryType.STARTED,
    timestamp: '2025-01-02T09:00:00Z',
    actorName: 'Mike Technician',
  },
  {
    id: 'entry-4',
    type: TimelineEntryType.PROGRESS_UPDATE,
    timestamp: '2025-01-02T14:00:00Z',
    actorName: 'Mike Technician',
    notes: 'Found the source of the leak. Ordering replacement parts.',
    photoUrls: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'],
  },
  {
    id: 'entry-5',
    type: TimelineEntryType.COMPLETED,
    timestamp: '2025-01-03T16:00:00Z',
    actorName: 'Mike Technician',
    notes: 'Replaced faulty valve. Tested and confirmed no leaks.',
    hoursSpent: 4.5,
    totalCost: 350.00,
    recommendations: 'Consider replacing other valves in the building as preventive measure.',
    followUpRequired: true,
    followUpDescription: 'Schedule inspection in 30 days',
    photoUrls: ['https://example.com/after1.jpg'],
  },
];

describe('ProgressTimeline', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render timeline card with title', () => {
    render(
      <ProgressTimeline
        timeline={mockTimelineEntries}
        isLoading={false}
        showCost={true}
      />
    );

    expect(screen.getByText('Activity Timeline')).toBeInTheDocument();
  });

  it('should display loading skeleton when isLoading is true', () => {
    render(
      <ProgressTimeline
        timeline={[]}
        isLoading={true}
        showCost={true}
      />
    );

    expect(screen.getByText('Activity Timeline')).toBeInTheDocument();
    // Skeletons should be present
    const skeletons = document.querySelectorAll('[class*="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should display empty state when timeline is empty', () => {
    render(
      <ProgressTimeline
        timeline={[]}
        isLoading={false}
        showCost={true}
      />
    );

    expect(screen.getByText(/no activity recorded yet/i)).toBeInTheDocument();
  });

  it('should render all timeline entries', () => {
    render(
      <ProgressTimeline
        timeline={mockTimelineEntries}
        isLoading={false}
        showCost={true}
      />
    );

    expect(screen.getByText('Work Order Created')).toBeInTheDocument();
    expect(screen.getByText('Assigned')).toBeInTheDocument();
    expect(screen.getByText('Work Started')).toBeInTheDocument();
    expect(screen.getByText('Progress Update')).toBeInTheDocument();
    expect(screen.getByText('Work Completed')).toBeInTheDocument();
  });

  it('should display actor names for each entry', () => {
    render(
      <ProgressTimeline
        timeline={mockTimelineEntries}
        isLoading={false}
        showCost={true}
      />
    );

    expect(screen.getByText(/by System/)).toBeInTheDocument();
    expect(screen.getByText(/by John Manager/)).toBeInTheDocument();
    expect(screen.getAllByText(/by Mike Technician/).length).toBeGreaterThan(0);
  });

  it('should display cost badge for completed entry when showCost is true', () => {
    render(
      <ProgressTimeline
        timeline={mockTimelineEntries}
        isLoading={false}
        showCost={true}
      />
    );

    expect(screen.getByText('AED 350.00')).toBeInTheDocument();
  });

  it('should NOT display cost badge when showCost is false', () => {
    render(
      <ProgressTimeline
        timeline={mockTimelineEntries}
        isLoading={false}
        showCost={false}
      />
    );

    expect(screen.queryByText('AED 350.00')).not.toBeInTheDocument();
  });

  it('should have expandable details for entries with notes or photos', async () => {
    const user = userEvent.setup();

    render(
      <ProgressTimeline
        timeline={mockTimelineEntries}
        isLoading={false}
        showCost={true}
      />
    );

    // Find and click "Show details" button
    const showDetailsButtons = screen.getAllByRole('button', { name: /show details/i });
    expect(showDetailsButtons.length).toBeGreaterThan(0);

    await user.click(showDetailsButtons[0]);

    // Details should now be visible
    expect(screen.getByText(/found the source of the leak/i)).toBeInTheDocument();
  });

  it('should toggle details visibility', async () => {
    const user = userEvent.setup();

    render(
      <ProgressTimeline
        timeline={mockTimelineEntries}
        isLoading={false}
        showCost={true}
      />
    );

    const showDetailsButtons = screen.getAllByRole('button', { name: /show details/i });
    await user.click(showDetailsButtons[0]);

    // Now should show "Hide details"
    const hideButton = screen.getByRole('button', { name: /hide details/i });
    expect(hideButton).toBeInTheDocument();

    await user.click(hideButton);

    // Should show "Show details" again
    expect(screen.getAllByRole('button', { name: /show details/i }).length).toBeGreaterThan(0);
  });

  it('should display photo count in show details button', () => {
    render(
      <ProgressTimeline
        timeline={mockTimelineEntries}
        isLoading={false}
        showCost={true}
      />
    );

    // Progress update has 2 photos
    expect(screen.getByText(/2 photos/)).toBeInTheDocument();
    // Completed entry has 1 photo
    expect(screen.getByText(/1 photo\)/)).toBeInTheDocument();
  });

  it('should display follow-up information when expanded', async () => {
    const user = userEvent.setup();

    render(
      <ProgressTimeline
        timeline={mockTimelineEntries}
        isLoading={false}
        showCost={true}
      />
    );

    // Find the completed entry's show details button (last one)
    const showDetailsButtons = screen.getAllByRole('button', { name: /show details/i });
    await user.click(showDetailsButtons[showDetailsButtons.length - 1]);

    expect(screen.getByText(/follow-up required/i)).toBeInTheDocument();
    expect(screen.getByText(/schedule inspection in 30 days/i)).toBeInTheDocument();
  });

  it('should display recommendations when expanded', async () => {
    const user = userEvent.setup();

    render(
      <ProgressTimeline
        timeline={mockTimelineEntries}
        isLoading={false}
        showCost={true}
      />
    );

    const showDetailsButtons = screen.getAllByRole('button', { name: /show details/i });
    await user.click(showDetailsButtons[showDetailsButtons.length - 1]);

    expect(screen.getByText(/recommendations/i)).toBeInTheDocument();
    expect(screen.getByText(/consider replacing other valves/i)).toBeInTheDocument();
  });

  it('should have proper ARIA attributes for timeline list', () => {
    render(
      <ProgressTimeline
        timeline={mockTimelineEntries}
        isLoading={false}
        showCost={true}
      />
    );

    const list = screen.getByRole('list', { name: /activity timeline/i });
    expect(list).toBeInTheDocument();

    const listItems = screen.getAllByRole('listitem');
    expect(listItems.length).toBe(mockTimelineEntries.length);
  });

  it('should display hours spent in expanded completed entry when showCost is true', async () => {
    const user = userEvent.setup();

    render(
      <ProgressTimeline
        timeline={mockTimelineEntries}
        isLoading={false}
        showCost={true}
      />
    );

    const showDetailsButtons = screen.getAllByRole('button', { name: /show details/i });
    await user.click(showDetailsButtons[showDetailsButtons.length - 1]);

    expect(screen.getByText(/hours:/i)).toBeInTheDocument();
    expect(screen.getByText('4.5')).toBeInTheDocument();
  });

  it('should NOT display hours and cost details when showCost is false', async () => {
    const user = userEvent.setup();

    render(
      <ProgressTimeline
        timeline={mockTimelineEntries}
        isLoading={false}
        showCost={false}
      />
    );

    const showDetailsButtons = screen.getAllByRole('button', { name: /show details/i });
    await user.click(showDetailsButtons[showDetailsButtons.length - 1]);

    expect(screen.queryByText(/hours:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/cost:/i)).not.toBeInTheDocument();
  });
});
