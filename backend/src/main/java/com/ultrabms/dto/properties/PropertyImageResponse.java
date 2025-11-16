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
}
