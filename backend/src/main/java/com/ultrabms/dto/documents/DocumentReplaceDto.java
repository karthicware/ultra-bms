package com.ultrabms.dto.documents;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for document file replacement request
 * Used in POST /api/v1/documents/{id}/replace
 *
 * Story 7.2: Document Management System
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentReplaceDto {

    /**
     * Optional notes explaining the version change
     */
    @Size(max = 500, message = "Notes must be less than 500 characters")
    private String notes;
}
