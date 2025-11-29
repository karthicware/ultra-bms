package com.ultrabms.dto.compliance;

import com.ultrabms.entity.Inspection;
import com.ultrabms.entity.enums.InspectionResult;
import com.ultrabms.entity.enums.InspectionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

/**
 * DTO for inspection list view
 *
 * Story 7.3: Compliance and Inspection Tracking
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InspectionListDto {

    private UUID id;
    private UUID complianceScheduleId;
    private String propertyName;
    private String requirementName;
    private String inspectorName;
    private LocalDate scheduledDate;
    private LocalDate inspectionDate;
    private InspectionStatus status;
    private InspectionResult result;

    /**
     * Create DTO from entity
     */
    public static InspectionListDto fromEntity(
            Inspection entity,
            String propertyName,
            String requirementName) {
        return InspectionListDto.builder()
                .id(entity.getId())
                .complianceScheduleId(entity.getComplianceSchedule().getId())
                .propertyName(propertyName)
                .requirementName(requirementName)
                .inspectorName(entity.getInspectorName())
                .scheduledDate(entity.getScheduledDate())
                .inspectionDate(entity.getInspectionDate())
                .status(entity.getStatus())
                .result(entity.getResult())
                .build();
    }
}
