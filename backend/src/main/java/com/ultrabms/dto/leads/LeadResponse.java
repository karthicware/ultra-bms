package com.ultrabms.dto.leads;

import com.ultrabms.entity.Lead;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for Lead response
 * SCP-2025-12-06: Identity documents (Emirates ID, passport) are now collected during quotation workflow
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeadResponse {

    private UUID id;
    private String leadNumber;
    private String fullName;
    private String email;
    private String contactNumber;
    private Lead.LeadSource leadSource;
    private String notes;
    private Lead.LeadStatus status;
    private String propertyInterest;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private UUID createdBy;

    /**
     * Convert Lead entity to LeadResponse DTO
     */
    public static LeadResponse fromEntity(Lead lead) {
        return LeadResponse.builder()
                .id(lead.getId())
                .leadNumber(lead.getLeadNumber())
                .fullName(lead.getFullName())
                .email(lead.getEmail())
                .contactNumber(lead.getContactNumber())
                .leadSource(lead.getLeadSource())
                .notes(lead.getNotes())
                .status(lead.getStatus())
                .propertyInterest(lead.getPropertyInterest())
                .createdAt(lead.getCreatedAt())
                .updatedAt(lead.getUpdatedAt())
                .createdBy(lead.getCreatedBy())
                .build();
    }
}
