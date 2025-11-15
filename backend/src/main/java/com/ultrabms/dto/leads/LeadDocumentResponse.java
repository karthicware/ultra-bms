package com.ultrabms.dto.leads;

import com.ultrabms.entity.LeadDocument;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for LeadDocument response
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeadDocumentResponse {

    private UUID id;
    private UUID leadId;
    private LeadDocument.DocumentType documentType;
    private String fileName;
    private String filePath;
    private Long fileSize;
    private UUID uploadedBy;
    private LocalDateTime uploadedAt;

    /**
     * Convert LeadDocument entity to LeadDocumentResponse DTO
     */
    public static LeadDocumentResponse fromEntity(LeadDocument document) {
        return LeadDocumentResponse.builder()
                .id(document.getId())
                .leadId(document.getLeadId())
                .documentType(document.getDocumentType())
                .fileName(document.getFileName())
                .filePath(document.getFilePath())
                .fileSize(document.getFileSize())
                .uploadedBy(document.getUploadedBy())
                .uploadedAt(document.getUploadedAt())
                .build();
    }
}
