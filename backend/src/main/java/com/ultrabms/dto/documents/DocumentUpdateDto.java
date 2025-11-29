package com.ultrabms.dto.documents;

import com.ultrabms.entity.enums.DocumentAccessLevel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

/**
 * DTO for document metadata update request
 * Used in PUT /api/v1/documents/{id}
 * Cannot change: documentNumber, entityType, entityId, file
 *
 * Story 7.2: Document Management System
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentUpdateDto {

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
     * Document type (required)
     */
    @NotBlank(message = "Document type is required")
    @Size(max = 100, message = "Document type must be less than 100 characters")
    private String documentType;

    /**
     * Document expiry date (optional)
     */
    private LocalDate expiryDate;

    /**
     * Tags for categorization (optional)
     */
    private List<String> tags;

    /**
     * Access level (required)
     */
    @NotNull(message = "Access level is required")
    private DocumentAccessLevel accessLevel;
}
