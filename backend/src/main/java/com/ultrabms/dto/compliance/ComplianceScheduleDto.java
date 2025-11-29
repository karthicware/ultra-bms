package com.ultrabms.dto.compliance;

import com.ultrabms.entity.ComplianceSchedule;
import com.ultrabms.entity.enums.ComplianceCategory;
import com.ultrabms.entity.enums.ComplianceFrequency;
import com.ultrabms.entity.enums.ComplianceScheduleStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * DTO for compliance schedule detail view
 *
 * Story 7.3: Compliance and Inspection Tracking
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComplianceScheduleDto {

    private UUID id;
    private UUID complianceRequirementId;
    private String requirementNumber;
    private String requirementName;
    private ComplianceCategory category;
    private ComplianceFrequency frequency;
    private UUID propertyId;
    private String propertyName;
    private LocalDate dueDate;
    private ComplianceScheduleStatus status;
    private LocalDate completedDate;
    private UUID completedBy;
    private String completedByName;
    private String notes;
    private String certificateFilePath;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Related items
    private List<InspectionListDto> inspections;
    private List<ViolationListDto> violations;

    /**
     * Create DTO from entity
     */
    public static ComplianceScheduleDto fromEntity(
            ComplianceSchedule entity,
            String propertyName,
            String completedByName) {
        return ComplianceScheduleDto.builder()
                .id(entity.getId())
                .complianceRequirementId(entity.getComplianceRequirement().getId())
                .requirementNumber(entity.getComplianceRequirement().getRequirementNumber())
                .requirementName(entity.getComplianceRequirement().getRequirementName())
                .category(entity.getComplianceRequirement().getCategory())
                .frequency(entity.getComplianceRequirement().getFrequency())
                .propertyId(entity.getProperty().getId())
                .propertyName(propertyName)
                .dueDate(entity.getDueDate())
                .status(entity.getStatus())
                .completedDate(entity.getCompletedDate())
                .completedBy(entity.getCompletedBy())
                .completedByName(completedByName)
                .notes(entity.getNotes())
                .certificateFilePath(entity.getCertificateFilePath())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
