package com.ultrabms.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

/**
 * PropertyImage entity representing uploaded images for properties.
 * Images are stored externally (S3) with file paths stored in database.
 */
@Entity
@Table(
    name = "property_images",
    indexes = {
        @Index(name = "idx_property_images_property_id", columnList = "property_id"),
        @Index(name = "idx_property_images_display_order", columnList = "display_order")
    }
)
@Data
@Builder
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class PropertyImage extends BaseEntity {

    /**
     * Property this image belongs to
     */
    @NotNull(message = "Property cannot be null")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id", nullable = false)
    private Property property;

    /**
     * Original file name
     */
    @NotNull(message = "File name cannot be null")
    @Size(max = 255, message = "File name must not exceed 255 characters")
    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    /**
     * File storage path (S3 URL or file system path)
     */
    @NotNull(message = "File path cannot be null")
    @Size(max = 500, message = "File path must not exceed 500 characters")
    @Column(name = "file_path", nullable = false, length = 500)
    private String filePath;

    /**
     * File size in bytes
     */
    @NotNull(message = "File size cannot be null")
    @Min(value = 0, message = "File size cannot be negative")
    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    /**
     * Display order for sorting images (lower numbers displayed first)
     */
    @Builder.Default
    @Column(name = "display_order")
    private Integer displayOrder = 0;

    /**
     * User who uploaded this image
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by")
    private User uploadedBy;
}
