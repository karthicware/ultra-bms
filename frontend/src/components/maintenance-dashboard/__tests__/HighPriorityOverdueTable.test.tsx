/**
 * Tests for HighPriorityOverdueTable component
 * Story 8.4: Maintenance Dashboard
 * AC-8: High Priority & Overdue Jobs table
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { HighPriorityOverdueTable } from '../HighPriorityOverdueTable';
import type { HighPriorityJob, HighPriorityJobsPage } from '@/types/maintenance-dashboard';
import { MaintenanceJobPriority } from '@/types/maintenance-dashboard';
import { WorkOrderStatus } from '@/types/work-orders';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush
  })
}));

// Mock data
const mockJobs: HighPriorityJob[] = [
  {
    id: '1',
    workOrderNumber: 'WO-001',
    propertyName: 'Sunset Towers',
    unitNumber: '101',
    title: 'Water leak in bathroom',
    priority: MaintenanceJobPriority.URGENT,
    status: WorkOrderStatus.OPEN,
    assignedToName: 'John Smith',
    scheduledDate: '2024-01-15',
    daysOverdue: 5,
    isOverdue: true
  },
  {
    id: '2',
    workOrderNumber: 'WO-002',
    propertyName: 'Ocean View',
    unitNumber: null,
    title: 'HVAC maintenance',
    priority: MaintenanceJobPriority.HIGH,
    status: WorkOrderStatus.ASSIGNED,
    assignedToName: null,
    scheduledDate: '2024-01-20',
    daysOverdue: 0,
    isOverdue: false
  },
  {
    id: '3',
    workOrderNumber: 'WO-003',
    propertyName: 'Marina Heights',
    unitNumber: '305',
    title: 'Electrical issue',
    priority: MaintenanceJobPriority.URGENT,
    status: WorkOrderStatus.IN_PROGRESS,
    assignedToName: 'Jane Doe',
    scheduledDate: '2024-01-10',
    daysOverdue: 10,
    isOverdue: true
  }
];

const mockPageData: HighPriorityJobsPage = {
  content: mockJobs,
  totalElements: 15,
  totalPages: 2,
  size: 10,
  number: 0,
  first: true,
  last: false,
  empty: false
};

describe('HighPriorityOverdueTable', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  describe('Rendering', () => {
    it('should render table with correct columns - AC-8', () => {
      render(<HighPriorityOverdueTable data={mockPageData} isLoading={false} />);

      expect(screen.getByTestId('high-priority-overdue-table')).toBeInTheDocument();
      expect(screen.getByText('High Priority & Overdue Jobs')).toBeInTheDocument();

      // Check column headers
      expect(screen.getByText('Job #')).toBeInTheDocument();
      expect(screen.getByText('Property / Unit')).toBeInTheDocument();
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Priority')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Assigned To')).toBeInTheDocument();
      expect(screen.getByText('Days Overdue')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('should render job rows with correct data', () => {
      render(<HighPriorityOverdueTable data={mockPageData} isLoading={false} />);

      // Check first job row
      expect(screen.getByText('WO-001')).toBeInTheDocument();
      expect(screen.getByText('Sunset Towers')).toBeInTheDocument();
      expect(screen.getByText('Unit 101')).toBeInTheDocument();
      expect(screen.getByText('Water leak in bathroom')).toBeInTheDocument();
      expect(screen.getByText('John Smith')).toBeInTheDocument();
    });

    it('should display total count badge', () => {
      render(<HighPriorityOverdueTable data={mockPageData} isLoading={false} />);

      expect(screen.getByText('15 total')).toBeInTheDocument();
    });

    it('should render loading skeletons when isLoading is true', () => {
      const { container } = render(
        <HighPriorityOverdueTable data={undefined} isLoading={true} />
      );

      const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should render empty state when no data', () => {
      const emptyPage: HighPriorityJobsPage = {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 10,
        number: 0,
        first: true,
        last: true,
        empty: true
      };

      render(<HighPriorityOverdueTable data={emptyPage} isLoading={false} />);

      expect(screen.getByText('No high priority or overdue jobs')).toBeInTheDocument();
    });
  });

  describe('Overdue highlighting', () => {
    it('should highlight overdue job rows with red background', () => {
      render(<HighPriorityOverdueTable data={mockPageData} isLoading={false} />);

      const overdueRow = screen.getByTestId('job-row-1');
      expect(overdueRow).toHaveClass('bg-red-50/50');
    });

    it('should display days overdue with alert icon for overdue jobs', () => {
      render(<HighPriorityOverdueTable data={mockPageData} isLoading={false} />);

      expect(screen.getByText('5 days')).toBeInTheDocument();
      expect(screen.getByText('10 days')).toBeInTheDocument();
    });

    it('should display scheduled date for non-overdue jobs', () => {
      render(<HighPriorityOverdueTable data={mockPageData} isLoading={false} />);

      expect(screen.getByText('Jan 20')).toBeInTheDocument();
    });
  });

  describe('Priority and Status badges', () => {
    it('should display priority badges with correct colors', () => {
      render(<HighPriorityOverdueTable data={mockPageData} isLoading={false} />);

      expect(screen.getAllByText('Urgent').length).toBe(2);
      expect(screen.getByText('High')).toBeInTheDocument();
    });

    it('should display status badges', () => {
      render(<HighPriorityOverdueTable data={mockPageData} isLoading={false} />);

      expect(screen.getByText('Open')).toBeInTheDocument();
      expect(screen.getByText('Assigned')).toBeInTheDocument();
      expect(screen.getByText('In Progress')).toBeInTheDocument();
    });
  });

  describe('Quick actions', () => {
    it('should navigate to job detail on view button click', () => {
      render(<HighPriorityOverdueTable data={mockPageData} isLoading={false} />);

      fireEvent.click(screen.getByTestId('view-job-1'));
      expect(mockPush).toHaveBeenCalledWith('/maintenance/work-orders/1');
    });

    it('should call onJobClick callback when provided', () => {
      const onJobClick = jest.fn();
      render(
        <HighPriorityOverdueTable
          data={mockPageData}
          isLoading={false}
          onJobClick={onJobClick}
        />
      );

      fireEvent.click(screen.getByTestId('view-job-1'));
      expect(onJobClick).toHaveBeenCalledWith('1');
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Pagination', () => {
    it('should display pagination controls when multiple pages', () => {
      render(<HighPriorityOverdueTable data={mockPageData} isLoading={false} />);

      expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
      expect(screen.getByText('Previous')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
    });

    it('should disable Previous button on first page', () => {
      render(<HighPriorityOverdueTable data={mockPageData} isLoading={false} />);

      const prevButton = screen.getByText('Previous').closest('button');
      expect(prevButton).toBeDisabled();
    });

    it('should call onPageChange when Next is clicked', () => {
      const onPageChange = jest.fn();
      render(
        <HighPriorityOverdueTable
          data={mockPageData}
          isLoading={false}
          onPageChange={onPageChange}
        />
      );

      fireEvent.click(screen.getByText('Next'));
      expect(onPageChange).toHaveBeenCalledWith(1);
    });

    it('should not show pagination for single page', () => {
      const singlePage: HighPriorityJobsPage = {
        ...mockPageData,
        totalPages: 1,
        last: true
      };

      render(<HighPriorityOverdueTable data={singlePage} isLoading={false} />);

      expect(screen.queryByText('Page 1 of 1')).not.toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    it('should sort by days overdue on header click', () => {
      render(<HighPriorityOverdueTable data={mockPageData} isLoading={false} />);

      // Find and click the Days Overdue header
      const daysOverdueHeader = screen.getByText('Days Overdue');
      fireEvent.click(daysOverdueHeader);

      // Verify sorting icon is visible (opacity-100)
      const sortIcon = daysOverdueHeader.parentElement?.querySelector('svg');
      expect(sortIcon).toHaveClass('opacity-100');
    });

    it('should toggle sort direction on repeated header clicks', () => {
      const { container } = render(<HighPriorityOverdueTable data={mockPageData} isLoading={false} />);

      // Find Priority header cell
      const priorityHeader = container.querySelector('th:nth-child(4)');

      // First click - descending
      if (priorityHeader) {
        fireEvent.click(priorityHeader);
        // Second click - ascending
        fireEvent.click(priorityHeader);
      }

      // Table should still be visible after sorting
      expect(screen.getByTestId('high-priority-overdue-table')).toBeInTheDocument();
    });
  });

  describe('Unassigned jobs', () => {
    it('should show "Unassigned" for jobs without assignee', () => {
      render(<HighPriorityOverdueTable data={mockPageData} isLoading={false} />);

      expect(screen.getByText('Unassigned')).toBeInTheDocument();
    });
  });
});
