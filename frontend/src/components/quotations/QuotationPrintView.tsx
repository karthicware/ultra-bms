'use client';

/**
 * Quotation Print View Component
 * SCP-2025-12-06: Clean, A4 printable quotation layout
 *
 * Features:
 * - A4 portrait layout optimized for printing
 * - Clean editorial / invoice style
 * - Header/footer placeholders for future customization
 * - Complete financial breakdown
 * - Cheque schedule table
 * - Print-specific CSS with @media print
 */

import { forwardRef } from 'react';
import { format } from 'date-fns';
import { Building2, Phone, Mail, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Quotation } from '@/types/quotations';
import { formatChequeDueDate } from '@/lib/validations/quotations';

interface QuotationPrintViewProps {
  quotation: Quotation;
  leadEmail?: string;
  leadPhone?: string;
  className?: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const QuotationPrintView = forwardRef<HTMLDivElement, QuotationPrintViewProps>(
  ({ quotation, leadEmail, leadPhone, className }, ref) => {
    const issueDate = new Date(quotation.issueDate);
    const validityDate = new Date(quotation.validityDate);

    return (
      <div
        ref={ref}
        className={cn(
          // A4 dimensions: 210mm x 297mm
          'bg-white text-black w-[210mm] min-h-[297mm] mx-auto p-8',
          // Print-specific styles
          'print:shadow-none print:m-0 print:p-6',
          className
        )}
      >
        {/* Header Placeholder */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 mb-8 text-center print:border-gray-400">
          <p className="text-sm text-gray-400 uppercase tracking-wider font-medium">
            Header Placeholder
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Company Logo & Address • Configure in Settings
          </p>
        </div>

        {/* Title & Quotation Number */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              QUOTATION
            </h1>
            <div className="h-1 w-20 bg-gray-900 mt-2" />
          </div>
          <div className="text-right">
            <p className="text-xl font-semibold text-gray-900">
              {quotation.quotationNumber}
            </p>
          </div>
        </div>

        {/* Customer & Date Info */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">
              Prepared For
            </p>
            <p className="font-semibold text-lg text-gray-900">
              {quotation.leadName}
            </p>
            {leadEmail && (
              <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                <Mail className="h-3 w-3" />
                {leadEmail}
              </p>
            )}
            {leadPhone && (
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <Phone className="h-3 w-3" />
                {leadPhone}
              </p>
            )}
          </div>
          <div className="text-right">
            <div className="inline-block text-left">
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">
                Quotation Details
              </p>
              <p className="text-sm">
                <span className="text-gray-500">Issue Date:</span>{' '}
                <span className="font-medium">{format(issueDate, 'dd MMM yyyy')}</span>
              </p>
              <p className="text-sm">
                <span className="text-gray-500">Valid Until:</span>{' '}
                <span className="font-medium text-orange-600">
                  {format(validityDate, 'dd MMM yyyy')}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Separator */}
        <div className="border-t border-gray-200 my-6" />

        {/* Property Details */}
        <div className="mb-8">
          <h2 className="text-sm uppercase tracking-wider text-gray-500 font-medium mb-3">
            Property Details
          </h2>
          <div className="bg-gray-50 rounded-lg p-4 flex items-start gap-4 print:bg-gray-100">
            <div className="flex-shrink-0 w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
              <Building2 className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{quotation.propertyName}</p>
              <p className="text-sm text-gray-600">
                Unit {quotation.unitNumber}
                {quotation.parkingSpotNumber && ` • Parking: ${quotation.parkingSpotNumber}`}
              </p>
            </div>
          </div>
        </div>

        {/* Financial Breakdown */}
        <div className="mb-8">
          <h2 className="text-sm uppercase tracking-wider text-gray-500 font-medium mb-3">
            Financial Breakdown
          </h2>
          <table className="w-full border-collapse">
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-3 text-gray-600">Monthly Rent</td>
                <td className="py-3 text-right font-medium tabular-nums">
                  {formatCurrency(quotation.baseRent)}
                </td>
              </tr>
              {quotation.serviceCharges > 0 && (
                <tr className="border-b border-gray-100">
                  <td className="py-3 text-gray-600">Service Charges</td>
                  <td className="py-3 text-right font-medium tabular-nums">
                    {formatCurrency(quotation.serviceCharges)}
                  </td>
                </tr>
              )}
              {quotation.parkingFee && quotation.parkingFee > 0 && (
                <tr className="border-b border-gray-100">
                  <td className="py-3 text-gray-600">Parking Fee</td>
                  <td className="py-3 text-right font-medium tabular-nums">
                    {formatCurrency(quotation.parkingFee)}
                  </td>
                </tr>
              )}
              <tr className="border-b border-gray-200">
                <td className="py-3 text-gray-600">Security Deposit</td>
                <td className="py-3 text-right font-medium tabular-nums">
                  {formatCurrency(quotation.securityDeposit)}
                </td>
              </tr>
              {quotation.adminFee > 0 && (
                <tr className="border-b border-gray-200">
                  <td className="py-3 text-gray-600">Admin Fee</td>
                  <td className="py-3 text-right font-medium tabular-nums">
                    {formatCurrency(quotation.adminFee)}
                  </td>
                </tr>
              )}
              <tr className="bg-gray-900 text-white print:bg-gray-800">
                <td className="py-4 px-4 font-semibold">Total First Payment</td>
                <td className="py-4 px-4 text-right font-bold text-lg tabular-nums">
                  {formatCurrency(quotation.totalFirstPayment)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Cheque Schedule */}
        {quotation.chequeBreakdown && quotation.chequeBreakdown.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm uppercase tracking-wider text-gray-500 font-medium mb-3">
              Cheque Schedule ({quotation.numberOfCheques} cheques)
            </h2>
            <table className="w-full border-collapse border border-gray-200 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-gray-100 print:bg-gray-200">
                  <th className="py-2 px-4 text-left text-xs uppercase tracking-wider text-gray-600 font-medium">
                    #
                  </th>
                  <th className="py-2 px-4 text-left text-xs uppercase tracking-wider text-gray-600 font-medium">
                    Due Date
                  </th>
                  <th className="py-2 px-4 text-right text-xs uppercase tracking-wider text-gray-600 font-medium">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {quotation.chequeBreakdown.map((cheque, index) => (
                  <tr
                    key={cheque.chequeNumber}
                    className={cn(
                      'border-t border-gray-100',
                      index % 2 === 1 && 'bg-gray-50 print:bg-gray-100'
                    )}
                  >
                    <td className="py-2 px-4 text-sm">
                      {cheque.chequeNumber}
                      {index === 0 && quotation.firstMonthPaymentMethod === 'CASH' && (
                        <span className="ml-2 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                          Cash
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-4 text-sm text-gray-600">
                      {formatChequeDueDate(cheque.dueDate)}
                    </td>
                    <td className="py-2 px-4 text-sm text-right font-medium tabular-nums">
                      {formatCurrency(cheque.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 border-t border-gray-200 print:bg-gray-200">
                  <td colSpan={2} className="py-2 px-4 text-sm font-semibold">
                    Total
                  </td>
                  <td className="py-2 px-4 text-sm text-right font-bold tabular-nums">
                    {formatCurrency(quotation.yearlyRentAmount || 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Terms & Conditions */}
        <div className="mb-8 print:break-inside-avoid">
          <h2 className="text-sm uppercase tracking-wider text-gray-500 font-medium mb-3">
            Terms & Conditions
          </h2>
          <div className="text-xs text-gray-600 space-y-1 bg-gray-50 p-4 rounded-lg print:bg-gray-100">
            <p>• Payment due before 5th of each month</p>
            <p>• Security deposit refundable upon lease end, subject to property inspection</p>
            <p>• Valid for 7 days from issue date</p>
            {quotation.paymentTerms && (
              <p className="pt-2 whitespace-pre-wrap">{quotation.paymentTerms.slice(0, 500)}</p>
            )}
          </div>
        </div>

        {/* Footer Placeholder */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 mt-auto text-center print:border-gray-400">
          <p className="text-sm text-gray-400 uppercase tracking-wider font-medium">
            Footer Placeholder
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Contact Information & Legal • Configure in Settings
          </p>
        </div>

        {/* Print Styles */}
        <style jsx global>{`
          @media print {
            @page {
              size: A4;
              margin: 10mm;
            }

            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            /* Hide navigation and other non-print elements */
            nav,
            header,
            footer,
            .no-print,
            button,
            [role='navigation'] {
              display: none !important;
            }

            /* Ensure backgrounds print */
            .bg-gray-900,
            .bg-gray-100,
            .bg-gray-50 {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            /* Page break control */
            .print\\:break-inside-avoid {
              break-inside: avoid;
            }

            /* Reset margins for print */
            .print\\:m-0 {
              margin: 0 !important;
            }
          }
        `}</style>
      </div>
    );
  }
);

QuotationPrintView.displayName = 'QuotationPrintView';

export default QuotationPrintView;
