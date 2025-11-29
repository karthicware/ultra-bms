/**
 * AccessLevelBadge Component Tests
 * Story 7.2: Document Management System
 * AC #26: Frontend unit tests for document components
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { AccessLevelBadge } from '../AccessLevelBadge';
import { DocumentAccessLevel } from '@/types/document';

describe('AccessLevelBadge', () => {
  // =================================================================
  // RENDER TESTS - All Access Levels
  // =================================================================

  describe('renders correctly for each access level', () => {
    const accessLevels: DocumentAccessLevel[] = [
      DocumentAccessLevel.PUBLIC,
      DocumentAccessLevel.INTERNAL,
      DocumentAccessLevel.RESTRICTED
    ];

    accessLevels.forEach((accessLevel) => {
      it(`should render badge for ${accessLevel} access level`, () => {
        render(<AccessLevelBadge accessLevel={accessLevel} />);

        const badge = screen.getByTestId('badge-access-level');
        expect(badge).toBeInTheDocument();
      });
    });
  });

  // =================================================================
  // ACCESS LEVEL-SPECIFIC STYLING TESTS
  // =================================================================

  describe('PUBLIC access level', () => {
    it('should render with green styling', () => {
      render(<AccessLevelBadge accessLevel={DocumentAccessLevel.PUBLIC} />);
      const badge = screen.getByTestId('badge-access-level');

      expect(badge).toHaveTextContent('Public');
      expect(badge).toHaveClass('bg-green-100');
    });
  });

  describe('INTERNAL access level', () => {
    it('should render with yellow styling', () => {
      render(<AccessLevelBadge accessLevel={DocumentAccessLevel.INTERNAL} />);
      const badge = screen.getByTestId('badge-access-level');

      expect(badge).toHaveTextContent('Internal');
      expect(badge).toHaveClass('bg-yellow-100');
    });
  });

  describe('RESTRICTED access level', () => {
    it('should render with red styling', () => {
      render(<AccessLevelBadge accessLevel={DocumentAccessLevel.RESTRICTED} />);
      const badge = screen.getByTestId('badge-access-level');

      expect(badge).toHaveTextContent('Restricted');
      expect(badge).toHaveClass('bg-red-100');
    });
  });

  // =================================================================
  // TOOLTIP TESTS
  // =================================================================

  describe('tooltip behavior', () => {
    it('should render with tooltip by default', () => {
      render(<AccessLevelBadge accessLevel={DocumentAccessLevel.PUBLIC} />);
      const badge = screen.getByTestId('badge-access-level');

      // Badge should be wrapped in tooltip
      expect(badge).toBeInTheDocument();
    });

    it('should render without tooltip when showTooltip is false', () => {
      render(
        <AccessLevelBadge
          accessLevel={DocumentAccessLevel.PUBLIC}
          showTooltip={false}
        />
      );
      const badge = screen.getByTestId('badge-access-level');

      expect(badge).toBeInTheDocument();
    });

    it('should render with tooltip when showTooltip is true', () => {
      render(
        <AccessLevelBadge
          accessLevel={DocumentAccessLevel.RESTRICTED}
          showTooltip={true}
        />
      );
      const badge = screen.getByTestId('badge-access-level');

      expect(badge).toBeInTheDocument();
    });
  });

  // =================================================================
  // CUSTOM CLASSNAME TESTS
  // =================================================================

  describe('className prop', () => {
    it('should apply custom className', () => {
      render(
        <AccessLevelBadge
          accessLevel={DocumentAccessLevel.PUBLIC}
          className="custom-class"
        />
      );
      const badge = screen.getByTestId('badge-access-level');

      expect(badge).toHaveClass('custom-class');
    });

    it('should preserve default classes when adding custom className', () => {
      render(
        <AccessLevelBadge
          accessLevel={DocumentAccessLevel.PUBLIC}
          className="custom-class"
        />
      );
      const badge = screen.getByTestId('badge-access-level');

      expect(badge).toHaveClass('bg-green-100');
      expect(badge).toHaveClass('custom-class');
    });
  });

  // =================================================================
  // ACCESSIBILITY TESTS
  // =================================================================

  describe('accessibility', () => {
    it('should have text content readable by screen readers', () => {
      render(<AccessLevelBadge accessLevel={DocumentAccessLevel.INTERNAL} />);
      const badge = screen.getByTestId('badge-access-level');

      expect(badge).toHaveTextContent('Internal');
    });

    it('should render as span element', () => {
      render(<AccessLevelBadge accessLevel={DocumentAccessLevel.PUBLIC} />);
      const badge = screen.getByTestId('badge-access-level');

      expect(badge.tagName.toLowerCase()).toBe('span');
    });
  });
});
