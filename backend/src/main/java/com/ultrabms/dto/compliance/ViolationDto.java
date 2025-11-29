package com.ultrabms.dto.compliance;

import com.ultrabms.entity.Violation;
import com.ultrabms.entity.enums.FineStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for violation detail view
 *
 * Story 7.3: Compliance and Inspection Tracking
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ViolationDto {

    private UUID id;
    private String violationNumber;
    private UUID complianceScheduleId;
    private String propertyName;
    private String requirementName;
    private LocalDate violationDate;
    private String description;
    private BigDecimal fineAmount;
    private FineStatus fineStatus;
    private UUID remediationWorkOrderId;
    private String remediationWorkOrderNumber;
    private LocalDate resolutionDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Schedule info
    private ComplianceScheduleListDto complianceSchedule;

    /**
     * Create DTO from entity
     */
    public static ViolationDto fromEntity(
            Violation entity,
            String propertyName,
            String requirementName,
            String workOrderNumber) {
        return ViolationDto.builder()
                .id(entity.getId())
                .violationNumber(entity.getViolationNumber())
                .complianceScheduleId(entity.getComplianceSchedule().getId())
                .propertyName(propertyName)
                .requirementName(requirementName)
                .violationDate(entity.getViolationDate())
                .description(entity.getDescription())
                .fineAmount(entity.getFineAmount())
                .fineStatus(entity.getFineStatus())
                .remediationWorkOrderId(entity.getRemediationWorkOrderId())
                .remediationWorkOrderNumber(workOrderNumber)
                .resolutionDate(entity.getResolutionDate())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
