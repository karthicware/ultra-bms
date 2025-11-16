package com.ultrabms.repository;

import com.ultrabms.entity.TenantDocument;
import com.ultrabms.entity.enums.DocumentType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for TenantDocument entity.
 * Provides CRUD operations for tenant documents.
 */
@Repository
public interface TenantDocumentRepository extends JpaRepository<TenantDocument, UUID> {

    /**
     * Find all documents for a specific tenant
     *
     * @param tenantId Tenant UUID
     * @return List of documents
     */
    List<TenantDocument> findByTenantId(UUID tenantId);

    /**
     * Find document by tenant and document type
     *
     * @param tenantId Tenant UUID
     * @param documentType Document type
     * @return Optional document
     */
    Optional<TenantDocument> findByTenantIdAndDocumentType(UUID tenantId, DocumentType documentType);

    /**
     * Delete all documents for a tenant
     *
     * @param tenantId Tenant UUID
     */
    void deleteByTenantId(UUID tenantId);
}
