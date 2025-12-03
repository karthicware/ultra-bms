package com.ultrabms.dto.properties;

import com.ultrabms.entity.PropertyImage;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for PropertyImage response
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PropertyImageResponse {

    private UUID id;
    private UUID propertyId;
    private String fileName;
    private String filePath;
    private Long fileSize;
    private Integer displayOrder;
    private UUID uploadedBy;
    private LocalDateTime uploadedAt;

    /**
     * Convert PropertyImage entity to PropertyImageResponse DTO
     * Note: filePath will contain S3 key - use fromEntityWithUrl for public URLs
     */
    public static PropertyImageResponse fromEntity(PropertyImage image) {
        return PropertyImageResponse.builder()
                .id(image.getId())
                .propertyId(image.getProperty().getId())
                .fileName(image.getFileName())
                .filePath(image.getFilePath())
                .fileSize(image.getFileSize())
                .displayOrder(image.getDisplayOrder())
                .uploadedBy(image.getUploadedBy() != null ? image.getUploadedBy().getId() : null)
                .uploadedAt(image.getCreatedAt())
                .build();
    }

    /**
     * Convert PropertyImage entity to PropertyImageResponse DTO with presigned URL
     * @param image the PropertyImage entity
     * @param presignedUrl the presigned S3 URL for accessing the image
     */
    public static PropertyImageResponse fromEntityWithUrl(PropertyImage image, String presignedUrl) {
        return PropertyImageResponse.builder()
                .id(image.getId())
                .propertyId(image.getProperty().getId())
                .fileName(image.getFileName())
                .filePath(presignedUrl)  // Use presigned URL instead of S3 key
                .fileSize(image.getFileSize())
                .displayOrder(image.getDisplayOrder())
                .uploadedBy(image.getUploadedBy() != null ? image.getUploadedBy().getId() : null)
                .uploadedAt(image.getCreatedAt())
                .build();
    }
}
