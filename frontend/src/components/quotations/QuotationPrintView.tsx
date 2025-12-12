'use client';

/**
 * Quotation Print View Component
 * SCP-2025-12-11: Professional A4 single-page print layout
 *
 * Design: Corporate invoice aesthetic optimized for B&W printing
 * - Precise A4 dimensions with optimal margins
 * - Clear visual hierarchy with proper spacing
 * - No color dependencies - pure black & white
 * - Single page layout with careful content flow
 */

import { forwardRef } from 'react';
import { format } from 'date-fns';
import type { Quotation } from '@/types/quotations';
import { FirstMonthPaymentMethod } from '@/types/quotations';

interface QuotationPrintViewProps {
  quotation: Quotation;
  className?: string;
}

const formatCurrency = (amount: number | undefined | null) => {
  if (amount === undefined || amount === null) return 'AED 0';
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const QuotationPrintView = forwardRef<HTMLDivElement, QuotationPrintViewProps>(
  ({ quotation, className }, ref) => {
    const issueDate = new Date(quotation.issueDate);
    const validityDate = new Date(quotation.validityDate);

    // Financial calculations
    const yearlyRent = quotation.yearlyRentAmount || 0;
    const numberOfCheques = quotation.numberOfCheques || 1;
    const firstMonthRent = yearlyRent > 0 && numberOfCheques > 0 ? Math.round(yearlyRent / numberOfCheques) : 0;
    const totalFirstPayment = quotation.firstMonthTotal && quotation.firstMonthTotal > 0
      ? quotation.firstMonthTotal
      : quotation.totalFirstPayment || (firstMonthRent + (quotation.serviceCharges || 0) + (quotation.parkingFee || 0) + (quotation.securityDeposit || 0) + (quotation.adminFee || 0));

    // Calculate one-time fees
    const oneTimeFees = (quotation.serviceCharges || 0) + (quotation.securityDeposit || 0) + (quotation.adminFee || 0);

    return (
      <div
        ref={ref}
        className={className}
        style={{
          width: '210mm',
          minHeight: '297mm',
          maxHeight: '297mm',
          padding: '15mm 20mm',
          backgroundColor: '#fff',
          color: '#000',
          fontFamily: "'Georgia', 'Times New Roman', serif",
          fontSize: '10pt',
          lineHeight: '1.4',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        {/* Header with Company Branding Area */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '8mm',
          paddingBottom: '5mm',
          borderBottom: '2px solid #000',
        }}>
          {/* Company Info Placeholder */}
          <div>
            <div style={{
              fontSize: '18pt',
              fontWeight: 'bold',
              letterSpacing: '-0.5px',
              marginBottom: '2mm',
            }}>
              ULTRA BMS
            </div>
            <div style={{ fontSize: '8pt', color: '#444', lineHeight: '1.5' }}>
              Property Management Services<br />
              Dubai, United Arab Emirates
            </div>
          </div>

          {/* Document Title */}
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontSize: '22pt',
              fontWeight: 'bold',
              letterSpacing: '2px',
              marginBottom: '2mm',
            }}>
              QUOTATION
            </div>
            <div style={{
              fontSize: '11pt',
              fontWeight: 'bold',
              fontFamily: "'Courier New', monospace",
            }}>
              {quotation.quotationNumber}
            </div>
          </div>
        </div>

        {/* Two Column Layout: Client Info & Document Info */}
        <div style={{
          display: 'flex',
          gap: '15mm',
          marginBottom: '6mm',
        }}>
          {/* Client Information */}
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '7pt',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: '#666',
              marginBottom: '2mm',
            }}>
              Prepared For
            </div>
            {/* SCP-2025-12-12: Prefer fullName from OCR over leadName */}
            <div style={{ fontSize: '12pt', fontWeight: 'bold', marginBottom: '1mm' }}>
              {quotation.fullName || quotation.leadName}
            </div>
            {quotation.leadEmail && (
              <div style={{ fontSize: '9pt', color: '#444' }}>{quotation.leadEmail}</div>
            )}
            {quotation.leadContactNumber && (
              <div style={{ fontSize: '9pt', color: '#444' }}>{quotation.leadContactNumber}</div>
            )}
            {quotation.nationality && (
              <div style={{ fontSize: '9pt', color: '#444' }}>Nationality: {quotation.nationality}</div>
            )}
            {/* SCP-2025-12-12: Date of Birth from Emirates ID OCR */}
            {quotation.dateOfBirth && (
              <div style={{ fontSize: '9pt', color: '#444' }}>DOB: {format(new Date(quotation.dateOfBirth), 'dd MMM yyyy')}</div>
            )}
          </div>

          {/* Document Details */}
          <div style={{ width: '55mm', textAlign: 'right' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '1mm 0', color: '#666' }}>Issue Date:</td>
                  <td style={{ padding: '1mm 0', fontWeight: 'bold', textAlign: 'right' }}>
                    {format(issueDate, 'dd MMM yyyy')}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '1mm 0', color: '#666' }}>Valid Until:</td>
                  <td style={{ padding: '1mm 0', fontWeight: 'bold', textAlign: 'right' }}>
                    {format(validityDate, 'dd MMM yyyy')}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '1mm 0', color: '#666' }}>Status:</td>
                  <td style={{ padding: '1mm 0', fontWeight: 'bold', textAlign: 'right', textTransform: 'uppercase' }}>
                    {quotation.status}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Property Details Box */}
        <div style={{
          border: '1px solid #000',
          padding: '4mm',
          marginBottom: '5mm',
          backgroundColor: '#f8f8f8',
        }}>
          <div style={{
            fontSize: '7pt',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            color: '#666',
            marginBottom: '2mm',
          }}>
            Property Details
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '11pt', fontWeight: 'bold' }}>{quotation.propertyName}</div>
              <div style={{ fontSize: '9pt', color: '#444' }}>
                Unit: {quotation.unitNumber}
                {quotation.parkingSpotNumber && ` | Parking: ${quotation.parkingSpotNumber}`}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '9pt', color: '#666' }}>Annual Rent</div>
              <div style={{ fontSize: '14pt', fontWeight: 'bold' }}>{formatCurrency(yearlyRent)}</div>
            </div>
          </div>
        </div>

        {/* Financial Summary Table */}
        <div style={{ marginBottom: '5mm' }}>
          <div style={{
            fontSize: '7pt',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            color: '#666',
            marginBottom: '2mm',
          }}>
            First Payment Breakdown
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '2mm 0' }}>First Month Rent ({quotation.firstMonthPaymentMethod === FirstMonthPaymentMethod.CASH ? 'Cash' : 'Cheque'})</td>
                <td style={{ padding: '2mm 0', textAlign: 'right', fontFamily: "'Courier New', monospace" }}>
                  {formatCurrency(firstMonthRent)}
                </td>
              </tr>
              {(quotation.serviceCharges ?? 0) > 0 && (
                <tr style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '2mm 0' }}>Service Charges</td>
                  <td style={{ padding: '2mm 0', textAlign: 'right', fontFamily: "'Courier New', monospace" }}>
                    {formatCurrency(quotation.serviceCharges)}
                  </td>
                </tr>
              )}
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '2mm 0' }}>Security Deposit (Refundable)</td>
                <td style={{ padding: '2mm 0', textAlign: 'right', fontFamily: "'Courier New', monospace" }}>
                  {formatCurrency(quotation.securityDeposit)}
                </td>
              </tr>
              {(quotation.adminFee ?? 0) > 0 && (
                <tr style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '2mm 0' }}>Admin Fee</td>
                  <td style={{ padding: '2mm 0', textAlign: 'right', fontFamily: "'Courier New', monospace" }}>
                    {formatCurrency(quotation.adminFee)}
                  </td>
                </tr>
              )}
              {(quotation.parkingFee ?? 0) > 0 && (
                <tr style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '2mm 0' }}>Parking Fee (Annual)</td>
                  <td style={{ padding: '2mm 0', textAlign: 'right', fontFamily: "'Courier New', monospace" }}>
                    {formatCurrency(quotation.parkingFee)}
                  </td>
                </tr>
              )}
              <tr style={{ backgroundColor: '#000', color: '#fff' }}>
                <td style={{ padding: '3mm 2mm', fontWeight: 'bold', fontSize: '10pt' }}>
                  TOTAL FIRST PAYMENT
                </td>
                <td style={{ padding: '3mm 2mm', textAlign: 'right', fontWeight: 'bold', fontSize: '12pt', fontFamily: "'Courier New', monospace" }}>
                  {formatCurrency(totalFirstPayment)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Payment Schedule */}
        {quotation.chequeBreakdown && quotation.chequeBreakdown.length > 0 && (
          <div style={{ marginBottom: '5mm' }}>
            <div style={{
              fontSize: '7pt',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: '#666',
              marginBottom: '2mm',
            }}>
              Payment Schedule ({numberOfCheques} {numberOfCheques === 1 ? 'Payment' : 'Payments'})
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8pt', border: '1px solid #000' }}>
              <thead>
                <tr style={{ backgroundColor: '#e5e5e5' }}>
                  <th style={{ padding: '2mm', textAlign: 'left', borderBottom: '1px solid #000', width: '15%' }}>#</th>
                  <th style={{ padding: '2mm', textAlign: 'left', borderBottom: '1px solid #000', width: '35%' }}>Due Date</th>
                  <th style={{ padding: '2mm', textAlign: 'center', borderBottom: '1px solid #000', width: '25%' }}>Method</th>
                  <th style={{ padding: '2mm', textAlign: 'right', borderBottom: '1px solid #000', width: '25%' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {quotation.chequeBreakdown.map((item, index) => (
                  <tr key={item.chequeNumber} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f5f5f5' }}>
                    <td style={{ padding: '1.5mm 2mm', borderBottom: '1px solid #ddd' }}>{item.chequeNumber}</td>
                    <td style={{ padding: '1.5mm 2mm', borderBottom: '1px solid #ddd' }}>
                      {item.dueDate ? format(new Date(item.dueDate), 'dd MMM yyyy') : '-'}
                    </td>
                    <td style={{ padding: '1.5mm 2mm', borderBottom: '1px solid #ddd', textAlign: 'center' }}>
                      {index === 0 && quotation.firstMonthPaymentMethod === FirstMonthPaymentMethod.CASH ? 'CASH' : 'CHEQUE'}
                    </td>
                    <td style={{ padding: '1.5mm 2mm', borderBottom: '1px solid #ddd', textAlign: 'right', fontFamily: "'Courier New', monospace" }}>
                      {index === 0 ? formatCurrency(totalFirstPayment) : formatCurrency(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Identity Documents (if available) */}
        {(quotation.emiratesIdNumber || quotation.passportNumber) && (
          <div style={{ marginBottom: '5mm' }}>
            <div style={{
              fontSize: '7pt',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: '#666',
              marginBottom: '2mm',
            }}>
              Identity Documents
            </div>
            <div style={{ display: 'flex', gap: '10mm', fontSize: '8pt' }}>
              {quotation.emiratesIdNumber && (
                <div>
                  <span style={{ color: '#666' }}>Emirates ID: </span>
                  <span style={{ fontWeight: 'bold' }}>{quotation.emiratesIdNumber}</span>
                  {quotation.emiratesIdExpiry && (
                    <span style={{ color: '#666' }}> (Exp: {format(new Date(quotation.emiratesIdExpiry), 'MMM yyyy')})</span>
                  )}
                </div>
              )}
              {quotation.passportNumber && (
                <div>
                  <span style={{ color: '#666' }}>Passport: </span>
                  <span style={{ fontWeight: 'bold' }}>{quotation.passportNumber}</span>
                  {quotation.passportExpiry && (
                    <span style={{ color: '#666' }}> (Exp: {format(new Date(quotation.passportExpiry), 'MMM yyyy')})</span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Terms & Conditions - Compact */}
        <div style={{
          border: '1px solid #999',
          padding: '3mm',
          marginBottom: '5mm',
          fontSize: '7pt',
          color: '#444',
          lineHeight: '1.5',
        }}>
          <div style={{
            fontSize: '7pt',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            color: '#666',
            marginBottom: '1.5mm',
          }}>
            Terms & Conditions
          </div>
          <div style={{ display: 'flex', gap: '5mm' }}>
            <div style={{ flex: 1 }}>
              • Payment due by the 5th of each month<br />
              • Security deposit refundable upon lease end<br />
              • Subject to property inspection
            </div>
            <div style={{ flex: 1 }}>
              • This quotation is valid for 7 days<br />
              • All amounts in AED<br />
              • Prices subject to VAT where applicable
            </div>
          </div>
        </div>

        {/* Signature Area */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '8mm',
          paddingTop: '5mm',
        }}>
          <div style={{ width: '45%' }}>
            <div style={{ borderTop: '1px solid #000', paddingTop: '2mm', fontSize: '8pt' }}>
              <div style={{ fontWeight: 'bold' }}>Authorized Signature</div>
              <div style={{ color: '#666', fontSize: '7pt' }}>For Ultra BMS</div>
            </div>
          </div>
          <div style={{ width: '45%' }}>
            <div style={{ borderTop: '1px solid #000', paddingTop: '2mm', fontSize: '8pt' }}>
              <div style={{ fontWeight: 'bold' }}>Client Acceptance</div>
              <div style={{ color: '#666', fontSize: '7pt' }}>Date: ________________</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          position: 'absolute',
          bottom: '15mm',
          left: '20mm',
          right: '20mm',
          borderTop: '1px solid #ddd',
          paddingTop: '2mm',
          fontSize: '7pt',
          color: '#888',
          display: 'flex',
          justifyContent: 'space-between',
        }}>
          <span>Generated on {format(new Date(), 'dd MMM yyyy, HH:mm')}</span>
          <span>Page 1 of 1</span>
        </div>

        {/* Print-specific inline styles */}
        <style>{`
          @media print {
            @page {
              size: A4 portrait;
              margin: 15mm 12mm;
            }
            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        `}</style>
      </div>
    );
  }
);

QuotationPrintView.displayName = 'QuotationPrintView';

export default QuotationPrintView;
