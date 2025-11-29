package com.ultrabms.dto.compliance;

import com.ultrabms.entity.ComplianceRequirement;
import com.ultrabms.entity.enums.ComplianceCategory;
import com.ultrabms.entity.enums.ComplianceFrequency;
import com.ultrabms.entity.enums.RequirementStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * DTO for compliance requirement response
 * Used in GET responses for compliance requirements
 *
 * Story 7.3: Compliance and Inspection Tracking
 * AC #14, #15: GET endpoints
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComplianceRequirementDto {

    private UUID id;
    private String requirementNumber;
    private String requirementName;
    private ComplianceCategory category;
    private String description;
    private List<UUID> applicableProperties;
    private ComplianceFrequency frequency;
    private String authorityAgency;
    private String penaltyDescription;
    private RequirementStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Detail fields (populated for detail view)
    private List<String> applicablePropertyNames;
    private Long scheduleCount;
    private Long overdueCount;
    private LocalDate nextDueDate;
    private List<ComplianceScheduleListDto> upcomingSchedules;
    private Integer schedulesCreated;

    /**
     * Create DTO from entity (list view - minimal fields)
     */
    public static ComplianceRequirementDto fromEntity(ComplianceRequirement entity) {
        return ComplianceRequirementDto.builder()
                .id(entity.getId())
                .requirementNumber(entity.getRequirementNumber())
                .requirementName(entity.getRequirementName())
                .category(entity.getCategory())
                .description(entity.getDescription())
                .applicableProperties(entity.getApplicableProperties())
                .frequency(entity.getFrequency())
                .authorityAgency(entity.getAuthorityAgency())
                .penaltyDescription(entity.getPenaltyDescription())
                .status(entity.getStatus())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
