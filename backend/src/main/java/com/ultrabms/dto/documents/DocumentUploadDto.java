package com.ultrabms.dto.documents;

import com.ultrabms.entity.enums.DocumentAccessLevel;
import com.ultrabms.entity.enums.DocumentEntityType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * DTO for document upload request
 * Used in POST /api/v1/documents
 *
 * Story 7.2: Document Management System
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentUploadDto {

    /**
     * Document type (required)
     */
    @NotBlank(message = "Document type is required")
    @Size(max = 100, message = "Document type must be less than 100 characters")
    private String documentType;

    /**
     * Document title (required)
     */
    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title must be less than 200 characters")
    private String title;

    /**
     * Optional description
     */
    @Size(max = 500, message = "Description must be less than 500 characters")
    private String description;

    /**
     * Entity type (required)
     */
    @NotNull(message = "Entity type is required")
    private DocumentEntityType entityType;

    /**
     * Entity UUID (required for non-GENERAL entity types)
     */
    private UUID entityId;

    /**
     * Document expiry date (optional)
     */
    private LocalDate expiryDate;

    /**
     * Tags for categorization (optional)
     */
    private List<String> tags;

    /**
     * Access level (defaults to PUBLIC if not specified)
     */
    @Builder.Default
    private DocumentAccessLevel accessLevel = DocumentAccessLevel.PUBLIC;
}
