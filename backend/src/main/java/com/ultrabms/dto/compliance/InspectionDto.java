package com.ultrabms.dto.compliance;

import com.ultrabms.entity.Inspection;
import com.ultrabms.entity.enums.InspectionResult;
import com.ultrabms.entity.enums.InspectionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for inspection detail view
 *
 * Story 7.3: Compliance and Inspection Tracking
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InspectionDto {

    private UUID id;
    private UUID complianceScheduleId;
    private UUID propertyId;
    private String propertyName;
    private UUID requirementId;
    private String requirementName;
    private String requirementNumber;
    private String inspectorName;
    private String inspectorCompany;
    private String inspectorContact;
    private LocalDate scheduledDate;
    private LocalDate inspectionDate;
    private InspectionStatus status;
    private InspectionResult result;
    private String issuesFound;
    private String recommendations;
    private String notes;
    private String certificatePath;
    private LocalDate nextInspectionDate;
    private UUID remediationWorkOrderId;
    private String remediationWorkOrderNumber;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Schedule info
    private ComplianceScheduleListDto complianceSchedule;

    /**
     * Create DTO from entity
     */
    public static InspectionDto fromEntity(
            Inspection entity,
            String propertyName,
            String requirementName,
            String requirementNumber,
            String workOrderNumber) {
        return InspectionDto.builder()
                .id(entity.getId())
                .complianceScheduleId(entity.getComplianceSchedule().getId())
                .propertyId(entity.getProperty().getId())
                .propertyName(propertyName)
                .requirementName(requirementName)
                .requirementNumber(requirementNumber)
                .inspectorName(entity.getInspectorName())
                .scheduledDate(entity.getScheduledDate())
                .inspectionDate(entity.getInspectionDate())
                .status(entity.getStatus())
                .result(entity.getResult())
                .issuesFound(entity.getIssuesFound())
                .recommendations(entity.getRecommendations())
                .certificatePath(entity.getCertificatePath())
                .nextInspectionDate(entity.getNextInspectionDate())
                .remediationWorkOrderId(entity.getRemediationWorkOrderId())
                .remediationWorkOrderNumber(workOrderNumber)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
