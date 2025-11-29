/**
 * PDCStatusBadge Component Tests
 * Story 6.3: Post-Dated Cheque (PDC) Management
 * AC #36: Frontend unit tests for PDC components
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { PDCStatusBadge } from '../PDCStatusBadge';
import { PDCStatus, PDC_STATUS_LABELS } from '@/types/pdc';

describe('PDCStatusBadge', () => {
  // =================================================================
  // RENDER TESTS - All Statuses
  // =================================================================

  describe('renders correctly for each status', () => {
    const statuses = Object.values(PDCStatus);

    statuses.forEach((status) => {
      it(`should render badge for ${status} status`, () => {
        render(<PDCStatusBadge status={status} />);

        // Check badge is rendered
        const badge = screen.getByTestId('badge-pdc-status');
        expect(badge).toBeInTheDocument();

        // Check label is displayed
        const expectedLabel = PDC_STATUS_LABELS[status] || status;
        expect(badge).toHaveTextContent(expectedLabel);
      });
    });
  });

  // =================================================================
  // STATUS-SPECIFIC STYLING TESTS
  // =================================================================

  describe('RECEIVED status', () => {
    it('should render with gray styling', () => {
      render(<PDCStatusBadge status={PDCStatus.RECEIVED} />);
      const badge = screen.getByTestId('badge-pdc-status');

      expect(badge).toHaveTextContent('Received');
      expect(badge).toHaveClass('bg-gray-100');
    });

    it('should show Inbox icon by default', () => {
      render(<PDCStatusBadge status={PDCStatus.RECEIVED} />);
      const badge = screen.getByTestId('badge-pdc-status');

      // Icon should be rendered inside the badge
      const icon = badge.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('DUE status', () => {
    it('should render with amber styling', () => {
      render(<PDCStatusBadge status={PDCStatus.DUE} />);
      const badge = screen.getByTestId('badge-pdc-status');

      expect(badge).toHaveTextContent('Due');
      expect(badge).toHaveClass('bg-amber-100');
    });
  });

  describe('DEPOSITED status', () => {
    it('should render with blue styling', () => {
      render(<PDCStatusBadge status={PDCStatus.DEPOSITED} />);
      const badge = screen.getByTestId('badge-pdc-status');

      expect(badge).toHaveTextContent('Deposited');
      expect(badge).toHaveClass('bg-blue-100');
    });
  });

  describe('CLEARED status', () => {
    it('should render with green styling', () => {
      render(<PDCStatusBadge status={PDCStatus.CLEARED} />);
      const badge = screen.getByTestId('badge-pdc-status');

      expect(badge).toHaveTextContent('Cleared');
      expect(badge).toHaveClass('bg-green-100');
    });
  });

  describe('BOUNCED status', () => {
    it('should render with red styling', () => {
      render(<PDCStatusBadge status={PDCStatus.BOUNCED} />);
      const badge = screen.getByTestId('badge-pdc-status');

      expect(badge).toHaveTextContent('Bounced');
      expect(badge).toHaveClass('bg-red-100');
    });
  });

  describe('CANCELLED status', () => {
    it('should render with gray styling and strikethrough', () => {
      render(<PDCStatusBadge status={PDCStatus.CANCELLED} />);
      const badge = screen.getByTestId('badge-pdc-status');

      expect(badge).toHaveTextContent('Cancelled');
      expect(badge).toHaveClass('line-through');
    });
  });

  describe('REPLACED status', () => {
    it('should render with purple styling', () => {
      render(<PDCStatusBadge status={PDCStatus.REPLACED} />);
      const badge = screen.getByTestId('badge-pdc-status');

      expect(badge).toHaveTextContent('Replaced');
      expect(badge).toHaveClass('bg-purple-100');
    });
  });

  describe('WITHDRAWN status', () => {
    it('should render with orange styling', () => {
      render(<PDCStatusBadge status={PDCStatus.WITHDRAWN} />);
      const badge = screen.getByTestId('badge-pdc-status');

      expect(badge).toHaveTextContent('Withdrawn');
      expect(badge).toHaveClass('bg-orange-100');
    });
  });

  // =================================================================
  // ICON VISIBILITY TESTS
  // =================================================================

  describe('showIcon prop', () => {
    it('should show icon by default', () => {
      render(<PDCStatusBadge status={PDCStatus.RECEIVED} />);
      const badge = screen.getByTestId('badge-pdc-status');
      const icon = badge.querySelector('svg');

      expect(icon).toBeInTheDocument();
    });

    it('should show icon when showIcon is true', () => {
      render(<PDCStatusBadge status={PDCStatus.RECEIVED} showIcon={true} />);
      const badge = screen.getByTestId('badge-pdc-status');
      const icon = badge.querySelector('svg');

      expect(icon).toBeInTheDocument();
    });

    it('should hide icon when showIcon is false', () => {
      render(<PDCStatusBadge status={PDCStatus.RECEIVED} showIcon={false} />);
      const badge = screen.getByTestId('badge-pdc-status');
      const icon = badge.querySelector('svg');

      expect(icon).not.toBeInTheDocument();
    });

    it('should still display label when icon is hidden', () => {
      render(<PDCStatusBadge status={PDCStatus.RECEIVED} showIcon={false} />);
      const badge = screen.getByTestId('badge-pdc-status');

      expect(badge).toHaveTextContent('Received');
    });
  });

  // =================================================================
  // CUSTOM CLASSNAME TESTS
  // =================================================================

  describe('className prop', () => {
    it('should apply custom className', () => {
      render(
        <PDCStatusBadge
          status={PDCStatus.RECEIVED}
          className="custom-class"
        />
      );
      const badge = screen.getByTestId('badge-pdc-status');

      expect(badge).toHaveClass('custom-class');
    });

    it('should preserve default classes when adding custom className', () => {
      render(
        <PDCStatusBadge
          status={PDCStatus.RECEIVED}
          className="custom-class"
        />
      );
      const badge = screen.getByTestId('badge-pdc-status');

      // Should have both status-specific class and custom class
      expect(badge).toHaveClass('bg-gray-100');
      expect(badge).toHaveClass('custom-class');
    });
  });

  // =================================================================
  // EDGE CASES
  // =================================================================

  describe('edge cases', () => {
    it('should handle all PDC statuses without errors', () => {
      const statuses = Object.values(PDCStatus);

      statuses.forEach((status) => {
        // Should not throw
        expect(() => {
          render(<PDCStatusBadge status={status} />);
        }).not.toThrow();
      });
    });

    it('should render with correct label for each status', () => {
      const statusLabelPairs: [PDCStatus, string][] = [
        [PDCStatus.RECEIVED, 'Received'],
        [PDCStatus.DUE, 'Due'],
        [PDCStatus.DEPOSITED, 'Deposited'],
        [PDCStatus.CLEARED, 'Cleared'],
        [PDCStatus.BOUNCED, 'Bounced'],
        [PDCStatus.CANCELLED, 'Cancelled'],
        [PDCStatus.REPLACED, 'Replaced'],
        [PDCStatus.WITHDRAWN, 'Withdrawn'],
      ];

      statusLabelPairs.forEach(([status, expectedLabel]) => {
        const { unmount } = render(<PDCStatusBadge status={status} />);
        const badge = screen.getByTestId('badge-pdc-status');

        expect(badge).toHaveTextContent(expectedLabel);
        unmount();
      });
    });
  });

  // =================================================================
  // ACCESSIBILITY TESTS
  // =================================================================

  describe('accessibility', () => {
    it('should have text content readable by screen readers', () => {
      render(<PDCStatusBadge status={PDCStatus.CLEARED} />);
      const badge = screen.getByTestId('badge-pdc-status');

      // Badge should have readable text content
      expect(badge).toHaveTextContent('Cleared');
    });

    it('should render as inline Badge component', () => {
      render(<PDCStatusBadge status={PDCStatus.RECEIVED} />);
      const badge = screen.getByTestId('badge-pdc-status');

      // Badge renders as span element
      expect(badge.tagName.toLowerCase()).toBe('span');
    });
  });

  // =================================================================
  // STATUS TRANSITIONS VISUAL TESTS
  // =================================================================

  describe('status transition visualization', () => {
    it('RECEIVED should be neutral (gray) - awaiting processing', () => {
      render(<PDCStatusBadge status={PDCStatus.RECEIVED} />);
      const badge = screen.getByTestId('badge-pdc-status');
      expect(badge).toHaveClass('text-gray-700');
    });

    it('DUE should be warning (amber) - requires attention', () => {
      render(<PDCStatusBadge status={PDCStatus.DUE} />);
      const badge = screen.getByTestId('badge-pdc-status');
      expect(badge).toHaveClass('text-amber-700');
    });

    it('DEPOSITED should be info (blue) - in progress', () => {
      render(<PDCStatusBadge status={PDCStatus.DEPOSITED} />);
      const badge = screen.getByTestId('badge-pdc-status');
      expect(badge).toHaveClass('text-blue-700');
    });

    it('CLEARED should be success (green) - completed successfully', () => {
      render(<PDCStatusBadge status={PDCStatus.CLEARED} />);
      const badge = screen.getByTestId('badge-pdc-status');
      expect(badge).toHaveClass('text-green-700');
    });

    it('BOUNCED should be error (red) - failed', () => {
      render(<PDCStatusBadge status={PDCStatus.BOUNCED} />);
      const badge = screen.getByTestId('badge-pdc-status');
      expect(badge).toHaveClass('text-red-700');
    });
  });
});
