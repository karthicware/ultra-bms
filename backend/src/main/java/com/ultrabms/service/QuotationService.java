package com.ultrabms.service;

import com.ultrabms.dto.leads.LeadConversionResponse;
import com.ultrabms.dto.quotations.CreateQuotationRequest;
import com.ultrabms.dto.quotations.QuotationDashboardResponse;
import com.ultrabms.dto.quotations.QuotationResponse;
import com.ultrabms.dto.quotations.QuotationStatusUpdateRequest;
import com.ultrabms.dto.quotations.UpdateQuotationRequest;
import com.ultrabms.entity.Quotation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

/**
 * Service interface for Quotation management
 */
public interface QuotationService {

    /**
     * Create a new quotation
     */
    QuotationResponse createQuotation(CreateQuotationRequest request, UUID createdBy);

    /**
     * Get quotation by ID
     */
    QuotationResponse getQuotationById(UUID id);

    /**
     * Update existing quotation
     */
    QuotationResponse updateQuotation(UUID id, UpdateQuotationRequest request);

    /**
     * Search quotations with filters
     */
    Page<QuotationResponse> searchQuotations(
            Quotation.QuotationStatus status,
            UUID leadId,
            String search,
            Pageable pageable
    );

    /**
     * Update quotation status
     */
    QuotationResponse updateQuotationStatus(UUID id, QuotationStatusUpdateRequest request, UUID updatedBy);

    /**
     * Send quotation (update status to SENT and send email)
     */
    QuotationResponse sendQuotation(UUID id, UUID sentBy);

    /**
     * Generate PDF for quotation
     */
    byte[] generateQuotationPdf(UUID id);

    /**
     * Get quotation dashboard statistics
     */
    QuotationDashboardResponse getDashboardStatistics();

    /**
     * Convert lead to tenant (accepts quotation and prepares for tenant onboarding)
     */
    LeadConversionResponse convertLeadToTenant(UUID quotationId, UUID convertedBy);

    /**
     * Delete quotation
     */
    void deleteQuotation(UUID id);

    /**
     * SCP-2025-12-10: Mark quotation as CONVERTED after successful tenant onboarding.
     * This makes the quotation non-editable.
     *
     * @param quotationId The quotation ID to mark as converted
     * @param tenantId The ID of the newly created tenant
     */
    void markAsConverted(UUID quotationId, UUID tenantId);
}
