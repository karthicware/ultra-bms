import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PhotoUploadZone } from '../PhotoUploadZone';
import { useToast } from '@/hooks/use-toast';

// Mock useToast
jest.mock('@/hooks/use-toast', () => ({
    useToast: jest.fn(),
}));

describe('PhotoUploadZone', () => {
    const mockOnPhotosChange = jest.fn();
    const mockToast = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (useToast as jest.Mock).mockReturnValue({ toast: mockToast });
    });

    it('renders upload instructions', () => {
        render(<PhotoUploadZone photos={[]} onPhotosChange={mockOnPhotosChange} />);

        expect(screen.getByText(/Click to upload or drag and drop/i)).toBeInTheDocument();
        expect(screen.getByText(/JPG or PNG/i)).toBeInTheDocument();
    });

    it('handles file upload via click', async () => {
        const user = userEvent.setup();
        render(<PhotoUploadZone photos={[]} onPhotosChange={mockOnPhotosChange} />);

        const file = new File(['hello'], 'test.png', { type: 'image/png' });
        const input = screen.getByTestId('file-input');

        await user.upload(input, file);

        expect(mockOnPhotosChange).toHaveBeenCalledWith([file]);
    });

    it('validates file type', async () => {
        render(<PhotoUploadZone photos={[]} onPhotosChange={mockOnPhotosChange} />);

        const file = new File(['hello'], 'test.txt', { type: 'text/plain' });
        const input = screen.getByTestId('file-input');

        fireEvent.change(input, { target: { files: [file] } });

        expect(mockOnPhotosChange).not.toHaveBeenCalled();
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
            variant: 'destructive',
            title: 'Some files were rejected',
        }));
    });

    it('validates file size', async () => {
        render(<PhotoUploadZone photos={[]} onPhotosChange={mockOnPhotosChange} maxSizeMB={1} />);

        // Create a file larger than 1MB
        const largeFile = new File(['x'.repeat(1024 * 1024 * 2)], 'large.png', { type: 'image/png' });
        const input = screen.getByTestId('file-input');

        fireEvent.change(input, { target: { files: [largeFile] } });

        expect(mockOnPhotosChange).not.toHaveBeenCalled();
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
            variant: 'destructive',
            title: 'Some files were rejected',
        }));
    });

    it('enforces max photos limit', async () => {
        const user = userEvent.setup();
        render(<PhotoUploadZone photos={[]} onPhotosChange={mockOnPhotosChange} maxPhotos={1} />);

        const file1 = new File(['1'], '1.png', { type: 'image/png' });
        const file2 = new File(['2'], '2.png', { type: 'image/png' });
        const input = screen.getByTestId('file-input');

        await user.upload(input, [file1, file2]);

        expect(mockOnPhotosChange).not.toHaveBeenCalled();
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
            variant: 'destructive',
            title: 'Too many photos',
        }));
    });

    it('displays previews of uploaded photos', () => {
        const file = new File(['hello'], 'test.png', { type: 'image/png' });
        global.URL.createObjectURL = jest.fn(() => 'mock-url');

        render(<PhotoUploadZone photos={[file]} onPhotosChange={mockOnPhotosChange} />);

        expect(screen.getByTestId('photo-preview-0')).toBeInTheDocument();
        expect(screen.getByAltText('Photo 1')).toBeInTheDocument();
    });

    it('allows removing photos', async () => {
        const user = userEvent.setup();
        const file = new File(['hello'], 'test.png', { type: 'image/png' });
        global.URL.createObjectURL = jest.fn(() => 'mock-url');

        render(<PhotoUploadZone photos={[file]} onPhotosChange={mockOnPhotosChange} />);

        const removeButton = screen.getByTestId('btn-remove-0');
        await user.click(removeButton);

        expect(mockOnPhotosChange).toHaveBeenCalledWith([]);
    });

    it('disables upload when max photos reached', () => {
        const file = new File(['hello'], 'test.png', { type: 'image/png' });
        render(<PhotoUploadZone photos={[file]} onPhotosChange={mockOnPhotosChange} maxPhotos={1} />);

        expect(screen.getByText(/Maximum 1 photos reached/i)).toBeInTheDocument();
        expect(screen.getByTestId('file-input')).toBeDisabled();
    });
});
