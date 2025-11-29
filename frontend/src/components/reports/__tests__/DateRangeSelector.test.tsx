/**
 * DateRangeSelector Component Tests
 * Story 6.4: Financial Reporting and Analytics
 * AC #35: Frontend unit tests for DateRangeSelector
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { DateRangeSelector } from '../DateRangeSelector';
import { DateRangePreset } from '@/types/reports';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: vi.fn(),
  }),
  usePathname: () => '/finance/reports',
  useSearchParams: () => new URLSearchParams(),
}));

describe('DateRangeSelector', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with data-testid', () => {
    render(<DateRangeSelector onChange={mockOnChange} />);

    expect(screen.getByTestId('date-range-selector')).toBeInTheDocument();
    expect(screen.getByTestId('date-range-preset')).toBeInTheDocument();
    expect(screen.getByTestId('date-range-custom')).toBeInTheDocument();
  });

  it('should render preset selector with default value', () => {
    render(
      <DateRangeSelector
        onChange={mockOnChange}
        defaultPreset={DateRangePreset.THIS_MONTH}
      />
    );

    expect(screen.getByTestId('date-range-preset')).toBeInTheDocument();
  });

  it('should display date range in custom button', () => {
    render(<DateRangeSelector onChange={mockOnChange} />);

    const customButton = screen.getByTestId('date-range-custom');
    // Should show current month range
    expect(customButton).toHaveTextContent(/\w+ \d+, \d{4}/);
  });

  it('should call onChange when preset changes', async () => {
    render(<DateRangeSelector onChange={mockOnChange} />);

    const presetSelect = screen.getByTestId('date-range-preset');
    fireEvent.click(presetSelect);

    // Wait for dropdown to open and click option
    const lastMonthOption = await screen.findByText('Last Month');
    fireEvent.click(lastMonthOption);

    expect(mockOnChange).toHaveBeenCalled();
  });

  it('should open calendar popover when custom button clicked', async () => {
    render(<DateRangeSelector onChange={mockOnChange} />);

    const customButton = screen.getByTestId('date-range-custom');
    fireEvent.click(customButton);

    // Calendar should be visible
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(
      <DateRangeSelector
        onChange={mockOnChange}
        className="custom-class"
      />
    );

    expect(screen.getByTestId('date-range-selector')).toHaveClass('custom-class');
  });

  it('should use value prop when provided', () => {
    const customValue = {
      startDate: '2025-06-01',
      endDate: '2025-06-30',
    };

    render(
      <DateRangeSelector
        onChange={mockOnChange}
        value={customValue}
      />
    );

    const customButton = screen.getByTestId('date-range-custom');
    expect(customButton).toHaveTextContent('Jun');
  });
});

describe('DateRangeSelector Presets', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have This Month preset', () => {
    render(<DateRangeSelector onChange={mockOnChange} />);

    const presetSelect = screen.getByTestId('date-range-preset');
    fireEvent.click(presetSelect);

    expect(screen.getByText('This Month')).toBeInTheDocument();
  });

  it('should have Last Month preset', () => {
    render(<DateRangeSelector onChange={mockOnChange} />);

    const presetSelect = screen.getByTestId('date-range-preset');
    fireEvent.click(presetSelect);

    expect(screen.getByText('Last Month')).toBeInTheDocument();
  });

  it('should have This Quarter preset', () => {
    render(<DateRangeSelector onChange={mockOnChange} />);

    const presetSelect = screen.getByTestId('date-range-preset');
    fireEvent.click(presetSelect);

    expect(screen.getByText('This Quarter')).toBeInTheDocument();
  });

  it('should have This Year preset', () => {
    render(<DateRangeSelector onChange={mockOnChange} />);

    const presetSelect = screen.getByTestId('date-range-preset');
    fireEvent.click(presetSelect);

    expect(screen.getByText('This Year')).toBeInTheDocument();
  });

  it('should have Custom preset', () => {
    render(<DateRangeSelector onChange={mockOnChange} />);

    const presetSelect = screen.getByTestId('date-range-preset');
    fireEvent.click(presetSelect);

    expect(screen.getByText('Custom')).toBeInTheDocument();
  });
});
