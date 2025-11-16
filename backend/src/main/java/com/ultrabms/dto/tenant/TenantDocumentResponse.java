package com.ultrabms.dto.tenant;

import com.ultrabms.entity.enums.DocumentType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for tenant document response
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantDocumentResponse {

    private UUID id;
    private UUID tenantId;
    private DocumentType documentType;
    private String fileName;
    private String filePath;
    private Long fileSize;
    private UUID uploadedBy;
    private LocalDateTime uploadedAt;
}
