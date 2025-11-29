 
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FeedbackForm } from '../FeedbackForm';
import { useToast } from '@/hooks/use-toast';
import { submitMaintenanceRequestFeedback } from '@/services/maintenance.service';

// Mock dependencies
jest.mock('@/hooks/use-toast', () => ({
    useToast: jest.fn(),
}));

jest.mock('@/services/maintenance.service', () => ({
    submitMaintenanceRequestFeedback: jest.fn(),
}));

jest.mock('@tanstack/react-query', () => ({
    useQueryClient: () => ({
        invalidateQueries: jest.fn(),
    }),
}));

describe('FeedbackForm', () => {
    const mockToast = jest.fn();
    const requestId = 'test-request-id';

    beforeEach(() => {
        jest.clearAllMocks();
        (useToast as jest.Mock).mockReturnValue({ toast: mockToast });
    });

    it('renders feedback form correctly', () => {
        render(<FeedbackForm requestId={requestId} />);

        expect(screen.getByText(/Rate this service/i)).toBeInTheDocument();
        expect(screen.getByText(/How satisfied are you/i)).toBeInTheDocument();
        expect(screen.getByTestId('btn-submit-feedback')).toBeDisabled(); // Disabled initially (rating 0)
    });

    it('allows selecting a rating', async () => {
        const user = userEvent.setup();
        render(<FeedbackForm requestId={requestId} />);

        const star5 = screen.getByTestId('star-5');
        await user.click(star5);

        expect(screen.getByText(/5 out of 5 stars/i)).toBeInTheDocument();
        expect(screen.getByTestId('btn-submit-feedback')).toBeEnabled();
    });

    it('allows entering a comment', async () => {
        const user = userEvent.setup();
        render(<FeedbackForm requestId={requestId} />);

        const textarea = screen.getByTestId('textarea-feedback');
        await user.type(textarea, 'Great service!');

        expect(textarea).toHaveValue('Great service!');
        expect(screen.getByText(/14 \/ 500/i)).toBeInTheDocument();
    });

    it('submits feedback successfully', async () => {
        const user = userEvent.setup();
        (submitMaintenanceRequestFeedback as jest.Mock).mockResolvedValue({});

        render(<FeedbackForm requestId={requestId} />);

        // Select rating
        await user.click(screen.getByTestId('star-5'));

        // Enter comment
        await user.type(screen.getByTestId('textarea-feedback'), 'Great service!');

        // Submit
        await user.click(screen.getByTestId('btn-submit-feedback'));

        await waitFor(() => {
            expect(submitMaintenanceRequestFeedback).toHaveBeenCalledWith(requestId, {
                rating: 5,
                comment: 'Great service!',
            });
        });

        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
            title: 'Feedback submitted',
        }));
    });

    it('handles submission error', async () => {
        const user = userEvent.setup();
        const error = { response: { data: { message: 'Submission failed' } } };
        (submitMaintenanceRequestFeedback as jest.Mock).mockRejectedValue(error);

        render(<FeedbackForm requestId={requestId} />);

        await user.click(screen.getByTestId('star-4'));
        await user.click(screen.getByTestId('btn-submit-feedback'));

        await waitFor(() => {
            expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
                variant: 'destructive',
                title: 'Failed to submit feedback',
                description: 'Submission failed',
            }));
        });
    });

    it('validates comment length (500 char max)', async () => {
        const user = userEvent.setup();
        render(<FeedbackForm requestId={requestId} />);

        const textarea = screen.getByTestId('textarea-feedback');
        const longComment = 'x'.repeat(501);

        await user.type(textarea, longComment);

        // Should truncate or show error for >500 chars
        expect(screen.getByText(/500 \/ 500/i)).toBeInTheDocument();
    });

    it('disables submit button when no rating selected', () => {
        render(<FeedbackForm requestId={requestId} />);

        const submitButton = screen.getByTestId('btn-submit-feedback');
        expect(submitButton).toBeDisabled();
    });

    it('shows character counter for comment', async () => {
        const user = userEvent.setup();
        render(<FeedbackForm requestId={requestId} />);

        const textarea = screen.getByTestId('textarea-feedback');
        await user.type(textarea, 'Test');

        expect(screen.getByText(/4 \/ 500/i)).toBeInTheDocument();
    });
});
