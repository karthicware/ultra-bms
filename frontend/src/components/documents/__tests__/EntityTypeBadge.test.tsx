/**
 * EntityTypeBadge Component Tests
 * Story 7.2: Document Management System
 * AC #26: Frontend unit tests for document components
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { EntityTypeBadge } from '../EntityTypeBadge';
import { DocumentEntityType } from '@/types/document';

describe('EntityTypeBadge', () => {
  // =================================================================
  // RENDER TESTS - All Entity Types
  // =================================================================

  describe('renders correctly for each entity type', () => {
    const entityTypes: DocumentEntityType[] = [
      DocumentEntityType.PROPERTY,
      DocumentEntityType.TENANT,
      DocumentEntityType.VENDOR,
      DocumentEntityType.ASSET,
      DocumentEntityType.GENERAL
    ];

    entityTypes.forEach((entityType) => {
      it(`should render badge for ${entityType} entity type`, () => {
        render(<EntityTypeBadge entityType={entityType} />);

        const badge = screen.getByTestId('badge-entity-type');
        expect(badge).toBeInTheDocument();
      });
    });
  });

  // =================================================================
  // ENTITY TYPE-SPECIFIC STYLING TESTS
  // =================================================================

  describe('PROPERTY entity type', () => {
    it('should render with blue styling', () => {
      render(<EntityTypeBadge entityType={DocumentEntityType.PROPERTY} />);
      const badge = screen.getByTestId('badge-entity-type');

      expect(badge).toHaveTextContent('Property');
      expect(badge).toHaveClass('bg-blue-100');
    });
  });

  describe('TENANT entity type', () => {
    it('should render with purple styling', () => {
      render(<EntityTypeBadge entityType={DocumentEntityType.TENANT} />);
      const badge = screen.getByTestId('badge-entity-type');

      expect(badge).toHaveTextContent('Tenant');
      expect(badge).toHaveClass('bg-purple-100');
    });
  });

  describe('VENDOR entity type', () => {
    it('should render with orange styling', () => {
      render(<EntityTypeBadge entityType={DocumentEntityType.VENDOR} />);
      const badge = screen.getByTestId('badge-entity-type');

      expect(badge).toHaveTextContent('Vendor');
      expect(badge).toHaveClass('bg-orange-100');
    });
  });

  describe('ASSET entity type', () => {
    it('should render with teal styling', () => {
      render(<EntityTypeBadge entityType={DocumentEntityType.ASSET} />);
      const badge = screen.getByTestId('badge-entity-type');

      expect(badge).toHaveTextContent('Asset');
      expect(badge).toHaveClass('bg-teal-100');
    });
  });

  describe('GENERAL entity type', () => {
    it('should render with gray styling', () => {
      render(<EntityTypeBadge entityType={DocumentEntityType.GENERAL} />);
      const badge = screen.getByTestId('badge-entity-type');

      expect(badge).toHaveTextContent('General');
      expect(badge).toHaveClass('bg-gray-100');
    });
  });

  // =================================================================
  // CUSTOM CLASSNAME TESTS
  // =================================================================

  describe('className prop', () => {
    it('should apply custom className', () => {
      render(
        <EntityTypeBadge
          entityType={DocumentEntityType.PROPERTY}
          className="custom-class"
        />
      );
      const badge = screen.getByTestId('badge-entity-type');

      expect(badge).toHaveClass('custom-class');
    });

    it('should preserve default classes when adding custom className', () => {
      render(
        <EntityTypeBadge
          entityType={DocumentEntityType.PROPERTY}
          className="custom-class"
        />
      );
      const badge = screen.getByTestId('badge-entity-type');

      expect(badge).toHaveClass('bg-blue-100');
      expect(badge).toHaveClass('custom-class');
    });
  });

  // =================================================================
  // ACCESSIBILITY TESTS
  // =================================================================

  describe('accessibility', () => {
    it('should have text content readable by screen readers', () => {
      render(<EntityTypeBadge entityType={DocumentEntityType.VENDOR} />);
      const badge = screen.getByTestId('badge-entity-type');

      expect(badge).toHaveTextContent('Vendor');
    });

    it('should render as span element', () => {
      render(<EntityTypeBadge entityType={DocumentEntityType.PROPERTY} />);
      const badge = screen.getByTestId('badge-entity-type');

      expect(badge.tagName.toLowerCase()).toBe('span');
    });
  });
});
