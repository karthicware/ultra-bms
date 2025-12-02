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
import java.util.UUID;

/**
 * DTO for compliance schedule list view
 * Used in GET /api/v1/compliance-schedules
 *
 * Story 7.3: Compliance and Inspection Tracking
 * AC #17: GET /api/v1/compliance-schedules
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComplianceScheduleListDto {

    private UUID id;
    private String scheduleNumber;
    private UUID requirementId;
    private String requirementName;
    private String requirementNumber;
    private ComplianceCategory category;
    private ComplianceFrequency frequency;
    private UUID propertyId;
    private String propertyName;
    private LocalDate dueDate;
    private ComplianceScheduleStatus status;
    private LocalDate lastCompleted;

    /**
     * Create DTO from entity with required names
     */
    public static ComplianceScheduleListDto fromEntity(
            ComplianceSchedule entity,
            String propertyName) {
        return ComplianceScheduleListDto.builder()
                .id(entity.getId())
                .requirementName(entity.getComplianceRequirement().getRequirementName())
                .requirementNumber(entity.getComplianceRequirement().getRequirementNumber())
                .category(entity.getComplianceRequirement().getCategory())
                .propertyId(entity.getProperty().getId())
                .propertyName(propertyName)
                .dueDate(entity.getDueDate())
                .status(entity.getStatus())
                .lastCompleted(entity.getCompletedDate())
                .build();
    }
}
