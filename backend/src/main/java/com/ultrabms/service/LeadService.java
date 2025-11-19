package com.ultrabms.service;

import com.ultrabms.dto.leads.CreateLeadRequest;
import com.ultrabms.dto.leads.LeadDocumentResponse;
import com.ultrabms.dto.leads.LeadHistoryResponse;
import com.ultrabms.dto.leads.LeadResponse;
import com.ultrabms.dto.leads.UpdateLeadRequest;
import com.ultrabms.entity.Lead;
import com.ultrabms.entity.LeadDocument;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

/**
 * Service interface for Lead management
 */
public interface LeadService {

    /**
     * Create a new lead
     */
    LeadResponse createLead(CreateLeadRequest request, UUID createdBy);

    /**
     * Get lead by ID
     */
    LeadResponse getLeadById(UUID id);

    /**
     * Update existing lead
     */
    LeadResponse updateLead(UUID id, UpdateLeadRequest request);

    /**
     * Search leads with filters
     */
    Page<LeadResponse> searchLeads(
            Lead.LeadStatus status,
            Lead.LeadSource source,
            String search,
            Pageable pageable
    );

    /**
     * Update lead status
     */
    LeadResponse updateLeadStatus(UUID id, Lead.LeadStatus status, UUID updatedBy);

    /**
     * Upload document for lead
     */
    LeadDocumentResponse uploadDocument(
            UUID leadId,
            MultipartFile file,
            LeadDocument.DocumentType documentType,
            UUID uploadedBy
    );

    /**
     * Get all documents for a lead
     */
    List<LeadDocumentResponse> getLeadDocuments(UUID leadId);

    /**
     * Download document
     */
    byte[] downloadDocument(UUID documentId);

    /**
     * Delete document
     */
    void deleteDocument(UUID documentId);

    /**
     * Get lead history
     */
    Page<LeadHistoryResponse> getLeadHistory(UUID leadId, Pageable pageable);

    /**
     * Delete lead
     */
    void deleteLead(UUID id);
}
