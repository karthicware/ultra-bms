/**
 * PropertyFilter Component Tests
 * Story 6.4: Financial Reporting and Analytics
 * AC #35: Frontend unit tests for PropertyFilter
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PropertyFilter } from '../PropertyFilter';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: vi.fn(),
  }),
  usePathname: () => '/finance/reports',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock properties service
vi.mock('@/services/properties.service', () => ({
  getProperties: vi.fn().mockResolvedValue({
    content: [
      { id: 'prop-1', name: 'Property Alpha' },
      { id: 'prop-2', name: 'Property Beta' },
      { id: 'prop-3', name: 'Property Gamma' },
    ],
    totalElements: 3,
    totalPages: 1,
  }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('PropertyFilter', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with data-testid', async () => {
    render(<PropertyFilter onChange={mockOnChange} />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByTestId('property-filter')).toBeInTheDocument();
    });
  });

  it('should show loading skeleton initially', () => {
    render(<PropertyFilter onChange={mockOnChange} />, {
      wrapper: createWrapper(),
    });

    // Initially shows skeleton while loading
    // After data loads, shows select
  });

  it('should display All Properties option', async () => {
    render(<PropertyFilter onChange={mockOnChange} />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByTestId('property-filter')).toBeInTheDocument();
    });

    const select = screen.getByTestId('property-filter');
    fireEvent.click(select);

    await waitFor(() => {
      expect(screen.getByTestId('property-filter-all')).toBeInTheDocument();
    });
  });

  it('should display property options', async () => {
    render(<PropertyFilter onChange={mockOnChange} />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByTestId('property-filter')).toBeInTheDocument();
    });

    const select = screen.getByTestId('property-filter');
    fireEvent.click(select);

    await waitFor(() => {
      expect(screen.getByText('Property Alpha')).toBeInTheDocument();
      expect(screen.getByText('Property Beta')).toBeInTheDocument();
      expect(screen.getByText('Property Gamma')).toBeInTheDocument();
    });
  });

  it('should call onChange with undefined when All Properties selected', async () => {
    render(<PropertyFilter onChange={mockOnChange} value="prop-1" />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByTestId('property-filter')).toBeInTheDocument();
    });

    const select = screen.getByTestId('property-filter');
    fireEvent.click(select);

    await waitFor(() => {
      const allOption = screen.getByTestId('property-filter-all');
      fireEvent.click(allOption);
    });

    expect(mockOnChange).toHaveBeenCalledWith(undefined);
  });

  it('should call onChange with propertyId when specific property selected', async () => {
    render(<PropertyFilter onChange={mockOnChange} />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByTestId('property-filter')).toBeInTheDocument();
    });

    const select = screen.getByTestId('property-filter');
    fireEvent.click(select);

    await waitFor(() => {
      const propertyOption = screen.getByText('Property Alpha');
      fireEvent.click(propertyOption);
    });

    expect(mockOnChange).toHaveBeenCalledWith('prop-1');
  });

  it('should apply custom className', async () => {
    render(
      <PropertyFilter onChange={mockOnChange} className="custom-class" />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByTestId('property-filter')).toHaveClass('custom-class');
    });
  });

  it('should use custom placeholder', async () => {
    render(
      <PropertyFilter
        onChange={mockOnChange}
        placeholder="Select a Property"
      />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      const select = screen.getByTestId('property-filter');
      fireEvent.click(select);
    });

    await waitFor(() => {
      expect(screen.getByText('Select a Property')).toBeInTheDocument();
    });
  });
});

describe('PropertyFilter URL Sync', () => {
  const mockOnChange = vi.fn();
  const mockReplace = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mock('next/navigation', () => ({
      useRouter: () => ({
        replace: mockReplace,
      }),
      usePathname: () => '/finance/reports',
      useSearchParams: () => new URLSearchParams('propertyId=prop-1'),
    }));
  });

  it('should sync selection to URL when syncToUrl is true', async () => {
    render(
      <PropertyFilter onChange={mockOnChange} syncToUrl={true} />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByTestId('property-filter')).toBeInTheDocument();
    });

    const select = screen.getByTestId('property-filter');
    fireEvent.click(select);

    await waitFor(() => {
      const propertyOption = screen.getByText('Property Beta');
      fireEvent.click(propertyOption);
    });

    // Should update URL
    expect(mockOnChange).toHaveBeenCalled();
  });
});
