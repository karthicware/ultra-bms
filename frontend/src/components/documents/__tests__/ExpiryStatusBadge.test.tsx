/**
 * ExpiryStatusBadge Component Tests
 * Story 7.2: Document Management System
 * AC #26: Frontend unit tests for document components
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { ExpiryStatusBadge } from '../ExpiryStatusBadge';

describe('ExpiryStatusBadge', () => {
  // =================================================================
  // RENDER TESTS - All Statuses
  // =================================================================

  describe('renders correctly for each status', () => {
    const statuses: Array<'valid' | 'expiring_soon' | 'expired' | 'no_expiry'> = [
      'valid',
      'expiring_soon',
      'expired',
      'no_expiry'
    ];

    statuses.forEach((status) => {
      it(`should render badge for ${status} status`, () => {
        render(<ExpiryStatusBadge status={status} />);

        const badge = screen.getByTestId('badge-expiry-status');
        expect(badge).toBeInTheDocument();
      });
    });
  });

  // =================================================================
  // STATUS-SPECIFIC STYLING TESTS
  // =================================================================

  describe('valid status', () => {
    it('should render with green styling', () => {
      render(<ExpiryStatusBadge status="valid" />);
      const badge = screen.getByTestId('badge-expiry-status');

      expect(badge).toHaveTextContent('Valid');
      expect(badge).toHaveClass('bg-green-100');
    });
  });

  describe('expiring_soon status', () => {
    it('should render with yellow styling', () => {
      render(<ExpiryStatusBadge status="expiring_soon" />);
      const badge = screen.getByTestId('badge-expiry-status');

      expect(badge).toHaveTextContent('Expiring');
      expect(badge).toHaveClass('bg-yellow-100');
    });

    it('should show days remaining when provided', () => {
      render(<ExpiryStatusBadge status="expiring_soon" daysUntilExpiry={15} />);
      const badge = screen.getByTestId('badge-expiry-status');

      expect(badge).toHaveTextContent('15');
      expect(badge).toHaveTextContent('day');
    });

    it('should handle singular day correctly', () => {
      render(<ExpiryStatusBadge status="expiring_soon" daysUntilExpiry={1} />);
      const badge = screen.getByTestId('badge-expiry-status');

      expect(badge).toHaveTextContent('1 day');
    });
  });

  describe('expired status', () => {
    it('should render with red styling', () => {
      render(<ExpiryStatusBadge status="expired" />);
      const badge = screen.getByTestId('badge-expiry-status');

      expect(badge).toHaveTextContent('Expired');
      expect(badge).toHaveClass('bg-red-100');
    });

    it('should show days ago when provided negative value', () => {
      render(<ExpiryStatusBadge status="expired" daysUntilExpiry={-5} />);
      const badge = screen.getByTestId('badge-expiry-status');

      expect(badge).toHaveTextContent('5');
      expect(badge).toHaveTextContent('ago');
    });
  });

  describe('no_expiry status', () => {
    it('should render with gray styling', () => {
      render(<ExpiryStatusBadge status="no_expiry" />);
      const badge = screen.getByTestId('badge-expiry-status');

      expect(badge).toHaveTextContent('No Expiry');
      expect(badge).toHaveClass('bg-gray-100');
    });
  });

  // =================================================================
  // CUSTOM CLASSNAME TESTS
  // =================================================================

  describe('className prop', () => {
    it('should apply custom className', () => {
      render(
        <ExpiryStatusBadge
          status="valid"
          className="custom-class"
        />
      );
      const badge = screen.getByTestId('badge-expiry-status');

      expect(badge).toHaveClass('custom-class');
    });

    it('should preserve default classes when adding custom className', () => {
      render(
        <ExpiryStatusBadge
          status="valid"
          className="custom-class"
        />
      );
      const badge = screen.getByTestId('badge-expiry-status');

      expect(badge).toHaveClass('bg-green-100');
      expect(badge).toHaveClass('custom-class');
    });
  });

  // =================================================================
  // EDGE CASES
  // =================================================================

  describe('edge cases', () => {
    it('should handle null daysUntilExpiry', () => {
      render(<ExpiryStatusBadge status="expiring_soon" daysUntilExpiry={null} />);
      const badge = screen.getByTestId('badge-expiry-status');

      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('Expiring Soon');
    });

    it('should handle undefined daysUntilExpiry', () => {
      render(<ExpiryStatusBadge status="expiring_soon" daysUntilExpiry={undefined} />);
      const badge = screen.getByTestId('badge-expiry-status');

      expect(badge).toBeInTheDocument();
    });

    it('should handle zero days until expiry', () => {
      render(<ExpiryStatusBadge status="expiring_soon" daysUntilExpiry={0} />);
      const badge = screen.getByTestId('badge-expiry-status');

      expect(badge).toBeInTheDocument();
    });
  });

  // =================================================================
  // ACCESSIBILITY TESTS
  // =================================================================

  describe('accessibility', () => {
    it('should have text content readable by screen readers', () => {
      render(<ExpiryStatusBadge status="valid" />);
      const badge = screen.getByTestId('badge-expiry-status');

      expect(badge).toHaveTextContent('Valid');
    });

    it('should render as span element', () => {
      render(<ExpiryStatusBadge status="valid" />);
      const badge = screen.getByTestId('badge-expiry-status');

      expect(badge.tagName.toLowerCase()).toBe('span');
    });
  });
});
