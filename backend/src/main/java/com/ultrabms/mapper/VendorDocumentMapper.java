package com.ultrabms.mapper;

import com.ultrabms.dto.vendordocuments.ExpiringDocumentDto;
import com.ultrabms.dto.vendordocuments.VendorDocumentDto;
import com.ultrabms.dto.vendordocuments.VendorDocumentListDto;
import com.ultrabms.dto.vendordocuments.VendorDocumentUploadDto;
import com.ultrabms.entity.Vendor;
import com.ultrabms.entity.VendorDocument;
import com.ultrabms.entity.enums.VendorDocumentType;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Mapper utility for converting between VendorDocument entity and DTOs.
 * Manual mapping implementation following project patterns.
 *
 * Story 5.2: Vendor Document and License Management
 */
@Component
public class VendorDocumentMapper {

    /**
     * Create VendorDocument entity from upload DTO, file metadata, and S3 path
     *
     * @param dto        Upload DTO
     * @param vendor     Parent vendor entity
     * @param file       Uploaded file (for metadata)
     * @param filePath   S3 file path
     * @param uploadedBy User ID who uploaded
     * @return VendorDocument entity (not yet persisted)
     */
    public VendorDocument toEntity(
            VendorDocumentUploadDto dto,
            Vendor vendor,
            MultipartFile file,
            String filePath,
            UUID uploadedBy) {

        if (dto == null || vendor == null || file == null) {
            return null;
        }

        return VendorDocument.builder()
                .vendor(vendor)
                .documentType(dto.getDocumentType())
                .fileName(file.getOriginalFilename())
                .filePath(filePath)
                .fileSize(file.getSize())
                .fileType(file.getContentType())
                .expiryDate(dto.getExpiryDate())
                .notes(dto.getNotes())
                .uploadedBy(uploadedBy)
                .uploadedAt(LocalDateTime.now())
                .isDeleted(false)
                .expiryNotification30Sent(false)
                .expiryNotification15Sent(false)
                .build();
    }

    /**
     * Update existing VendorDocument entity with new upload data
     * Used for document replacement
     *
     * @param entity   Existing entity to update
     * @param file     New file (for metadata)
     * @param filePath New S3 file path
     * @param dto      Upload DTO with optional new expiry/notes
     */
    public void updateEntity(
            VendorDocument entity,
            MultipartFile file,
            String filePath,
            VendorDocumentUploadDto dto) {

        if (entity == null || file == null) {
            return;
        }

        entity.setFileName(file.getOriginalFilename());
        entity.setFilePath(filePath);
        entity.setFileSize(file.getSize());
        entity.setFileType(file.getContentType());
        entity.setUploadedAt(LocalDateTime.now());

        // Update expiry and notes if provided
        if (dto != null) {
            if (dto.getExpiryDate() != null) {
                entity.setExpiryDate(dto.getExpiryDate());
                // Reset notification flags when expiry date changes
                entity.setExpiryNotification30Sent(false);
                entity.setExpiryNotification15Sent(false);
            }
            if (dto.getNotes() != null) {
                entity.setNotes(dto.getNotes());
            }
        }
    }

    /**
     * Convert VendorDocument entity to full DTO
     *
     * @param entity VendorDocument entity
     * @return VendorDocumentDto
     */
    public VendorDocumentDto toDto(VendorDocument entity) {
        if (entity == null) {
            return null;
        }

        return VendorDocumentDto.builder()
                .id(entity.getId())
                .vendorId(entity.getVendor().getId())
                .documentType(entity.getDocumentType())
                .fileName(entity.getFileName())
                .filePath(entity.getFilePath())
                .fileSize(entity.getFileSize())
                .fileType(entity.getFileType())
                .expiryDate(entity.getExpiryDate())
                .expiryStatus(entity.getExpiryStatus())
                .daysUntilExpiry(entity.getDaysUntilExpiry())
                .notes(entity.getNotes())
                .uploadedBy(entity.getUploadedBy())
                .uploadedAt(entity.getUploadedAt())
                .build();
    }

    /**
     * Convert VendorDocument entity to full DTO with download URL
     *
     * @param entity      VendorDocument entity
     * @param downloadUrl Presigned S3 download URL
     * @return VendorDocumentDto with download URL
     */
    public VendorDocumentDto toDtoWithDownloadUrl(VendorDocument entity, String downloadUrl) {
        VendorDocumentDto dto = toDto(entity);
        if (dto != null) {
            dto.setDownloadUrl(downloadUrl);
        }
        return dto;
    }

    /**
     * Convert VendorDocument entity to list DTO (summary)
     *
     * @param entity VendorDocument entity
     * @return VendorDocumentListDto
     */
    public VendorDocumentListDto toListDto(VendorDocument entity) {
        if (entity == null) {
            return null;
        }

        return VendorDocumentListDto.builder()
                .id(entity.getId())
                .documentType(entity.getDocumentType())
                .fileName(entity.getFileName())
                .fileSize(entity.getFileSize())
                .expiryDate(entity.getExpiryDate())
                .expiryStatus(entity.getExpiryStatus())
                .daysUntilExpiry(entity.getDaysUntilExpiry())
                .uploadedAt(entity.getUploadedAt())
                .build();
    }

    /**
     * Convert list of VendorDocument entities to list DTOs
     *
     * @param entities List of VendorDocument entities
     * @return List of VendorDocumentListDto
     */
    public List<VendorDocumentListDto> toListDtoList(List<VendorDocument> entities) {
        if (entities == null) {
            return new ArrayList<>();
        }

        return entities.stream()
                .map(this::toListDto)
                .toList();
    }

    /**
     * Convert VendorDocument entity to expiring document DTO
     * Includes vendor information for dashboard context
     *
     * @param entity VendorDocument entity (with vendor fetched)
     * @return ExpiringDocumentDto
     */
    public ExpiringDocumentDto toExpiringDto(VendorDocument entity) {
        if (entity == null || entity.getVendor() == null) {
            return null;
        }

        Vendor vendor = entity.getVendor();

        return ExpiringDocumentDto.builder()
                .id(entity.getId())
                .vendorId(vendor.getId())
                .vendorNumber(vendor.getVendorNumber())
                .companyName(vendor.getCompanyName())
                .documentType(entity.getDocumentType())
                .fileName(entity.getFileName())
                .expiryDate(entity.getExpiryDate())
                .daysUntilExpiry(entity.getDaysUntilExpiry())
                .isCritical(entity.isCriticalDocument())
                .build();
    }

    /**
     * Convert list of VendorDocument entities to expiring document DTOs
     *
     * @param entities List of VendorDocument entities
     * @return List of ExpiringDocumentDto
     */
    public List<ExpiringDocumentDto> toExpiringDtoList(List<VendorDocument> entities) {
        if (entities == null) {
            return new ArrayList<>();
        }

        return entities.stream()
                .map(this::toExpiringDto)
                .toList();
    }

    /**
     * Validate that expiry date is provided for document types that require it
     *
     * @param dto Upload DTO
     * @return true if valid, false if expiry date is required but missing
     */
    public boolean isExpiryDateValid(VendorDocumentUploadDto dto) {
        if (dto == null) {
            return false;
        }

        VendorDocumentType type = dto.getDocumentType();
        if (type != null && type.requiresExpiryDate()) {
            return dto.getExpiryDate() != null;
        }

        return true;
    }
}
