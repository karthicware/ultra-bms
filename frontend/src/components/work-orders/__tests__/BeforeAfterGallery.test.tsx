/**
 * Tests for BeforeAfterGallery component
 * Story 4.4 - Job Progress Tracking and Completion
 * AC #21: Photo Gallery with before/after comparison view
 *         data-testid="gallery-work-order-photos"
 */

// Mock ResizeObserver for Radix UI components
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BeforeAfterGallery } from '../BeforeAfterGallery';

const mockBeforePhotos = [
  'https://example.com/before1.jpg',
  'https://example.com/before2.jpg',
];

const mockAfterPhotos = [
  'https://example.com/after1.jpg',
  'https://example.com/after2.jpg',
  'https://example.com/after3.jpg',
];

describe('BeforeAfterGallery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render gallery card with title', () => {
    render(
      <BeforeAfterGallery
        beforePhotos={mockBeforePhotos}
        afterPhotos={mockAfterPhotos}
      />
    );

    expect(screen.getByText('Photo Gallery')).toBeInTheDocument();
  });

  it('should return null when no photos are provided', () => {
    const { container } = render(
      <BeforeAfterGallery
        beforePhotos={[]}
        afterPhotos={[]}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render with only before photos', () => {
    render(
      <BeforeAfterGallery
        beforePhotos={mockBeforePhotos}
        afterPhotos={[]}
      />
    );

    expect(screen.getByText('Photo Gallery')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /before/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /after/i })).toBeDisabled();
  });

  it('should render with only after photos', () => {
    render(
      <BeforeAfterGallery
        beforePhotos={[]}
        afterPhotos={mockAfterPhotos}
      />
    );

    expect(screen.getByText('Photo Gallery')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /before/i })).toBeDisabled();
    expect(screen.getByRole('tab', { name: /after/i })).toBeInTheDocument();
  });

  it('should display tabs for Before and After photos', () => {
    render(
      <BeforeAfterGallery
        beforePhotos={mockBeforePhotos}
        afterPhotos={mockAfterPhotos}
      />
    );

    expect(screen.getByRole('tab', { name: /before \(2\)/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /after \(3\)/i })).toBeInTheDocument();
  });

  it('should switch between Before and After tabs', async () => {
    const user = userEvent.setup();

    render(
      <BeforeAfterGallery
        beforePhotos={mockBeforePhotos}
        afterPhotos={mockAfterPhotos}
      />
    );

    // Initially on Before tab (default since before photos exist)
    const beforeTab = screen.getByRole('tab', { name: /before/i });
    const afterTab = screen.getByRole('tab', { name: /after/i });

    expect(beforeTab).toHaveAttribute('data-state', 'active');

    await user.click(afterTab);

    await waitFor(() => {
      expect(afterTab).toHaveAttribute('data-state', 'active');
    });
  });

  it('should display view mode toggle buttons when both photo types exist', () => {
    render(
      <BeforeAfterGallery
        beforePhotos={mockBeforePhotos}
        afterPhotos={mockAfterPhotos}
      />
    );

    expect(screen.getByRole('button', { name: /grid view/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /comparison view/i })).toBeInTheDocument();
  });

  it('should NOT display view mode toggle when only one type of photo exists', () => {
    render(
      <BeforeAfterGallery
        beforePhotos={mockBeforePhotos}
        afterPhotos={[]}
      />
    );

    expect(screen.queryByRole('button', { name: /grid view/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /comparison view/i })).not.toBeInTheDocument();
  });

  it('should switch to comparison view', async () => {
    const user = userEvent.setup();

    render(
      <BeforeAfterGallery
        beforePhotos={mockBeforePhotos}
        afterPhotos={mockAfterPhotos}
      />
    );

    const comparisonButton = screen.getByRole('button', { name: /comparison view/i });
    await user.click(comparisonButton);

    await waitFor(() => {
      expect(screen.getByText(/side-by-side comparison/i)).toBeInTheDocument();
    });
  });

  it('should display photos in grid view', () => {
    render(
      <BeforeAfterGallery
        beforePhotos={mockBeforePhotos}
        afterPhotos={mockAfterPhotos}
      />
    );

    // Photo grid should be present
    const photoList = screen.getByRole('list', { name: /photo gallery/i });
    expect(photoList).toBeInTheDocument();
  });

  it('should open lightbox when photo is clicked', async () => {
    const user = userEvent.setup();

    render(
      <BeforeAfterGallery
        beforePhotos={mockBeforePhotos}
        afterPhotos={mockAfterPhotos}
      />
    );

    const photoButtons = screen.getAllByRole('button', { name: /view photo/i });
    await user.click(photoButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/before photos - 1 of 2/i)).toBeInTheDocument();
    });
  });

  it('should navigate between photos in lightbox', async () => {
    const user = userEvent.setup();

    render(
      <BeforeAfterGallery
        beforePhotos={mockBeforePhotos}
        afterPhotos={mockAfterPhotos}
      />
    );

    const photoButtons = screen.getAllByRole('button', { name: /view photo/i });
    await user.click(photoButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/before photos - 1 of 2/i)).toBeInTheDocument();
    });

    // Click next button
    const nextButton = screen.getByRole('button', { name: /next photo/i });
    await user.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText(/before photos - 2 of 2/i)).toBeInTheDocument();
    });
  });

  it('should display thumbnails in lightbox when multiple photos', async () => {
    const user = userEvent.setup();

    render(
      <BeforeAfterGallery
        beforePhotos={mockBeforePhotos}
        afterPhotos={mockAfterPhotos}
      />
    );

    const photoButtons = screen.getAllByRole('button', { name: /view photo/i });
    await user.click(photoButtons[0]);

    await waitFor(() => {
      const thumbnails = screen.getAllByRole('button', { name: /view photo \d+/i });
      expect(thumbnails.length).toBe(2);
    });
  });

  it('should click on thumbnail to navigate', async () => {
    const user = userEvent.setup();

    render(
      <BeforeAfterGallery
        beforePhotos={mockBeforePhotos}
        afterPhotos={mockAfterPhotos}
      />
    );

    const photoButtons = screen.getAllByRole('button', { name: /view photo/i });
    await user.click(photoButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/before photos - 1 of 2/i)).toBeInTheDocument();
    });

    const thumbnail2 = screen.getByRole('button', { name: /view photo 2/i });
    await user.click(thumbnail2);

    await waitFor(() => {
      expect(screen.getByText(/before photos - 2 of 2/i)).toBeInTheDocument();
    });
  });

  it('should display comparison view with Before and After labels', async () => {
    const user = userEvent.setup();

    render(
      <BeforeAfterGallery
        beforePhotos={mockBeforePhotos}
        afterPhotos={mockAfterPhotos}
      />
    );

    const comparisonButton = screen.getByRole('button', { name: /comparison view/i });
    await user.click(comparisonButton);

    await waitFor(() => {
      expect(screen.getByText('Before')).toBeInTheDocument();
      expect(screen.getByText('After')).toBeInTheDocument();
    });
  });

  it('should show "No photo" placeholder in comparison when photo count differs', async () => {
    const user = userEvent.setup();

    render(
      <BeforeAfterGallery
        beforePhotos={mockBeforePhotos} // 2 photos
        afterPhotos={mockAfterPhotos}   // 3 photos
      />
    );

    const comparisonButton = screen.getByRole('button', { name: /comparison view/i });
    await user.click(comparisonButton);

    await waitFor(() => {
      // Should show "No photo" for the third row's before photo
      expect(screen.getByText('No photo')).toBeInTheDocument();
    });
  });

  it('should have proper ARIA labels on photo buttons', () => {
    render(
      <BeforeAfterGallery
        beforePhotos={mockBeforePhotos}
        afterPhotos={mockAfterPhotos}
      />
    );

    const photoButtons = screen.getAllByRole('button', { name: /view photo \d+ of \d+/i });
    expect(photoButtons.length).toBeGreaterThan(0);
  });

  it('should have aria-pressed attribute on view mode buttons', () => {
    render(
      <BeforeAfterGallery
        beforePhotos={mockBeforePhotos}
        afterPhotos={mockAfterPhotos}
      />
    );

    const gridButton = screen.getByRole('button', { name: /grid view/i });
    const comparisonButton = screen.getByRole('button', { name: /comparison view/i });

    expect(gridButton).toHaveAttribute('aria-pressed', 'true');
    expect(comparisonButton).toHaveAttribute('aria-pressed', 'false');
  });

  it('should have screen reader description in lightbox', async () => {
    const user = userEvent.setup();

    render(
      <BeforeAfterGallery
        beforePhotos={mockBeforePhotos}
        afterPhotos={mockAfterPhotos}
      />
    );

    const photoButtons = screen.getAllByRole('button', { name: /view photo/i });
    await user.click(photoButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/use arrow keys to navigate/i)).toBeInTheDocument();
    });
  });
});
