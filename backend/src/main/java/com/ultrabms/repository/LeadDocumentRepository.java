package com.ultrabms.repository;

import com.ultrabms.entity.LeadDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository interface for LeadDocument entity
 */
@Repository
public interface LeadDocumentRepository extends JpaRepository<LeadDocument, UUID> {

    /**
     * Find all documents for a lead
     */
    List<LeadDocument> findByLeadIdOrderByUploadedAtDesc(UUID leadId);

    /**
     * Find documents by lead and type
     */
    List<LeadDocument> findByLeadIdAndDocumentType(
            UUID leadId,
            LeadDocument.DocumentType documentType
    );

    /**
     * Count documents for a lead
     */
    long countByLeadId(UUID leadId);

    /**
     * Delete all documents for a lead
     */
    void deleteByLeadId(UUID leadId);
}
