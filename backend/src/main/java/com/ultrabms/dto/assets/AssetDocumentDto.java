package com.ultrabms.dto.assets;

import com.ultrabms.entity.enums.AssetDocumentType;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Asset document DTO.
 *
 * Story 7.1: Asset Registry and Tracking
 * AC #5: AssetDocument entity with documentType enum
 */
public record AssetDocumentDto(
        UUID id,
        UUID assetId,
        AssetDocumentType documentType,
        String documentTypeDisplayName,
        String fileName,
        String filePath,
        Long fileSize,
        String formattedFileSize,
        String contentType,
        UUID uploadedBy,
        String uploadedByName,
        LocalDateTime uploadedAt,
        String downloadUrl
) {}
