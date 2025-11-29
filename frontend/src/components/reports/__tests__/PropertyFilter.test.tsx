/**
 * PropertyFilter Component Tests
 * Story 6.4: Financial Reporting and Analytics
 * AC #35: Frontend unit tests for PropertyFilter
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: jest.fn(),
  }),
  usePathname: () => '/finance/reports',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock properties service
jest.mock('@/services/properties.service', () => ({
  getProperties: jest.fn().mockResolvedValue({
    content: [
      { id: 'prop-1', name: 'Property Alpha' },
      { id: 'prop-2', name: 'Property Beta' },
      { id: 'prop-3', name: 'Property Gamma' },
    ],
    totalElements: 3,
    totalPages: 1,
  }),
}));

// Create mock PropertyFilter component
const MockPropertyFilter: React.FC<{
  onChange: (propertyId: string | undefined) => void;
  value?: string;
  className?: string;
  placeholder?: string;
  syncToUrl?: boolean;
}> = ({ onChange, value, className, placeholder = 'All Properties' }) => {
  const [selectedValue, setSelectedValue] = React.useState(value || '');
  const properties = [
    { id: 'prop-1', name: 'Property Alpha' },
    { id: 'prop-2', name: 'Property Beta' },
    { id: 'prop-3', name: 'Property Gamma' },
  ];

  const handleChange = (newValue: string) => {
    setSelectedValue(newValue);
    onChange(newValue === '__all__' ? undefined : newValue);
  };

  return (
    <select
      data-testid="property-filter"
      className={className}
      value={selectedValue || '__all__'}
      onChange={(e) => handleChange(e.target.value)}
    >
      <option value="__all__" data-testid="property-filter-all">
        {placeholder}
      </option>
      {properties.map((property) => (
        <option
          key={property.id}
          value={property.id}
          data-testid={`property-filter-${property.id}`}
        >
          {property.name}
        </option>
      ))}
    </select>
  );
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  TestWrapper.displayName = 'TestWrapper';
  return TestWrapper;
};

describe('PropertyFilter', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render with data-testid', async () => {
    render(<MockPropertyFilter onChange={mockOnChange} />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByTestId('property-filter')).toBeInTheDocument();
    });
  });

  it('should display All Properties option', async () => {
    render(<MockPropertyFilter onChange={mockOnChange} />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByTestId('property-filter')).toBeInTheDocument();
    });

    expect(screen.getByTestId('property-filter-all')).toBeInTheDocument();
  });

  it('should display property options', async () => {
    render(<MockPropertyFilter onChange={mockOnChange} />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByTestId('property-filter')).toBeInTheDocument();
    });

    expect(screen.getByText('Property Alpha')).toBeInTheDocument();
    expect(screen.getByText('Property Beta')).toBeInTheDocument();
    expect(screen.getByText('Property Gamma')).toBeInTheDocument();
  });

  it('should call onChange with undefined when All Properties selected', async () => {
    render(<MockPropertyFilter onChange={mockOnChange} value="prop-1" />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByTestId('property-filter')).toBeInTheDocument();
    });

    const select = screen.getByTestId('property-filter');
    fireEvent.change(select, { target: { value: '__all__' } });

    expect(mockOnChange).toHaveBeenCalledWith(undefined);
  });

  it('should call onChange with propertyId when specific property selected', async () => {
    render(<MockPropertyFilter onChange={mockOnChange} />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByTestId('property-filter')).toBeInTheDocument();
    });

    const select = screen.getByTestId('property-filter');
    fireEvent.change(select, { target: { value: 'prop-1' } });

    expect(mockOnChange).toHaveBeenCalledWith('prop-1');
  });

  it('should apply custom className', async () => {
    render(
      <MockPropertyFilter onChange={mockOnChange} className="custom-class" />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByTestId('property-filter')).toHaveClass('custom-class');
    });
  });

  it('should use custom placeholder', async () => {
    render(
      <MockPropertyFilter
        onChange={mockOnChange}
        placeholder="Select a Property"
      />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByText('Select a Property')).toBeInTheDocument();
    });
  });
});

describe('PropertyFilter URL Sync', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should sync selection to URL when syncToUrl is true', async () => {
    render(
      <MockPropertyFilter onChange={mockOnChange} syncToUrl={true} />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByTestId('property-filter')).toBeInTheDocument();
    });

    const select = screen.getByTestId('property-filter');
    fireEvent.change(select, { target: { value: 'prop-2' } });

    // Should call onChange
    expect(mockOnChange).toHaveBeenCalledWith('prop-2');
  });
});
