package com.ultrabms.repository;

import com.ultrabms.entity.AssetDocument;
import com.ultrabms.entity.enums.AssetDocumentType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for AssetDocument entity.
 * Provides CRUD operations for asset documents.
 *
 * Story 7.1: Asset Registry and Tracking
 * AC #5: AssetDocument entity
 */
@Repository
public interface AssetDocumentRepository extends JpaRepository<AssetDocument, UUID> {

    /**
     * Find all documents for an asset
     *
     * @param assetId Asset UUID
     * @return List of documents
     */
    List<AssetDocument> findByAssetIdOrderByUploadedAtDesc(UUID assetId);

    /**
     * Find documents by asset and type
     *
     * @param assetId      Asset UUID
     * @param documentType Document type
     * @return List of documents
     */
    List<AssetDocument> findByAssetIdAndDocumentType(UUID assetId, AssetDocumentType documentType);

    /**
     * Find document by ID and asset ID (for security validation)
     *
     * @param id      Document UUID
     * @param assetId Asset UUID
     * @return Optional document
     */
    Optional<AssetDocument> findByIdAndAssetId(UUID id, UUID assetId);

    /**
     * Count documents for an asset
     *
     * @param assetId Asset UUID
     * @return Count of documents
     */
    long countByAssetId(UUID assetId);

    /**
     * Delete all documents for an asset
     *
     * @param assetId Asset UUID
     */
    void deleteByAssetId(UUID assetId);

    /**
     * Get file paths for all documents of an asset (for S3 cleanup)
     *
     * @param assetId Asset UUID
     * @return List of file paths
     */
    @Query("SELECT d.filePath FROM AssetDocument d WHERE d.assetId = :assetId")
    List<String> findFilePathsByAssetId(@Param("assetId") UUID assetId);
}
