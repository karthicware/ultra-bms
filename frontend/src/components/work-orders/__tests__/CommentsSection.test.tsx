/**
 * Tests for CommentsSection component
 * Story 4.1 - Work Order Creation and Management
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CommentsSection } from '../CommentsSection';
import { addWorkOrderComment } from '@/services/work-orders.service';
import type { WorkOrderComment } from '@/types/work-orders';

// Mock the work-orders service
jest.mock('@/services/work-orders.service');
const mockAddWorkOrderComment = addWorkOrderComment as jest.MockedFunction<typeof addWorkOrderComment>;

// Mock toast
const mockToast = jest.fn();
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

describe('CommentsSection', () => {
  const mockWorkOrderId = '123e4567-e89b-12d3-a456-426614174000';
  const mockOnCommentAdded = jest.fn();

  const mockComments: WorkOrderComment[] = [
    {
      id: 'comment-1',
      workOrderId: mockWorkOrderId,
      createdBy: 'user-1',
      createdByName: 'John Doe',
      commentText: 'First comment',
      isStatusChange: false,
      createdAt: '2025-01-15T10:00:00Z',
    },
    {
      id: 'comment-2',
      workOrderId: mockWorkOrderId,
      createdBy: 'user-2',
      createdByName: 'Jane Smith',
      commentText: 'Status changed',
      isStatusChange: true,
      previousStatus: 'OPEN',
      newStatus: 'ASSIGNED',
      createdAt: '2025-01-15T14:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render comments section with title', () => {
    render(
      <CommentsSection
        workOrderId={mockWorkOrderId}
        comments={[]}
        onCommentAdded={mockOnCommentAdded}
      />
    );

    expect(screen.getByText('Comments')).toBeInTheDocument();
  });

  it('should display empty state when no comments', () => {
    render(
      <CommentsSection
        workOrderId={mockWorkOrderId}
        comments={[]}
        onCommentAdded={mockOnCommentAdded}
      />
    );

    expect(screen.getByText(/No comments yet/)).toBeInTheDocument();
  });

  it('should display all comments', () => {
    render(
      <CommentsSection
        workOrderId={mockWorkOrderId}
        comments={mockComments}
        onCommentAdded={mockOnCommentAdded}
      />
    );

    expect(screen.getByText('First comment')).toBeInTheDocument();
    expect(screen.getByText('Status changed')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('should display status change badge for status change comments', () => {
    render(
      <CommentsSection
        workOrderId={mockWorkOrderId}
        comments={mockComments}
        onCommentAdded={mockOnCommentAdded}
      />
    );

    expect(screen.getByText('Status Change')).toBeInTheDocument();
  });

  it('should display status change details', () => {
    render(
      <CommentsSection
        workOrderId={mockWorkOrderId}
        comments={mockComments}
        onCommentAdded={mockOnCommentAdded}
      />
    );

    expect(screen.getByText('OPEN')).toBeInTheDocument();
    expect(screen.getByText('ASSIGNED')).toBeInTheDocument();
  });

  it('should render add comment form', () => {
    render(
      <CommentsSection
        workOrderId={mockWorkOrderId}
        comments={[]}
        onCommentAdded={mockOnCommentAdded}
      />
    );

    expect(screen.getByTestId('form-add-comment')).toBeInTheDocument();
    expect(screen.getByTestId('textarea-comment')).toBeInTheDocument();
    expect(screen.getByTestId('btn-submit-comment')).toBeInTheDocument();
  });

  it('should display character counter', () => {
    render(
      <CommentsSection
        workOrderId={mockWorkOrderId}
        comments={[]}
        onCommentAdded={mockOnCommentAdded}
      />
    );

    expect(screen.getByText('0/2000 characters')).toBeInTheDocument();
  });

  it('should update character counter as user types', async () => {
    const user = userEvent.setup();
    render(
      <CommentsSection
        workOrderId={mockWorkOrderId}
        comments={[]}
        onCommentAdded={mockOnCommentAdded}
      />
    );

    const textarea = screen.getByTestId('textarea-comment');
    await user.type(textarea, 'Test comment');

    expect(screen.getByText('12/2000 characters')).toBeInTheDocument();
  });

  it('should disable submit button when comment is empty', () => {
    render(
      <CommentsSection
        workOrderId={mockWorkOrderId}
        comments={[]}
        onCommentAdded={mockOnCommentAdded}
      />
    );

    const submitButton = screen.getByTestId('btn-submit-comment');
    expect(submitButton).toBeDisabled();
  });

  it('should enable submit button when comment has text', async () => {
    const user = userEvent.setup();
    render(
      <CommentsSection
        workOrderId={mockWorkOrderId}
        comments={[]}
        onCommentAdded={mockOnCommentAdded}
      />
    );

    const textarea = screen.getByTestId('textarea-comment');
    const submitButton = screen.getByTestId('btn-submit-comment');

    await user.type(textarea, 'Test comment');

    expect(submitButton).not.toBeDisabled();
  });

  it('should submit comment successfully', async () => {
    const user = userEvent.setup();
    const mockNewComment: WorkOrderComment = {
      id: 'new-comment',
      workOrderId: mockWorkOrderId,
      createdBy: 'user-3',
      createdByName: 'Test User',
      commentText: 'New test comment',
      isStatusChange: false,
      createdAt: new Date().toISOString(),
    };

    mockAddWorkOrderComment.mockResolvedValue(mockNewComment);

    render(
      <CommentsSection
        workOrderId={mockWorkOrderId}
        comments={[]}
        onCommentAdded={mockOnCommentAdded}
      />
    );

    const textarea = screen.getByTestId('textarea-comment');
    const submitButton = screen.getByTestId('btn-submit-comment');

    await user.type(textarea, 'New test comment');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockAddWorkOrderComment).toHaveBeenCalledWith(mockWorkOrderId, {
        commentText: 'New test comment',
      });
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'Comment added successfully',
        variant: 'success',
      });
      expect(mockOnCommentAdded).toHaveBeenCalled();
    });
  });

  it('should clear form after successful submission', async () => {
    const user = userEvent.setup();
    const mockNewComment: WorkOrderComment = {
      id: 'new-comment',
      workOrderId: mockWorkOrderId,
      createdBy: 'user-3',
      createdByName: 'Test User',
      commentText: 'New test comment',
      isStatusChange: false,
      createdAt: new Date().toISOString(),
    };

    mockAddWorkOrderComment.mockResolvedValue(mockNewComment);

    render(
      <CommentsSection
        workOrderId={mockWorkOrderId}
        comments={[]}
        onCommentAdded={mockOnCommentAdded}
      />
    );

    const textarea = screen.getByTestId('textarea-comment') as HTMLTextAreaElement;
    const submitButton = screen.getByTestId('btn-submit-comment');

    await user.type(textarea, 'New test comment');
    await user.click(submitButton);

    await waitFor(() => {
      expect(textarea.value).toBe('');
    });
  });

  it('should handle submission error', async () => {
    const user = userEvent.setup();
    mockAddWorkOrderComment.mockRejectedValue({
      response: {
        data: {
          error: {
            message: 'Failed to add comment',
          },
        },
      },
    });

    render(
      <CommentsSection
        workOrderId={mockWorkOrderId}
        comments={[]}
        onCommentAdded={mockOnCommentAdded}
      />
    );

    const textarea = screen.getByTestId('textarea-comment');
    const submitButton = screen.getByTestId('btn-submit-comment');

    await user.type(textarea, 'Test comment');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Failed to add comment',
        variant: 'destructive',
      });
    });
  });

  it('should display loading state during submission', async () => {
    const user = userEvent.setup();
    mockAddWorkOrderComment.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 1000))
    );

    render(
      <CommentsSection
        workOrderId={mockWorkOrderId}
        comments={[]}
        onCommentAdded={mockOnCommentAdded}
      />
    );

    const textarea = screen.getByTestId('textarea-comment');
    const submitButton = screen.getByTestId('btn-submit-comment');

    await user.type(textarea, 'Test comment');
    await user.click(submitButton);

    expect(screen.getByText('Adding...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('should enforce max character limit', () => {
    render(
      <CommentsSection
        workOrderId={mockWorkOrderId}
        comments={[]}
        onCommentAdded={mockOnCommentAdded}
      />
    );

    const textarea = screen.getByTestId('textarea-comment') as HTMLTextAreaElement;

    // Verify textarea has maxLength attribute set to 2000
    expect(textarea).toHaveAttribute('maxLength', '2000');
  });

  it('should display relative time for recent comments', () => {
    const recentComment: WorkOrderComment = {
      id: 'recent-comment',
      workOrderId: mockWorkOrderId,
      createdBy: 'user-1',
      createdByName: 'John Doe',
      commentText: 'Recent comment',
      isStatusChange: false,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    };

    render(
      <CommentsSection
        workOrderId={mockWorkOrderId}
        comments={[recentComment]}
        onCommentAdded={mockOnCommentAdded}
      />
    );

    expect(screen.getByText(/2 hours ago/)).toBeInTheDocument();
  });

  it('should display comment count in description', () => {
    render(
      <CommentsSection
        workOrderId={mockWorkOrderId}
        comments={mockComments}
        onCommentAdded={mockOnCommentAdded}
      />
    );

    expect(screen.getByText('2 comments')).toBeInTheDocument();
  });

  it('should display singular "comment" when count is 1', () => {
    render(
      <CommentsSection
        workOrderId={mockWorkOrderId}
        comments={[mockComments[0]]}
        onCommentAdded={mockOnCommentAdded}
      />
    );

    expect(screen.getByText('1 comment')).toBeInTheDocument();
  });
});
