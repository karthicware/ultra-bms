package com.ultrabms.repository;

import com.ultrabms.entity.DocumentVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for DocumentVersion entity.
 * Provides CRUD operations and custom queries for document version management.
 *
 * Story 7.2: Document Management System
 */
@Repository
public interface DocumentVersionRepository extends JpaRepository<DocumentVersion, UUID> {

    // =================================================================
    // FIND BY DOCUMENT
    // =================================================================

    /**
     * Find all versions for a document, ordered by version number descending (newest first)
     *
     * @param documentId Document UUID
     * @return List of versions
     */
    List<DocumentVersion> findByDocumentIdOrderByVersionNumberDesc(UUID documentId);

    /**
     * Find all versions for a document with uploader info, ordered by version number descending
     *
     * @param documentId Document UUID
     * @return List of versions with uploader
     */
    @Query("SELECT v FROM DocumentVersion v LEFT JOIN FETCH v.uploadedBy u " +
            "WHERE v.document.id = :documentId " +
            "ORDER BY v.versionNumber DESC")
    List<DocumentVersion> findByDocumentIdWithUploader(@Param("documentId") UUID documentId);

    /**
     * Find specific version by document ID and version number
     *
     * @param documentId    Document UUID
     * @param versionNumber Version number
     * @return Optional version
     */
    Optional<DocumentVersion> findByDocumentIdAndVersionNumber(UUID documentId, Integer versionNumber);

    /**
     * Find latest archived version for a document
     *
     * @param documentId Document UUID
     * @return Optional latest version
     */
    @Query("SELECT v FROM DocumentVersion v " +
            "WHERE v.document.id = :documentId " +
            "ORDER BY v.versionNumber DESC LIMIT 1")
    Optional<DocumentVersion> findLatestVersionByDocumentId(@Param("documentId") UUID documentId);

    // =================================================================
    // COUNT QUERIES
    // =================================================================

    /**
     * Count versions for a document
     *
     * @param documentId Document UUID
     * @return Version count
     */
    long countByDocumentId(UUID documentId);

    // =================================================================
    // DELETE OPERATIONS
    // =================================================================

    /**
     * Delete all versions for a document (used when hard-deleting document)
     * Note: Soft delete at document level handles version retention for audit
     *
     * @param documentId Document UUID
     */
    void deleteByDocumentId(UUID documentId);
}
