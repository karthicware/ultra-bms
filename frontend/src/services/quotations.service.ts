/**
 * Quotation Management API Service
 * All quotation management-related API calls including creation, sending, acceptance, and tenant conversion
 */

import { apiClient } from '@/lib/api';
import type {
  Quotation,
  CreateQuotationRequest,
  UpdateQuotationRequest,
  QuotationSearchParams,
  QuotationResponse,
  QuotationListResponse,
  QuotationDashboard,
  QuotationDashboardResponse,
  RejectQuotationRequest,
  LeadConversionResponse,
  LeadConversionAPIResponse,
} from '@/types';

const QUOTATIONS_BASE_PATH = '/v1/quotations';

/**
 * Create a new quotation for a lead
 *
 * Creates a quotation in DRAFT status with automatically calculated total first payment.
 * Total = securityDeposit + adminFee + baseRent + serviceCharges + (parkingSpots × parkingFee)
 *
 * @param data - Quotation creation data
 * @param data.leadId - UUID of the lead (must exist)
 * @param data.propertyId - UUID of the property (must exist)
 * @param data.unitId - UUID of the unit (must be AVAILABLE)
 * @param data.stayType - Type of accommodation (STUDIO, ONE_BHK, TWO_BHK, THREE_BHK, PENTHOUSE)
 * @param data.issueDate - Date when quotation is issued
 * @param data.validityDate - Expiry date (must be after issueDate and in future)
 * @param data.baseRent - Monthly rent amount (must be > 0)
 * @param data.serviceCharges - Monthly service charges (must be >= 0)
 * @param data.parkingSpots - Number of parking spots (must be >= 0)
 * @param data.parkingFee - Fee per parking spot per month (must be >= 0)
 * @param data.securityDeposit - Security deposit amount (must be >= 0)
 * @param data.adminFee - One-time admin fee (must be >= 0)
 * @param data.paymentTerms - Payment terms and conditions
 * @param data.moveinProcedures - Move-in procedures
 * @param data.cancellationPolicy - Cancellation policy
 *
 * @returns Promise that resolves to the created Quotation with auto-generated quotationNumber
 *
 * @throws {NotFoundException} When lead, property, or unit is not found (404)
 * @throws {ValidationException} When validation fails (400)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 *
 * @example
 * ```typescript
 * const quotation = await createQuotation({
 *   leadId: 'lead-123',
 *   propertyId: 'prop-123',
 *   unitId: 'unit-123',
 *   stayType: 'TWO_BHK',
 *   issueDate: new Date('2025-11-15'),
 *   validityDate: new Date('2025-12-15'),
 *   baseRent: 5000,
 *   serviceCharges: 500,
 *   parkingSpots: 1,
 *   parkingFee: 200,
 *   securityDeposit: 5000,
 *   adminFee: 1000,
 *   paymentTerms: 'Payment due on 1st',
 *   moveinProcedures: 'Complete inspection',
 *   cancellationPolicy: '30 days notice'
 * });
 * console.log(quotation.quotationNumber); // "QUOT-20251115-0001"
 * console.log(quotation.totalFirstPayment); // 11700
 * ```
 */
export async function createQuotation(data: CreateQuotationRequest): Promise<Quotation> {
  const response = await apiClient.post<QuotationResponse>(QUOTATIONS_BASE_PATH, data);
  return response.data.data;
}

/**
 * Get paginated list of quotations with filters
 *
 * @param params - Search and filter parameters
 * @param params.page - Page number (default: 0)
 * @param params.size - Page size (default: 20)
 * @param params.sort - Sort field
 * @param params.direction - Sort direction (ASC or DESC)
 * @param params.status - Array of quotation statuses to filter by
 * @param params.propertyId - Filter by property UUID
 * @param params.leadId - Filter by lead UUID
 * @param params.dateFrom - Filter quotations created after this date
 * @param params.dateTo - Filter quotations created before this date
 *
 * @returns Promise that resolves to paginated quotation list with metadata
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 *
 * @example
 * ```typescript
 * // Get all SENT quotations
 * const quotations = await getQuotations({
 *   status: ['SENT'],
 *   page: 0,
 *   size: 20
 * });
 *
 * // Get quotations for a specific lead
 * const leadQuotations = await getQuotations({
 *   leadId: 'lead-123'
 * });
 * ```
 */
export async function getQuotations(
  params: QuotationSearchParams = {}
): Promise<QuotationListResponse> {
  const response = await apiClient.get<QuotationListResponse>(QUOTATIONS_BASE_PATH, {
    params: {
      page: params.page || 0,
      size: params.size || 20,
      sort: params.sort,
      direction: params.direction,
      status: params.status?.join(','),
      propertyId: params.propertyId,
      leadId: params.leadId,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
    },
  });
  return response.data;
}

/**
 * Get a single quotation by ID
 *
 * @param id - Quotation UUID
 * @returns Promise that resolves to the Quotation object
 *
 * @throws {NotFoundException} When quotation is not found (404)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 *
 * @example
 * ```typescript
 * const quotation = await getQuotationById('quot-123');
 * console.log(quotation.status); // "SENT"
 * console.log(quotation.totalFirstPayment); // 11700
 * ```
 */
export async function getQuotationById(id: string): Promise<Quotation> {
  const response = await apiClient.get<QuotationResponse>(`${QUOTATIONS_BASE_PATH}/${id}`);
  return response.data.data;
}

/**
 * Update an existing quotation
 *
 * Only DRAFT quotations can be updated. All fields are optional.
 * If financial fields are updated, totalFirstPayment is recalculated automatically.
 *
 * @param id - Quotation UUID
 * @param data - Fields to update
 *
 * @returns Promise that resolves to the updated Quotation object
 *
 * @throws {NotFoundException} When quotation is not found (404)
 * @throws {ValidationException} When quotation is not DRAFT or validation fails (400)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 *
 * @example
 * ```typescript
 * const updated = await updateQuotation('quot-123', {
 *   baseRent: 6000,
 *   parkingSpots: 2
 * });
 * console.log(updated.totalFirstPayment); // Recalculated: 12700
 * ```
 */
export async function updateQuotation(
  id: string,
  data: UpdateQuotationRequest
): Promise<Quotation> {
  const response = await apiClient.put<QuotationResponse>(`${QUOTATIONS_BASE_PATH}/${id}`, data);
  return response.data.data;
}

/**
 * Send quotation via email to the lead
 *
 * Sends quotation email with PDF attachment. Changes quotation status from DRAFT to SENT
 * and lead status to QUOTATION_SENT.
 *
 * @param id - Quotation UUID
 * @returns Promise that resolves when quotation is sent
 *
 * @throws {NotFoundException} When quotation is not found (404)
 * @throws {ValidationException} When quotation is not DRAFT (400)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 *
 * @example
 * ```typescript
 * await sendQuotation('quot-123');
 * // Email sent to lead with PDF attachment
 * // Quotation status: DRAFT → SENT
 * // Lead status: CONTACTED → QUOTATION_SENT
 * ```
 */
export async function sendQuotation(id: string): Promise<Quotation> {
  const response = await apiClient.post<QuotationResponse>(`${QUOTATIONS_BASE_PATH}/${id}/send`);
  return response.data.data;
}

/**
 * Accept a quotation
 *
 * Changes quotation status to ACCEPTED and lead status to ACCEPTED.
 * Admin notification email is sent. "Convert to Tenant" becomes available.
 *
 * @param id - Quotation UUID
 * @returns Promise that resolves to the accepted Quotation
 *
 * @throws {NotFoundException} When quotation is not found (404)
 * @throws {ValidationException} When quotation cannot be accepted (400)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 *
 * @example
 * ```typescript
 * const accepted = await acceptQuotation('quot-123');
 * console.log(accepted.status); // "ACCEPTED"
 * // Admin notification email is sent
 * // Lead can now be converted to tenant
 * ```
 */
export async function acceptQuotation(id: string): Promise<Quotation> {
  const response = await apiClient.patch<QuotationResponse>(
    `${QUOTATIONS_BASE_PATH}/${id}/status`,
    { status: 'ACCEPTED' }
  );
  return response.data.data;
}

/**
 * Reject a quotation with reason
 *
 * Changes quotation status to REJECTED and lead status to LOST.
 * Rejection reason is stored for future reference.
 *
 * @param id - Quotation UUID
 * @param reason - Reason for rejection (e.g., "Rent is too high", "Found better option")
 * @returns Promise that resolves to the rejected Quotation
 *
 * @throws {NotFoundException} When quotation is not found (404)
 * @throws {ValidationException} When quotation cannot be rejected (400)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 *
 * @example
 * ```typescript
 * const rejected = await rejectQuotation('quot-123', 'Rent is too high for current budget');
 * console.log(rejected.status); // "REJECTED"
 * console.log(rejected.rejectionReason); // "Rent is too high for current budget"
 * ```
 */
export async function rejectQuotation(id: string, reason: string): Promise<Quotation> {
  const response = await apiClient.patch<QuotationResponse>(
    `${QUOTATIONS_BASE_PATH}/${id}/status`,
    { status: 'REJECTED', rejectionReason: reason }
  );
  return response.data.data;
}

/**
 * Generate quotation PDF
 *
 * Generates a professional PDF with quotation details. Used internally by
 * downloadQuotationPDF for user downloads, or can be used programmatically.
 *
 * @param id - Quotation UUID
 * @returns Promise that resolves to the PDF file as a Blob
 *
 * @throws {NotFoundException} When quotation is not found (404)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 *
 * @example
 * ```typescript
 * const pdfBlob = await generateQuotationPdf('quot-123');
 * // Use blob for custom handling
 * ```
 */
export async function generateQuotationPdf(id: string): Promise<Blob> {
  const response = await apiClient.get<Blob>(`${QUOTATIONS_BASE_PATH}/${id}/pdf`, {
    responseType: 'blob',
  });
  return response.data;
}

/**
 * Download quotation PDF with proper filename
 *
 * Triggers browser download of quotation PDF with formatted filename.
 * Creates temporary anchor element to trigger download, then cleans up.
 *
 * @param id - Quotation UUID
 * @param quotationNumber - Quotation number for filename (e.g., "QUOT-20251115-0001")
 * @returns Promise that resolves when download is triggered
 *
 * @throws {NotFoundException} When quotation is not found (404)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 *
 * @example
 * ```typescript
 * await downloadQuotationPDF('quot-123', 'QUOT-20251115-0001');
 * // Downloads: Quotation-QUOT-20251115-0001.pdf
 * ```
 */
export async function downloadQuotationPDF(
  id: string,
  quotationNumber: string
): Promise<void> {
  const blob = await generateQuotationPdf(id);

  // Create blob URL and trigger download
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Quotation-${quotationNumber}.pdf`;
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Convert lead to tenant (initiate tenant onboarding)
 *
 * Converts an accepted quotation to a tenant. This is the final step in the lead-to-tenant journey.
 *
 * Pre-conditions:
 * - Quotation status must be ACCEPTED
 * - Lead must not already be converted
 * - Unit must be AVAILABLE
 *
 * What happens:
 * - Quotation status changes to CONVERTED
 * - Lead status changes to CONVERTED
 * - Unit status changes to RESERVED
 * - Returns pre-populated data for tenant onboarding (Story 3.2)
 *
 * @param quotationId - Quotation UUID
 * @returns Promise that resolves to conversion response with tenant onboarding data
 *
 * @throws {NotFoundException} When quotation is not found (404)
 * @throws {ValidationException} When quotation is not ACCEPTED, lead already converted, or unit not available (400)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 *
 * @example
 * ```typescript
 * const conversion = await convertToTenant('quot-123');
 * console.log(conversion.message); // "Lead LEAD-20251115-0001 successfully converted to tenant"
 * console.log(conversion.leadId); // "lead-123"
 * console.log(conversion.totalFirstPayment); // 11700
 *
 * // Use conversion data for tenant onboarding
 * // router.push(`/tenants/onboard?conversionId=${conversion.leadId}`);
 * ```
 */
export async function convertToTenant(quotationId: string): Promise<LeadConversionResponse> {
  const response = await apiClient.post<LeadConversionAPIResponse>(
    `${QUOTATIONS_BASE_PATH}/${quotationId}/convert`
  );
  return response.data.data;
}

/**
 * Get quotation dashboard metrics
 *
 * Returns KPIs and statistics for quotation management dashboard including:
 * - New leads count (NEW or CONTACTED status)
 * - Active quotes count (SENT or ACCEPTED status)
 * - Quotes expiring soon count (within 7 days)
 * - New quotes count (created in last 30 days)
 * - Quotes converted count (CONVERTED status)
 * - Conversion rate percentage
 *
 * @returns Promise that resolves to dashboard metrics
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 *
 * @example
 * ```typescript
 * const dashboard = await getQuotationDashboard();
 * console.log(dashboard.newLeads); // 15
 * console.log(dashboard.activeQuotes); // 8
 * console.log(dashboard.quotesExpiringSoon); // 3
 * console.log(dashboard.conversionRate); // 41.67
 * ```
 */
export async function getQuotationDashboard(): Promise<QuotationDashboard> {
  const response = await apiClient.get<QuotationDashboardResponse>(
    `${QUOTATIONS_BASE_PATH}/dashboard`
  );
  return response.data.data;
}

/**
 * Get all quotations for a specific lead
 *
 * Retrieves all quotations associated with a lead, sorted by creation date (most recent first).
 *
 * @param leadId - Lead UUID
 * @returns Promise that resolves to array of quotations for the lead
 *
 * @throws {NotFoundException} When lead is not found (404)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 *
 * @example
 * ```typescript
 * const quotations = await getQuotationsByLeadId('lead-123');
 * quotations.forEach(q => {
 *   console.log(`${q.quotationNumber}: ${q.status}`);
 * });
 * // Output:
 * // QUOT-20251115-0002: ACCEPTED
 * // QUOT-20251115-0001: REJECTED
 * ```
 */
export async function getQuotationsByLeadId(leadId: string): Promise<Quotation[]> {
  const response = await apiClient.get<QuotationListResponse>(QUOTATIONS_BASE_PATH, {
    params: {
      leadId,
      size: 100, // Get all quotations for this lead
    },
  });
  return response.data.data.content;
}

/**
 * Delete a quotation
 *
 * Only DRAFT quotations can be deleted. Sent, accepted, or converted quotations
 * cannot be deleted to maintain audit trail.
 *
 * @param id - Quotation UUID
 * @returns Promise that resolves when deletion is complete
 *
 * @throws {NotFoundException} When quotation is not found (404)
 * @throws {ValidationException} When quotation is not DRAFT (400)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 *
 * @example
 * ```typescript
 * await deleteQuotation('quot-123');
 * console.log('DRAFT quotation deleted successfully');
 * ```
 */
export async function deleteQuotation(id: string): Promise<void> {
  await apiClient.delete(`${QUOTATIONS_BASE_PATH}/${id}`);
}
