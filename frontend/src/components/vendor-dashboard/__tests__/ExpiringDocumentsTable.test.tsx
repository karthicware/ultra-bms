/**
 * Unit tests for ExpiringDocumentsTable component
 * Story 8.5: Vendor Dashboard (AC-7, AC-19)
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExpiringDocumentsTable } from '../ExpiringDocumentsTable';
import type { ExpiringDocument } from '@/types/vendor-dashboard';
import { VendorDocumentType } from '@/types/vendor-dashboard';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('ExpiringDocumentsTable', () => {
  const mockData: ExpiringDocument[] = [
    {
      documentId: '123e4567-e89b-12d3-a456-426614174000',
      vendorId: 'vendor-001',
      vendorName: 'Acme Plumbing',
      documentType: VendorDocumentType.TRADE_LICENSE,
      documentTypeName: 'Trade License',
      expiryDate: '2025-01-15',
      daysUntilExpiry: 5,
      isCritical: true,
    },
    {
      documentId: '223e4567-e89b-12d3-a456-426614174001',
      vendorId: 'vendor-002',
      vendorName: 'Best HVAC',
      documentType: VendorDocumentType.INSURANCE,
      documentTypeName: 'Insurance',
      expiryDate: '2025-01-25',
      daysUntilExpiry: 15,
      isCritical: true,
    },
    {
      documentId: '323e4567-e89b-12d3-a456-426614174002',
      vendorId: 'vendor-003',
      vendorName: 'Quick Electrical',
      documentType: VendorDocumentType.CERTIFICATION,
      documentTypeName: 'Certification',
      expiryDate: '2025-02-05',
      daysUntilExpiry: 26,
      isCritical: false,
    },
  ];

  beforeEach(() => {
    mockPush.mockClear();
  });

  describe('AC-7: Table Display', () => {
    it('should render table with correct headers', () => {
      render(<ExpiringDocumentsTable data={mockData} />);
      expect(screen.getByText('Vendor Name')).toBeInTheDocument();
      expect(screen.getByText('Document Type')).toBeInTheDocument();
      expect(screen.getByText('Expiry Date')).toBeInTheDocument();
      expect(screen.getByText('Days Until Expiry')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('should display all documents', () => {
      render(<ExpiringDocumentsTable data={mockData} />);
      expect(screen.getByText('Acme Plumbing')).toBeInTheDocument();
      expect(screen.getByText('Best HVAC')).toBeInTheDocument();
      expect(screen.getByText('Quick Electrical')).toBeInTheDocument();
    });

    it('should display document types', () => {
      render(<ExpiringDocumentsTable data={mockData} />);
      expect(screen.getByText('Trade License')).toBeInTheDocument();
      expect(screen.getByText('Insurance')).toBeInTheDocument();
      expect(screen.getByText('Certification')).toBeInTheDocument();
    });
  });

  describe('Critical Documents', () => {
    it('should show Critical badge for critical documents', () => {
      render(<ExpiringDocumentsTable data={mockData} />);
      const criticalBadges = screen.getAllByText('Critical');
      expect(criticalBadges).toHaveLength(2);
    });
  });

  describe('Urgent Highlighting (< 7 days)', () => {
    it('should highlight rows with less than 7 days', () => {
      render(<ExpiringDocumentsTable data={mockData} />);
      const urgentRow = screen.getByTestId(
        `vendor-expiring-doc-row-${mockData[0].documentId}`
      );
      expect(urgentRow).toHaveClass('bg-red-50');
    });
  });

  describe('Quick Actions', () => {
    it('should have View Vendor button', () => {
      render(<ExpiringDocumentsTable data={mockData} />);
      const viewButton = screen.getByTestId(
        `vendor-expiring-doc-view-${mockData[0].documentId}`
      );
      expect(viewButton).toBeInTheDocument();
    });

    it('should navigate to vendor on View click', () => {
      render(<ExpiringDocumentsTable data={mockData} />);
      const viewButton = screen.getByTestId(
        `vendor-expiring-doc-view-${mockData[0].documentId}`
      );
      fireEvent.click(viewButton);
      expect(mockPush).toHaveBeenCalledWith('/vendors/vendor-001');
    });

    it('should have Upload Document button', () => {
      render(<ExpiringDocumentsTable data={mockData} />);
      const uploadButton = screen.getByTestId(
        `vendor-expiring-doc-upload-${mockData[0].documentId}`
      );
      expect(uploadButton).toBeInTheDocument();
    });

    it('should navigate to upload page on Upload click', () => {
      render(<ExpiringDocumentsTable data={mockData} />);
      const uploadButton = screen.getByTestId(
        `vendor-expiring-doc-upload-${mockData[0].documentId}`
      );
      fireEvent.click(uploadButton);
      expect(mockPush).toHaveBeenCalledWith(
        '/vendors/vendor-001/documents?upload=true&type=TRADE_LICENSE'
      );
    });
  });

  describe('AC-19: Data Test IDs', () => {
    it('should have data-testid on table container', () => {
      render(<ExpiringDocumentsTable data={mockData} />);
      expect(screen.getByTestId('vendor-expiring-documents-table')).toBeInTheDocument();
    });

    it('should have data-testid on each row', () => {
      render(<ExpiringDocumentsTable data={mockData} />);
      mockData.forEach((doc) => {
        expect(
          screen.getByTestId(`vendor-expiring-doc-row-${doc.documentId}`)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should show message when no data', () => {
      render(<ExpiringDocumentsTable data={[]} />);
      expect(screen.getByText('No documents expiring soon')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show skeleton when loading', () => {
      render(<ExpiringDocumentsTable data={undefined} isLoading={true} />);
      expect(screen.getByText('Expiring Documents')).toBeInTheDocument();
    });
  });
});
