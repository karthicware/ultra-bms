package com.ultrabms.mapper;

import com.ultrabms.dto.documents.DocumentDto;
import com.ultrabms.dto.documents.DocumentListDto;
import com.ultrabms.dto.documents.DocumentUploadDto;
import com.ultrabms.dto.documents.DocumentVersionDto;
import com.ultrabms.dto.documents.ExpiringDocumentDto;
import com.ultrabms.entity.Document;
import com.ultrabms.entity.DocumentVersion;
import com.ultrabms.entity.User;
import com.ultrabms.entity.enums.DocumentEntityType;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Mapper utility for converting between Document entity and DTOs.
 * Manual mapping implementation following project patterns.
 *
 * Story 7.2: Document Management System
 */
@Component
public class DocumentMapper {

    /**
     * Create Document entity from upload DTO, file metadata, and S3 path
     *
     * @param dto            Upload DTO
     * @param documentNumber Generated document number
     * @param file           Uploaded file (for metadata)
     * @param filePath       S3 file path
     * @param uploadedBy     User who uploaded
     * @return Document entity (not yet persisted)
     */
    public Document toEntity(
            DocumentUploadDto dto,
            String documentNumber,
            MultipartFile file,
            String filePath,
            User uploadedBy) {

        if (dto == null || file == null || uploadedBy == null) {
            return null;
        }

        return Document.builder()
                .documentNumber(documentNumber)
                .documentType(dto.getDocumentType())
                .title(dto.getTitle())
                .description(dto.getDescription())
                .fileName(file.getOriginalFilename())
                .filePath(filePath)
                .fileSize(file.getSize())
                .fileType(file.getContentType())
                .entityType(dto.getEntityType())
                .entityId(dto.getEntityId())
                .expiryDate(dto.getExpiryDate())
                .tags(dto.getTags() != null ? dto.getTags() : new ArrayList<>())
                .accessLevel(dto.getAccessLevel())
                .versionNumber(1)
                .uploadedBy(uploadedBy)
                .uploadedAt(LocalDateTime.now())
                .isDeleted(false)
                .expiryNotificationSent(false)
                .build();
    }

    /**
     * Convert Document entity to full DTO
     *
     * @param entity     Document entity
     * @param entityName Resolved entity name (property/tenant/vendor/asset name)
     * @return DocumentDto
     */
    public DocumentDto toDto(Document entity, String entityName) {
        if (entity == null) {
            return null;
        }

        return DocumentDto.builder()
                .id(entity.getId())
                .documentNumber(entity.getDocumentNumber())
                .documentType(entity.getDocumentType())
                .title(entity.getTitle())
                .description(entity.getDescription())
                .fileName(entity.getFileName())
                .filePath(entity.getFilePath())
                .fileSize(entity.getFileSize())
                .fileType(entity.getFileType())
                .entityType(entity.getEntityType())
                .entityId(entity.getEntityId())
                .entityName(entityName)
                .expiryDate(entity.getExpiryDate())
                .expiryStatus(entity.getExpiryStatus())
                .daysUntilExpiry(entity.getDaysUntilExpiry())
                .tags(entity.getTags())
                .accessLevel(entity.getAccessLevel())
                .versionNumber(entity.getVersionNumber())
                .uploadedBy(entity.getUploadedBy() != null ? entity.getUploadedBy().getId() : null)
                .uploaderName(entity.getUploadedBy() != null ? entity.getUploadedBy().getFirstName() + " " + entity.getUploadedBy().getLastName() : null)
                .uploadedAt(entity.getUploadedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    /**
     * Convert Document entity to full DTO with download/preview URLs
     *
     * @param entity      Document entity
     * @param entityName  Resolved entity name
     * @param downloadUrl Presigned S3 download URL
     * @param previewUrl  Presigned S3 preview URL
     * @return DocumentDto with URLs
     */
    public DocumentDto toDtoWithUrls(
            Document entity,
            String entityName,
            String downloadUrl,
            String previewUrl) {

        DocumentDto dto = toDto(entity, entityName);
        if (dto != null) {
            dto.setDownloadUrl(downloadUrl);
            dto.setPreviewUrl(previewUrl);
        }
        return dto;
    }

    /**
     * Convert Document entity to list DTO (summary)
     *
     * @param entity     Document entity
     * @param entityName Resolved entity name
     * @return DocumentListDto
     */
    public DocumentListDto toListDto(Document entity, String entityName) {
        if (entity == null) {
            return null;
        }

        return DocumentListDto.builder()
                .id(entity.getId())
                .documentNumber(entity.getDocumentNumber())
                .title(entity.getTitle())
                .documentType(entity.getDocumentType())
                .entityType(entity.getEntityType())
                .entityId(entity.getEntityId())
                .entityName(entityName)
                .fileName(entity.getFileName())
                .fileSize(entity.getFileSize())
                .fileType(entity.getFileType())
                .expiryDate(entity.getExpiryDate())
                .expiryStatus(entity.getExpiryStatus())
                .daysUntilExpiry(entity.getDaysUntilExpiry())
                .accessLevel(entity.getAccessLevel())
                .versionNumber(entity.getVersionNumber())
                .uploadedAt(entity.getUploadedAt())
                .build();
    }

    /**
     * Convert Document entity to expiring document DTO
     *
     * @param entity     Document entity
     * @param entityName Resolved entity name
     * @return ExpiringDocumentDto
     */
    public ExpiringDocumentDto toExpiringDto(Document entity, String entityName) {
        if (entity == null) {
            return null;
        }

        return ExpiringDocumentDto.builder()
                .id(entity.getId())
                .documentNumber(entity.getDocumentNumber())
                .title(entity.getTitle())
                .documentType(entity.getDocumentType())
                .entityType(entity.getEntityType())
                .entityId(entity.getEntityId())
                .entityName(entityName)
                .expiryDate(entity.getExpiryDate())
                .daysUntilExpiry(entity.getDaysUntilExpiry())
                .accessLevel(entity.getAccessLevel())
                .build();
    }

    /**
     * Convert DocumentVersion entity to DTO
     *
     * @param version DocumentVersion entity
     * @return DocumentVersionDto
     */
    public DocumentVersionDto toVersionDto(DocumentVersion version) {
        if (version == null) {
            return null;
        }

        return DocumentVersionDto.builder()
                .id(version.getId())
                .documentId(version.getDocument() != null ? version.getDocument().getId() : null)
                .versionNumber(version.getVersionNumber())
                .fileName(version.getFileName())
                .filePath(version.getFilePath())
                .fileSize(version.getFileSize())
                .uploadedBy(version.getUploadedBy() != null ? version.getUploadedBy().getId() : null)
                .uploaderName(version.getUploadedBy() != null ? version.getUploadedBy().getFirstName() + " " + version.getUploadedBy().getLastName() : null)
                .uploadedAt(version.getUploadedAt())
                .notes(version.getNotes())
                .build();
    }

    /**
     * Convert DocumentVersion entity to DTO with download URL
     *
     * @param version     DocumentVersion entity
     * @param downloadUrl Presigned S3 download URL
     * @return DocumentVersionDto with URL
     */
    public DocumentVersionDto toVersionDtoWithUrl(DocumentVersion version, String downloadUrl) {
        DocumentVersionDto dto = toVersionDto(version);
        if (dto != null) {
            dto.setDownloadUrl(downloadUrl);
        }
        return dto;
    }

    /**
     * Convert list of DocumentVersion entities to DTOs
     *
     * @param versions List of DocumentVersion entities
     * @return List of DocumentVersionDto
     */
    public List<DocumentVersionDto> toVersionDtoList(List<DocumentVersion> versions) {
        if (versions == null) {
            return new ArrayList<>();
        }

        return versions.stream()
                .map(this::toVersionDto)
                .toList();
    }

    /**
     * Create DocumentVersion entity from document file replacement
     *
     * @param document     Parent document
     * @param filePath     S3 file path for archived version
     * @param notes        Optional notes
     * @param uploadedBy   User who uploaded
     * @return DocumentVersion entity (not yet persisted)
     */
    public DocumentVersion toVersionEntity(
            Document document,
            String filePath,
            String notes,
            User uploadedBy) {

        if (document == null) {
            return null;
        }

        return DocumentVersion.builder()
                .document(document)
                .versionNumber(document.getVersionNumber())
                .fileName(document.getFileName())
                .filePath(filePath)
                .fileSize(document.getFileSize())
                .uploadedBy(uploadedBy)
                .uploadedAt(LocalDateTime.now())
                .notes(notes)
                .build();
    }

    /**
     * Validate that entityId is provided when required by entityType
     *
     * @param dto Upload DTO
     * @return true if valid, false if entityId is required but missing
     */
    public boolean isEntityIdValid(DocumentUploadDto dto) {
        if (dto == null) {
            return false;
        }

        DocumentEntityType entityType = dto.getEntityType();
        if (entityType != null && entityType.requiresEntityId()) {
            return dto.getEntityId() != null;
        }

        return true;
    }
}
