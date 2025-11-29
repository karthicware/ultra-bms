package com.ultrabms.dto.documents;

import com.ultrabms.entity.enums.DocumentAccessLevel;
import com.ultrabms.entity.enums.DocumentEntityType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

/**
 * DTO for expiring document list response
 * Used in GET /api/v1/documents/expiring
 *
 * Story 7.2: Document Management System
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpiringDocumentDto {

    /**
     * Document UUID
     */
    private UUID id;

    /**
     * Unique document number (DOC-YYYY-NNNN)
     */
    private String documentNumber;

    /**
     * Document title
     */
    private String title;

    /**
     * Document type
     */
    private String documentType;

    /**
     * Entity type
     */
    private DocumentEntityType entityType;

    /**
     * Entity UUID
     */
    private UUID entityId;

    /**
     * Entity name (resolved from entity)
     */
    private String entityName;

    /**
     * Document expiry date
     */
    private LocalDate expiryDate;

    /**
     * Days until expiry (negative if expired)
     */
    private Long daysUntilExpiry;

    /**
     * Access level
     */
    private DocumentAccessLevel accessLevel;
}
